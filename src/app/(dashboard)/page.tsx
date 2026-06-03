"use client";

import { useState, useEffect } from "react";
import { KPIStats } from "@/components/dashboard/kpi-stats";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  Briefcase, 
  ClipboardList, 
  FileCheck, 
  Truck, 
  TrendingUp,
  Calendar,
  ChevronRight
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import Link from "next/link";

// ============================================
// TIPOS
// ============================================

interface DashboardData {
  fechaActual: string;
  kpis: {
    proyectos: {
      total: number;
      activos: number;
      planejamento: number;
      finalizados: number;
      criticos: number;
      verdes: number;
      amarillos: number;
      rojos: number;
    };
    actividades: {
      total: number;
      pendientes: number;
      enProgreso: number;
      completadas: number;
      vencidas: number;
    };
    documentos: {
      total: number;
      pendientes: number;
      aprobados: number;
      porArea: Record<string, number>;
    };
    alertas: {
      total: number;
      criticas: number;
      altas: number;
      pendientes: number;
    };
  };
  proyectos: any[];
  actividades: any[];
  alertas: any[];
  timelineOperativo: any[];
  distribucionPorArea: Record<string, number>;
  distribucionPorPrioridad: Record<string, number>;
}

import { useOperacionesStore } from "@/store/operaciones-store";
import { useCRMStore } from "@/store/crm-store";

// ============================================
// COMPONENTES
// ============================================

export default function DashboardPage() {
  const { 
    proyectos, 
    fetchProyectos, 
    fetchResponsables, 
    alertas,
    getTimelineEvents,
  } = useOperacionesStore();
  
  const { 
    clients, 
    quotes,
    fetchClients,
    fetchQuotes
  } = useCRMStore();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      await Promise.all([
        fetchProyectos(), 
        fetchResponsables(),
        fetchClients(),
        fetchQuotes()
      ]);
      setLoading(false);
    };
    init();
  }, [fetchProyectos, fetchResponsables, fetchClients, fetchQuotes]);

  // Áreas Operativas
  const areas = [
    { id: 'Logística y Recursos', name: 'Steven', color: 'bg-blue-500', role: 'Logística y Coordinación', icon: Truck },
    { id: 'Ingeniería y Supervisión Técnica', name: 'Diego', color: 'bg-purple-500', role: 'Ingeniería y Validación', icon: Briefcase },
    { id: 'Gestión Documentaria y Expedientes Técnicos', name: 'Guillermo', color: 'bg-green-500', role: 'Gestión Documental', icon: FileCheck },
    { id: 'Operaciones de Campo y Control de Obra', name: 'Mario', color: 'bg-yellow-500', role: 'Soporte de Campo', icon: ClipboardList },
  ];

  // Equipo Comercial
  const sellers = [
    { name: 'Angie', color: 'bg-blue-600', role: 'Asesora Comercial' },
    { name: 'Valentina', color: 'bg-violet-600', role: 'Asesora Comercial' },
    { name: 'Ariana', color: 'bg-orange-600', role: 'Asesora Comercial' },
    { name: 'Nicoll', color: 'bg-teal-600', role: 'Asesora Comercial' },
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
      finalizados: proyectos.filter(p => p.estado === 'Finalizado').length,
      verdes: proyectos.filter(p => p.semaforo === 'Verde').length,
      amarillos: proyectos.filter(p => p.semaforo === 'Amarillo').length,
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
    .slice(0, 5);

  const distribucionPorArea = areas.reduce((acc, area) => {
    acc[area.name] = proyectos.filter(p => p.area === area.id).length;
    return acc;
  }, {} as Record<string, number>);

  const distribucionPorVendedor = sellers.reduce((acc, s) => {
    acc[s.name] = clients.filter(c => c.asignadoA === s.name).length;
    return acc;
  }, {} as Record<string, number>);

  const distribucionPorPrioridad = proyectos.reduce((acc, p) => {
    acc[p.prioridad] = (acc[p.prioridad] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-primary tracking-tight">Panel de Control</h1>
          <p className="text-muted-foreground mt-1 font-medium">Resumen general de HH T Soluciona S.A.C.</p>
        </div>
        
        {isReviewDay && (
          <div className="bg-accent/10 border-2 border-accent/20 px-6 py-3 rounded-2xl flex items-center gap-3 animate-pulse">
            <Calendar className="w-5 h-5 text-accent" />
            <div>
              <p className="text-[10px] font-black text-accent uppercase">Comité Comercial Activo</p>
              <p className="text-sm font-bold text-primary">Hoy: {currentReviewDay}</p>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* KPI Stats */}
          <KPIStats />

          {/* Métricas Operativas */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary" />
              <h2 className="text-sm font-black text-primary uppercase tracking-wider">Gestión de Operaciones</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {areas.map((area) => {
                const Icon = area.icon;
                const proyectosArea = distribucionPorArea[area.name] || 0;
                return (
                  <Card key={area.name} className="border-none shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-lg", area.color)}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-muted-foreground uppercase">{area.name}</p>
                          <p className="text-[10px] text-muted-foreground">{area.role}</p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">Proyectos Activos</span>
                          <span className="text-xl font-black text-primary">{proyectosArea}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Métricas Comerciales */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="text-sm font-black text-primary uppercase tracking-wider">Equipo Comercial y Ventas</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {sellers.map((seller) => {
                const clientesVendedor = distribucionPorVendedor[seller.name] || 0;
                return (
                  <Card key={seller.name} className="border-none shadow-sm hover:shadow-md transition-shadow border-b-4" style={{ borderColor: seller.color.replace('bg-', '') }}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                          <AvatarFallback className={cn("text-white font-black", seller.color)}>
                            {seller.name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-xs font-black text-muted-foreground uppercase">{seller.name}</p>
                          <p className="text-[10px] text-muted-foreground">{seller.role}</p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">Cartera Activa</span>
                          <span className="text-xl font-black text-primary">{clientesVendedor}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Alertas Rápidas Mixtas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-none shadow-sm bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-red-700 uppercase">Seguimientos Vencidos</p>
                    <p className="text-3xl font-black text-red-600">{kpis.crm.vencidos}</p>
                  </div>
                  <AlertCircle className="w-10 h-10 text-red-400 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-blue-700 uppercase">Gestiones de Hoy</p>
                    <p className="text-3xl font-black text-blue-600">{kpis.crm.totalHoy}</p>
                  </div>
                  <Calendar className="w-10 h-10 text-blue-400 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-orange-700 uppercase">Proyectos Críticos</p>
                    <p className="text-3xl font-black text-orange-600">{kpis.proyectos.rojos}</p>
                  </div>
                  <AlertCircle className="w-10 h-10 text-orange-400 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-primary uppercase">Actividades Vencidas</p>
                    <p className="text-3xl font-black text-primary">{kpis.actividades.vencidas}</p>
                  </div>
                  <Clock className="w-10 h-10 text-primary opacity-30" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Agenda Comercial */}
            <Card className="border-none shadow-sm overflow-hidden">
              <CardHeader className="bg-primary/5 border-b border-primary/10">
                <CardTitle className="text-sm font-black uppercase tracking-wider text-primary flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Próximos Seguimientos (Agenda Comercial)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {proximosSeguimientos.map((client) => {
                    const isOverdue = new Date(client.proximoSeguimiento || '') < new Date(new Date().setHours(0,0,0,0));
                    return (
                      <div key={client.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm",
                            isOverdue ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
                          )}>
                            {new Date(client.proximoSeguimiento || '').getDate()}
                            <span className="text-[8px] uppercase ml-0.5">
                              {new Date(client.proximoSeguimiento || '').toLocaleDateString('es-ES', { month: 'short' })}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{client.empresa}</p>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[9px] uppercase font-black px-1.5 py-0">
                                {client.asignadoA}
                              </Badge>
                              <span className="text-[10px] text-slate-500 italic font-medium truncate max-w-[150px]">
                                {client.accion}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Link 
                          href="/crm/seguimiento" 
                          className="text-xs font-black text-primary hover:text-accent transition-colors uppercase flex items-center gap-1"
                        >
                          Ver <ChevronRight className="w-3 h-3" />
                        </Link>
                      </div>
                    );
                  })}
                  {proximosSeguimientos.length === 0 && (
                    <div className="p-10 text-center space-y-2">
                      <Clock className="w-10 h-10 text-slate-200 mx-auto" />
                      <p className="text-sm text-slate-400 font-bold uppercase">Sin seguimientos programados</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Timeline Operativo */}
            <Card className="border-none shadow-sm overflow-hidden">
              <CardHeader className="bg-primary/5 border-b border-primary/10">
                <CardTitle className="text-sm font-black uppercase tracking-wider text-primary flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Timeline de Operaciones
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {timelineOperativo.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 flex items-start gap-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className="w-2 h-2 rounded-full mt-2 bg-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-bold text-primary truncate">{item.descripcion}</p>
                          <span className="text-[10px] font-black text-slate-400 uppercase shrink-0">
                            {new Date(item.fecha).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {item.proyecto?.codigo} - {item.proyecto?.nombre}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">Responsable: {item.usuario}</p>
                      </div>
                    </div>
                  ))}
                  {timelineOperativo.length === 0 && (
                    <div className="p-10 text-center space-y-2">
                      <Briefcase className="w-10 h-10 text-slate-200 mx-auto" />
                      <p className="text-sm text-slate-400 font-bold uppercase">Sin actividades recientes</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <DashboardCharts />
        </>
      )}
    </div>
  );
}
