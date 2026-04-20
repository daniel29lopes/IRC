from pydantic import BaseModel, Field
from typing import Optional
from app.models.schema import EstadoFabricoItem, EstadoJunta

class SpoolCreate(BaseModel):
    id_iso_revisao: int
    tipo: str = Field("SPOOL", description="Tipo de item (SPOOL, SUPORTE, etc.)")
    tag_item: str = Field(..., description="Tag combinada ISO+SPOOL")
    estado_fabrico: EstadoFabricoItem = Field(default=EstadoFabricoItem.PENDENTE)
    estado_ndt: str = Field(default="AGUARDA_NDT")

class JuntaCreate(BaseModel):
    id_item: int
    tag_junta: str = Field(..., description="Tag combinada ISO+JUNTA")
    tentativa: int = Field(default=1)
    estado_junta: EstadoJunta = Field(default=EstadoJunta.AGUARDA_NDT)
