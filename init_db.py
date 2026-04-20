import asyncio
from app.core.database import engine, AsyncSessionLocal
from app.models.schema import Base, Utilizador, TipoPerfil
from sqlalchemy import select
from app.core.security import get_password_hash

async def init_models():
    print("A preparar o cofre de dados (Base de Dados)...")
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("Tabelas criadas com sucesso!")

        async with AsyncSessionLocal() as session:
            perfis = [
                ("admin@trackfab.com", "Administrador", TipoPerfil.ADMIN),
                ("preparador@trackfab.com", "Preparador Engenharia", TipoPerfil.PREPARADOR),
                ("armazem@trackfab.com", "Operador de Armazém", TipoPerfil.ARMAZEM),
                ("producao@trackfab.com", "Chefe de Equipa", TipoPerfil.CHEFE_EQUIPA),
                ("ndt@trackfab.com", "Inspetor NDT", TipoPerfil.NDT),
            ]

            pwd_hash = get_password_hash("123456")

            for email, nome, perfil in perfis:
                stmt = select(Utilizador).where(Utilizador.email == email)
                result = await session.execute(stmt)
                user = result.scalars().first()
                if not user:
                    novo_user = Utilizador(email=email, nome=nome, password_hash=pwd_hash, perfil=perfil)
                    session.add(novo_user)

            await session.commit()
            print("Utilizadores padrão criados/verificados com sucesso!")

    except Exception as e:
        print(f"Ocorreu um erro ao ligar à base de dados: {e}")

if __name__ == "__main__":
    asyncio.run(init_models())
