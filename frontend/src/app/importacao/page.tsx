/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import MainLayout from "@/components/layout/MainLayout";
import { useState } from "react";
import { api } from "@/lib/api";
import { Loader2, UploadCloud, AlertCircle, CheckCircle2, X } from "lucide-react";
import toast from "react-hot-toast";

export default function ImportacaoPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [resultado, setResultado] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setResultado(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post("/importacao/excel/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResultado(res.data);
      if (res.data.status === "success") {
        toast.success("Ficheiro processado com sucesso absoluto.");
      } else if (res.data.status === "partial_success") {
        toast.error("Importação efetuada com algumas falhas parciais.");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Erro grave na importação.");
    } finally {
      setIsUploading(false);
      setFile(null);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Motor de Importação de Engenharia</h1>
          <p className="text-slate-500">Faça o upload do Excel da lista de materiais e spools (Bulk Load).</p>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center hover:bg-slate-50 transition-colors">
             <UploadCloud className="w-12 h-12 text-slate-400 mx-auto mb-4" />
             <input type="file" id="file" accept=".xls,.xlsx" onChange={handleFileChange} className="hidden" />
             <label htmlFor="file" className="cursor-pointer bg-slate-800 text-white px-6 py-3 rounded-lg font-bold hover:bg-slate-700 transition shadow">
               {file ? file.name : "Selecionar Ficheiro Excel (.xlsx)"}
             </label>
             <p className="text-sm text-slate-400 mt-4">Colunas mínimas necessárias: ISO, SPOOL, REV, SAP, QTD, CONEXAO</p>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="flex items-center gap-2 bg-status-pendente text-white px-8 py-3 rounded-lg font-bold hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> A Processar Ficheiro...</>
              ) : (
                "Submeter para Triagem"
              )}
            </button>
          </div>
        </div>

        {/* Modal Resumo (Partial Success) */}
        {resultado && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setResultado(null)}>
            <div role="dialog" aria-modal="true" aria-labelledby="modal-resumo-title" onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-2xl rounded-xl shadow-lg border-2 border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className={`p-4 flex items-center justify-between border-b ${resultado.status === 'success' ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                <div className="flex items-center gap-3">
                  {resultado.status === 'success' ? <CheckCircle2 className="w-8 h-8 text-emerald-600" /> : <AlertCircle className="w-8 h-8 text-red-600" />}
                  <div>
                    <h3 id="modal-resumo-title" className="font-bold text-lg text-slate-800">
                      {resultado.status === 'success' ? "Importação Perfeita" : "Importação Concluída com Alertas"}
                    </h3>
                    <p className="text-sm text-slate-600">
                      {resultado.resumo.linhas_processadas} linhas processadas • {resultado.resumo.sucessos} Inseridas/Atualizadas • {resultado.resumo.falhas} Rejeitadas
                    </p>
                  </div>
                </div>
                <button onClick={() => setResultado(null)} className="p-2 hover:bg-black/5 rounded-full"><X className="w-6 h-6 text-slate-500" /></button>
             </div>

             {resultado.detalhe_erros?.length > 0 && (
               <div className="p-6 bg-slate-50">
                 <h4 className="font-bold text-slate-700 mb-4 uppercase text-sm tracking-wider">Relatório de Rejeição (Partial Success)</h4>
                 <div className="max-h-64 overflow-y-auto space-y-2 custom-scrollbar">
                   {resultado.detalhe_erros.map((erro: any, idx: number) => (
                     <div key={idx} className="bg-white p-3 border border-red-200 rounded text-sm flex gap-4">
                       <span className="font-mono bg-red-100 text-red-800 px-2 py-0.5 rounded font-bold">LINHA {erro.linha}</span>
                       <span className="text-slate-700">{erro.erro}</span>
                     </div>
                   ))}
                 </div>
               </div>
             )}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
