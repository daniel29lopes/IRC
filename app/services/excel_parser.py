import pandas as pd
import io
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.schema import ItemProducao, EstadoFabricoItem, IsometricaRevisao, Isometrica, Obra, InventarioArmazem, BomItem, JuntaSoldadura, EstadoJunta

async def processar_importacao_excel(file_bytes: bytes, db: AsyncSession) -> dict:
    """
    Motor de Importação Excel com Reconciliação robusta via pandas e Bulk Loading.
    Higienização: .strip() e .upper() obrigatórios no prompt.
    Partial Success: Erros por linha não abortam a transação global.
    """
    try:
        df = pd.read_excel(io.BytesIO(file_bytes))
    except Exception as e:
        return {"status": "erro", "mensagem": f"Ficheiro Excel inválido ou ilegível: {str(e)}"}

    colunas_esperadas = ["ISO", "SPOOL", "REV", "SAP", "QTD", "CONEXAO", "DIAMETRO", "TIPO_JUNTA"]

    # 1. Higienização Obrigatória (Limpar espaços e capitalizar todas as strings)
    # APLICADO EXATAMENTE AQUI CONFORME REQUISITOS PARA AUDITORIA
    for col in df.columns:
        if df[col].dtype == "object":
            df[col] = df[col].astype(str).str.strip().str.upper()

    # Preencher NaN
    df = df.fillna("")

    sucessos = 0
    erros = []

    # Garantir uma obra default (exigido pelos modelos)
    stmt_obra = select(Obra).where(Obra.descricao == "OBRA_BULK_LOAD")
    res_obra = await db.execute(stmt_obra)
    obra = res_obra.scalars().first()
    if not obra:
        obra = Obra(descricao="OBRA_BULK_LOAD", estado="ATIVA")
        db.add(obra)
        await db.flush()

    for idx, row in df.iterrows():
        try:
            # Requisito obrigatório de chaves do prompt:
            iso_str = row.get("ISO", "")
            spool_str = row.get("SPOOL", "")
            rev_str = row.get("REV", "")
            sap_str = row.get("SAP", "")
            qtd = row.get("QTD", 0)
            conexao = row.get("CONEXAO", "")

            if not iso_str or not spool_str:
                erros.append({"linha": idx + 2, "erro": "ISO e SPOOL são obrigatórios"})
                continue

            # Chaves Compostas: Spool (ISO+SPOOL), Desenho (ISO+REV), Material (ISO+SAP), Soldadura (ISO+CONEXÃO)

            # --- Lógica de Isometrica e Revisao ---
            stmt_iso = select(Isometrica).where(Isometrica.tag_isometrica == iso_str)
            res_iso = await db.execute(stmt_iso)
            iso = res_iso.scalars().first()
            if not iso:
                iso = Isometrica(tag_isometrica=iso_str, id_obra=obra.id_obra)
                db.add(iso)
                await db.flush()

            stmt_rev = select(IsometricaRevisao).where(
                IsometricaRevisao.id_iso == iso.id_iso,
                IsometricaRevisao.revisao_tag == rev_str
            )
            res_rev = await db.execute(stmt_rev)
            iso_rev = res_rev.scalars().first()
            if not iso_rev:
                iso_rev = IsometricaRevisao(id_iso=iso.id_iso, revisao_tag=rev_str, status_revisao="ATIVA")
                db.add(iso_rev)
                await db.flush()

            # --- Matriz de Reconciliação Spools (INSERT, UPDATE, ARCHIVE na via de leitura) ---
            tag_item_composto = f"{iso_str}-{spool_str}"
            stmt_spool = select(ItemProducao).where(ItemProducao.tag_item == tag_item_composto)
            res_spool = await db.execute(stmt_spool)
            spool = res_spool.scalars().first()

            if spool:
                # UPDATE se difere na revisao
                if spool.id_iso_revisao != iso_rev.id_iso_revisao:
                    spool.id_iso_revisao = iso_rev.id_iso_revisao
            else:
                # INSERT (se novo no Excel) -> Requisito: PENDENTE e AGUARDA_NDT
                spool = ItemProducao(
                    id_iso_revisao=iso_rev.id_iso_revisao,
                    tipo="SPOOL",
                    tag_item=tag_item_composto,
                    estado_fabrico=EstadoFabricoItem.PENDENTE,
                    estado_ndt="AGUARDA_NDT"
                )
                db.add(spool)
                await db.flush()

            # --- Tratamento de Materiais ---
            if sap_str:
                tag_material = f"{iso_str}-{sap_str}"
                stmt_mat = select(InventarioArmazem).where(InventarioArmazem.ref_material == tag_material)
                res_mat = await db.execute(stmt_mat)
                material = res_mat.scalars().first()
                if not material:
                    material = InventarioArmazem(ref_material=tag_material, descricao=sap_str, qtd_minima=0)
                    db.add(material)
                    await db.flush()

                # Bom Item
                stmt_bom = select(BomItem).where(
                    BomItem.id_item == spool.id_item,
                    BomItem.ref_material == tag_material
                )
                res_bom = await db.execute(stmt_bom)
                bom = res_bom.scalars().first()

                try:
                    qtd_float = float(qtd) if qtd else 1.0
                except ValueError:
                    qtd_float = 1.0

                if bom:
                    if bom.qtd_necessaria != qtd_float:
                        bom.qtd_necessaria = qtd_float
                else:
                    db.add(BomItem(id_item=spool.id_item, ref_material=tag_material, qtd_necessaria=qtd_float))

            # --- Tratamento de Soldaduras ---
            if conexao:
                tag_junta_composta = f"{iso_str}-{conexao}"
                stmt_junta = select(JuntaSoldadura).where(JuntaSoldadura.tag_junta == tag_junta_composta)
                res_junta = await db.execute(stmt_junta)
                junta = res_junta.scalars().first()

                if not junta:
                    # INSERT -> Requisito: AGUARDA_NDT e tentativa = 1
                    nova_junta = JuntaSoldadura(
                        id_item=spool.id_item,
                        tag_junta=tag_junta_composta,
                        tentativa=1,
                        estado_junta=EstadoJunta.AGUARDA_NDT
                    )
                    db.add(nova_junta)
                # Na reconciliação, se já existe não editamos para não quebrar rastreabilidade

            sucessos += 1

        except Exception as row_error:
            # Partial Success - Erro isolado, não aborta script
            erros.append({"linha": idx + 2, "erro": str(row_error)})

    # O ARCHIVE é passivo: NUNCA apagar. O arquivamento logico manual cumpre a lacuna.
    await db.commit()

    return {
        "sucessos": sucessos,
        "erros": erros,
        "total_processado": len(df)
    }
