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
  Trash2,
  FilterX,
  ShieldAlert,
  Lock,
  RotateCw
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
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProyectoDetail } from "@/components/operaciones/proyecto-detail";
import { KPIPanel } from "@/components/operaciones/kpi-panel";
import { toast } from "sonner";
import { useOperacionesStore } from "@/store/operaciones-store";
import { useCRMStore } from "@/store/crm-store";
import { api } from "@/lib/api";
import { Combobox } from "@/components/ui/combobox";
import { ModernDialog, DialogType } from "@/components/ui/modern-dialog";
import type { Proyecto, Actividad, EstadoProyecto, Area, Prioridad } from "@/lib/types";

// Componente local para estadísticas compactas
const StatsCard = ({ label, value, icon, color, bgColor }: any) => (
  <div className={cn("p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3 bg-white", bgColor)}>
    <div className={cn("p-2 rounded-lg bg-white shadow-sm shrink-0", color)}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[9px] font-black uppercase text-slate-400 tracking-tighter leading-none mb-1 truncate">{label}</p>
      <p className={cn("text-lg font-black leading-none tracking-tight", color)}>{value}</p>
    </div>
  </div>
);

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
    totalProyectos,
    proyectoPage,
    proyectoTotalPages,
    responsables,
    filtros,
    setSearchQuery,
    setEstado,
    setArea,
    setPrioridad,
    setResponsable,
    resetFiltros,
    addProyecto,
    updateProyecto,
    deleteProyectoSecure,
    calcularKPIs,
    fetchProyectos,
    fetchResponsables,
  } = useOperacionesStore();

  const { quotes, fetchQuotes } = useCRMStore();
  const [allClients, setAllClients] = useState<any[]>([]);

  const clientOptions = useMemo(() => 
    allClients.map(c => ({
      value: c.id,
      label: c.empresa,
      subLabel: `${c.codigo} - RUC: ${c.ruc}`
    })), [allClients]
  );

  const fetchAllClientsDirectly = useCallback(async () => {
    try {
      const res: any = await api.get('/crm/clientes?limit=3000');
      if (res && res.data && Array.isArray(res.data)) {
        setAllClients(res.data);
      } else if (Array.isArray(res)) {
        setAllClients(res);
      }
    } catch (e) {
      console.error("Error fetching clients directly:", e);
    }
  }, []);

  const [loading, setLoading] = useState(true);
  const [selectedProyecto, setSelectedProyecto] = useState<Proyecto | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("proyectos");

  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
  
  const [isSecureDeleteOpen, setIsSecureDeleteOpen] = useState(false);
  const [projectToDeleteId, setProjectToDeleteId] = useState<string | null>(null);
  const [projectToDeleteName, setProjectToDeleteName] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const [editingProyecto, setEditingProyecto] = useState<Proyecto | null>(null);
  
  const [modernDialog, setModernDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    type: DialogType;
    confirmText?: string;
    onConfirm?: () => void;
    showCancel?: boolean;
  }>({
    isOpen: false,
    title: "",
    description: "",
    type: "info"
  });

  const closeModernDialog = () => setModernDialog(prev => ({ ...prev, isOpen: false }));

  const showSuccess = (title: string, description: string) => {
    toast.success(title, { description });
    setModernDialog({
      isOpen: true,
      title,
      description,
      type: "success",
      confirmText: "Perfecto"
    });
  };

  const showError = (title: string, description: string) => {
    toast.error(title, { description });
    setModernDialog({
      isOpen: true,
      title,
      description,
      type: "error",
      confirmText: "Entendido"
    });
  };

  const handleSecureDelete = async () => {
    if (!projectToDeleteId || !adminPassword) {
        showError("Contraseña Requerida", "Por favor ingrese la contraseña de administrador.");
        return;
    }

    try {
        setIsDeleting(true);
        await deleteProyectoSecure(projectToDeleteId, adminPassword);
        setIsSecureDeleteOpen(false);
        setProjectToDeleteId(null);
        setAdminPassword("");
        showSuccess("Proyecto Eliminado", "El registro ha sido removido exitosamente.");
    } catch (err: any) {
        showError("Acceso Denegado", err.message || "La contraseña es incorrecta.");
        setAdminPassword("");
    } finally {
        setIsDeleting(false);
    }
  };

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

  const getResponsableName = useCallback((id: string) => {
    if (!id) return "S/A";
    const resp = responsables.find(r => r.id === id);
    if (resp) return resp.nombre.toUpperCase();
    return "S/A";
  }, [responsables]);

  useEffect(() => {
    const init = async () => {
      await Promise.all([
        fetchProyectos(proyectoPage, 20), 
        fetchResponsables(),
        fetchAllClientsDirectly(),
        fetchQuotes(1, 3000)
      ]);
      setLoading(false);
    };
    init();
  }, [fetchProyectos, fetchResponsables, fetchAllClientsDirectly, fetchQuotes, proyectoPage]);

  const handlePageChange = (newPage: number) => {
    fetchProyectos(newPage, 20);
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchProyectos(proyectoPage, 20), 
        fetchResponsables(),
        fetchAllClientsDirectly(),
        fetchQuotes(1, 3000)
      ]);
    } catch (e) {
      toast.error("Error", { description: "No se pudieron recargar los proyectos." });
    } finally {
      setLoading(false);
    }
  };

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

  const handleSaveNewProject = async () => {
    if (!newProject.nombre || !newProject.clientId || !newProject.fechaFinEstimada) {
      showError("Faltan Datos", "Por favor, completa los campos obligatorios.");
      return;
    }

    // VALIDACIÓN LOCAL: Evitar duplicados (Un proyecto activo por cliente)
    const existingActive = proyectos.find(p => p.clientId === newProject.clientId && p.estado !== 'Finalizado');
    if (existingActive) {
        showError("Cliente con Proyecto Activo", `El cliente seleccionado ya tiene un proyecto operativo en curso: "${existingActive.nombre}". Debe finalizarlo antes de iniciar uno nuevo.`);
        return;
    }

    const clientQuotes = quotes.filter(q => q.clientId === newProject.clientId);
    const selectedQuote = clientQuotes[0];
    if (!selectedQuote) {
      showError("Cotización requerida", "El cliente no tiene cotizaciones registradas.");
      return;
    }

    try {
      await addProyecto({ ...newProject, cotizacionId: selectedQuote.id } as any);
      setIsNewProjectModalOpen(false);
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
      showSuccess("Registro Exitoso", "Proyecto creado correctamente.");
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || error.message || "No se pudo crear el proyecto. Verifique los requisitos.";
      showError("Error de Registro", msg);
    }
  };

  const handleSaveEditProject = async () => {
    if (!editingProyecto) return;
    try {
      await updateProyecto(editingProyecto);
      setIsEditProjectModalOpen(false);
      setEditingProyecto(null);
      showSuccess("Cambios Guardados", "Información actualizada.");
    } catch (err) {
      showError("Error al Guardar", "No se pudieron guardar los cambios.");
    }
  };

  const currentSelectedProyecto = useMemo(() => 
    selectedProyecto ? proyectos.find(p => p.id === selectedProyecto.id) || null : null,
    [selectedProyecto, proyectos]
  );

  const proyectosFiltrados = useMemo(() => {
    return proyectos.filter((p) => {
      if (filtros.searchQuery && !p.nombre.toLowerCase().includes(filtros.searchQuery.toLowerCase()) &&
          !p.codigo.toLowerCase().includes(filtros.searchQuery.toLowerCase())) {
        return false;
      }
      if (filtros.estado && p.estado !== filtros.estado) return false;
      if (filtros.area && p.area !== filtros.area) return false;
      if (filtros.prioridad && p.prioridad !== filtros.prioridad) return false;
      if (filtros.responsable && p.responsablePrincipalId !== filtros.responsable) return false;
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

  const kpis = calcularKPIs('mensual');

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Briefcase className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-xl font-black text-primary tracking-tight uppercase">Gestión de Proyectos</h1>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5 font-bold uppercase tracking-wide">Control operativo y seguimiento de proyectos.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="h-9 gap-2 font-black uppercase text-[10px] border-slate-200 bg-white"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RotateCw className={cn("w-4 h-4", loading && "animate-spin")} /> Refrescar
          </Button>
          <Button
            className="h-9 gap-2 font-black uppercase text-[10px] bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
            onClick={() => setIsNewProjectModalOpen(true)}
          >
            <Plus className="w-4 h-4" /> Nuevo Proyecto
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatsCard label="Total" value={stats.total} icon={<Briefcase className="w-4 h-4" />} color="text-primary" bgColor="bg-primary/5" />
        <StatsCard label="Ejecución" value={stats.activos} icon={<Activity className="w-4 h-4" />} color="text-orange-600" bgColor="bg-orange-50" />
        <StatsCard label="Plan" value={stats.planification} icon={<Calendar className="w-4 h-4" />} color="text-blue-600" bgColor="bg-blue-50" />
        <StatsCard label="Finalizado" value={stats.finalizados} icon={<CheckCircle2 className="w-4 h-4" />} color="text-green-600" bgColor="bg-green-50" />
        <StatsCard label="Críticos" value={stats.rojos} icon={<AlertCircle className="w-4 h-4" />} color="text-error" bgColor="bg-red-50" />
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="relative w-full max-w-[400px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Buscar código o proyecto..." 
            className="pl-10 h-9 border-slate-200 bg-slate-50/30 focus:bg-white transition-all shadow-none font-bold text-xs rounded-xl" 
            value={filtros.searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 items-end">
          <div className="space-y-1.5">
            <Label className="text-[9px] font-black uppercase text-primary tracking-widest ml-1">Estado</Label>
            <Select value={filtros.estado} onValueChange={(val) => setEstado(val as string)}>
              <SelectTrigger className="h-9 border-slate-200 bg-white font-bold text-[10px] uppercase rounded-xl">
                <SelectValue placeholder="ESTADO" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 font-bold text-[10px] uppercase">
                <SelectItem value="Planificación">Planificación</SelectItem>
                <SelectItem value="En Ejecución">En Ejecución</SelectItem>
                <SelectItem value="Detenido">Detenido</SelectItem>
                <SelectItem value="Finalizado">Finalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[9px] font-black uppercase text-primary tracking-widest ml-1">Líder</Label>
            <Select value={filtros.responsable} onValueChange={(val) => setResponsable(val as string)}>
              <SelectTrigger className="h-9 border-slate-200 bg-white font-bold text-[10px] uppercase rounded-xl">
                <SelectValue placeholder="LÍDER">
                  {filtros.responsable ? responsables.find(r => r.id === filtros.responsable)?.nombre : "LÍDER"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 font-bold text-[10px] uppercase">
                {responsables.map(r => (
                  <SelectItem key={r.id} value={r.id}>{r.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[9px] font-black uppercase text-primary tracking-widest ml-1">Área</Label>
            <Select value={filtros.area} onValueChange={(val) => setArea(val as string)}>
              <SelectTrigger className="h-9 border-slate-200 bg-white font-bold text-[10px] uppercase rounded-xl">
                <SelectValue placeholder="ÁREA" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 font-bold text-[10px] uppercase">
                <SelectItem value="Logística y Recursos">Logística</SelectItem>
                <SelectItem value="Ingeniería y Supervisión Técnica">Ingeniería</SelectItem>
                <SelectItem value="Gestión Documentaria y Expedientes Técnicos">Documental</SelectItem>
                <SelectItem value="Operaciones de Campo y Control de Obra">Operaciones</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[9px] font-black uppercase text-primary tracking-widest ml-1">Prioridad</Label>
            <Select value={filtros.prioridad} onValueChange={(val) => setPrioridad(val as string)}>
              <SelectTrigger className="h-9 border-slate-200 bg-white font-bold text-[10px] uppercase rounded-xl">
                <SelectValue placeholder="PRIORIDAD" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 font-bold text-[10px] uppercase">
                <SelectItem value="Baja">Baja</SelectItem>
                <SelectItem value="Media">Media</SelectItem>
                <SelectItem value="Alta">Alta</SelectItem>
                <SelectItem value="Crítica">Crítica</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button 
            variant="outline" 
            onClick={resetFiltros} 
            className="h-9 text-slate-400 hover:text-error hover:bg-red-50 border border-slate-200 rounded-xl gap-2 font-black text-[10px] uppercase"
          >
            <FilterX className="w-3.5 h-3.5" /> LIMPIAR
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border p-1 rounded-xl h-10">
          <TabsTrigger value="proyectos" className="px-4 font-black uppercase text-[9px]">Proyectos ({proyectos.length})</TabsTrigger>
          <TabsTrigger value="kpis" className="px-4 font-black uppercase text-[9px]">Análisis KPIs</TabsTrigger>
        </TabsList>

        <TabsContent value="proyectos" className="mt-2">
          <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="font-black text-primary uppercase text-[10px] py-3 pl-6 w-[50px]">Item</TableHead>
                  <TableHead className="font-black text-primary uppercase text-[10px] py-3">Código</TableHead>
                  <TableHead className="font-black text-primary uppercase text-[10px]">Proyecto / Cliente</TableHead>
                  <TableHead className="font-black text-primary uppercase text-[10px] text-center">Líder</TableHead>
                  <TableHead className="font-black text-primary uppercase text-[10px] text-center">Avance</TableHead>
                  <TableHead className="font-black text-primary uppercase text-[10px] text-right">Estado</TableHead>
                  <TableHead className="text-right font-black text-primary uppercase text-[10px] w-[80px] pr-6">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proyectosFiltrados.map((proyecto, index) => (
                  <TableRow key={proyecto.id} className="hover:bg-slate-50/50 transition-colors group">
                    <TableCell className="font-bold text-xs text-slate-400 pl-6">{index + 1}</TableCell>
                    <TableCell className="font-bold text-xs text-primary">{proyecto.codigo}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase text-slate-400 mb-0.5">
                            {allClients.find(c => c.id === proyecto.clientId)?.empresa || "Cliente Externo"}
                        </span>
                        <p className="font-black text-[12px] text-primary group-hover:text-secondary transition-colors uppercase truncate max-w-[280px]">
                          {proyecto.nombre?.replace(/^proyecto:\s*/i, '')}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col items-center justify-center gap-1">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-black uppercase border border-primary/20 shadow-sm">
                          {getResponsableName(proyecto.responsablePrincipalId).charAt(0)}
                        </div>
                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter">
                            {getResponsableName(proyecto.responsablePrincipalId)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="w-full max-w-[90px] mx-auto space-y-1">
                        <div className="flex justify-between items-center text-[9px] font-black">
                          <span>{proyecto.avanceCalculado}%</span>
                          <div className={cn("w-2 h-2 rounded-full", semaforoColors[proyecto.semaforo])} />
                        </div>
                        <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className={cn("h-full transition-all", proyecto.avanceCalculado === 100 ? "bg-emerald-500" : "bg-primary")} style={{ width: `${proyecto.avanceCalculado}%` }} />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge className={cn("border-none font-black text-[8px] uppercase shadow-none h-4 px-2", statusColors[proyecto.estado])}>
                        {proyecto.estado}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => handleOpenDetail(proyecto)}><Eye className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-secondary" onClick={() => handleEditProyecto(proyecto)}><Pencil className="w-4 h-4" /></Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-error" 
                          onClick={() => {
                            setProjectToDeleteId(proyecto.id);
                            setProjectToDeleteName(proyecto.nombre);
                            setIsSecureDeleteOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Paginación Integrada (Estilo Cartera) */}
            {proyectoTotalPages > 1 && (
                <div className="p-3 bg-slate-50 border-t border-border flex items-center justify-between">
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-2">
                        Página {proyectoPage} de {proyectoTotalPages} — Total: {totalProyectos} proyectos
                    </p>
                    <div className="flex gap-2 mr-2">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            disabled={proyectoPage <= 1 || loading}
                            onClick={() => handlePageChange(proyectoPage - 1)}
                            className="h-7 px-4 font-black text-[9px] uppercase border-slate-200 bg-white"
                        >
                            Anterior
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            disabled={proyectoPage >= proyectoTotalPages || loading}
                            onClick={() => handlePageChange(proyectoPage + 1)}
                            className="h-7 px-4 font-black text-[9px] uppercase border-slate-200 bg-white"
                        >
                            Siguiente
                        </Button>
                    </div>
                </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="kpis" className="mt-2">
          <KPIPanel proyectosStats={stats} actividadesStats={{total: 0, pendientes: 0, enProgreso: 0, completadas: 0, bloqueadas: 0}} kpis={kpis} onCambiarPeriodo={() => {}} />
        </TabsContent>
      </Tabs>

      {currentSelectedProyecto && isDetailOpen && (
        <ProyectoDetail proyecto={currentSelectedProyecto} onClose={() => { setIsDetailOpen(false); setSelectedProyecto(null); }} onRefresh={handleRefresh} />
      )}

      <ModernDialog 
        isOpen={modernDialog.isOpen} 
        onOpenChange={(open) => setModernDialog(prev => ({ ...prev, isOpen: open }))} 
        title={modernDialog.title} 
        description={modernDialog.description} 
        type={modernDialog.type} 
        confirmText={modernDialog.confirmText} 
        onConfirm={modernDialog.onConfirm} 
      />

      {/* MODAL: NUEVO PROYECTO */}
      <Dialog open={isNewProjectModalOpen} onOpenChange={setIsNewProjectModalOpen}>
        <DialogContent className="max-w-2xl bg-white border-none shadow-2xl rounded-2xl p-0 overflow-hidden">
          <DialogHeader className="p-8 bg-primary text-white">
            <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
              <Plus className="w-8 h-8 text-accent" />
              Nuevo Proyecto Operativo
            </DialogTitle>
            <DialogDescription className="text-white/70 font-bold uppercase text-xs">
              Registre un nuevo proyecto a partir de una cotización ganada.
            </DialogDescription>
          </DialogHeader>

          <div className="p-8 grid grid-cols-2 gap-6">
            <div className="space-y-2 col-span-2">
              <Label className="text-[10px] font-black uppercase text-primary ml-1 tracking-widest">Cliente / Empresa</Label>
              <Combobox
                options={clientOptions}
                value={newProject.clientId}
                onChange={(val) => setNewProject({ ...newProject, clientId: val })}
                placeholder="BUSCAR CLIENTE..."
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label className="text-[10px] font-black uppercase text-primary ml-1 tracking-widest">Nombre del Proyecto</Label>
              <Input 
                className="h-12 border-slate-200 font-bold bg-slate-50 focus:bg-white transition-all rounded-xl"
                placeholder="EJ: MANTENIMIENTO PREVENTIVO SEDAPAL"
                value={newProject.nombre}
                onChange={(e) => setNewProject({ ...newProject, nombre: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-primary ml-1 tracking-widest">Fecha Inicio</Label>
              <Input 
                type="date"
                className="h-12 border-slate-200 font-bold bg-slate-50 rounded-xl"
                value={newProject.fechaInicio}
                onChange={(e) => setNewProject({ ...newProject, fechaInicio: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-primary ml-1 tracking-widest">Fecha Fin Est.</Label>
              <Input 
                type="date"
                className="h-12 border-slate-200 font-bold bg-slate-50 rounded-xl"
                value={newProject.fechaFinEstimada}
                onChange={(e) => setNewProject({ ...newProject, fechaFinEstimada: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-primary ml-1 tracking-widest">Responsable Principal</Label>
              <Select value={newProject.responsablePrincipalId || ""} onValueChange={(val) => setNewProject({ ...newProject, responsablePrincipalId: val as string })}>
                <SelectTrigger className="h-12 border-slate-200 bg-slate-50 rounded-xl">
                  <SelectValue placeholder="SELECCIONAR LÍDER">
                    {newProject.responsablePrincipalId ? responsables.find(r => r.id === newProject.responsablePrincipalId)?.nombre : "SELECCIONAR LÍDER"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200">
                  {responsables.map(r => (
                    <SelectItem key={r.id} value={r.id} className="uppercase">{r.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-primary ml-1 tracking-widest">Área Ejecutora</Label>
              <Select value={newProject.area} onValueChange={(val) => setNewProject({ ...newProject, area: val as Area })}>
                <SelectTrigger className="h-12 border-slate-200 bg-slate-50 rounded-xl">
                  <SelectValue placeholder="ÁREA">
                    {newProject.area || "ÁREA"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200">
                  <SelectItem value="Logística y Recursos">Logística</SelectItem>
                  <SelectItem value="Ingeniería y Supervisión Técnica">Ingeniería</SelectItem>
                  <SelectItem value="Gestión Documentaria y Expedientes Técnicos">Documental</SelectItem>
                  <SelectItem value="Operaciones de Campo y Control de Obra">Operaciones</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="p-8 bg-slate-50 flex items-center justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsNewProjectModalOpen(false)} className="font-bold text-slate-500 uppercase text-xs">Cancelar</Button>
            <Button onClick={handleSaveNewProject} className="bg-primary hover:bg-primary/90 text-white font-black uppercase text-xs h-12 px-8 rounded-xl shadow-lg shadow-primary/20">Crear Proyecto</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: EDITAR PROYECTO */}
      <Dialog open={isEditProjectModalOpen} onOpenChange={setIsEditProjectModalOpen}>
        <DialogContent className="max-w-2xl bg-white border-none shadow-2xl rounded-2xl p-0 overflow-hidden">
          <DialogHeader className="p-8 bg-secondary text-white">
            <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
              <Pencil className="w-8 h-8 text-white" />
              Editar Proyecto
            </DialogTitle>
          </DialogHeader>

          {editingProyecto && (
            <div className="p-8 grid grid-cols-2 gap-6">
              <div className="space-y-2 col-span-2">
                <Label className="text-[10px] font-black uppercase text-primary ml-1 tracking-widest">Nombre del Proyecto</Label>
                <Input 
                  className="h-12 border-slate-200 font-bold bg-slate-50 rounded-xl"
                  value={editingProyecto.nombre}
                  onChange={(e) => setEditingProyecto({ ...editingProyecto, nombre: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-primary ml-1 tracking-widest">Fecha Inicio</Label>
                <Input 
                  type="date"
                  className="h-12 border-slate-200 font-bold bg-slate-50 rounded-xl"
                  value={editingProyecto.fechaInicio}
                  onChange={(e) => setEditingProyecto({ ...editingProyecto, fechaInicio: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-primary ml-1 tracking-widest">Fecha Fin Est.</Label>
                <Input 
                  type="date"
                  className="h-12 border-slate-200 font-bold bg-slate-50 rounded-xl"
                  value={editingProyecto.fechaFinEstimada}
                  onChange={(e) => setEditingProyecto({ ...editingProyecto, fechaFinEstimada: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-primary ml-1 tracking-widest">Responsable Principal</Label>
                <Select value={editingProyecto.responsablePrincipalId || ""} onValueChange={(val) => setEditingProyecto({ ...editingProyecto, responsablePrincipalId: val as string })}>
                  <SelectTrigger className="h-12 border-slate-200 bg-slate-50 rounded-xl">
                    <SelectValue placeholder="SELECCIONAR LÍDER">
                        {editingProyecto.responsablePrincipalId ? responsables.find(r => r.id === editingProyecto.responsablePrincipalId)?.nombre : "SELECCIONAR LÍDER"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200">
                    {responsables.map(r => (
                      <SelectItem key={r.id} value={r.id} className="uppercase">{r.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-primary ml-1 tracking-widest">Estado</Label>
                <Select value={editingProyecto.estado} onValueChange={(val) => setEditingProyecto({ ...editingProyecto, estado: val as EstadoProyecto })}>
                  <SelectTrigger className="h-12 border-slate-200 bg-slate-50 rounded-xl">
                    <SelectValue placeholder="ESTADO">
                        {editingProyecto.estado || "ESTADO"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200">
                    <SelectItem value="Planificación">Planificación</SelectItem>
                    <SelectItem value="En Ejecución">En Ejecución</SelectItem>
                    <SelectItem value="Detenido">Detenido</SelectItem>
                    <SelectItem value="Finalizado">Finalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter className="p-8 bg-slate-50 flex items-center justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsEditProjectModalOpen(false)} className="font-bold text-slate-500 uppercase text-xs">Cancelar</Button>
            <Button onClick={handleSaveEditProject} className="bg-secondary hover:bg-secondary/90 text-white font-black uppercase text-xs h-12 px-8 rounded-xl shadow-lg shadow-secondary/20">Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* MODAL: BORRADO SEGURO */}
      <Dialog open={isSecureDeleteOpen} onOpenChange={setIsSecureDeleteOpen}>
        <DialogContent className="max-w-md bg-white border-none shadow-2xl rounded-2xl p-0 overflow-hidden">
          <DialogHeader className="p-8 bg-error text-white">
            <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
              <ShieldAlert className="w-8 h-8 text-white" />
              Borrado de Seguridad
            </DialogTitle>
            <DialogDescription className="text-white/80 font-bold uppercase text-xs">
                Esta acción es irreversible y eliminará todo el historial del proyecto: {projectToDeleteName}.
            </DialogDescription>
          </DialogHeader>

          <div className="p-8 space-y-6">
            <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex gap-4">
                <Lock className="w-6 h-6 text-error shrink-0" />
                <p className="text-xs text-error font-bold uppercase leading-snug">
                    Se requiere contraseña de administrador para confirmar esta operación crítica.
                </p>
            </div>

            <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-500 ml-1 tracking-widest">Contraseña Admin</Label>
                <Input 
                    type="password"
                    placeholder="••••••••"
                    className="h-12 border-slate-200 font-bold bg-slate-50 focus:bg-white transition-all rounded-xl"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSecureDelete()}
                />
            </div>
          </div>

          <DialogFooter className="p-8 bg-slate-50 flex items-center justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsSecureDeleteOpen(false)} className="font-bold text-slate-500 uppercase text-xs" disabled={isDeleting}>Cancelar</Button>
            <Button 
                onClick={handleSecureDelete} 
                className="bg-error hover:bg-red-700 text-white font-black uppercase text-xs h-12 px-8 rounded-xl shadow-lg shadow-red-200"
                disabled={isDeleting}
            >
                {isDeleting ? "Eliminando..." : "Confirmar Eliminación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
