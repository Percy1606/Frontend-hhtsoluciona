"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useOperacionesStore, Proyecto, Area, EstadoProyecto, Prioridad, Semaforo, Responsable } from "@/store/operaciones-store";
import { PROJECTS_DATA, CRM_DATA } from "@/mocks/data"; // CRM_DATA will be kept for now
import { Button } from "@/components/ui/button";
import {
  Plus,
  Search,
  Briefcase,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Camera,
  FilterX
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DailyReportForm } from "@/components/operaciones/daily-report-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const statusColors: Record<string, string> = {
  "Planificación": "bg-blue-100 text-blue-700",
  "En Ejecución": "bg-orange-100 text-orange-700",
  "Detenido": "bg-red-100 text-red-700",
  "Finalizado": "bg-green-100 text-green-700",
};

export default function OperacionesPage() {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Proyecto | null>(null);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editedProject, setEditedProject] = useState<Proyecto | null>(null);
  const [newProject, setNewProject] = useState<Omit<Proyecto, 'id' | 'codigo' | 'avanceCalculado' | 'historialCambios' | 'actividades' | 'reportesDiarios' | 'comentarios' | 'evidencias' | 'documentos' | 'validacionTecnica' | 'validacionCampo' | 'avance' | 'costoPresupuestado' | 'costoReal'>>({
    clientId: CRM_DATA[0].id, // Default to first client for now
    nombre: '',
    descripcion: '',
    estado: EstadoProyecto.Planificación,
    prioridad: Prioridad.Media,
    fechaInicio: new Date().toISOString().split('T')[0],
    fechaFinEstimada: new Date().toISOString().split('T')[0],
    responsablePrincipal: responsables[0].nombre, // Default to first responsible
    area: Area.Steven,
  });

  const { proyectos, responsables, filtros, setSearchQuery, setEstado, setArea, setPrioridad, setSemaforo, setResponsable, setFechas, resetFiltros, addProyecto, updateProyecto } = useOperacionesStore();

  useEffect(() => {
    if (isEditModalOpen && selectedProject) {
      setEditedProject(selectedProject);
    }
  }, [isEditModalOpen, selectedProject]);

  const handleOpenReport = (project: Proyecto) => {
    setSelectedProject(project);
    setIsReportModalOpen(true);
  };

  const handleSubmitReport = (data: any) => {
    console.log("Reporte enviado:", data);
    setIsReportModalOpen(false);
  };

  const handleSubmitNewProject = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting new project:", newProject);
    addProyecto(newProject);
    setIsNewProjectModalOpen(false);
    setNewProject({
      clientId: CRM_DATA[0].id,
      nombre: '',
      descripcion: '',
      estado: EstadoProyecto.Planificación,
      prioridad: Prioridad.Media,
      fechaInicio: new Date().toISOString().split('T')[0],
      fechaFinEstimada: new Date().toISOString().split('T')[0],
      responsablePrincipal: responsables[0].nombre,
      area: Area.Steven,
    });
  };

  const handleEditProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (editedProject) {
      updateProyecto(editedProject.id, editedProject);
      setIsEditModalOpen(false);
      setSelectedProject(null);
      setEditedProject(null);
    }
  };

  const filteredProjects = proyectos.filter(project => {
    const matchesSearchQuery = project.codigo.toLowerCase().includes(filtros.searchQuery.toLowerCase()) ||
                                project.nombre.toLowerCase().includes(filtros.searchQuery.toLowerCase()); // Assuming client.empresa is not directly in project object

    const matchesEstado = filtros.estado === 'all' || project.estado === filtros.estado;
    const matchesArea = filtros.area === 'all' || project.area === filtros.area;
    const matchesPrioridad = filtros.prioridad === 'all' || project.prioridad === filtros.prioridad;
    const matchesSemaforo = filtros.semaforo === 'all' || project.semaforo === filtros.semaforo;
    const matchesResponsable = filtros.responsable === 'all' || project.responsablePrincipal === filtros.responsable; // Assuming responsablePrincipal stores the name

    const projectStartDate = new Date(project.fechaInicio);
    const projectEndDate = new Date(project.fechaFinEstimada);
    const filterStartDate = filtros.fechaInicio ? new Date(filtros.fechaInicio) : null;
    const filterEndDate = filtros.fechaFin ? new Date(filtros.fechaFin) : null;

    const matchesDates = (!filterStartDate || projectStartDate >= filterStartDate) &&
                         (!filterEndDate || projectEndDate <= filterEndDate);

    return matchesSearchQuery && matchesEstado && matchesArea && matchesPrioridad && matchesSemaforo && matchesResponsable && matchesDates;
  });

  const activeProjects = filteredProjects.filter(p => p.estado === 'En Ejecución' || p.estado === 'Planificación').length;
  const planningProjects = filteredProjects.filter(p => p.estado === 'Planificación').length;
  const delayedProjects = filteredProjects.filter(p => p.semaforo === 'Rojo' || p.estado === 'Detenido').length;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const finishedThisMonth = filteredProjects.filter(p => {
    if (p.estado === 'Finalizado' && p.fechaFinReal) {
      const finishDate = new Date(p.fechaFinReal);
      return finishDate.getMonth() === currentMonth && finishDate.getFullYear() === currentYear;
    }
    return false;
  }).length;

  // Recent Activities
  const allActivities = proyectos.flatMap(p => p.actividades || []);
  const recentActivities = allActivities
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    .slice(0, 5); // Display last 5 activities

  // Critical Alerts
  const criticalAlerts = useOperacionesStore().generarAlertas(proyectos);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Briefcase className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-black text-primary tracking-tight">Panel de Operaciones</h1>
          </div>
          <p className="text-muted-foreground mt-1 font-medium">Control de ejecución de proyectos e ingeniería.</p>
        </div>
        <Button 
          className="gap-2 font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
          onClick={() => setIsNewProjectModalOpen(true)}
        >
          <Plus className="w-4 h-4" /> Nuevo Proyecto
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard label="Activos" value={activeProjects.toString()} color="text-primary" />
        <StatsCard label="En Planificación" value={planningProjects.toString()} color="text-blue-600" />
        <StatsCard label="Retrasados" value={delayedProjects.toString()} color="text-error" />
        <StatsCard label="Finalizados (Mes)" value={finishedThisMonth.toString()} color="text-success" />
      </div>

      <div className="bg-white p-4 rounded-xl border border-border shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full md:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por ID de proyecto o empresa..." 
            className="pl-10 h-10 border-border bg-muted/30" 
            value={filtros.searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <Select value={filtros.estado} onValueChange={(value: EstadoProyecto | 'all') => setEstado(value)}>
            <SelectTrigger className="w-[180px] h-10 border-border bg-muted/30">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los Estados</SelectItem>
              {Object.values(EstadoProyecto).map(estado => (
                <SelectItem key={estado} value={estado}>{estado}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filtros.area} onValueChange={(value: Area | 'all') => setArea(value)}>
            <SelectTrigger className="w-[180px] h-10 border-border bg-muted/30">
              <SelectValue placeholder="Área" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las Áreas</SelectItem>
              {Object.values(Area).map(area => (
                <SelectItem key={area} value={area}>{area}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filtros.prioridad} onValueChange={(value: Prioridad | 'all') => setPrioridad(value)}>
            <SelectTrigger className="w-[180px] h-10 border-border bg-muted/30">
              <SelectValue placeholder="Prioridad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las Prioridades</SelectItem>
              {Object.values(Prioridad).map(prio => (
                <SelectItem key={prio} value={prio}>{prio}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filtros.semaforo} onValueChange={(value: Semaforo | 'all') => setSemaforo(value)}>
            <SelectTrigger className="w-[180px] h-10 border-border bg-muted/30">
              <SelectValue placeholder="Semáforo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los Semáforos</SelectItem>
              {Object.values(Semaforo).map(sem => (
                <SelectItem key={sem} value={sem}>{sem}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filtros.responsable} onValueChange={(value: string | 'all') => setResponsable(value)}>
            <SelectTrigger className="w-[180px] h-10 border-border bg-muted/30">
              <SelectValue placeholder="Responsable" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los Responsables</SelectItem>
              {responsables.map(resp => (
                <SelectItem key={resp.id} value={resp.nombre}>{resp.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="date"
            className="w-[180px] h-10 border-border bg-muted/30 text-muted-foreground"
            value={filtros.fechaInicio || ''}
            onChange={(e) => setFechas(e.target.value, filtros.fechaFin)}
            placeholder="Fecha Inicio"
          />
          <Input
            type="date"
            className="w-[180px] h-10 border-border bg-muted/30 text-muted-foreground"
            value={filtros.fechaFin || ''}
            onChange={(e) => setFechas(filtros.fechaInicio, e.target.value)}
            placeholder="Fecha Fin"
          />

          <Button 
            variant="ghost" 
            size="icon" 
            onClick={resetFiltros} 
            className="h-10 w-10 text-muted-foreground hover:bg-muted/50"
            title="Resetear Filtros"
          >
            <FilterX className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-bold text-primary">ID PROYECTO</TableHead>
              <TableHead className="font-bold text-primary">CLIENTE / OBRA</TableHead>
              <TableHead className="font-bold text-primary">RESPONSABLE</TableHead>
              <TableHead className="font-bold text-primary">FECHAS</TableHead>
              <TableHead className="font-bold text-primary">AVANCE</TableHead>
              <TableHead className="font-bold text-primary">ESTADO</TableHead>
              <TableHead className="font-bold text-primary text-right">ACCIONES</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {proyectos.map((project: Proyecto) => {
              const client = CRM_DATA.find(c => c.id === project.clientId);
              return (
                <TableRow key={project.id} className="hover:bg-muted/10 transition-colors group">
                  <TableCell className="font-black text-xs text-primary">{project.id}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-bold text-sm text-primary group-hover:text-secondary transition-colors">{client?.empresa}</p>
                      <p className="text-[10px] text-muted-foreground truncate max-w-[200px] font-medium">{project.nombre}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-bold text-slate-600">{project.responsablePrincipal}</TableCell>
                  <TableCell>
                    <div className="flex flex-col text-[10px] font-black">
                      <span className="text-muted-foreground uppercase">INICIO: {project.fechaInicio}</span>
                      <span className="text-primary uppercase">FIN: {project.fechaFinEstimada}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="w-full max-w-[100px] space-y-1.5">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase">
                        <span>{project.avance}%</span>
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          project.semaforo === "Verde" ? "bg-success" : project.semaforo === "Amarillo" ? "bg-warning" : "bg-error"
                        )} />
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full transition-all duration-500",
                            project.avance === 100 ? "bg-success" : "bg-primary"
                          )}
                          style={{ width: `${project.avance}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("border-none font-black text-[9px] uppercase tracking-wider", statusColors[project.estado])}>
                      {project.estado}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-primary hover:bg-primary/10"
                        onClick={() => {
                          setSelectedProject(project);
                          setIsDetailsModalOpen(true);
                        }}
                        title="Ver Detalles"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-blue-500 hover:bg-blue-500/10"
                        onClick={() => {
                          setSelectedProject(project);
                          setIsEditModalOpen(true);
                        }}
                        title="Editar Proyecto"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 font-bold text-[10px] uppercase gap-1 border-primary text-primary hover:bg-primary hover:text-white"
                        onClick={() => handleOpenReport(project)}
                      >
                        <FileText className="w-3 h-3" /> Reportar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-border shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-black text-primary uppercase tracking-tight flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-success" />
              Actividades Recientes
            </h3>
            <Badge variant="outline" className="text-[10px] font-bold uppercase">Últimas 24h</Badge>
          </div>
          <div className="space-y-4">
            {recentActivities.map((act) => (
              <div key={act.id} className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border border-border/50 hover:border-primary/20 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-6 h-6 rounded-lg flex items-center justify-center border-2",
                    act.completada ? "bg-success border-success text-white shadow-lg shadow-green-100" : "bg-white border-border"
                  )}>
                    {act.completada && <CheckCircle2 className="w-4 h-4" />}
                  </div>
                  <div>
                    <span className={cn("text-sm font-bold block", act.completada ? "text-muted-foreground line-through" : "text-primary")}>
                      {act.descripcion}
                    </span>
                    <span className="text-[10px] font-black text-muted-foreground uppercase">{act.fecha}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-border shadow-sm">
          <h3 className="font-black text-primary uppercase tracking-tight mb-6 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-accent" />
            Alertas Críticas de Campo
          </h3>
          <div className="space-y-4">
            {criticalAlerts.map((alert, index) => (
              <AlertItem 
                key={index}
                type={alert.tipo === 'Critico' ? 'error' : 'warning'} 
                project={alert.proyectoId} 
                message={alert.mensaje}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Modal: Reporte Diario */}
      <Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] p-0 border-none bg-background">
          <DialogHeader className="p-6 bg-primary text-white rounded-t-lg">
            <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
              <Camera className="w-6 h-6 text-accent" />
              Reporte Diario: {selectedProject?.nombre}
            </DialogTitle>
          </DialogHeader>
          <div className="p-6">
            <DailyReportForm 
              onSubmit={handleSubmitReport} 
              onCancel={() => setIsReportModalOpen(false)} 
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Nuevo Proyecto */}
      <Dialog open={isNewProjectModalOpen} onOpenChange={setIsNewProjectModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] p-0 border-none bg-background">
          <DialogHeader className="p-6 bg-primary text-white rounded-t-lg">
            <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
              <Plus className="w-6 h-6 text-accent" />
              Nuevo Proyecto
            </DialogTitle>
          </DialogHeader>
          <div className="p-6">
            <form onSubmit={handleSubmitNewProject} className="space-y-4">
              <Input
                placeholder="Nombre del Proyecto"
                value={newProject.nombre}
                onChange={(e) => setNewProject({ ...newProject, nombre: e.target.value })}
                required
              />
              <Input
                placeholder="Descripción"
                value={newProject.descripcion || ''}
                onChange={(e) => setNewProject({ ...newProject, descripcion: e.target.value })}
              />
              <Select value={newProject.estado} onValueChange={(value: EstadoProyecto) => setNewProject({ ...newProject, estado: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado Inicial" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(EstadoProyecto).map(estado => (
                    <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={newProject.prioridad} onValueChange={(value: Prioridad) => setNewProject({ ...newProject, prioridad: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Prioridad" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(Prioridad).map(prio => (
                    <SelectItem key={prio} value={prio}>{prio}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="date"
                placeholder="Fecha de Inicio"
                value={newProject.fechaInicio}
                onChange={(e) => setNewProject({ ...newProject, fechaInicio: e.target.value })}
                required
              />
              <Input
                type="date"
                placeholder="Fecha Fin Estimada"
                value={newProject.fechaFinEstimada}
                onChange={(e) => setNewProject({ ...newProject, fechaFinEstimada: e.target.value })}
                required
              />
              <Select value={newProject.responsablePrincipal} onValueChange={(value: string) => setNewProject({ ...newProject, responsablePrincipal: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Responsable Principal" />
                </SelectTrigger>
                <SelectContent>
                  {responsables.map(resp => (
                    <SelectItem key={resp.id} value={resp.nombre}>{resp.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={newProject.area} onValueChange={(value: Area) => setNewProject({ ...newProject, area: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Área" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(Area).map(area => (
                    <SelectItem key={area} value={area}>{area}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Assuming clientId is selected from a separate CRM_DATA for now */}
              <Input
                placeholder="ID de Cliente (ej: CRM_DATA[0].id)"
                value={newProject.clientId}
                onChange={(e) => setNewProject({ ...newProject, clientId: e.target.value })}
                required
              />

              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setIsNewProjectModalOpen(false)}>Cancelar</Button>
                <Button type="submit">Crear Proyecto</Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Detalles del Proyecto */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] p-0 border-none bg-background">
          <DialogHeader className="p-6 bg-primary text-white rounded-t-lg">
            <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
              <Eye className="w-6 h-6 text-accent" />
              Detalles del Proyecto: {selectedProject?.nombre}
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4">
            {selectedProject && (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">ID Proyecto</p>
                  <p className="font-bold text-primary">{selectedProject.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="font-bold text-primary">{CRM_DATA.find(c => c.id === selectedProject.clientId)?.empresa}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Descripción</p>
                  <p className="font-bold text-primary">{selectedProject.descripcion}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estado</p>
                  <Badge className={cn("border-none font-black text-[9px] uppercase tracking-wider", statusColors[selectedProject.estado])}>
                    {selectedProject.estado}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Prioridad</p>
                  <p className="font-bold text-primary">{selectedProject.prioridad}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fechas</p>
                  <p className="font-bold text-primary">Inicio: {selectedProject.fechaInicio} / Fin Estimada: {selectedProject.fechaFinEstimada}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Responsable Principal</p>
                  <p className="font-bold text-primary">{selectedProject.responsablePrincipal}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Área</p>
                  <p className="font-bold text-primary">{selectedProject.area}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avance</p>
                  <p className="font-bold text-primary">{selectedProject.avance}%</p>
                </div>
              </>
            )}
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={() => setIsDetailsModalOpen(false)}>Cerrar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Editar Proyecto */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] p-0 border-none bg-background">
          <DialogHeader className="p-6 bg-primary text-white rounded-t-lg">
            <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
              <Pencil className="w-6 h-6 text-accent" />
              Editar Proyecto: {selectedProject?.nombre}
            </DialogTitle>
          </DialogHeader>
          <div className="p-6">
            {selectedProject && (
              <form onSubmit={handleEditProject} className="space-y-4">
                <div>
                  <label htmlFor="edit-project-name" className="text-sm font-medium text-muted-foreground">Nombre del Proyecto</label>
                  <Input
                    id="edit-project-name"
                    placeholder="Nombre del Proyecto"
                    value={editedProject.nombre}
                    onChange={(e) => setEditedProject({ ...editedProject, nombre: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="edit-project-description" className="text-sm font-medium text-muted-foreground">Descripción</label>
                  <Input
                    id="edit-project-description"
                    placeholder="Descripción"
                    value={editedProject.descripcion || ''}
                    onChange={(e) => setEditedProject({ ...editedProject, descripcion: e.target.value })}
                  />
                </div>
                <Select value={editedProject.estado} onValueChange={(value: EstadoProyecto) => setEditedProject({ ...editedProject, estado: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(EstadoProyecto).map(estado => (
                      <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={editedProject.prioridad} onValueChange={(value: Prioridad) => setEditedProject({ ...editedProject, prioridad: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Prioridad" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(Prioridad).map(prio => (
                      <SelectItem key={prio} value={prio}>{prio}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div>
                  <label htmlFor="edit-project-start-date" className="text-sm font-medium text-muted-foreground">Fecha de Inicio</label>
                  <Input
                    id="edit-project-start-date"
                    type="date"
                    placeholder="Fecha de Inicio"
                    value={editedProject.fechaInicio}
                    onChange={(e) => setEditedProject({ ...editedProject, fechaInicio: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="edit-project-estimated-end-date" className="text-sm font-medium text-muted-foreground">Fecha Fin Estimada</label>
                  <Input
                    id="edit-project-estimated-end-date"
                    type="date"
                    placeholder="Fecha Fin Estimada"
                    value={editedProject.fechaFinEstimada}
                    onChange={(e) => setEditedProject({ ...editedProject, fechaFinEstimada: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="edit-project-real-end-date" className="text-sm font-medium text-muted-foreground">Fecha Fin Real</label>
                  <Input
                    id="edit-project-real-end-date"
                    type="date"
                    placeholder="Fecha Fin Real"
                    value={editedProject.fechaFinReal || ''}
                    onChange={(e) => setEditedProject({ ...editedProject, fechaFinReal: e.target.value })}
                  />
                </div>
                <Select value={editedProject.responsablePrincipal} onValueChange={(value: string) => setEditedProject({ ...editedProject, responsablePrincipal: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Responsable Principal" />
                  </SelectTrigger>
                  <SelectContent>
                    {responsables.map(resp => (
                      <SelectItem key={resp.id} value={resp.nombre}>{resp.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={editedProject.area} onValueChange={(value: Area) => setEditedProject({ ...editedProject, area: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Área" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(Area).map(area => (
                      <SelectItem key={area} value={area}>{area}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div>
                  <label htmlFor="edit-project-progress" className="text-sm font-medium text-muted-foreground">Avance (%)</label>
                  <Input
                    id="edit-project-progress"
                    type="number"
                    value={editedProject.avance}
                    onChange={(e) => setEditedProject({ ...editedProject, avance: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <Select value={editedProject.semaforo} onValueChange={(value: Semaforo) => setEditedProject({ ...editedProject, semaforo: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Semáforo" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(Semaforo).map(sem => (
                      <SelectItem key={sem} value={sem}>{sem}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancelar</Button>
                  <Button type="submit">Guardar Cambios</Button>
                </div>
              </form>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatsCard({ label, value, color }: { label: string, value: string, color: string }) {
  return (
    <div className="bg-white p-5 rounded-xl border border-border shadow-sm transition-all hover:shadow-md">
      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
      <p className={cn("text-3xl font-black", color)}>{value}</p>
    </div>
  );
}

function AlertItem({ type, project, message }: { type: 'error' | 'warning', project: string, message: string }) {
  return (
    <div className={cn(
      "p-4 border-l-4 rounded-r-xl shadow-sm",
      type === 'error' ? "bg-red-50 border-error" : "bg-yellow-50 border-warning"
    )}>
      <p className={cn(
        "text-[10px] font-black uppercase mb-1",
        type === 'error' ? "text-error" : "text-yellow-700"
      )}>{type === 'error' ? 'Crítico' : 'Pendiente'} — {project}</p>
      <p className="text-sm font-bold text-slate-700 leading-snug">{message}</p>
    </div>
  );
}
    </div>
  );
}

function StatsCard({ label, value, color }: { label: string, value: string, color: string }) {
  return (
    <div className="bg-white p-5 rounded-xl border border-border shadow-sm transition-all hover:shadow-md">
      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
      <p className={cn("text-3xl font-black", color)}>{value}</p>
    </div>
  );
}

function AlertItem({ type, project, message }: { type: 'error' | 'warning', project: string, message: string }) {
  return (
    <div className={cn(
      "p-4 border-l-4 rounded-r-xl shadow-sm",
      type === 'error' ? "bg-red-50 border-error" : "bg-yellow-50 border-warning"
    )}>
      <p className={cn(
        "text-[10px] font-black uppercase mb-1",
        type === 'error' ? "text-error" : "text-yellow-700"
      )}>{type === 'error' ? 'Crítico' : 'Pendiente'} — {project}</p>
      <p className="text-sm font-bold text-slate-700 leading-snug">{message}</p>
    </div>
  );
}
