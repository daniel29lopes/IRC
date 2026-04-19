from pydantic import BaseModel, ConfigDict, Field
from app.models.schema import EstadoFabricoItem

class AtualizarEstadoItemRequest(BaseModel):
    novo_estado: EstadoFabricoItem = Field(..., description="Novo estado de fabrico desejado para o item")
    id_operador: int = Field(..., description="ID do operador que regista a alteração física")

    model_config = ConfigDict(from_attributes=True)

class CorteJuntaRequest(BaseModel):
    id_operador: int = Field(..., description="ID do operador/inspetor NDT que regista o corte")

    model_config = ConfigDict(from_attributes=True)
