from pydantic import BaseModel
from typing import Optional
from app.models.schema import TipoPerfil

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    id_utilizador: Optional[int] = None
    perfil: Optional[TipoPerfil] = None
