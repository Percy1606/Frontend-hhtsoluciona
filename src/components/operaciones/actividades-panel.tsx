"use client";

import { useState, useMemo } from "react";
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
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useOperacionesStore } from "@/store/operaciones-store";
import type { Proyecto, Actividad } from "@/lib/types";
import { ActividadForm } from "./actividad-form";
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

interface ActividadesPanelProps {
  proyecto: Proyecto;
}

export function ActividadesPanel({ proyecto }: ActividadesPanelProps) {
  const { 
    responsables, 
    deleteActividad, 
    toggleSubtarea, 
    bloquearChecklist, 
    desbloquearChecklist,
    aprobarValidacion,
    rechazarValidacion
  } = useOperacionesStore();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingActividad, setEditingActividad] = useState<Actividad | null>(null);

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

  const getResponsableById = (id: string) => responsables.find(r => r.id === id);

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
        <h3 className="text-lg font-black flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-primary" />
          Listado de Actividades
        </h3>
        <Button onClick={() => { setEditingActividad(null); setIsFormOpen(true); }} className="gap-2 font-black uppercase text-xs">
          <Plus className="w-4 h-4" /> Nueva Actividad
        </Button>
      </div>

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-4 animate-in fade-in slide-in-from-top-2">
          {activeFilters.map(filter => (
            <Badge key={filter.id} variant="secondary" className="gap-1.5 px-3 py-1.5 rounded-xl font-black text-[10px] uppercase bg-primary/5 text-primary border border-primary/10 hover:bg-primary/10 transition-colors group shadow-none">
              {filter.label}
              <button onClick={filter.clear} className="text-primary/40 group-hover:text-red-500 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Barra de Filtros de Actividades */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-6">
        <div className="relative flex-1 w-full">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 mb-2 block">Búsqueda de actividad</span>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input 
              placeholder="Buscar actividad por nombre..." 
              className="pl-12 h-14 border-slate-200 bg-white focus:bg-white transition-all shadow-none font-medium text-base rounded-xl" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex flex-wrap items-end gap-4 w-full md:w-auto">
          <div className="flex flex-col gap-2 min-w-[180px]">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Estado de Actividad</span>
            <Select value={filtroEstado} onValueChange={(val) => setFiltroEstado(val ?? "")}>
              <SelectTrigger className="h-14 border-slate-200 bg-white text-base font-medium shadow-none rounded-xl">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200">
                <SelectItem value="all" className="text-slate-400 uppercase tracking-tighter italic">Sin filtro</SelectItem>
                {["Pendiente", "En Progreso", "Completada", "Validada", "Bloqueada"].map(e => (
                  <SelectItem key={e} value={e} className="uppercase">{e}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2 min-w-[220px]">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Responsable Ejecución</span>
            <Select value={filtroResponsable} onValueChange={(val) => setFiltroResponsable(val ?? "")}>
              <SelectTrigger className="h-14 border-slate-200 bg-white text-base font-medium shadow-none rounded-xl">
                <SelectValue placeholder="Responsable" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200">
                <SelectItem value="all" className="text-slate-400 uppercase tracking-tighter italic">Sin filtro</SelectItem>
                {responsables.map(r => (
                  <SelectItem key={r.id} value={r.id} className="uppercase">{r.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end h-14">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => { setFiltroEstado("all"); setFiltroResponsable("all"); setSearchQuery(""); }} 
              className="h-14 w-14 text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-100 hover:border-red-200 transition-all rounded-xl"
              title="Limpiar filtros"
            >
              <FilterX className="w-6 h-6" />
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
          filteredActividades.map((actividad) => {
            const resp = getResponsableById(actividad.responsablePrincipalId);
            const isBloqueada = actividad.checklistBloqueado || actividad.estado === "Bloqueada";

            return (
              <div
                key={actividad.id}
                className={cn(
                  "p-5 rounded-2xl border bg-white shadow-sm hover:shadow-md transition-all",
                  actividad.estado === "Validada" ? "border-emerald-200 bg-emerald-50/30" : "border-slate-200"
                )}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center border-2 shadow-sm",
                      actividad.estado === "Validada" ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white border-slate-200"
                    )}>
                      {actividad.estado === "Validada" ? <CheckCircle2 className="w-6 h-6" /> : <Clock className="w-6 h-6 text-slate-400" />}
                    </div>
                    <div>
                      <h4 className={cn("font-medium text-slate-800 text-sm", actividad.estado === "Validada" && "text-emerald-900")}>
                        {actividad.descripcion}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <Badge variant="outline" className={cn("text-[9px] font-black uppercase tracking-tighter", tipoColors[actividad.tipo])}>
                          {actividad.tipo}
                        </Badge>
                        <Badge className={cn("text-[9px] font-black uppercase shadow-none tracking-tighter", estadoActividadColors[actividad.estado])}>
                          {actividad.estado}
                        </Badge>
                        <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1 ml-1">
                          <Calendar className="w-3 h-3" />
                          Inició: {formatDate(actividad.fechaInicio)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 mr-2">
                      <div 
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-black shadow-sm"
                        style={{ backgroundColor: resp?.color || "#94a3b8" }}
                      >
                        {resp?.nombre?.charAt(0) || "?"}
                      </div>
                      <div className="hidden lg:block text-left">
                        <p className="text-[11px] font-black text-slate-700 leading-none uppercase">{resp?.nombre || "Sin asignar"}</p>
                        <p className="text-[9px] text-slate-400 uppercase font-medium tracking-tighter">{resp?.area || "Sin área"}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 border-l border-slate-100 pl-3">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-9 px-3 text-primary hover:bg-primary/5 rounded-lg font-black text-[10px] uppercase gap-2"
                        onClick={() => handleEdit(actividad)}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Editar
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground h-9 w-9 text-slate-400">
                          <MoreVertical className="w-4 h-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem className="text-destructive font-black text-[10px] uppercase p-3" onClick={() => handleDelete(actividad.id)}>
                            <Trash2 className="w-4 h-4 mr-2" /> Eliminar Actividad
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Checklist Section */}
                  <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <ClipboardList className="w-3 h-3" /> Checklist de Control
                      </span>
                      {actividad.checklistBloqueado ? (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-6 text-[10px] text-emerald-600 font-black gap-1 uppercase"
                          onClick={() => desbloquearChecklist(proyecto.id, actividad.id, "Solicitado")}
                        >
                          <Unlock className="w-3 h-3" /> Desbloquear
                        </Button>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-6 text-[10px] text-slate-400 font-black gap-1 uppercase"
                          onClick={() => bloquearChecklist(proyecto.id, actividad.id, "Finalizado")}
                        >
                          <Lock className="w-3 h-3" /> Bloquear
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2">
                      {actividad.subtareas.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No hay tareas definidas</p>
                      ) : (
                        actividad.subtareas.map(sub => (
                          <div key={sub.id} className="flex items-center gap-3">
                            <button
                              disabled={isBloqueada}
                              onClick={() => toggleSubtarea(proyecto.id, actividad.id, sub.id)}
                              className={cn(
                                "w-5 h-5 rounded flex items-center justify-center transition-all border-2",
                                sub.completada 
                                  ? "bg-primary border-primary text-white" 
                                  : "bg-white border-slate-200 hover:border-primary"
                              )}
                            >
                              {sub.completada && <CheckCircle2 className="w-3.5 h-3.5" />}
                            </button>
                            <span className={cn("text-xs font-medium", sub.completada ? "text-slate-400 line-through" : "text-slate-600")}>
                              {sub.descripcion}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Validations & Dates Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-6">
                      <div className="flex-1 space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Fechas
                        </span>
                        <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
                          <div>
                            <p className="text-[9px] text-slate-400 font-medium">Inicio</p>
                            <p>{formatDate(actividad.fechaInicio)}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-slate-400 font-medium">Vencimiento</p>
                            <p className={cn(
                              actividad.fechaVencimiento && new Date(actividad.fechaVencimiento) < new Date() && actividad.estado !== "Validada" 
                                ? "text-red-500" 
                                : ""
                            )}>
                              {formatDate(actividad.fechaVencimiento)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="w-24 text-right">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Progreso</span>
                        <p className="text-xl font-black text-primary">{actividad.progreso}%</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <FileCheck className="w-3 h-3" /> Validaciones Requeridas
                      </span>
                      <div className="space-y-1.5">
                        {actividad.validacionesRequeridas.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">No requiere validación</p>
                        ) : (
                          actividad.validacionesRequeridas.map(val => (
                            <div key={val.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                              <div className="flex flex-col">
                                <span className="text-xs font-black text-slate-700">{val.tipo}</span>
                                <span className="text-[9px] font-medium text-slate-400 uppercase">{val.area}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {val.estado === "Pendiente" && (
                                  <div className="flex gap-1">
                                    <Button 
                                      size="sm" 
                                      className="h-7 px-2 text-[10px] bg-emerald-500 hover:bg-emerald-600 font-black uppercase"
                                      onClick={() => aprobarValidacion(proyecto.id, actividad.id, val.id, "Aprobado por sistema")}
                                    >
                                      Aprobar
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="destructive" 
                                      className="h-7 px-2 text-[10px] font-black uppercase"
                                      onClick={() => rechazarValidacion(proyecto.id, actividad.id, val.id, "Rechazado por sistema")}
                                    >
                                      Rechazar
                                    </Button>
                                  </div>
                                )}
                                {val.estado === "Aprobada" && (
                                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 shadow-none text-[9px] font-black uppercase">
                                    Aprobada
                                  </Badge>
                                )}
                                {val.estado === "Rechazada" && (
                                  <Badge className="bg-red-100 text-red-700 hover:bg-red-100 shadow-none text-[9px] font-black uppercase">
                                    Rechazada
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
          })
        )}
      </div>

      <ActividadForm
        proyectoId={proyecto.id}
        actividad={editingActividad}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
      />
    </div>
  );
}
