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

@router.put("/itens/{id_item}/estado")
async def atualizar_estado_item(id_item: int, data: AtualizarEstadoItemRequest, db: AsyncSession = Depends(get_db)) -> Dict:
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
async def registar_corte_junta(id_junta: int, data: CorteJuntaRequest, db: AsyncSession = Depends(get_db)) -> Dict:
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
