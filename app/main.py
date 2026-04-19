from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.api.rotas_logistica import router as logistica_router
from app.api.rotas_engenharia import router as engenharia_router
from app.api.rotas_producao import router as producao_router
from app.core.database import get_db

app = FastAPI(
    title="Track-Fab ERP API",
    description="Backend Core para o ecossistema Track-Fab ERP",
    version="1.0"
)

app.include_router(engenharia_router, prefix="/api/v1/engenharia", tags=["Engenharia"])
app.include_router(logistica_router, prefix="/api/v1/logistica", tags=["Logística"])
app.include_router(producao_router, prefix="/api/v1/producao", tags=["Produção e Qualidade"])

@app.get("/health", tags=["Sistema"])
async def health_check(db: AsyncSession = Depends(get_db)):
    """Verifica a saúde da API e da conexão à base de dados PostgreSQL."""
    try:
        # Testa a ligação fazendo um SELECT 1 simples de forma assíncrona
        await db.execute(text("SELECT 1"))
        return {"status": "online", "database": "connected"}
    except Exception as e:
        raise HTTPException(status_code=503, detail="Database connection failed")
