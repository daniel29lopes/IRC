from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import Dict

from app.core.database import get_db
from app.models.schema import (
    IsometricaRevisao, ItemProducao, EstadoFabricoItem, LogAuditoria, HistoricoEstadoItem
)
from app.schemas.engenharia import NovaRevisaoCreate, RevalidarHoldRequest

from app.api.deps import get_current_user
from app.models.schema import Utilizador

router = APIRouter()

@router.get("/holds", response_model=list[dict])
async def listar_spools_hold(db: AsyncSession = Depends(get_db), current_user: Utilizador = Depends(get_current_user)):
    stmt = select(ItemProducao).where(ItemProducao.estado_fabrico == EstadoFabricoItem.HOLD_REVISAO)
    res = await db.execute(stmt)
    itens = res.scalars().all()

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

@router.post("/isometricas/revisoes/", status_code=201)
async def submeter_revisao(data: NovaRevisaoCreate, db: AsyncSession = Depends(get_db), current_user: Utilizador = Depends(get_current_user)) -> Dict:
    async with db.begin():
        nova_rev = IsometricaRevisao(
            id_iso=data.id_iso,
            revisao_tag=data.revisao_tag,
            status_revisao="ATIVA"
        )
        db.add(nova_rev)
        await db.flush()

        log = LogAuditoria(
            tabela_afetada="isometricas_revisoes",
            id_registo=nova_rev.id_iso_revisao,
            acao="CRIAR_REVISAO",
            payload_old=None,
            payload_new={
                "id_iso": nova_rev.id_iso,
                "revisao_tag": nova_rev.revisao_tag,
                "status_revisao": nova_rev.status_revisao
            }
        )
        db.add(log)

    return {"status": "Nova revisão submetida com sucesso", "id_iso_revisao": nova_rev.id_iso_revisao}


@router.put("/producao/itens/{id_item}/revalidar-hold")
async def revalidar_hold(id_item: int, data: RevalidarHoldRequest, db: AsyncSession = Depends(get_db), current_user: Utilizador = Depends(get_current_user)) -> Dict:
    async with db.begin():
        res_item = await db.execute(
            select(ItemProducao)
            .where(ItemProducao.id_item == id_item)
            .with_for_update()
        )
        item = res_item.scalar_one_or_none()

        if not item:
            raise HTTPException(status_code=404, detail="Item não encontrado")

        if item.estado_fabrico != EstadoFabricoItem.HOLD_REVISAO:
            raise HTTPException(status_code=400, detail="O item não está em estado HOLD_REVISAO")

        estado_antigo = item.estado_fabrico
        novo_estado = None

        if data.impacto_bom:
            novo_estado = EstadoFabricoItem.PENDENTE
            item.id_iso_revisao = data.id_nova_revisao
        else:
            # Sem impacto: reverter para o estado antes do HOLD
            res_hist = await db.execute(
                select(HistoricoEstadoItem)
                .where(HistoricoEstadoItem.id_item == id_item)
                .where(HistoricoEstadoItem.estado_novo == EstadoFabricoItem.HOLD_REVISAO.value)
                .order_by(desc(HistoricoEstadoItem.id_historico))
                .limit(1)
            )
            ultimo_hold = res_hist.scalar_one_or_none()

            # Se não houver registo de onde veio o hold, o fallback conservador pode ser PENDENTE
            novo_estado_valor = ultimo_hold.estado_anterior if ultimo_hold else EstadoFabricoItem.PENDENTE.value

            try:
                novo_estado = EstadoFabricoItem(novo_estado_valor)
            except ValueError:
                novo_estado = EstadoFabricoItem.PENDENTE

            item.id_iso_revisao = data.id_nova_revisao

        item.estado_fabrico = novo_estado

        historico = HistoricoEstadoItem(
            id_item=item.id_item,
            fase="REVALIDACAO_REVISAO",
            estado_anterior=estado_antigo.value,
            estado_novo=item.estado_fabrico.value
        )
        db.add(historico)

        log = LogAuditoria(
            tabela_afetada="itens_producao",
            id_registo=item.id_item,
            acao="REVALIDAR_HOLD_IMPACTO" if data.impacto_bom else "REVALIDAR_HOLD_SEM_IMPACTO",
            payload_old={"estado_fabrico": estado_antigo.value},
            payload_new={"estado_fabrico": item.estado_fabrico.value, "id_iso_revisao": item.id_iso_revisao}
        )
        db.add(log)

    return {"status": "Item revalidado com sucesso e liberto de HOLD", "novo_estado": item.estado_fabrico.value}
