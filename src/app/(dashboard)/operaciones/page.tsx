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
  LayoutDashboard,
  FileCheck,
  History,
  ClipboardList,
  Calendar
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
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isNewActivityModalOpen, setIsNewActivityModalOpen] = useState(false);

  useEffect(() => {
    fetchProyectos();
    fetchResponsables();
  }, [fetchProyectos, fetchResponsables]);

  const getResponsableName = useCallback((id: string) => {
    return responsables.find(r => r.id === id)?.nombre || 'Sin asignar';
  }, [responsables]);

  const filteredProjects = useMemo(() => getProyectosFiltrados(), [getProyectosFiltrados, proyectos, filtros]);

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
            <h1 className="text-3xl font-medium text-primary tracking-tight">Panel de Operaciones</h1>
          </div>
          <p className="text-muted-foreground mt-1 font-medium">Control de ejecución de proyectos e ingeniería.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            className="gap-2 font-medium border-primary text-primary hover:bg-primary/5"
            onClick={() => setIsNewActivityModalOpen(true)}
          >
            <ClipboardList className="w-4 h-4" /> Nueva Actividad
          </Button>
          <Button 
            className="gap-2 font-medium bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
            onClick={() => setIsNewProjectModalOpen(true)}
          >
            <Plus className="w-4 h-4" /> Nuevo Proyecto
          </Button>
        </div>
      </div>

      <Tabs defaultValue="proyectos" className="space-y-6">
        <TabsList className="bg-white border p-1 rounded-xl h-12 gap-1">
          <TabsTrigger value="proyectos" className="gap-2 px-4 font-medium uppercase text-[10px]">
            <LayoutDashboard className="w-4 h-4" /> Proyectos
          </TabsTrigger>
          <TabsTrigger value="validaciones" className="gap-2 px-4 font-medium uppercase text-[10px]">
            <FileCheck className="w-4 h-4" /> Validaciones
          </TabsTrigger>
          <TabsTrigger value="timeline" className="gap-2 px-4 font-medium uppercase text-[10px]">
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

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-center gap-6">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input 
                placeholder="Buscar por código, cliente o nombre..." 
                className="pl-12 h-14 border-slate-200 bg-white focus:bg-white transition-all shadow-none font-medium text-base rounded-xl" 
                value={filtros.searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
              <div className="flex flex-col gap-2 min-w-[180px]">
                <Select
               value={filtros.estado ?? "all"}
                  onValueChange={(val) => setEstado(val ?? "all")}>                  
                    <SelectTrigger className="h-14 border-slate-200 bg-white text-base font-medium shadow-none rounded-xl">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 rounded-xl">
                    <SelectItem value="all" className="text-slate-400 uppercase tracking-tighter italic">Sin filtro</SelectItem>
                    <SelectItem value="Planificación">Planificación</SelectItem>
                    <SelectItem value="En Ejecución">En Ejecución</SelectItem>
                    <SelectItem value="Detenido">Detenido</SelectItem>
                    <SelectItem value="Finalizado">Finalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2 min-w-[220px]">
                <Select value={filtros.responsable || "all"} onValueChange={(value) => setResponsable(value ?? "all")}>
                  <SelectTrigger className="h-14 border-slate-200 bg-white text-base font-medium shadow-none rounded-xl">
                    <SelectValue placeholder="Responsable" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 rounded-xl">
                    <SelectItem value="all" className="text-slate-400 uppercase tracking-tighter italic">Sin filtro</SelectItem>
                    {responsables.map(r => (
                      <SelectItem key={r.id} value={r.id} className="uppercase">{r.nombre}</SelectItem>
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
                          <span className="font-medium text-primary text-xs uppercase tracking-tight">{proyecto.codigo}</span>
                          <span className="text-[10px] font-medium text-slate-600 truncate max-w-[200px]">{proyecto.nombre}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("border-none font-medium text-[9px] uppercase shadow-none", statusColors[proyecto.estado])}>
                          {proyecto.estado}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-medium uppercase">
                            {getResponsableName(proyecto.responsablePrincipalId).charAt(0)}
                          </div>
                          <span className="text-[10px] font-medium text-slate-700">{getResponsableName(proyecto.responsablePrincipalId)}</span>
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

        <TabsContent value="validaciones" className="mt-0">
          <ValidacionPanel />
        </TabsContent>

        <TabsContent value="timeline" className="mt-0">
          <TimelinePanel />
        </TabsContent>
      </Tabs>

      {/* MODALS */}
      {isDetailsModalOpen && selectedProject && (
        <ProyectoDetail
          proyecto={selectedProject}
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
