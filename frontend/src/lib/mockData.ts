export interface BomDiffItem {
  ref_material: string;
  descricao: string;
  qtd_antiga: number;
  qtd_nova: number;
  tipo_alteracao: 'MODIFICADO' | 'ADICIONADO' | 'REMOVIDO';
}

export interface SpoolHoldDetail {
  id_item: number;
  tag_item: string;
  data_hold: string;
  revisao_anterior: string;
  revisao_nova: string;
  bom_diff: BomDiffItem[];
}

export const mockSpoolsHold: SpoolHoldDetail[] = [
  {
    id_item: 101,
    tag_item: "SPL-1024",
    data_hold: "2024-05-10T10:30:00Z",
    revisao_anterior: "Rev A",
    revisao_nova: "Rev B",
    bom_diff: [
      {
        ref_material: "TUB-2IN",
        descricao: "Tubo de 2 Polegadas",
        qtd_antiga: 10,
        qtd_nova: 12,
        tipo_alteracao: "MODIFICADO"
      },
      {
        ref_material: "FLG-WN",
        descricao: "Flange WN",
        qtd_antiga: 0,
        qtd_nova: 2,
        tipo_alteracao: "ADICIONADO"
      }
    ]
  },
  {
    id_item: 105,
    tag_item: "SPL-3050",
    data_hold: "2024-05-11T14:15:00Z",
    revisao_anterior: "Rev C",
    revisao_nova: "Rev D",
    bom_diff: [
      {
        ref_material: "VAL-GB-3IN",
        descricao: "Válvula Globo 3\"",
        qtd_antiga: 1,
        qtd_nova: 0,
        tipo_alteracao: "REMOVIDO"
      },
      {
        ref_material: "TUB-3IN",
        descricao: "Tubo de 3 Polegadas",
        qtd_antiga: 5,
        qtd_nova: 5.5,
        tipo_alteracao: "MODIFICADO"
      }
    ]
  },
  {
    id_item: 110,
    tag_item: "SPL-9012",
    data_hold: "2024-05-12T09:00:00Z",
    revisao_anterior: "Rev 0",
    revisao_nova: "Rev 1",
    bom_diff: [
      {
        ref_material: "SUP-PIPEMAX",
        descricao: "Suporte PipeMax",
        qtd_antiga: 2,
        qtd_nova: 4,
        tipo_alteracao: "MODIFICADO"
      }
    ]
  }
];
