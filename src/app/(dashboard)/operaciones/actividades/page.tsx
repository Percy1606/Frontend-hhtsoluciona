"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { format, parseISO } from "date-fns";
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
import type { Actividad } from "@/lib/types";
import { ActividadForm } from "@/components/operaciones/actividad-form";
import { toast } from "sonner";

// Reutilizamos el componente local de estadísticas
const StatsCard = ({ label, value, icon, color, bgColor }: any) => (
  <div className={cn("p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4 bg-white", bgColor)}>
    <div className={cn("p-3 rounded-lg bg-white shadow-sm", color)}>
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider leading-none mb-1">{label}</p>
      <p className={cn("text-2xl font-black leading-none tracking-tight", color)}>{value}</p>
    </div>
  </div>
);

const estadoColors: Record<string, string> = {
  "Pendiente": "bg-gray-100 text-gray-700",
  "En Progreso": "bg-blue-100 text-blue-700",
  "Completada": "bg-green-100 text-green-700",
  "Validada": "bg-emerald-500 text-white",
  "Bloqueada": "bg-red-100 text-red-700",
};

const tipoColors: Record<string, string> = {
  "Técnica": "bg-purple-100 text-purple-700",
  "Administrativa": "bg-blue-100 text-blue-700",
  "Logística": "bg-yellow-100 text-yellow-700",
  "Documental": "bg-green-100 text-green-700",
  "Validación": "bg-red-100 text-red-700",
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

export default function ActividadesPage() {
  const searchParams = useSearchParams();
  const {
    actividades,
    totalActividades,
    actividadPage,
    actividadTotalPages,
    responsables,
    fetchActividades,
    fetchResponsables,
    deleteActividad,
    loading
  } = useOperacionesStore();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingActividad, setEditingActividad] = useState<Actividad | null>(null);

  // Filtros locales
  const [searchQuery, setSearchQuery] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("all");
  const [filtroResponsable, setFiltroResponsable] = useState("all");

  useEffect(() => {
    fetchActividades(1, 20, { 
        search: searchQuery, 
        estado: filtroEstado, 
        responsableId: filtroResponsable 
    });
    fetchResponsables();
  }, [fetchActividades, fetchResponsables, searchQuery, filtroEstado, filtroResponsable]);

  // LÓGICA DE DEEP-LINKING (Resolver desde Alertas)
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId && actividades.length > 0) {
        const target = actividades.find(a => a.id === editId);
        if (target) {
            setEditingActividad(target);
            setIsFormOpen(true);
            window.history.replaceState({}, '', window.location.pathname);
        }
    }
  }, [searchParams, actividades]);

  const stats = useMemo(() => ({
    total: totalActividades,
    pendientes: totalActividades > 0 ? actividades.filter(a => a.estado === 'Pendiente').length : 0,
    enProgreso: totalActividades > 0 ? actividades.filter(a => a.estado === 'En Progreso').length : 0,
    completadas: totalActividades > 0 ? actividades.filter(a => a.estado === 'Completada' || a.estado === 'Validada').length : 0,
    bloqueadas: totalActividades > 0 ? actividades.filter(a => a.estado === 'Bloqueada').length : 0,
  }), [actividades, totalActividades]);

  const getResponsableName = useCallback((id: string) => {
    if (!id) return "SIN ASIGNAR";
    const resp = responsables.find(r => r.id === id);
    if (resp) return resp.nombre.toUpperCase();
    if (id.includes('-') && id.length > 20) return "RESPONSABLE EXTERNO";
    return id.toUpperCase();
  }, [responsables]);

  const handleEdit = (actividad: Actividad) => {
    setEditingActividad(actividad);
    setIsFormOpen(true);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <ClipboardList className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-xl font-black text-primary tracking-tight uppercase">Gestión de Actividades</h1>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 font-bold uppercase tracking-wide">Control operativo de tareas en todos los proyectos.</p>
        </div>
        <div className="flex items-center gap-3">
            <Button 
                variant="outline" 
                onClick={handleForceRefresh}
                className="h-12 px-6 font-black uppercase text-xs tracking-widest border-2 hover:bg-slate-50 gap-2 rounded-xl"
                title="Limpiar caché local y forzar sincronización"
            >
                <Clock className="w-4 h-4" />
                Sincronizar
            </Button>
            <Button
                className="h-12 gap-2 font-black uppercase text-xs bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-xl px-8"
                onClick={() => { setEditingActividad(null); setIsFormOpen(true); }}
            >
                <Plus className="w-5 h-5" /> Nueva Actividad
            </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard label="Total" value={stats.total} icon={<ClipboardList className="w-4 h-4"/>} color="text-primary" bgColor="bg-primary/5" />
        <StatsCard label="Pendientes" value={stats.pendientes} icon={<Clock className="w-4 h-4"/>} color="text-slate-600" bgColor="bg-slate-50" />
        <StatsCard label="En Marcha" value={stats.enProgreso} icon={<Clock className="w-4 h-4"/>} color="text-blue-600" bgColor="bg-blue-50" />
        <StatsCard label="Culminadas" value={stats.completadas} icon={<CheckCircle2 className="w-4 h-4"/>} color="text-emerald-600" bgColor="bg-emerald-50" />
      </div>

      {/* Filtros */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-center gap-6">
        <div className="relative flex-1 w-full">
          <span className="text-[10px] font-black uppercase text-primary tracking-widest ml-1 mb-1.5 block">Buscador Global</span>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input 
              placeholder="Buscar por actividad o proyecto..." 
              className="pl-12 h-14 border-slate-200 bg-slate-50/30 focus:bg-white transition-all shadow-none font-bold text-base rounded-xl" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          <div className="flex flex-col gap-1.5 min-w-[200px]">
            <span className="text-[10px] font-black uppercase text-primary tracking-widest ml-1">Estado Operativo</span>
            <Select value={filtroEstado} onValueChange={(val) => setFiltroEstado(val || "all")}>
              <SelectTrigger className="h-11 border-slate-200 bg-white font-black text-[10px] uppercase rounded-xl shadow-sm">
                <SelectValue placeholder="SELECCIONAR ESTADO" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200">
                <SelectItem value="all" className="font-black text-[10px] uppercase">TODOS LOS ESTADOS</SelectItem>
                <SelectItem value="Pendiente" className="font-black text-[10px] uppercase">PENDIENTE</SelectItem>
                <SelectItem value="En Progreso" className="font-black text-[10px] uppercase">EN PROGRESO</SelectItem>
                <SelectItem value="Completada" className="font-black text-[10px] uppercase">COMPLETADA</SelectItem>
                <SelectItem value="Validada" className="font-black text-[10px] uppercase">VALIDADA</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5 min-w-[220px]">
            <span className="text-[10px] font-black uppercase text-primary tracking-widest ml-1">Responsable</span>
            <Select value={filtroResponsable} onValueChange={(val) => setFiltroResponsable(val || "all")}>
              <SelectTrigger className="h-11 border-slate-200 bg-white font-black text-[10px] uppercase rounded-xl shadow-sm">
                <SelectValue placeholder="SELECCIONAR RESPONSABLE" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200">
                <SelectItem value="all" className="font-black text-[10px] uppercase">TODOS LOS RESPONSABLES</SelectItem>
                {responsables.map(r => (
                  <SelectItem key={r.id} value={r.id} className="font-black text-[10px] uppercase">{r.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end self-end h-11">
            <Button 
              variant="ghost" 
              onClick={resetFiltros} 
              className="h-11 w-11 text-slate-400 hover:text-error hover:bg-red-50 border border-slate-100 hover:border-red-200 transition-all rounded-xl"
              title="Limpiar filtros"
            >
              <FilterX className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tabla con Paginación */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="font-black text-primary uppercase text-[10px] py-4 pl-6 w-[50px]">N°</TableHead>
              <TableHead className="font-black text-primary uppercase text-[10px]">Actividad</TableHead>
              <TableHead className="font-black text-primary uppercase text-[10px]">Proyecto</TableHead>
              <TableHead className="font-black text-primary uppercase text-[10px]">Tipo</TableHead>
              <TableHead className="font-black text-primary uppercase text-[10px]">Responsable</TableHead>
              <TableHead className="font-black text-primary uppercase text-[10px]">Cronograma</TableHead>
              <TableHead className="font-black text-primary uppercase text-[10px]">Estado</TableHead>
              <TableHead className="text-right font-black text-primary uppercase text-[10px] pr-6">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </TableCell>
              </TableRow>
            ) : actividades.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-20 text-slate-400 font-bold uppercase text-[10px]">
                  No se encontraron actividades con los filtros aplicados.
                </TableCell>
              </TableRow>
            ) : (
              actividades.map((actividad, index) => {
                const { isOverdue, isImminent } = getDueDateStatus(actividad.fechaVencimiento);
                const needsAttention = (isOverdue || isImminent) && actividad.estado !== "Validada" && actividad.estado !== "Completada";

                return (
                  <TableRow key={actividad.id} className={cn(
                      "hover:bg-slate-50/50 transition-colors group",
                      needsAttention ? "bg-red-50/30" : ""
                    )}>
                    <TableCell className="pl-6 font-bold text-xs text-slate-400">
                      {(actividadPage - 1) * 20 + index + 1}
                    </TableCell>
                    <TableCell>
                      <p className={cn(
                        "font-black text-slate-800 text-sm uppercase",
                        (actividad.estado === "Completada" || actividad.estado === "Validada") && "text-slate-400 line-through"
                      )}>
                        {actividad.descripcion}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-black text-primary text-[10px] uppercase">{actividad.proyectoCodigo}</span>
                        <span className="text-[10px] text-slate-500 font-bold truncate max-w-[150px] uppercase">{actividad.proyectoNombre}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-[9px] font-black uppercase", tipoColors[actividad.tipo])}>
                        {actividad.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 uppercase border border-slate-200">
                          {getResponsableName(actividad.responsablePrincipalId).charAt(0)}
                        </div>
                        <span className="text-[10px] font-black text-slate-700 uppercase">{getResponsableName(actividad.responsablePrincipalId)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase">
                          <Calendar className="w-3 h-3" /> {actividad.fechaInicio ? formatDate(actividad.fechaInicio) : 'N/A'}
                        </span>
                        <span className={cn(
                          "text-[10px] font-black uppercase flex items-center gap-1",
                          needsAttention ? "text-red-600" : "text-primary"
                        )}>
                          {needsAttention && <AlertTriangle className="w-3.5 h-3.5" />}
                          VENCE: {actividad.fechaVencimiento ? formatDate(actividad.fechaVencimiento) : 'N/A'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("border-none font-black text-[9px] uppercase shadow-none px-3 h-5", estadoColors[actividad.estado])}>
                        {actividad.estado}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-primary hover:bg-primary/5 rounded-full"
                          onClick={() => handleEdit(actividad)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-400 hover:text-error hover:bg-red-50 rounded-full"
                          onClick={() => handleDelete(actividad.proyectoId, actividad.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        
        {/* Paginación Integrada (Estilo Cartera) */}
        {actividadTotalPages > 1 && (
            <div className="p-3 bg-slate-50 border-t border-border flex items-center justify-between">
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-2">
                    Página {actividadPage} de {actividadTotalPages} — Total: {totalActividades} gestiones
                </p>
                <div className="flex gap-2 mr-2">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        disabled={actividadPage <= 1 || loading}
                        onClick={() => fetchActividades(actividadPage - 1, 20, { search: searchQuery, estado: filtroEstado, responsableId: filtroResponsable })}
                        className="h-7 px-4 font-black text-[9px] uppercase border-slate-200 bg-white"
                    >
                        Anterior
                    </Button>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        disabled={actividadPage >= actividadTotalPages || loading}
                        onClick={() => fetchActividades(actividadPage + 1, 20, { search: searchQuery, estado: filtroEstado, responsableId: filtroResponsable })}
                        className="h-7 px-4 font-black text-[9px] uppercase border-slate-200 bg-white"
                    >
                        Siguiente
                    </Button>
                </div>
            </div>
        )}
      </div>

      {isFormOpen && (
        <ActividadForm
          actividad={editingActividad}
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingActividad(null);
          }}
        />
      )}
    </div>
  );
}
