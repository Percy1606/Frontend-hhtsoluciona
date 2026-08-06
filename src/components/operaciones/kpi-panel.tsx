"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  DollarSign,
  Calendar,
  Target,
  FileText,
  Users,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

interface KPIData {
  periodo: "semanal" | "mensual" | "anual";
  fechaInicio: string;
  fechaFin: string;
  proyectosIniciados: number;
  proyectosFinalizados: number;
  proyectosActivos: number;
  actividadesCreadas: number;
  actividadesCompletadas: number;
  promedioAvance: number;
  alertasTotales: number;
  alertasResueltas: number;
}

interface ActividadStats {
  total: number;
  pendientes: number;
  enProgreso: number;
  completadas: number;
  bloqueadas: number;
}

interface ProyectoStats {
  total: number;
  activos: number;
  planification: number;
  finalizados: number;
  detenidos: number;
  verdes: number;
  amarillos: number;
  rojos: number;
}

interface KPIPanelProps {
  proyectosStats: ProyectoStats;
  actividadesStats: ActividadStats;
  kpis: KPIData | null;
  onCambiarPeriodo: (periodo: "semanal" | "mensual" | "anual") => void;
}

export function KPIPanel({
  proyectosStats,
  actividadesStats,
  kpis,
  onCambiarPeriodo,
}: KPIPanelProps) {
  const [periodo, setPeriodo] = useState<"semanal" | "mensual" | "anual">("mensual");

  const handlePeriodoChange = (newPeriodo: "semanal" | "mensual" | "anual" | null) => {
    if (newPeriodo) {
      setPeriodo(newPeriodo);
      onCambiarPeriodo(newPeriodo);
    }
  };

  // Calcular tendencias (simuladas)
  const tendenciaProyectos = proyectosStats.activos > 0 ? "+12%" : "0%";
  const tendenciaActividades = actividadesStats.completadas > 0 ? "+8%" : "0%";
  const tendenciaAvance = kpis?.promedioAvance || 0;

  return (
    <div className="space-y-6">
      {/* Selector de Período */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-primary flex items-center gap-2">
          <BarChart3 className="w-6 h-6" />
          Panel de KPIs
        </h2>
        <Select value={periodo} onValueChange={handlePeriodoChange}>
          <SelectTrigger className="w-40 font-bold">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="semanal">Semanal</SelectItem>
            <SelectItem value="mensual">Mensual</SelectItem>
            <SelectItem value="anual">Anual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Período Actual */}
      {kpis && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>
            Período: {formatDate(kpis.fechaInicio)} → {formatDate(kpis.fechaFin)}
          </span>
        </div>
      )}

      {/* KPIs de Proyectos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          title="Total Proyectos"
          value={proyectosStats.total}
          icon={<FileText className="w-5 h-5" />}
          trend={tendenciaProyectos}
          color="text-primary"
          bgColor="bg-primary/10"
        />
        <KPICard
          title="En Ejecución"
          value={proyectosStats.activos}
          icon={<Activity className="w-5 h-5" />}
          color="text-orange-600"
          bgColor="bg-orange-50"
        />
        <KPICard
          title="Finalizados"
          value={proyectosStats.finalizados}
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="text-green-600"
          bgColor="bg-green-50"
        />
        <KPICard
          title="Promedio Avance"
          value={`${tendenciaAvance}%`}
          icon={<TrendingUp className="w-5 h-5" />}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
      </div>

      {/* Semáforo de Proyectos */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-black text-muted-foreground uppercase flex items-center gap-2">
            <Activity className="w-4 h-4" /> Estado de Proyectos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <p className="text-3xl font-black text-green-600">{proyectosStats.verdes}</p>
              <p className="text-xs font-bold text-green-700 uppercase">Verdes</p>
              <div className="w-full h-2 bg-green-200 rounded-full mt-2">
                <div className="h-full bg-green-500 rounded-full" style={{ width: `${proyectosStats.total > 0 ? (proyectosStats.verdes / proyectosStats.total) * 100 : 0}%` }} />
              </div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-xl">
              <p className="text-3xl font-black text-yellow-600">{proyectosStats.amarillos}</p>
              <p className="text-xs font-bold text-yellow-700 uppercase">Amarillos</p>
              <div className="w-full h-2 bg-yellow-200 rounded-full mt-2">
                <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${proyectosStats.total > 0 ? (proyectosStats.amarillos / proyectosStats.total) * 100 : 0}%` }} />
              </div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-xl">
              <p className="text-3xl font-black text-red-600">{proyectosStats.rojos}</p>
              <p className="text-xs font-bold text-red-700 uppercase">Rojos</p>
              <div className="w-full h-2 bg-red-200 rounded-full mt-2">
                <div className="h-full bg-red-500 rounded-full" style={{ width: `${proyectosStats.total > 0 ? (proyectosStats.rojos / proyectosStats.total) * 100 : 0}%` }} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs de Actividades */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-black text-muted-foreground uppercase flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Estado de Actividades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <p className="text-2xl font-black text-primary">{actividadesStats.total}</p>
              <p className="text-xs font-bold text-muted-foreground uppercase">Total</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-black text-gray-600">{actividadesStats.pendientes}</p>
              <p className="text-xs font-bold text-gray-600 uppercase">Pendientes</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-2xl font-black text-blue-600">{actividadesStats.enProgreso}</p>
              <p className="text-xs font-bold text-blue-600 uppercase">En Progreso</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-2xl font-black text-green-600">{actividadesStats.completadas}</p>
              <p className="text-xs font-bold text-green-600 uppercase">Completadas</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <p className="text-2xl font-black text-red-600">{actividadesStats.bloqueadas}</p>
              <p className="text-xs font-bold text-red-600 uppercase">Bloqueadas</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs del Período */}
      {kpis && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-bold text-purple-700 uppercase">Proyectos Iniciados</span>
            </div>
            <p className="text-2xl font-black text-purple-700">{kpis.proyectosIniciados}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-xl border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-xs font-bold text-green-700 uppercase">Proyectos Finalizados</span>
            </div>
            <p className="text-2xl font-black text-green-700">{kpis.proyectosFinalizados}</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-blue-700 uppercase">Actividades Creadas</span>
            </div>
            <p className="text-2xl font-black text-blue-700">{kpis.actividadesCreadas}</p>
          </div>
          <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              <span className="text-xs font-bold text-orange-700 uppercase">Alertas Activas</span>
            </div>
            <p className="text-2xl font-black text-orange-700">{(kpis.alertasTotales || 0) - (kpis.alertasResueltas || 0)}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function KPICard({
  title,
  value,
  icon,
  trend,
  color,
  bgColor,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: string;
  color: string;
  bgColor: string;
}) {
  const isPositive = trend?.startsWith("+");

  return (
    <Card className="border-none shadow-sm">
      <CardContent className="p-4 flex flex-row items-center justify-between">
        <div className={cn("p-2 rounded-lg", bgColor)}>
          <div className={cn("w-5 h-5", color)}>{icon}</div>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-muted-foreground uppercase">{title}</p>
          <p className={cn("text-xl font-black", color)}>{value}</p>
          {trend && (
            <div className={cn("flex items-center justify-end gap-1 text-xs font-bold", isPositive ? "text-green-600" : "text-red-600")}>
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{trend}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export { KPICard };
