from pydantic import BaseModel, ConfigDict, Field
from typing import Optional

class NovaRevisaoCreate(BaseModel):
    id_iso: int = Field(..., description="ID da isométrica à qual a revisão pertence")
    revisao_tag: str = Field(..., description="Tag descritiva da revisão (ex: Rev 1)")
    id_utilizador: int = Field(..., description="ID do engenheiro que submete a revisão")

    model_config = ConfigDict(from_attributes=True)

class RevalidarHoldRequest(BaseModel):
    id_nova_revisao: int = Field(..., description="ID da nova revisão validada pelo preparador")
    impacto_bom: bool = Field(..., description="Indica se a revisão afeta o Bill of Materials/Fabrico")
    id_utilizador: int = Field(..., description="ID do preparador")

    model_config = ConfigDict(from_attributes=True)
