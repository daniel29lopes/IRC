import MainLayout from "@/components/layout/MainLayout";

export default function Home() {
  return (
    <MainLayout>
      <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-100 h-full flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Bem-vindo ao Track-Fab ERP</h1>
        <p className="text-lg text-gray-500 max-w-2xl text-center">
          O motor lógico (Backend) está ligado. A interface de utilizador (Frontend) foi iniciada e configurada com a paleta de cores operacionais da fábrica. Selecione um dos módulos no menu lateral para iniciar as operações.
        </p>

        <div className="mt-12 flex gap-4 flex-wrap justify-center">
            {/* Exemplo de amostra de cores semânticas configuradas no tailwind */}
            <div className="flex flex-col items-center gap-2"><div className="w-12 h-12 rounded-full bg-status-pendente shadow-sm"></div><span className="text-xs text-gray-500">Pendente</span></div>
            <div className="flex flex-col items-center gap-2"><div className="w-12 h-12 rounded-full bg-status-corte shadow-sm"></div><span className="text-xs text-gray-500">Corte</span></div>
            <div className="flex flex-col items-center gap-2"><div className="w-12 h-12 rounded-full bg-status-montagem shadow-sm"></div><span className="text-xs text-gray-500">Montagem</span></div>
            <div className="flex flex-col items-center gap-2"><div className="w-12 h-12 rounded-full bg-status-hold shadow-sm"></div><span className="text-xs text-gray-500">Hold</span></div>
            <div className="flex flex-col items-center gap-2"><div className="w-12 h-12 rounded-full bg-status-concluido shadow-sm"></div><span className="text-xs text-gray-500">Concluído</span></div>
            <div className="flex flex-col items-center gap-2"><div className="w-12 h-12 rounded-full bg-status-erro shadow-sm"></div><span className="text-xs text-gray-500">Erro/NDT</span></div>
        </div>
      </div>
    </MainLayout>
  );
}
