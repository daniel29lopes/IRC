"use client";

import MainLayout from "@/components/layout/MainLayout";
import { useState } from "react";
import { ItemProducao, EstadoFabricoItem } from "@/types";
import toast from "react-hot-toast";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Loader2, X } from "lucide-react";
import { MOCK_SPOOLS_PRODUCAO } from "@/lib/mockData";

// Máquina de estados replicada para o frontend
const TRANSIÇÕES_PERMITIDAS: Record<EstadoFabricoItem, EstadoFabricoItem[]> = {
  PENDENTE: ["EM_CORTE"],
  EM_CORTE: ["EM_MONTAGEM"],
  EM_MONTAGEM: ["SOLDADO"],
  SOLDADO: ["CONCLUIDO"],
  HOLD_REVISAO: [],
  CONCLUIDO: [],
};

const ESTADOS_DISPONIVEIS: EstadoFabricoItem[] = [
  "PENDENTE", "EM_CORTE", "EM_MONTAGEM", "SOLDADO", "CONCLUIDO", "HOLD_REVISAO"
];

export default function ProducaoPage() {
  const [spools, setSpools] = useState<ItemProducao[]>(MOCK_SPOOLS_PRODUCAO);
  const [selectedSpool, setSelectedSpool] = useState<ItemProducao | null>(null);

  const getStatusColor = (estado: EstadoFabricoItem | null) => {
    switch (estado) {
      case "PENDENTE": return "bg-status-pendente text-white";
      case "EM_CORTE": return "bg-status-corte text-white";
      case "EM_MONTAGEM": return "bg-status-montagem text-white";
      case "SOLDADO": return "bg-status-montagem text-white border-4 border-status-concluido"; // Mistura para soldado
      case "CONCLUIDO": return "bg-status-concluido text-white";
      case "HOLD_REVISAO": return "bg-status-hold text-white";
      default: return "bg-gray-200 text-gray-800";
    }
  };

  const getStatusBgLight = (estado: EstadoFabricoItem | null) => {
    switch (estado) {
      case "PENDENTE": return "bg-yellow-50 border-yellow-200";
      case "EM_CORTE": return "bg-blue-50 border-blue-200";
      case "EM_MONTAGEM": return "bg-purple-50 border-purple-200";
      case "SOLDADO": return "bg-purple-100 border-purple-300";
      case "CONCLUIDO": return "bg-emerald-50 border-emerald-200";
      case "HOLD_REVISAO": return "bg-orange-50 border-orange-200";
      default: return "bg-gray-50 border-gray-200";
    }
  };

  const mutation = useMutation({
    mutationFn: async ({ id_item, novo_estado }: { id_item: string; novo_estado: EstadoFabricoItem }) => {
      // Estamos a assumir id_operador = 1 de forma hardcoded (seria extraido de contexto/JWT futuramente)
      const res = await api.put(`/producao/itens/${id_item}/estado`, { novo_estado, id_operador: 1 });
      return res.data;
    },
    onSuccess: (data, variables) => {
      toast.success("Estado atualizado com sucesso!");
      setSpools((prev) =>
        prev.map((s) => (s.id_item === variables.id_item ? { ...s, estado_fabrico: variables.novo_estado } : s))
      );
      setSelectedSpool(null);
    },
    onError: (error: import("axios").AxiosError<{detail?: string}>) => {
      const msg = error.response?.data?.detail || "Erro ao atualizar estado.";
      toast.error(msg);
      // Opcional: tremer o modal alterando alguma classe
      document.getElementById('modal-card')?.classList.add('animate-shake');
      setTimeout(() => document.getElementById('modal-card')?.classList.remove('animate-shake'), 500);
    },
  });

  const handleUpdateStatus = (novo_estado: EstadoFabricoItem) => {
    if (!selectedSpool) return;
    mutation.mutate({ id_item: selectedSpool.id_item, novo_estado });
  };

  return (
    <MainLayout>
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Tracker de Spools (Chão de Fábrica)</h1>
        </div>

        {/* Grid Kanban */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {spools.map((spool) => (
            <div
              key={spool.id_item}
              onClick={() => setSelectedSpool(spool)}
              className={`aspect-square rounded-xl border-2 p-4 cursor-pointer flex flex-col justify-between shadow-sm transition-transform hover:scale-105 active:scale-95 ${getStatusBgLight(
                spool.estado_fabrico
              )}`}
            >
              <div className="flex justify-between items-start">
                <span className="font-bold text-gray-800 text-lg">{spool.tag_item}</span>
                <span className="text-xs font-semibold text-gray-500">ISO {spool.id_iso_revisao}</span>
              </div>
              <div className="mt-auto">
                <div className={`px-3 py-2 rounded-lg text-center font-bold text-sm shadow-sm ${getStatusColor(spool.estado_fabrico)}`}>
                  {spool.estado_fabrico?.replace('_', ' ')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL GIGANTE */}
      {selectedSpool && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div id="modal-card" className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Cabecalho Modal */}
            <div className={`p-6 flex justify-between items-center ${getStatusColor(selectedSpool.estado_fabrico)}`}>
              <div>
                <h2 className="text-3xl font-black">{selectedSpool.tag_item}</h2>
                <p className="opacity-90 font-medium">Estado Atual: {selectedSpool.estado_fabrico?.replace('_', ' ')}</p>
              </div>
              <button
                onClick={() => !mutation.isPending && setSelectedSpool(null)}
                className="p-2 rounded-full hover:bg-white/20 transition-colors"
                disabled={mutation.isPending}
              >
                <X className="w-8 h-8" />
              </button>
            </div>

            {/* Corpo Modal - Botoes de Transicao */}
            <div className="p-8 flex-1 overflow-y-auto">
              <h3 className="text-xl font-bold text-gray-700 mb-6 text-center">Registar Transição Física</h3>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {ESTADOS_DISPONIVEIS.map((estado) => {
                  const estadoAtual = selectedSpool.estado_fabrico;
                  // Logica de maquina de estados para desativar
                  const permitidos = estadoAtual ? TRANSIÇÕES_PERMITIDAS[estadoAtual] : [];
                  const isPermitido = permitidos.includes(estado);
                  const isAtual = estado === estadoAtual;

                  let btnStyle = "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"; // Disabled

                  if (isAtual) {
                    btnStyle = "bg-gray-800 text-white border-gray-800 cursor-default ring-2 ring-offset-2 ring-gray-800"; // Current
                  } else if (isPermitido) {
                    btnStyle = `${getStatusColor(estado)} hover:brightness-110 active:scale-95 shadow-md border-transparent cursor-pointer`; // Active
                  }

                  return (
                    <button
                      key={estado}
                      disabled={!isPermitido || mutation.isPending}
                      onClick={() => handleUpdateStatus(estado)}
                      className={`h-32 rounded-xl border-2 flex flex-col items-center justify-center p-4 transition-all duration-200 ${btnStyle}`}
                    >
                      <span className="font-bold text-lg">{estado.replace('_', ' ')}</span>

                      {mutation.isPending && mutation.variables?.novo_estado === estado && (
                        <Loader2 className="w-8 h-8 mt-2 animate-spin" />
                      )}
                    </button>
                  );
                })}
              </div>

              {selectedSpool.estado_fabrico === "HOLD_REVISAO" && (
                <div className="mt-8 p-4 bg-status-hold/10 rounded-lg border border-status-hold text-status-hold font-semibold text-center">
                  ⚠️ Este Spool encontra-se bloqueado pela Engenharia. Aguarde revisão.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
