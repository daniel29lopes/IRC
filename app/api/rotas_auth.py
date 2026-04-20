from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import verify_password, create_access_token
from app.schemas.auth import Token
from app.models.schema import Utilizador
from sqlalchemy import select
from datetime import timedelta
from app.core.config import settings

router = APIRouter()

@router.post("/login", response_model=Token)
async def login_for_access_token(
    db: AsyncSession = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()
):
    stmt = select(Utilizador).where(Utilizador.email == form_data.username)
    result = await db.execute(stmt)
    user = result.scalars().first()

    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou password incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    # Payload stateless: enviamos tambem o perfil para n precisar ir a base dados
    to_encode = {
        "sub": str(user.id_utilizador),
        "perfil": user.perfil.value if user.perfil else None
    }

    from app.core.security import jwt, ALGORITHM
    from datetime import datetime
    expire = datetime.utcnow() + access_token_expires
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)

    return {"access_token": encoded_jwt, "token_type": "bearer"}
