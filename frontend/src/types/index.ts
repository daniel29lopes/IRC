// Espelho dos Contratos Pydantic do Backend

export type TipoPerfil = 'ADMIN' | 'PREPARADOR' | 'ARMAZEM' | 'CHEFE_EQUIPA' | 'NDT';
export type EstadoFabricoItem = 'PENDENTE' | 'EM_CORTE' | 'EM_MONTAGEM' | 'SOLDADO' | 'HOLD_REVISAO' | 'CONCLUIDO';
export type TipoMovimentoStock = 'ENTRADA' | 'SAIDA_REQUISICAO' | 'AJUSTE_INVENTARIO' | 'DEVOLUCAO';
export type EstadoRequisicao = 'ABERTA' | 'PARCIAL' | 'CONCLUIDA' | 'CANCELADA';
export type EstadoJunta = 'AGUARDA_NDT' | 'APROVADA' | 'CORTADA';

export interface Utilizador {
    id_utilizador: number;
    nome: string | null;
    email: string | null;
    perfil: TipoPerfil | null;
}

export interface RequisicaoLinha {
    id_linha?: number;
    id_requisicao?: number;
    ref_material: string;
    qtd_pedida: number;
    qtd_entregue?: number;
}

export interface RequisicaoCabecalho {
    id_requisicao?: number;
    estado?: EstadoRequisicao;
    linhas?: RequisicaoLinha[];
}

export interface ItemProducao {
    id_item: number;
    id_iso_revisao: number | null;
    tipo: string | null;
    tag_item: string | null;
    estado_fabrico: EstadoFabricoItem | null;
    estado_ndt: string | null;
}

export interface JuntaSoldadura {
    id_junta: number;
    id_item: number | null;
    tag_junta: string | null;
    tentativa: number | null;
    estado_junta: EstadoJunta | null;
}
