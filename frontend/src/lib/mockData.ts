import { ItemProducao, JuntaSoldadura } from '../types';

export const dashboardKpis = {
  spoolsConcluidosHoje: 42,
  spoolsEmHold: 15,
  alertasStock: 3,
  eficienciaProducao: 94,
};

export const producaoChartData = [
  { estado: 'PENDENTE', quantidade: 120 },
  { estado: 'EM_CORTE', quantidade: 45 },
  { estado: 'EM_MONTAGEM', quantidade: 85 },
  { estado: 'SOLDADO', quantidade: 110 },
  { estado: 'HOLD_REVISAO', quantidade: 15 },
  { estado: 'CONCLUIDO', quantidade: 320 },
];

export const initialAuditLogs = [
  { id: 101, timestamp: '2023-10-27T10:00:00.000Z', mensagem: 'Operador NDT aprovou Junta W04 (Spool SP-102)', tipo: 'QUALIDADE' },
  { id: 102, timestamp: '2023-10-27T09:45:00.000Z', mensagem: 'Material Tubo 8" SCH40 entregue no armazém (Req. #442)', tipo: 'LOGISTICA' },
  { id: 103, timestamp: '2023-10-27T09:30:00.000Z', mensagem: 'Corte iniciado no Spool SP-205', tipo: 'PRODUCAO' },
  { id: 104, timestamp: '2023-10-27T09:15:00.000Z', mensagem: 'Engenharia: Revisão B aplicada à Linha L-800 (15 Spools em Hold)', tipo: 'ENGENHARIA' },
  { id: 105, timestamp: '2023-10-27T09:00:00.000Z', mensagem: 'Soldadura concluída: Junta W01 (Spool SP-088)', tipo: 'PRODUCAO' },
];

export const liveFeedSimulations = [
  { mensagem: 'Operador NDT aprovou Junta W12 (Spool SP-105)', tipo: 'QUALIDADE' },
  { mensagem: 'Material Flange 4" 150# entregue no armazém', tipo: 'LOGISTICA' },
  { mensagem: 'Corte concluído no Spool SP-210', tipo: 'PRODUCAO' },
  { mensagem: 'Montagem iniciada no Spool SP-190', tipo: 'PRODUCAO' },
  { mensagem: 'Aviso de Stock Mínimo: Eléctrodos E7018', tipo: 'LOGISTICA' },
  { mensagem: 'Spool SP-300 libertado do Hold pela Engenharia', tipo: 'ENGENHARIA' },
  { mensagem: 'Soldadura concluída: Junta W05 (Spool SP-190)', tipo: 'PRODUCAO' },
  { mensagem: 'Inspeção Visual (VT) aprovada: Spool SP-185', tipo: 'QUALIDADE' },
];

export const MOCK_SPOOLS_PRODUCAO: import("@/types").ItemProducao[] = [
  { id_item: '101', id_iso_revisao: 1, tipo: "SPOOL", tag_item: "SPL-001", estado_fabrico: "PENDENTE", estado_ndt: "AGUARDA_NDT" },
  { id_item: '102', id_iso_revisao: 1, tipo: "SPOOL", tag_item: "SPL-002", estado_fabrico: "EM_CORTE", estado_ndt: "AGUARDA_NDT" },
  { id_item: '103', id_iso_revisao: 2, tipo: "SPOOL", tag_item: "SPL-003", estado_fabrico: "EM_MONTAGEM", estado_ndt: "AGUARDA_NDT" },
  { id_item: '104', id_iso_revisao: 2, tipo: "SPOOL", tag_item: "SPL-004", estado_fabrico: "SOLDADO", estado_ndt: "AGUARDA_NDT" },
  { id_item: '105', id_iso_revisao: 3, tipo: "SPOOL", tag_item: "SPL-005", estado_fabrico: "HOLD_REVISAO", estado_ndt: "AGUARDA_NDT" },
];

export interface ItemComJuntas extends ItemProducao {
  juntas: JuntaSoldadura[];
}

export const MOCK_DATA_QUALIDADE: ItemComJuntas[] = [
  {
    id_item: '104', id_iso_revisao: 2, tipo: "SPOOL", tag_item: "SPL-004", estado_fabrico: "SOLDADO", estado_ndt: "AGUARDA_NDT",
    juntas: [
      { id_junta: 1, id_item: '104', tag_junta: "W01", tentativa: 1, estado_junta: "AGUARDA_NDT" },
      { id_junta: 2, id_item: '104', tag_junta: "W02", tentativa: 2, estado_junta: "AGUARDA_NDT" },
    ]
  },
  {
    id_item: '106', id_iso_revisao: 3, tipo: "SPOOL", tag_item: "SPL-006", estado_fabrico: "SOLDADO", estado_ndt: "AGUARDA_NDT",
    juntas: [
      { id_junta: 3, id_item: '106', tag_junta: "W01", tentativa: 1, estado_junta: "AGUARDA_NDT" },
      { id_junta: 4, id_item: '106', tag_junta: "W02", tentativa: 1, estado_junta: "AGUARDA_NDT" },
      { id_junta: 5, id_item: '106', tag_junta: "W03", tentativa: 1, estado_junta: "APROVADA" }, // Já inspecionada
    ]
  }
];
