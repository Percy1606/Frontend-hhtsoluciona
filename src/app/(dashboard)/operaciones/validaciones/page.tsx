"use client";

import { useState } from "react";
import { useOperacionesStore } from "@/store/operaciones-store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatDate } from "@/lib/utils";
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
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


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
  const { getValidaciones, aprobarValidacion, rechazarValidacion, responsables } = useOperacionesStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArea, setSelectedArea] = useState("all");
  const [selectedEstado, setSelectedEstado] = useState("all");

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

  const validaciones = getValidaciones();

  // Filter validations
  const filteredValidaciones = validaciones.filter((v) => {
    const matchesSearch =
      v.actividad.descripcion.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.proyecto.codigo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.proyecto.nombre.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesArea = selectedArea === "all" || v.validacion.area === selectedArea;
    const matchesEstado = selectedEstado === "all" || v.validacion.estado === selectedEstado;

    return matchesSearch && matchesArea && matchesEstado;
  });

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

  const handleConfirmAction = () => {
    const { type, proyectoId, actividadId, validacionId, observaciones } = actionDialog;
    if (type === "aprobar") {
      aprobarValidacion(proyectoId, actividadId, validacionId, observaciones);
    } else {
      if (!observaciones.trim()) return; // Required for rejection
      rechazarValidacion(proyectoId, actividadId, validacionId, observaciones);
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
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 p-2 rounded-lg">
          <CheckSquare className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-primary tracking-tight">Puntos de Control / Validaciones</h1>
          <p className="text-muted-foreground mt-1 font-medium">Aprobaciones técnicas y operativas para el avance del proyecto.</p>
        </div>
      </div>

      {/* Stats Quick Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-border shadow-sm">
          <p className="text-[10px] font-black text-muted-foreground uppercase">Pendientes de Firma</p>
          <p className="text-2xl font-black text-warning">
            {validaciones.filter((v) => v.validacion.estado === "Pendiente").length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-border shadow-sm">
          <p className="text-[10px] font-black text-muted-foreground uppercase">Aprobadas</p>
          <p className="text-2xl font-black text-success">
            {validaciones.filter((v) => v.validacion.estado === "Aprobada").length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-border shadow-sm">
          <p className="text-[10px] font-black text-muted-foreground uppercase">Rechazadas</p>
          <p className="text-2xl font-black text-error">
            {validaciones.filter((v) => v.validacion.estado === "Rechazada").length}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl border border-border shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full md:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código de proyecto o actividad..."
            className="pl-10 h-10 border-border"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <Select value={selectedArea} onValueChange={(val) => setSelectedArea(val ?? "")}>
            <SelectTrigger className="w-44 h-10">
              <SelectValue placeholder="Área Responsable" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las Áreas</SelectItem>
              <SelectItem value="Logística y Recursos">Logística y Recursos</SelectItem>
              <SelectItem value="Ingeniería y Supervisión Técnica">Ingeniería y Supervisión Técnica</SelectItem>
              <SelectItem value="Gestión Documentaria y Expedientes Técnicos">Gestión Documentaria</SelectItem>
              <SelectItem value="Operaciones de Campo y Control de Obra">Operaciones de Campo</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedEstado} onValueChange={(val) => setSelectedEstado(val ?? "")}>
            <SelectTrigger className="w-40 h-10">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los Estados</SelectItem>
              <SelectItem value="Pendiente">Pendientes</SelectItem>
              <SelectItem value="Aprobada">Aprobadas</SelectItem>
              <SelectItem value="Rechazada">Rechazadas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grid of Validations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredValidaciones.length === 0 ? (
          <div className="col-span-2 p-8 text-center text-muted-foreground">
            No se encontraron puntos de control que requieran validación.
          </div>
        ) : (
          filteredValidaciones.map(({ proyecto, actividad, validacion }) => (
            <Card key={validacion.id} className="hover:border-primary/30 transition-all flex flex-col">
              <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
                {/* Header */}
                <div className="space-y-1">
                  <div className="flex justify-between items-start gap-2">
                    <Badge className="bg-primary text-white font-black text-[9px] uppercase tracking-wide">
                      {proyecto.codigo}
                    </Badge>
                    <Badge className={cn("text-[9px] font-black uppercase border-none", statusColors[validacion.estado])}>
                      {validacion.estado}
                    </Badge>
                  </div>
                  <h4 className="font-bold text-sm text-slate-700 tracking-tight leading-snug">
                    Actividad: {actividad.descripcion}
                  </h4>
                  <p className="text-[10px] text-muted-foreground font-black uppercase">
                    PROYECTO: {proyecto.nombre}
                  </p>
                </div>

                {/* Validation Info */}
                <div className="bg-muted/30 p-3 rounded-lg border text-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-600">Tipo: {validacion.tipo}</span>
                    <Badge className={cn("text-[8px] font-black uppercase border-none", areaColors[validacion.area])}>
                      Firma: {validacion.area}
                    </Badge>
                  </div>

                  {validacion.validadoPor && (
                    <div className="text-[10px] text-muted-foreground space-y-1 font-bold">
                      <p className="flex items-center gap-1">
                        <User className="w-3 h-3" /> Validado por: {validacion.validadoPor}
                      </p>
                      {validacion.fechaValidacion && (
                        <p className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Fecha: {formatDate(validacion.fechaValidacion)}
                        </p>
                      )}
                    </div>
                  )}

                  {validacion.observaciones && (
                    <p className="text-[11px] leading-relaxed text-slate-700 bg-white p-2 rounded border border-dashed mt-1">
                      <strong>Observaciones:</strong> {validacion.observaciones}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-2 border-t flex justify-between items-center gap-2 mt-auto">
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold">
                    <span>Resp. Principal: {getResponsableName(actividad.responsablePrincipalId)}</span>
                  </div>

                  {validacion.estado === "Pendiente" ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-error text-error hover:bg-error hover:text-white font-bold"
                        onClick={() =>
                          handleOpenAction("rechazar", proyecto.id, actividad.id, validacion.id)
                        }
                      >
                        <X className="w-3 h-3 mr-1" /> Rechazar
                      </Button>
                      <Button
                        size="sm"
                        className="h-7 text-xs bg-success hover:bg-success/90 text-white font-bold"
                        onClick={() =>
                          handleOpenAction("aprobar", proyecto.id, actividad.id, validacion.id)
                        }
                      >
                        <Check className="w-3 h-3 mr-1" /> Aprobar
                      </Button>
                    </div>
                  ) : (
                    <div className="text-[10px] font-black text-muted-foreground flex items-center gap-1">
                      <FileCheck className="w-4 h-4 text-success" /> Validado
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Approve/Reject Interaction Dialog */}
      <Dialog open={actionDialog.open} onOpenChange={(open) => setActionDialog((prev) => ({ ...prev, open }))}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className={cn(
              "flex items-center gap-2 font-black uppercase text-lg",
              actionDialog.type === "aprobar" ? "text-success" : "text-error"
            )}>
              {actionDialog.type === "aprobar" ? (
                <>
                  <CheckSquare className="w-5 h-5" />
                  Confirmar Aprobación
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5" />
                  Rechazar Punto de Control
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-xs text-muted-foreground">
              {actionDialog.type === "aprobar"
                ? "El punto de control será marcado como aprobado. El progreso del proyecto se recalculará según corresponda."
                : "Al rechazar el punto de control, la actividad asociada quedará Bloqueada temporalmente hasta que se solventen los hallazgos."}
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="action-obs" className="text-xs font-bold">
                Observaciones/Comentarios {actionDialog.type === "rechazar" && "*"}
              </Label>
              <Textarea
                id="action-obs"
                placeholder={actionDialog.type === "aprobar" ? "Observaciones opcionales..." : "Escriba detalladamente el motivo del rechazo..."}
                value={actionDialog.observaciones}
                onChange={(e) => setActionDialog((prev) => ({ ...prev, observaciones: e.target.value }))}
                rows={3}
                className="text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog((prev) => ({ ...prev, open: false }))}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmAction}
              disabled={actionDialog.type === "rechazar" && !actionDialog.observaciones.trim()}
              className={cn(
                actionDialog.type === "aprobar" ? "bg-success hover:bg-success/90" : "bg-error hover:bg-error/90"
              )}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
