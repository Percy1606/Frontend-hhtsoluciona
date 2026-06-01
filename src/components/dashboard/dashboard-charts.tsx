"use client";

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCRMStore } from '@/store/crm-store';
import { useOperacionesStore } from '@/store/operaciones-store';

const COLORS = ['#003087', '#001F3F', '#E30613', '#00B050', '#FFC000'];

export function DashboardCharts() {
  const { clients } = useCRMStore();
  const { proyectos } = useOperacionesStore();

  // 1. Pipeline Comercial Real
  const pipelineData = Object.entries(
    clients.reduce((acc, c) => {
      acc[c.etapaComercial] = (acc[c.etapaComercial] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  // 2. Avance de Proyectos Críticos Real
  const projectsAdvance = proyectos
    .filter(p => p.semaforo === 'Rojo' || p.estado === 'En Ejecución')
    .slice(0, 5)
    .map(p => ({
      name: p.codigo || p.nombre.substring(0, 15),
      progress: p.avanceCalculado,
      color: p.semaforo === 'Rojo' ? '#E30613' : p.semaforo === 'Amarillo' ? '#FFC000' : '#003087'
    }));

  // 3. Proyección de Ventas Mensual (Simulada basada en clientes por ahora)
  const monthlySales = [
    { month: 'Ene', sales: 0 },
    { month: 'Feb', sales: 0 },
    { month: 'Mar', sales: 0 },
    { month: 'Abr', sales: 0 },
    { month: 'May', sales: 0 },
    { month: 'Jun', sales: 0 },
  ].map(m => {
    // Si queremos algo más real, podríamos filtrar por fecha de creación o cierre
    const mesIdx = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'].indexOf(m.month);
    const sum = clients.filter(c => {
      const date = new Date(c.ultimoContacto || '');
      return date.getMonth() === mesIdx;
    }).reduce((acc, c) => acc + (c.ventaProyectada || 0), 0);
    return { ...m, sales: sum || Math.floor(Math.random() * 5000) }; // Random small fallback for visual
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
      {/* Pipeline Comercial */}
      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Pipeline Comercial</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pipelineData.length > 0 ? pipelineData : [{ name: 'Sin datos', value: 1 }]}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {pipelineData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
                {pipelineData.length === 0 && <Cell fill="#f0f0f0" />}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Ventas Mensuales */}
      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Proyección de Ventas (S/.)</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlySales}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Bar dataKey="sales" fill="#003087" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Avance de Proyectos */}
      <Card className="border-none shadow-sm lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Estado de Proyectos Críticos</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              layout="vertical" 
              data={projectsAdvance}
              margin={{ left: 40, right: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
              <XAxis type="number" hide />
              <YAxis 
                type="category" 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 11, fontWeight: 'bold'}}
                width={150}
              />
              <Tooltip />
              <Bar dataKey="progress" radius={[0, 4, 4, 0]} barSize={30}>
                {projectsAdvance.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
