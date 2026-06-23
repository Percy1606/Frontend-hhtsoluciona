"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { KPIStats } from "@/components/dashboard/kpi-stats";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  Briefcase, 
  ClipboardList, 
  FileCheck, 
  Truck, 
  TrendingUp,
  Calendar,
  ChevronRight,
  LayoutDashboard,
  Users,
  Target,
  ArrowUpRight,
  Activity,
  Layers,
  Inbox,
  Trophy
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { api } from "@/lib/api";

import { useOperacionesStore } from "@/store/operaciones-store";
import { useCRMStore } from "@/store/crm-store";
import { useAuthStore } from "@/store/auth-store";
import { useLogisticaStore } from "@/store/logistica-store";
import { useDocumentalStore } from "@/store/documental-store";
import { useNotificationStore } from "@/store/notification-store";
import { useFinanzasStore } from "@/store/finanzas-store";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { 
    proyectos, 
    fetchProyectos, 
    fetchResponsables, 
    getTimelineEvents,
  } = useOperacionesStore();
  
  const { 
    clients, 
    fetchClients,
    fetchQuotes
  } = useCRMStore();

  const {
    ordenes,
    insumos,
    fetchOrdenes,
    fetchInsumos
  } = useLogisticaStore();

  const {
    documentos,
  } = useDocumentalStore();

  const { fetchUnreadCount } = useNotificationStore();
  const { fetchGlobalKPIs } = useFinanzasStore();

  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [accessDenied, setAccessDenied] = useState(false);

  const fetchOnlineUsers = useCallback(async () => {
    try {
      const data = await api.get("/config/usuarios/online");
      setOnlineUsers(data || []);
    } catch (error) {
      console.error("Error fetching online users:", error);
    }
  }, []);

  useEffect(() => {
    const checkAccessAndLoad = async () => {
      if (!user) {
        router.replace("/login");
        return;
      }

      const userModules = user.modulos || [];
      const hasDashboardAccess = user.rol === "ADMIN" || userModules.includes("dashboard");

      if (!hasDashboardAccess) {
        setAccessDenied(true);
        // Redirigir al primer módulo disponible
        if (userModules.includes("crm")) {
          router.replace("/crm/cartera");
        } else if (userModules.includes("operaciones")) {
          router.replace("/operaciones/proyectos");
        } else if (userModules.includes("logistica")) {
          router.replace("/logistica/ordenes");
        } else if (userModules.includes("finanzas")) {
          router.replace("/finanzas/bandeja");
        } else {
          // Fallback
          router.replace("/perfil"); 
        }
        return; // Detener la ejecución si no tiene acceso
      }

      // Si tiene acceso, cargar datos defensivamente
      try {
        await Promise.allSettled([
          fetchProyectos(), 
          fetchResponsables(),
          fetchClients(),
          fetchQuotes(),
          fetchOrdenes(),
          fetchInsumos(),
          fetchUnreadCount(),
          fetchOnlineUsers(),
          fetchGlobalKPIs()
        ]);
      } catch (error) {
        console.error("Error durante la carga inicial del dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    checkAccessAndLoad();

    // Poll online users every 30 seconds, only if not denied
    let interval: NodeJS.Timeout;
    if (!accessDenied) {
      interval = setInterval(fetchOnlineUsers, 30000);
    }
    return () => clearInterval(interval);
  }, [user, fetchProyectos, fetchResponsables, fetchClients, fetchQuotes, fetchOrdenes, fetchInsumos, fetchUnreadCount, fetchOnlineUsers, fetchGlobalKPIs, router, accessDenied]);

  // Si no tiene acceso, mostrar un mensaje mínimo mientras redirige
  if (accessDenied) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4 text-slate-500">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium animate-pulse">Redirigiendo a su área de trabajo...</p>
      </div>
    );
  }

  // Áreas Operativas
  const areas = [
    { id: 'Logística y Recursos', name: 'Steven', color: 'bg-blue-500', role: 'Logística', icon: Truck },
    { id: 'Ingeniería y Supervisión Técnica', name: 'Diego', color: 'bg-purple-500', role: 'Ingeniería', icon: Briefcase },
    { id: 'Gestión Documentaria y Expedientes Técnicos', name: 'Guillermo', color: 'bg-green-500', role: 'Documentación', icon: FileCheck },
    { id: 'Operaciones de Campo y Control de Obra', name: 'Mario', color: 'bg-yellow-500', role: 'Campo', icon: ClipboardList },
  ];

  // Equipo Comercial
  const sellers = [
    { name: 'Angie', color: 'bg-blue-600', role: 'Asesora' },
    { name: 'Valentina', color: 'bg-violet-600', role: 'Asesora' },
    { name: 'Ariana', color: 'bg-orange-600', role: 'Asesora' },
    { name: 'Nicoll', color: 'bg-teal-600', role: 'Asesora' },
  ];

  const today = new Date();
  const dayName = today.toLocaleDateString('es-ES', { weekday: 'long' });
  const isReviewDay = dayName.toLowerCase().includes('martes') || dayName.toLowerCase().includes('jueves');
  const currentReviewDay = dayName.charAt(0).toUpperCase() + dayName.slice(1).split(',')[0];

  // Calcular KPIs en tiempo real
  const kpis = {
    proyectos: {
      total: proyectos.length,
      activos: proyectos.filter(p => p.estado === 'En Ejecución').length,
      rojos: proyectos.filter(p => p.semaforo === 'Rojo').length
    },
    actividades: {
      vencidas: proyectos.reduce((acc, p) => acc + (p.actividades?.filter(a => {
        if (!a.fechaVencimiento || a.estado === 'Completada' || a.estado === 'Validada') return false;
        return new Date(a.fechaVencimiento) < new Date();
      }).length || 0), 0)
    },
    crm: {
      totalHoy: clients.filter(c => {
        if (!c.proximoSeguimiento) return false;
        const fs = c.proximoSeguimiento.split('T')[0];
        const hoy = new Date().toISOString().split('T')[0];
        return fs === hoy && c.etapaComercial !== 'Ganado' && c.etapaComercial !== 'Perdido';
      }).length,
      vencidos: clients.filter(c => {
        if (!c.proximoSeguimiento || c.etapaComercial === 'Ganado' || c.etapaComercial === 'Perdido') return false;
        const fs = new Date(c.proximoSeguimiento.split('T')[0]);
        const hoy = new Date();
        hoy.setHours(0,0,0,0);
        return fs < hoy;
      }).length
    },
    logistica: {
      ordenesPendientes: ordenes.filter(o => o.estado === 'PENDIENTE').length,
      stockBajo: insumos.filter(i => i.stockActual <= i.stockMinimo).length
    },
    documental: {
      pendientesRevision: documentos.filter(d => d.estado === 'Pendiente Revisión').length
    }
  };

  const timelineOperativo = getTimelineEvents().slice(0, 5).map(e => ({
    id: e.id,
    descripcion: e.actividadDescripcion || e.campo,
    proyecto: { codigo: e.proyectoCodigo, nombre: e.proyectoNombre },
    fecha: e.fecha,
    usuario: e.usuario
  }));

  const proximosSeguimientos = clients
    .filter(c => c.proximoSeguimiento && c.etapaComercial !== 'Ganado' && c.etapaComercial !== 'Perdido')
    .sort((a, b) => new Date(a.proximoSeguimiento).getTime() - new Date(b.proximoSeguimiento).getTime())
    .slice(0, 8);

  const distribucionPorArea = areas.reduce((acc, area) => {
    acc[area.name] = proyectos.filter(p => p.area === area.id).length;
    return acc;
  }, {} as Record<string, number>);

  const distribucionPorVendedor = sellers.reduce((acc, s) => {
    acc[s.name] = clients.filter(c => c.asignadoA === s.name).length;
    return acc;
  }, {} as Record<string, number>);

  const recentWins = [...clients].filter(c => ['Ganado', 'Orden de Servicio', 'Cotización Enviada', 'Cotizacion Enviada', 'Inspección Realizada', 'Inspeccion Realizada'].includes(c.etapaComercial) || c.estado === 'Ganado').slice(0, 1);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6">
        <div className="relative flex items-center justify-center">
          <div className="w-20 h-20 border-4 border-slate-100 rounded-full animate-pulse" />
          <div className="absolute w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-slate-800 uppercase tracking-[0.2em] mb-1">Cargando Inteligencia</p>
          <p className="text-xs text-muted-foreground font-medium animate-pulse uppercase tracking-widest">Sincronizando modulos de HH T Soluciona</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 max-w-[1600px] mx-auto px-4 md:px-6">
      {/* Header Premium */}
      <div className="relative overflow-hidden bg-white p-5 rounded-3xl border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="relative z-10 flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-900/20 group hover:scale-105 transition-transform">
            <LayoutDashboard className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">Panel de Control</h1>
              <Badge variant="outline" className="bg-emerald-50 border-emerald-200 text-emerald-600 font-bold py-0 px-1.5 text-[8px] h-4">LIVE</Badge>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              <span className="flex items-center gap-1.5"><Layers className="w-3 h-3" /> HH T Soluciona S.A.C.</span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span>Resumen Ejecutivo</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3">
          {isReviewDay && (
            <div className="bg-amber-50 border border-amber-100 text-amber-700 font-bold py-1.5 px-3 rounded-xl flex items-center gap-2 shadow-sm animate-in fade-in slide-in-from-right-4 duration-700">
              <Calendar className="w-3 h-3" />
              <div className="text-left">
                <p className="text-[9px] uppercase leading-none opacity-70 mb-0.5">Comité Comercial</p>
                <p className="text-[11px]">{currentReviewDay}</p>
              </div>
            </div>
          )}

          {recentWins.length > 0 && (
            <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold py-1.5 px-3 rounded-xl flex items-center gap-2 shadow-sm animate-in zoom-in-90 slide-in-from-bottom-2 duration-700 hover:scale-105 transition-transform cursor-default">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center animate-pulse shrink-0">
                <Trophy className="w-3 h-3 text-emerald-600" />
              </div>
              <div className="text-left">
                <p className="text-[9px] uppercase leading-none opacity-80 mb-0.5 tracking-widest text-emerald-600/80">¡Nuevo Logro!</p>
                <p className="text-[11px] uppercase tracking-tight truncate max-w-[150px]">{recentWins[0].empresa || (recentWins[0] as any).nombre}</p>
              </div>
            </div>
          )}

          <div className="bg-slate-50 border border-slate-100 text-slate-600 font-bold py-1.5 px-3 rounded-xl flex items-center gap-2 shadow-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <div className="text-left">
              <p className="text-[9px] uppercase leading-none opacity-70 mb-0.5">Estado Global</p>
              <p className="text-[11px] uppercase">Activo</p>
            </div>
          </div>
        </div>

        {/* Decoración abstracta */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-slate-50 rounded-full blur-3xl opacity-50" />
      </div>

      <Tabs defaultValue="general" className="w-full space-y-8 outline-none">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <TabsList className="bg-slate-100/60 backdrop-blur-md p-1.5 rounded-full border border-slate-200/60 shadow-inner flex h-auto gap-1 w-full md:w-auto overflow-x-auto no-scrollbar">
            <TabsTrigger
              value="general"
              className="rounded-full px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 data-active:bg-white data-active:text-primary data-active:shadow-md transition-all gap-2 flex-1 md:flex-none"
            >
              <Activity className="w-4 h-4" /> Visión Global
            </TabsTrigger>
            <TabsTrigger
              value="comercial"
              className="rounded-full px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 data-active:bg-white data-active:text-primary data-active:shadow-md transition-all gap-2 flex-1 md:flex-none"
            >
              <Users className="w-4 h-4" /> Comercial
            </TabsTrigger>
            <TabsTrigger
              value="operaciones"
              className="rounded-full px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 data-active:bg-white data-active:text-primary data-active:shadow-md transition-all gap-2 flex-1 md:flex-none"
            >
              <Briefcase className="w-4 h-4" /> Operaciones
            </TabsTrigger>
          </TabsList>
          
          <div className="hidden lg:flex items-center gap-4 bg-white border px-5 py-2.5 rounded-2xl shadow-sm">
            <div className="flex -space-x-2">
              {onlineUsers.length > 0 ? (
                onlineUsers.slice(0, 5).map((u, idx) => (
                  <div 
                    key={u.id} 
                    className={cn(
                      "w-8 h-8 rounded-full border-2 border-white text-[10px] flex items-center justify-center text-white font-bold", 
                      u.responsable?.color || "bg-slate-400"
                    )}
                    title={`${u.nombre} (${u.rol})`}
                  >
                    {u.nombre[0]}
                  </div>
                ))
              ) : (
                <div className="w-8 h-8 rounded-full border-2 border-dashed border-slate-200 flex items-center justify-center">
                    <Users className="w-3 h-3 text-slate-300" />
                </div>
              )}
            </div>
            <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest leading-none">Equipo en Línea</span>
                <span className="text-[9px] font-bold text-emerald-500 uppercase">{onlineUsers.length} activos ahora</span>
            </div>
          </div>
        </div>

        <KPIStats />

        {/* TAB: GENERAL (Visión Global) */}
        <TabsContent value="general" className="space-y-8 outline-none">
          {/* Alertas Compactas */}
          {(kpis.proyectos.rojos > 0 || kpis.crm.vencidos > 0) && (
            <div className="flex flex-wrap items-center gap-4 bg-slate-900 p-3 rounded-2xl shadow-sm text-white">
              <div className="flex items-center gap-2 px-3 border-r border-white/10">
                <TrendingUp className="w-3 h-3 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Foco Operativo</span>
              </div>
              <div className="flex flex-wrap items-center gap-6 flex-1">
                {kpis.proyectos.rojos > 0 && (
                  <Link href="/operaciones/alertas" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <Badge className="bg-amber-500/20 text-amber-500 border-none px-2 py-0.5 text-[9px]">{kpis.proyectos.rojos}</Badge>
                    <span className="text-[10px] font-medium text-slate-300">Alertas Pendientes</span>
                  </Link>
                )}
                {kpis.crm.vencidos > 0 && (
                  <Link href="/crm/cartera" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <Badge className="bg-red-500/20 text-red-500 border-none px-2 py-0.5 text-[9px]">{kpis.crm.vencidos}</Badge>
                    <span className="text-[10px] font-medium text-slate-300">Seguimientos Vencidos</span>
                  </Link>
                )}
                <p className="text-[9px] text-slate-500 italic ml-auto hidden md:block">
                   Priorice estas áreas para optimizar el flujo de trabajo.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Gestiones Hoy', val: kpis.crm.totalHoy, icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50/50', border: 'border-blue-100' },
              { label: 'O. Compra Pend.', val: kpis.logistica.ordenesPendientes, icon: Truck, color: 'text-purple-600', bg: 'bg-purple-50/50', border: 'border-purple-100' },
              { label: 'Revisiones Doc.', val: kpis.documental.pendientesRevision, icon: Inbox, color: 'text-emerald-600', bg: 'bg-emerald-50/50', border: 'border-emerald-100' },
              { label: 'Stock Crítico', val: kpis.logistica.stockBajo, icon: Layers, color: 'text-rose-600', bg: 'bg-rose-50/50', border: 'border-rose-100' },
            ].map((item, idx) => (
              <div key={idx} className={cn("p-4 rounded-2xl border shadow-sm flex flex-col justify-between bg-white hover:shadow-md transition-all", item.bg)}>
                <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center mb-2 border", item.border)}>
                  <item.icon className={cn("w-4 h-4", item.color)} />
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase opacity-50 tracking-widest mb-1 block">{item.label}</span>
                  <div className="flex items-end gap-2">
                    <span className={cn("text-xl font-bold leading-none", item.color)}>{item.val}</span>
                    {item.val > 0 && <ArrowUpRight className={cn("w-3 h-3 mb-0.5 opacity-50", item.color)} />}
                  </div>
                </div>
              </div>
            ))}
            
            <div className="col-span-2 md:col-span-4 mt-2">
               <DashboardCharts />
            </div>
          </div>
        </TabsContent>

        {/* TAB: COMERCIAL */}
        <TabsContent value="comercial" className="space-y-8 outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sales Team List */}
            <div className="lg:col-span-1 space-y-6">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-slate-800" />
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-800">Pipeline por Equipo</h3>
                </div>
                <Badge className="bg-slate-100 text-slate-600 border-none font-bold">TOTAL: {clients.length}</Badge>
              </div>
              <div className="space-y-4">
                {sellers.map((seller) => (
                  <Card key={seller.name} className="border-none shadow-sm overflow-hidden group hover:scale-[1.02] transition-all bg-white rounded-3xl">
                    <CardContent className="p-5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12 border-2 border-white shadow-md shrink-0">
                          <AvatarFallback className={cn("text-white font-bold text-sm", seller.color)}>
                            {seller.name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-bold text-slate-800 group-hover:text-primary transition-colors">{seller.name}</p>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter opacity-70">{seller.role}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-slate-800 leading-none">{distribucionPorVendedor[seller.name] || 0}</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold opacity-50">leads</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Commercial Schedule */}
            <div className="lg:col-span-3 space-y-6">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-slate-800" />
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-800">Agenda Próximos Seguimientos</h3>
                </div>
                <Link href="/crm/seguimiento" className="text-[10px] font-bold text-primary uppercase flex items-center gap-1 hover:underline">Ver Agenda Completa <ArrowUpRight className="w-3 h-3" /></Link>
              </div>
              
              <div className="bg-white border rounded-[2.5rem] shadow-sm overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                  {proximosSeguimientos.map((client, idx) => {
                    const isOverdue = new Date(client.proximoSeguimiento || '') < new Date(new Date().setHours(0,0,0,0));
                    return (
                      <div key={client.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                        <div className="flex items-center gap-5">
                          <div className={cn(
                            "w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-bold shadow-sm transition-transform group-hover:scale-110",
                            isOverdue ? "bg-red-50 text-red-600 border border-red-100" : "bg-blue-50 text-blue-600 border border-blue-100"
                          )}>
                            <span className="text-base leading-none mb-0.5">{new Date(client.proximoSeguimiento || '').getDate()}</span>
                            <span className="text-[9px] uppercase leading-none">
                              {new Date(client.proximoSeguimiento || '').toLocaleDateString('es-ES', { month: 'short' })}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-800 truncate">{client.empresa}</p>
                            <div className="flex items-center gap-3 mt-1.5">
                              <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase"><Users className="w-3 h-3" /> {client.asignadoA}</span>
                              <span className="w-1 h-1 rounded-full bg-slate-300" />
                              <span className="text-xs text-muted-foreground truncate max-w-[120px] italic">"{client.accion}"</span>
                            </div>
                          </div>
                        </div>
                        <Link href="/crm/seguimiento" className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl transition-all">
                          <ChevronRight className="w-5 h-5" />
                        </Link>
                      </div>
                    );
                  })}
                </div>
                {proximosSeguimientos.length === 0 && (
                  <div className="p-20 text-center flex flex-col items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center">
                      <Calendar className="w-8 h-8 text-slate-200" />
                    </div>
                    <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Sin compromisos agendados</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* TAB: OPERACIONES */}
        <TabsContent value="operaciones" className="space-y-8 outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Operational Areas */}
            <div className="lg:col-span-1 space-y-6">
              <div className="flex items-center gap-2 px-2">
                <Briefcase className="w-5 h-5 text-slate-800" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-800">Carga por Área</h3>
              </div>
              <div className="space-y-4">
                {areas.map((area) => (
                  <Card key={area.id} className="border-none shadow-sm overflow-hidden hover:scale-[1.02] transition-all bg-white rounded-3xl">
                    <CardContent className="p-5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn("h-12 w-12 rounded-2xl text-white flex items-center justify-center shadow-lg", area.color)}>
                          <area.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{area.name}</p>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter opacity-70">{area.role}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-slate-800 leading-none">{distribucionPorArea[area.name] || 0}</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold opacity-50">proyectos</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Operational Timeline */}
            <div className="lg:col-span-3 space-y-6">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-slate-800" />
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-800">Timeline de Ejecución</h3>
                </div>
                <Badge className="bg-slate-900 text-white border-none text-[10px] font-bold">ÚLTIMAS 5 ACCIONES</Badge>
              </div>
              
              <div className="bg-white border rounded-[2.5rem] shadow-sm overflow-hidden relative">
                <div className="divide-y divide-slate-100">
                  {timelineOperativo.map((item, idx) => (
                    <div key={item.id} className="p-6 flex items-start gap-6 hover:bg-slate-50 transition-colors relative">
                      <div className="relative flex flex-col items-center h-full">
                        <div className="w-4 h-4 rounded-full bg-slate-900 ring-8 ring-slate-100 shrink-0 z-10" />
                        {idx !== timelineOperativo.length - 1 && <div className="w-0.5 h-full bg-slate-100 absolute top-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-4">
                          <p className="text-sm font-bold text-slate-800 truncate leading-none mb-1.5">{item.descripcion}</p>
                          <Badge variant="outline" className="text-[9px] font-bold text-slate-400 uppercase border-slate-200">{new Date(item.fecha).toLocaleDateString()}</Badge>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="text-xs text-slate-500 font-medium">
                            {item.proyecto?.codigo} · <span className="text-primary font-bold">{item.proyecto?.nombre}</span>
                          </p>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <Avatar className="w-5 h-5 border-none">
                            <AvatarFallback className="bg-slate-100 text-[8px] font-bold text-slate-500 uppercase">{item.usuario[0]}</AvatarFallback>
                          </Avatar>
                          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Responsable: {item.usuario}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {timelineOperativo.length === 0 && (
                  <div className="p-20 text-center flex flex-col items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center">
                      <Briefcase className="w-8 h-8 text-slate-200" />
                    </div>
                    <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Sin actividad reciente</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
