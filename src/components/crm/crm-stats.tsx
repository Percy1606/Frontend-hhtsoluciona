"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useCRMStore, isFollowUpOverdue } from "@/store/crm-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
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
  Users, 
  Target,
  Search,
  FilterX
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function CRMStats() {
  const { clients } = useCRMStore();
  const [selectedSeller, setSelectedSeller] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Filter clients based on selected vendor and dates
  const filteredClients = clients.filter(c => {
    const matchesSeller = selectedSeller === "all" || c.asignadoA === selectedSeller;
    if (!matchesSeller) return false;

    if (startDate || endDate) {
      const createdDate = new Date(c.fechaCreacion);
      
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (createdDate < start) return false;
      }
      
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (createdDate > end) return false;
      }
    }

    return true;
  });

  // Compute metrics
  const totalCartera = filteredClients.length;
  const seguimientosVencidos = filteredClients.filter(c => isFollowUpOverdue(c)).length;
  
  const cerradosGanados = filteredClients.filter(c => c.etapaComercial === "Ganado").length;
  const ratioCierre = totalCartera > 0 
    ? `${Math.round((cerradosGanados / totalCartera) * 100)}%` 
    : "0%";

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
  })).filter(item => item.value > 0);

  // Benchmarking Team
  const sellers = ["Angie", "Valentina", "Ariana", "Nicoll"];
  const sellerComparisonData = sellers.map(seller => {
    const sellerClients = clients.filter(c => c.asignadoA === seller);
    const won = sellerClients.filter(c => c.etapaComercial === "Ganado").length;
    return { name: seller, value: won, total: sellerClients.length };
  });

  // New prospects in selected range or last 7 days if no range
  const nuevosProspectos = filteredClients.filter(c => {
    if (startDate || endDate) {
      return c.etapaComercial === "Prospecto";
    } else {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const createdDate = new Date(c.fechaCreacion);
      return createdDate >= oneWeekAgo && c.etapaComercial === "Prospecto";
    }
  }).length;

  return (
    <div className="space-y-6">
      {/* FILTRO REFINADO */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="flex-1 space-y-2">
            <Label className="text-[10px] font-black uppercase text-primary tracking-widest ml-1">Filtrar Indicadores por Asesor Comercial</Label>
            <div className="flex items-center gap-4">
              <Select value={selectedSeller} onValueChange={(val) => setSelectedSeller(val || "all")}>
                <SelectTrigger className="w-full md:w-[350px] h-12 text-sm font-bold border-slate-200 bg-slate-50/30 focus:bg-white rounded-xl shadow-sm">
                  <SelectValue placeholder="EQUIPO COMPLETO" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 shadow-xl font-bold uppercase text-[10px]">
                  <SelectItem value="all" className="text-slate-400 font-bold uppercase text-[10px] italic">Todo el Equipo Comercial</SelectItem>
                  <SelectItem value="Angie">ANGIE</SelectItem>
                  <SelectItem value="Valentina">VALENTINA</SelectItem>
                  <SelectItem value="Ariana">ARIANA</SelectItem>
                  <SelectItem value="Nicoll">NICOLL</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-end gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-primary tracking-widest ml-1">Desde (Prospercción)</Label>
              <Input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                className="h-12 border-slate-200 bg-slate-50/30 focus:bg-white rounded-xl font-bold text-xs" 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-primary tracking-widest ml-1">Hasta</Label>
              <Input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
                className="h-12 border-slate-200 bg-slate-50/30 focus:bg-white rounded-xl font-bold text-xs" 
              />
            </div>
            {(startDate || endDate || selectedSeller !== "all") && (
              <Button 
                variant="ghost" 
                onClick={() => { setStartDate(""); setEndDate(""); setSelectedSeller("all"); }}
                className="h-12 text-error font-black uppercase text-[10px] hover:bg-red-50 gap-2 px-4 rounded-xl"
              >
                <FilterX className="w-4 h-4" /> Limpiar Filtros
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 bg-accent/5 px-4 py-2 rounded-xl border border-accent/10 w-fit">
            <TrendingUp className="w-4 h-4 text-accent" />
            <span className="text-[10px] font-black text-accent uppercase tracking-tighter">Analítica en Tiempo Real</span>
        </div>
      </div>

      {/* Grid de Metricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          label="Total Cartera" 
          value={totalCartera} 
          subLabel="Prospectos Asignados"
          icon={<Users className="w-5 h-5" />} 
          color="text-primary" 
          bgColor="bg-primary/5" 
        />
        
        <StatsCard 
          label="Nuevos Prospectos" 
          value={nuevosProspectos} 
          subLabel="Captados esta semana"
          icon={<Target className="w-5 h-5" />} 
          color="text-orange-600" 
          bgColor="bg-orange-50" 
        />

        <StatsCard 
          label="Seguimientos" 
          value={seguimientosVencidos} 
          subLabel="Vencidos / Críticos"
          icon={<Calendar className="w-5 h-5" />} 
          color="text-error" 
          bgColor="bg-red-50" 
        />

        <StatsCard 
          label="Cierres Exitosos" 
          value={cerradosGanados} 
          subLabel={`Efectividad: ${ratioCierre}`}
          icon={<Award className="w-5 h-5" />} 
          color="text-success" 
          bgColor="bg-green-50" 
        />
      </div>

      {/* Gráficos de Distribución y Comparativa */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="rounded-2xl border border-border shadow-sm xl:col-span-2 bg-white overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex justify-between items-center px-2">
              <span>Distribución del Pipeline Comercial</span>
              <Badge variant="outline" className="text-[9px] font-black bg-white">{selectedSeller === "all" ? "EQUIPO COMPLETO" : selectedSeller.toUpperCase()}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {funnelData.length > 0 ? (
              <div className="h-80 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnelData} margin={{ left: -10, right: 10, top: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: '#64748b', fontSize: 8, fontWeight: 900 }} 
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
                              <div className="h-px bg-slate-100 my-2" />
                              <p className="text-primary mt-1 uppercase text-[9px]">Empresas en etapa: <span className="font-black text-base ml-1">{payload[0].value}</span></p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={32}>
                      {funnelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center border-2 border-dashed border-slate-100 rounded-3xl">
                <p className="text-xs font-black text-slate-300 uppercase tracking-widest italic">Sin datos comerciales registrados</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border shadow-sm xl:col-span-1 bg-white overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-2">Rendimiento por Asesor</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-4">
              {sellerComparisonData.map((data) => {
                const totalWon = clients.filter(c => c.etapaComercial === "Ganado").length;
                const percentage = totalWon > 0 ? (data.value / totalWon) * 100 : 0;
                
                return (
                  <div key={data.name} className="space-y-2 p-4 rounded-2xl border border-slate-100 hover:border-primary/20 transition-all group shadow-sm bg-slate-50/30">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-black group-hover:scale-110 transition-transform">
                          {data.name[0]}
                        </div>
                        <span className="font-black text-slate-700 uppercase tracking-tight">{data.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-primary text-base leading-none">{data.value}</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">Ventas Ganadas</p>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-1000",
                          data.name === "Angie" ? "bg-blue-500" :
                          data.name === "Valentina" ? "bg-violet-500" :
                          data.name === "Ariana" ? "bg-orange-500" : "bg-teal-500"
                        )}
                        style={{ width: `${Math.max(5, percentage)}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[9px] font-black text-slate-400 uppercase">
                      <span>{data.total} Clientes Totales</span>
                      <span className="text-primary">{Math.round(percentage)}% Participación</span>
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

function StatsCard({ label, value, subLabel, icon, color, bgColor }: any) {
    return (
      <div className="bg-white p-5 rounded-2xl border border-border shadow-sm transition-all hover:shadow-md hover:border-primary/20 group">
        <div className="flex items-center gap-4">
          <div className={cn("p-3 rounded-xl transition-transform group-hover:scale-110 shadow-sm", bgColor)}>
            <div className={cn("w-6 h-6", color)}>{icon}</div>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1.5">{label}</p>
            <p className={cn("text-3xl font-black tracking-tighter leading-none", color)}>{value}</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase mt-2 italic truncate">{subLabel}</p>
          </div>
        </div>
      </div>
    );
}
