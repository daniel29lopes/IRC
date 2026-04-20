/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import MainLayout from "@/components/layout/MainLayout";
import { useState } from "react";
import { ItemProducao, EstadoFabricoItem } from "@/types";
import toast from "react-hot-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Loader2, X, PlusCircle, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

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

import { Suspense } from "react";

function ProducaoPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [selectedSpool, setSelectedSpool] = useState<ItemProducao | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [novoSpool, setNovoSpool] = useState({ id_iso_revisao: 1, tipo: 'SPOOL', tag_item: '', estado_fabrico: 'PENDENTE', estado_ndt: 'AGUARDA_NDT' });

  const filtroISO = searchParams.get('iso') || '';
  const filtroEstado = searchParams.get('estado') || '';

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`?${params.toString()}`);
  };

  const { data: spools = [] } = useQuery({
    queryKey: ['itens_producao'],
    queryFn: async () => {
      const res = await api.get('/producao/itens/com-juntas');
      return res.data as any[]; // Usamos endpoint com juntas para ler o estado NDT
    }
  });

  const spoolsFiltrados = spools.filter((s: any) => {
    const matchISO = s.tag_item?.toLowerCase().includes(filtroISO.toLowerCase());
    const matchEstado = filtroEstado ? s.estado_fabrico === filtroEstado : true;
    return matchISO && matchEstado;
  });


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
    onSuccess: () => {
      toast.success("Estado atualizado com sucesso!");
      setSelectedSpool(null);
      queryClient.invalidateQueries({ queryKey: ['itens_producao'] });
    },
    onError: (error: import("axios").AxiosError<{detail?: string}>) => {
      const msg = error.response?.data?.detail || "Erro ao atualizar estado.";
      toast.error(msg);
      // Opcional: tremer o modal alterando alguma classe
      document.getElementById('modal-card')?.classList.add('animate-shake');
      setTimeout(() => document.getElementById('modal-card')?.classList.remove('animate-shake'), 500);
    },
  });

  const mutationCreate = useMutation({
    mutationFn: async (payload: typeof novoSpool) => {
      const res = await api.post('/producao/itens', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Spool submetido manualmente.");
      setIsDrawerOpen(false);
      queryClient.invalidateQueries({ queryKey: ['itens_producao'] });
    },
    onError: (err: import("axios").AxiosError<{detail?: string}>) => toast.error(err.response?.data?.detail || "Erro ao submeter Spool.")
  });

  const handleCreateSpool = (e: React.FormEvent) => {
    e.preventDefault();
    mutationCreate.mutate(novoSpool);
  };

  const handleUpdateStatus = (novo_estado: EstadoFabricoItem) => {
    if (!selectedSpool) return;
    mutation.mutate({ id_item: selectedSpool.id_item, novo_estado });
  };

  return (
    <MainLayout>
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Tracker de Spools (Chão de Fábrica)</h1>
          <div className="flex gap-4">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Pesquisar Spool/ISO..."
                value={filtroISO}
                onChange={e => updateFilters('iso', e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-slate-800 outline-none"
              />
            </div>
            <select
              value={filtroEstado}
              onChange={e => updateFilters('estado', e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-slate-800 outline-none bg-white text-slate-600 font-medium"
            >
              <option value="">Todos os Estados</option>
              {ESTADOS_DISPONIVEIS.map(e => <option key={e} value={e}>{e.replace('_', ' ')}</option>)}
            </select>
            <button onClick={() => setIsDrawerOpen(true)} className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg shadow hover:bg-slate-700 transition">
              <PlusCircle className="w-5 h-5" /> Adicionar Manual
            </button>
          </div>
        </div>

        {/* Grid Kanban */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {spoolsFiltrados.map((spool: any) => (
            <div
              key={spool.id_item}
              onClick={() => setSelectedSpool(spool)}
              className={`relative aspect-square rounded-xl border-2 p-4 cursor-pointer flex flex-col justify-between shadow-sm transition-transform hover:scale-105 active:scale-95 ${getStatusBgLight(
                spool.estado_fabrico
              )}`}
            >
              <div className="flex justify-between items-start">
                <span className="font-bold text-gray-800 text-lg truncate pr-2">{spool.tag_item}</span>
                <span className="text-xs font-semibold text-gray-500 shrink-0">ISO {spool.id_iso_revisao}</span>
              </div>

              {/* Alerta Visível NDT Retrabalho (Furo 3 UX Resolution) */}
              {spool.estado_ndt === 'REPARACAO' && (
                <div className="mt-2 bg-red-100 border border-red-200 text-red-700 text-xs font-bold px-2 py-1 rounded flex flex-col gap-1 shadow-sm">
                  <div className="flex items-center gap-1">
                    <span className="animate-pulse">🔴</span> REPARAR JUNTAS:
                  </div>
                  {spool.juntas?.filter((j: any) => j.estado_junta === 'CORTADA' || j.tentativa > 1).map((j: any) => (
                    <span key={j.id_junta} className="ml-4 font-mono">{j.tag_junta} (T{j.tentativa})</span>
                  ))}
                </div>
              )}

              <div className="mt-auto">
                <div className={`px-3 py-2 rounded-lg text-center font-bold text-sm shadow-sm ${getStatusColor(spool.estado_fabrico)}`}>
                  {spool.estado_fabrico?.replace('_', ' ')}
                </div>
              </div>
            </div>
          ))}
          {spoolsFiltrados.length === 0 && (
             <div className="col-span-full py-12 text-center text-slate-500 font-medium">Nenhum spool encontrado com estes filtros.</div>
          )}
        </div>
      </div>

      {/* Drawer Criação */}
      {isDrawerOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-end">
           <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
             <div className="p-6 border-b flex justify-between items-center bg-slate-50">
               <h2 className="text-xl font-bold">Novo Spool (Manual)</h2>
               <button onClick={() => setIsDrawerOpen(false)}><X className="w-6 h-6 text-slate-400" /></button>
             </div>
             <form onSubmit={handleCreateSpool} className="p-6 space-y-4 flex-1 overflow-y-auto">
               <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Tag Combinada (ISO-SPOOL)</label>
                  <input type="text" required value={novoSpool.tag_item} onChange={e => setNovoSpool({...novoSpool, tag_item: e.target.value})} className="w-full p-3 border rounded-lg" placeholder="EX: ISO123-SPL44" />
               </div>
               <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">ID Revisão (DB Link)</label>
                  <input type="number" required value={novoSpool.id_iso_revisao} onChange={e => setNovoSpool({...novoSpool, id_iso_revisao: Number(e.target.value)})} className="w-full p-3 border rounded-lg" />
               </div>

               <button type="submit" disabled={mutationCreate.isPending} className="w-full mt-8 bg-status-pendente text-white font-bold p-4 rounded-lg flex justify-center">
                 {mutationCreate.isPending ? <Loader2 className="w-5 h-5 animate-spin"/> : "Guardar Spool"}
               </button>
             </form>
           </div>
        </div>
      )}

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

export default function ProducaoPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center animate-pulse text-slate-500">Carregando painel de Produção...</div>}>
      <ProducaoPageContent />
    </Suspense>
  );
}
