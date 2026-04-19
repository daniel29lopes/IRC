"use client";

import { useState } from 'react';
import { mockSpoolsHold, SpoolHoldDetail } from '@/lib/mockData';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { AlertCircle, CheckCircle, FileWarning, Search, ArrowRight } from 'lucide-react';

export default function EngenhariaPage() {
  const [selectedSpool, setSelectedSpool] = useState<SpoolHoldDetail | null>(null);

  const revalidarHoldMutation = useMutation({
    mutationFn: async (id_item: number) => {
      // Hardcode id_operador: 1 para Auth Bypass e impacto_bom: false conforme requisitos
      const response = await api.put(`/engenharia/producao/itens/${id_item}/revalidar-hold`, {
        id_operador: 1,
        impacto_bom: false
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Spool validado com sucesso. Sem impacto no BOM.');
      // Opcional: Aqui poderíamos refetch à lista real ou, no caso dos mocks, apenas remover o item atual.
      // Para já, apenas limpamos a seleção.
      setSelectedSpool(null);
    },
    onError: (error: unknown) => {
      // Verifica se é um erro do Axios (que geralmente tem propriedade isAxiosError)
      let errorMessage = 'Ocorreu um erro desconhecido';
      if (typeof error === 'object' && error !== null) {
        const errObj = error as Record<string, unknown>;
        if (errObj.response && typeof errObj.response === 'object') {
          const response = errObj.response as Record<string, unknown>;
          if (response.data && typeof response.data === 'object') {
            const data = response.data as Record<string, unknown>;
            if (typeof data.detail === 'string') {
              errorMessage = data.detail;
            }
          }
        } else if (typeof errObj.message === 'string') {
          errorMessage = errObj.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast.error(`Erro ao validar Spool: ${errorMessage}`);
    }
  });

  const handleValidarSemImpacto = () => {
    if (selectedSpool) {
      revalidarHoldMutation.mutate(selectedSpool.id_item);
    }
  };

  const handleExigeAjuste = () => {
    toast('Em desenvolvimento: Redirecionamento para correção manual do BOM', {
      icon: '⚠️',
      style: {
        background: '#eab308', // status-pendente
        color: '#fff',
      },
    });
  };

  const getTipoAlteracaoColor = (tipo: string) => {
    switch (tipo) {
      case 'MODIFICADO':
        return 'text-status-hold bg-orange-100 border-status-hold';
      case 'ADICIONADO':
        return 'text-status-concluido bg-emerald-100 border-status-concluido';
      case 'REMOVIDO':
        return 'text-status-erro bg-red-100 border-status-erro';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-300';
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Painel Esquerdo: Lista de Spools (Inbox) */}
      <div className="w-1/3 min-w-[350px] bg-white border-r border-gray-200 flex flex-col h-full shadow-sm">
        <div className="p-6 border-b border-gray-200 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2 mb-4">
            <FileWarning className="text-status-hold h-6 w-6" />
            <h1 className="text-xl font-bold text-gray-800">Spools em Hold</h1>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Pesquisar por TAG..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-status-hold focus:border-transparent transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {mockSpoolsHold.map((spool) => (
            <div
              key={spool.id_item}
              onClick={() => setSelectedSpool(spool)}
              className={`p-4 mb-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                selectedSpool?.id_item === spool.id_item
                  ? 'border-status-hold bg-orange-50 shadow-md transform scale-[1.02]'
                  : 'border-gray-200 hover:border-status-hold hover:shadow-sm'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-gray-900 text-lg">{spool.tag_item}</h3>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-100 text-status-hold border border-orange-200">
                  HOLD_REVISAO
                </span>
              </div>
              <div className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                <span className="font-medium text-gray-700">{spool.revisao_anterior}</span>
                <ArrowRight className="h-3 w-3" />
                <span className="font-bold text-status-hold">{spool.revisao_nova}</span>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Data Hold: {new Date(spool.data_hold).toLocaleString('pt-PT')}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Painel Direito: Detalhes da Revisão */}
      <div className="flex-1 flex flex-col h-full bg-gray-50 overflow-y-auto">
        {selectedSpool ? (
          <div className="p-8 max-w-5xl mx-auto w-full">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-6">
              <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">{selectedSpool.tag_item}</h2>
                  <p className="text-gray-500 flex items-center gap-2 text-lg">
                    Revisão: <span className="line-through">{selectedSpool.revisao_anterior}</span>
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                    <span className="font-bold text-status-hold">{selectedSpool.revisao_nova}</span>
                  </p>
                </div>
                <div className="text-right text-sm text-gray-500">
                  <p>Data de Entrada em Hold:</p>
                  <p className="font-medium text-gray-900">{new Date(selectedSpool.data_hold).toLocaleString('pt-PT')}</p>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-gray-500" />
                  Diferenças na Lista de Materiais (BOM)
                </h3>
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-600">
                        <th className="p-4 w-1/4">Ref. Material</th>
                        <th className="p-4 w-1/3">Descrição</th>
                        <th className="p-4 text-center">Quantidade</th>
                        <th className="p-4 text-center">Alteração</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedSpool.bom_diff.map((diff, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                          <td className="p-4 font-mono text-sm text-gray-800">{diff.ref_material}</td>
                          <td className="p-4 text-sm text-gray-600">{diff.descricao}</td>
                          <td className="p-4 text-center font-medium">
                            {diff.tipo_alteracao === 'REMOVIDO' ? (
                              <span className="text-status-erro">{diff.qtd_antiga}</span>
                            ) : diff.tipo_alteracao === 'ADICIONADO' ? (
                              <span className="text-status-concluido">{diff.qtd_nova}</span>
                            ) : (
                              <div className="flex items-center justify-center gap-2">
                                <span className="text-gray-400 line-through">{diff.qtd_antiga}</span>
                                <ArrowRight className="h-3 w-3 text-gray-400" />
                                <span className="text-status-hold font-bold">{diff.qtd_nova}</span>
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getTipoAlteracaoColor(diff.tipo_alteracao)}`}>
                              {diff.tipo_alteracao}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex gap-4 pt-6 border-t border-gray-100">
                <button
                  onClick={handleValidarSemImpacto}
                  disabled={revalidarHoldMutation.isPending}
                  className="flex-1 bg-action-aprovar hover:bg-emerald-700 text-white font-bold py-4 px-6 rounded-xl transition-all flex justify-center items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle className="h-5 w-5" />
                  {revalidarHoldMutation.isPending ? 'A Validar...' : 'Validar Sem Impacto no BOM'}
                </button>
                <button
                  onClick={handleExigeAjuste}
                  className="flex-1 bg-white hover:bg-gray-50 text-gray-800 border-2 border-gray-200 font-bold py-4 px-6 rounded-xl transition-all flex justify-center items-center gap-2"
                >
                  <AlertCircle className="h-5 w-5 text-status-hold" />
                  Exige Ajuste de Material
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
            <div className="bg-white p-6 rounded-full shadow-sm mb-4 border border-gray-100">
              <FileWarning className="h-16 w-16 text-gray-300" />
            </div>
            <p className="text-xl font-medium text-gray-500">Selecione um Spool</p>
            <p className="text-sm mt-2">Escolha um item na lista à esquerda para analisar a revisão.</p>
          </div>
        )}
      </div>
    </div>
  );
}
