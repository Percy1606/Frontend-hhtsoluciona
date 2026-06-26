"use client";

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Target, TrendingUp, Layers, AlertCircle } from "lucide-react";
import { useCRMStore } from '@/store/crm-store';
import { useOperacionesStore } from '@/store/operaciones-store';
import { useMemo } from 'react';

// Colores más modernos alineados con el tema actual
const PIPELINE_COLORS = ['#0f172a', '#334155', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
const PROJECT_COLORS = {
  Rojo: '#ef4444',
  Amarillo: '#f59e0b',
  Verde: '#10b981',
  Gris: '#94a3b8'
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md border border-slate-200 p-4 rounded-2xl shadow-xl">
        <p className="font-bold text-slate-800 mb-1">{label || payload[0].name}</p>
        <p className="text-sm font-medium" style={{ color: payload[0].fill || payload[0].color }}>
          Valor: {payload[0].value} {payload[0].dataKey === 'sales' ? 'S/' : payload[0].dataKey === 'progress' ? '%' : ''}
        </p>
      </div>
    );
  }
  return null;
};

export function DashboardCharts({ clients: customClients, proyectos: customProyectos }: { clients?: any[], proyectos?: any[] } = {}) {
  const { clients: storeClients } = useCRMStore();
  const { proyectos: storeProyectos } = useOperacionesStore();

  const clients = customClients ?? storeClients;
  const proyectos = customProyectos ?? storeProyectos;

  // 1. Pipeline Comercial Real
  const pipelineData = useMemo(() => {
    const counts = clients.reduce((acc, c) => {
      if (!c.etapaComercial) return acc;
      acc[c.etapaComercial] = (acc[c.etapaComercial] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a: any, b: any) => b.value - a.value); // Ordenar por tamaño
  }, [clients]);

  // 2. Avance de Proyectos Críticos Real
  const projectsAdvance = useMemo(() => {
    return proyectos
      .filter(p => p.semaforo === 'Rojo' || p.estado === 'En Ejecución')
      .sort((a, b) => (b.avanceCalculado || 0) - (a.avanceCalculado || 0))
      .slice(0, 5)
      .map(p => ({
        name: p.codigo || p.nombre.substring(0, 15),
        progress: Math.round(p.avanceCalculado || 0),
        color: PROJECT_COLORS[p.semaforo as keyof typeof PROJECT_COLORS] || PROJECT_COLORS.Gris
      }));
  }, [proyectos]);

  // 3. Proyección de Ventas Mensual Real (Basada en monto estimado * probabilidad o venta proyectada)
  const monthlySales = useMemo(() => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const currentMonth = new Date().getMonth();
    
    // Obtener los últimos 6 meses (incluyendo el actual)
    const recentMonths = [];
    for(let i = 5; i >= 0; i--) {
      let m = currentMonth - i;
      if (m < 0) m += 12;
      recentMonths.push(months[m]);
    }

    return recentMonths.map(monthName => {
      const mesIdx = months.indexOf(monthName);
      const sum = clients.filter(c => {
        if (!c.fechaCreacion) return false;
        const date = new Date(c.fechaCreacion);
        return date.getMonth() === mesIdx;
      }).reduce((acc, c) => acc + (c.ventaProyectada || (c.montoEstimado ? c.montoEstimado * ((c.probabilidad || 0) / 100) : 0)), 0);
      
      return { month: monthName, sales: Math.round(sum) };
    });
  }, [clients]);

  const hasSalesData = monthlySales.some(m => m.sales > 0);
  const hasPipelineData = pipelineData.length > 0;
  const hasProjectData = projectsAdvance.length > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
      {/* Pipeline Comercial */}
      <Card className="border border-slate-200 shadow-sm bg-white/50 backdrop-blur-xl rounded-[2rem] overflow-hidden">
        <CardHeader className="pb-2 border-b border-slate-100 bg-white/80">
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-800 flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-600" /> Pipeline Comercial
          </CardTitle>
          <CardDescription className="text-xs">Distribución de clientes por etapa</CardDescription>
        </CardHeader>
        <CardContent className="h-[320px] p-6 bg-gradient-to-b from-transparent to-slate-50/50">
          {hasPipelineData ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pipelineData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pipelineData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIPELINE_COLORS[index % PIPELINE_COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend 
                  iconType="circle" 
                  layout="vertical" 
                  verticalAlign="middle" 
                  align="right"
                  wrapperStyle={{ fontSize: '12px', fontWeight: '500', color: '#475569' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
             <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                <AlertCircle className="w-8 h-8 opacity-20" />
                <p className="text-sm font-medium">Sin datos en el pipeline</p>
             </div>
          )}
        </CardContent>
      </Card>

      {/* Ventas Mensuales */}
      <Card className="border border-slate-200 shadow-sm bg-white/50 backdrop-blur-xl rounded-[2rem] overflow-hidden">
        <CardHeader className="pb-2 border-b border-slate-100 bg-white/80">
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" /> Proyección de Ventas (S/.)
          </CardTitle>
          <CardDescription className="text-xs">Últimos 6 meses basados en creación de lead</CardDescription>
        </CardHeader>
        <CardContent className="h-[320px] p-6 bg-gradient-to-b from-transparent to-slate-50/50">
           {hasSalesData ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlySales} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b', fontWeight: 500}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} tickFormatter={(val) => `S/${val/1000}k`} />
                <RechartsTooltip cursor={{ fill: '#f1f5f9' }} content={<CustomTooltip />} />
                <Bar dataKey="sales" radius={[6, 6, 0, 0]} barSize={40}>
                  {monthlySales.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === monthlySales.length - 1 ? '#0f172a' : '#94a3b8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
           ) : (
             <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                <AlertCircle className="w-8 h-8 opacity-20" />
                <p className="text-sm font-medium">Sin proyecciones registradas</p>
             </div>
           )}
        </CardContent>
      </Card>

      {/* Avance de Proyectos */}
      <Card className="border border-slate-200 shadow-sm lg:col-span-2 bg-white/50 backdrop-blur-xl rounded-[2rem] overflow-hidden">
        <CardHeader className="pb-2 border-b border-slate-100 bg-white/80">
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-800 flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-600" /> Estado de Proyectos Críticos
          </CardTitle>
          <CardDescription className="text-xs">Top 5 proyectos en ejecución ordenados por avance</CardDescription>
        </CardHeader>
        <CardContent className="h-[240px] p-6 bg-gradient-to-b from-transparent to-slate-50/50">
          {hasProjectData ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                layout="vertical" 
                data={projectsAdvance}
                margin={{ left: 40, right: 20, top: 10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" hide domain={[0, 100]} />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 12, fontWeight: '600', fill: '#334155'}}
                  width={150}
                />
                <RechartsTooltip cursor={{ fill: '#f8fafc' }} content={<CustomTooltip />} />
                <Bar dataKey="progress" radius={[0, 8, 8, 0]} barSize={28} background={{ fill: '#f1f5f9' }}>
                  {projectsAdvance.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                <AlertCircle className="w-8 h-8 opacity-20" />
                <p className="text-sm font-medium">No hay proyectos activos en este momento</p>
             </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
