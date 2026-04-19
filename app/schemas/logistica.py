from pydantic import BaseModel, ConfigDict, Field
from typing import List

class RequisicaoLinhaCreate(BaseModel):
    ref_material: str = Field(..., description="Referência do material no inventário")
    qtd_pedida: float = Field(..., gt=0, description="Quantidade solicitada do material")

class RequisicaoCreate(BaseModel):
    id_utilizador: int = Field(..., description="ID do utilizador que efetua a requisição")
    linhas: List[RequisicaoLinhaCreate] = Field(..., min_length=1, description="Linhas de materiais solicitados")

    model_config = ConfigDict(from_attributes=True)


class EntregaLinhaCreate(BaseModel):
    id_linha: int = Field(..., description="ID da linha da requisição original")
    qtd_entregue: float = Field(..., gt=0, description="Quantidade efetivamente entregue no momento")

class EntregaCreate(BaseModel):
    id_requisicao: int = Field(..., description="ID da requisição alvo da entrega")
    id_utilizador: int = Field(..., description="ID do operador de armazém/logística que regista a entrega")
    entregas: List[EntregaLinhaCreate] = Field(..., min_length=1, description="Lista de materiais entregues")

    model_config = ConfigDict(from_attributes=True)
