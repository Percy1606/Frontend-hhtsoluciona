"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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
  Briefcase,
  Activity,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Eye,
  Pencil,
  X,
  FolderKanban,
  BarChart3,
  Trash2,
  FilterX
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn, formatDate } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProyectoDetail, StatsCard } from "@/components/operaciones/proyecto-detail";
import { KPIPanel } from "@/components/operaciones/kpi-panel";
import { useOperacionesStore } from "@/store/operaciones-store";
import type { Proyecto, Actividad } from "@/lib/types";

const statusColors: Record<string, string> = {
  "Planificación": "bg-blue-100 text-blue-700",
  "En Ejecución": "bg-orange-100 text-orange-700",
  "Detenido": "bg-red-100 text-red-700",
  "Finalizado": "bg-green-100 text-green-700",
};

const prioridadColors: Record<string, string> = {
  "Baja": "bg-gray-100 text-gray-700",
  "Media": "bg-yellow-100 text-yellow-700",
  "Alta": "bg-orange-100 text-orange-700",
  "Crítica": "bg-red-100 text-red-700",
};

const semaforoColors: Record<string, string> = {
  "Verde": "bg-success",
  "Amarillo": "bg-warning",
  "Rojo": "bg-error",
};

const areaColors: Record<string, string> = {
  "Logística y Recursos": "bg-blue-500",
  "Ingeniería y Supervisión Técnica": "bg-green-500",
  "Gestión Documentaria y Expedientes Técnicos": "bg-orange-500",
  "Operaciones de Campo y Control de Obra": "bg-purple-500",
};

export default function ProyectosPage() {
  const {
    proyectos,
    responsables,
    filtros,
    setSearchQuery,
    setEstado,
    setArea,
    setPrioridad,
    setSemaforo,
    setResponsable,
    resetFiltros,
    addProyecto,
    updateProyecto,
    deleteProyecto,
    updateActividad,
    bloquearChecklist,
    desbloquearChecklist,
    calcularKPIs,
    fetchProyectos,
    fetchResponsables,
    getProyectosFiltrados,
  } = useOperacionesStore();

  const [loading, setLoading] = useState(true);
  const [selectedProyecto, setSelectedProyecto] = useState<Proyecto | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("proyectos");

  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Proyecto | null>(null);
  const [editingProyecto, setEditingProyecto] = useState<Proyecto | null>(null);

  const [newProject, setNewProject] = useState({
    clientId: "CLIENTE-NUEVO",
    nombre: "",
    descripcion: "",
    estado: "Planificación",
    prioridad: "Media",
    fechaInicio: new Date().toISOString().split('T')[0],
    fechaFinEstimada: "",
    area: "Operaciones de Campo y Control de Obra",
    responsablePrincipalId: "",
    responsablesAdicionales: [],
  });

  const [periodoKPI, setPeriodoKPI] = useState<'semanal' | 'mensual' | 'anual'>('mensual');

  useEffect(() => {
    const init = async () => {
      await Promise.all([fetchProyectos(), fetchResponsables()]);
      setLoading(false);
    };
    init();
  }, [fetchProyectos, fetchResponsables]);

  // Set default responsable when they load
  useEffect(() => {
    if (responsables.length > 0 && !newProject.responsablePrincipalId) {
      setNewProject(prev => ({ ...prev, responsablePrincipalId: responsables[0].id }));
    }
  }, [responsables, newProject.responsablePrincipalId]);

  const handleOpenDetail = (proyecto: Proyecto) => {
    setSelectedProyecto(proyecto);
    setIsDetailOpen(true);
  };

  const handleEditProyecto = (proyecto: Proyecto) => {
    setEditingProyecto({
      ...proyecto,
      fechaInicio: proyecto.fechaInicio ? proyecto.fechaInicio.split("T")[0] : "",
      fechaFinEstimada: proyecto.fechaFinEstimada ? proyecto.fechaFinEstimada.split("T")[0] : "",
    });
    setIsEditProjectModalOpen(true);
  };

  const handleDeleteClick = (proyecto: Proyecto) => {
    setProjectToDelete(proyecto);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (projectToDelete) {
      await deleteProyecto(projectToDelete.id);
      setIsDeleteModalOpen(false);
      setProjectToDelete(null);
    }
  };

  const handleSaveNewProject = async () => {
    if (!newProject.nombre || !newProject.fechaFinEstimada) return;

    await addProyecto(newProject as any);

    setIsNewProjectModalOpen(false);
    setNewProject({
      clientId: "CLIENTE-NUEVO",
      nombre: "",
      descripcion: "",
      estado: "Planificación",
      prioridad: "Media",
      fechaInicio: new Date().toISOString().split('T')[0],
      fechaFinEstimada: "",
      area: "Operaciones de Campo y Control de Obra",
      responsablePrincipalId: responsables.length > 0 ? responsables[0].id : "",
      responsablesAdicionales: [],
    });
  };

  const handleSaveEditProject = async () => {
    if (!editingProyecto) return;
    await updateProyecto(editingProyecto);
    setIsEditProjectModalOpen(false);
    setEditingProyecto(null);
  };

  const handleUpdateActividad = (actividad: Actividad) => {
    if (!selectedProyecto) return;
    updateActividad(selectedProyecto.id, actividad);
  };

  const handleBloquearChecklist = (actividadId: string, motivo: string) => {
    if (!selectedProyecto) return;
    bloquearChecklist(selectedProyecto.id, actividadId, motivo);
  };

  const handleDesbloquearChecklist = (actividadId: string, motivo: string) => {
    if (!selectedProyecto) return;
    desbloquearChecklist(selectedProyecto.id, actividadId, motivo);
  };

  // Dinamically recalculate selected project to keep details view updated
  const currentSelectedProyecto = selectedProyecto 
    ? proyectos.find(p => p.id === selectedProyecto.id) || null
    : null;

  // Filtrar Proyectos
  const proyectosFiltrados = useMemo(() => {
    return proyectos.filter((p) => {
      if (filtros.searchQuery && !p.nombre.toLowerCase().includes(filtros.searchQuery.toLowerCase()) &&
          !p.codigo.toLowerCase().includes(filtros.searchQuery.toLowerCase())) {
        return false;
      }
      if (filtros.estado !== "all" && p.estado !== filtros.estado) return false;
      if (filtros.area !== "all" && p.area !== filtros.area) return false;
      if (filtros.prioridad !== "all" && p.prioridad !== filtros.prioridad) return false;
      if (filtros.semaforo !== "all" && p.semaforo !== filtros.semaforo) return false;
      return true;
    });
  }, [proyectos, filtros]);

  // Estadísticas de Proyectos
  const stats = useMemo(() => ({
    total: proyectos.length,
    activos: proyectos.filter(p => p.estado === 'En Ejecución').length,
    planification: proyectos.filter(p => p.estado === 'Planificación').length,
    finalizados: proyectos.filter(p => p.estado === 'Finalizado').length,
    detenidos: proyectos.filter(p => p.estado === 'Detenido').length,
    verdes: proyectos.filter(p => p.semaforo === 'Verde').length,
    amarillos: proyectos.filter(p => p.semaforo === 'Amarillo').length,
    rojos: proyectos.filter(p => p.semaforo === 'Rojo').length,
  }), [proyectos]);

  // Estadísticas de Actividades
  const actividadStats = useMemo(() => ({
    total: proyectos.reduce((acc, p) => acc + (p.actividades?.length || 0), 0),
    pendientes: proyectos.reduce((acc, p) => acc + (p.actividades?.filter(a => a.estado === "Pendiente").length || 0), 0),
    enProgreso: proyectos.reduce((acc, p) => acc + (p.actividades?.filter(a => a.estado === "En Progreso").length || 0), 0),
    completadas: proyectos.reduce((acc, p) => acc + (p.actividades?.filter(a => a.estado === "Completada" || a.estado === "Validada").length || 0), 0),
    bloqueadas: proyectos.reduce((acc, p) => acc + (p.actividades?.filter(a => a.estado === "Bloqueada").length || 0), 0),
  }), [proyectos]);

  // KPIs
  const kpis = calcularKPIs(periodoKPI);

  const getResponsableName = useCallback((id: string) => {
    return responsables.find(r => r.id === id)?.nombre || "Sin asignar";
  }, [responsables]);

  const getResponsableColor = useCallback((id: string) => {
    return responsables.find(r => r.id === id)?.color || "#666";
  }, [responsables]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Briefcase className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-3xl font-medium text-primary tracking-tight">Operaciones</h1>
        </div>
        <Button
          className="gap-2 font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
          onClick={() => setIsNewProjectModalOpen(true)}
        >
          <Plus className="w-4 h-4" /> Nuevo Proyecto
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border">
          <TabsTrigger value="proyectos" className="gap-2">
            <FolderKanban className="w-4 h-4" /> Proyectos
          </TabsTrigger>
          <TabsTrigger value="kpis" className="gap-2">
            <BarChart3 className="w-4 h-4" /> KPIs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="proyectos" className="mt-4 space-y-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatsCard
              label="Total Proyectos"
              value={stats.total}
              icon={<Briefcase className="w-5 h-5" />}
              color="text-primary"
              bgColor="bg-primary/5"
            />
            <StatsCard
              label="En Ejecución"
              value={stats.activos}
              icon={<Activity className="w-5 h-5" />}
              color="text-orange-600"
              bgColor="bg-orange-50"
            />
            <StatsCard
              label="Planificación"
              value={stats.planification}
              icon={<Calendar className="w-5 h-5" />}
              color="text-blue-600"
              bgColor="bg-blue-50"
            />
            <StatsCard
              label="Finalizados"
              value={stats.finalizados}
              icon={<CheckCircle2 className="w-5 h-5" />}
              color="text-green-600"
              bgColor="bg-green-50"
            />
            <StatsCard
              label="Críticos"
              value={stats.rojos}
              icon={<AlertCircle className="w-5 h-5" />}
              color="text-error"
              bgColor="bg-red-50"
            />
          </div>

          {/* Filtros */}
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
                <Select value={filtros.estado} onValueChange={(val) => setEstado(val ?? "")}>
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
                <Select value={filtros.responsable || "all"} onValueChange={(val) => setResponsable(val ?? "")}>
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

          {/* Tabla */}
          <div className="rounded-xl border border-border bg-white overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="font-bold text-primary">CÓDIGO</TableHead>
                  <TableHead className="font-bold text-primary">PROYECTO</TableHead>
                  <TableHead className="font-bold text-primary">ÁREA</TableHead>
                  <TableHead className="font-bold text-primary">RESPONSABLE</TableHead>
                  <TableHead className="font-bold text-primary">FECHAS</TableHead>
                  <TableHead className="font-bold text-primary">AVANCE</TableHead>
                  <TableHead className="font-bold text-primary">ESTADO</TableHead>
                  <TableHead className="font-bold text-primary text-right">ACCIONES</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <span>Cargando proyectos...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : proyectosFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No se encontraron proyectos
                    </TableCell>
                  </TableRow>
                ) : (
                  proyectosFiltrados.map((proyecto) => (
                    <TableRow key={proyecto.id} className="hover:bg-muted/10 transition-colors group">
                      <TableCell className="font-medium text-xs text-primary">
                        {proyecto.codigo || proyecto.id.substring(0, 8)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-bold text-sm text-primary group-hover:text-secondary transition-colors">
                            {proyecto.nombre}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                            {proyecto.descripcion || "Sin descripción"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("text-[10px] font-bold uppercase text-white", areaColors[proyecto.area] || "bg-gray-100")}>
                          {proyecto.area}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                            style={{ backgroundColor: getResponsableColor(proyecto.responsablePrincipalId) }}
                          >
                            {getResponsableName(proyecto.responsablePrincipalId).charAt(0)}
                          </div>
                          <span className="text-sm font-bold text-slate-600">
                            {getResponsableName(proyecto.responsablePrincipalId)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-[10px] font-medium">
                          <span className="text-muted-foreground uppercase">
                            Inicio: {formatDate(proyecto.fechaInicio)}
                          </span>
                          <span className="text-primary uppercase">
                            Fin: {formatDate(proyecto.fechaFinEstimada)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="w-full max-w-[100px] space-y-1.5">
                          <div className="flex justify-between items-center text-[10px] font-medium uppercase">
                            <span>{proyecto.avanceCalculado}%</span>
                            <div className={cn("w-2 h-2 rounded-full", semaforoColors[proyecto.semaforo])} />
                          </div>
                          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full transition-all duration-500",
                                proyecto.avanceCalculado === 100 ? "bg-success" : "bg-primary"
                              )}
                              style={{ width: `${proyecto.avanceCalculado}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 items-start">
                          <Badge className={cn("border-none font-medium text-[9px] uppercase tracking-wider", statusColors[proyecto.estado])}>
                            {proyecto.estado}
                          </Badge>
                          <Badge className={cn("border-none font-medium text-[9px] uppercase tracking-wider", prioridadColors[proyecto.prioridad])}>
                            {proyecto.prioridad}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 font-bold text-[10px] uppercase gap-1 border-primary text-primary hover:bg-primary hover:text-white"
                            onClick={() => handleOpenDetail(proyecto)}
                          >
                            <Eye className="w-3 h-3" /> Ver
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 font-bold text-[10px] uppercase gap-1 border-secondary text-secondary hover:bg-secondary hover:text-white"
                            onClick={() => handleEditProyecto(proyecto)}
                          >
                            <Pencil className="w-3 h-3" /> Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 font-bold text-[10px] uppercase gap-1 border-error text-error hover:bg-error hover:text-white"
                            onClick={() => handleDeleteClick(proyecto)}
                          >
                            <Trash2 className="w-3 h-3" /> Eliminar
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

        <TabsContent value="kpis" className="mt-4">
          <KPIPanel
            proyectosStats={stats}
            actividadesStats={actividadStats}
            kpis={kpis}
            onCambiarPeriodo={(p) => setPeriodoKPI(p)}
          />
        </TabsContent>
      </Tabs>

      {/* Modal Detalle */}
      {currentSelectedProyecto && isDetailOpen && (
        <ProyectoDetail
          proyecto={currentSelectedProyecto}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedProyecto(null);
          }}
        />
      )}

      {/* Modal Nuevo Proyecto */}
      <Dialog open={isNewProjectModalOpen} onOpenChange={setIsNewProjectModalOpen}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] p-0 border-none bg-white flex flex-col overflow-y-auto">
          <DialogHeader className="p-6 bg-primary text-white rounded-t-lg shrink-0">
            <DialogTitle className="text-2xl font-medium tracking-tight flex items-center gap-3">
              <Plus className="w-6 h-6 text-accent" />
              Nuevo Proyecto
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 space-y-3 overflow-y-auto flex-1">
            <div className="space-y-1">
              <Label htmlFor="nombre" className="text-xs font-bold text-primary">Nombre del Proyecto *</Label>
              <Input
                id="nombre"
                value={newProject.nombre}
                onChange={(e) => setNewProject({ ...newProject, nombre: e.target.value })}
                placeholder="Nombre del proyecto"
                className="h-8 text-sm font-bold"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="descripcion" className="text-xs font-bold text-primary">Descripción</Label>
              <Textarea
                id="descripcion"
                value={newProject.descripcion}
                onChange={(e) => setNewProject({ ...newProject, descripcion: e.target.value })}
                placeholder="Descripción breve"
                className="h-16 text-sm font-bold resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="area" className="text-xs font-bold text-primary">Área *</Label>
                <Select
                  value={newProject.area}
                  onValueChange={(val) => setNewProject({ ...newProject, area: val ?? "" })}
                >
                  <SelectTrigger className="h-8 text-sm font-bold">
                    <SelectValue placeholder="Área" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200">
                    <SelectItem value="Logística y Recursos">Logística y Recursos</SelectItem>
                    <SelectItem value="Ingeniería y Supervisión Técnica">Ingeniería y Supervisión Técnica</SelectItem>
                    <SelectItem value="Gestión Documentaria y Expedientes Técnicos">Gestión Documentaria</SelectItem>
                    <SelectItem value="Operaciones de Campo y Control de Obra">Operaciones de Campo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="responsablePrincipalId" className="text-xs font-bold text-primary">Responsable *</Label>
                <Select
                  value={newProject.responsablePrincipalId}
                  onValueChange={(val) => setNewProject({ ...newProject, responsablePrincipalId: val ?? "" })}
                >
                  <SelectTrigger className="h-8 text-sm font-bold">
                    <SelectValue placeholder="Responsable" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200">
                    {responsables.map((resp) => (
                      <SelectItem key={resp.id} value={resp.id}>{resp.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label htmlFor="estado" className="text-xs font-bold text-primary">Estado</Label>
                <Select
                  value={newProject.estado}
                  onValueChange={(val) => setNewProject({ ...newProject, estado: val ?? "" })}
                >
                  <SelectTrigger className="h-8 text-sm font-bold">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200">
                    <SelectItem value="Planificación">Planificación</SelectItem>
                    <SelectItem value="En Ejecución">En Ejecución</SelectItem>
                    <SelectItem value="Detenido">Detenido</SelectItem>
                    <SelectItem value="Finalizado">Finalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="prioridad" className="text-xs font-bold text-primary">Prioridad</Label>
                <Select
                  value={newProject.prioridad}
                  onValueChange={(val) => setNewProject({ ...newProject, prioridad: val ?? "" })}
                >
                  <SelectTrigger className="h-8 text-sm font-bold">
                    <SelectValue placeholder="Prioridad" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200">
                    <SelectItem value="Baja">Baja</SelectItem>
                    <SelectItem value="Media">Media</SelectItem>
                    <SelectItem value="Alta">Alta</SelectItem>
                    <SelectItem value="Crítica">Crítica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="fechaInicio" className="text-xs font-bold text-primary">Fecha Inicio</Label>
                <Input
                  id="fechaInicio"
                  type="date"
                  value={newProject.fechaInicio}
                  onChange={(e) => setNewProject({ ...newProject, fechaInicio: e.target.value })}
                  className="h-8 text-sm font-bold"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="fechaFinEstimada" className="text-xs font-bold text-primary">Fecha Fin Estimada *</Label>
                <Input
                  id="fechaFinEstimada"
                  type="date"
                  value={newProject.fechaFinEstimada}
                  onChange={(e) => setNewProject({ ...newProject, fechaFinEstimada: e.target.value })}
                  className="h-8 text-sm font-bold"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="clientId" className="text-xs font-bold text-primary">ID de Cliente *</Label>
              <Input
                id="clientId"
                value={newProject.clientId}
                onChange={(e) => setNewProject({ ...newProject, clientId: e.target.value })}
                placeholder="CLIENTE-001"
                className="h-8 text-sm font-bold"
              />
            </div>
          </div>
          <DialogFooter className="p-3 border-t flex gap-2">
            <Button variant="outline" onClick={() => setIsNewProjectModalOpen(false)} className="h-8 gap-1">
              <X className="w-3 h-3" /> Cancelar
            </Button>
            <Button onClick={handleSaveNewProject} className="h-8 gap-1 bg-primary hover:bg-primary/90">
              <Plus className="w-3 h-3" /> Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Proyecto */}
      <Dialog open={isEditProjectModalOpen} onOpenChange={setIsEditProjectModalOpen}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] p-0 border-none bg-white flex flex-col overflow-y-auto">
          <DialogHeader className="p-6 bg-secondary text-white rounded-t-lg shrink-0">
            <DialogTitle className="text-2xl font-medium tracking-tight flex items-center gap-3">
              <Pencil className="w-6 h-6 text-accent" />
              Editar Proyecto
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 space-y-3 overflow-y-auto flex-1">
            {editingProyecto && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-primary">Código</Label>
                    <Input value={editingProyecto.codigo || editingProyecto.id.substring(0,8)} disabled className="h-8 text-sm font-bold bg-muted" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-primary">Nombre</Label>
                    <Input
                      value={editingProyecto.nombre}
                      onChange={(e) => setEditingProyecto({ ...editingProyecto, nombre: e.target.value })}
                      className="h-8 text-sm font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-primary">Descripción</Label>
                  <Textarea
                    value={editingProyecto.descripcion || ""}
                    onChange={(e) => setEditingProyecto({ ...editingProyecto, descripcion: e.target.value })}
                    className="h-16 text-sm font-bold resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-primary">Área</Label>
                    <Select
                      value={editingProyecto.area}
                      onValueChange={(val) => setEditingProyecto({ ...editingProyecto, area: (val ?? "") as any })}
                    >
                      <SelectTrigger className="h-8 text-sm font-bold">
                        <SelectValue placeholder="Área" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200">
                        <SelectItem value="Logística y Recursos">Logística y Recursos</SelectItem>
                        <SelectItem value="Ingeniería y Supervisión Técnica">Ingeniería y Supervisión Técnica</SelectItem>
                        <SelectItem value="Gestión Documentaria y Expedientes Técnicos">Gestión Documentaria</SelectItem>
                        <SelectItem value="Operaciones de Campo y Control de Obra">Operaciones de Campo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-primary">Responsable</Label>
                    <Select
                      value={editingProyecto.responsablePrincipalId}
                      onValueChange={(val) => setEditingProyecto({ ...editingProyecto, responsablePrincipalId: val ?? "" })}
                    >
                      <SelectTrigger className="h-8 text-sm font-bold">
                        <SelectValue placeholder="Responsable" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200">
                        {responsables.map((resp) => (
                          <SelectItem key={resp.id} value={resp.id}>{resp.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-primary">Estado</Label>
                    <Select
                      value={editingProyecto.estado}
                      onValueChange={(val) => setEditingProyecto({ ...editingProyecto, estado: (val ?? "") as any })}
                    >
                      <SelectTrigger className="h-8 text-sm font-bold">
                        <SelectValue placeholder="Estado" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200">
                        <SelectItem value="Planificación">Planificación</SelectItem>
                        <SelectItem value="En Ejecución">En Ejecución</SelectItem>
                        <SelectItem value="Detenido">Detenido</SelectItem>
                        <SelectItem value="Finalizado">Finalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-primary">Prioridad</Label>
                    <Select
                      value={editingProyecto.prioridad}
                      onValueChange={(val) => setEditingProyecto({ ...editingProyecto, prioridad: (val ?? "") as any })}
                    >
                      <SelectTrigger className="h-8 text-sm font-bold">
                        <SelectValue placeholder="Prioridad" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200">
                        <SelectItem value="Baja">Baja</SelectItem>
                        <SelectItem value="Media">Media</SelectItem>
                        <SelectItem value="Alta">Alta</SelectItem>
                        <SelectItem value="Crítica">Crítica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-primary">Fecha Inicio</Label>
                    <Input
                      type="date"
                      value={editingProyecto.fechaInicio}
                      onChange={(e) => setEditingProyecto({ ...editingProyecto, fechaInicio: e.target.value })}
                      className="h-8 text-sm font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-primary">Fecha Fin Estimada</Label>
                    <Input
                      type="date"
                      value={editingProyecto.fechaFinEstimada}
                      onChange={(e) => setEditingProyecto({ ...editingProyecto, fechaFinEstimada: e.target.value })}
                      className="h-8 text-sm font-bold"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter className="p-4 border-t">
            <Button variant="outline" onClick={() => setIsEditProjectModalOpen(false)} className="gap-2">
              <X className="w-4 h-4" /> Cancelar
            </Button>
            <Button onClick={handleSaveEditProject} className="gap-2 bg-secondary hover:bg-secondary/90">
              <Pencil className="w-4 h-4" /> Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Eliminar Proyecto */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-error flex items-center gap-2 font-medium">
              <Trash2 className="w-5 h-5" />
              CONFIRMAR ELIMINACIÓN
            </DialogTitle>
            <DialogDescription className="py-4 font-bold text-slate-600">
              ¿Estás seguro de que deseas eliminar el proyecto <span className="font-medium text-primary">"{projectToDelete?.nombre}"</span>? 
              <br /><br />
              Esta acción es <span className="text-error underline">irreversible</span> y eliminará todas las actividades, reportes y datos asociados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} className="font-bold">
              CANCELAR
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete} 
              className="font-medium bg-error hover:bg-error/90 uppercase tracking-wider"
            >
              ELIMINAR PROYECTO
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
