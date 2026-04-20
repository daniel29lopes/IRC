from typing import Optional, Any
from sqlalchemy import String, Integer, BigInteger, Text, DECIMAL, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import JSONB
import enum

class Base(DeclarativeBase):
    pass

class TipoPerfil(str, enum.Enum):
    ADMIN = 'ADMIN'
    PREPARADOR = 'PREPARADOR'
    ARMAZEM = 'ARMAZEM'
    CHEFE_EQUIPA = 'CHEFE_EQUIPA'
    NDT = 'NDT'

class EstadoFabricoItem(str, enum.Enum):
    PENDENTE = 'PENDENTE'
    EM_CORTE = 'EM_CORTE'
    EM_MONTAGEM = 'EM_MONTAGEM'
    SOLDADO = 'SOLDADO'
    HOLD_REVISAO = 'HOLD_REVISAO'
    CONCLUIDO = 'CONCLUIDO'
    ARQUIVADO = 'ARQUIVADO'

class TipoMovimentoStock(str, enum.Enum):
    ENTRADA = 'ENTRADA'
    SAIDA_REQUISICAO = 'SAIDA_REQUISICAO'
    AJUSTE_INVENTARIO = 'AJUSTE_INVENTARIO'
    DEVOLUCAO = 'DEVOLUCAO'

class EstadoRequisicao(str, enum.Enum):
    ABERTA = 'ABERTA'
    PARCIAL = 'PARCIAL'
    CONCLUIDA = 'CONCLUIDA'
    CANCELADA = 'CANCELADA'

class EstadoJunta(str, enum.Enum):
    AGUARDA_NDT = 'AGUARDA_NDT'
    APROVADA = 'APROVADA'
    CORTADA = 'CORTADA'


class Utilizador(Base):
    __tablename__ = 'utilizadores'

    id_utilizador: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    nome: Mapped[Optional[str]] = mapped_column(String)
    email: Mapped[Optional[str]] = mapped_column(String, unique=True)
    password_hash: Mapped[Optional[str]] = mapped_column(String)
    perfil: Mapped[Optional[TipoPerfil]] = mapped_column(SQLEnum(TipoPerfil, name="tipo_perfil"))


class Obra(Base):
    __tablename__ = 'obras'

    id_obra: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    descricao: Mapped[Optional[str]] = mapped_column(Text)
    estado: Mapped[Optional[str]] = mapped_column(String)


class Isometrica(Base):
    __tablename__ = 'isometricas'

    id_iso: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    id_obra: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("obras.id_obra"))
    tag_isometrica: Mapped[Optional[str]] = mapped_column(String)


class IsometricaRevisao(Base):
    __tablename__ = 'isometricas_revisoes'

    id_iso_revisao: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    id_iso: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("isometricas.id_iso"))
    revisao_tag: Mapped[Optional[str]] = mapped_column(String)
    status_revisao: Mapped[Optional[str]] = mapped_column(String)


class ItemProducao(Base):
    __tablename__ = 'itens_producao'

    id_item: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    id_iso_revisao: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("isometricas_revisoes.id_iso_revisao"))
    tipo: Mapped[Optional[str]] = mapped_column(String)
    tag_item: Mapped[Optional[str]] = mapped_column(String)
    estado_fabrico: Mapped[Optional[EstadoFabricoItem]] = mapped_column(SQLEnum(EstadoFabricoItem, name="estado_fabrico_item"))
    estado_ndt: Mapped[Optional[str]] = mapped_column(String)


class InventarioArmazem(Base):
    __tablename__ = 'inventario_armazem'

    ref_material: Mapped[str] = mapped_column(String, primary_key=True)
    descricao: Mapped[Optional[str]] = mapped_column(Text)
    qtd_minima: Mapped[Optional[float]] = mapped_column(DECIMAL)


class BomItem(Base):
    __tablename__ = 'bom_itens'

    id_bom: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    id_item: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("itens_producao.id_item"))
    ref_material: Mapped[Optional[str]] = mapped_column(String, ForeignKey("inventario_armazem.ref_material"))
    qtd_necessaria: Mapped[Optional[float]] = mapped_column(DECIMAL)


class RequisicaoCabecalho(Base):
    __tablename__ = 'requisicoes_cabecalho'

    id_requisicao: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    estado: Mapped[Optional[EstadoRequisicao]] = mapped_column(SQLEnum(EstadoRequisicao, name="estado_requisicao"))


class RequisicaoLinha(Base):
    __tablename__ = 'requisicoes_linhas'

    id_linha: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    id_requisicao: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("requisicoes_cabecalho.id_requisicao"))
    ref_material: Mapped[Optional[str]] = mapped_column(String, ForeignKey("inventario_armazem.ref_material"))
    qtd_pedida: Mapped[Optional[float]] = mapped_column(DECIMAL)
    qtd_entregue: Mapped[Optional[float]] = mapped_column(DECIMAL)


class MovimentoStock(Base):
    __tablename__ = 'movimentos_stock'

    id_movimento: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    ref_material: Mapped[Optional[str]] = mapped_column(String, ForeignKey("inventario_armazem.ref_material"))
    qtd_alterada: Mapped[Optional[float]] = mapped_column(DECIMAL)
    tipo_movimento: Mapped[Optional[TipoMovimentoStock]] = mapped_column(SQLEnum(TipoMovimentoStock, name="tipo_movimento_stock"))


class HistoricoEstadoItem(Base):
    __tablename__ = 'historico_estados_item'

    id_historico: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    id_item: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("itens_producao.id_item"))
    fase: Mapped[Optional[str]] = mapped_column(String)
    estado_anterior: Mapped[Optional[str]] = mapped_column(String)
    estado_novo: Mapped[Optional[str]] = mapped_column(String)


class LogAuditoria(Base):
    __tablename__ = 'logs_auditoria'

    id_log: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    tabela_afetada: Mapped[Optional[str]] = mapped_column(String)
    id_registo: Mapped[Optional[int]] = mapped_column(BigInteger)
    acao: Mapped[Optional[str]] = mapped_column(String)
    payload_old: Mapped[Optional[Any]] = mapped_column(JSONB)
    payload_new: Mapped[Optional[Any]] = mapped_column(JSONB)


class JuntaSoldadura(Base):
    __tablename__ = 'juntas_soldadura'

    id_junta: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    id_item: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("itens_producao.id_item"))
    tag_junta: Mapped[Optional[str]] = mapped_column(String)
    tentativa: Mapped[Optional[int]] = mapped_column(Integer)
    estado_junta: Mapped[Optional[EstadoJunta]] = mapped_column(SQLEnum(EstadoJunta, name="estado_junta"))
