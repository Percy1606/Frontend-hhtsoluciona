"use client";

import { useOperacionesStore } from "@/store/operaciones-store";
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
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Eye,
  Filter,
  User,
  Calendar,
  ArrowRight,
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
} from "@/components/ui/dialog";

// ============================================
// TIPOS
// ============================================

interface Actividad {
  id: string;
  proyectoId: string;
  descripcion: string;
  tipo: string;
  prioridad: string;
  estado: string;
  fechaCreacion: string;
  fechaInicio?: string;
  fechaFin?: string;
  fechaVencimiento?: string;
  responsables: string[];
  validacionesRequeridas: any[];
  subtareas: any[];
  progreso: number;
  progresoCalculado: number;
  proyecto?: {
    codigo: string;
    nombre: string;
    area: string;
  };
  diasRestantes?: number | null;
}

// ============================================
// CONSTANTES
// ============================================

const estadoColors: Record<string, string> = {
  "Pendiente": "bg-gray-100 text-gray-700",
  "En Progreso": "bg-blue-100 text-blue-700",
  "Completada": "bg-green-100 text-green-700",
  "Validada": "bg-success text-white",
  "Bloqueada": "bg-red-100 text-red-700",
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

// ============================================
// PÁGINA PRINCIPAL
// ============================================

export default function ActividadesPage() {
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedActividad, setSelectedActividad] = useState<Actividad | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isNewActivityModalOpen, setIsNewActivityModalOpen] = useState(false);
  const [proyectosList, setProyectosList] = useState<{ id: string; nombre: string }[]>([]);
  const { responsables } = useOperacionesStore(); // Get responsables from store

  const [newActivity, setNewActivity] = useState<Omit<Actividad, 'id' | 'fechaCreacion' | 'progresoCalculado' | 'subtareas' | 'validacionesRequeridas' | 'diasRestantes' | 'proyecto' | 'progreso'>>({
    proyectoId: "", 
    descripcion: '',
    tipo: "Técnica", 
    prioridad: "Media", 
    estado: "Pendiente", 
    fechaVencimiento: new Date().toISOString().split('T')[0],
    responsables: [],
  });

  // Filtros
  const [filtros, setFiltros] = useState({
    search: "",
    estado: "all",
    tipo: "all",
    prioridad: "all",
    proyectoId: "all",
  });

  // Cargar datos
  useEffect(() => {
    fetchInitialData();
  }, [filtros]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // Fetch projects
      const projectsResponse = await fetch("/api/operaciones/proyectos");
      const projectsData = await projectsResponse.json();
      setProyectosList(projectsData.proyectos.map((p: any) => ({ id: p.id, nombre: p.nombre })));

      // Set default proyectoId if available
      if (projectsData.proyectos.length > 0 && !newActivity.proyectoId) {
        setNewActivity(prev => ({ ...prev, proyectoId: projectsData.proyectos[0].id }));
      }

      // Fetch activities
      const params = new URLSearchParams();
      if (filtros.search) params.append("search", filtros.search);
      if (filtros.estado !== "all") params.append("estado", filtros.estado);
      if (filtros.tipo !== "all") params.append("tipo", filtros.tipo);
      if (filtros.prioridad !== "all") params.append("prioridad", filtros.prioridad);
      if (filtros.proyectoId !== "all") params.append("proyectoId", filtros.proyectoId);

      const activitiesResponse = await fetch(`/api/operaciones/actividades?${params}`);
      const activitiesData = await activitiesResponse.json();
      setActividades(activitiesData.actividades || []);

    } catch (error) {
      console.error("Error fetching initial data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitNewActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting new activity:", newActivity);
    try {
      const response = await fetch("/api/operaciones/actividades", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newActivity),
      });
      if (response.ok) {
        setIsNewActivityModalOpen(false);
        setNewActivity({ // Reset form
          proyectoId: proyectosList[0]?.id || "",
          descripcion: '',
          tipo: "Técnica",
          prioridad: "Media",
          estado: "Pendiente",
          fechaVencimiento: new Date().toISOString().split('T')[0],
          responsables: [],
        });
        fetchInitialData(); // Refresh activities list and projects
      } else {
        console.error("Failed to add new activity");
      }
    } catch (error) {
      console.error("Error adding new activity:", error);
    }
  };

  const handleOpenDetail = (actividad: Actividad) => {
    setSelectedActividad(actividad);
    setIsDetailOpen(true);
  };
  
  const handleAddResponsible = (responsibleName: string) => {
    setNewActivity(prev => ({
      ...prev,
      responsables: [...prev.responsables, responsibleName],
    }));
  };

  const handleRemoveResponsible = (responsibleName: string) => {
    setNewActivity(prev => ({
      ...prev,
      responsables: prev.responsables.filter(resp => resp !== responsibleName),
    }));
  };

  // Calcular estadísticas
  const stats = {
    total: actividades.length,
    pendientes: actividades.filter(a => a.estado === "Pendiente").length,
    enProgreso: actividades.filter(a => a.estado === "En Progreso").length,
    completadas: actividades.filter(a => a.estado === "Completada" || a.estado === "Validada").length,
    bloqueadas: actividades.filter(a => a.estado === "Bloqueada").length,
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
            <h1 className="text-3xl font-black text-primary tracking-tight">Actividades</h1>
          </div>
          <p className="text-muted-foreground mt-1 font-medium">Gestión de actividades y tareas por proyecto.</p>
        </div>
        <Button 
          className="gap-2 font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
          onClick={() => setIsNewActivityModalOpen(true)}
        >
          <Plus className="w-4 h-4" /> Nueva Actividad
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatsCard
          label="Total"
          value={stats.total}
          color="text-primary"
        />
        <StatsCard
          label="Pendientes"
          value={stats.pendientes}
          color="text-gray-600"
        />
        <StatsCard
          label="En Progreso"
          value={stats.enProgreso}
          color="text-blue-600"
        />
        <StatsCard
          label="Completadas"
          value={stats.completadas}
          color="text-green-600"
        />
        <StatsCard
          label="Bloqueadas"
          value={stats.bloqueadas}
          color="text-error"
        />
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl border border-border shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por descripción o proyecto..."
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
                <SelectItem value="Pendiente">Pendiente</SelectItem>
                <SelectItem value="En Progreso">En Progreso</SelectItem>
                <SelectItem value="Completada">Completada</SelectItem>
                <SelectItem value="Validada">Validada</SelectItem>
                <SelectItem value="Bloqueada">Bloqueada</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filtros.tipo}
              onValueChange={(val) => setFiltros({ ...filtros, tipo: val })}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los Tipos</SelectItem>
                <SelectItem value="Técnica">Técnica</SelectItem>
                <SelectItem value="Administrativa">Administrativa</SelectItem>
                <SelectItem value="Logística">Logística</SelectItem>
                <SelectItem value="Documental">Documental</SelectItem>
                <SelectItem value="Validación">Validación</SelectItem>
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
                <SelectItem value="Baja">Baja</SelectItem>
                <SelectItem value="Media">Media</SelectItem>
                <SelectItem value="Alta">Alta</SelectItem>
                <SelectItem value="Crítica">Crítica</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Tabla de Actividades */}
      <div className="rounded-xl border border-border bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-bold text-primary">ACTIVIDAD</TableHead>
              <TableHead className="font-bold text-primary">PROYECTO</TableHead>
              <TableHead className="font-bold text-primary">TIPO</TableHead>
              <TableHead className="font-bold text-primary">RESPONSABLES</TableHead>
              <TableHead className="font-bold text-primary">FECHA VENC.</TableHead>
              <TableHead className="font-bold text-primary">PROGRESO</TableHead>
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
                    <span>Cargando actividades...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : actividades.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No se encontraron actividades
                </TableCell>
              </TableRow>
            ) : (
              actividades.map((actividad) => (
                <TableRow key={actividad.id} className="hover:bg-muted/10 transition-colors group">
                  <TableCell>
                    <div>
                      <p className={cn(
                        "font-bold text-sm",
                        actividad.estado === "Completada" || actividad.estado === "Validada"
                          ? "text-muted-foreground line-through"
                          : "text-primary"
                      )}>
                        {actividad.descripcion}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={cn("text-[9px]", prioridadColors[actividad.prioridad])}>
                          {actividad.prioridad}
                        </Badge>
                        {actividad.diasRestantes !== null && actividad.diasRestantes !== undefined && (
                          <span className={cn(
                            "text-[10px] font-black uppercase",
                            actividad.diasRestantes < 0 ? "text-error" :
                              actividad.diasRestantes <= 3 ? "text-warning" :
                                "text-success"
                          )}>
                            {actividad.diasRestantes < 0
                              ? `Vencida hace ${Math.abs(actividad.diasRestantes)} días`
                              : `${actividad.diasRestantes} días`}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-bold text-primary">
                        {actividad.proyecto?.codigo || "Sin código"}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate max-w-[150px]">
                        {actividad.proyecto?.nombre || "Sin proyecto"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("text-[10px] font-bold uppercase", tipoColors[actividad.tipo])}>
                      {actividad.tipo}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex -space-x-2">
                      {actividad.responsables?.slice(0, 3).map((resp, idx) => (
                        <div
                          key={idx}
                          className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-bold border-2 border-white"
                        >
                          {resp?.charAt(0) || "?"}
                        </div>
                      ))}
                      {actividad.responsables?.length > 3 && (
                        <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-[10px] font-bold border-2 border-white">
                          +{actividad.responsables.length - 3}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-bold text-slate-600">
                    {actividad.fechaVencimiento || "-"}
                  </TableCell>
                  <TableCell>
                    <div className="w-full max-w-[80px] space-y-1">
                      <div className="flex justify-between text-[10px] font-black">
                        <span>{actividad.progresoCalculado || actividad.progreso}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full transition-all",
                            actividad.estado === "Completada" || actividad.estado === "Validada"
                              ? "bg-success"
                              : "bg-primary"
                          )}
                          style={{ width: `${actividad.progresoCalculado || actividad.progreso}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("border-none font-black text-[9px] uppercase tracking-wider", estadoColors[actividad.estado])}>
                      {actividad.estado}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 font-bold text-[10px] uppercase gap-1 border-primary text-primary hover:bg-primary hover:text-white"
                      onClick={() => handleOpenDetail(actividad)}
                    >
                      <Eye className="w-3 h-3" /> Ver
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal de Detalle */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] p-0 border-none bg-background">
          <DialogHeader className="p-6 bg-primary text-white rounded-t-lg">
            <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
              <ClipboardList className="w-6 h-6 text-accent" />
              Detalle de Actividad
            </DialogTitle>
          </DialogHeader>
          <div className="p-6">
            {selectedActividad && (
              <div className="space-y-6">
                {/* Info Principal */}
                <div>
                  <h3 className="text-xl font-black text-primary mb-2">
                    {selectedActividad.descripcion}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge className={cn(estadoColors[selectedActividad.estado])}>
                      {selectedActividad.estado}
                    </Badge>
                    <Badge className={cn(tipoColors[selectedActividad.tipo])}>
                      {selectedActividad.tipo}
                    </Badge>
                    <Badge className={cn(prioridadColors[selectedActividad.prioridad])}>
                      {selectedActividad.prioridad}
                    </Badge>
                  </div>
                </div>

                {/* Subtareas */}
                {selectedActividad.subtareas && selectedActividad.subtareas.length > 0 && (
                  <div>
                    <h4 className="font-black text-primary uppercase tracking-tight mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      Subtareas ({selectedActividad.subtareas.length})
                    </h4>
                    <div className="space-y-2">
                      {selectedActividad.subtareas.map((sub: any) => (
                        <div key={sub.id} className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
                          <div className={cn(
                            "w-5 h-5 rounded border-2 flex items-center justify-center",
                            sub.completada ? "bg-success border-success" : "border-border"
                          )}>
                            {sub.completada && <CheckCircle2 className="w-3 h-3 text-white" />}
                          </div>
                          <span className={cn("text-sm font-bold", sub.completada ? "line-through text-muted-foreground" : "text-primary")}>
                            {sub.descripcion}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Validaciones */}
                {selectedActividad.validacionesRequeridas && selectedActividad.validacionesRequeridas.length > 0 && (
                  <div>
                    <h4 className="font-black text-primary uppercase tracking-tight mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-warning" />
                      Validaciones ({selectedActividad.validacionesRequeridas.length})
                    </h4>
                    <div className="space-y-2">
                      {selectedActividad.validacionesRequeridas.map((val: any) => (
                        <div key={val.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                          <div>
                            <p className="text-sm font-bold text-primary">{val.tipo}</p>
                            <p className="text-[10px] text-muted-foreground">Área: {val.area}</p>
                          </div>
                          <Badge className={cn(
                            "text-[10px]",
                            val.estado === "Aprobada" ? "bg-success text-white" :
                              val.estado === "Rechazada" ? "bg-error text-white" :
                                "bg-warning text-white"
                          )}>
                            {val.estado}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
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
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-white p-4 rounded-xl border border-border shadow-sm transition-all hover:shadow-md">
      <p className="text-[10px] font-black text-muted-foreground uppercase">{label}</p>
      <p className={cn("text-2xl font-black", color)}>{value}</p>
    </div>
  );
}