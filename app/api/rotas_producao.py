from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Dict

from app.core.database import get_db
from app.models.schema import (
    ItemProducao, EstadoFabricoItem, HistoricoEstadoItem, LogAuditoria, JuntaSoldadura, EstadoJunta
)
from app.schemas.producao import AtualizarEstadoItemRequest, CorteJuntaRequest

router = APIRouter()

# Máquina de estados simples
TRANSIÇÕES_PERMITIDAS = {
    EstadoFabricoItem.PENDENTE: [EstadoFabricoItem.EM_CORTE],
    EstadoFabricoItem.EM_CORTE: [EstadoFabricoItem.EM_MONTAGEM],
    EstadoFabricoItem.EM_MONTAGEM: [EstadoFabricoItem.SOLDADO],
    EstadoFabricoItem.SOLDADO: [EstadoFabricoItem.CONCLUIDO],
    EstadoFabricoItem.HOLD_REVISAO: [], # Apenas liberto via rota de engenharia
    EstadoFabricoItem.CONCLUIDO: []
}

from app.api.deps import get_current_user
from app.models.schema import Utilizador
from app.schemas.producao_manual import SpoolCreate, JuntaCreate

@router.get("/itens", response_model=list[dict])
async def listar_itens_producao(db: AsyncSession = Depends(get_db), current_user: Utilizador = Depends(get_current_user)):
    # Retorna lista de spools que não estejam ARQUIVADOS
    stmt = select(ItemProducao).where(ItemProducao.estado_fabrico != EstadoFabricoItem.ARQUIVADO)
    result = await db.execute(stmt)
    itens = result.scalars().all()
    # Pydantic via dict schema
    return [
        {
            "id_item": str(i.id_item),
            "id_iso_revisao": i.id_iso_revisao,
            "tipo": i.tipo,
            "tag_item": i.tag_item,
            "estado_fabrico": i.estado_fabrico,
            "estado_ndt": i.estado_ndt
        }
        for i in itens
    ]

@router.post("/itens", status_code=201)
async def criar_item_manual(data: SpoolCreate, db: AsyncSession = Depends(get_db), current_user: Utilizador = Depends(get_current_user)):
    async with db.begin():
        novo_item = ItemProducao(
            id_iso_revisao=data.id_iso_revisao,
            tipo=data.tipo.strip().upper(),
            tag_item=data.tag_item.strip().upper(),
            estado_fabrico=data.estado_fabrico,
            estado_ndt=data.estado_ndt.strip().upper()
        )
        db.add(novo_item)
        await db.flush()

        # Log Auditoria (CRIACAO MANUAL)
        db.add(LogAuditoria(
            tabela_afetada="itens_producao",
            id_registo=novo_item.id_item,
            acao="CRIAR_MANUAL_VIA3",
            payload_new={"tag_item": novo_item.tag_item}
        ))
    return {"id_item": str(novo_item.id_item), "tag_item": novo_item.tag_item}

@router.delete("/itens/{id_item}")
async def arquivar_item_logico(id_item: int, db: AsyncSession = Depends(get_db), current_user: Utilizador = Depends(get_current_user)):
    async with db.begin():
        res = await db.execute(select(ItemProducao).where(ItemProducao.id_item == id_item))
        item = res.scalars().first()
        if not item:
            raise HTTPException(status_code=404, detail="Spool não encontrado")

        estado_antigo = item.estado_fabrico
        item.estado_fabrico = EstadoFabricoItem.ARQUIVADO

        db.add(LogAuditoria(
            tabela_afetada="itens_producao",
            id_registo=item.id_item,
            acao="ARQUIVAR_LOGICO",
            payload_old={"estado_fabrico": estado_antigo.value} if estado_antigo else {},
            payload_new={"estado_fabrico": EstadoFabricoItem.ARQUIVADO.value}
        ))
    return {"message": "Spool arquivado com sucesso"}

@router.put("/itens/{id_item}/estado")
async def atualizar_estado_item(id_item: int, data: AtualizarEstadoItemRequest, db: AsyncSession = Depends(get_db), current_user: Utilizador = Depends(get_current_user)) -> Dict:
    async with db.begin():
        res_item = await db.execute(
            select(ItemProducao)
            .where(ItemProducao.id_item == id_item)
            .with_for_update()
        )
        item = res_item.scalar_one_or_none()

        if not item:
            raise HTTPException(status_code=404, detail="Item de produção não encontrado")

        if item.estado_fabrico == EstadoFabricoItem.HOLD_REVISAO:
            raise HTTPException(status_code=400, detail="Item bloqueado em HOLD_REVISAO. Contacte a Engenharia.")

        if data.novo_estado not in TRANSIÇÕES_PERMITIDAS.get(item.estado_fabrico, []):
            raise HTTPException(
                status_code=400,
                detail=f"Transição não permitida: de {item.estado_fabrico.value} para {data.novo_estado.value}"
            )

        estado_antigo = item.estado_fabrico
        item.estado_fabrico = data.novo_estado

        historico = HistoricoEstadoItem(
            id_item=item.id_item,
            fase="OPERACAO_FABRICO",
            estado_anterior=estado_antigo.value if estado_antigo else None,
            estado_novo=item.estado_fabrico.value
        )
        db.add(historico)

        log = LogAuditoria(
            tabela_afetada="itens_producao",
            id_registo=item.id_item,
            acao="ATUALIZAR_ESTADO_FABRICO",
            payload_old={"estado_fabrico": estado_antigo.value} if estado_antigo else {},
            payload_new={"estado_fabrico": item.estado_fabrico.value}
        )
        db.add(log)

    return {"status": "Estado do item atualizado", "novo_estado": item.estado_fabrico.value}


@router.post("/juntas/{id_junta}/cortar")
async def cortar_junta_ndt(id_junta: int, data: CorteJuntaRequest, db: AsyncSession = Depends(get_db), current_user: Utilizador = Depends(get_current_user)) -> Dict:
    """Implementação baseada no Template de Rigor Transacional do Master Prompt."""
    async with db.begin():
        # 1. Row-Level Lock para proteção de concorrência
        res_junta = await db.execute(
            select(JuntaSoldadura)
            .where(JuntaSoldadura.id_junta == id_junta)
            .with_for_update()
        )
        junta_atual = res_junta.scalar_one_or_none()

        if not junta_atual or junta_atual.estado_junta == EstadoJunta.CORTADA:
            raise HTTPException(status_code=400, detail="Junta inválida ou já cortada.")

        estado_antigo = junta_atual.estado_junta
        junta_atual.estado_junta = EstadoJunta.CORTADA

        # 2. Nova Instância Granular
        nova_tentativa = junta_atual.tentativa + 1 if junta_atual.tentativa else 1
        nova_junta = JuntaSoldadura(
            id_item=junta_atual.id_item,
            tag_junta=junta_atual.tag_junta,
            tentativa=nova_tentativa,
            estado_junta=EstadoJunta.AGUARDA_NDT
        )
        db.add(nova_junta)

        # 3. Atualização do Spool Pai
        res_item = await db.execute(
            select(ItemProducao)
            .where(ItemProducao.id_item == junta_atual.id_item)
            .with_for_update()
        )
        item = res_item.scalar_one_or_none()

        if not item:
            raise HTTPException(status_code=404, detail="Item pai da junta não encontrado")

        estado_ndt_antigo = item.estado_ndt
        item.estado_ndt = 'REPARACAO'

        # 4. Auditoria Imutável (JSONB Nativo)
        log_junta = LogAuditoria(
            tabela_afetada='juntas_soldadura',
            id_registo=junta_atual.id_junta,
            acao='UPDATE_CORTE',
            payload_old={"estado_junta": estado_antigo.value} if estado_antigo else {},
            payload_new={"estado_junta": EstadoJunta.CORTADA.value}
        )
        db.add(log_junta)

        log_item = LogAuditoria(
            tabela_afetada='itens_producao',
            id_registo=item.id_item,
            acao='UPDATE_ESTADO_NDT',
            payload_old={"estado_ndt": estado_ndt_antigo},
            payload_new={"estado_ndt": 'REPARACAO'}
        )
        db.add(log_item)

    return {"status": "Processado com sucesso", "nova_tentativa": nova_tentativa}

@router.get("/itens/com-juntas", response_model=list[dict])
async def listar_itens_com_juntas(db: AsyncSession = Depends(get_db), current_user: Utilizador = Depends(get_current_user)):
    stmt = select(ItemProducao).where(ItemProducao.estado_fabrico != EstadoFabricoItem.ARQUIVADO)
    res_itens = await db.execute(stmt)
    itens = res_itens.scalars().all()

    out = []
    for i in itens:
        stmt_j = select(JuntaSoldadura).where(JuntaSoldadura.id_item == i.id_item)
        res_j = await db.execute(stmt_j)
        juntas = res_j.scalars().all()

        juntas_list = [
            {
                "id_junta": j.id_junta,
                "id_item": str(j.id_item),
                "tag_junta": j.tag_junta,
                "tentativa": j.tentativa,
                "estado_junta": j.estado_junta
            } for j in juntas
        ]

        out.append({
            "id_item": str(i.id_item),
            "id_iso_revisao": i.id_iso_revisao,
            "tipo": i.tipo,
            "tag_item": i.tag_item,
            "estado_fabrico": i.estado_fabrico,
            "estado_ndt": i.estado_ndt,
            "juntas": juntas_list
        })
    return out
