"use client";

import { useState, useMemo } from "react";
import { cn, getPeruDateString } from "@/lib/utils";
import { useCRMStore, isFollowUpOverdue } from "@/store/crm-store";
import { api } from "@/lib/api";
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
  PieChart as PieChartIcon,
  Clock
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const parseSafeDate = (dateVal: any): Date | null => {
  if (!dateVal) return null;
  if (dateVal instanceof Date) return dateVal;
  
  let str = String(dateVal).trim();
  if (!str) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    str = `${str}T00:00:00`;
  } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    const parts = str.split('/');
    str = `${parts[2]}-${parts[1]}-${parts[0]}T00:00:00`;
  } else if (/^\d{2}-\d{2}-\d{4}$/.test(str)) {
    const parts = str.split('-');
    str = `${parts[2]}-${parts[1]}-${parts[0]}T00:00:00`;
  }

  const d = new Date(str);
  if (isNaN(d.getTime())) return null;
  return d;
};

const getRealCreator = (c: any) => {
  let creator = c.creadoPor;
  if (!creator) {
    const interacciones = c.historialInteracciones || c.interacciones || [];
    if (interacciones.length > 0) {
      const sorted = [...interacciones].sort((a: any, b: any) => new Date(a.fecha || a.createdAt).getTime() - new Date(b.fecha || b.createdAt).getTime());
      if (sorted[0]?.usuario) creator = sorted[0].usuario;
    }
  }
  if (!creator) {
    creator = c.asignadoA;
  }
  const normalized = creator?.toLowerCase().trim();
  if (normalized === 'valentina') return 'Ariana'; // Valentina no prospecta, pertenecen a Ariana
  return creator || c.asignadoA;
};

const getCloseDate = (c: any) => {
  const interacciones = c.historialInteracciones || c.interacciones || [];
  if (interacciones.length > 0) {
    const wonInt = interacciones.find((i: any) => 
      i.accion === 'Cotización Ganada' || 
      i.tipo === 'Venta' ||
      (i.observaciones && i.observaciones.toLowerCase().includes('ha pasado a etapa "ganado"'))
    );
    if (wonInt) return wonInt.fecha || wonInt.createdAt;
  }
  return c.fechaCreacion || c.createdAt;
};

export function CRMStats() {
  const { clients } = useCRMStore();
  const [selectedSeller, setSelectedSeller] = useState<string>("EQUIPO COMPLETO");
  const [prospectosModalOpen, setProspectosModalOpen] = useState(false);
  const [prospectosList, setProspectosList] = useState<any[]>([]);
  const [contactosModalOpen, setContactosModalOpen] = useState(false);
  const [contactosList, setContactosList] = useState<any[]>([]);
  const [ganadosModalOpen, setGanadosModalOpen] = useState(false);
  const [ganadosList, setGanadosList] = useState<any[]>([]);
  const [visitasModalOpen, setVisitasModalOpen] = useState(false);
  const [visitasList, setVisitasList] = useState<any[]>([]);
  const [dateRangeType, setDateRangeType] = useState<string>("all");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");

  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    if (dateRangeType === "today") {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      return { startDate: start, endDate: end };
    }
    if (dateRangeType === "yesterday") {
      const start = new Date();
      start.setDate(now.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setDate(now.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      return { startDate: start, endDate: end };
    }
    if (dateRangeType === "week") {
      const start = new Date();
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return { startDate: start, endDate: end };
    }
    if (dateRangeType === "month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      return { startDate: start, endDate: end };
    }
    if (dateRangeType === "30days") {
      const start = new Date();
      start.setDate(now.getDate() - 30);
      start.setHours(0,0,0,0);
      return { startDate: start, endDate: now };
    }
    if (dateRangeType === "year") {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      return { startDate: start, endDate: end };
    }
    if (dateRangeType === "custom" && customStartDate && customEndDate) {
      const start = new Date(`${customStartDate}T00:00:00`);
      start.setHours(0,0,0,0);
      const end = new Date(`${customEndDate}T23:59:59`);
      end.setHours(23,59,59,999);
      return { startDate: start, endDate: end };
    }
    return { startDate: null, endDate: null };
  }, [dateRangeType, customStartDate, customEndDate]);

  // Filter clients based on selected vendor and dates
  const filteredClients = clients.filter(c => {
    const matchesSeller = selectedSeller === "EQUIPO COMPLETO" || c.asignadoA === selectedSeller;
    if (!matchesSeller) return false;

    if (startDate || endDate) {
      const createdDate = parseSafeDate(c.fechaCreacion);
      if (!createdDate) return false;
      
      if (startDate) {
        if (createdDate < startDate) return false;
      }
      
      if (endDate) {
        if (createdDate > endDate) return false;
      }
    }

    return true;
  });

  const isInRange = (dateStr: any) => {
    if (!startDate && !endDate) return true;
    if (!dateStr) return false;
    const d = parseSafeDate(dateStr);
    if (!d) return false;
    
    if (startDate) {
      if (d < startDate) return false;
    }
    
    if (endDate) {
      if (d > endDate) return false;
    }
    return true;
  };

  const totalCartera = filteredClients.length;
  const seguimientosVencidos = filteredClients.filter(c => isFollowUpOverdue(c) && !['Ganado', 'Orden de Servicio', 'Perdido'].includes(c.etapaComercial)).length;
  
  const cerradosGanados = filteredClients.filter(c => 
    ['Ganado', 'Orden de Servicio'].includes(c.etapaComercial) && 
    isInRange(getCloseDate(c))
  ).length;

  const nuevosProspectos = clients.filter(c => {
    const creador = getRealCreator(c);
    const matchesSeller = selectedSeller === "EQUIPO COMPLETO" || creador?.toLowerCase().includes(selectedSeller.toLowerCase().trim());
    return matchesSeller && isInRange(c.fechaCreacion || (c as any).createdAt);
  }).length;
  const visitasRealizadas = clients.reduce((acc, c) => {
    const interacciones = c.historialInteracciones || (c as any).interacciones || [];
    const visitas = interacciones.filter((i: any) => {
      if (!i.tipo?.toLowerCase().includes('visit') || !isInRange(i.fecha || i.createdAt)) return false;
      if (selectedSeller !== "EQUIPO COMPLETO") {
        const isOwner = c.asignadoA?.toLowerCase().trim() === selectedSeller.toLowerCase().trim();
        const isCreator = i.usuario?.toLowerCase().includes(selectedSeller.toLowerCase().trim());
        const belongsToSeller = i.usuario ? isCreator : isOwner;
        if (!belongsToSeller) return false;
      }
      return true;
    });
    return acc + visitas.length;
  }, 0);

  const seguimientosRealizados = clients.reduce((acc, c) => {
    const interacciones = c.historialInteracciones || (c as any).interacciones || [];
    const seguimientos = interacciones.filter((i: any) => {
      if (i.tipo?.toLowerCase().includes('visit') || !isInRange(i.fecha || i.createdAt)) return false;
      const hasText = !!(i.comentario || i.notas || i.observaciones);
      if (!hasText) return false;
      if (selectedSeller !== "EQUIPO COMPLETO") {
        const isOwner = c.asignadoA?.toLowerCase().trim() === selectedSeller.toLowerCase().trim();
        const isCreator = i.usuario?.toLowerCase().includes(selectedSeller.toLowerCase().trim());
        const belongsToSeller = i.usuario ? isCreator : isOwner;
        if (!belongsToSeller) return false;
      }
      return true;
    });
    return acc + seguimientos.length;
  }, 0);

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

  const funnelData = funnelStages.map((stage, index) => {
    return {
      name: stage.name,
      value: filteredClients.filter(c => {
        if (stage.name === 'Perdido') return c.etapaComercial === 'Perdido';
        const currentIdx = funnelStages.findIndex(s => s.name === c.etapaComercial);
        if (currentIdx === -1) return false;
        if (c.etapaComercial === 'Perdido') return index === 0; // Cuenta como prospecto (índice 0) al menos
        return currentIdx >= index; // Acumulativo
      }).length,
      color: stage.color
    };
  }).filter(item => item.value > 0);

  // Benchmarking Team
  const sellers = [
    { name: 'Angie', color: 'bg-blue-600', role: 'Asesora' },
    { name: 'Valentina', color: 'bg-violet-600', role: 'Asesora' },
    { name: 'Ariana', color: 'bg-orange-600', role: 'Asesora' },
  ];

  const sellerComparisonData = sellers.map(seller => {
    const sellerClients = clients.filter(c => c.asignadoA?.toLowerCase().trim() === seller.name.toLowerCase().trim());
    const won = sellerClients.filter(c => ['Ganado', 'Orden de Servicio'].includes(c.etapaComercial) && isInRange(getCloseDate(c))).length;
    const prospectosCount = clients.filter(c => getRealCreator(c)?.toLowerCase().includes(seller.name.toLowerCase().trim()) && isInRange(c.fechaCreacion || (c as any).createdAt)).length;
    const contactosCount = clients.reduce((acc, c) => {
      const interacciones = c.historialInteracciones || (c as any).interacciones || [];
      const validInts = interacciones.filter((i: any) => {
        const isVisit = i.tipo?.toLowerCase().includes('visit');
        if (isVisit || !isInRange(i.fecha || i.createdAt)) return false;
        const hasText = !!(i.comentario || i.notas || i.observaciones);
        if (!hasText) return false;
        const isOwner = c.asignadoA?.toLowerCase().trim() === seller.name.toLowerCase().trim();
        const isCreator = i.usuario?.toLowerCase().includes(seller.name.toLowerCase().trim());
        return i.usuario ? isCreator : isOwner;
      });
      return acc + validInts.length;
    }, 0);
    return { name: seller.name, won, prospectos: prospectosCount, contactos: contactosCount, total: sellerClients.length };
  });

  const chartData = sellers.map(seller => {
    const contactosPeriodoList = clients.reduce((acc: any[], c: any) => {
      const interacciones = c.historialInteracciones || c.interacciones || [];
      
      interacciones.forEach((int: any) => {
        const isOwner = c.asignadoA?.toLowerCase().trim() === seller.name.toLowerCase().trim();
        const isCreator = int.usuario?.toLowerCase().includes(seller.name.toLowerCase().trim());
        
        const belongsToSeller = int.usuario ? isCreator : isOwner;
        const hasText = !!(int.comentario || int.notas || int.observaciones);
        const isVisit = int.tipo?.toLowerCase().includes('visit');
        
        if (belongsToSeller && (hasText || isVisit)) {
          if (isInRange(int.fecha || int.createdAt)) {
            acc.push({ ...int, clienteNombre: c.empresa || c.nombre, esLegacy: false });
          }
        }
      });
      
      return acc;
    }, []).sort((a: any, b: any) => new Date(b.fecha || b.createdAt).getTime() - new Date(a.fecha || a.createdAt).getTime());

    const contactosHoyList = clients.reduce((acc: any[], c: any) => {
      const interacciones = c.historialInteracciones || c.interacciones || [];
      const hoyStr = getPeruDateString();
      
      interacciones.forEach((int: any) => {
        const isOwner = c.asignadoA?.toLowerCase().trim() === seller.name.toLowerCase().trim();
        const isCreator = int.usuario?.toLowerCase().includes(seller.name.toLowerCase().trim());
        
        const belongsToSeller = int.usuario ? isCreator : isOwner;
        const hasText = !!(int.comentario || int.notas || int.observaciones);
        const isVisit = int.tipo?.toLowerCase().includes('visit');
        
        if (belongsToSeller && (hasText || isVisit)) {
          const d = parseSafeDate(int.fecha || int.createdAt);
          if (d && getPeruDateString(d) === hoyStr) {
            acc.push({ ...int, clienteNombre: c.empresa || c.nombre, esLegacy: false });
          }
        }
      });
      
      return acc;
    }, []);

    const contactosPeriodoTotal = contactosPeriodoList.filter((int: any) => !int.tipo?.toLowerCase().includes('visit'));
    const contactosCount = contactosPeriodoTotal.filter((int: any) => int.tipo !== 'No Contesta').length;
    const fallidosCount = contactosPeriodoTotal.filter((int: any) => int.tipo === 'No Contesta').length;
    
    // Calcular Clientes Unicos Atendidos
    const clientesAtendidosIds = new Set(
      contactosPeriodoTotal
        .filter((int: any) => int.tipo !== 'No Contesta')
        .map((int: any) => int.clienteId || int.clienteNombre)
    );
    const clientesAtendidosCount = clientesAtendidosIds.size;

    const contactosHoyListFiltrados = contactosHoyList.filter((int: any) => !int.tipo?.toLowerCase().includes('visit'));
    const contactosHoy = contactosHoyListFiltrados.filter((int: any) => int.tipo !== 'No Contesta').length;

    const prospectosCount = clients.filter((c: any) => {
      const creador = getRealCreator(c);
      return creador?.toLowerCase().includes(seller.name.toLowerCase().trim()) && isInRange(c.fechaCreacion || (c as any).createdAt);
    }).length;
    const prospectosHoy = clients.filter((c: any) => {
      const creador = getRealCreator(c);
      if (!creador?.toLowerCase().includes(seller.name.toLowerCase().trim())) return false;
      return c.fechaCreacion?.startsWith(getPeruDateString());
    }).length;

    const visitasCount = contactosPeriodoList.filter((int: any) => int.tipo?.toLowerCase().includes('visit')).length;
    
    const ganadosCount = clients.filter((c: any) => c.asignadoA === seller.name && ['Ganado', 'Orden de Servicio'].includes(c.etapaComercial) && isInRange(getCloseDate(c))).length;

    const isValentina = seller.name.toLowerCase() === 'valentina';
    const isAriana = seller.name.toLowerCase() === 'ariana';
    
    const meta = 15;
    let progreso = 0;
    if (isAriana) {
      progreso = prospectosCount;
    } else if (isValentina) {
      progreso = contactosCount + visitasCount;
    } else {
      progreso = prospectosCount + contactosCount + visitasCount;
    }
    const efectividad = Math.min(100, Math.round((progreso / meta) * 100));

    return {
      name: seller.name,
      color: seller.color,
      role: seller.role,
      prospectos: prospectosCount,
      prospectosHoy,
      visitas: visitasCount,
      contactos: contactosCount,
      fallidos: fallidosCount,
      clientesAtendidos: clientesAtendidosCount,
      contactosHoy,
      contactosPeriodoList,
      ganados: ganadosCount,
      efectividad
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
              <Label className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider ml-1 flex items-center gap-2">
                <Calendar className="w-3 h-3 text-slate-400" />
                Período de Análisis
              </Label>
              <Select value={dateRangeType} onValueChange={(val) => setDateRangeType(val || "all")}>
                <SelectTrigger className="w-[180px] h-12 text-sm font-medium border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 focus:bg-white rounded-xl shadow-sm transition-colors text-slate-700">
                  <SelectValue placeholder="Seleccionar Período">
                    {dateRangeType === "all" && "Todo el Historial"}
                    {dateRangeType === "today" && "Hoy"}
                    {dateRangeType === "yesterday" && "Ayer"}
                    {dateRangeType === "week" && "Esta Semana"}
                    {dateRangeType === "month" && "Este Mes"}
                    {dateRangeType === "30days" && "Últimos 30 Días"}
                    {dateRangeType === "year" && "Este Año"}
                    {dateRangeType === "custom" && "Rango Personalizado"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 shadow-xl font-medium text-sm text-slate-700">
                  <SelectItem value="all">Todo el Historial</SelectItem>
                  <SelectItem value="today">Hoy</SelectItem>
                  <SelectItem value="yesterday">Ayer</SelectItem>
                  <SelectItem value="week">Esta Semana</SelectItem>
                  <SelectItem value="month">Este Mes</SelectItem>
                  <SelectItem value="30days">Últimos 30 Días</SelectItem>
                  <SelectItem value="year">Este Año</SelectItem>
                  <SelectItem value="custom">Rango Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {dateRangeType === "custom" && (
              <div className="flex items-center gap-2 animate-in fade-in duration-300">
                <input
                  type="date"
                  className="h-12 px-3 border border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 focus:bg-white rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary text-slate-700"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                />
                <span className="text-slate-400 font-bold">-</span>
                <input
                  type="date"
                  className="h-12 px-3 border border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 focus:bg-white rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary text-slate-700"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                />
              </div>
            )}

            {(dateRangeType !== "all" || selectedSeller !== "EQUIPO COMPLETO") && (
              <Button 
                variant="ghost" 
                onClick={() => { setDateRangeType("all"); setSelectedSeller("EQUIPO COMPLETO"); }}
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
                    
                    const metricValue = isValentina ? data.contactos : data.prospectos;
                    const meta = 15;
                    const percentage = Math.min((metricValue / meta) * 100, 100);
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
                          <span>{data.total} Cuentas en Cartera</span>
                          <span className="text-primary">{Math.round(percentage)}% Efectividad</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* METAS DEL PERIODO */}
          <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-800">Rendimiento del Periodo</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {chartData.map((data, idx) => {
                const isValentina = data.name.toLowerCase() === 'valentina';
                const isAriana = data.name.toLowerCase() === 'ariana';
                const meta = 15;
                
                let avance = 0;
                let labelTipo = "";
                
                if (isAriana) {
                  avance = data.prospectos;
                  labelTipo = "Nuevos Prospectos";
                } else if (isValentina) {
                  avance = data.contactos + data.visitas;
                  labelTipo = "Seguimientos y Visitas";
                } else {
                  avance = data.prospectos + data.contactos + data.visitas;
                  labelTipo = "Prospectos, Seguim. y Visitas";
                }
                
                const porcentaje = Math.min((avance / meta) * 100, 100);
                const isSuccess = avance >= meta;
                return (
                  <div key={idx} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 relative overflow-hidden">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold uppercase text-slate-700">{data.name}</span>
                      <Badge className={cn("text-[9px] font-bold border-none uppercase", isSuccess ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700")}>
                        {avance} / {meta}
                      </Badge>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 mb-1">
                      <div className={cn("h-2 rounded-full transition-all duration-1000", isSuccess ? "bg-emerald-500" : "bg-amber-500")} style={{ width: `${porcentaje}%` }}></div>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-[9px] text-slate-500 font-medium">{labelTipo}</span>
                      <span className="text-[9px] text-slate-500 font-medium">Progreso: {Math.round(porcentaje)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
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
                    <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest text-slate-500 text-center">Seg. Efectivos</th>
                    <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest text-slate-500 text-center">Sin Comunicación</th>
                    <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest text-slate-500 text-center">Clientes Atendidos</th>
                    <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest text-slate-500 text-center">Órdenes de Servicio</th>
                    <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest text-slate-500">Efectividad %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {chartData.map((data) => {
                    const isValentina = data.name.toLowerCase() === 'valentina';
                    const isAriana = data.name.toLowerCase() === 'ariana';
                    
                    const clientesGanados = clients.filter((c: any) => c.asignadoA?.toLowerCase().trim() === data.name.toLowerCase().trim() && ['Ganado', 'Orden de Servicio'].includes(c.etapaComercial) && isInRange(getCloseDate(c)));
                    const cierresNames = clientesGanados.map((c: any) => c.empresa || c.nombre).join(', ') || 'Sin cierres';

                    return (
                      <tr key={data.name} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={cn("w-8 h-8 rounded-full text-white flex items-center justify-center text-[10px] font-black shadow-sm shrink-0", data.color)}>
                              {data.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-800 leading-tight">{data.name}</span>
                              <span className="text-[9px] text-slate-400 font-bold uppercase">{data.role}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center font-black text-slate-700">
                          {isValentina ? '-' : (
                            <div className="flex items-center justify-center gap-1">
                              {data.prospectos}
                              {data.prospectos > 0 && (
                                <Badge 
                                  className="bg-slate-100 text-slate-700 border-none px-1.5 py-0 h-5 text-[9px] hover:bg-slate-200 cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const prospectosPeriodoList = clients.filter((c: any) => {
                                      const creador = getRealCreator(c);
                                      return creador?.toLowerCase().includes(data.name.toLowerCase().trim()) && isInRange(c.fechaCreacion || (c as any).createdAt);
                                    });
                                    setProspectosList(prospectosPeriodoList);
                                    setProspectosModalOpen(true);
                                  }}
                                >
                                  Ver
                                </Badge>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center font-black text-purple-600">
                          {isAriana ? '-' : (
                            <div className="flex items-center justify-center gap-1">
                              {data.visitas}
                              {data.visitas > 0 && (
                                <Badge 
                                  className="bg-purple-100 text-purple-700 border-none px-1.5 py-0 h-5 text-[9px] hover:bg-purple-200 cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const visitasPeriodoList = data.contactosPeriodoList?.filter((int: any) => int.tipo?.toLowerCase().includes('visit')) || [];
                                    setVisitasList(visitasPeriodoList);
                                    setVisitasModalOpen(true);
                                  }}
                                >
                                  Ver
                                </Badge>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center font-black text-emerald-600">
                          {isAriana ? '-' : (
                            <div className="flex items-center justify-center gap-1">
                              {data.contactos}
                              {data.contactos > 0 && (
                                <Badge 
                                  className="bg-emerald-100 text-emerald-700 border-none px-1.5 py-0 h-5 text-[9px] hover:bg-emerald-200 cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setContactosList(data.contactosPeriodoList?.filter((int: any) => !int.tipo?.toLowerCase().includes('visit')) || []);
                                    setContactosModalOpen(true);
                                  }}
                                >
                                  Ver
                                </Badge>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center font-black text-red-500">
                          {isAriana ? '-' : (
                            <div className="flex items-center justify-center gap-1">
                              {data.fallidos}
                              {data.fallidos > 0 && (
                                <Badge 
                                  className="bg-red-100 text-red-700 border-none px-1.5 py-0 h-5 text-[9px] hover:bg-red-200 cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setContactosList(data.contactosPeriodoList?.filter((int: any) => int.tipo === 'No Contesta') || []);
                                    setContactosModalOpen(true);
                                  }}
                                >
                                  Ver
                                </Badge>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center font-black text-blue-600">
                          {isAriana ? '-' : (
                            <div className="flex items-center justify-center gap-1">
                              {data.clientesAtendidos}
                              {data.clientesAtendidos > 0 && (
                                <Badge 
                                  className="bg-blue-100 text-blue-700 border-none px-1.5 py-0 h-5 text-[9px] hover:bg-blue-200 cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setContactosList(data.contactosPeriodoList?.filter((int: any) => int.tipo !== 'No Contesta') || []);
                                    setContactosModalOpen(true);
                                  }}
                                >
                                  Ver
                                </Badge>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center font-black text-blue-600" title={cierresNames}>
                          {isAriana ? '-' : (
                            <div className="flex flex-col items-center">
                              <div className="flex items-center justify-center gap-1">
                                <span>{data.ganados}</span>
                                {data.ganados > 0 && (
                                  <Badge 
                                    className="bg-blue-100 text-blue-700 border-none px-1.5 py-0 h-5 text-[9px] hover:bg-blue-200 cursor-pointer"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setGanadosList(clientesGanados);
                                      setGanadosModalOpen(true);
                                    }}
                                  >
                                    Ver
                                  </Badge>
                                )}
                              </div>
                              {data.ganados > 0 && (
                                <span className="text-[8px] text-slate-400 font-bold uppercase truncate max-w-[100px] mt-0.5">{cierresNames}</span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="font-black text-slate-800 w-8">{`${data.efectividad}%`}</span>
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden min-w-[60px]">
                              <div 
                                className={cn("h-full rounded-full", data.efectividad >= 100 ? "bg-emerald-500" : data.efectividad >= 50 ? "bg-amber-500" : "bg-blue-500")} 
                                style={{ width: `${Math.min(data.efectividad, 100)}%` }} 
                              />
                            </div>
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
                                {payload[0].payload.name}: {payload[0].value} Cuentas
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

      {/* MODAL DE NUEVOS PROSPECTOS */}
      <Dialog open={prospectosModalOpen} onOpenChange={setProspectosModalOpen}>
        <DialogContent className="max-w-md bg-white shadow-2xl border border-slate-200 opacity-100">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-500" />
              Nuevos Prospectos Registrados
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4 max-h-[60vh] overflow-y-auto pr-2">
            {prospectosList.length > 0 ? (
              prospectosList.map((c: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{c.empresa || c.nombre || 'Sin Nombre'}</p>
                    <p className="text-[10px] text-slate-500 font-medium uppercase mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {c.fechaCreacion || c.createdAt
                        ? new Date(c.fechaCreacion || c.createdAt).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })
                        : 'Sin Fecha'}
                    </p>
                  </div>
                  <Badge className="bg-indigo-100 text-indigo-700 border-none text-[9px] uppercase">
                    {c.etapaComercial || 'PROSPECTO'}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">No hay prospectos para mostrar.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Detalles de Seguimientos/Contactos */}
      <Dialog open={contactosModalOpen} onOpenChange={setContactosModalOpen}>
        <DialogContent className="max-w-2xl bg-white border-border/50 shadow-2xl rounded-2xl">
          <DialogHeader className="border-b border-border/50 pb-4 mb-4">
            <DialogTitle className="text-xl font-black text-slate-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" /> Auditoría de Seguimientos (Periodo)
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-2">
            {contactosList.map((interaccion: any, index: number) => {
              const dateVal = parseSafeDate(interaccion.fecha || interaccion.createdAt);
              const isDateOnly = dateVal && dateVal.toISOString().endsWith('T00:00:00.000Z');
              if (isDateOnly && dateVal) {
                // Si es medianoche UTC, es un campo de solo fecha. 
                // Lo centramos a mediodía para evitar cambios de día por zona horaria.
                dateVal.setUTCHours(12);
              }
              const formattedDate = dateVal ? new Intl.DateTimeFormat('es-PE', {
                dateStyle: 'medium',
                ...(isDateOnly ? {} : { timeStyle: 'short' }),
                timeZone: 'America/Lima'
              }).format(dateVal) : 'Fecha Inválida';

              return (
                <div key={index} className="flex justify-between items-start p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-emerald-50/30 transition-colors gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 text-sm truncate">
                        {interaccion.clienteNombre || 'Sin Empresa/Nombre'}
                      </p>
                      {(() => {
                        const obsText = interaccion.comentario || interaccion.notas || interaccion.observaciones || 'Sin comentarios registrados.';
                        const cleanObs = obsText.replace(/\[IMG\].*?\[\/IMG\]/, '').trim();

                        return (
                          <div className="mt-1.5">
                            <p className="text-xs text-slate-600 whitespace-pre-wrap">
                              {cleanObs || 'Sin comentarios registrados.'}
                            </p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              <Badge variant="outline" className="text-[10px] bg-white text-emerald-700 border-emerald-200 shrink-0">
                                {interaccion.tipo || 'Interacción'}
                              </Badge>
                              <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 rounded-md shrink-0">
                                {formattedDate}
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                  {(() => {
                    const obsText = interaccion.comentario || interaccion.notas || interaccion.observaciones || '';
                    const imgMatch = obsText.match(/\[IMG\](.*?)\[\/IMG\]/);
                    const imgUrl = imgMatch ? imgMatch[1] : (interaccion.imagenAdjunta || null);
                    
                    if (!imgUrl) return null;
                    return (
                      <div className="shrink-0 flex flex-col items-center bg-white p-1 rounded-xl border border-slate-200 shadow-sm self-start">
                        <span className="text-[7px] font-black uppercase text-slate-400 mb-0.5 tracking-wider">Evidencia</span>
                        <img src={imgUrl.startsWith('http') ? imgUrl : api.getFileUrl(imgUrl)} alt="Evidencia" className="h-14 w-14 sm:h-16 sm:w-16 rounded-lg object-cover cursor-pointer border border-slate-100 hover:opacity-80 transition-opacity" onClick={() => window.open(imgUrl.startsWith('http') ? imgUrl : api.getFileUrl(imgUrl), '_blank')} title="Ver imagen completa" />
                      </div>
                    );
                  })()}
                </div>
              );
            })}
            
            {contactosList.length === 0 && (
              <div className="py-8 text-center border-2 border-dashed border-slate-100 rounded-xl">
                <p className="text-sm text-slate-400 font-medium">No se encontraron interacciones detalladas.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Órdenes de Servicio / Ganados */}
      <Dialog open={ganadosModalOpen} onOpenChange={setGanadosModalOpen}>
        <DialogContent className="max-w-md bg-white shadow-2xl border border-slate-200 opacity-100">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-500" />
              Órdenes de Servicio (Ganados)
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4 max-h-[60vh] overflow-y-auto pr-2">
            {ganadosList.length > 0 ? (
              ganadosList.map((c: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{c.empresa || c.nombre || 'Sin Nombre'}</p>
                    <p className="text-[10px] text-slate-500 font-medium uppercase mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {c.fechaActualizacion || c.updatedAt
                        ? new Date(c.fechaActualizacion || c.updatedAt).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })
                        : 'Sin Fecha'}
                    </p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-700 border-none text-[9px] uppercase">
                    {c.etapaComercial || 'GANADO'}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">No hay clientes ganados para mostrar.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Visitas */}
      <Dialog open={visitasModalOpen} onOpenChange={setVisitasModalOpen}>
        <DialogContent className="max-w-2xl bg-white border-border/50 shadow-2xl rounded-2xl">
          <DialogHeader className="border-b border-border/50 pb-4 mb-4">
            <DialogTitle className="text-xl font-black text-slate-800 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-purple-600" /> Historial de Visitas (Periodo)
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-2">
            {visitasList.map((interaccion: any, index: number) => {
              const dateVal = parseSafeDate(interaccion.fecha || interaccion.createdAt);
              const isDateOnly = dateVal && dateVal.toISOString().endsWith('T00:00:00.000Z');
              if (isDateOnly && dateVal) dateVal.setUTCHours(12);
              const formattedDate = dateVal ? new Intl.DateTimeFormat('es-PE', {
                dateStyle: 'medium',
                ...(isDateOnly ? {} : { timeStyle: 'short' }),
                timeZone: 'America/Lima'
              }).format(dateVal) : 'Fecha Inválida';

              return (
                <div key={index} className="flex justify-between items-start p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-purple-50/30 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">
                        {interaccion.clienteNombre || 'Sin Empresa/Nombre'}
                      </p>
                      <p className="text-xs text-slate-600 mt-1 whitespace-pre-wrap">
                        {interaccion.comentario || interaccion.notas || interaccion.observaciones || 'Sin comentarios registrados.'}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="outline" className="text-[10px] bg-white text-purple-700 border-purple-200">
                          {interaccion.accion?.toLowerCase().includes('técnica') || interaccion.accion?.toLowerCase().includes('tecnica') ? 'VISITA TÉCNICA' : (interaccion.tipo || 'VISITA')}
                        </Badge>
                        <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 rounded-md">
                          {formattedDate}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {visitasList.length === 0 && (
              <div className="py-8 text-center border-2 border-dashed border-slate-100 rounded-xl">
                <p className="text-sm text-slate-400 font-medium">No se encontraron visitas detalladas en el periodo.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
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
          <p className="text-[8px] font-bold text-slate-400 uppercase mt-1 italic truncate" title={subLabel}>{subLabel}</p>
        </div>
      </div>
    </div>
  );
}
