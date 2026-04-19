from fastapi import FastAPI
from app.api.rotas_logistica import router as logistica_router
from app.api.rotas_engenharia import router as engenharia_router
from app.api.rotas_producao import router as producao_router

app = FastAPI(title="TRACK-FAB ERP")

app.include_router(logistica_router)
app.include_router(engenharia_router)
app.include_router(producao_router)

@app.get("/health")
async def health_check():
    return {"status": "ok"}
