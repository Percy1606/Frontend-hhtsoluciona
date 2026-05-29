"use client";

import { useState, useEffect } from "react";
import { KPIStats } from "@/components/dashboard/kpi-stats";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Clock, CheckCircle2, Briefcase, ClipboardList, FileCheck, Truck, TrendingUp } from "lucide-react";
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

// ============================================
// COMPONENTES
// ============================================

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard');
      const dashboardData = await response.json();
      setData(dashboardData);
    } catch (error) {
      console.error("Error fetching dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  // Áreas con sus colores
  const areas = [
    { name: 'Steven', color: 'bg-blue-500', role: 'Logística y Coordinación', icon: Truck },
    { name: 'Diego', color: 'bg-purple-500', role: 'Ingeniería y Validación', icon: Briefcase },
    { name: 'Guillermo', color: 'bg-green-500', role: 'Gestión Documental', icon: FileCheck },
    { name: 'Mario', color: 'bg-yellow-500', role: 'Soporte de Campo', icon: ClipboardList },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-primary tracking-tight">Panel de Control</h1>
        <p className="text-muted-foreground mt-1 font-medium">Resumen general de HH T Soluciona S.A.C.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* KPI Stats */}
          <KPIStats />

          {/* Métricas por Área */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {areas.map((area) => {
              const Icon = area.icon;
              const proyectosArea = data?.distribucionPorArea[area.name] || 0;
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

          {/* Semáforos y Estado de Proyectos */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-none shadow-sm bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black text-green-700 uppercase">Proyectos Verdes</p>
                    <p className="text-3xl font-black text-green-600">{data?.kpis.proyectos.verdes || 0}</p>
                  </div>
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-yellow-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black text-yellow-700 uppercase">Proyectos Amarillos</p>
                    <p className="text-3xl font-black text-yellow-600">{data?.kpis.proyectos.amarillos || 0}</p>
                  </div>
                  <Clock className="w-10 h-10 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black text-red-700 uppercase">Proyectos Rojos</p>
                    <p className="text-3xl font-black text-red-600">{data?.kpis.proyectos.rojos || 0}</p>
                  </div>
                  <AlertCircle className="w-10 h-10 text-red-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black text-primary uppercase">Actividades Vencidas</p>
                    <p className="text-3xl font-black text-primary">{data?.kpis.actividades.vencidas || 0}</p>
                  </div>
                  <TrendingUp className="w-10 h-10 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Alertas y Notificaciones */}
            <Card className="border-none shadow-sm xl:col-span-1">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-accent" />
                  Alertas y Notificaciones
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data?.alertas?.slice(0, 5).map((alerta: any) => (
                  <div
                    key={alerta.id}
                    className={cn(
                      "p-3 border-l-4 rounded-r-lg",
                      alerta.prioridad === 'Crítica' ? "bg-red-50 border-error" :
                        alerta.prioridad === 'Alta' ? "bg-orange-50 border-orange-500" :
                          "bg-yellow-50 border-yellow-500"
                    )}
                  >
                    <p className="text-sm font-bold">{alerta.titulo}</p>
                    <p className="text-xs text-muted-foreground mt-1">{alerta.descripcion}</p>
                    <Badge className={cn(
                      "mt-2 text-[9px]",
                      alerta.prioridad === 'Crítica' ? "bg-error text-white" :
                        "bg-warning text-white"
                    )}>
                      {alerta.prioridad} - {alerta.area}
                    </Badge>
                  </div>
                ))}
                {(!data?.alertas || data.alertas.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">Sin alertas pendientes</p>
                )}
              </CardContent>
            </Card>

            {/* Timeline Operativo */}
            <Card className="border-none shadow-sm xl:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  Timeline Operativo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data?.timelineOperativo?.map((item: any, idx: number) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      <div className={cn(
                        "w-3 h-3 rounded-full mt-1.5",
                        item.diasRestantes < 0 ? "bg-error" :
                          item.diasRestantes <= 3 ? "bg-warning" :
                            "bg-success"
                      )} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-primary">{item.descripcion}</p>
                          <Badge className={cn(
                            "text-[9px]",
                            item.diasRestantes < 0 ? "bg-error text-white" :
                              item.diasRestantes <= 3 ? "bg-warning text-white" :
                                "bg-success text-white"
                          )}>
                            {item.diasRestantes < 0
                              ? `Vencido`
                              : `${item.diasRestantes} días`}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.proyecto?.codigo} - {item.proyecto?.nombre}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex -space-x-1">
                            {item.responsables?.slice(0, 2).map((r: string, i: number) => (
                              <div key={i} className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[8px] font-bold border border-white">
                                {r?.charAt(0)}
                              </div>
                            ))}
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {item.responsables?.join(', ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!data?.timelineOperativo || data.timelineOperativo.length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-4">Sin actividades pendientes</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Distribución por Prioridad */}
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Distribución por Prioridad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(data?.distribucionPorPrioridad || {}).map(([prioridad, count]) => (
                  <div key={prioridad} className="p-4 bg-muted/20 rounded-xl text-center">
                    <p className={cn(
                      "text-2xl font-black",
                      prioridad === 'Crítica' ? "text-error" :
                        prioridad === 'Alta' ? "text-orange-600" :
                          prioridad === 'Media' ? "text-yellow-600" :
                            "text-gray-600"
                    )}>{count as number}</p>
                    <p className="text-xs font-bold text-muted-foreground uppercase">{prioridad}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Charts */}
          <DashboardCharts />
        </>
      )}
    </div>
  );
}
