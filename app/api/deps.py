from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from app.core.config import settings
from app.core.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.schema import Utilizador, TipoPerfil
from sqlalchemy import select

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)) -> Utilizador:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Não foi possível validar as credenciais",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    stmt = select(Utilizador).where(Utilizador.id_utilizador == int(user_id))
    result = await db.execute(stmt)
    user = result.scalars().first()
    if user is None:
        raise credentials_exception
    return user

def require_perfil(perfis_permitidos: list[TipoPerfil]):
    async def verificar_perfil(current_user: Utilizador = Depends(get_current_user)) -> Utilizador:
        if current_user.perfil not in perfis_permitidos and current_user.perfil != TipoPerfil.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Não tem permissões para executar esta ação"
            )
        return current_user
    return verificar_perfil
