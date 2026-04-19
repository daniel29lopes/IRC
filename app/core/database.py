from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.core.config import settings

# Criar o motor assíncrono.
engine = create_async_engine(settings.DATABASE_URL, echo=True)

# Criar o construtor de sessões assíncronas.
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

async def get_db() -> AsyncSession:
    """
    Dependência FastAPI para injetar sessões na base de dados (AsyncSession).
    """
    async with AsyncSessionLocal() as session:
        yield session
