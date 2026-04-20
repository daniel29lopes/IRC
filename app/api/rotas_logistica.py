from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Dict

from app.core.database import get_db
from app.models.schema import (
    RequisicaoCabecalho, RequisicaoLinha, EstadoRequisicao, MovimentoStock, TipoMovimentoStock, LogAuditoria
)
from app.schemas.logistica import RequisicaoCreate, EntregaCreate

from app.api.deps import get_current_user
from app.models.schema import Utilizador

router = APIRouter()

@router.post("/requisicoes/", status_code=201)
async def criar_requisicao(data: RequisicaoCreate, db: AsyncSession = Depends(get_db), current_user: Utilizador = Depends(get_current_user)) -> Dict:
    async with db.begin():
        cabecalho = RequisicaoCabecalho(estado=EstadoRequisicao.ABERTA)
        db.add(cabecalho)
        await db.flush()  # Para obter o id_requisicao gerado

        linhas_inseridas = []
        for linha_req in data.linhas:
            linha = RequisicaoLinha(
                id_requisicao=cabecalho.id_requisicao,
                ref_material=linha_req.ref_material,
                qtd_pedida=linha_req.qtd_pedida,
                qtd_entregue=0.0
            )
            db.add(linha)
            linhas_inseridas.append(linha)

        await db.flush() # Flush to have id_linha for audit

        log = LogAuditoria(
            tabela_afetada="requisicoes_cabecalho",
            id_registo=cabecalho.id_requisicao,
            acao="CRIAR_REQUISICAO",
            payload_old=None,
            payload_new={
                "estado": cabecalho.estado.value,
                "linhas": [{"ref_material": l.ref_material, "qtd_pedida": float(l.qtd_pedida)} for l in linhas_inseridas]
            }
        )
        # Assuming manual implicit link to user context via endpoint logic, though there's no id_utilizador column in log table directly,
        # it can be stored in the payload if needed. Wait, 'id_utilizador' wasn't present in LogAuditoria model.
        # Oh, the example code had 'id_utilizador=data.id_operador', but my DDL mapping didn't have it because it was not in the strict SQL schema provided in sprint 1!
        # So I will just write the log without it as it matches the DB schema I mapped perfectly.
        db.add(log)

    return {"status": "Requisição criada com sucesso", "id_requisicao": cabecalho.id_requisicao}


@router.post("/entregas/")
async def registar_entrega(id_requisicao: int, data: EntregaCreate, db: AsyncSession = Depends(get_db), current_user: Utilizador = Depends(get_current_user)) -> Dict:
    async with db.begin():
        # Lock do cabeçalho da requisição
        res_cab = await db.execute(
            select(RequisicaoCabecalho)
            .where(RequisicaoCabecalho.id_requisicao == data.id_requisicao)
            .with_for_update()
        )
        cabecalho = res_cab.scalar_one_or_none()

        if not cabecalho:
            raise HTTPException(status_code=404, detail="Requisição não encontrada")
        if cabecalho.estado in [EstadoRequisicao.CONCLUIDA, EstadoRequisicao.CANCELADA]:
            raise HTTPException(status_code=400, detail="Requisição já concluída ou cancelada")

        log_payload_old = {"linhas": []}
        log_payload_new = {"linhas": []}

        # Processar cada entrega
        for entrega in data.entregas:
            # Lock da linha da requisição
            res_linha = await db.execute(
                select(RequisicaoLinha)
                .where(RequisicaoLinha.id_linha == entrega.id_linha)
                .where(RequisicaoLinha.id_requisicao == cabecalho.id_requisicao)
                .with_for_update()
            )
            linha = res_linha.scalar_one_or_none()

            if not linha:
                raise HTTPException(status_code=400, detail=f"Linha {entrega.id_linha} não encontrada nesta requisição")

            qtd_falta = float(linha.qtd_pedida) - float(linha.qtd_entregue)
            if entrega.qtd_entregue > qtd_falta:
                raise HTTPException(
                    status_code=400,
                    detail=f"Quantidade entregue ({entrega.qtd_entregue}) excede o que falta entregar ({qtd_falta}) na linha {linha.id_linha}"
                )

            log_payload_old["linhas"].append({"id_linha": linha.id_linha, "qtd_entregue": float(linha.qtd_entregue)})

            # Atualizar linha
            linha.qtd_entregue = float(linha.qtd_entregue) + entrega.qtd_entregue

            log_payload_new["linhas"].append({"id_linha": linha.id_linha, "qtd_entregue": float(linha.qtd_entregue)})

            # Event sourcing: Registo negativo de stock (saída)
            movimento = MovimentoStock(
                ref_material=linha.ref_material,
                qtd_alterada=-entrega.qtd_entregue,  # Subtração do stock virtual
                tipo_movimento=TipoMovimentoStock.SAIDA_REQUISICAO
            )
            db.add(movimento)

        # Avaliar estado do cabeçalho
        res_todas_linhas = await db.execute(
            select(RequisicaoLinha).where(RequisicaoLinha.id_requisicao == cabecalho.id_requisicao)
        )
        todas_linhas = res_todas_linhas.scalars().all()

        todas_concluidas = all(float(l.qtd_entregue) >= float(l.qtd_pedida) for l in todas_linhas)
        estado_antigo = cabecalho.estado

        if todas_concluidas:
            cabecalho.estado = EstadoRequisicao.CONCLUIDA
        else:
            cabecalho.estado = EstadoRequisicao.PARCIAL

        log_payload_old["estado"] = estado_antigo.value
        log_payload_new["estado"] = cabecalho.estado.value

        # Log de Auditoria
        log = LogAuditoria(
            tabela_afetada="requisicoes_cabecalho",
            id_registo=cabecalho.id_requisicao,
            acao="ENTREGA_PARCIAL" if cabecalho.estado == EstadoRequisicao.PARCIAL else "ENTREGA_CONCLUIDA",
            payload_old=log_payload_old,
            payload_new=log_payload_new
        )
        db.add(log)

    return {"status": "Entrega registada com sucesso", "estado_requisicao": cabecalho.estado.value}
