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
import { useOperacionesStore } from "@/store/operaciones-store";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Search,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Eye,
  Pencil,
  Trash2,
  FilterX,
  X,
  LayoutDashboard,
  FileCheck,
  History,
  ClipboardList,
  Calendar,
  HandCoins
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { ValidacionPanel } from "@/components/operaciones/validacion-panel";
import { TimelinePanel } from "@/components/operaciones/timeline-panel";
import { ProyectoDetail, StatsCard } from "@/components/operaciones/proyecto-detail";
import { ActividadForm } from "@/components/operaciones/actividad-form";
import { SolicitudesFondosPanel } from "@/components/operaciones/solicitudes-fondos-panel";
import type { Proyecto } from "@/lib/types";

const statusColors: Record<string, string> = {
  "Planificación": "bg-blue-100 text-blue-700",
  "En Ejecución": "bg-orange-100 text-orange-700",
  "Detenido": "bg-red-100 text-red-700",
  "Finalizado": "bg-green-100 text-green-700",
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

export default function OperacionesPage() {
  const { 
    proyectos, 
    responsables, 
    filtros, 
    loading,
    error,
    setSearchQuery, 
    setEstado, 
    setArea, 
    setPrioridad, 
    setSemaforo, 
    setResponsable,
    resetFiltros, 
    fetchProyectos,
    fetchResponsables,
    getProyectosFiltrados,
    deleteProyecto
  } = useOperacionesStore();

  const [selectedProject, setSelectedProject] = useState<Proyecto | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Derivar el proyecto seleccionado desde el store para que refleje cambios inmediatamente
  const currentSelectedProject = useMemo(() => 
    selectedProject ? proyectos.find(p => p.id === selectedProject.id) || null : null,
    [selectedProject, proyectos]
  );
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isNewActivityModalOpen, setIsNewActivityModalOpen] = useState(false);

  useEffect(() => {
    fetchProyectos();
    fetchResponsables();
  }, [fetchProyectos, fetchResponsables]);

  const getResponsableName = useCallback((id: string) => {
    if (!id) return "SIN ASIGNAR";
    const resp = responsables.find(r => r.id === id);
    if (resp) return resp.nombre.toUpperCase();
    
    // Si es un UUID (contiene guiones y es largo), lo ocultamos con un placeholder legible
    if (id.includes('-') && id.length > 20) {
      // Intentar ver si es un usuario del sistema (si tuviéramos esa lista)
      return "RESPONSABLE TÉCNICO";
    }
    
    return id.toUpperCase();
  }, [responsables]);

  const filteredProjects = useMemo(() => getProyectosFiltrados(), [getProyectosFiltrados, proyectos, filtros]);

  const activeFilters = useMemo(() => {
    const active = [];
    if (filtros.searchQuery) {
      active.push({ id: 'searchQuery', label: `Búsqueda: ${filtros.searchQuery}`, clear: () => setSearchQuery('') });
    }
    if (filtros.estado) {
      active.push({ id: 'estado', label: `Estado: ${filtros.estado}`, clear: () => setEstado('') });
    }
    if (filtros.responsable) {
      const resp = responsables.find(r => r.id === filtros.responsable);
      active.push({ id: 'responsable', label: `Resp: ${resp?.nombre || filtros.responsable}`, clear: () => setResponsable('') });
    }
    if (filtros.area) {
      active.push({ id: 'area', label: `Área: ${filtros.area}`, clear: () => setArea('') });
    }
    if (filtros.prioridad) {
      active.push({ id: 'prioridad', label: `Prioridad: ${filtros.prioridad}`, clear: () => setPrioridad('') });
    }
    if (filtros.semaforo) {
      active.push({ id: 'semaforo', label: `Semáforo: ${filtros.semaforo}`, clear: () => setSemaforo('') });
    }
    return active;
  }, [filtros, responsables, setSearchQuery, setEstado, setResponsable, setArea, setPrioridad, setSemaforo]);

  const stats = useMemo(() => ({
    activos: proyectos.filter(p => p.estado === 'En Ejecución' || p.estado === 'Planificación').length,
    planificacion: proyectos.filter(p => p.estado === 'Planificación').length,
    retrasados: proyectos.filter(p => p.semaforo === 'Rojo' || p.estado === 'Detenido').length,
    finalizados: proyectos.filter(p => p.estado === 'Finalizado').length,
  }), [proyectos]);

  if (loading && proyectos.length === 0) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-sm font-medium uppercase tracking-widest text-primary animate-pulse">Sincronizando Operaciones...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm font-medium">Error: {error}</p>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Briefcase className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-black text-primary tracking-tight uppercase">Panel de Operaciones</h1>
          </div>
          <p className="text-muted-foreground mt-1 font-medium">Control de ejecución de proyectos e ingeniería.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            className="h-12 gap-2 font-black uppercase text-xs border-primary text-primary hover:bg-primary/5 rounded-xl px-6"
            onClick={() => setIsNewActivityModalOpen(true)}
          >
            <ClipboardList className="w-4 h-4" /> Nueva Actividad
          </Button>
          <Button 
            className="h-12 gap-2 font-black uppercase text-xs bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-xl px-8"
            onClick={() => setIsNewProjectModalOpen(true)}
          >
            <Plus className="w-5 h-5" /> Nuevo Proyecto
          </Button>
        </div>
      </div>

      <Tabs defaultValue="proyectos" className="space-y-6">
        <TabsList className="bg-white border p-1 rounded-xl h-12 gap-1">
          <TabsTrigger value="proyectos" className="gap-2 px-4 font-black uppercase text-[10px]">
            <LayoutDashboard className="w-4 h-4" /> Proyectos
          </TabsTrigger>
          <TabsTrigger value="solicitudes" className="gap-2 px-4 font-black uppercase text-[10px]">
            <HandCoins className="w-4 h-4" /> Solicitudes y Rendiciones
          </TabsTrigger>
          <TabsTrigger value="validaciones" className="gap-2 px-4 font-black uppercase text-[10px]">
            <FileCheck className="w-4 h-4" /> Validaciones
          </TabsTrigger>
          <TabsTrigger value="timeline" className="gap-2 px-4 font-black uppercase text-[10px]">
            <History className="w-4 h-4" /> Historial Global
          </TabsTrigger>
        </TabsList>

        <TabsContent value="proyectos" className="space-y-6 mt-0">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatsCard label="Activos" value={stats.activos} icon={<Briefcase className="w-4 h-4"/>} color="text-primary" bgColor="bg-primary/5" />
            <StatsCard label="Planificación" value={stats.planificacion} icon={<LayoutDashboard className="w-4 h-4"/>} color="text-blue-600" bgColor="bg-blue-50" />
            <StatsCard label="Críticos" value={stats.retrasados} icon={<AlertCircle className="w-4 h-4"/>} color="text-red-600" bgColor="bg-red-50" />
            <StatsCard label="Finalizados" value={stats.finalizados} icon={<CheckCircle2 className="w-4 h-4"/>} color="text-emerald-600" bgColor="bg-emerald-50" />
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

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-6">
            <div className="relative w-full">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 mb-2 block">Búsqueda rápida</span>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input 
                  placeholder="Buscar por código, cliente o nombre..." 
                  className="pl-12 h-14 border-slate-200 bg-slate-50/30 focus:bg-white transition-all shadow-none font-bold text-base rounded-xl" 
                  value={filtros.searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-black uppercase text-primary tracking-widest ml-1">Estado</span>
                <Select
                  value={filtros.estado}
                  onValueChange={(val) => setEstado(val || "")}>                  
                    <SelectTrigger className="h-11 text-[10px] border-slate-200 bg-white font-black uppercase rounded-xl shadow-sm">
                    <SelectValue placeholder="SELECCIONAR ESTADO" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 rounded-xl">
                    <SelectItem value="Planificación" className="font-black text-[10px] uppercase">PLANIFICACIÓN</SelectItem>
                    <SelectItem value="En Ejecución" className="font-black text-[10px] uppercase">EN EJECUCIÓN</SelectItem>
                    <SelectItem value="Detenido" className="font-black text-[10px] uppercase">DETENIDO</SelectItem>
                    <SelectItem value="Finalizado" className="font-black text-[10px] uppercase">FINALIZADO</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-black uppercase text-primary tracking-widest ml-1">Área</span>
                <Select
                  value={filtros.area}
                  onValueChange={(val) => setArea(val || "")}>                  
                    <SelectTrigger className="h-11 text-[10px] border-slate-200 bg-white font-black uppercase rounded-xl shadow-sm">
                    <SelectValue placeholder="SELECCIONAR ÁREA" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 rounded-xl">
                    <SelectItem value="Logística y Recursos" className="font-black text-[10px] uppercase">LOGÍSTICA Y RECURSOS</SelectItem>
                    <SelectItem value="Ingeniería y Supervisión Técnica" className="font-black text-[10px] uppercase">INGENIERÍA Y SUPERVISIÓN</SelectItem>
                    <SelectItem value="Gestión Documentaria y Expedientes Técnicos" className="font-black text-[10px] uppercase">GESTIÓN DOCUMENTAL</SelectItem>
                    <SelectItem value="Operaciones de Campo y Control de Obra" className="font-black text-[10px] uppercase">OPERACIONES DE CAMPO</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-black uppercase text-primary tracking-widest ml-1">Prioridad</span>
                <Select
                  value={filtros.prioridad}
                  onValueChange={(val) => setPrioridad(val || "")}>                  
                    <SelectTrigger className="h-11 text-[10px] border-slate-200 bg-white font-black uppercase rounded-xl shadow-sm">
                    <SelectValue placeholder="SELECCIONAR PRIORIDAD" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 rounded-xl">
                    <SelectItem value="Baja" className="font-black text-[10px] uppercase">BAJA</SelectItem>
                    <SelectItem value="Media" className="font-black text-[10px] uppercase">MEDIA</SelectItem>
                    <SelectItem value="Alta" className="font-black text-[10px] uppercase">ALTA</SelectItem>
                    <SelectItem value="Crítica" className="font-black text-[10px] uppercase">CRÍTICA</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-black uppercase text-primary tracking-widest ml-1">Semáforo</span>
                <Select
                  value={filtros.semaforo}
                  onValueChange={(val) => setSemaforo(val || "")}>                  
                    <SelectTrigger className="h-11 text-[10px] border-slate-200 bg-white font-black uppercase rounded-xl shadow-sm">
                    <SelectValue placeholder="SELECCIONAR SEMÁFORO" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 rounded-xl">
                    <SelectItem value="Verde" className="font-black text-[10px] uppercase">VERDE</SelectItem>
                    <SelectItem value="Amarillo" className="font-black text-[10px] uppercase">AMARILLO</SelectItem>
                    <SelectItem value="Rojo" className="font-black text-[10px] uppercase">ROJO</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-black uppercase text-primary tracking-widest ml-1">Responsable</span>
                <Select value={filtros.responsable} onValueChange={(value) => setResponsable(value || "")}>
                  <SelectTrigger className="h-11 text-[10px] border-slate-200 bg-white font-black uppercase rounded-xl shadow-sm">
                    <SelectValue placeholder="SELECCIONAR RESPONSABLE">
                      {filtros.responsable ? responsables.find(r => r.id === filtros.responsable)?.nombre : undefined}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 rounded-xl">
                    {responsables.map(r => (
                      <SelectItem key={r.id} value={r.id} className="font-black text-[10px] uppercase">{r.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end h-12">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={resetFiltros} 
                  className="h-12 w-full text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-100 hover:border-red-200 transition-all rounded-xl gap-2 font-black text-[10px] uppercase"
                >
                  <FilterX className="w-5 h-5" />
                  <span className="lg:hidden">Limpiar</span>
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="font-medium text-primary uppercase text-[10px] py-4">Proyecto / Código</TableHead>
                  <TableHead className="font-medium text-primary uppercase text-[10px]">Estado</TableHead>
                  <TableHead className="font-medium text-primary uppercase text-[10px]">Responsable</TableHead>
                  <TableHead className="font-medium text-primary uppercase text-[10px]">Cronograma</TableHead>
                  <TableHead className="font-medium text-primary uppercase text-[10px]">Avance</TableHead>
                  <TableHead className="text-right font-medium text-primary uppercase text-[10px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-20 text-slate-400 font-medium italic">
                      No se encontraron proyectos con los filtros aplicados
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProjects.map((proyecto) => (
                    <TableRow key={proyecto.id} className="hover:bg-slate-50/50 transition-colors group">
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-primary text-xs uppercase tracking-tight">{proyecto.codigo}</span>
                          <span className="text-[10px] font-black text-slate-700 uppercase truncate max-w-[200px]">{proyecto.nombre}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("border-none font-black text-[9px] uppercase shadow-none", statusColors[proyecto.estado])}>
                          {proyecto.estado}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-black uppercase">
                            {getResponsableName(proyecto.responsablePrincipalId).charAt(0)}
                          </div>
                          <span className="text-[10px] font-black text-slate-700 uppercase">{getResponsableName(proyecto.responsablePrincipalId)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {formatDate(proyecto.fechaInicio)}
                          </span>
                          <span className="text-[10px] font-medium text-primary">
                            {formatDate(proyecto.fechaFinEstimada)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden min-w-[60px]">
                            <div 
                              className={cn(
                                "h-full transition-all duration-700",
                                proyecto.avanceCalculado === 100 ? "bg-emerald-500" : "bg-primary"
                              )} 
                              style={{ width: `${proyecto.avanceCalculado}%` }} 
                            />
                          </div>
                          <span className="text-[10px] font-medium text-primary">{proyecto.avanceCalculado}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-primary hover:bg-primary/10"
                            onClick={() => { setSelectedProject(proyecto); setIsDetailsModalOpen(true); }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                            onClick={() => { if(confirm("¿Eliminar proyecto?")) deleteProyecto(proyecto.id) }}
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
        </TabsContent>

        <TabsContent value="solicitudes" className="mt-0">
          <SolicitudesFondosPanel />
        </TabsContent>

        <TabsContent value="validaciones" className="mt-0">
          <ValidacionPanel />
        </TabsContent>

        <TabsContent value="timeline" className="mt-0">
          <TimelinePanel />
        </TabsContent>
      </Tabs>

      {/* MODALS */}
      {isDetailsModalOpen && currentSelectedProject && (
        <ProyectoDetail
          proyecto={currentSelectedProject}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setSelectedProject(null);
          }}
        />
      )}

      {isNewActivityModalOpen && (
        <ActividadForm
          isOpen={isNewActivityModalOpen}
          onClose={() => setIsNewActivityModalOpen(false)}
        />
      )}
    </div>
  );
}
