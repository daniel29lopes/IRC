import { RequisicaoCabecalho, EstadoRequisicao } from '../types';

export const requisicoesMock: RequisicaoCabecalho[] = [
  {
    id_requisicao: 1042,
    estado: 'ABERTA' as EstadoRequisicao,
    linhas: [
      { id_linha: 1, id_requisicao: 1042, ref_material: 'MAT-A1', qtd_pedida: 10, qtd_entregue: 0 },
      { id_linha: 2, id_requisicao: 1042, ref_material: 'MAT-B2', qtd_pedida: 5, qtd_entregue: 0 },
      { id_linha: 3, id_requisicao: 1042, ref_material: 'MAT-C3', qtd_pedida: 20, qtd_entregue: 0 },
    ]
  },
  {
    id_requisicao: 1043,
    estado: 'PARCIAL' as EstadoRequisicao,
    linhas: [
      { id_linha: 4, id_requisicao: 1043, ref_material: 'TUB-01', qtd_pedida: 50, qtd_entregue: 30 },
      { id_linha: 5, id_requisicao: 1043, ref_material: 'VAL-12', qtd_pedida: 5, qtd_entregue: 5 },
    ]
  },
  {
    id_requisicao: 1044,
    estado: 'ABERTA' as EstadoRequisicao,
    linhas: [
      { id_linha: 6, id_requisicao: 1044, ref_material: 'PAR-88', qtd_pedida: 100, qtd_entregue: 0 },
    ]
  }
];
