"use client";

import { useState } from "react";
import { useOperacionesStore } from "@/store/operaciones-store";
import { useAuthStore } from "@/store/auth-store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  CheckSquare,
  Search,
  Check,
  X,
  AlertTriangle,
  FileCheck,
  Calendar,
  User,
  Paperclip,
  FilterX,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EstadoActividad } from "@/lib/types";


const statusColors: Record<string, string> = {
  "Pendiente": "bg-warning text-white",
  "Aprobada": "bg-success text-white",
  "Rechazada": "bg-error text-white",
  "Observada": "bg-purple-100 text-purple-700",
};

const areaColors: Record<string, string> = {
  "Logística y Recursos": "bg-blue-500 text-white",
  "Ingeniería y Supervisión Técnica": "bg-green-500 text-white",
  "Gestión Documentaria y Expedientes Técnicos": "bg-orange-500 text-white",
  "Operaciones de Campo y Control de Obra": "bg-purple-500 text-white",
};

export default function ValidacionesPage() {
  const { user } = useAuthStore();
  const { getValidaciones, aprobarValidacion, rechazarValidacion, responsables, updateActividad } = useOperacionesStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArea, setSelectedArea] = useState("all");
  const [selectedEstado, setSelectedEstado] = useState("Pendiente");
  const [currentPage, setCurrentPage] = useState(1);
  const [filterMode, setFilterMode] = useState<"all" | "mine" | "urgent">("all");
  const itemsPerPage = 12; // Aumentamos por página ya que son más pequeñas

  // Interaction dialog state
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    type: "aprobar" | "rechazar";
    proyectoId: string;
    actividadId: string;
    validacionId: string;
    observaciones: string;
  }>({
    open: false,
    type: "aprobar",
    proyectoId: "",
    actividadId: "",
    validacionId: "",
    observaciones: "",
  });

  const allValidaciones = getValidaciones();

  // 1. FILTRAR POR PERMISOS Y MODOS RÁPIDOS
  const validacionesBase = allValidaciones.filter((v) => {
    // Seguridad base
    const isLiderProyecto = user?.responsable?.id === v.proyecto.responsablePrincipalId;
    const isAdmin = user?.rol === 'ADMIN';
    if (!isAdmin && !isLiderProyecto) return false;

    // Filtros rápidos
    if (filterMode === "mine") return isLiderProyecto;
    if (filterMode === "urgent") {
        const isCritical = v.actividad.prioridad === 'Crítica';   
        const isLate = v.actividad.fechaVencimiento && new Date(v.actividad.fechaVencimiento) < new Date();
        return isCritical || isLate || v.proyecto.semaforo === 'Rojo';
    }
    
    return true;
  });

  // 2. FILTRAR POR UI
  const filteredValidaciones = validacionesBase.filter((v) => {
    const matchesSearch =
      v.actividad.descripcion.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.proyecto.codigo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.proyecto.nombre.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesArea = selectedArea === "all" || v.validacion.area === selectedArea;
    const matchesEstado = selectedEstado === "all" || v.validacion.estado === selectedEstado;

    return matchesSearch && matchesArea && matchesEstado;
  });

  // 3. ORDENAR POR PRIORIDAD (Crítica primero, luego por fecha)
  const sortedValidaciones = [...filteredValidaciones].sort((a, b) => {
    // Prioridad crítica arriba
    const prioA = (a.actividad.prioridad === 'Crítica') ? 1 : 0;
    const prioB = (b.actividad.prioridad === 'Crítica') ? 1 : 0;
    if (prioA !== prioB) return prioB - prioA;

    // Luego Pendientes primero que validados
    if (a.validacion.estado === 'Pendiente' && b.validacion.estado !== 'Pendiente') return -1;
    if (a.validacion.estado !== 'Pendiente' && b.validacion.estado === 'Pendiente') return 1;

    return 0;
  });

  // 4. PAGINACIÓN
  const totalItems = sortedValidaciones.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedValidaciones = sortedValidaciones.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetFiltros = () => {
    setSearchQuery("");
    setSelectedArea("all");
    setSelectedEstado("all");
    setCurrentPage(1);
    setFilterMode("all");
  };

  const handleOpenAction = (
    type: "aprobar" | "rechazar",
    proyectoId: string,
    actividadId: string,
    validacionId: string
  ) => {
    setActionDialog({
      open: true,
      type,
      proyectoId,
      actividadId,
      validacionId,
      observaciones: "",
    });
  };

  const handleConfirmAction = async () => {
    const { type, proyectoId, actividadId, validacionId, observaciones } = actionDialog;
    try {
      // Caso 1: Validación de Cierre Automática (ID empieza con cierre-)
      if (validacionId.startsWith('cierre-')) {
        const nuevoEstado = type === "aprobar" ? "Validada" : "EnProgreso" as EstadoActividad;
        const vData = validacionesBase.find(v => v.actividad.id === actividadId);
        if (!vData) return;
        const actividad = vData.actividad;
        
        await updateActividad(proyectoId, {
          ...actividad,
          estado: nuevoEstado,
          observaciones: type === "rechazar" ? observaciones : actividad.observaciones
        });
        
        toast.success(type === "aprobar" ? "Actividad Finalizada" : "Actividad Observada");
      } 
      // Caso 2: Puntos de Control Explícitos (Prisma Model)
      else {
        if (type === "aprobar") {
          await aprobarValidacion(proyectoId, actividadId, validacionId, observaciones);
        } else {
          if (!observaciones.trim()) return; 
          await rechazarValidacion(proyectoId, actividadId, validacionId, observaciones);
        }
      }
    } catch (error) {
      toast.error("Error al procesar validación");
    }
    setActionDialog((prev) => ({ ...prev, open: false }));
  };

  const getResponsableName = (id: string) => {
    if (!id) return "SIN ASIGNAR";
    const resp = responsables.find(r => r.id === id);
    if (resp) return resp.nombre.toUpperCase();
    
    // Si es un UUID (contiene guiones y es largo), lo ocultamos
    if (id.includes('-') && id.length > 20) return "RESPONSABLE EXTERNO";
    
    return id.toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
                <CheckSquare className="w-6 h-6 text-primary" />
            </div>
            <div>
                <h1 className="text-3xl font-black text-primary tracking-tight">Control de Validaciones</h1>
                <p className="text-muted-foreground mt-0.5 font-medium text-sm italic">Gestión de aprobaciones finales y cumplimiento técnico.</p>
            </div>
        </div>

        {/* MODO DE FILTRADO RÁPIDO */}
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
            <Button 
                variant={filterMode === 'all' ? "outline" : "ghost"}
                size="sm"
                onClick={() => { setFilterMode('all'); setCurrentPage(1); }}
                className={cn("h-8 font-black uppercase text-[9px] tracking-widest rounded-lg px-4 shadow-none", filterMode === 'all' && "shadow-sm border-slate-200")}
            >
                Todas
            </Button>
            <Button 
                variant={filterMode === 'mine' ? "outline" : "ghost"}
                size="sm"
                onClick={() => { setFilterMode('mine'); setCurrentPage(1); }}
                className={cn("h-8 font-black uppercase text-[9px] tracking-widest rounded-lg px-4 shadow-none", filterMode === 'mine' && "shadow-sm border-slate-200")}
            >
                Solo mis proyectos
            </Button>
            <Button 
                variant={filterMode === 'urgent' ? "outline" : "ghost"}
                size="sm"
                onClick={() => { setFilterMode('urgent'); setCurrentPage(1); }}
                className={cn("h-8 font-black uppercase text-[9px] tracking-widest rounded-lg px-4 shadow-none text-error", filterMode === 'urgent' && "bg-error/10 border-error/20")}
            >
                Urgentes
            </Button>
        </div>
      </div>

      {/* Stats Quick Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-border shadow-sm">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pendientes</p>
          <p className="text-2xl font-black text-warning">
            {validacionesBase.filter((v) => v.validacion.estado === "Pendiente").length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-border shadow-sm">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Aprobadas</p>
          <p className="text-2xl font-black text-success">
            {validacionesBase.filter((v) => v.validacion.estado === "Aprobada").length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-border shadow-sm">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Rechazadas</p>
          <p className="text-2xl font-black text-error">
            {validacionesBase.filter((v) => v.validacion.estado === "Rechazada").length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-border shadow-sm bg-primary/5">
          <p className="text-[9px] font-black text-primary uppercase tracking-widest">Total Vista</p>
          <p className="text-2xl font-black text-primary">{totalItems}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-5 rounded-xl border border-border shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-end justify-between">
          <div className="flex-1 w-full space-y-1.5">
            <Label className="text-[10px] font-black uppercase text-primary tracking-widest ml-1">Buscador de Actividad</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Código de proyecto o actividad..."
                className="pl-10 h-10 border-border bg-slate-50/50 focus:bg-white transition-all font-bold text-xs rounded-lg shadow-none"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <div className="space-y-1.5">
              <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Área Responsable</Label>
              <Select value={selectedArea} onValueChange={(val) => { setSelectedArea(val ?? ""); setCurrentPage(1); }}>
                <SelectTrigger className="w-44 h-10 font-bold text-xs rounded-lg border-border bg-white shadow-none">
                  <SelectValue placeholder="Área">
                    {selectedArea !== "all" ? 
                      <span className="uppercase">{selectedArea}</span> : 
                      <span className="text-[11px] text-slate-400 uppercase tracking-tighter italic">TODAS LAS ÁREAS</span>
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-white border-border shadow-xl">
                  <SelectItem value="all" className="text-[11px] text-slate-400 uppercase tracking-tighter italic">TODAS LAS ÁREAS</SelectItem>
                  <SelectItem value="Logística y Recursos">Logística y Recursos</SelectItem>
                  <SelectItem value="Ingeniería y Supervisión Técnica">Ingeniería y Supervisión Técnica</SelectItem>
                  <SelectItem value="Gestión Documentaria y Expedientes Técnicos">Gestión Documentaria</SelectItem>
                  <SelectItem value="Operaciones de Campo y Control de Obra">Operaciones de Campo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Filtrar por Estado</Label>
              <Select value={selectedEstado} onValueChange={(val) => { setSelectedEstado(val ?? ""); setCurrentPage(1); }}>
                <SelectTrigger className="w-40 h-10 font-bold text-xs rounded-lg border-border bg-white shadow-none">
                  <SelectValue placeholder="Estado">
                    {selectedEstado !== "all" ? 
                      <span className="uppercase">{selectedEstado}</span> : 
                      <span className="text-[11px] text-slate-400 uppercase tracking-tighter italic">TODOS LOS ESTADOS</span>
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-white border-border shadow-xl">
                  <SelectItem value="all" className="text-[11px] text-slate-400 uppercase tracking-tighter italic">TODOS LOS ESTADOS</SelectItem>
                  <SelectItem value="Pendiente">PENDIENTE</SelectItem>
                  <SelectItem value="Aprobada">APROBADA</SelectItem>
                  <SelectItem value="Rechazada">RECHAZADA</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end self-end h-10">
              <Button 
                variant="ghost" 
                onClick={resetFiltros} 
                className="h-10 w-10 text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-100 hover:border-red-200 transition-all rounded-xl shadow-none"
                title="Limpiar filtros"
              >
                <FilterX className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Validations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {paginatedValidaciones.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-white rounded-xl border border-dashed border-slate-300">
            <CheckSquare className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 font-bold italic text-sm uppercase tracking-tight">No se encontraron puntos de control.</p>
          </div>
        ) : (
          paginatedValidaciones.map(({ proyecto, actividad, validacion }) => (
            <Card key={validacion.id} className="hover:border-primary/30 transition-all flex flex-col border-slate-200 shadow-sm bg-white overflow-hidden group">
              <CardContent className="p-0 flex-1 flex flex-col">
                {/* Header Proyecto - Compacto */}
                <div className="px-4 py-2 bg-slate-50/80 border-b border-slate-100 flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <Badge className="bg-primary text-white font-black text-[8px] uppercase tracking-wide rounded px-1.5 h-4 shadow-none">
                        {proyecto.codigo}
                    </Badge>
                    {(actividad.prioridad === 'Crítica') && (
                        <Badge className="bg-error text-white font-black text-[7px] uppercase px-1.5 h-3.5 shadow-none">URGENTE</Badge>
                    )}
                  </div>
                  <Badge className={cn("text-[8px] font-black uppercase border-none px-1.5 h-4 shadow-none", statusColors[validacion.estado])}>
                    {validacion.estado}
                  </Badge>
                </div>
                
                <div className="p-4 flex-1 flex flex-col space-y-3">
                  <div className="space-y-0.5">
                    <h4 className="font-black text-xs text-slate-800 tracking-tight leading-snug group-hover:text-primary transition-colors min-h-[2.4em] line-clamp-2">
                      {actividad.descripcion}
                    </h4>
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-tighter truncate">
                      P: {proyecto.nombre}
                    </p>
                  </div>

                  {/* Validation Info - Compacto */}
                  <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100 text-[10px] space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col gap-0">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Control</span>
                        <span className="font-bold text-slate-700 truncate max-w-[100px]">{validacion.tipo}</span>
                      </div>
                      <Badge className={cn("text-[7px] font-black uppercase border-none h-3.5 px-1.5", areaColors[validacion.area])}>
                        {validacion.area.split(' ')[0]}...
                      </Badge>
                    </div>

                    {validacion.observaciones && (
                      <div className="bg-white p-2 rounded-md border border-dashed border-slate-200 mt-1">
                        <p className="text-[9px] leading-tight text-slate-500 line-clamp-2 italic">
                          "{validacion.observaciones}"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions - Reducido */}
                  <div className="pt-3 border-t border-slate-100 flex justify-between items-center gap-2 mt-auto">
                    <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-black uppercase tracking-tighter truncate max-w-[120px]">
                      <div className={cn("w-1 h-1 rounded-full", (actividad.prioridad === 'Crítica') ? "bg-error animate-pulse" : "bg-accent")} />
                      <span className="truncate">{getResponsableName(actividad.responsablePrincipalId)}</span>
                    </div>

                    {validacion.estado === "Pendiente" ? (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-[9px] border-error text-error hover:bg-error hover:text-white font-black uppercase tracking-widest transition-all"
                          onClick={() =>
                            handleOpenAction("rechazar", proyecto.id, actividad.id, validacion.id)
                          }
                        >
                          Obs.
                        </Button>
                        <Button
                          size="sm"
                          className="h-7 px-2 text-[9px] bg-success hover:bg-success/90 text-white font-black uppercase tracking-widest shadow shadow-success/20 transition-all"
                          onClick={() =>
                            handleOpenAction("aprobar", proyecto.id, actividad.id, validacion.id)
                          }
                        >
                          OK
                        </Button>
                      </div>
                    ) : (
                      <div className="text-[8px] font-black text-success flex items-center gap-1 bg-success/10 px-2 py-1 rounded-full uppercase tracking-widest">
                        <FileCheck className="w-2.5 h-2.5" /> LISTO
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* PAGINACIÓN CONTROLES (Estilo Estandarizado) */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm mt-4">
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-2">
                Página {currentPage} de {totalPages} — Total: {totalItems} validaciones
            </p>
            <div className="flex gap-2 mr-2">
                <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                    className="h-7 px-4 font-black uppercase text-[9px] border-slate-200 bg-white"
                >
                    Anterior
                </Button>
                <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                    className="h-7 px-4 font-black uppercase text-[9px] border-slate-200 bg-white"
                >
                    Siguiente
                </Button>
            </div>
        </div>
      )}

      {/* Approve/Reject Interaction Dialog */}
      <Dialog open={actionDialog.open} onOpenChange={(open) => setActionDialog((prev) => ({ ...prev, open }))}>
        <DialogContent className="max-w-md p-0 border-none bg-white shadow-2xl overflow-hidden rounded-2xl">
          <DialogHeader className={cn(
            "p-6 text-white shrink-0",
            actionDialog.type === "aprobar" ? "bg-success" : "bg-error"
          )}>
            <DialogTitle className="flex items-center gap-3 font-black uppercase text-lg tracking-tight">
              {actionDialog.type === "aprobar" ? (
                <>
                  <CheckSquare className="w-6 h-6" />
                  Confirmar Aprobación
                </>
              ) : (
                <>
                  <AlertTriangle className="w-6 h-6" />
                  Observar Punto de Control
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="p-6 space-y-5 bg-white">
            <div className={cn(
              "p-4 rounded-xl text-xs font-bold leading-relaxed",
              actionDialog.type === "aprobar" ? "bg-success/10 text-success-foreground" : "bg-error/10 text-error-foreground"
            )}>
              {actionDialog.type === "aprobar"
                ? "Al aprobar, la actividad será marcada como VALIDADA oficialmente. Este cambio bloquea la edición de la tarea y actualiza el progreso real del proyecto."
                : "Al observar, la actividad regresará al estado EN PROGRESO. El técnico responsable recibirá una notificación con tus comentarios para realizar las correcciones."}
            </div>

            <div className="space-y-2">
              <Label htmlFor="action-obs" className="text-[10px] font-black uppercase text-primary tracking-widest ml-1">
                Comentarios / Observaciones {actionDialog.type === "rechazar" && <span className="text-error">*</span>}
              </Label>
              <Textarea
                id="action-obs"
                placeholder={actionDialog.type === "aprobar" ? "Escriba un comentario opcional..." : "Escriba detalladamente el motivo de la observación..."}
                value={actionDialog.observaciones}
                onChange={(e) => setActionDialog((prev) => ({ ...prev, observaciones: e.target.value }))}
                rows={4}
                className="text-xs font-bold border-slate-200 bg-slate-50/50 focus:bg-white transition-all rounded-xl shadow-none resize-none"
              />
            </div>
          </div>

          <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
            <Button 
              variant="ghost" 
              onClick={() => setActionDialog((prev) => ({ ...prev, open: false }))}
              className="h-11 flex-1 font-black uppercase text-[10px] tracking-widest text-slate-400 hover:bg-slate-100"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmAction}
              disabled={actionDialog.type === "rechazar" && !actionDialog.observaciones.trim()}
              className={cn(
                "h-11 flex-[2] font-black uppercase text-[10px] tracking-widest shadow-lg transition-all",
                actionDialog.type === "aprobar" 
                  ? "bg-success hover:bg-success/90 shadow-success/20" 
                  : "bg-error hover:bg-error/90 shadow-error/20"
              )}
            >
              {actionDialog.type === "aprobar" ? "Confirmar y Validar" : "Enviar Observación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
