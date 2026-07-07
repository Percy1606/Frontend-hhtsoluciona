"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { format, parseISO, differenceInCalendarDays } from "date-fns";
import { es } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Search,
  ClipboardList,
  CheckCircle2,
  Clock,
  Pencil,
  Trash2,
  FilterX,
  Calendar,
  AlertTriangle,
  FolderKanban,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  RefreshCw,
  Layers,
  ArrowRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSearchParams } from "next/navigation";
import { useOperacionesStore } from "@/store/operaciones-store";
import { useCRMStore } from "@/store/crm-store";
import type { Actividad, Proyecto } from "@/lib/types";
import { ActividadForm } from "@/components/operaciones/actividad-form";
import { ActividadesBulkModal } from "@/components/operaciones/actividades-bulk-modal";
import { toast } from "sonner";

const StatsCard = ({ label, value, icon, containerBg, iconBg, iconColor, titleColor, textColor }: any) => (
  <div className={cn("border-none shadow-sm rounded-2xl w-full", containerBg)}>
    <div className="p-3 flex items-center gap-3">
      <div className={cn("p-2 rounded-xl shrink-0", iconBg, iconColor)}>
        {icon}
      </div>
      <div>
        <p className={cn("text-[9px] font-black uppercase tracking-wider", titleColor)}>{label}</p>
        <p className={cn("text-xl font-black leading-none mt-1", textColor)}>{value}</p>
      </div>
    </div>
  </div>
);

const estadoColors: Record<string, string> = {
  "Pendiente": "bg-slate-100 text-slate-600",
  "En Progreso": "bg-blue-100 text-blue-700",
  "Completada": "bg-emerald-100 text-emerald-700",
  "Validada": "bg-emerald-500 text-white",
  "Bloqueada": "bg-red-100 text-red-700",
};

const tipoColors: Record<string, string> = {
  "Técnica": "bg-purple-100 text-purple-700",
  "Administrativa": "bg-blue-100 text-blue-700",
  "Logística": "bg-amber-100 text-amber-700",
  "Documental": "bg-emerald-100 text-emerald-700",
  "Validación": "bg-red-100 text-red-700",
};

const prioridadColors: Record<string, string> = {
  "Baja": "bg-slate-100 text-slate-700",
  "Media": "bg-amber-100 text-amber-700",
  "Alta": "bg-orange-100 text-orange-700",
  "Crítica": "bg-red-100 text-red-700",
};

const semaforoColors: Record<string, string> = {
  "Verde": "bg-emerald-400",
  "Amarillo": "bg-amber-400",
  "Rojo": "bg-red-500",
};

const estadoProyectoBadge: Record<string, string> = {
  "Planificación": "bg-blue-50 text-blue-700 border-blue-200",
  "En Ejecución": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Detenido": "bg-red-50 text-red-700 border-red-200",
  "Finalizado": "bg-slate-50 text-slate-600 border-slate-200",
};

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—";
  try {
    const justDate = dateStr.split('T')[0];
    const date = parseISO(`${justDate}T12:00:00`);
    return format(date, "dd/MM/yyyy");
  } catch (e) {
    return dateStr;
  }
};

const getDueDateStatus = (dateStr: string | null | undefined) => {
  if (!dateStr) return { isOverdue: false, isImminent: false };
  try {
    const dueDate = dateStr.includes('T') ? parseISO(dateStr) : parseISO(`${dateStr}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const imminentDate = new Date(today);
    imminentDate.setDate(today.getDate() + 1);

    const isOverdue = dueDate < today;
    const isImminent = dueDate >= today && dueDate <= imminentDate;

    return { isOverdue, isImminent };
  } catch (e) {
    return { isOverdue: false, isImminent: false };
  }
};

// ───────────────────────────────────────────────────────────────────
// Cálculo de los indicadores por proyecto
// ───────────────────────────────────────────────────────────────────
interface ProjectKpis {
  total: number;
  completadas: number;
  pendientes: number;
  enProgreso: number;
  vencidas: number;
  bloqueadas: number;
  proximaFechaTexto: string;
  proximaFechaRaw: string | null;
  proximaDias: number | null;
  promedioAvance: number;
  responsablesUnicos: number;
}

function calcKpis(actividadesGrupo: Actividad[]): ProjectKpis {
  const total = actividadesGrupo.length;
  const completadas = actividadesGrupo.filter(a => a.estado === "Completada" || a.estado === "Validada").length;
  const pendientes = actividadesGrupo.filter(a => a.estado === "Pendiente").length;
  const enProgreso = actividadesGrupo.filter(a => a.estado === "En Progreso").length;
  const bloqueadas = actividadesGrupo.filter(a => a.estado === "Bloqueada").length;

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const vencidas = actividadesGrupo.filter(a => {
    if (!a.fechaVencimiento) return false;
    if (a.estado === "Completada" || a.estado === "Validada") return false;
    return new Date(a.fechaVencimiento) < hoy;
  }).length;

  const fechasPendientes = actividadesGrupo
    .filter(a => a.fechaVencimiento && a.estado !== "Completada" && a.estado !== "Validada")
    .map(a => parseISO(a.fechaVencimiento!.split('T')[0] + 'T00:00:00'))
    .sort((a, b) => a.getTime() - b.getTime());

  let proximaFechaTexto = "—";
  let proximaFechaRaw: string | null = null;
  let proximaDias: number | null = null;

  if (fechasPendientes.length > 0) {
    const proxima = fechasPendientes[0];
    proximaFechaRaw = format(proxima, "yyyy-MM-dd");
    const diff = differenceInCalendarDays(proxima, hoy);
    proximaDias = diff;
    if (diff < 0) {
      proximaFechaTexto = `Vencida hace ${Math.abs(diff)}d · ${format(proxima, "dd MMM", { locale: es })}`;
    } else if (diff === 0) {
      proximaFechaTexto = `Vence hoy · ${format(proxima, "dd MMM", { locale: es })}`;
    } else if (diff <= 7) {
      proximaFechaTexto = `En ${diff}d · ${format(proxima, "dd MMM", { locale: es })}`;
    } else {
      proximaFechaTexto = format(proxima, "dd MMM yyyy", { locale: es });
    }
  }

  const promedioAvance = total > 0
    ? Math.round(actividadesGrupo.reduce((acc, a) => acc + (a.progreso || 0), 0) / total)
    : 0;

  const responsablesUnicos = new Set(
    actividadesGrupo.map(a => a.responsablePrincipalId).filter(Boolean)
  ).size;

  return {
    total,
    completadas,
    pendientes,
    enProgreso,
    bloqueadas,
    vencidas,
    proximaFechaTexto,
    proximaFechaRaw,
    proximaDias,
    promedioAvance,
    responsablesUnicos,
  };
}

export default function ActividadesClient() {
  const searchParams = useSearchParams();
  const {
    actividades,
    totalActividades,
    actividadPage,
    actividadTotalPages,
    responsables,
    proyectos: proyectosStore,
    fetchActividades,
    fetchResponsables,
    fetchProyectos,
    deleteActividad,
    loading,
  } = useOperacionesStore();

  const { clients: crmClients, fetchClients } = useCRMStore();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [editingActividad, setEditingActividad] = useState<Actividad | null>(null);
  const [defaultProyectoId, setDefaultProyectoId] = useState<string | null>(null);
  const [defaultProyectoForBulk, setDefaultProyectoForBulk] = useState<Proyecto | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("all");
  const [filtroResponsable, setFiltroResponsable] = useState("all");

  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Solo traemos todo sin filtros, los filtros se aplicarán de forma local
    fetchActividades(1, 1000);
    fetchResponsables();
    if (proyectosStore.length === 0) {
      fetchProyectos(1, 200);
    }
    if (crmClients.length === 0) {
      fetchClients(1, 1000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Removemos dependencias para que solo llame al API una vez al inicio

  // =====================
  // FILTRADO LOCAL
  // =====================
  const filteredActividades = useMemo(() => {
    return actividades.filter(a => {
      const matchEstado = filtroEstado === "all" || a.estado === filtroEstado;
      const matchResp = filtroResponsable === "all" || a.responsablePrincipalId === filtroResponsable;
      const q = searchQuery.toLowerCase();
      const matchSearch = q === "" || 
                          (a.descripcion && a.descripcion.toLowerCase().includes(q)) || 
                          (a.proyectoNombre && a.proyectoNombre.toLowerCase().includes(q)) ||
                          (a.proyectoCodigo && a.proyectoCodigo.toLowerCase().includes(q));
      return matchEstado && matchResp && matchSearch;
    });
  }, [actividades, filtroEstado, filtroResponsable, searchQuery]);

  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId && actividades.length > 0) {
      const target = actividades.find(a => a.id === editId);
      if (target) {
        setEditingActividad(target);
        setIsFormOpen(true);
        if (target.proyectoId) {
          setExpanded(prev => {
            const n = new Set(prev);
            n.add(target.proyectoId);
            return n;
          });
        }
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [searchParams, actividades]);

  const stats = useMemo(() => ({
    total: filteredActividades.length,
    pendientes: filteredActividades.filter(a => a.estado === 'Pendiente').length,
    enProgreso: filteredActividades.filter(a => a.estado === 'En Progreso').length,
    completadas: filteredActividades.filter(a => a.estado === 'Completada' || a.estado === 'Validada').length,
    bloqueadas: filteredActividades.filter(a => a.estado === 'Bloqueada').length,
  }), [filteredActividades]);

  const getResponsableName = useCallback((id: string) => {
    if (!id) return "SIN ASIGNAR";
    const resp = responsables.find(r => r.id === id);
    if (resp) return resp.nombre.toUpperCase();
    if (id.includes('-') && id.length > 20) return "RESPONSABLE EXTERNO";
    return id.toUpperCase();
  }, [responsables]);

  const getProyectoFull = useCallback((id: string): Proyecto | undefined => {
    return proyectosStore.find(p => p.id === id);
  }, [proyectosStore]);

  const toggleProject = useCallback((id: string) => {
    setExpanded(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }, []);

  const groupedByProject = useMemo(() => {
    const map = new Map<string, {
      proyectoId: string;
      codigo: string;
      nombre: string;
      actividades: Actividad[];
    }>();
    // Usamos filteredActividades en lugar de actividades
    for (const act of filteredActividades) {
      const key = act.proyectoId || "SIN_PROYECTO";
      const existing = map.get(key);
      if (existing) {
        existing.actividades.push(act);
      } else {
        map.set(key, {
          proyectoId: act.proyectoId || "SIN_PROYECTO",
          codigo: act.proyectoCodigo || "—",
          nombre: act.proyectoNombre || "PROYECTO SIN NOMBRE",
          actividades: [act],
        });
      }
    }
    return Array.from(map.values());
  }, [filteredActividades]);

  const expandAllProjects = useCallback(() => {
    setExpanded(new Set(groupedByProject.map(g => g.proyectoId)));
  }, [groupedByProject]);

  const collapseAllProjects = useCallback(() => {
    setExpanded(new Set());
  }, []);

  const handleEdit = (actividad: Actividad) => {
    setEditingActividad(actividad);
    setDefaultProyectoId(actividad.proyectoId);
    setIsFormOpen(true);
  };

  const handleNewActivity = (proyectoId?: string) => {
    setEditingActividad(null);
    setDefaultProyectoId(proyectoId ?? null);
    setIsFormOpen(true);
  };

  const handleOpenBulk = (proyecto?: Proyecto | null) => {
    setDefaultProyectoForBulk(proyecto ?? null);
    setIsBulkOpen(true);
  };

  const handleDelete = async (proyectoId: string, actividadId: string) => {
    if (confirm("¿Estás seguro de eliminar esta actividad?")) {
      try {
        await deleteActividad(proyectoId, actividadId);
        toast.success("Actividad Eliminada", { description: "La tarea ha sido removida del proyecto." });
      } catch (err) {
        toast.error("Error al Eliminar", { description: "No se pudo borrar la actividad." });
      }
    }
  };

  const resetFiltros = () => {
    setSearchQuery("");
    setFiltroEstado("all");
    setFiltroResponsable("all");
  };

  const handleForceRefresh = async () => {
    toast.promise(
      (async () => {
        useOperacionesStore.setState({ actividades: [] });
        await fetchActividades(1, 20);
      })(),
      {
        loading: 'Sincronizando con el servidor...',
        success: 'Base de datos sincronizada correctamente.',
        error: 'Error al sincronizar datos.',
      }
    );
  };

  return (
    <div className="space-y-5">
      {/* Header compacto */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="bg-primary/10 p-1.5 rounded-md">
              <ClipboardList className="w-4 h-4 text-primary" />
            </div>
            <h1 className="text-base font-bold text-primary tracking-tight">Gestión de Actividades</h1>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5 font-medium uppercase tracking-wide">
            Vista jerárquica: proyecto → actividades
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto mt-2 md:mt-0">
          {groupedByProject.length > 0 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={expandAllProjects}
                className="h-8 px-2 font-semibold uppercase text-[9px] tracking-wide text-slate-500 hover:text-primary"
                title="Expandir todo"
              >
                <Layers className="w-3 h-3 mr-1" /> Expandir
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={collapseAllProjects}
                className="h-8 px-2 font-semibold uppercase text-[9px] tracking-wide text-slate-500 hover:text-primary"
                title="Contraer todo"
              >
                <Layers className="w-3 h-3 mr-1" /> Contraer
              </Button>
            </>
          )}
          <Button
            variant="outline"
            onClick={handleForceRefresh}
            className="h-8 px-3 font-semibold uppercase text-[9px] tracking-wide border-slate-200 hover:bg-slate-50 gap-1.5 rounded-md"
            title="Limpiar caché local y forzar sincronización"
          >
            <RefreshCw className="w-3 h-3" />
            Sincronizar
          </Button>
          <Button
            variant="outline"
            className="h-8 gap-1.5 font-semibold uppercase text-[9px] tracking-wide border-slate-200 bg-white hover:bg-primary/5 hover:border-primary/30 rounded-md px-3"
            onClick={() => handleOpenBulk(null)}
          >
            <Plus className="w-3 h-3" /> Carga Masiva
          </Button>
          <Button
            className="h-8 gap-1.5 font-semibold uppercase text-[9px] tracking-wide bg-primary hover:bg-primary/90 shadow-sm shadow-primary/20 rounded-md px-4"
            onClick={() => handleNewActivity()}
          >
            <Plus className="w-3 h-3" /> Nueva Actividad
          </Button>
        </div>
      </div>

      {/* Stats globales (compactados) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatsCard 
          label="Total" value={stats.total} icon={<ClipboardList className="w-4 h-4" />} 
          containerBg="bg-primary/5" iconBg="bg-primary/10" iconColor="text-primary" titleColor="text-primary/70" textColor="text-primary" 
        />
        <StatsCard 
          label="Pendientes" value={stats.pendientes} icon={<Clock className="w-4 h-4" />} 
          containerBg="bg-slate-50" iconBg="bg-slate-100" iconColor="text-slate-600" titleColor="text-slate-400" textColor="text-slate-700" 
        />
        <StatsCard 
          label="En Marcha" value={stats.enProgreso} icon={<Clock className="w-4 h-4" />} 
          containerBg="bg-blue-50" iconBg="bg-blue-100" iconColor="text-blue-600" titleColor="text-blue-400" textColor="text-blue-700" 
        />
        <StatsCard 
          label="Culminadas" value={stats.completadas} icon={<CheckCircle2 className="w-4 h-4" />} 
          containerBg="bg-emerald-50" iconBg="bg-emerald-100" iconColor="text-emerald-600" titleColor="text-emerald-400" textColor="text-emerald-700" 
        />
      </div>

      {/* Filtros (compactados) */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-none flex flex-col lg:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <Input
              placeholder="Buscar actividad, proyecto o código..."
              className="pl-9 h-8 border-slate-200 text-xs font-medium focus:bg-white shadow-none rounded-md"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <Select value={filtroEstado} onValueChange={(val) => setFiltroEstado(val || "all")}>
            <SelectTrigger className="h-8 border-slate-200 bg-white text-[10px] font-semibold shadow-none rounded-md min-w-[140px]">
              <SelectValue placeholder="Estado">
                {filtroEstado !== "all" ?
                  <span className="uppercase">{filtroEstado}</span> :
                  <span className="text-slate-400 uppercase tracking-tight italic">Todos los estados</span>
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200">
              <SelectItem value="all" className="text-[10px] text-slate-400 italic">Todos los estados</SelectItem>
              <SelectItem value="Pendiente" className="uppercase text-[10px] font-semibold">Pendiente</SelectItem>
              <SelectItem value="En Progreso" className="uppercase text-[10px] font-semibold">En Progreso</SelectItem>
              <SelectItem value="Completada" className="uppercase text-[10px] font-semibold">Completada</SelectItem>
              <SelectItem value="Validada" className="uppercase text-[10px] font-semibold">Validada</SelectItem>
              <SelectItem value="Bloqueada" className="uppercase text-[10px] font-semibold">Bloqueada</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filtroResponsable} onValueChange={(val) => setFiltroResponsable(val || "all")}>
            <SelectTrigger className="h-8 border-slate-200 bg-white text-[10px] font-semibold shadow-none rounded-md min-w-[170px]">
              <SelectValue placeholder="Responsable">
                {filtroResponsable !== "all" ?
                  <span className="uppercase truncate">{getResponsableName(filtroResponsable)}</span> :
                  <span className="text-slate-400 uppercase tracking-tight italic">Todos los responsables</span>
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200">
              <SelectItem value="all" className="text-[10px] text-slate-400 italic">Todos los responsables</SelectItem>
              {responsables.map(r => (
                <SelectItem key={r.id} value={r.id} className="uppercase text-[10px] font-semibold">{r.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="icon"
            onClick={resetFiltros}
            className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-100 hover:border-red-200 rounded-md"
            title="Limpiar filtros"
          >
            <FilterX className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* ─── Vista agrupada por proyecto (carpetas desplegables, COMPACTAS) ─── */}
      <div className="space-y-2.5">
        {loading ? (
          <div className="bg-white rounded-lg border border-slate-200 p-16 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
            <p className="text-[10px] font-semibold uppercase text-slate-400 tracking-wide mt-2">
              Sincronizando actividades...
            </p>
          </div>
        ) : groupedByProject.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-10 text-center">
            <div className="bg-primary/5 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <FolderOpen className="w-6 h-6 text-primary/60" />
            </div>
            <p className="text-[10px] font-semibold uppercase text-slate-500 tracking-wide">
              No se encontraron actividades con los filtros aplicados
            </p>
            <p className="text-[9px] text-slate-400 mt-1">
              Crea una nueva actividad o ajusta los filtros para ver resultados.
            </p>
            <Button
              className="mt-3 h-8 gap-1.5 font-semibold uppercase text-[9px] bg-primary hover:bg-primary/90 shadow-sm shadow-primary/20 rounded-md px-4"
              onClick={() => handleNewActivity()}
            >
              <Plus className="w-3 h-3" /> Nueva Actividad
            </Button>
          </div>
        ) : (
          groupedByProject.map((grupo) => {
            const kpis = calcKpis(grupo.actividades);
            const isOpen = expanded.has(grupo.proyectoId);
            const proyectoFull = getProyectoFull(grupo.proyectoId);
            const estadoNombre = proyectoFull?.estado || "";
            const semaforoCls = semaforoColors[proyectoFull?.semaforo || ""] || "bg-slate-300";
            const estadoCls = estadoProyectoBadge[estadoNombre] || "bg-slate-50 text-slate-600 border-slate-200";
            const responsableProyecto = proyectoFull?.responsablePrincipalId
              ? getResponsableName(proyectoFull.responsablePrincipalId)
              : null;

            // Tono del chip "Vencidas" según cantidad
            const vencidasTone =
              kpis.vencidas > 5 ? "bg-red-500/30 border-red-300/40 text-red-50" :
              kpis.vencidas > 0 ? "bg-amber-500/20 border-amber-300/40 text-amber-50" :
              "bg-white/10 border-white/20 text-white/80";

            const avanceTone =
              kpis.promedioAvance >= 80 ? "bg-emerald-500/25 border-emerald-300/40 text-emerald-50" :
              kpis.promedioAvance >= 50 ? "bg-sky-500/20 border-sky-300/40 text-sky-50" :
              "bg-white/10 border-white/20 text-white/85";

            return (
              <div
                key={grupo.proyectoId}
                className={cn(
                  "bg-white rounded-lg border border-slate-200 shadow-none overflow-hidden transition-all duration-150",
                  "hover:shadow-sm hover:border-slate-300",
                  isOpen && "border-primary/25 shadow-sm"
                )}
              >
                {/* ══════════════════════════════════════════════════════════
                    COMPACT HEADER: UNA SOLA FILA (~60px de altura)
                    ══════════════════════════════════════════════════════════ */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleProject(grupo.proyectoId)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleProject(grupo.proyectoId);
                    }
                  }}
                  aria-expanded={isOpen}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-primary to-primary/85 text-white cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                >
                  {/* Icono */}
                  <div
                    className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border transition-colors",
                      isOpen ? "bg-white border-white" : "bg-white/10 border-white/20"
                    )}
                  >
                    {isOpen ? <FolderOpen className="w-4 h-4 text-primary" /> : <FolderKanban className="w-4 h-4 text-accent" />}
                  </div>

                  {/* Código + Nombre + Cliente (flex-1) */}
                  <div className="flex flex-col justify-center min-w-0 flex-shrink min-w-[200px] max-w-[40%] gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold text-accent uppercase tracking-wider shrink-0">
                        {grupo.codigo}
                      </span>
                      <span className="text-[10px] text-white/40 shrink-0">·</span>
                      <h2 className="text-[13px] font-semibold tracking-tight truncate" title={grupo.nombre}>
                        {grupo.nombre}
                      </h2>
                    </div>
                    {proyectoFull?.clientId && (
                      <div className="text-[9px] font-black tracking-widest uppercase text-amber-300 truncate" title={crmClients.find(c => c.id === proyectoFull.clientId)?.empresa || "CLIENTE EXTERNO"}>
                        {crmClients.find(c => c.id === proyectoFull.clientId)?.empresa || "CLIENTE EXTERNO"}
                      </div>
                    )}
                  </div>

                  {/* Semáforo + Estado */}
                  <div className="hidden md:flex items-center gap-1.5 shrink-0">
                    <span className={cn("w-2 h-2 rounded-full ring-2 ring-white/30", semaforoCls)} title={proyectoFull?.semaforo || "Sin semáforo"} />
                    {estadoNombre && (
                      <span className={cn("text-[9px] font-semibold px-1.5 py-0.5 rounded-full border tracking-wide", estadoCls)}>
                        {estadoNombre}
                      </span>
                    )}
                  </div>

                  {/* KPIs INLINE COMPACTOS (centro) */}
                  <div className="hidden xl:flex items-center gap-1.5 shrink-0">
                    <span className="flex items-center gap-1 text-[10px] font-medium bg-white/10 px-2 py-0.5 rounded border border-white/10 tabular-nums">
                      <span className="opacity-70 uppercase text-[9px] tracking-wider">Total</span>
                      <span className="font-bold">{kpis.total}</span>
                    </span>
                    <span className={cn(
                      "flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded border tabular-nums",
                      kpis.completadas > 0 ? "bg-emerald-500/20 border-emerald-300/30 text-emerald-50" : "bg-white/10 border-white/10 text-white/80"
                    )}>
                      <span className="opacity-70 uppercase text-[9px] tracking-wider">Completadas</span>
                      <span className="font-bold">{kpis.completadas}</span>
                    </span>
                    <span className={cn(
                      "flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded border tabular-nums",
                      kpis.pendientes > 0 ? "bg-amber-500/20 border-amber-300/30 text-amber-50" : "bg-white/10 border-white/10 text-white/80"
                    )}>
                      <span className="opacity-70 uppercase text-[9px] tracking-wider">Pendientes</span>
                      <span className="font-bold">{kpis.pendientes}</span>
                    </span>
                    <span className={cn("flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded border tabular-nums", vencidasTone)}>
                      <span className="opacity-70 uppercase text-[9px] tracking-wider">Vencidas</span>
                      <span className="font-bold">{kpis.vencidas}</span>
                    </span>
                    <div className="w-px h-3.5 bg-white/20 mx-0.5" />
                    <span className={cn("flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded border tabular-nums", avanceTone)}>
                      <span className="opacity-70 uppercase text-[9px] tracking-wider">Avance</span>
                      <span className="font-bold">{kpis.promedioAvance}%</span>
                    </span>
                  </div>

                  {/* Acciones icon-only */}
                  <div className="flex items-center gap-0.5 shrink-0 ml-auto">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleNewActivity(grupo.proyectoId); }}
                      className="w-7 h-7 rounded-md flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/15 transition-colors"
                      title="Nueva actividad"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleOpenBulk(proyectoFull || null); }}
                      className="w-7 h-7 rounded-md flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/15 transition-colors"
                      title="Carga masiva"
                    >
                      <Layers className="w-3.5 h-3.5" />
                    </button>

                    <div className="w-px h-4 bg-white/20 mx-0.5" />
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleProject(grupo.proyectoId); }}
                      className={cn(
                        "w-7 h-7 rounded-md flex items-center justify-center transition-colors",
                        isOpen ? "bg-white/15" : "bg-white/5 hover:bg-white/15"
                      )}
                      title={isOpen ? "Contraer" : "Expandir"}
                    >
                      {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* ══════════════════════════════════════════════════════════
                    SUB-INFO STRIP (solo cuando expandido)
                    ══════════════════════════════════════════════════════════ */}
                <div
                  className={cn(
                    "transition-all duration-200 ease-in-out overflow-hidden",
                    isOpen ? "max-h-24 opacity-100" : "max-h-0 opacity-0"
                  )}
                >
                  <div className="bg-slate-50/80 border-b border-slate-100 px-4 py-2 flex flex-wrap items-center justify-between gap-x-5 gap-y-1 text-[10px] text-slate-600">
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 min-w-0">
                      {responsableProyecto && (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="font-semibold text-slate-400 uppercase tracking-wider text-[9px]">Resp:</span>
                          <span className="font-medium text-slate-700">{responsableProyecto}</span>
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1.5">
                        <span className="font-semibold text-slate-400 uppercase tracking-wider text-[9px]">Próx. Vence:</span>
                        <span className={cn(
                          "font-medium",
                          kpis.proximaDias == null ? "text-slate-400" :
                          kpis.proximaDias < 0 ? "text-red-600 font-semibold" :
                          kpis.proximaDias <= 7 ? "text-amber-700 font-semibold" :
                          "text-slate-700"
                        )}>
                          {kpis.proximaFechaTexto}
                        </span>
                      </span>
                      {kpis.bloqueadas > 0 && (
                        <span className="inline-flex items-center gap-1 text-red-600 font-semibold">
                          <AlertTriangle className="w-3 h-3" />
                          {kpis.bloqueadas} bloqueada{kpis.bloqueadas === 1 ? "" : "s"}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1.5">
                        <span className="font-semibold text-slate-400 uppercase tracking-wider text-[9px]">Completadas:</span>
                        <span className="font-semibold text-emerald-700 tabular-nums">{kpis.completadas}/{kpis.total}</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="font-semibold text-slate-400 uppercase tracking-wider text-[9px]">Responsables:</span>
                        <span className="font-medium text-slate-700 tabular-nums">{kpis.responsablesUnicos}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* ══════════════════════════════════════════════════════════
                    ACTIVITIES TABLE (compacta)
                    ══════════════════════════════════════════════════════════ */}
                <div
                  className={cn(
                    "transition-all duration-300 ease-in-out overflow-hidden",
                    isOpen ? "max-h-[9999px] opacity-100" : "max-h-0 opacity-0"
                  )}
                >
                  <div className="border-t border-slate-100">
                    {grupo.actividades.length === 0 ? (
                      <div className="text-center py-8">
                        <ClipboardList className="w-6 h-6 text-slate-200 mx-auto mb-1.5" />
                        <p className="text-[10px] font-semibold uppercase text-slate-400 tracking-wide">
                          Sin actividades registradas
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleNewActivity(grupo.proyectoId)}
                          className="mt-3 h-7 px-3 font-semibold uppercase text-[9px] tracking-wide gap-1.5 border-primary/30 text-primary hover:bg-primary/5 rounded-md"
                        >
                          <Plus className="w-3 h-3" /> Crear primera actividad
                        </Button>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader className="bg-slate-50/60">
                          <TableRow>
                            <TableHead className="font-bold text-primary uppercase text-[9px] tracking-wide py-2 pl-4 w-8">#</TableHead>
                            <TableHead className="font-bold text-primary uppercase text-[9px] tracking-wide py-2">Actividad</TableHead>
                            <TableHead className="font-bold text-primary uppercase text-[9px] tracking-wide py-2 w-20">Tipo</TableHead>
                            <TableHead className="font-bold text-primary uppercase text-[9px] tracking-wide py-2 w-20">Prioridad</TableHead>
                            <TableHead className="font-bold text-primary uppercase text-[9px] tracking-wide py-2 w-32">Responsable</TableHead>
                            <TableHead className="font-bold text-primary uppercase text-[9px] tracking-wide py-2 w-44">Cronograma</TableHead>
                            <TableHead className="font-bold text-primary uppercase text-[9px] tracking-wide py-2 w-28">Avance</TableHead>
                            <TableHead className="font-bold text-primary uppercase text-[9px] tracking-wide py-2 w-24">Estado</TableHead>
                            <TableHead className="text-right font-bold text-primary uppercase text-[9px] tracking-wide py-2 pr-4 w-16">·</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {grupo.actividades.map((actividad, index) => {
                            const { isOverdue, isImminent } = getDueDateStatus(actividad.fechaVencimiento);
                            const needsAttention =
                              (isOverdue || isImminent) &&
                              actividad.estado !== "Validada" &&
                              actividad.estado !== "Completada";

                            return (
                              <TableRow
                                key={actividad.id}
                                className={cn(
                                  "hover:bg-slate-50/50 transition-colors border-b border-slate-100/60",
                                  needsAttention ? "bg-red-50/20" : "",
                                )}
                              >
                                <TableCell className="pl-4 py-2 font-semibold text-[9px] text-slate-400 tabular-nums">
                                  {(actividadPage - 1) * 20 + index + 1}
                                </TableCell>
                                <TableCell className="py-2">
                                  <p
                                    className={cn(
                                      "font-semibold text-[11px] leading-snug max-w-[420px] line-clamp-1",
                                      (actividad.estado === "Completada" || actividad.estado === "Validada") ? "text-slate-400 line-through" : "text-slate-800",
                                    )}
                                  >
                                    {actividad.descripcion}
                                  </p>
                                </TableCell>
                                <TableCell className="py-2">
                                  <Badge variant="outline" className={cn("text-[8px] font-semibold uppercase tracking-tight px-1.5 py-0", tipoColors[actividad.tipo] || "bg-slate-100 text-slate-700")}>
                                    {actividad.tipo}
                                  </Badge>
                                </TableCell>
                                <TableCell className="py-2">
                                  <Badge variant="outline" className={cn("text-[8px] font-semibold uppercase tracking-tight px-1.5 py-0", prioridadColors[actividad.prioridad] || "bg-slate-100 text-slate-700")}>
                                    {actividad.prioridad}
                                  </Badge>
                                </TableCell>
                                <TableCell className="py-2">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <div className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-[7px] font-bold text-slate-500 uppercase border border-slate-200 shrink-0">
                                      {getResponsableName(actividad.responsablePrincipalId).charAt(0)}
                                    </div>
                                    <span className="text-[9px] font-semibold text-slate-700 uppercase truncate">
                                      {getResponsableName(actividad.responsablePrincipalId)}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="py-2">
                                  <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-600 tabular-nums">
                                    <span>{actividad.fechaInicio ? formatDate(actividad.fechaInicio) : '—'}</span>
                                    <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />
                                    <span className={cn(
                                      "font-semibold inline-flex items-center gap-1",
                                      needsAttention ? "text-red-600" : "text-primary"
                                    )}>
                                      {needsAttention && <AlertTriangle className="w-2.5 h-2.5" />}
                                      {actividad.fechaVencimiento ? formatDate(actividad.fechaVencimiento) : '—'}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="py-2">
                                  <div className="flex items-center gap-1.5">
                                    <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                                      <div
                                        className={cn(
                                          "h-full rounded-full transition-all",
                                          (actividad.estado === "Completada" || actividad.estado === "Validada") ? "bg-emerald-500" : "bg-primary"
                                        )}
                                        style={{ width: `${actividad.progreso || 0}%` }}
                                      />
                                    </div>
                                    <span className="font-semibold text-[10px] text-primary w-7 text-right tabular-nums">
                                      {actividad.progreso}%
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="py-2">
                                  <Badge className={cn("border-none font-semibold text-[8px] uppercase tracking-tight shadow-none px-1.5 py-0 h-4", estadoColors[actividad.estado] || "bg-slate-100 text-slate-700")}>
                                    {actividad.estado}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right pr-4 py-2">
                                  <div className="flex items-center justify-end gap-0">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 text-primary hover:bg-primary/5 rounded"
                                      onClick={() => handleEdit(actividad)}
                                      title="Editar"
                                    >
                                      <Pencil className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded"
                                      onClick={() => handleDelete(actividad.proyectoId, actividad.id)}
                                      title="Eliminar"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Resumen y paginación global (compactados) */}
        {!loading && groupedByProject.length > 0 && (
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap items-center justify-between gap-2">
            <p className="text-[9px] font-semibold uppercase text-slate-500 tracking-wide ml-1.5 tabular-nums">
              {filteredActividades.length} actividad{filteredActividades.length === 1 ? "" : "es"} encontradas · {groupedByProject.length} proyecto{groupedByProject.length === 1 ? "" : "s"}
            </p>
          </div>
        )}
      </div>

      {isBulkOpen && (
        <ActividadesBulkModal
          isOpen={isBulkOpen}
          proyecto={defaultProyectoForBulk || undefined}
          onClose={() => {
            setIsBulkOpen(false);
            setDefaultProyectoForBulk(null);
            fetchActividades(1, 20);
          }}
        />
      )}
      {isFormOpen && (
        <ActividadForm
          proyectoId={defaultProyectoId ?? undefined}
          actividad={editingActividad}
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingActividad(null);
            setDefaultProyectoId(null);
          }}
        />
      )}
    </div>
  );
}
