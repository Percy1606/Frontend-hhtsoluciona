"use client";

import { useState, useEffect } from "react";
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
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Eye,
  MoreHorizontal,
  Users,
  Calendar,
  TrendingUp,
  Activity,
  Pencil,
  X
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// ============================================
// TIPOS
// ============================================

interface Responsable {
  id: string;
  nombre: string;
  area: string;
  color: string;
}

interface Proyecto {
  id: string;
  clientId: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  estado: string;
  semaforo: string;
  prioridad: string;
  fechaInicio: string;
  fechaFinEstimada: string;
  area: string;
  responsablePrincipal: string;
  responsablePrincipalData?: Responsable;
  responsablesData?: Responsable[];
  responsables?: string[];
  avance: number;
  avanceCalculado: number;
  actividades: any[];
}

// ============================================
// COMPONENTES AUXILIARES
// ============================================

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

const tipoColors: Record<string, string> = {
  "Técnica": "bg-purple-100 text-purple-700",
  "Administrativa": "bg-blue-100 text-blue-700",
  "Logística": "bg-yellow-100 text-yellow-700",
  "Documental": "bg-green-100 text-green-700",
  "Validación": "bg-red-100 text-red-700",
};

const semaforoColors: Record<string, string> = {
  "Verde": "bg-success",
  "Amarillo": "bg-warning",
  "Rojo": "bg-error",
};

const areaColors: Record<string, string> = {
  "Steven": "bg-blue-500",
  "Diego": "bg-purple-500",
  "Guillermo": "bg-green-500",
  "Mario": "bg-yellow-500",
};

// ============================================
// PÁGINA PRINCIPAL
// ============================================

export default function ProyectosPage() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [responsables, setResponsables] = useState<Responsable[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProyecto, setSelectedProyecto] = useState<Proyecto | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
  const [editingProyecto, setEditingProyecto] = useState<Proyecto | null>(null);
  const [isNewActivityModalOpen, setIsNewActivityModalOpen] = useState(false);

  const [newActivity, setNewActivity] = useState({
    descripcion: "",
    tipo: "Técnica",
    prioridad: "Media",
    estado: "Pendiente",
    fechaVencimiento: "",
    responsables: [] as string[],
  });

  const [newProject, setNewProject] = useState<Omit<Proyecto, 'id' | 'avanceCalculado' | 'actividades' | 'responsablesData' | 'responsablePrincipalData'>>({
    clientId: "1",
    codigo: "",
    nombre: "",
    descripcion: "",
    estado: "Planificación",
    semaforo: "Verde",
    prioridad: "Media",
    fechaInicio: new Date().toISOString().split('T')[0],
    fechaFinEstimada: "",
    area: "",
    responsablePrincipal: "",
    responsables: [],
    avance: 0,
  });

  // Filtros
  const [filtros, setFiltros] = useState({
    search: "",
    estado: "all",
    area: "all",
    prioridad: "all",
    semaforo: "all",
  });

  // Cargar datos
  useEffect(() => {
    fetchData();
  }, [filtros]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filtros.search) params.append("search", filtros.search);
      if (filtros.estado !== "all") params.append("estado", filtros.estado);
      if (filtros.area !== "all") params.append("area", filtros.area);
      if (filtros.prioridad !== "all") params.append("prioridad", filtros.prioridad);
      if (filtros.semaforo !== "all") params.append("semaforo", filtros.semaforo);

      const response = await fetch(`/api/operaciones?${params}`);
      const data = await response.json();

      setProyectos(data.proyectos || []);
      setResponsables(data.responsables || []);
    } catch (error) {
      console.error("Error fetching proyectos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetail = (proyecto: Proyecto) => {
    setSelectedProyecto(proyecto);
    setIsDetailOpen(true);
  };

  const handleEditProyecto = (proyecto: Proyecto) => {
    setEditingProyecto(proyecto);
    setIsEditProjectModalOpen(true);
  };

  const handleSaveNewProject = async () => {
    try {
      const projectData = {
        ...newProject,
        responsables: newProject.responsablePrincipal ? [newProject.responsablePrincipal] : [],
      };
      const response = await fetch('/api/operaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData),
      });

      if (response.ok) {
        setIsNewProjectModalOpen(false);
        setNewProject({
          clientId: "1",
          codigo: "",
          nombre: "",
          descripcion: "",
          estado: "Planificación",
          semaforo: "Verde",
          prioridad: "Media",
          fechaInicio: new Date().toISOString().split('T')[0],
          fechaFinEstimada: "",
          area: "",
          responsablePrincipal: "",
          responsables: [],
          avance: 0,
        });
        fetchData();
      }
    } catch (error) {
      console.error("Error creating proyecto:", error);
    }
  };

  const handleAddActivityToProyecto = () => {
    if (!editingProyecto) return;
    const newAct = {
      id: `act_${Date.now()}`,
      descripcion: newActivity.descripcion,
      tipo: newActivity.tipo,
      prioridad: newActivity.prioridad,
      estado: newActivity.estado,
      fechaCreacion: new Date().toISOString().split('T')[0],
      fechaVencimiento: newActivity.fechaVencimiento,
      responsables: newActivity.responsables,
      progreso: 0,
      orden: (editingProyecto.actividades?.length || 0) + 1,
      validacionesRequeridas: [],
      subtareas: [],
    };

    const updatedActividades = [...(editingProyecto.actividades || []), newAct];
    const avanceCalculado = Math.round(
      (updatedActividades.filter((a: any) => a.progreso === 100).length / updatedActividades.length) * 100
    );
    setEditingProyecto({
      ...editingProyecto,
      actividades: updatedActividades,
      avance: avanceCalculado,
      avanceCalculado,
    });

    setIsNewActivityModalOpen(false);
    setNewActivity({
      descripcion: "",
      tipo: "Técnica",
      prioridad: "Media",
      estado: "Pendiente",
      fechaVencimiento: "",
      responsables: [],
    });
  };

  const handleRemoveActivity = (actividadId: string) => {
    if (!editingProyecto) return;
    const updatedActividades = editingProyecto.actividades?.filter(a => a.id !== actividadId) || [];
    const avanceCalculado = updatedActividades.length > 0
      ? Math.round((updatedActividades.filter((a: any) => a.progreso === 100).length / updatedActividades.length) * 100)
      : 0;
    setEditingProyecto({
      ...editingProyecto,
      actividades: updatedActividades,
      avance: avanceCalculado,
      avanceCalculado,
    });
  };

  const handleSaveEditProject = async () => {
    if (!editingProyecto) return;
    try {
      const response = await fetch('/api/operaciones', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingProyecto),
      });

      if (response.ok) {
        setIsEditProjectModalOpen(false);
        setEditingProyecto(null);
        fetchData();
      }
    } catch (error) {
      console.error("Error updating proyecto:", error);
    }
  };

  // Calcular estadísticas
  const stats = {
    total: proyectos.length,
    activos: proyectos.filter(p => p.estado === "En Ejecución").length,
    planning: proyectos.filter(p => p.estado === "Planificación").length,
    finalizados: proyectos.filter(p => p.estado === "Finalizado").length,
    rojos: proyectos.filter(p => p.semaforo === "Rojo").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <FolderKanban className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-black text-primary tracking-tight">Proyectos</h1>
          </div>
          <p className="text-muted-foreground mt-1 font-medium">Gestión integral de proyectos por área.</p>
        </div>
        <Button 
          className="gap-2 font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
          onClick={() => setIsNewProjectModalOpen(true)}
        >
          <Plus className="w-4 h-4" /> Nuevo Proyecto
        </Button>
      </div>

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
          value={stats.planning}
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
      <div className="bg-white p-4 rounded-xl border border-border shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por código, nombre o cliente..."
              className="pl-10 h-10 border-border"
              value={filtros.search}
              onChange={(e) => setFiltros({ ...filtros, search: e.target.value })}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select
              value={filtros.estado}
              onValueChange={(val) => setFiltros({ ...filtros, estado: val })}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los Estados</SelectItem>
                <SelectItem value="Planificación">Planificación</SelectItem>
                <SelectItem value="En Ejecución">En Ejecución</SelectItem>
                <SelectItem value="Detenido">Detenido</SelectItem>
                <SelectItem value="Finalizado">Finalizado</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filtros.area}
              onValueChange={(val) => setFiltros({ ...filtros, area: val })}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Área" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las Áreas</SelectItem>
                <SelectItem value="Steven">Steven</SelectItem>
                <SelectItem value="Diego">Diego</SelectItem>
                <SelectItem value="Guillermo">Guillermo</SelectItem>
                <SelectItem value="Mario">Mario</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filtros.prioridad}
              onValueChange={(val) => setFiltros({ ...filtros, prioridad: val })}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las Prioridades</SelectItem>
                <SelectItem value="Baja">Baja</SelectItem>
                <SelectItem value="Media">Media</SelectItem>
                <SelectItem value="Alta">Alta</SelectItem>
                <SelectItem value="Crítica">Crítica</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filtros.semaforo}
              onValueChange={(val) => setFiltros({ ...filtros, semaforo: val })}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Semáforo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los Estados</SelectItem>
                <SelectItem value="Verde">Verde</SelectItem>
                <SelectItem value="Amarillo">Amarillo</SelectItem>
                <SelectItem value="Rojo">Rojo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Tabla de Proyectos */}
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
            ) : proyectos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No se encontraron proyectos
                </TableCell>
              </TableRow>
            ) : (
              proyectos.map((proyecto) => (
                <TableRow key={proyecto.id} className="hover:bg-muted/10 transition-colors group">
                  <TableCell className="font-black text-xs text-primary">
                    {proyecto.codigo}
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
                    <Badge className={cn("text-[10px] font-bold uppercase", areaColors[proyecto.area] || "bg-gray-100")}>
                      {proyecto.area}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: proyecto.responsablePrincipalData?.color || "#666" }}
                      >
                        {proyecto.responsablePrincipalData?.nombre?.charAt(0) || "?"}
                      </div>
                      <span className="text-sm font-bold text-slate-600">
                        {proyecto.responsablePrincipalData?.nombre || "Sin asignar"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-[10px] font-black">
                      <span className="text-muted-foreground uppercase">
                        Inicio: {proyecto.fechaInicio}
                      </span>
                      <span className="text-primary uppercase">
                        Fin: {proyecto.fechaFinEstimada}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="w-full max-w-[100px] space-y-1.5">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase">
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
                    <div className="flex items-center gap-2">
                      <Badge className={cn("border-none font-black text-[9px] uppercase tracking-wider", statusColors[proyecto.estado])}>
                        {proyecto.estado}
                      </Badge>
                      <Badge className={cn("border-none font-black text-[9px] uppercase tracking-wider", prioridadColors[proyecto.prioridad])}>
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
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal de Detalle */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] p-0 border-none bg-background flex flex-col overflow-hidden">
          <DialogHeader className="p-6 bg-primary text-white rounded-t-lg shrink-0">
            <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
              <Briefcase className="w-6 h-6 text-accent" />
              {selectedProyecto?.nombre}
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 overflow-y-auto">
            {selectedProyecto && (
              <div className="space-y-6">
                {/* Info Principal */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-muted/20 rounded-xl">
                    <p className="text-[10px] font-black text-muted-foreground uppercase">Código</p>
                    <p className="text-lg font-black text-primary">{selectedProyecto.codigo}</p>
                  </div>
                  <div className="p-4 bg-muted/20 rounded-xl">
                    <p className="text-[10px] font-black text-muted-foreground uppercase">Área</p>
                    <p className="text-lg font-black text-primary">{selectedProyecto.area}</p>
                  </div>
                  <div className="p-4 bg-muted/20 rounded-xl">
                    <p className="text-[10px] font-black text-muted-foreground uppercase">Estado</p>
                    <Badge className={cn("mt-1", statusColors[selectedProyecto.estado])}>
                      {selectedProyecto.estado}
                    </Badge>
                  </div>
                  <div className="p-4 bg-muted/20 rounded-xl">
                    <p className="text-[10px] font-black text-muted-foreground uppercase">Avance</p>
                    <p className="text-lg font-black text-primary">{selectedProyecto.avanceCalculado}%</p>
                  </div>
                </div>

                {/* Actividades Recientes */}
                <div>
                  <h3 className="font-black text-primary uppercase tracking-tight mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-success" />
                    Actividades ({selectedProyecto.actividades?.length || 0})
                  </h3>
                  <div className="space-y-2">
                    {selectedProyecto.actividades?.map((act: any) => (
                      <div key={act.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-5 h-5 rounded-full flex items-center justify-center border-2",
                            act.estado === "Completada" || act.estado === "Validada"
                              ? "bg-success border-success"
                              : act.estado === "En Progreso"
                                ? "bg-primary border-primary"
                                : "bg-white border-border"
                          )}>
                            {(act.estado === "Completada" || act.estado === "Validada") && (
                              <CheckCircle2 className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <div>
                            <p className={cn("text-sm font-bold", act.estado === "Completada" ? "line-through text-muted-foreground" : "text-primary")}>
                              {act.descripcion}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              Responsable: {act.responsables?.join(", ") || "Sin asignar"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={cn("text-[9px]", prioridadColors[act.prioridad])}>
                            {act.prioridad}
                          </Badge>
                          <span className="text-[10px] font-black text-muted-foreground">
                            {act.progreso}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Nuevo Proyecto */}
      <Dialog open={isNewProjectModalOpen} onOpenChange={setIsNewProjectModalOpen}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] p-0 border-none bg-background flex flex-col overflow-hidden">
          <DialogHeader className="p-6 bg-primary text-white rounded-t-lg shrink-0">
            <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
              <Plus className="w-6 h-6 text-accent" />
              Nuevo Proyecto
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 space-y-3 overflow-y-auto flex-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="codigo" className="text-xs font-bold text-primary">Código</Label>
                <Input
                  id="codigo"
                  value={newProject.codigo}
                  onChange={(e) => setNewProject({ ...newProject, codigo: e.target.value })}
                  placeholder="PROY-001"
                  className="h-8 text-sm font-bold"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="nombre" className="text-xs font-bold text-primary">Nombre</Label>
                <Input
                  id="nombre"
                  value={newProject.nombre}
                  onChange={(e) => setNewProject({ ...newProject, nombre: e.target.value })}
                  placeholder="Nombre del proyecto"
                  className="h-8 text-sm font-bold"
                />
              </div>
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
                <Label htmlFor="area" className="text-xs font-bold text-primary">Área</Label>
                <Select
                  value={newProject.area}
                  onValueChange={(val) => setNewProject({ ...newProject, area: val })}
                >
                  <SelectTrigger className="h-8 text-sm font-bold">
                    <SelectValue placeholder="Área" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Steven">Steven</SelectItem>
                    <SelectItem value="Diego">Diego</SelectItem>
                    <SelectItem value="Guillermo">Guillermo</SelectItem>
                    <SelectItem value="Mario">Mario</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="responsablePrincipal" className="text-xs font-bold text-primary">Responsable</Label>
                <Select
                  value={newProject.responsablePrincipal}
                  onValueChange={(val) => setNewProject({ ...newProject, responsablePrincipal: val })}
                >
                  <SelectTrigger className="h-8 text-sm font-bold">
                    <SelectValue placeholder="Responsable" />
                  </SelectTrigger>
                  <SelectContent>
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
                  onValueChange={(val) => setNewProject({ ...newProject, estado: val })}
                >
                  <SelectTrigger className="h-8 text-sm font-bold">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
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
                  onValueChange={(val) => setNewProject({ ...newProject, prioridad: val })}
                >
                  <SelectTrigger className="h-8 text-sm font-bold">
                    <SelectValue placeholder="Prioridad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Baja">Baja</SelectItem>
                    <SelectItem value="Media">Media</SelectItem>
                    <SelectItem value="Alta">Alta</SelectItem>
                    <SelectItem value="Crítica">Crítica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="semaforo" className="text-xs font-bold text-primary">Semáforo</Label>
                <Select
                  value={newProject.semaforo}
                  onValueChange={(val) => setNewProject({ ...newProject, semaforo: val })}
                >
                  <SelectTrigger className="h-8 text-sm font-bold">
                    <SelectValue placeholder="Semáforo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Verde">Verde</SelectItem>
                    <SelectItem value="Amarillo">Amarillo</SelectItem>
                    <SelectItem value="Rojo">Rojo</SelectItem>
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
                <Label htmlFor="fechaFinEstimada" className="text-xs font-bold text-primary">Fecha Fin</Label>
                <Input
                  id="fechaFinEstimada"
                  type="date"
                  value={newProject.fechaFinEstimada}
                  onChange={(e) => setNewProject({ ...newProject, fechaFinEstimada: e.target.value })}
                  className="h-8 text-sm font-bold"
                />
              </div>
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

      {/* Modal de Editar Proyecto */}
      <Dialog open={isEditProjectModalOpen} onOpenChange={setIsEditProjectModalOpen}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] p-0 border-none bg-background flex flex-col overflow-hidden">
          <DialogHeader className="p-6 bg-secondary text-white rounded-t-lg shrink-0">
            <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
              <Pencil className="w-6 h-6 text-accent" />
              Editar Proyecto
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 space-y-3 overflow-y-auto flex-1">
            {editingProyecto && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="edit-codigo" className="text-xs font-bold text-primary">Código</Label>
                    <Input
                      id="edit-codigo"
                      value={editingProyecto.codigo}
                      onChange={(e) => setEditingProyecto({ ...editingProyecto, codigo: e.target.value })}
                      className="h-8 text-sm font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-nombre" className="text-xs font-bold text-primary">Nombre</Label>
                    <Input
                      id="edit-nombre"
                      value={editingProyecto.nombre}
                      onChange={(e) => setEditingProyecto({ ...editingProyecto, nombre: e.target.value })}
                      className="h-8 text-sm font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="edit-descripcion" className="text-xs font-bold text-primary">Descripción</Label>
                  <Textarea
                    id="edit-descripcion"
                    value={editingProyecto.descripcion || ""}
                    onChange={(e) => setEditingProyecto({ ...editingProyecto, descripcion: e.target.value })}
                    className="h-16 text-sm font-bold resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="edit-area" className="text-xs font-bold text-primary">Área</Label>
                    <Select
                      value={editingProyecto.area}
                      onValueChange={(val) => setEditingProyecto({ ...editingProyecto, area: val })}
                    >
                      <SelectTrigger className="h-8 text-sm font-bold">
                        <SelectValue placeholder="Área" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Steven">Steven</SelectItem>
                        <SelectItem value="Diego">Diego</SelectItem>
                        <SelectItem value="Guillermo">Guillermo</SelectItem>
                        <SelectItem value="Mario">Mario</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-responsable" className="text-xs font-bold text-primary">Responsable</Label>
                    <Select
                      value={editingProyecto.responsablePrincipal}
                      onValueChange={(val) => setEditingProyecto({ ...editingProyecto, responsablePrincipal: val })}
                    >
                      <SelectTrigger className="h-8 text-sm font-bold">
                        <SelectValue placeholder="Responsable" />
                      </SelectTrigger>
                      <SelectContent>
                        {responsables.map((resp) => (
                          <SelectItem key={resp.id} value={resp.id}>{resp.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="edit-estado" className="text-xs font-bold text-primary">Estado</Label>
                    <Select
                      value={editingProyecto.estado}
                      onValueChange={(val) => setEditingProyecto({ ...editingProyecto, estado: val })}
                    >
                      <SelectTrigger className="h-8 text-sm font-bold">
                        <SelectValue placeholder="Estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Planificación">Planificación</SelectItem>
                        <SelectItem value="En Ejecución">En Ejecución</SelectItem>
                        <SelectItem value="Detenido">Detenido</SelectItem>
                        <SelectItem value="Finalizado">Finalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-prioridad" className="text-xs font-bold text-primary">Prioridad</Label>
                    <Select
                      value={editingProyecto.prioridad}
                      onValueChange={(val) => setEditingProyecto({ ...editingProyecto, prioridad: val })}
                    >
                      <SelectTrigger className="h-8 text-sm font-bold">
                        <SelectValue placeholder="Prioridad" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Baja">Baja</SelectItem>
                        <SelectItem value="Media">Media</SelectItem>
                        <SelectItem value="Alta">Alta</SelectItem>
                        <SelectItem value="Crítica">Crítica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-semaforo" className="text-xs font-bold text-primary">Semáforo</Label>
                    <Select
                      value={editingProyecto.semaforo}
                      onValueChange={(val) => setEditingProyecto({ ...editingProyecto, semaforo: val })}
                    >
                      <SelectTrigger className="h-8 text-sm font-bold">
                        <SelectValue placeholder="Semáforo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Verde">Verde</SelectItem>
                        <SelectItem value="Amarillo">Amarillo</SelectItem>
                        <SelectItem value="Rojo">Rojo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="edit-fechaInicio" className="text-xs font-bold text-primary">Fecha Inicio</Label>
                    <Input
                      id="edit-fechaInicio"
                      type="date"
                      value={editingProyecto.fechaInicio}
                      onChange={(e) => setEditingProyecto({ ...editingProyecto, fechaInicio: e.target.value })}
                      className="h-8 text-sm font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-fechaFin" className="text-xs font-bold text-primary">Fecha Fin</Label>
                    <Input
                      id="edit-fechaFin"
                      type="date"
                      value={editingProyecto.fechaFinEstimada}
                      onChange={(e) => setEditingProyecto({ ...editingProyecto, fechaFinEstimada: e.target.value })}
                      className="h-8 text-sm font-bold"
                    />
                  </div>
                </div>

                {/* Sección de Actividades */}
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-black text-primary uppercase tracking-tight flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      Actividades ({editingProyecto.actividades?.length || 0})
                    </h3>
                    <Button
                      size="sm"
                      onClick={() => setIsNewActivityModalOpen(true)}
                      className="gap-1 bg-primary hover:bg-primary/90"
                    >
                      <Plus className="w-3 h-3" /> Agregar
                    </Button>
                  </div>

                  <div className="space-y-2 max-h-[250px] overflow-y-auto">
                    {editingProyecto.actividades?.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No hay actividades agendadas. Agrega una para comenzar.
                      </p>
                    ) : (
                      editingProyecto.actividades?.map((act: any) => {
                        const isCompleted = act.progreso === 100;
                        return (
                          <div key={act.id} className={cn("p-3 rounded-lg border", isCompleted ? "bg-success/10 border-success/30" : "bg-muted/20 border-transparent")}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className={cn(
                                  "w-5 h-5 rounded-full flex items-center justify-center border-2",
                                  isCompleted
                                    ? "bg-success border-success"
                                    : act.estado === "En Progreso"
                                      ? "bg-primary border-primary"
                                      : "bg-white border-border"
                                )}>
                                  {isCompleted && (
                                    <CheckCircle2 className="w-3 h-3 text-white" />
                                  )}
                                </div>
                                <p className={cn("text-sm font-bold", isCompleted ? "line-through text-success" : "text-primary")}>
                                  {act.descripcion}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-muted-foreground hover:text-error hover:bg-error/10"
                                onClick={() => handleRemoveActivity(act.id)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={cn("text-[9px]", tipoColors[act.tipo])}>
                                {act.tipo}
                              </Badge>
                              <Badge className={cn("text-[9px]", prioridadColors[act.prioridad])}>
                                {act.prioridad}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={cn("h-full transition-all duration-300", isCompleted ? "bg-success" : "bg-primary")}
                                  style={{ width: `${act.progreso}%` }}
                                />
                              </div>
                              <div className="flex items-center gap-1 w-[80px]">
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={act.progreso}
                                  onChange={(e) => {
                                    const newProgreso = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                                    const updatedActividades = editingProyecto.actividades?.map((a: any) =>
                                      a.id === act.id ? { ...a, progreso: newProgreso } : a
                                    );
                                    const avanceCalculado = Math.round(
                                      (updatedActividades?.filter((a: any) => a.progreso === 100).length || 0) /
                                      (updatedActividades?.length || 1) * 100
                                    );
                                    setEditingProyecto({
                                      ...editingProyecto,
                                      actividades: updatedActividades,
                                      avance: avanceCalculado,
                                      avanceCalculado,
                                    });
                                  }}
                                  className="h-6 w-12 text-xs text-center font-bold"
                                />
                                <span className="text-xs font-black text-muted-foreground">%</span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Avance Calculado */}
                  {editingProyecto.actividades && editingProyecto.actividades.length > 0 && (
                    <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-black text-primary uppercase">Avance Automático</span>
                        <span className="text-lg font-black text-primary">{editingProyecto.avanceCalculado}%</span>
                      </div>
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full transition-all duration-500",
                            editingProyecto.avanceCalculado === 100 ? "bg-success" : "bg-primary"
                          )}
                          style={{ width: `${editingProyecto.avanceCalculado}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {editingProyecto.actividades.filter((a: any) => a.progreso === 100).length} de {editingProyecto.actividades.length} actividades completadas
                      </p>
                    </div>
                  )}
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

      {/* Modal de Nueva Actividad */}
      <Dialog open={isNewActivityModalOpen} onOpenChange={setIsNewActivityModalOpen}>
        <DialogContent className="max-w-lg w-[95vw] p-0 border-none bg-background flex flex-col overflow-hidden">
          <DialogHeader className="p-6 bg-primary text-white rounded-t-lg shrink-0">
            <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-3">
              <Plus className="w-5 h-5 text-accent" />
              Nueva Actividad
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4 overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="act-descripcion" className="font-bold text-primary">Descripción *</Label>
              <Textarea
                id="act-descripcion"
                value={newActivity.descripcion}
                onChange={(e) => setNewActivity({ ...newActivity, descripcion: e.target.value })}
                placeholder="Describe la actividad a realizar"
                className="font-bold"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="act-tipo" className="font-bold text-primary">Tipo</Label>
                <Select
                  value={newActivity.tipo}
                  onValueChange={(val) => setNewActivity({ ...newActivity, tipo: val })}
                >
                  <SelectTrigger className="font-bold">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Técnica">Técnica</SelectItem>
                    <SelectItem value="Administrativa">Administrativa</SelectItem>
                    <SelectItem value="Logística">Logística</SelectItem>
                    <SelectItem value="Documental">Documental</SelectItem>
                    <SelectItem value="Validación">Validación</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="act-prioridad" className="font-bold text-primary">Prioridad</Label>
                <Select
                  value={newActivity.prioridad}
                  onValueChange={(val) => setNewActivity({ ...newActivity, prioridad: val })}
                >
                  <SelectTrigger className="font-bold">
                    <SelectValue placeholder="Prioridad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Baja">Baja</SelectItem>
                    <SelectItem value="Media">Media</SelectItem>
                    <SelectItem value="Alta">Alta</SelectItem>
                    <SelectItem value="Crítica">Crítica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="act-estado" className="font-bold text-primary">Estado</Label>
                <Select
                  value={newActivity.estado}
                  onValueChange={(val) => setNewActivity({ ...newActivity, estado: val })}
                >
                  <SelectTrigger className="font-bold">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pendiente">Pendiente</SelectItem>
                    <SelectItem value="En Progreso">En Progreso</SelectItem>
                    <SelectItem value="Completada">Completada</SelectItem>
                    <SelectItem value="Validada">Validada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="act-fecha" className="font-bold text-primary">Fecha Vencimiento</Label>
                <Input
                  id="act-fecha"
                  type="date"
                  value={newActivity.fechaVencimiento}
                  onChange={(e) => setNewActivity({ ...newActivity, fechaVencimiento: e.target.value })}
                  className="font-bold"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="p-4 border-t">
            <Button variant="outline" onClick={() => setIsNewActivityModalOpen(false)} className="gap-2">
              <X className="w-4 h-4" /> Cancelar
            </Button>
            <Button onClick={handleAddActivityToProyecto} className="gap-2 bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4" /> Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================
// COMPONENTES AUXILIARES
// ============================================

function StatsCard({
  label,
  value,
  icon,
  color,
  bgColor,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="bg-white p-4 rounded-xl border border-border shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg", bgColor)}>
          <div className={cn("w-5 h-5", color)}>{icon}</div>
        </div>
        <div>
          <p className="text-[10px] font-black text-muted-foreground uppercase">{label}</p>
          <p className={cn("text-2xl font-black", color)}>{value}</p>
        </div>
      </div>
    </div>
  );
}

// Icon needed
function FolderKanban({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
      />
    </svg>
  );
}