/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // O endpoint OAuth2 espera FormData
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', password);

      const res = await api.post('/auth/login', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const token = res.data.access_token;
      localStorage.setItem('token', token);

      // Descodificar payload básico para extrair perfil no frontend sem biblioteca extra
      const payloadBase64 = token.split('.')[1];
      const decodedPayload = JSON.parse(atob(payloadBase64));
      localStorage.setItem('perfil', decodedPayload.perfil || '');

      toast.success("Bem-vindo ao TRACK-FAB ERP");
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Erro de Autenticação");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-slate-800 p-8 text-center border-b-4 border-status-pendente">
          <h1 className="text-3xl font-black text-white tracking-wider">TRACK-FAB</h1>
          <p className="text-slate-400 mt-2 font-medium">Enterprise Resource Planning</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide mb-2">Email / Utilizador</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800 focus:bg-white transition-colors font-medium text-slate-800"
                placeholder="admin@trackfab.com"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide mb-2">Palavra-passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800 focus:bg-white transition-colors font-medium text-slate-800"
                placeholder="••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 px-6 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-700 transition-colors flex justify-center items-center gap-2 shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "ENTRAR NO SISTEMA"}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-slate-500">
            <p>Acesso Restrito V1.3</p>
          </div>
        </div>
      </div>
    </div>
  );
}
