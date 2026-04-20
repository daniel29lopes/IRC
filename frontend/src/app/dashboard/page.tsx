/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import {
  CheckCircle2,
  AlertOctagon,
  AlertTriangle,
  TrendingUp,
  Activity
} from 'lucide-react';
import { api } from '@/lib/api';

// Semantic Color mapping directly from tailwind.config.ts
const CHART_COLORS: Record<string, string> = {
  'PENDENTE': '#eab308',    // status-pendente
  'EM_CORTE': '#3b82f6',    // status-corte
  'EM_MONTAGEM': '#a855f7', // status-montagem
  'SOLDADO': '#64748b',     // slate-500 (using a neutral/different color for soldado if not defined in config, or we can use another semantic one. Let's stick to slate for neutral, or maybe we use tailwind text-slate-500. Actually, let's look at config again. We have pendente, corte, montagem, hold, concluido, erro.) Wait, let's just use hex directly.
  'HOLD_REVISAO': '#f97316',// status-hold
  'CONCLUIDO': '#059669',   // status-concluido
};
// Update SOLDADO color to a good fit, maybe a light green or cyan
CHART_COLORS['SOLDADO'] = '#0ea5e9'; // sky-500

export default function DashboardPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    setIsMounted(true);

    // Na V1.3 passamos a ler dados do backend caso existam.
    // Como a dashboard requer várias endpoints, simulamos a agregação basica
    // lendo das rotas já protegidas por JWT.
    const fetchDashboard = async () => {
      try {
        const [producao, holds] = await Promise.all([
          api.get('/producao/itens'),
          api.get('/engenharia/holds')
        ]);

        // Agregar logs reais pode ser feito mais tarde num endpoint `GET /auditoria`
        // Por agora a dashboard apenas assegura o Data Fetching principal.
        const itensProducao = producao.data || [];

        const counts: Record<string, number> = {
          'PENDENTE': 0, 'EM_CORTE': 0, 'EM_MONTAGEM': 0,
          'SOLDADO': 0, 'HOLD_REVISAO': 0, 'CONCLUIDO': 0
        };

        itensProducao.forEach((item: Record<string, string>) => {
          if (counts[item.estado_fabrico] !== undefined) {
             counts[item.estado_fabrico]++;
          }
        });

        const chartData = Object.keys(counts).map(estado => ({
           estado, quantidade: counts[estado]
        }));

        setDashboardData({
           kpis: {
               spoolsConcluidosHoje: counts['CONCLUIDO'],
               spoolsEmHold: holds.data?.length || 0,
               alertasStock: 0,
               eficienciaProducao: 100
           },
           chartData: chartData,
           logs: [] // Serão lidos da BD noutra iteração
        });
      } catch (err) {
        console.error("Dashboard error:", err);
      }
    };

    fetchDashboard();
  }, []);

  const formatTime = (isoString: any) => {
    const date = new Date(isoString as string);
    return date.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  if (!isMounted) {
    return null; // Avoid hydration mismatch by waiting for mount
  }

  if (!dashboardData) return <div className="p-10 text-center animate-pulse text-slate-500">Carregando dashboard seguro...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Cockpit de Supervisão</h1>
          <p className="text-slate-500">Visão global da fábrica em tempo real</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          Live (Conectado ao ERP)
        </div>
      </div>

      {/* KPI Cards Top Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100 flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Spools Concluídos Hoje</p>
            <h3 className="text-3xl font-bold text-slate-800">{dashboardData.kpis.spoolsConcluidosHoje}</h3>
          </div>
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-status-hold border-opacity-50 flex items-start justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-status-hold"></div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Em Hold (Urgente)</p>
            <h3 className="text-3xl font-bold text-status-hold animate-pulse">{dashboardData.kpis.spoolsEmHold}</h3>
          </div>
          <div className="p-3 bg-orange-100 text-status-hold rounded-lg">
            <AlertOctagon className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100 flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Alertas de Stock</p>
            <h3 className="text-3xl font-bold text-slate-800">{dashboardData.kpis.alertasStock}</h3>
          </div>
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100 flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Eficiência Geral</p>
            <h3 className="text-3xl font-bold text-slate-800">{dashboardData.kpis.eficienciaProducao}%</h3>
          </div>
          <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Distribuição de Spools por Estado</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboardData.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="estado"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="quantidade" radius={[4, 4, 0, 0]}>
                  {dashboardData.chartData.map((entry: Record<string, string | number>, index: number) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[entry.estado] || '#cbd5e1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Feed */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col h-[400px]">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 shrink-0">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Activity className="w-5 h-5 text-slate-400" />
              Live Feed
            </h3>
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-md font-medium">Últimos Logs</span>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <div className="space-y-4">
              {dashboardData.logs.map((log: Record<string, string | number>) => (
                <div key={log.id} className="flex gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex flex-col items-center">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                      log.tipo === 'QUALIDADE' ? 'bg-status-montagem' :
                      log.tipo === 'LOGISTICA' ? 'bg-status-corte' :
                      log.tipo === 'PRODUCAO' ? 'bg-status-concluido' :
                      'bg-status-hold'
                    }`} />
                    <div className="w-px h-full bg-slate-100 mt-2"></div>
                  </div>
                  <div className="pb-4">
                    <p className="text-sm text-slate-700 font-medium">{log.mensagem}</p>
                    <p className="text-xs text-slate-400 mt-1 font-mono">{formatTime(log.timestamp)} • {log.tipo}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
