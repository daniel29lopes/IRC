import asyncio
from app.core.database import engine
from app.models.schema import Base

async def init_models():
    print("A preparar o cofre de dados (Base de Dados)...")
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("Tabelas criadas com sucesso!")
    except Exception as e:
        print(f"Ocorreu um erro ao ligar à base de dados: {e}")

if __name__ == "__main__":
    asyncio.run(init_models())
