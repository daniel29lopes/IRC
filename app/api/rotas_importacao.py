from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services.excel_parser import processar_importacao_excel
from app.api.deps import get_current_user, require_perfil
from app.models.schema import Utilizador, TipoPerfil

router = APIRouter()

@router.post("/excel/")
async def importar_excel_bulk(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: Utilizador = Depends(require_perfil([TipoPerfil.PREPARADOR]))
):
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Formato de ficheiro inválido. Envie um Excel (.xlsx)")

    contents = await file.read()

    # Partial Success Response Structure
    resultado = await processar_importacao_excel(contents, db)

    return {
        "status": "partial_success" if len(resultado["erros"]) > 0 and resultado["sucessos"] > 0 else "success" if resultado["sucessos"] > 0 else "failed",
        "resumo": {
            "linhas_processadas": resultado["total_processado"],
            "sucessos": resultado["sucessos"],
            "falhas": len(resultado["erros"])
        },
        "detalhe_erros": resultado["erros"]
    }
