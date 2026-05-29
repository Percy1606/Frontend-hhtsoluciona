"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useCRMStore, getDaysSinceContact, isFollowUpOverdue } from "@/store/crm-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend
} from "recharts";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  User, 
  TrendingUp, 
  Award, 
  Calendar, 
  Flame, 
  Users, 
  DollarSign 
} from "lucide-react";

export function CRMStats() {
  const { clients } = useCRMStore();
  const [selectedSeller, setSelectedSeller] = useState<string>("all");

  // Filter clients for general metrics based on selected vendor
  const filteredClients = selectedSeller === "all" 
    ? clients 
    : clients.filter(c => c.asignadoA === selectedSeller);

  // Compute metrics
  const totalCartera = filteredClients.length;
  const leadsCalientes = filteredClients.filter(c => c.temperatura === "Caliente" || c.temperatura === "Muy Caliente").length;
  
  const seguimientosVencidos = filteredClients.filter(c => isFollowUpOverdue(c)).length;
  
  const cerradosGanados = filteredClients.filter(c => c.etapaComercial === "Ganado").length;
  const ratioCierre = totalCartera > 0 
    ? `${Math.round((cerradosGanados / totalCartera) * 100)}%` 
    : "0%";

  const totalMontoEstimado = filteredClients.reduce((sum, c) => sum + (c.montoEstimado || 0), 0);
  const totalVentaProyectada = filteredClients.reduce((sum, c) => sum + (c.ventaProyectada || 0), 0);

  // Data for the Funnel Chart (11 stages)
  const funnelStages = [
    { name: "Prospecto", color: "#94a3b8" },
    { name: "Contactado", color: "#06b6d4" },
    { name: "Llamada Realizada", color: "#0ea5e9" },
    { name: "Visita Agendada", color: "#6366f1" },
    { name: "Inspección Realizada", color: "#f59e0b" },
    { name: "Cotización Enviada", color: "#8b5cf6" },
    { name: "Seguimiento", color: "#ec4899" },
    { name: "Negociación", color: "#f97316" },
    { name: "Orden de Servicio", color: "#059669" },
    { name: "Ganado", color: "#22c55e" },
    { name: "Perdido", color: "#ef4444" }
  ];

  const funnelData = funnelStages.map(stage => ({
    name: stage.name,
    value: filteredClients.filter(c => c.etapaComercial === stage.name).length,
    color: stage.color
  })).filter(item => item.value > 0); // Only show stages with items for a cleaner look

  // Comparison Data: Sales volume per vendor (always computed based on all clients)
  const sellers = ["Angi", "Valentina", "Ariana", "Nicol"];
  const sellerComparisonData = sellers.map(seller => {
    const sellerClients = clients.filter(c => c.asignadoA === seller);
    const amount = sellerClients.reduce((sum, c) => sum + (c.ventaProyectada || 0), 0);
    const count = sellerClients.length;
    return { name: seller, monto: amount, clientes: count };
  });

  return (
    <div className="space-y-6">
      {/* Selector de Vendedor */}
      <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-border shadow-sm">
        <span className="text-xs font-black text-primary uppercase tracking-wider flex items-center gap-1.5">
          <User className="w-4 h-4 text-accent" /> Filtro de Indicadores por Vendedor
        </span>
        <Select value={selectedSeller} onValueChange={(val) => setSelectedSeller(val || "all")}>
          <SelectTrigger className="w-[200px] h-8 text-xs font-bold border-slate-300">
            <SelectValue placeholder="Seleccionar Vendedor" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="all">Todos los Vendedores</SelectItem>
            <SelectItem value="Angi">Angi</SelectItem>
            <SelectItem value="Valentina">Valentina</SelectItem>
            <SelectItem value="Ariana">Ariana</SelectItem>
            <SelectItem value="Nicol">Nicol</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grid de Metricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <Card className="border-none shadow-sm bg-primary text-white col-span-1">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Total Cartera</p>
              <Users className="w-4 h-4 text-white/50" />
            </div>
            <p className="text-3xl font-black mt-1.5">{totalCartera}</p>
            <p className="text-[9px] font-bold mt-2 text-white/40 uppercase">Clientes Asignados</p>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-sm col-span-1 bg-white">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Leads Calientes</p>
              <Flame className="w-4 h-4 text-orange-500" />
            </div>
            <p className="text-3xl font-black mt-1.5 text-orange-600">{leadsCalientes}</p>
            <p className="text-[9px] font-bold mt-2 text-muted-foreground/60 uppercase">Alta Temperatura</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm col-span-1 bg-white">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Seguimientos</p>
              <Calendar className="w-4 h-4 text-error" />
            </div>
            <p className="text-3xl font-black mt-1.5 text-error">{seguimientosVencidos}</p>
            <p className="text-[9px] font-bold mt-2 text-error/60 uppercase">Vencidos o Pendientes</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm col-span-1 bg-white">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Efectividad</p>
              <Award className="w-4 h-4 text-success" />
            </div>
            <p className="text-3xl font-black mt-1.5 text-success">{ratioCierre}</p>
            <p className="text-[9px] font-bold mt-2 text-success/60 uppercase">Ratio de Cierre</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-accent text-white col-span-2">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/70">Venta Proyectada</p>
              <DollarSign className="w-4 h-4 text-white/50" />
            </div>
            <p className="text-2xl font-black mt-1">{new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 }).format(totalVentaProyectada)}</p>
            <p className="text-[9px] font-semibold mt-1 text-white/60">
              Valor Total Estimado: {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 }).format(totalMontoEstimado)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos de Distribución y Comparativa */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Distribución del Pipeline Comercial */}
        <Card className="border-none shadow-sm xl:col-span-2 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-500 flex justify-between items-center">
              <span>Distribución del Pipeline</span>
              <span className="text-[10px] font-bold text-slate-400 normal-case">
                {selectedSeller === "all" ? "Todos los vendedores" : `Vendedor: ${selectedSeller}`}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {funnelData.length > 0 ? (
              <div className="h-64 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnelData} margin={{ left: -10, right: 10, top: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} 
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fill: '#64748b', fontSize: 10 }}
                      axisLine={false} 
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-3 border border-border rounded-xl shadow-xl text-xs font-bold">
                              <p className="text-slate-800 uppercase text-[10px] font-black">{payload[0].payload.name}</p>
                              <p className="text-primary mt-1">Clientes: <span className="font-black">{payload[0].value}</span></p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={28}>
                      {funnelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center border border-dashed border-slate-200 rounded-xl">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Sin datos comerciales registrados</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Comparación de Ventas Proyectadas por Vendedor */}
        <Card className="border-none shadow-sm xl:col-span-1 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-500">Benchmark del Equipo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {sellerComparisonData.map((data, idx) => {
                const totalTeamVolume = clients.reduce((sum, c) => sum + (c.ventaProyectada || 0), 0);
                const percentage = totalTeamVolume > 0 ? (data.monto / totalTeamVolume) * 100 : 0;
                
                return (
                  <div key={data.name} className="space-y-1.5 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary">
                          {data.name[0]}
                        </div>
                        <span className="font-bold text-slate-700">{data.name}</span>
                      </div>
                      <span className="font-black text-primary">
                        {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 }).format(data.monto)}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          data.name === "Angi" ? "bg-blue-500" :
                          data.name === "Valentina" ? "bg-violet-500" :
                          data.name === "Ariana" ? "bg-orange-500" : "bg-teal-500"
                        )}
                        style={{ width: `${Math.max(3, percentage)}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase">
                      <span>{data.clientes} {data.clientes === 1 ? "cliente" : "clientes"}</span>
                      <span>{Math.round(percentage)}% del total</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
