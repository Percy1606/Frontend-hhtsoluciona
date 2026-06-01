"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { format, parseISO } from "date-fns";
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
  Briefcase
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
import { useOperacionesStore } from "@/store/operaciones-store";
import type { Actividad, Proyecto } from "@/lib/types";
import { ActividadForm } from "@/components/operaciones/actividad-form";
import { StatsCard } from "@/components/operaciones/proyecto-detail";

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
    const date = dateStr.includes('T') ? parseISO(dateStr) : parseISO(`${dateStr}T00:00:00`);
    return format(date, "dd/MM/yyyy");
  } catch (e) {
    return dateStr;
  }
};

export default function ActividadesPage() {
  const {
    proyectos,
    responsables,
    fetchProyectos,
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
    fetchProyectos();
    fetchResponsables();
  }, [fetchProyectos, fetchResponsables]);

  const allActivities = useMemo(() => {
    return proyectos.flatMap(p => p.actividades.map(a => ({
      ...a,
      proyectoCodigo: p.codigo,
      proyectoNombre: p.nombre
    })));
  }, [proyectos]);

  const filteredActividades = useMemo(() => {
    return allActivities.filter(a => {
      if (searchQuery && !a.descripcion.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !a.proyectoCodigo?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filtroEstado !== "all" && a.estado !== filtroEstado) return false;
      if (filtroResponsable !== "all" && a.responsablePrincipalId !== filtroResponsable) return false;
      return true;
    });
  }, [allActivities, searchQuery, filtroEstado, filtroResponsable]);

  const stats = useMemo(() => ({
    total: allActivities.length,
    pendientes: allActivities.filter(a => a.estado === 'Pendiente').length,
    enProgreso: allActivities.filter(a => a.estado === 'En Progreso').length,
    completadas: allActivities.filter(a => a.estado === 'Completada' || a.estado === 'Validada').length,
    bloqueadas: allActivities.filter(a => a.estado === 'Bloqueada').length,
  }), [allActivities]);

  const getResponsableName = useCallback((id: string) => {
    return responsables.find(r => r.id === id)?.nombre || 'Sin asignar';
  }, [responsables]);

  const handleEdit = (actividad: Actividad) => {
    setEditingActividad(actividad);
    setIsFormOpen(true);
  };

  const handleDelete = async (proyectoId: string, actividadId: string) => {
    if (confirm("¿Estás seguro de eliminar esta actividad?")) {
      await deleteActividad(proyectoId, actividadId);
    }
  };

  const resetFiltros = () => {
    setSearchQuery("");
    setFiltroEstado("all");
    setFiltroResponsable("all");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <ClipboardList className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-medium text-primary tracking-tight">Gestión de Actividades</h1>
          </div>
          <p className="text-muted-foreground mt-1 font-medium">Control operativo de tareas en todos los proyectos.</p>
        </div>
        <Button
          className="gap-2 font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 h-12 px-6"
          onClick={() => { setEditingActividad(null); setIsFormOpen(true); }}
        >
          <Plus className="w-4 h-4" /> Nueva Actividad
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatsCard label="Total" value={stats.total} icon={<ClipboardList className="w-4 h-4"/>} color="text-primary" bgColor="bg-primary/5" />
        <StatsCard label="Pendientes" value={stats.pendientes} icon={<Clock className="w-4 h-4"/>} color="text-slate-600" bgColor="bg-slate-50" />
        <StatsCard label="En Marcha" value={stats.enProgreso} icon={<Clock className="w-4 h-4"/>} color="text-blue-600" bgColor="bg-blue-50" />
        <StatsCard label="Culminadas" value={stats.completadas} icon={<CheckCircle2 className="w-4 h-4"/>} color="text-emerald-600" bgColor="bg-emerald-50" />
        <StatsCard label="Bloqueadas" value={stats.bloqueadas} icon={<Clock className="w-4 h-4"/>} color="text-red-600" bgColor="bg-red-50" />
      </div>

      {/* Filtros */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-center gap-6">
        <div className="relative flex-1 w-full">
          <span className="text-[10px] font-medium uppercase text-primary tracking-widest ml-1 mb-1.5 block">Buscador</span>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input 
              placeholder="Buscar por actividad o proyecto..." 
              className="pl-12 h-14 border-slate-200 bg-white focus:bg-white transition-all shadow-none font-medium text-base rounded-xl" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          <div className="flex flex-col gap-1.5 min-w-[180px]">
            <span className="text-[10px] font-medium uppercase text-primary tracking-widest ml-1">Estado</span>
            <Select value={filtroEstado} onValueChange={(val) => setFiltroEstado(val ?? "all")}>
              <SelectTrigger className="h-14 border-slate-200 bg-white text-base font-medium shadow-none rounded-xl">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200">
                <SelectItem value="all" className="text-slate-400 uppercase tracking-tighter italic font-medium">Sin filtro</SelectItem>
                {["Pendiente", "En Progreso", "Completada", "Validada", "Bloqueada"].map(e => (
                  <SelectItem key={e} value={e} className="font-medium">{e}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5 min-w-[220px]">
            <span className="text-[10px] font-medium uppercase text-primary tracking-widest ml-1">Responsable</span>
            <Select value={filtroResponsable} onValueChange={(val) => setFiltroResponsable(val ?? "")}>
              <SelectTrigger className="h-14 border-slate-200 bg-white text-base font-medium shadow-none rounded-xl">
                <SelectValue placeholder="Responsable" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200">
                <SelectItem value="all" className="text-slate-400 uppercase tracking-tighter italic font-medium">Sin filtro</SelectItem>
                {responsables.map(r => (
                  <SelectItem key={r.id} value={r.id} className="font-medium uppercase">{r.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end self-end h-14 pb-0.5">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={resetFiltros} 
              className="h-14 w-14 text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-100 hover:border-red-200 transition-all rounded-xl"
              title="Limpiar filtros"
            >
              <FilterX className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="font-medium text-primary uppercase text-[10px] py-4">Actividad</TableHead>
              <TableHead className="font-medium text-primary uppercase text-[10px]">Proyecto</TableHead>
              <TableHead className="font-medium text-primary uppercase text-[10px]">Tipo</TableHead>
              <TableHead className="font-medium text-primary uppercase text-[10px]">Responsable</TableHead>
              <TableHead className="font-medium text-primary uppercase text-[10px]">Cronograma</TableHead>
              <TableHead className="font-medium text-primary uppercase text-[10px]">Estado</TableHead>
              <TableHead className="text-right font-medium text-primary uppercase text-[10px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </TableCell>
              </TableRow>
            ) : filteredActividades.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-20 text-slate-400 font-medium italic">
                  No se encontraron actividades con los filtros aplicados
                </TableCell>
              </TableRow>
            ) : (
              filteredActividades.map((actividad) => (
                <TableRow key={actividad.id} className="hover:bg-slate-50/50 transition-colors group">
                  <TableCell>
                    <p className={cn(
                      "font-medium text-slate-800 text-sm",
                      (actividad.estado === "Completada" || actividad.estado === "Validada") && "text-slate-400 line-through"
                    )}>
                      {actividad.descripcion}
                    </p>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-primary text-[10px] uppercase">{actividad.proyectoCodigo}</span>
                      <span className="text-[10px] text-slate-500 font-bold truncate max-w-[120px]">{actividad.proyectoNombre}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("text-[9px] font-medium uppercase", tipoColors[actividad.tipo])}>
                      {actividad.tipo}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-medium text-slate-500 uppercase">
                        {getResponsableName(actividad.responsablePrincipalId).charAt(0)}
                      </div>
                      <span className="text-[10px] font-bold text-slate-700">{getResponsableName(actividad.responsablePrincipalId)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {formatDate(actividad.fechaInicio)}
                      </span>
                      <span className="text-[10px] font-medium text-primary">
                        {formatDate(actividad.fechaVencimiento)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("border-none font-medium text-[9px] uppercase shadow-none", estadoColors[actividad.estado])}>
                      {actividad.estado}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
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
                        className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                        onClick={() => handleDelete(actividad.proyectoId, actividad.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
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
