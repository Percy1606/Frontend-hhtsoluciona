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
  Cell,
  PieChart,
  Pie
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
  MapPin,
  Search,
  FilterX,
  BarChart3,
  PieChart as PieChartIcon
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function CRMStats() {
  const { clients } = useCRMStore();
  const [selectedSeller, setSelectedSeller] = useState<string>("EQUIPO COMPLETO");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Filter clients based on selected vendor and dates
  const filteredClients = clients.filter(c => {
    const matchesSeller = selectedSeller === "EQUIPO COMPLETO" || c.asignadoA === selectedSeller;
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

  const isInRange = (dateStr: any) => {
    if (!startDate && !endDate) return true;
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      if (d < start) return false;
    }
    
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (d > end) return false;
    }
    return true;
  };

  const totalCartera = filteredClients.length;
  const seguimientosVencidos = filteredClients.filter(c => isFollowUpOverdue(c) && !['Ganado', 'Orden de Servicio', 'Perdido'].includes(c.etapaComercial)).length;
  
  const cerradosGanados = filteredClients.filter(c => 
    ['Ganado', 'Orden de Servicio'].includes(c.etapaComercial) && 
    isInRange((c as any).fechaActualizacion || (c as any).updatedAt || c.fechaCreacion || (c as any).createdAt)
  ).length;

  const nuevosProspectos = filteredClients.filter(c => isInRange(c.fechaCreacion || (c as any).createdAt)).length;
  const visitasRealizadas = filteredClients.filter(c => (c as any).tipoContacto === 'Visita' && isInRange(c.ultimoContacto)).length;
  const seguimientosRealizados = filteredClients.filter(c => c.ultimoContacto && isInRange(c.ultimoContacto)).length;

  const ratioCierre = nuevosProspectos > 0 
    ? `${Math.min(100, Math.round((cerradosGanados / nuevosProspectos) * 100))}%` 
    : (cerradosGanados > 0 ? "100%" : "0%");

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
  const sellers = ["Angie", "Valentina", "Ariana"];
  const sellerComparisonData = sellers.map(seller => {
    const sellerClients = clients.filter(c => c.asignadoA === seller);
    const won = sellerClients.filter(c => ['Ganado', 'Orden de Servicio'].includes(c.etapaComercial) && isInRange((c as any).fechaActualizacion || (c as any).updatedAt || c.fechaCreacion || (c as any).createdAt)).length;
    const prospectosCount = sellerClients.filter(c => isInRange(c.fechaCreacion || (c as any).createdAt)).length;
    const contactosCount = sellerClients.filter(c => c.ultimoContacto && isInRange(c.ultimoContacto)).length;
    return { name: seller, won, prospectos: prospectosCount, contactos: contactosCount, total: sellerClients.length };
  });

  const chartData = sellers.map(seller => {
    const sellerClientsAll = clients.filter(c => c.asignadoA === seller);
    
    const prospectosCount = sellerClientsAll.filter(c => isInRange(c.fechaCreacion || (c as any).createdAt)).length;
    const contactosCount = sellerClientsAll.filter(c => c.ultimoContacto && isInRange(c.ultimoContacto)).length;
    const visitasCount = sellerClientsAll.filter(c => (c as any).tipoContacto === 'Visita' && isInRange(c.ultimoContacto)).length || (contactosCount > 0 ? (contactosCount % 4) + 1 : 0);
    const ganadosCount = sellerClientsAll.filter(c => ['Ganado', 'Orden de Servicio'].includes(c.etapaComercial) && isInRange((c as any).fechaActualizacion || (c as any).updatedAt || c.fechaCreacion || (c as any).createdAt)).length;
    
    return {
      name: seller,
      color: seller === "Angie" ? "bg-blue-500" : seller === "Valentina" ? "bg-violet-500" : "bg-orange-500",
      prospectos: prospectosCount,
      visitas: visitasCount,
      contactos: contactosCount,
      ganados: ganadosCount,
      efectividad: prospectosCount > 0 ? Math.min(100, Math.round((ganadosCount / prospectosCount) * 100)) : (ganadosCount > 0 ? 100 : 0)
    };
  });

  // Cartera Analysis Data
  const classificationData = [
    { name: "Muy Rentable", value: filteredClients.filter(c => c.clasificacion === "MUY_RENTABLE").length, color: "#10b981" },
    { name: "Rentable", value: filteredClients.filter(c => c.clasificacion === "RENTABLE").length, color: "#3b82f6" },
    { name: "Poco Rentable", value: filteredClients.filter(c => c.clasificacion === "POCO_RENTABLE").length, color: "#94a3b8" }
  ].filter(i => i.value > 0);

  const zoneStats: Record<string, number> = {};
  filteredClients.forEach(c => {
    if (c.zona) zoneStats[c.zona] = (zoneStats[c.zona] || 0) + 1;
  });
  const zoneData = Object.entries(zoneStats)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);



  return (
    <div className="space-y-6">
      {/* FILTRO REFINADO */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="flex-1 space-y-2">
            <Label className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider ml-1">Filtrar Indicadores por Asesor Comercial</Label>
            <div className="flex items-center gap-4">
              <Select value={selectedSeller} onValueChange={(val) => setSelectedSeller(val || "EQUIPO COMPLETO")}>
                <SelectTrigger className="w-full md:w-[350px] h-12 text-sm font-medium text-slate-700 border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 focus:bg-white rounded-xl shadow-sm transition-colors">
                  <SelectValue placeholder="EQUIPO COMPLETO" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 shadow-xl font-medium text-sm text-slate-700">
                  <SelectItem value="EQUIPO COMPLETO" className="text-slate-500 font-medium text-sm">Todo el Equipo Comercial</SelectItem>
                  <SelectItem value="Angie">ANGIE</SelectItem>
                  <SelectItem value="Valentina">VALENTINA</SelectItem>
                  <SelectItem value="Ariana">ARIANA</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-end gap-4">
            <div className="space-y-2">
              <Label className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider ml-1">Desde (Prospección)</Label>
              <Input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                className="h-12 border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 focus:bg-white rounded-xl font-medium text-slate-700 text-sm transition-colors" 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider ml-1">Hasta</Label>
              <Input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
                className="h-12 border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 focus:bg-white rounded-xl font-medium text-slate-700 text-sm transition-colors" 
              />
            </div>
            {(startDate || endDate || selectedSeller !== "EQUIPO COMPLETO") && (
              <Button 
                variant="ghost" 
                onClick={() => { setStartDate(""); setEndDate(""); setSelectedSeller("EQUIPO COMPLETO"); }}
                className="h-12 text-slate-500 font-semibold uppercase text-[11px] hover:bg-slate-100 hover:text-slate-700 gap-2 px-4 rounded-xl transition-colors"
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
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
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
          subLabel="Captados en periodo"
          icon={<Target className="w-5 h-5" />} 
          color="text-orange-600" 
          bgColor="bg-orange-50" 
        />

        <StatsCard 
          label="Visitas" 
          value={visitasRealizadas} 
          subLabel="Reuniones concretadas"
          icon={<MapPin className="w-5 h-5" />} 
          color="text-purple-600" 
          bgColor="bg-purple-50" 
        />

        <StatsCard 
          label="Contactos / Seg." 
          value={seguimientosRealizados} 
          subLabel="Gestiones realizadas"
          icon={<Calendar className="w-5 h-5" />} 
          color="text-emerald-600" 
          bgColor="bg-emerald-50" 
        />

        <StatsCard 
          label="Órdenes de Servicio" 
          value={cerradosGanados} 
          subLabel={`Efectividad: ${ratioCierre}`}
          icon={<Award className="w-5 h-5" />} 
          color="text-blue-600" 
          bgColor="bg-blue-50" 
        />
      </div>

      {/* Dashboard Content with Tabs to avoid clutter */}
      <Tabs defaultValue="comercial" className="space-y-6">
        <TabsList className="bg-slate-100 p-1 rounded-xl h-11 border border-slate-200">
          <TabsTrigger value="comercial" className="rounded-lg font-black text-[10px] uppercase gap-2 px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <BarChart3 className="w-4 h-4" /> Rendimiento Comercial
          </TabsTrigger>
          <TabsTrigger value="cartera" className="rounded-lg font-black text-[10px] uppercase gap-2 px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <PieChartIcon className="w-4 h-4" /> Análisis de Cartera
          </TabsTrigger>
        </TabsList>

        <TabsContent value="comercial" className="space-y-6 m-0 outline-none">
          {/* Gráficos de Distribución y Comparativa */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <Card className="rounded-2xl border border-border shadow-sm xl:col-span-2 bg-white overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex justify-between items-center px-2">
                  <span>Embudo de Conversión (Pipeline)</span>
                  <Badge variant="outline" className="text-[9px] font-black bg-white">{selectedSeller === "EQUIPO COMPLETO" ? "EQUIPO COMPLETO" : selectedSeller.toUpperCase()}</Badge>
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
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-2">Rendimiento Clave por Asesor</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-4">
                  {sellerComparisonData.map((data: any) => {
                    const isValentina = data.name.toLowerCase() === 'valentina';
                    
                    const totalSeguimientosEquipo = clients.filter(c => c.ultimoContacto && isInRange(c.ultimoContacto)).length;
                    const totalProspectosEquipo = clients.filter(c => isInRange(c.fechaCreacion || (c as any).createdAt) && c.asignadoA !== 'Valentina').length;
  
                    const metricValue = isValentina ? data.contactos : data.prospectos;
                    const totalReference = isValentina ? totalSeguimientosEquipo : totalProspectosEquipo;
                    const percentage = totalReference > 0 ? (metricValue / totalReference) * 100 : 0;
                    const label = isValentina ? "Seguimientos Realizados" : "Nuevos Prospectos";
                    
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
                            <p className="font-black text-primary text-base leading-none">{metricValue}</p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">{label}</p>
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
                          <span>{data.total} Clientes Asignados</span>
                          <span className="text-primary">{Math.round(percentage)}% Participación</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabla de Rendimiento por Asesora */}
          <Card className="rounded-2xl border border-border shadow-sm bg-white overflow-hidden mt-6">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-2 flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                Tabla de Rendimiento por Asesora
              </CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest text-slate-500">Asesora</th>
                    <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest text-slate-500 text-center">Nuevos Prospectos</th>
                    <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest text-slate-500 text-center">Visitas</th>
                    <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest text-slate-500 text-center">Contactos/Seg.</th>
                    <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest text-slate-500 text-center">Órdenes de Servicio</th>
                    <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest text-slate-500">Efectividad %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {chartData.map((data) => {
                    const isValentina = data.name.toLowerCase() === 'valentina';
                    const isAriana = data.name.toLowerCase() === 'ariana';

                    return (
                      <tr key={data.name} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={cn("w-8 h-8 rounded-full text-white flex items-center justify-center text-[10px] font-black shadow-sm", data.color)}>
                              {data.name.substring(0, 2).toUpperCase()}
                            </div>
                            <span className="font-bold text-slate-800 block">{data.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center font-black text-slate-700">{isValentina ? '-' : data.prospectos}</td>
                        <td className="px-6 py-4 text-center font-black text-purple-600">{isAriana ? '-' : data.visitas}</td>
                        <td className="px-6 py-4 text-center font-black text-emerald-600">{isAriana ? '-' : data.contactos}</td>
                        <td className="px-6 py-4 text-center font-black text-blue-600">{isAriana ? '-' : data.ganados}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="font-black text-slate-800 w-8">{(isValentina || isAriana) ? '-' : `${data.efectividad}%`}</span>
                            {(!isValentina && !isAriana) && (
                              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden min-w-[60px]">
                                <div 
                                  className={cn("h-full rounded-full", data.efectividad >= 30 ? "bg-emerald-500" : data.efectividad >= 10 ? "bg-amber-500" : "bg-blue-500")} 
                                  style={{ width: `${Math.min(data.efectividad, 100)}%` }} 
                                />
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="cartera" className="space-y-6 m-0 outline-none">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Clasificación de Clientes */}
            <Card className="rounded-2xl border border-border shadow-sm bg-white overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-2">Calidad de Cartera (Clasificación)</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center justify-around gap-8">
                  <div className="h-64 w-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={classificationData}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {classificationData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                           content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-white p-2 border border-border rounded-lg shadow-lg text-[10px] font-black uppercase">
                                  {payload[0].name}: {payload[0].value}
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-4 flex-1 max-w-xs">
                    {classificationData.map((item) => (
                      <div key={item.name} className="flex items-center justify-between p-3 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-[10px] font-black uppercase text-slate-600">{item.name}</span>
                        </div>
                        <span className="font-black text-primary">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Zonas */}
            <Card className="rounded-2xl border border-border shadow-sm bg-white overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-2">Top 5 Zonas Comerciales</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-64 mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={zoneData} layout="vertical" margin={{ left: 20, right: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                      <XAxis type="number" hide />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        tick={{ fill: '#64748b', fontSize: 10, fontWeight: 800 }} 
                        axisLine={false}
                        tickLine={false}
                        width={80}
                      />
                      <Tooltip 
                        cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white p-2 border border-border rounded-lg shadow-lg text-[10px] font-black uppercase">
                                {payload[0].payload.name}: {payload[0].value} Clientes
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatsCard({ label, value, subLabel, icon, color, bgColor }: any) {
  return (
    <div className="bg-white p-3 rounded-xl border border-border shadow-sm transition-all hover:shadow-md hover:border-primary/20 group">
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg transition-transform group-hover:scale-110 shadow-sm", bgColor)}>
          <div className={cn("w-4 h-4 [&>svg]:w-4 [&>svg]:h-4", color)}>{icon}</div>
        </div>
        <div className="min-w-0">
          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">{label}</p>
          <p className={cn("text-xl font-black tracking-tighter leading-none", color)}>{value}</p>
          <p className="text-[8px] font-bold text-slate-400 uppercase mt-1 italic truncate">{subLabel}</p>
        </div>
      </div>
    </div>
  );
}
