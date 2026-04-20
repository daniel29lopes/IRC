"use client";

import MainLayout from "@/components/layout/MainLayout";
import { useState } from "react";
import { JuntaSoldadura } from "@/types";
import toast from "react-hot-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ChevronDown, ChevronRight, AlertTriangle, CheckCircle, Scissors, Loader2 } from "lucide-react";
import { ItemProducao } from "@/types";

export interface ItemComJuntas extends ItemProducao {
  juntas: JuntaSoldadura[];
}

export default function QualidadePage() {
  const { data: spools = [] } = useQuery({
    queryKey: ['itens_com_juntas'],
    queryFn: async () => {
      const res = await api.get('/producao/itens/com-juntas');
      return res.data as ItemComJuntas[];
    }
  });
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  // Estado do Modal de Confirmação de Corte
  const [modalJunta, setModalJunta] = useState<JuntaSoldadura | null>(null);

  const toggleRow = (id_item: string) => {
    setExpandedRows(prev => ({ ...prev, [id_item]: !prev[id_item] }));
  };

  // Mutação para CORTAR a Junta
  const mutationCorte = useMutation({
    mutationFn: async ({ id_junta, id_operador }: { id_junta: number; id_operador: number }) => {
      const res = await api.post(`/producao/juntas/${id_junta}/cortar`, { id_operador });
      return { data: res.data, id_junta };
    },
    onSuccess: () => {
      toast.success("Junta cortada. Nova junta agendada.");
      setModalJunta(null);
      window.location.reload();
    },
    onError: (error: import("axios").AxiosError<{detail?: string}>) => {
      const msg = error.response?.data?.detail || "Erro ao efetuar o registo do corte.";
      toast.error(msg);
    }
  });

  return (
    <MainLayout>
      <div className="flex flex-col h-full max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-800 tracking-tight">Welding Map NDT</h1>
            <p className="text-gray-500 mt-1">Inspeção de Spools e Juntas de Soldadura</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-12 gap-4 p-4 bg-slate-50 border-b border-gray-200 text-sm font-bold text-gray-600 uppercase tracking-wider">
            <div className="col-span-1 text-center">Expandir</div>
            <div className="col-span-3">Tag do Spool</div>
            <div className="col-span-2">ISO Ref</div>
            <div className="col-span-3">Estado Fabrico</div>
            <div className="col-span-3">Estado NDT</div>
          </div>

          {/* Accordion Rows */}
          {spools.map(spool => (
            <div key={spool.id_item} className="border-b border-gray-100 last:border-0">

              {/* Parent Row */}
              <div
                onClick={() => toggleRow(spool.id_item)}
                className={`grid grid-cols-12 gap-4 p-4 items-center cursor-pointer hover:bg-slate-50 transition-colors ${expandedRows[spool.id_item] ? 'bg-slate-50' : ''}`}
              >
                <div className="col-span-1 flex justify-center text-gray-400">
                  {expandedRows[spool.id_item] ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </div>
                <div className="col-span-3 font-bold text-gray-800 text-lg">
                  {spool.tag_item}
                </div>
                <div className="col-span-2 text-gray-500 font-medium">
                  ISO {spool.id_iso_revisao}
                </div>
                <div className="col-span-3">
                  <span className="bg-status-montagem text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                    {spool.estado_fabrico}
                  </span>
                </div>
                <div className="col-span-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                    spool.estado_ndt === 'REPARACAO' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {spool.estado_ndt?.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Expanded Area (Juntas) */}
              {expandedRows[spool.id_item] && (
                <div className="bg-slate-100 border-t border-gray-200 p-6 shadow-inner">
                  <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 pl-2 border-l-4 border-slate-400">
                    Juntas de Soldadura Mapeadas
                  </h4>

                  <div className="space-y-3">
                    {spool.juntas.map((junta) => {
                      const isCortada = junta.estado_junta === "CORTADA";
                      const isAprovada = junta.estado_junta === "APROVADA";

                      return (
                        <div
                          key={junta.id_junta}
                          className={`flex items-center justify-between p-4 rounded-lg bg-white shadow-sm border ${
                            isCortada ? 'border-gray-200 opacity-60 grayscale' :
                            isAprovada ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-6">
                            <div className="font-black text-xl text-gray-700 w-16">
                              {junta.tag_junta}
                            </div>

                            <div className="flex flex-col">
                              <span className="text-xs text-gray-400 font-semibold uppercase">Tentativa</span>
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-bold text-gray-800">#{junta.tentativa}</span>
                                {junta.tentativa! > 1 && !isCortada && (
                                  <span className="flex items-center gap-1 bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-0.5 rounded border border-yellow-300">
                                    <AlertTriangle className="w-3 h-3" />
                                    RETRABALHO
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col ml-8">
                                <span className="text-xs text-gray-400 font-semibold uppercase">Estado</span>
                                <span className={`font-bold ${
                                  isCortada ? 'text-gray-500 line-through' :
                                  isAprovada ? 'text-status-concluido' : 'text-gray-600'
                                }`}>
                                  {junta.estado_junta?.replace('_', ' ')}
                                </span>
                            </div>
                          </div>

                          {/* Ações */}
                          {!isCortada && !isAprovada && (
                            <div className="flex gap-3">
                              <button
                                onClick={() => toast.success("Aprovação não implementada na mock yet.")}
                                className="flex items-center gap-2 bg-action-aprovar text-white px-4 py-2 rounded-md font-bold hover:brightness-110 active:scale-95 transition-all shadow-sm"
                              >
                                <CheckCircle className="w-4 h-4" /> Aprovar
                              </button>
                              <button
                                onClick={() => setModalJunta(junta)}
                                className="flex items-center gap-2 bg-action-cortar text-white px-4 py-2 rounded-md font-bold hover:brightness-110 active:scale-95 transition-all shadow-sm"
                              >
                                <Scissors className="w-4 h-4" /> Cortar
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* MODAL DE SEGURANÇA PARA CORTE */}
      {modalJunta && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col p-8 border-t-8 border-action-cortar">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-action-cortar" />
              </div>
            </div>

            <h2 className="text-2xl font-black text-center text-gray-800 mb-2">Atenção: Corte NDT</h2>
            <p className="text-center text-gray-500 mb-6">
              Estás prestes a chumbar a junta <strong className="text-gray-800">{modalJunta.tag_junta}</strong>.
              Isto irá gerar uma nova tentativa e afetar o Spool. Esta ação não é reversível.
            </p>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-8">
              <label className="block text-sm font-bold text-gray-600 mb-2 uppercase tracking-wide">ID do Inspetor (Pin)</label>
              <input
                type="number"
                defaultValue={1}
                disabled
                className="w-full bg-white border border-gray-300 rounded-md px-4 py-3 text-lg font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-action-cortar"
              />
              <p className="text-xs text-gray-400 mt-2">*Campo preenchido automaticamente para testes.</p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setModalJunta(null)}
                disabled={mutationCorte.isPending}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                onDoubleClick={() => mutationCorte.mutate({ id_junta: modalJunta.id_junta, id_operador: 1 })}
                onClick={() => toast("Duplo-clique para confirmar!", { icon: "👆" })}
                disabled={mutationCorte.isPending}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-action-cortar text-white font-bold rounded-lg hover:brightness-110 active:scale-95 transition-all shadow-md disabled:opacity-80"
              >
                {mutationCorte.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>Cortar (Duplo Clique)</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
