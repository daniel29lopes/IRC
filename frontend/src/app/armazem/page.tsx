"use client";

import { useState } from 'react';
import { requisicoesMock } from '@/lib/mockData';
import { RequisicaoCabecalho } from '@/types';
import { ClipboardList, AlertTriangle, X, Check, Loader2, Package } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

interface EntregaPayload {
  id_requisicao: number;
  id_utilizador: number;
  entregas: { id_linha: number; qtd_entregue: number }[];
}

export default function ArmazemPage() {
  const [requisicoes] = useState<RequisicaoCabecalho[]>(requisicoesMock);
  const [selectedReq, setSelectedReq] = useState<RequisicaoCabecalho | null>(null);

  const [entregas, setEntregas] = useState<{ [key: number]: string }>({});
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Mutation para a API real
  const mutation = useMutation({
    mutationFn: async (payload: EntregaPayload) => {
      const response = await api.post('/logistica/entregas/', payload);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Entrega registada com sucesso!');
      setSelectedReq(null);
      setEntregas({});
      // Poderiamos refazer fetch real aqui em vez de limpar, mas para este mock serve.
    },
    onError: (error: Error & { response?: { data?: { detail?: string } } }) => {
      toast.error(error.response?.data?.detail || 'Erro ao registar entrega.');
    }
  });

  const handleSelectReq = (req: RequisicaoCabecalho) => {
    setSelectedReq(req);
    setEntregas({});
    setIsModalOpen(false);
  };

  const handleEntregaChange = (id_linha: number, value: string) => {
    setEntregas(prev => ({
      ...prev,
      [id_linha]: value
    }));
  };

  const handlePreSubmit = () => {
    if (!selectedReq) return;

    let isPartial = false;
    let hasEntries = false;

    for (const linha of selectedReq.linhas || []) {
      if (!linha.id_linha) continue;

      const qtdFalta = linha.qtd_pedida - (linha.qtd_entregue || 0);
      if (qtdFalta <= 0) continue; // Já concluída

      const inputValStr = entregas[linha.id_linha];
      const inputVal = inputValStr ? parseFloat(inputValStr) : 0;

      if (inputVal > 0) hasEntries = true;

      // Se o input é menor que o que falta, é parcial
      if (inputVal < qtdFalta) {
        isPartial = true;
      }
    }

    if (!hasEntries) {
      toast.error("Preencha pelo menos uma quantidade para entregar.");
      return;
    }

    if (isPartial) {
      setIsModalOpen(true);
    } else {
      submitEntrega();
    }
  };

  const submitEntrega = () => {
    if (!selectedReq) return;
    setIsModalOpen(false);

    const payloadEntregas = [];
    for (const linha of selectedReq.linhas || []) {
      if (!linha.id_linha) continue;

      const qtdFalta = linha.qtd_pedida - (linha.qtd_entregue || 0);
      if (qtdFalta <= 0) continue;

      const inputValStr = entregas[linha.id_linha];
      const inputVal = inputValStr ? parseFloat(inputValStr) : 0;

      if (inputVal > 0) {
        payloadEntregas.push({
          id_linha: linha.id_linha,
          qtd_entregue: inputVal
        });
      }
    }

    if (payloadEntregas.length === 0 || !selectedReq.id_requisicao) return;

    const payload = {
      id_requisicao: selectedReq.id_requisicao,
      id_utilizador: 1, // Bypass Auth operator
      entregas: payloadEntregas
    };

    mutation.mutate(payload);
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gray-50 text-gray-900 overflow-hidden font-sans">

      {/* Inbox Panel (Left) */}
      <div className="w-full lg:w-1/3 bg-white border-r border-gray-200 flex flex-col h-1/2 lg:h-full">
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="w-6 h-6 text-gray-600" />
            Balcão do Armazém
          </h1>
          <p className="text-sm text-gray-500 mt-1">Requisições Pendentes</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {requisicoes.map((req) => (
            <button
              key={req.id_requisicao}
              onClick={() => handleSelectReq(req)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                selectedReq?.id_requisicao === req.id_requisicao
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-lg">REQ-{req.id_requisicao}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                  req.estado === 'ABERTA' ? 'bg-status-pendente/20 text-status-pendente' : 'bg-status-corte/20 text-status-corte'
                }`}>
                  {req.estado}
                </span>
              </div>
              <div className="flex items-center text-gray-500 text-sm gap-2">
                <ClipboardList className="w-4 h-4" />
                <span>{(req.linhas || []).length} Itens</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Delivery Table Panel (Right) */}
      <div className="w-full lg:w-2/3 flex flex-col h-1/2 lg:h-full bg-white relative">
        {selectedReq ? (
          <>
            <div className="p-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">REQ-{selectedReq.id_requisicao}</h2>
                <p className="text-gray-500 text-sm">Registar Entrega de Materiais</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200 text-gray-500 text-sm uppercase">
                    <th className="py-3 px-4 font-semibold">Material</th>
                    <th className="py-3 px-4 font-semibold text-center">Falta Entregar</th>
                    <th className="py-3 px-4 font-semibold text-right w-48">Qtd Entregue (Agora)</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedReq.linhas || []).map((linha) => {
                    const qtdFalta = linha.qtd_pedida - (linha.qtd_entregue || 0);
                    // Ocultar linhas já concluídas
                    if (qtdFalta <= 0) return null;

                    return (
                      <tr key={linha.id_linha} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-5 px-4 font-bold text-lg">{linha.ref_material}</td>
                        <td className="py-5 px-4 text-center">
                          <span className="text-gray-500 text-lg">{qtdFalta}</span>
                        </td>
                        <td className="py-5 px-4 text-right">
                          <input
                            type="number"
                            min="0"
                            max={qtdFalta}
                            placeholder="0"
                            value={entregas[linha.id_linha!] || ''}
                            onChange={(e) => handleEntregaChange(linha.id_linha!, e.target.value)}
                            className="w-32 text-right text-2xl font-bold p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-gray-300"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button
                onClick={handlePreSubmit}
                disabled={mutation.isPending}
                className="bg-action-aprovar hover:bg-emerald-700 text-white font-bold text-xl py-4 px-8 rounded-xl shadow-lg transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    A Registar...
                  </>
                ) : (
                  <>
                    <Check className="w-6 h-6" />
                    Registar Entrega
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <Package className="w-24 h-24 mb-4 text-gray-200" />
            <h2 className="text-2xl font-semibold">Nenhuma Requisição Selecionada</h2>
            <p className="mt-2 text-center max-w-md">Selecione uma requisição no painel lateral para iniciar o processo de entrega de materiais.</p>
          </div>
        )}
      </div>

      {/* UX Guardrail Modal (Yellow Alert) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-status-pendente p-6 flex flex-col items-center text-center text-white">
              <AlertTriangle className="w-16 h-16 mb-4 animate-bounce" />
              <h3 className="text-3xl font-bold">Atenção: Entrega Parcial</h3>
            </div>

            <div className="p-8 text-center text-gray-700 text-lg">
              <p>
                As quantidades introduzidas são inferiores ao total pedido. A requisição ficará em estado de <strong>Backorder</strong> (PARCIAL).
              </p>
              <p className="mt-4 font-bold text-gray-900">
                Tem a certeza que deseja prosseguir?
              </p>
            </div>

            <div className="p-6 bg-gray-50 flex gap-4 justify-end border-t border-gray-200">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-3 rounded-lg border-2 border-gray-300 text-gray-700 font-bold hover:bg-gray-100 hover:text-gray-900 transition-all flex items-center gap-2"
              >
                <X className="w-5 h-5" />
                Cancelar
              </button>
              <button
                onClick={submitEntrega}
                className="px-6 py-3 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold transition-all shadow-md flex items-center gap-2"
              >
                <Check className="w-5 h-5" />
                Confirmar Backorder
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
