"use client";

import { useState, useEffect, useRef } from "react";
import { format, differenceInDays, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Calendar,
  FileText,
  Upload,
  Pencil,
  Trash2,
  Search,
  Plus,
  Eye,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface CertificadoEquipo {
  id: string;
  nombre: string;
  url: string;
  fechaVencimiento: string | null;
  observaciones: string | null; // Used as fecha de calibración
  tamano: string | null;
  fechaSubida: string;
  subtype: string;
}

export default function CertificadosEquipos() {
  const [certificados, setCertificados] = useState<CertificadoEquipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [certificadoToDelete, setCertificadoToDelete] = useState<CertificadoEquipo | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<"todos" | "vigentes" | "porVencer" | "vencidos">("todos");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  
  // Form state
  const [nombre, setNombre] = useState("");
  const [fechaCalibracion, setFechaCalibracion] = useState("");
  const [fechaVencimiento, setFechaVencimiento] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [existingPdf, setExistingPdf] = useState<{url: string, tamano: string | null} | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async (searchTerm = "") => {
    try {
      setLoading(true);
      const url = searchTerm ? `/logistica/certificados-equipos?search=${encodeURIComponent(searchTerm)}` : '/logistica/certificados-equipos';
      const data = await api.get<CertificadoEquipo[]>(url);
      setCertificados(data || []);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar los certificados");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadData(search);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  // Derived state
  const getEstado = (fechaVencimiento: string | null) => {
    if (!fechaVencimiento) return { estado: "Desconocido", variant: "default", days: 999 };
    const date = parseISO(fechaVencimiento);
    const days = differenceInDays(date, new Date());
    if (days < 0) return { estado: "Vencido", variant: "destructive", days };
    if (days <= 30) return { estado: "Por Vencer", variant: "warning", days };
    return { estado: "Vigente", variant: "success", days };
  };

  const stats = certificados.reduce((acc, cert) => {
    const { days } = getEstado(cert.fechaVencimiento);
    acc.total++;
    if (days < 0) acc.vencidos++;
    else if (days <= 30) acc.porVencer++;
    else acc.vigentes++;
    return acc;
  }, { total: 0, vigentes: 0, porVencer: 0, vencidos: 0 });

  // Filtered certificates (client-side)
  const filteredCertificados = certificados.filter((cert) => {
    // Filter by status
    if (filtroEstado !== "todos") {
      const { days } = getEstado(cert.fechaVencimiento);
      if (filtroEstado === "vigentes" && days <= 30) return false;
      if (filtroEstado === "porVencer" && (days < 0 || days > 30)) return false;
      if (filtroEstado === "vencidos" && days >= 0) return false;
    }
    // Filter by date range (on fechaVencimiento)
    if (fechaDesde && cert.fechaVencimiento) {
      if (cert.fechaVencimiento.split('T')[0] < fechaDesde) return false;
    }
    if (fechaHasta && cert.fechaVencimiento) {
      if (cert.fechaVencimiento.split('T')[0] > fechaHasta) return false;
    }
    return true;
  });

  const resetForm = () => {
    setNombre("");
    setFechaCalibracion("");
    setFechaVencimiento("");
    setFile(null);
    setExistingPdf(null);
    setEditingId(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleOpenEdit = (cert: CertificadoEquipo) => {
    setEditingId(cert.id);
    setNombre(cert.nombre);
    setFechaCalibracion(cert.observaciones ? cert.observaciones.split('T')[0] : "");
    setFechaVencimiento(cert.fechaVencimiento ? cert.fechaVencimiento.split('T')[0] : "");
    setExistingPdf(cert.url && cert.url !== "ELIMINADO" ? { url: cert.url, tamano: cert.tamano } : null);
    setFile(null);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !fechaCalibracion || !fechaVencimiento) {
      toast.error("Por favor completa todos los campos requeridos.");
      return;
    }
    if (!file && !editingId) {
      toast.error("Debes adjuntar un archivo PDF.");
      return;
    }

    try {
      setIsSubmitting(true);
      let pdfUrl = editingId ? (existingPdf?.url || "ELIMINADO") : "";
      let pdfTamano = editingId ? (existingPdf?.tamano || "") : "";

      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        const uploadRes = await api.post<{url: string, nombre: string, tipo: string, tamano: string}>('/logistica/upload', formData);
        pdfUrl = uploadRes.url;
        pdfTamano = uploadRes.tamano;
      }

      const payload = {
        nombre,
        fechaCalibracion,
        fechaVencimiento,
        url: pdfUrl,
        tamano: pdfTamano,
      };

      if (editingId) {
        await api.put(`/logistica/certificados-equipos/${editingId}`, payload);
        toast.success("Certificado actualizado correctamente.");
      } else {
        await api.post('/logistica/certificados-equipos', payload);
        toast.success("Certificado registrado correctamente.");
      }

      setIsDialogOpen(false);
      resetForm();
      loadData(search);
    } catch (error) {
      console.error(error);
      toast.error(editingId ? "Error al actualizar el certificado" : "Error al registrar el certificado");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!certificadoToDelete) return;
    try {
      setIsSubmitting(true);
      await api.delete(`/logistica/certificados-equipos/${certificadoToDelete.id}`);
      toast.success("Certificado eliminado.");
      setIsDeleteDialogOpen(false);
      setCertificadoToDelete(null);
      loadData(search);
    } catch (error) {
      console.error(error);
      toast.error("Error al eliminar el certificado.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      {(stats.vencidos > 0 || stats.porVencer > 0) && (
        <div className="flex flex-col gap-2">
          {stats.vencidos > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 animate-pulse shadow-sm">
              <ShieldAlert className="w-6 h-6 text-red-600 shrink-0" />
              <p className="text-sm font-semibold text-red-800">
                🚨 Hay {stats.vencidos} certificado(s) vencido(s) que requieren atención inmediata.
              </p>
            </div>
          )}
          {stats.porVencer > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3 animate-pulse shadow-sm">
              <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
              <p className="text-sm font-semibold text-amber-800">
                ⚠️ Hay {stats.porVencer} certificado(s) próximo(s) a vencer en los próximos 30 días.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Stats Cards - clickable as filters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          onClick={() => setFiltroEstado(filtroEstado === "todos" ? "todos" : "todos")}
          className={cn(
            "bg-white rounded-lg border shadow-sm p-4 flex items-center gap-4 cursor-pointer transition-all",
            filtroEstado === "todos" ? "ring-2 ring-blue-500 border-blue-300" : "hover:shadow-md"
          )}
        >
          <div className="bg-slate-100 p-3 rounded-full">
            <FileText className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-500">Total</p>
            <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
          </div>
        </div>
        <div
          onClick={() => setFiltroEstado(filtroEstado === "vigentes" ? "todos" : "vigentes")}
          className={cn(
            "bg-white rounded-lg border shadow-sm p-4 flex items-center gap-4 cursor-pointer transition-all",
            filtroEstado === "vigentes" ? "ring-2 ring-green-500 border-green-300" : "hover:shadow-md"
          )}
        >
          <div className="bg-green-100 p-3 rounded-full">
            <ShieldCheck className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-500">Vigentes</p>
            <p className="text-2xl font-bold text-green-700">{stats.vigentes}</p>
          </div>
        </div>
        <div
          onClick={() => setFiltroEstado(filtroEstado === "porVencer" ? "todos" : "porVencer")}
          className={cn(
            "bg-white rounded-lg border shadow-sm p-4 flex items-center gap-4 cursor-pointer transition-all",
            filtroEstado === "porVencer" ? "ring-2 ring-amber-500 border-amber-300" : "hover:shadow-md"
          )}
        >
          <div className="bg-amber-100 p-3 rounded-full">
            <Shield className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-500">Por Vencer</p>
            <p className="text-2xl font-bold text-amber-700">{stats.porVencer}</p>
          </div>
        </div>
        <div
          onClick={() => setFiltroEstado(filtroEstado === "vencidos" ? "todos" : "vencidos")}
          className={cn(
            "bg-white rounded-lg border shadow-sm p-4 flex items-center gap-4 cursor-pointer transition-all",
            filtroEstado === "vencidos" ? "ring-2 ring-red-500 border-red-300" : "hover:shadow-md"
          )}
        >
          <div className="bg-red-100 p-3 rounded-full">
            <ShieldX className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-500">Vencidos</p>
            <p className="text-2xl font-bold text-red-700">{stats.vencidos}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b flex flex-col gap-3 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar equipo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-white"
              />
            </div>
            <Button className="gap-2 w-full sm:w-auto shadow-sm" onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4" />
              NUEVO CERTIFICADO
            </Button>
          </div>
          {/* Date range filter */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-black uppercase text-slate-500 whitespace-nowrap">Vencimiento desde:</label>
              <Input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="h-8 text-xs bg-white w-[150px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-black uppercase text-slate-500 whitespace-nowrap">Hasta:</label>
              <Input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="h-8 text-xs bg-white w-[150px]"
              />
            </div>
            {(fechaDesde || fechaHasta || filtroEstado !== "todos") && (
              <button
                onClick={() => { setFechaDesde(""); setFechaHasta(""); setFiltroEstado("todos"); }}
                className="text-[10px] font-bold text-blue-600 hover:text-blue-800 underline underline-offset-2"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>
        
        <div className="relative w-full overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                <TableHead className="w-[50px] text-center text-[10px] font-black uppercase text-slate-500">N°</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-slate-500">Equipo</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-slate-500">Fechas</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-slate-500 text-center">Estado</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-slate-500 text-center">Certificado</TableHead>
                <TableHead className="w-[100px] text-[10px] font-black uppercase text-slate-500 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-sm font-medium text-slate-500">
                    Cargando certificados...
                  </TableCell>
                </TableRow>
              ) : filteredCertificados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-sm font-medium text-slate-500">
                    {certificados.length > 0 ? "No hay certificados con los filtros seleccionados." : "No se encontraron certificados."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredCertificados.map((cert, idx) => {
                  const estadoInfo = getEstado(cert.fechaVencimiento);
                  
                  // Row background highlighting based on status
                  const rowBg = estadoInfo.days < 0 
                    ? "bg-red-50/30 hover:bg-red-50/60 transition-colors" 
                    : estadoInfo.days <= 30 
                      ? "bg-amber-50/30 hover:bg-amber-50/60 transition-colors" 
                      : "transition-colors hover:bg-slate-50/50";

                  return (
                    <TableRow key={cert.id} className={rowBg}>
                      <TableCell className="text-center text-[11px] text-slate-500 font-bold">
                        {idx + 1}
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-sm text-slate-800">{cert.nombre}</div>
                        {cert.tamano && (
                          <div className="text-[10px] text-slate-500 mt-0.5 font-medium">{cert.tamano}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-bold uppercase text-[9px] text-slate-500">Calibrado:</span>
                            <span className="font-medium">{cert.observaciones ? format(parseISO(cert.observaciones), 'dd/MM/yyyy', { locale: es }) : '-'}</span>
                          </div>
                          <div className={cn(
                            "flex items-center gap-1.5 text-[11px]",
                            estadoInfo.days < 0 ? "text-red-700 font-bold" : 
                            estadoInfo.days <= 30 ? "text-amber-700 font-bold" : "text-slate-600"
                          )}>
                            <Calendar className={cn("w-3.5 h-3.5", estadoInfo.days <= 30 ? "text-current" : "text-slate-400")} />
                            <span className={cn("font-bold uppercase text-[9px]", estadoInfo.days <= 30 ? "text-current" : "text-slate-500")}>Vence:</span>
                            <span className="font-medium">{cert.fechaVencimiento ? format(parseISO(cert.fechaVencimiento), 'dd/MM/yyyy', { locale: es }) : '-'}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant="outline"
                          className={cn(
                            "text-[10px] font-black uppercase tracking-wider",
                            estadoInfo.variant === "success" && "bg-green-50 text-green-700 border-green-200",
                            estadoInfo.variant === "warning" && "bg-amber-50 text-amber-700 border-amber-200",
                            estadoInfo.variant === "destructive" && "bg-red-50 text-red-700 border-red-200"
                          )}
                        >
                          {estadoInfo.estado}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {cert.url && cert.url !== "ELIMINADO" ? (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 gap-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-bold"
                            onClick={() => window.open(api.getFileUrl(cert.url), '_blank')}
                          >
                            <Eye className="w-4 h-4" />
                            <span className="text-[11px] uppercase">Ver PDF</span>
                          </Button>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Sin archivo adjunto</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                            onClick={() => handleOpenEdit(cert)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                            onClick={() => {
                              setCertificadoToDelete(cert);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        if (!open) resetForm();
        setIsDialogOpen(open);
      }}>
        <DialogContent className="sm:max-w-[520px] bg-white p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-lg font-bold text-slate-900">
              {editingId ? "Editar" : "Registrar"} Certificado de Equipo
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Completa los datos del certificado del equipo y sube el documento PDF.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="nombre" className="text-[11px] font-bold uppercase text-slate-700">
                Nombre del Equipo <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Estación Total Leica TS06"
                className="h-10"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="fechaCalibracion" className="text-[11px] font-bold uppercase text-slate-700">
                  Fecha de Calibración <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="fechaCalibracion"
                  type="date"
                  value={fechaCalibracion}
                  onChange={(e) => setFechaCalibracion(e.target.value)}
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fechaVencimiento" className="text-[11px] font-bold uppercase text-slate-700">
                  Fecha de Vencimiento <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="fechaVencimiento"
                  type="date"
                  value={fechaVencimiento}
                  onChange={(e) => setFechaVencimiento(e.target.value)}
                  className="h-10"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase text-slate-700">
                Documento PDF {editingId ? "(Opcional si ya existe)" : <span className="text-red-500">*</span>}
              </Label>
              <div 
                className={cn(
                  "border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer text-center",
                  file ? "border-blue-500 bg-blue-50/50" : "border-slate-300 bg-slate-50 hover:bg-slate-100"
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={(e) => {
                    const selected = e.target.files?.[0];
                    if (selected && selected.type === "application/pdf") {
                      setFile(selected);
                    } else if (selected) {
                      toast.error("Por favor selecciona un archivo PDF válido");
                    }
                  }}
                />
                <Upload className={cn("w-7 h-7 transition-colors", file ? "text-blue-500" : existingPdf ? "text-green-500" : "text-slate-400")} />
                <div className="text-center">
                  {file ? (
                    <>
                      <p className="text-xs font-semibold text-blue-600 truncate max-w-[280px]" title={file.name}>{file.name}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Archivo seleccionado (listo para guardar)</p>
                    </>
                  ) : existingPdf ? (
                    <>
                      <p className="text-xs font-semibold text-green-600 truncate max-w-[280px]" title={existingPdf.url.split(/[/\\]/).pop()}>
                        {existingPdf.url.split(/[/\\]/).pop()}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Documento actual (haz clic para reemplazar)</p>
                    </>
                  ) : (
                    <>
                      <p className="text-xs font-semibold text-slate-700">Haz clic para subir un PDF</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Solo archivos PDF hasta 50MB</p>
                    </>
                  )}
                </div>
                {(file || existingPdf) && (
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="mt-1 h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      setExistingPdf(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Quitar documento
                  </Button>
                )}
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
                {isSubmitting ? "Guardando..." : "Guardar Certificado"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px] bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Confirmar Eliminación
            </DialogTitle>
            <DialogDescription className="pt-2 text-xs text-slate-600">
              ¿Estás seguro de que deseas eliminar el certificado del equipo <strong>{certificadoToDelete?.nombre}</strong>? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 mt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting ? "Eliminando..." : "Eliminar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
