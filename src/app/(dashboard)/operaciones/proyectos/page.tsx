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
  FilterX,
  Clock
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
import { useCRMStore } from "@/store/crm-store";
import { Combobox } from "@/components/ui/combobox";
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

  const { clients: crmClients, quotes, fetchClients: fetchCRMClients, fetchQuotes } = useCRMStore();

  const clientOptions = useMemo(() => 
    crmClients.map(c => ({
      value: c.id,
      label: c.empresa,
      subLabel: `${c.codigo} - RUC: ${c.ruc}`
    })), [crmClients]
  );

  const [loading, setLoading] = useState(true);
  const [selectedProyecto, setSelectedProyecto] = useState<Proyecto | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("proyectos");

  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Proyecto | null>(null);
  const [editingProyecto, setEditingProyecto] = useState<Proyecto | null>(null);
  
  const [errorDialog, setErrorDialog] = useState<{ isOpen: boolean; title: string; message: string }>({
    isOpen: false,
    title: "",
    message: ""
  });

  const [newProject, setNewProject] = useState({
    clientId: "",
    cotizacionId: "",
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

  const quoteOptions = useMemo(() => 
    quotes
      .filter(q => q.clientId === newProject.clientId)
      .map(q => ({
        value: q.id,
        label: `${q.codigo || 'S/C'} - ${new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(q.monto)}`,
        subLabel: `Estado: ${q.estado.toUpperCase()}`
      })), [quotes, newProject.clientId]
  );

  const getResponsableName = useCallback((id: string) => {
    if (!id) return "SIN ASIGNAR";
    const resp = responsables.find(r => r.id === id);
    if (resp) return resp.nombre.toUpperCase();
    if (id.length > 20 && id.includes('-')) return "BUSCANDO PERSONAL...";
    return id.toUpperCase();
  }, [responsables]);

  const getResponsableColor = useCallback((id: string) => {
    return responsables.find(r => r.id === id)?.color || "#666";
  }, [responsables]);

  useEffect(() => {
    const init = async () => {
      await Promise.all([
        fetchProyectos(), 
        fetchResponsables(),
        fetchCRMClients(),
        fetchQuotes()
      ]);
      setLoading(false);
    };
    init();
  }, [fetchProyectos, fetchResponsables, fetchCRMClients, fetchQuotes]);

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
    // 1. VALIDACIÓN DE CAMPOS OBLIGATORIOS
    if (!newProject.nombre) {
      alert("Por favor, ingresa el nombre del proyecto.");
      return;
    }
    if (!newProject.clientId) {
      alert("Por favor, selecciona un cliente para el proyecto.");
      return;
    }
    if (!newProject.fechaFinEstimada) {
      alert("Por favor, selecciona una fecha estimada de finalización.");
      return;
    }

    // 2. VALIDACIÓN DE COTIZACIÓN APROBADA (RESTRICCIÓN COMERCIAL)
    // Buscamos cualquier cotización aprobada para este cliente
    const approvedQuote = quotes.find(q => 
      q.clientId === newProject.clientId && (q.estado === "Aprobado" || q.estado === "Aprobada")
    );
    
    if (!approvedQuote) {
      setErrorDialog({
        isOpen: true,
        title: "Proyecto no autorizado",
        message: "No es posible registrar este proyecto porque la cotización asociada aún no ha sido aprobada por el cliente.\n\nPor favor, contacte al área comercial para validar el estado de la negociación o gestionar la aprobación correspondiente antes de continuar.\n\nUna vez que la cotización se encuentre en estado APROBADA, podrá registrar el proyecto."
      });
      return;
    }

    // 3. REGISTRO DEL PROYECTO
    try {
      // Pasamos el ID de la cotización aprobada encontrada automáticamente
      await addProyecto({ ...newProject, cotizacionId: approvedQuote.id } as any);
      setIsNewProjectModalOpen(false);
      
      // Reset del formulario
      setNewProject({
        clientId: "",
        cotizacionId: "",
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
      
      alert("Proyecto registrado exitosamente.");
    } catch (error: any) {
      console.error("Error al registrar proyecto:", error);
      // El store ya maneja el mensaje de error si viene del backend
    }
  };

  const handleSaveEditProject = async () => {
    if (!editingProyecto) return;
    await updateProyecto(editingProyecto);
    setIsEditProjectModalOpen(false);
    setEditingProyecto(null);
  };

  const currentSelectedProyecto = selectedProyecto 
    ? proyectos.find(p => p.id === selectedProyecto.id) || null
    : null;

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
      if (filtros.responsable !== "all" && p.responsablePrincipalId !== filtros.responsable) return false;
      return true;
    });
  }, [proyectos, filtros]);

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
const kpis = calcularKPIs('mensual');

return (

    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Briefcase className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-3xl font-medium text-primary tracking-tight uppercase">Gestión de Proyectos</h1>
        </div>
        <Button
          className="gap-2 font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
          onClick={() => setIsNewProjectModalOpen(true)}
        >
          <Plus className="w-4 h-4" /> Nuevo Proyecto
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border p-1 rounded-xl h-12">
          <TabsTrigger value="proyectos" className="gap-2 px-4 font-black uppercase text-[10px]">
            <FolderKanban className="w-4 h-4" /> Listado de Proyectos
          </TabsTrigger>
          <TabsTrigger value="kpis" className="gap-2 px-4 font-black uppercase text-[10px]">
            <BarChart3 className="w-4 h-4" /> Panel de KPIs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="proyectos" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatsCard label="Total Proyectos" value={stats.total} icon={<Briefcase className="w-5 h-5" />} color="text-primary" bgColor="bg-primary/5" />
            <StatsCard label="En Ejecución" value={stats.activos} icon={<Activity className="w-5 h-5" />} color="text-orange-600" bgColor="bg-orange-50" />
            <StatsCard label="Planificación" value={stats.planification} icon={<Calendar className="w-5 h-5" />} color="text-blue-600" bgColor="bg-blue-50" />
            <StatsCard label="Finalizados" value={stats.finalizados} icon={<CheckCircle2 className="w-5 h-5" />} color="text-green-600" bgColor="bg-green-50" />
            <StatsCard label="Críticos" value={stats.rojos} icon={<AlertCircle className="w-5 h-5" />} color="text-error" bgColor="bg-red-50" />
          </div>

          {/* BARRA DE FILTROS REFINADA */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-6">
            <div className="relative w-full">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 mb-2 block italic">Filtrar por texto</span>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input 
                  placeholder="Buscar código, empresa o nombre del servicio..." 
                  className="pl-12 h-14 border-slate-200 bg-slate-50/30 focus:bg-white transition-all shadow-none font-bold text-base rounded-xl" 
                  value={filtros.searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 items-end">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-primary tracking-widest ml-1">Estado de Ejecución</Label>
                <Select value={filtros.estado} onValueChange={(val) => setEstado(val ?? "")}>
                  <SelectTrigger className="h-11 border-slate-200 bg-white font-bold text-xs rounded-xl shadow-sm">
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 shadow-xl">
                    <SelectItem value="all" className="text-slate-400 font-bold italic uppercase text-[10px]">Todos los estados</SelectItem>
                    <SelectItem value="Planificación" className="font-bold text-[10px] uppercase">Planificación</SelectItem>
                    <SelectItem value="En Ejecución" className="font-bold text-[10px] uppercase">En Ejecución</SelectItem>
                    <SelectItem value="Detenido" className="font-bold text-[10px] uppercase">Detenido</SelectItem>
                    <SelectItem value="Finalizado" className="font-bold text-[10px] uppercase">Finalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-primary tracking-widest ml-1">Líder del Proyecto</Label>
                <Select value={filtros.responsable || "all"} onValueChange={(val) => setResponsable(val ?? "")}>
                  <SelectTrigger className="h-11 border-slate-200 bg-white font-bold text-xs rounded-xl shadow-sm">
                    <SelectValue placeholder="Todos los líderes" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 shadow-xl">
                    <SelectItem value="all" className="text-slate-400 font-bold italic uppercase text-[10px]">Todos los responsables</SelectItem>
                    {responsables.map(r => (
                      <SelectItem key={r.id} value={r.id} className="font-bold text-[10px] uppercase">{r.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-primary tracking-widest ml-1">Área Operativa</Label>
                <Select value={filtros.area} onValueChange={(val) => setArea(val ?? "")}>
                  <SelectTrigger className="h-11 border-slate-200 bg-white font-bold text-xs rounded-xl shadow-sm">
                    <SelectValue placeholder="Todas las áreas" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 shadow-xl">
                    <SelectItem value="all" className="text-slate-400 font-bold italic uppercase text-[10px]">Todas las áreas</SelectItem>
                    <SelectItem value="Logística y Recursos" className="font-bold text-[10px] uppercase">Logística y Recursos</SelectItem>
                    <SelectItem value="Ingeniería y Supervisión Técnica" className="font-bold text-[10px] uppercase">Ingeniería y Supervisión</SelectItem>
                    <SelectItem value="Gestión Documentaria y Expedientes Técnicos" className="font-bold text-[10px] uppercase">Gestión Documentaria</SelectItem>
                    <SelectItem value="Operaciones de Campo y Control de Obra" className="font-bold text-[10px] uppercase">Operaciones de Campo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-primary tracking-widest ml-1">Prioridad</Label>
                <Select value={filtros.prioridad} onValueChange={(val) => setPrioridad(val ?? "")}>
                  <SelectTrigger className="h-11 border-slate-200 bg-white font-bold text-xs rounded-xl shadow-sm">
                    <SelectValue placeholder="Cualquier prioridad" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 shadow-xl">
                    <SelectItem value="all" className="text-slate-400 font-bold italic uppercase text-[10px]">Todas las prioridades</SelectItem>
                    <SelectItem value="Baja" className="font-bold text-[10px] uppercase">Baja</SelectItem>
                    <SelectItem value="Media" className="font-bold text-[10px] uppercase">Media</SelectItem>
                    <SelectItem value="Alta" className="font-bold text-[10px] uppercase">Alta</SelectItem>
                    <SelectItem value="Crítica" className="font-bold text-[10px] uppercase">Crítica</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button 
                    variant="outline" 
                    onClick={resetFiltros} 
                    className="h-11 flex-1 text-slate-400 hover:text-error hover:bg-red-50 border border-slate-200 transition-all rounded-xl gap-2 font-black text-[10px] uppercase"
                >
                    <FilterX className="w-4 h-4" /> LIMPIAR
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="font-black text-primary uppercase text-[10px] py-5">Código</TableHead>
                  <TableHead className="font-black text-primary uppercase text-[10px]">Proyecto / Cliente</TableHead>
                  <TableHead className="font-black text-primary uppercase text-[10px]">Área</TableHead>
                  <TableHead className="font-black text-primary uppercase text-[10px] text-center">Responsable</TableHead>
                  <TableHead className="font-black text-primary uppercase text-[10px] text-center">Avance</TableHead>
                  <TableHead className="font-black text-primary uppercase text-[10px] text-right">Estado</TableHead>
                  <TableHead className="text-right font-black text-primary uppercase text-[10px] w-[80px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proyectosFiltrados.map((proyecto) => (
                  <TableRow key={proyecto.id} className="hover:bg-slate-50/50 transition-colors group">
                    <TableCell className="font-bold text-xs text-primary">{proyecto.codigo}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                            {proyecto.cotizacion && proyecto.cotizacion.estado !== 'Aprobado' ? (
                                <Badge variant="outline" className="text-[9px] font-black uppercase bg-amber-50 text-amber-600 border-amber-200 px-1.5 py-0 animate-pulse">
                                    PENDIENTE DE APROBACIÓN COMERCIAL
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="text-[9px] font-black uppercase bg-slate-50 text-slate-400 border-slate-200 px-1.5 py-0">
                                    {crmClients.find(c => c.id === proyecto.clientId)?.empresa || "Cliente Externo"}
                                </Badge>
                            )}
                        </div>
                        <p className="font-black text-sm text-primary group-hover:text-secondary transition-colors uppercase truncate max-w-[300px]">
                          {proyecto.nombre}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("text-[10px] font-black uppercase text-white shadow-none border-none", areaColors[proyecto.area] || "bg-gray-400")}>
                        {proyecto.area}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[11px] font-black uppercase border border-primary/20 shadow-inner">
                          {getResponsableName(proyecto.responsablePrincipalId).charAt(0)}
                        </div>
                        <span className="text-[9px] font-black text-slate-600 uppercase">{getResponsableName(proyecto.responsablePrincipalId)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="w-full max-w-[120px] mx-auto space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase">
                          <span>{proyecto.avanceCalculado}%</span>
                          <div className={cn("w-2.5 h-2.5 rounded-full shadow-inner ring-1 ring-white", semaforoColors[proyecto.semaforo])} />
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-100">
                          <div className={cn("h-full transition-all duration-700", proyecto.avanceCalculado === 100 ? "bg-emerald-500" : "bg-primary")} style={{ width: `${proyecto.avanceCalculado}%` }} />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col gap-1 items-end">
                        <Badge className={cn("border-none font-black text-[9px] uppercase shadow-none h-5 px-3", statusColors[proyecto.estado])}>
                          {proyecto.estado}
                        </Badge>
                        <Badge className={cn("border-none font-black text-[9px] uppercase shadow-none h-5 px-3", prioridadColors[proyecto.prioridad])}>
                          {proyecto.prioridad}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-60 group-hover:opacity-100 transition-all">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 text-primary hover:bg-primary/10 hover:scale-110"
                          onClick={() => handleOpenDetail(proyecto)}
                          title="Gestionar"
                        >
                          <Eye className="w-4.5 h-4.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 text-secondary hover:bg-secondary/10 hover:scale-110"
                          onClick={() => handleEditProyecto(proyecto)}
                          title="Editar"
                        >
                          <Pencil className="w-4.5 h-4.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 text-error hover:bg-error/10 hover:scale-110"
                          onClick={() => handleDeleteClick(proyecto)}
                          title="Eliminar"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="kpis" className="mt-4">
          <KPIPanel proyectosStats={stats} actividadesStats={actividadStats} kpis={kpis} onCambiarPeriodo={() => {}} />
        </TabsContent>
      </Tabs>

      {/* MODALS REDESIGNED */}
      <Dialog open={isNewProjectModalOpen} onOpenChange={setIsNewProjectModalOpen}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] p-0 border-none bg-white flex flex-col overflow-y-auto rounded-xl shadow-2xl">
          <DialogHeader className="p-8 bg-primary text-white rounded-t-xl shrink-0">
            <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3 uppercase text-white">
              <Plus className="w-8 h-8 text-accent" /> Nuevo Registro de Proyecto
            </DialogTitle>
          </DialogHeader>
          <div className="p-8 space-y-8 overflow-y-auto flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-1.5">
                    <div className="w-1 h-3 bg-primary rounded-full" /> Nombre del Proyecto *
                </Label>
                <Input value={newProject.nombre} onChange={(e) => setNewProject({ ...newProject, nombre: e.target.value })} placeholder="Ej: CAMBIO DE TABLEROS..." className="h-11 text-sm font-bold border-slate-200 focus:border-primary shadow-sm uppercase" />
              </div>
              <div className="space-y-2 flex flex-col">
                <Label className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-1.5">
                    <div className="w-1 h-3 bg-primary rounded-full" /> Cliente Vinculado *
                </Label>
                <Combobox options={clientOptions} value={newProject.clientId} onChange={(val) => setNewProject({ ...newProject, clientId: val, cotizacionId: "" })} placeholder="Buscar cliente..." searchPlaceholder="Nombre o RUC..." className="h-11 text-xs border-slate-200 shadow-sm" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-1.5">
                <div className="w-1 h-3 bg-primary rounded-full" /> Descripción Técnica
              </Label>
              <Textarea value={newProject.descripcion} onChange={(e) => setNewProject({ ...newProject, descripcion: e.target.value })} placeholder="Resumen del servicio..." className="h-24 text-sm font-medium resize-none border-slate-200 focus:border-primary shadow-sm" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-1.5">
                  <div className="w-1 h-3 bg-primary rounded-full" /> Área Encargada *
                </Label>
                <Select value={newProject.area} onValueChange={(val) => setNewProject({ ...newProject, area: val ?? "" })}>
                  <SelectTrigger className="h-11 border-slate-200 bg-white"><SelectValue placeholder="Seleccionar Área" /></SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 shadow-xl font-bold uppercase text-[10px]">
                    <SelectItem value="Logística y Recursos">Logística y Recursos</SelectItem>
                    <SelectItem value="Ingeniería y Supervisión Técnica">Ingeniería y Supervisión</SelectItem>
                    <SelectItem value="Gestión Documentaria y Expedientes Técnicos">Gestión Documentaria</SelectItem>
                    <SelectItem value="Operaciones de Campo y Control de Obra">Operaciones de Campo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-1.5">
                  <div className="w-1 h-3 bg-primary rounded-full" /> Responsable Principal *
                </Label>
                <Select value={newProject.responsablePrincipalId} onValueChange={(val) => setNewProject({ ...newProject, responsablePrincipalId: val ?? "" })}>
                  <SelectTrigger className="h-11 border-slate-200 bg-white shadow-sm">
                    <SelectValue placeholder="SELECCIONAR LÍDER" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 shadow-xl font-bold uppercase text-[10px]">
                    {responsables.map((resp) => (
                      <SelectItem key={resp.id} value={resp.id}>{resp.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="space-y-2 md:col-span-2">
                <Label className="text-[10px] font-black uppercase text-primary tracking-widest">Estado Inicial</Label>
                <Select value={newProject.estado} onValueChange={(val) => setNewProject({ ...newProject, estado: val ?? "" })}>
                  <SelectTrigger className="h-11 border-slate-200 bg-white shadow-sm"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 font-bold uppercase text-[10px]">
                    <SelectItem value="Planificación">Planificación</SelectItem>
                    <SelectItem value="En Ejecución">En Ejecución</SelectItem>
                    <SelectItem value="Detenido">Detenido</SelectItem>
                    <SelectItem value="Finalizado">Finalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-[10px] font-black uppercase text-primary tracking-widest">Prioridad</Label>
                <Select value={newProject.prioridad} onValueChange={(val) => setNewProject({ ...newProject, prioridad: val ?? "" })}>
                  <SelectTrigger className="h-11 border-slate-200 bg-white shadow-sm"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 font-bold uppercase text-[10px]">
                    <SelectItem value="Baja">Baja</SelectItem>
                    <SelectItem value="Media">Media</SelectItem>
                    <SelectItem value="Alta">Alta</SelectItem>
                    <SelectItem value="Crítica">Crítica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200 border-dashed">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-accent tracking-widest flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Fecha Inicio</Label>
                <Input type="date" value={newProject.fechaInicio} onChange={(e) => setNewProject({ ...newProject, fechaInicio: e.target.value })} className="h-11 border-slate-200 bg-white shadow-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-accent tracking-widest flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Fin Estimado *</Label>
                <Input type="date" value={newProject.fechaFinEstimada} onChange={(e) => setNewProject({ ...newProject, fechaFinEstimada: e.target.value })} className="h-11 border-slate-200 bg-white shadow-sm" />
              </div>
            </div>
          </div>
          <DialogFooter className="p-6 border-t bg-slate-50/50 flex flex-row justify-end gap-3 rounded-b-xl shrink-0">
            <Button variant="ghost" onClick={() => setIsNewProjectModalOpen(false)} className="h-11 px-8 font-bold text-slate-500 hover:bg-slate-200 transition-all uppercase text-xs">CANCELAR</Button>
            <Button onClick={handleSaveNewProject} className="h-11 px-10 font-black bg-primary hover:bg-primary/90 text-white shadow-xl uppercase text-xs">CREAR PROYECTO</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Proyecto */}
      <Dialog open={isEditProjectModalOpen} onOpenChange={setIsEditProjectModalOpen}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] p-0 border-none bg-white flex flex-col overflow-y-auto rounded-xl shadow-2xl">
          <DialogHeader className="p-8 bg-secondary text-white rounded-t-xl shrink-0">
            <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3 uppercase text-white">
              <Pencil className="w-8 h-8 text-accent" /> Editar Proyecto Real
            </DialogTitle>
          </DialogHeader>
          <div className="p-8 space-y-8 overflow-y-auto flex-1">
            {editingProyecto && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-primary tracking-widest">Código de Registro</Label>
                    <Input value={editingProyecto.codigo} disabled className="h-11 text-sm font-bold bg-muted border-slate-200 shadow-none uppercase" />
                  </div>
                  <div className="space-y-2 flex flex-col">
                    <Label className="text-[10px] font-black uppercase text-primary tracking-widest mb-0.5">Cliente Vinculado *</Label>
                    <Combobox options={clientOptions} value={editingProyecto.clientId} onChange={(val) => setEditingProyecto({ ...editingProyecto, clientId: val })} placeholder="Buscar por nombre..." searchPlaceholder="Nombre o RUC..." className="h-11 text-xs border-slate-200 shadow-sm" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary tracking-widest">Nombre del Proyecto</Label>
                  <Input value={editingProyecto.nombre} onChange={(e) => setEditingProyecto({ ...editingProyecto, nombre: e.target.value })} className="h-11 text-sm font-bold border-slate-200 focus:border-primary shadow-sm uppercase" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-primary tracking-widest">Área de Operación</Label>
                    <Select value={editingProyecto.area} onValueChange={(val) => setEditingProyecto({ ...editingProyecto, area: val as any })}>
                      <SelectTrigger className="h-11 border-slate-200 bg-white shadow-sm"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-white border-slate-200 font-bold uppercase text-[10px] shadow-xl">
                        <SelectItem value="Logística y Recursos">Logística y Recursos</SelectItem>
                        <SelectItem value="Ingeniería y Supervisión Técnica">Ingeniería y Supervisión</SelectItem>
                        <SelectItem value="Gestión Documentaria y Expedientes Técnicos">Gestión Documentaria</SelectItem>
                        <SelectItem value="Operaciones de Campo y Control de Obra">Operaciones de Campo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-primary tracking-widest mb-0.5">Responsable Líder</Label>
                    <Select value={editingProyecto.responsablePrincipalId} onValueChange={(val) => setEditingProyecto({ ...editingProyecto, responsablePrincipalId: val ?? "" })}>
                      <SelectTrigger className="h-11 border-slate-200 bg-white shadow-sm"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-white border-slate-200 font-bold uppercase text-[10px] shadow-xl">
                        {responsables.map((resp) => (
                          <SelectItem key={resp.id} value={resp.id}>{resp.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                    <div className="space-y-2 md:col-span-2">
                        <Label className="text-[10px] font-black uppercase text-primary tracking-widest">Estado Actual</Label>
                        <Select value={editingProyecto.estado} onValueChange={(val) => setEditingProyecto({ ...editingProyecto, estado: val as any })}>
                            <SelectTrigger className="h-11 border-slate-200 bg-white shadow-sm"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-white border-slate-200 font-bold uppercase text-[10px] shadow-xl">
                                <SelectItem value="Planificación">Planificación</SelectItem>
                                <SelectItem value="En Ejecución">En Ejecución</SelectItem>
                                <SelectItem value="Detenido">Detenido</SelectItem>
                                <SelectItem value="Finalizado">Finalizado</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label className="text-[10px] font-black uppercase text-primary tracking-widest">Prioridad</Label>
                        <Select value={editingProyecto.prioridad} onValueChange={(val) => setEditingProyecto({ ...editingProyecto, prioridad: val as any })}>
                            <SelectTrigger className="h-11 border-slate-200 bg-white shadow-sm"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-white border-slate-200 font-bold uppercase text-[10px] shadow-xl">
                                <SelectItem value="Baja">Baja</SelectItem>
                                <SelectItem value="Media">Media</SelectItem>
                                <SelectItem value="Alta">Alta</SelectItem>
                                <SelectItem value="Crítica">Crítica</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter className="p-6 border-t bg-slate-50/50 rounded-b-xl flex flex-row justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsEditProjectModalOpen(false)} className="h-11 px-8 font-bold text-slate-500 uppercase text-xs">CANCELAR</Button>
            <Button onClick={handleSaveEditProject} className="h-11 px-10 font-black bg-secondary hover:bg-secondary/90 text-white shadow-xl uppercase text-xs">GUARDAR CAMBIOS</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Eliminar */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-error flex items-center gap-2 font-black uppercase text-sm"><Trash2 className="w-5 h-5" /> Confirmar Eliminación</DialogTitle>
            <DialogDescription className="py-4 font-bold text-slate-600">¿Estás seguro de eliminar el proyecto <span className="text-primary underline uppercase">"{projectToDelete?.nombre}"</span>? Esta acción es irreversible.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} className="font-bold uppercase text-xs">CANCELAR</Button>
            <Button variant="destructive" onClick={confirmDelete} className="font-black bg-error hover:bg-error/90 uppercase text-xs px-6">ELIMINAR AHORA</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DETALLE */}
      {currentSelectedProyecto && isDetailOpen && (
        <ProyectoDetail
          proyecto={currentSelectedProyecto}
          onClose={() => { setIsDetailOpen(false); setSelectedProyecto(null); }}
        />
      )}

      {/* MODAL DE ERROR DE NEGOCIO */}
      <Dialog open={errorDialog.isOpen} onOpenChange={(open) => setErrorDialog({ ...errorDialog, isOpen: open })}>
        <DialogContent className="sm:max-w-[500px] border-none shadow-2xl rounded-2xl p-0 overflow-hidden bg-white">
          <DialogHeader className="p-6 bg-error text-white">
            <DialogTitle className="flex items-center gap-3 text-xl font-black uppercase">
              <AlertCircle className="w-8 h-8" /> {errorDialog.title}
            </DialogTitle>
          </DialogHeader>
          <div className="p-8 space-y-6">
            <div className="space-y-4">
              {errorDialog.message.split('\n\n').map((paragraph, idx) => (
                <p key={idx} className={cn(
                  "text-sm leading-relaxed",
                  idx === 0 ? "font-bold text-slate-900 text-base" : "text-slate-600 font-medium"
                )}>
                  {paragraph}
                </p>
              ))}
            </div>
            <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex gap-3 items-start">
              <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[11px] font-bold text-amber-800 leading-tight uppercase">
                ESTADO REQUERIDO: APROBADA
              </p>
            </div>
          </div>
          <DialogFooter className="p-6 bg-slate-50 border-t flex justify-end">
            <Button 
              onClick={() => setErrorDialog({ ...errorDialog, isOpen: false })}
              className="bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-xs px-8 h-11 rounded-xl transition-all"
            >
              ENTENDIDO
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
