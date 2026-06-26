"use client";

import { useState, useMemo, useCallback } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Plus,
  CheckCircle2,
  Clock,
  Calendar,
  Lock,
  Unlock,
  FileCheck,
  ClipboardList,
  Pencil,
  Trash2,
  AlertTriangle,
  MoreVertical,
  Search,
  FilterX,
  X,
  FolderOpen,
  ChevronDown,
  ChevronUp,
  Package,
  FileText,
  Hammer,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useOperacionesStore } from "@/store/operaciones-store";
import type { Proyecto, Actividad } from "@/lib/types";
import { ActividadForm } from "./actividad-form";
import { ActividadesBulkModal } from "./actividades-bulk-modal";
import { CopiarAlcanceModal } from "./copiar-alcance-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const tipoColors: Record<string, string> = {
  "Técnica": "bg-purple-100 text-purple-700",
  "Administrativa": "bg-blue-100 text-blue-700",
  "Logística": "bg-yellow-100 text-yellow-700",
  "Documental": "bg-green-100 text-green-700",
  "Validación": "bg-red-100 text-red-700",
};

const prioridadColors: Record<string, string> = {
  "Baja": "bg-gray-100 text-gray-700",
  "Media": "bg-yellow-100 text-yellow-700",
  "Alta": "bg-orange-100 text-orange-700",
  "Crítica": "bg-red-100 text-red-700",
};

const estadoActividadColors: Record<string, string> = {
  "Pendiente": "bg-gray-100 text-gray-700",
  "En Progreso": "bg-blue-100 text-blue-700",
  "Completada": "bg-green-100 text-green-700",
  "Validada": "bg-emerald-500 text-white",
  "Bloqueada": "bg-red-100 text-red-700",
};

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—";
  try {
    const date = dateStr.includes('T') ? parseISO(dateStr) : parseISO(`${dateStr}T00:00:00`);
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
    
    // Due date + 1 day for imminent check
    const imminentDate = new Date(today);
    imminentDate.setDate(today.getDate() + 1);

    const isOverdue = dueDate < today;
    const isImminent = dueDate >= today && dueDate <= imminentDate;

    return { isOverdue, isImminent };
  } catch (e) {
    return { isOverdue: false, isImminent: false };
  }
};

const groupMeta: Record<string, { icon: React.ReactNode; color: string; bgColor: string }> = {
  "Actividades": {
    icon: <ClipboardList className="w-5 h-5 text-blue-600" />,
    color: "text-blue-600",
    bgColor: "bg-blue-50 border-blue-100"
  },
  "Validaciones": {
    icon: <FileCheck className="w-5 h-5 text-emerald-600" />,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 border-emerald-100"
  },
  "Entregables": {
    icon: <Package className="w-5 h-5 text-purple-600" />,
    color: "text-purple-600",
    bgColor: "bg-purple-50 border-purple-100"
  },
  "Documentación": {
    icon: <FileText className="w-5 h-5 text-orange-600" />,
    color: "text-orange-600",
    bgColor: "bg-orange-50 border-orange-100"
  },
  "Ejecución de Campo": {
    icon: <Hammer className="w-5 h-5 text-amber-600" />,
    color: "text-amber-600",
    bgColor: "bg-amber-50 border-amber-100"
  },
  "Informes": {
    icon: <TrendingUp className="w-5 h-5 text-cyan-600" />,
    color: "text-cyan-600",
    bgColor: "bg-cyan-50 border-cyan-100"
  },
  "Cierre": {
    icon: <Lock className="w-5 h-5 text-rose-600" />,
    color: "text-rose-600",
    bgColor: "bg-rose-50 border-rose-100"
  }
};

interface ActividadesPanelProps {
  proyecto: Proyecto;
}

export function ActividadesPanel({ proyecto }: ActividadesPanelProps) {
  const { 
    responsables, 
    deleteActividad, 
    updateActividad,
    toggleSubtarea, 
    bloquearChecklist, 
    desbloquearChecklist,
    aprobarValidacion,
    rechazarValidacion
  } = useOperacionesStore();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [isAlcanceOpen, setIsAlcanceOpen] = useState(false);
  const [editingActividad, setEditingActividad] = useState<Actividad | null>(null);
  const [progresoEditando, setProgresoEditando] = useState<Record<string, string>>({});
  const [defaultGroupForNew, setDefaultGroupForNew] = useState<string | undefined>(undefined);

  // Filtros locales para actividades
  const [filtroEstado, setFiltroEstado] = useState<string>("all");
  const [filtroResponsable, setFiltroResponsable] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredActividades = (proyecto.actividades || []).filter(a => {
    if (filtroEstado !== "all" && a.estado !== filtroEstado) return false;
    if (filtroResponsable !== "all" && a.responsablePrincipalId !== filtroResponsable) return false;
    if (searchQuery && !a.descripcion.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const availableGroups = useMemo(() => {
    const defaultGroups = [
      "Actividades",
      "Validaciones",
      "Entregables",
      "Documentación",
      "Ejecución de Campo",
      "Informes",
      "Cierre"
    ];
    if (!proyecto.area) return defaultGroups;
    switch (proyecto.area as any) {
      case "LogisticaYRecursos":
      case "Logística y Recursos":
        return ["Actividades", "Validaciones", "Documentación", "Informes", "Cierre"];
      case "IngenieriaYSupervision":
      case "Ingeniería y Supervisión Técnica":
        return ["Actividades", "Validaciones", "Entregables", "Documentación", "Informes", "Cierre"];
      case "GestionDocumentaria":
      case "Gestión Documentaria y Expedientes Técnicos":
        return ["Actividades", "Validaciones", "Documentación", "Informes", "Cierre"];
      case "OperacionesDeCampo":
      case "Operaciones de Campo y Control de Obra":
      default:
        return defaultGroups;
    }
  }, [proyecto.area]);

  const mapActividadAGrupo = useCallback((actividad: Actividad) => {
    const desc = actividad.descripcion;
    const match = desc.match(/^\[(.*?)\]\s*(.*)$/i);
    const prefix = match ? match[1].trim().toUpperCase() : "";
    
    if (prefix) {
      const prefixUpper = prefix.toUpperCase();
      if (prefixUpper.includes("VALIDAC")) {
        if (availableGroups.includes("Validaciones")) return "Validaciones";
      }
      if (prefixUpper.includes("ENTREGABL") || prefixUpper.includes("HITO")) {
        if (availableGroups.includes("Entregables")) return "Entregables";
      }
      if (prefixUpper.includes("DOCUMENTA") || prefixUpper.includes("ARCHIVO") || prefixUpper.includes("PLANO")) {
        if (availableGroups.includes("Documentación")) return "Documentación";
      }
      if (prefixUpper.includes("CAMPO") || prefixUpper.includes("EJECUCION") || prefixUpper.includes("OBRA")) {
        if (availableGroups.includes("Ejecución de Campo")) return "Ejecución de Campo";
      }
      if (prefixUpper.includes("INFORME") || prefixUpper.includes("REPORTE")) {
        if (availableGroups.includes("Informes")) return "Informes";
      }
      if (prefixUpper.includes("CIERRE") || prefixUpper.includes("LIQUIDAC")) {
        if (availableGroups.includes("Cierre")) return "Cierre";
      }
      if (prefixUpper.includes("ACTIVIDAD")) {
        if (availableGroups.includes("Actividades")) return "Actividades";
      }
      const exactMatch = availableGroups.find(g => g.toUpperCase() === prefixUpper);
      if (exactMatch) return exactMatch;
    }
    
    const tipoLower = (actividad.tipo || "").toLowerCase();
    if (tipoLower.includes("validacion") || tipoLower.includes("validación")) {
      if (availableGroups.includes("Validaciones")) return "Validaciones";
    }
    if (tipoLower.includes("documental")) {
      if (availableGroups.includes("Documentación")) return "Documentación";
    }
    
    return availableGroups[0] || "Actividades";
  }, [availableGroups]);

  const activitiesByFolder = useMemo(() => {
    const groups: Record<string, Actividad[]> = {};
    availableGroups.forEach(g => {
      groups[g] = [];
    });
    filteredActividades.forEach((a) => {
      const groupName = mapActividadAGrupo(a);
      groups[groupName].push(a);
    });
    return groups;
  }, [filteredActividades, availableGroups, mapActividadAGrupo]);

  const toggleGroup = (groupName: string) => {
    setCollapsedGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  const getCleanDescription = (desc: string) => {
    const match = desc.match(/^\[(.*?)\]\s*(.*)$/i);
    return match ? match[2].trim() : desc;
  };

  const getResponsableDisplay = (id: string) => {
    const resp = responsables.find(r => r.id === id);
    if (resp) return { nombre: resp.nombre, area: resp.area, color: resp.color };
    
    if (id && id.includes('-') && id.length > 20) {
      return { nombre: "RESPONSABLE TÉCNICO", area: "OPERACIONES", color: "#94a3b8" };
    }
    
    return { nombre: id || "Sin asignar", area: "Sin área", color: "#94a3b8" };
  };

  const handleEdit = (actividad: Actividad) => {
    setEditingActividad(actividad);
    setIsFormOpen(true);
  };

  const activeFilters = useMemo(() => {
    const active = [];
    if (searchQuery) {
      active.push({ id: 'searchQuery', label: `Búsqueda: ${searchQuery}`, clear: () => setSearchQuery('') });
    }
    if (filtroEstado !== "all") {
      active.push({ id: 'estado', label: `Estado: ${filtroEstado}`, clear: () => setFiltroEstado('all') });
    }
    if (filtroResponsable !== "all") {
      const resp = responsables.find(r => r.id === filtroResponsable);
      active.push({ id: 'responsable', label: `Resp: ${resp?.nombre || filtroResponsable}`, clear: () => setFiltroResponsable('all') });
    }
    return active;
  }, [searchQuery, filtroEstado, filtroResponsable, responsables]);

  const handleDelete = async (actividadId: string) => {
    if (confirm("¿Estás seguro de eliminar esta actividad?")) {
      await deleteActividad(proyecto.id, actividadId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black flex items-center gap-2 text-primary">
          <ClipboardList className="w-5 h-5" />
          Listado de Actividades
        </h3>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => setIsAlcanceOpen(true)} 
            className="gap-2 font-black uppercase text-[10px] h-9 px-4 border-slate-200 bg-white hover:bg-secondary/5 hover:border-secondary/30 rounded-xl"
          >
            <Plus className="w-4 h-4" /> Desde Alcance
          </Button>
          <Button 
            variant="outline"              onClick={() => { setDefaultGroupForNew(undefined); setIsBulkOpen(true); }} 
              className="gap-2 font-black uppercase text-[10px] h-9 px-4 border-slate-200 bg-white hover:bg-primary/5 hover:border-primary/30 rounded-xl"
            >
              <Plus className="w-4 h-4" /> Carga Masiva
            </Button>
            <Button onClick={() => { setEditingActividad(null); setDefaultGroupForNew(undefined); setIsFormOpen(true); }} className="gap-2 font-black uppercase text-[10px] h-9 px-4">
              <Plus className="w-4 h-4" /> Nueva Actividad
            </Button>
        </div>
      </div>

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-4 animate-in fade-in slide-in-from-top-2">
          {activeFilters.map(filter => (
            <Badge key={filter.id} variant="secondary" className="gap-1.5 px-3 py-1 rounded-xl font-black text-[9px] uppercase bg-primary/5 text-primary border border-primary/10 hover:bg-primary/10 transition-colors group shadow-none">
              {filter.label}
              <button onClick={filter.clear} className="text-primary/40 group-hover:text-red-500 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Barra de Filtros de Actividades */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest ml-1 mb-1.5 block">Búsqueda de actividad</span>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Buscar actividad por nombre..." 
              className="pl-10 h-10 border-slate-200 bg-white focus:bg-white transition-all shadow-none font-bold text-sm rounded-xl" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex flex-wrap items-end gap-3 w-full md:w-auto">
          <div className="flex flex-col gap-1.5 min-w-[160px]">
            <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest ml-1">Estado</span>
            <Select value={filtroEstado} onValueChange={(val) => setFiltroEstado(val ?? "")}>
              <SelectTrigger className="h-10 border-slate-200 bg-white text-xs font-bold shadow-none rounded-xl">
                <SelectValue placeholder="Estado">
                  {filtroEstado !== "all" ? 
                    <span className="text-[10px] font-bold uppercase">{filtroEstado}</span> : 
                    <span className="text-[10px] text-slate-400 uppercase tracking-tighter italic">TODOS</span>
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200">
                <SelectItem value="all" className="text-[10px] text-slate-400 uppercase tracking-tighter italic">TODOS</SelectItem>
                {["Pendiente", "En Progreso", "Completada", "Validada", "Bloqueada"].map(e => (
                  <SelectItem key={e} value={e} className="uppercase text-[10px] font-bold">{e}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5 min-w-[200px]">
            <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest ml-1">Responsable</span>
            <Select value={filtroResponsable} onValueChange={(val) => setFiltroResponsable(val ?? "")}>
              <SelectTrigger className="h-10 border-slate-200 bg-white text-xs font-bold shadow-none rounded-xl">
                <SelectValue placeholder="Responsable">
                  {filtroResponsable !== "all" ? 
                    <span className="text-[10px] font-bold uppercase">{responsables.find(r => r.id === filtroResponsable)?.nombre}</span> : 
                    <span className="text-[10px] text-slate-400 uppercase tracking-tighter italic">TODOS</span>
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200">
                <SelectItem value="all" className="text-[10px] text-slate-400 uppercase tracking-tighter italic">TODOS</SelectItem>
                {responsables.map(r => (
                  <SelectItem key={r.id} value={r.id} className="uppercase text-[10px] font-bold">{r.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end h-10">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => { setFiltroEstado("all"); setFiltroResponsable("all"); setSearchQuery(""); }} 
              className="h-10 w-10 text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-100 hover:border-red-200 transition-all rounded-xl"
              title="Limpiar filtros"
            >
              <FilterX className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filteredActividades.length === 0 ? (
          <div className="text-center py-20 bg-muted/10 rounded-2xl border border-dashed">
            <p className="text-muted-foreground font-medium italic">No se encontraron actividades con estos filtros</p>
          </div>
        ) : (
          Object.entries(activitiesByFolder).map(([folderName, folderActivities]) => {
            const isCollapsed = collapsedGroups[folderName];
            
            const total = folderActivities.length;
            const completed = folderActivities.filter(a => a.estado === 'Completada' || a.estado === 'Validada').length;
            const pending = total - completed;
            const overdue = folderActivities.filter(a => a.estado !== 'Completada' && a.estado !== 'Validada' && getDueDateStatus(a.fechaVencimiento).isOverdue).length;
            
            const avgProgress = total > 0 
              ? Math.round(folderActivities.reduce((acc, a) => acc + a.progreso, 0) / total)
              : 0;

            const pendingWithDueDate = folderActivities.filter(a => a.estado !== 'Completada' && a.estado !== 'Validada' && a.fechaVencimiento);
            const nearestDueDate = pendingWithDueDate.length > 0
              ? pendingWithDueDate.reduce<string | null>((nearest, a) => {
                  if (!nearest) return a.fechaVencimiento || null;
                  return a.fechaVencimiento && new Date(a.fechaVencimiento) < new Date(nearest) ? a.fechaVencimiento : nearest;
                }, null)
              : null;

            const meta = groupMeta[folderName] || {
              icon: <FolderOpen className="w-5 h-5 text-slate-400" />,
              color: "text-slate-600",
              bgColor: "bg-slate-50 border-slate-100"
            };

            return (
              <div key={folderName} className="space-y-4 bg-slate-50/10 p-2 sm:p-4 rounded-2xl border border-slate-200 shadow-sm">
                {/* Group Header Card */}
                <div 
                  className={cn(
                    "flex flex-col lg:flex-row lg:items-center justify-between p-4 cursor-pointer select-none gap-4 rounded-xl transition-all border bg-white shadow-sm hover:shadow-md hover:border-primary/20",
                    !isCollapsed && "border-primary/15 bg-primary/[0.01]"
                  )}
                  onClick={() => toggleGroup(folderName)}
                >
                  {/* Title & Icon */}
                  <div className="flex items-center gap-3 min-w-[200px]">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm shrink-0", meta.bgColor)}>
                      {meta.icon}
                    </div>
                    <div>
                      <h4 className="font-black text-xs text-slate-800 uppercase tracking-tight">
                        {folderName}
                      </h4>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                        Estructura del Proyecto
                      </p>
                    </div>
                  </div>

                  {/* Indicators Grid */}
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 flex-1 max-w-2xl">
                    {/* Total */}
                    <div className="bg-slate-50/50 border border-slate-100 p-1.5 rounded-lg flex flex-col items-center justify-center text-center">
                      <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-wider">Total</span>
                      <span className="text-xs font-black text-slate-700">{total}</span>
                    </div>
                    
                    {/* OK */}
                    <div className="bg-emerald-50/30 border border-emerald-100/50 p-1.5 rounded-lg flex flex-col items-center justify-center text-center">
                      <span className="text-[7.5px] font-black text-emerald-600/70 uppercase tracking-wider">OK</span>
                      <span className="text-xs font-black text-emerald-600">{completed}</span>
                    </div>
                    
                    {/* Pend. */}
                    <div className="bg-blue-50/30 border border-blue-100/50 p-1.5 rounded-lg flex flex-col items-center justify-center text-center">
                      <span className="text-[7.5px] font-black text-blue-600/70 uppercase tracking-wider">Pend.</span>
                      <span className="text-xs font-black text-blue-600">{pending}</span>
                    </div>

                    {/* Venc. */}
                    <div className={cn(
                      "p-1.5 rounded-lg flex flex-col items-center justify-center text-center border",
                      overdue > 0 ? "bg-red-50 border-red-100 text-red-600" : "bg-slate-50/50 border-slate-100 text-slate-400"
                    )}>
                      <span className={cn("text-[7.5px] font-black uppercase tracking-wider", overdue > 0 ? "text-red-600/70" : "text-slate-400")}>Venc.</span>
                      <span className="text-xs font-black">{overdue}</span>
                    </div>

                    {/* Vence */}
                    <div className="bg-slate-50/50 border border-slate-100 p-1.5 rounded-lg flex flex-col items-center justify-center text-center col-span-3 sm:col-span-1">
                      <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-wider">Vence</span>
                      <span className={cn(
                        "text-[9px] font-black mt-0.5 uppercase tracking-tighter truncate max-w-full",
                        nearestDueDate ? "text-orange-600" : "text-slate-400"
                      )}>
                        {nearestDueDate ? formatDate(nearestDueDate) : "—"}
                      </span>
                    </div>
                  </div>

                  {/* Progress & Actions */}
                  <div className="flex items-center justify-between lg:justify-end gap-4 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
                    {/* Progress Badge */}
                    <div className="flex flex-col items-center lg:items-end">
                      <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-wider">Avance</span>
                      <Badge className={cn(
                        "font-black text-[10px] px-2 py-0.5 rounded mt-0.5 shadow-none",
                        avgProgress === 100 ? "bg-emerald-500 text-white" : "bg-primary/5 text-primary border border-primary/10"
                      )}>
                        {avgProgress}%
                      </Badge>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingActividad(null);
                          setDefaultGroupForNew(folderName);
                          setIsFormOpen(true);
                        }}
                        className="h-8 text-[8px] font-black uppercase border-slate-200 hover:bg-primary/5 hover:border-primary/30 rounded-lg px-2 gap-1 shadow-none"
                      >
                        <Plus className="w-3.5 h-3.5 text-primary" />
                        Tarea
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingActividad(null);
                          setDefaultGroupForNew(folderName);
                          setIsBulkOpen(true);
                        }}
                        className="h-8 text-[8px] font-black uppercase border-slate-200 hover:bg-primary/5 hover:border-primary/30 rounded-lg px-2 gap-1 shadow-none"
                      >
                        <Plus className="w-3.5 h-3.5 text-primary" />
                        Masivo
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 rounded-full text-slate-400 hover:text-primary hover:bg-primary/5 transition-transform duration-200 shrink-0"
                        style={{ transform: isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)' }}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Folder Activities */}
                {!isCollapsed && (
                  <div className="space-y-4 pl-2 sm:pl-4 border-l-2 border-slate-100 mt-2">
                    {folderActivities.map((actividad) => {
                      const respInfo = getResponsableDisplay(actividad.responsablePrincipalId);
                      const isBloqueada = actividad.checklistBloqueado || actividad.estado === "Bloqueada";
                      
                      // --- LÓGICA DE ALERTA ---
                      const { isOverdue, isImminent } = getDueDateStatus(actividad.fechaVencimiento);
                      const needsAttention = (isOverdue || isImminent) && actividad.estado !== "Validada" && actividad.estado !== "Completada";

                      return (
                        <div
                          key={actividad.id}
                          className={cn(
                            "p-5 rounded-2xl border bg-white shadow-sm hover:shadow-md transition-all",
                            actividad.estado === "Validada" ? "border-emerald-200 bg-emerald-50/30" : "border-slate-200",
                            needsAttention ? "border-red-300 ring-1 ring-red-100" : "" 
                          )}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center border shadow-sm",
                                actividad.estado === "Validada" ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white border-slate-200"
                              )}>
                                {actividad.estado === "Validada" ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4 text-slate-400" />}
                              </div>
                              <div>
                                <h4 className={cn("font-bold text-slate-800 text-[11px] leading-tight", actividad.estado === "Validada" && "text-emerald-900")}>
                                  {getCleanDescription(actividad.descripcion)}
                                </h4>
                                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                  <Badge variant="outline" className={cn("text-[8px] font-black uppercase tracking-tighter px-1.5 py-0", tipoColors[actividad.tipo])}>
                                    {actividad.tipo}
                                  </Badge>
                                  <Badge className={cn("text-[8px] font-black uppercase shadow-none tracking-tighter px-1.5 py-0", estadoActividadColors[actividad.estado])}>
                                    {actividad.estado}
                                  </Badge>
                                  <span className="text-[9px] font-medium text-slate-400 flex items-center gap-1">
                                    <Calendar className="w-2.5 h-2.5" />
                                    {formatDate(actividad.fechaInicio)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1.5">
                                <div 
                                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[8px] font-black shadow-sm shrink-0"
                                  style={{ backgroundColor: respInfo.color }}
                                >
                                  {respInfo.nombre.charAt(0)}
                                </div>
                                <div className="hidden lg:block text-left">
                                  <p className="text-[9px] font-black text-slate-700 leading-none uppercase">{respInfo.nombre}</p>
                                  <p className="text-[7px] text-slate-400 uppercase font-medium tracking-tighter">{respInfo.area}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 border-l border-slate-100 pl-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-7 px-2 text-primary hover:bg-primary/5 rounded-lg font-black text-[9px] uppercase gap-1"
                                  onClick={() => handleEdit(actividad)}
                                >
                                  <Pencil className="w-3 h-3" />
                                  Editar
                                </Button>
                                
                                <DropdownMenu>
                                  <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-lg border border-transparent bg-clip-padding text-xs font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground h-7 w-7 text-slate-400">
                                    <MoreVertical className="w-3.5 h-3.5" />
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-40">
                                    <DropdownMenuItem className="text-destructive font-black text-[9px] uppercase p-2" onClick={() => handleDelete(actividad.id)}>
                                      <Trash2 className="w-3.5 h-3.5 mr-2" /> Eliminar
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Checklist Section */}
                            <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                              <div className="flex items-center justify-between">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                  <ClipboardList className="w-2.5 h-2.5" /> Checklist
                                </span>
                                {actividad.checklistBloqueado ? (
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="h-5 text-[9px] text-emerald-600 font-black gap-1 uppercase"
                                    onClick={() => desbloquearChecklist(proyecto.id, actividad.id, "Solicitado")}
                                  >
                                    <Unlock className="w-2.5 h-2.5" /> Desbloq.
                                  </Button>
                                ) : (
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="h-5 text-[9px] text-slate-400 font-black gap-1 uppercase"
                                    onClick={() => bloquearChecklist(proyecto.id, actividad.id, "Finalizado")}
                                  >
                                    <Lock className="w-2.5 h-2.5" /> Bloquear
                                  </Button>
                                )}
                              </div>

                              <div className="space-y-1.5">
                                {actividad.subtareas.length === 0 ? (
                                  <p className="text-[10px] text-slate-400 italic">Sin tareas</p>
                                ) : (
                                  actividad.subtareas.map(sub => (
                                    <div key={sub.id} className="flex items-center gap-2">
                                      <button
                                        disabled={isBloqueada}
                                        onClick={() => toggleSubtarea(proyecto.id, actividad.id, sub.id)}
                                        className={cn(
                                          "w-4 h-4 rounded flex items-center justify-center shrink-0 transition-all border",
                                          sub.completada 
                                            ? "bg-primary border-primary text-white" 
                                            : "bg-white border-slate-200 hover:border-primary"
                                        )}
                                      >
                                        {sub.completada && <CheckCircle2 className="w-3 h-3" />}
                                      </button>
                                      <span className={cn("text-[10px] font-medium", sub.completada ? "text-slate-400 line-through" : "text-slate-600")}>
                                        {sub.descripcion}
                                      </span>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>

                            {/* Validations & Dates Section */}
                            <div className="space-y-3">
                              <div className="flex items-center gap-4">
                                <div className="flex-1 space-y-1">
                                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <Calendar className="w-2.5 h-2.5" /> Fechas
                                  </span>
                                  <div className="flex items-center gap-3 text-[10px] font-medium text-slate-600">
                                    <div>
                                      <p className="text-[8px] text-slate-400 font-medium">Inicio</p>
                                      <p className="text-[10px]">{formatDate(actividad.fechaInicio)}</p>
                                    </div>
                                    <div>
                                      <p className="text-[8px] text-slate-400 font-medium">Vence</p>
                                      <p className={cn(
                                        "text-[10px] flex items-center gap-1",
                                        needsAttention ? "text-red-600 font-black" : ""
                                      )}>
                                        {needsAttention && <AlertTriangle className="w-3 h-3" />}
                                        {formatDate(actividad.fechaVencimiento)}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <div className="w-24 text-right">
                                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Progreso</span>
                                  <div className="relative inline-flex items-center mt-0.5">
                                    <input
                                      type="number"
                                      min={0}
                                      max={100}
                                      className="w-14 h-6 text-center font-black text-primary bg-primary/5 border border-primary/20 rounded-lg text-[10px] focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                      value={progresoEditando[actividad.id] ?? actividad.progreso}
                                      onChange={(e) => {
                                        setProgresoEditando(prev => ({ ...prev, [actividad.id]: e.target.value }));
                                      }}
                                      onBlur={(e) => {
                                        const val = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                                        const newProgresso = { ...progresoEditando };
                                        delete newProgresso[actividad.id];
                                        setProgresoEditando(newProgresso);
                                        if (val !== actividad.progreso) {
                                          updateActividad(proyecto.id, { ...actividad, progreso: val });
                                        }
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                                      }}
                                    />
                                    <span className="text-[10px] font-black text-primary ml-0.5">%</span>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-1.5">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                  <FileCheck className="w-2.5 h-2.5" /> Validaciones
                                </span>
                                <div className="space-y-1">
                                  {actividad.validacionesRequeridas.length === 0 ? (
                                    <p className="text-[10px] text-slate-400 italic">No requiere</p>
                                  ) : (
                                    actividad.validacionesRequeridas.map(val => (
                                      <div key={val.id} className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                                        <div className="flex flex-col">
                                          <span className="text-[10px] font-black text-slate-700">{val.tipo}</span>
                                          <span className="text-[8px] font-medium text-slate-400 uppercase">{val.area}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          {val.estado === "Pendiente" && (
                                            <div className="flex gap-0.5">
                                              <Button 
                                                size="sm" 
                                                className="h-6 px-1.5 text-[9px] bg-emerald-500 hover:bg-emerald-600 font-black uppercase"
                                                onClick={() => aprobarValidacion(proyecto.id, actividad.id, val.id, "Aprobado por sistema")}
                                              >
                                                OK
                                              </Button>
                                              <Button 
                                                size="sm" 
                                                variant="destructive" 
                                                className="h-6 px-1.5 text-[9px] font-black uppercase"
                                                onClick={() => rechazarValidacion(proyecto.id, actividad.id, val.id, "Rechazado por sistema")}
                                              >
                                                NO
                                              </Button>
                                            </div>
                                          )}
                                          {val.estado === "Aprobada" && (
                                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 shadow-none text-[8px] font-black uppercase px-1.5">
                                              OK
                                            </Badge>
                                          )}
                                          {val.estado === "Rechazada" && (
                                            <Badge className="bg-red-100 text-red-700 hover:bg-red-100 shadow-none text-[8px] font-black uppercase px-1.5">
                                              NO
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="mt-6 pt-4 border-t border-slate-100">
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  "h-full transition-all duration-700",
                                  actividad.estado === "Validada" ? "bg-emerald-500" : "bg-primary"
                                )}
                                style={{ width: `${actividad.progreso}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <CopiarAlcanceModal
        proyecto={proyecto}
        isOpen={isAlcanceOpen}
        onClose={() => setIsAlcanceOpen(false)}
      />
      <ActividadesBulkModal
        proyecto={proyecto}
        isOpen={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        defaultGroup={defaultGroupForNew}
      />
      <ActividadForm
        proyectoId={proyecto.id}
        actividad={editingActividad}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        defaultGroup={defaultGroupForNew}
      />
    </div>
  );
}
