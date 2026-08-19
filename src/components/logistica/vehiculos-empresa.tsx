"use client";

import { useState, useEffect, useRef } from "react";
import { format, differenceInDays, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  Car,
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
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface VehiculoData {
  id: string;
  nombre: string; // Placa
  numero: string; // Marca/Modelo
  fechaVencimiento: string | null; // Fecha más próxima a vencer
  observaciones: string | null; // JSON con los datos
}

export default function VehiculosEmpresa() {
  const [vehiculos, setVehiculos] = useState<VehiculoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [vehiculoToDelete, setVehiculoToDelete] = useState<VehiculoData | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<"todos" | "vigentes" | "porVencer" | "vencidos">("todos");
  
  // Form state
  const [placa, setPlaca] = useState("");
  const [marcaModelo, setMarcaModelo] = useState("");
  
  const [soatVencimiento, setSoatVencimiento] = useState("");
  const [rtVencimiento, setRtVencimiento] = useState("");
  
  const [soatFile, setSoatFile] = useState<File | null>(null);
  const [rtFile, setRtFile] = useState<File | null>(null);
  const [tpFile, setTpFile] = useState<File | null>(null);

  const [existingSoat, setExistingSoat] = useState<string>("");
  const [existingRt, setExistingRt] = useState<string>("");
  const [existingTp, setExistingTp] = useState<string>("");

  const soatInputRef = useRef<HTMLInputElement>(null);
  const rtInputRef = useRef<HTMLInputElement>(null);
  const tpInputRef = useRef<HTMLInputElement>(null);

  const loadData = async (searchTerm = "") => {
    try {
      setLoading(true);
      const url = searchTerm ? `/logistica/vehiculos?search=${encodeURIComponent(searchTerm)}` : '/logistica/vehiculos';
      const data = await api.get<VehiculoData[]>(url);
      setVehiculos(data || []);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar los vehículos");
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

  const parseObservaciones = (obs: string | null) => {
    if (!obs) return null;
    try {
      return JSON.parse(obs);
    } catch (e) {
      return null;
    }
  };

  const stats = vehiculos.reduce((acc, veh) => {
    const { days } = getEstado(veh.fechaVencimiento);
    acc.total++;
    if (days < 0) acc.vencidos++;
    else if (days <= 30) acc.porVencer++;
    else acc.vigentes++;
    return acc;
  }, { total: 0, vigentes: 0, porVencer: 0, vencidos: 0 });

  // Filtered
  const filteredVehiculos = vehiculos.filter((veh) => {
    if (filtroEstado !== "todos") {
      const { days } = getEstado(veh.fechaVencimiento);
      if (filtroEstado === "vigentes" && days <= 30) return false;
      if (filtroEstado === "porVencer" && (days < 0 || days > 30)) return false;
      if (filtroEstado === "vencidos" && days >= 0) return false;
    }
    return true;
  });

  const resetForm = () => {
    setPlaca("");
    setMarcaModelo("");
    setSoatVencimiento("");
    setRtVencimiento("");
    setSoatFile(null);
    setRtFile(null);
    setTpFile(null);
    setExistingSoat("");
    setExistingRt("");
    setExistingTp("");
    setEditingId(null);
    if (soatInputRef.current) soatInputRef.current.value = "";
    if (rtInputRef.current) rtInputRef.current.value = "";
    if (tpInputRef.current) tpInputRef.current.value = "";
  };

  const handleOpenEdit = (veh: VehiculoData) => {
    setEditingId(veh.id);
    setPlaca(veh.nombre || "");
    setMarcaModelo(veh.numero || "");
    
    const data = parseObservaciones(veh.observaciones);
    if (data) {
      setSoatVencimiento(data.soat?.vencimiento ? data.soat.vencimiento.split('T')[0] : "");
      setRtVencimiento(data.revisionTecnica?.vencimiento ? data.revisionTecnica.vencimiento.split('T')[0] : "");
      setExistingSoat(data.soat?.url || "");
      setExistingRt(data.revisionTecnica?.url || "");
      setExistingTp(data.tarjetaPropiedad?.url || "");
    } else {
      setSoatVencimiento("");
      setRtVencimiento("");
      setExistingSoat("");
      setExistingRt("");
      setExistingTp("");
    }
    
    setSoatFile(null);
    setRtFile(null);
    setTpFile(null);
    setIsDialogOpen(true);
  };

  const handleUploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post<{url: string}>('/logistica/upload', formData);
    return res.url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!placa || !marcaModelo || !soatVencimiento || !rtVencimiento) {
      toast.error("Por favor completa la placa, marca/modelo y las fechas de vencimiento.");
      return;
    }

    try {
      setIsSubmitting(true);
      
      let soatUrl = existingSoat;
      let rtUrl = existingRt;
      let tpUrl = existingTp;

      if (soatFile) soatUrl = await handleUploadFile(soatFile);
      if (rtFile) rtUrl = await handleUploadFile(rtFile);
      if (tpFile) tpUrl = await handleUploadFile(tpFile);

      const payload = {
        placa,
        marcaModelo,
        soatVencimiento,
        rtVencimiento,
        soatUrl,
        rtUrl,
        tpUrl,
      };

      if (editingId) {
        await api.put(`/logistica/vehiculos/${editingId}`, payload);
        toast.success("Vehículo actualizado correctamente.");
      } else {
        await api.post('/logistica/vehiculos', payload);
        toast.success("Vehículo registrado correctamente.");
      }

      setIsDialogOpen(false);
      resetForm();
      loadData(search);
    } catch (error) {
      console.error(error);
      toast.error(editingId ? "Error al actualizar el vehículo" : "Error al registrar el vehículo");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!vehiculoToDelete) return;
    try {
      setIsSubmitting(true);
      await api.delete(`/logistica/vehiculos/${vehiculoToDelete.id}`);
      toast.success("Vehículo eliminado.");
      setIsDeleteDialogOpen(false);
      setVehiculoToDelete(null);
      loadData(search);
    } catch (error) {
      console.error(error);
      toast.error("Error al eliminar el vehículo.");
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
                🚨 Hay {stats.vencidos} vehículo(s) con documentos vencidos que requieren atención inmediata.
              </p>
            </div>
          )}
          {stats.porVencer > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3 animate-pulse shadow-sm">
              <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
              <p className="text-sm font-semibold text-amber-800">
                ⚠️ Hay {stats.porVencer} vehículo(s) con documentos próximos a vencer en los próximos 30 días.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          onClick={() => setFiltroEstado("todos")}
          className={cn(
            "bg-white rounded-lg border shadow-sm p-4 flex items-center gap-4 cursor-pointer transition-all",
            filtroEstado === "todos" ? "ring-2 ring-blue-500 border-blue-300" : "hover:shadow-md"
          )}
        >
          <div className="bg-slate-100 p-3 rounded-full">
            <Car className="w-5 h-5 text-slate-600" />
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
            <ShieldAlert className="w-5 h-5 text-amber-600" />
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
        <div className="p-4 border-b flex flex-col sm:flex-row gap-3 justify-between items-center bg-slate-50/50">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar placa o modelo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>
          <Button className="gap-2 w-full sm:w-auto shadow-sm" onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4" />
            NUEVO VEHÍCULO
          </Button>
        </div>
        
        <div className="relative w-full overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead className="w-[50px] text-center text-[10px] font-black uppercase text-slate-500">N°</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-slate-500">Vehículo</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-slate-500">SOAT</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-slate-500">Revisión Técnica</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-slate-500 text-center">Tarjeta Prop.</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-slate-500 text-center">Estado General</TableHead>
                <TableHead className="w-[100px] text-[10px] font-black uppercase text-slate-500 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-sm font-medium text-slate-500">
                    Cargando vehículos...
                  </TableCell>
                </TableRow>
              ) : filteredVehiculos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-sm font-medium text-slate-500">
                    {vehiculos.length > 0 ? "No hay vehículos con los filtros seleccionados." : "No se encontraron vehículos."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredVehiculos.map((veh, idx) => {
                  const estadoInfo = getEstado(veh.fechaVencimiento);
                  const data = parseObservaciones(veh.observaciones);
                  const soatEstado = getEstado(data?.soat?.vencimiento);
                  const rtEstado = getEstado(data?.revisionTecnica?.vencimiento);
                  
                  const rowBg = estadoInfo.days < 0 
                    ? "bg-red-50/30 hover:bg-red-50/60 transition-colors" 
                    : estadoInfo.days <= 30 
                      ? "bg-amber-50/30 hover:bg-amber-50/60 transition-colors" 
                      : "transition-colors hover:bg-slate-50/50";

                  return (
                    <TableRow key={veh.id} className={rowBg}>
                      <TableCell className="text-center text-[11px] text-slate-500 font-bold">
                        {idx + 1}
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-sm text-slate-800 uppercase">{veh.nombre}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5 font-medium">{veh.numero}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1.5">
                          <div className={cn(
                            "flex items-center gap-1.5 text-[11px]",
                            soatEstado.days < 0 ? "text-red-700 font-bold" : 
                            soatEstado.days <= 30 ? "text-amber-700 font-bold" : "text-slate-600"
                          )}>
                            <Calendar className={cn("w-3.5 h-3.5", soatEstado.days <= 30 ? "text-current" : "text-slate-400")} />
                            <span className="font-medium">{data?.soat?.vencimiento ? format(parseISO(data.soat.vencimiento), 'dd/MM/yyyy', { locale: es }) : '-'}</span>
                          </div>
                          {data?.soat?.url ? (
                            <a href={api.getFileUrl(data.soat.url)} target="_blank" rel="noreferrer" className="text-[10px] text-blue-600 hover:underline font-bold flex items-center gap-1">
                              <Eye className="w-3 h-3"/> Ver SOAT
                            </a>
                          ) : <span className="text-[9px] text-slate-400">Sin archivo</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1.5">
                          <div className={cn(
                            "flex items-center gap-1.5 text-[11px]",
                            rtEstado.days < 0 ? "text-red-700 font-bold" : 
                            rtEstado.days <= 30 ? "text-amber-700 font-bold" : "text-slate-600"
                          )}>
                            <Calendar className={cn("w-3.5 h-3.5", rtEstado.days <= 30 ? "text-current" : "text-slate-400")} />
                            <span className="font-medium">{data?.revisionTecnica?.vencimiento ? format(parseISO(data.revisionTecnica.vencimiento), 'dd/MM/yyyy', { locale: es }) : '-'}</span>
                          </div>
                          {data?.revisionTecnica?.url ? (
                            <a href={api.getFileUrl(data.revisionTecnica.url)} target="_blank" rel="noreferrer" className="text-[10px] text-blue-600 hover:underline font-bold flex items-center gap-1">
                              <Eye className="w-3 h-3"/> Ver Revisión
                            </a>
                          ) : <span className="text-[9px] text-slate-400">Sin archivo</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {data?.tarjetaPropiedad?.url ? (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 gap-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-bold mx-auto"
                            onClick={() => window.open(api.getFileUrl(data.tarjetaPropiedad.url), '_blank')}
                          >
                            <Eye className="w-4 h-4" />
                            <span className="text-[11px] uppercase">Ver TP</span>
                          </Button>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Sin archivo</span>
                        )}
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
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                            onClick={() => handleOpenEdit(veh)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                            onClick={() => {
                              setVehiculoToDelete(veh);
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
        <DialogContent className="sm:max-w-[600px] bg-white h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar" : "Registrar"} Vehículo</DialogTitle>
            <DialogDescription>
              Completa los datos del vehículo y adjunta sus documentos.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[11px] font-bold uppercase text-slate-700">Placa <span className="text-red-500">*</span></Label>
                <Input value={placa} onChange={(e) => setPlaca(e.target.value.toUpperCase())} placeholder="ABC-123" />
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-bold uppercase text-slate-700">Marca y Modelo <span className="text-red-500">*</span></Label>
                <Input value={marcaModelo} onChange={(e) => setMarcaModelo(e.target.value)} placeholder="Ej: Toyota Hilux" />
              </div>
            </div>

            <div className="border rounded-lg p-4 bg-slate-50">
              <h3 className="font-bold text-sm mb-4">Datos del SOAT</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold uppercase text-slate-700">Vencimiento <span className="text-red-500">*</span></Label>
                  <Input type="date" value={soatVencimiento} onChange={(e) => setSoatVencimiento(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold uppercase text-slate-700">Archivo SOAT</Label>
                  <input type="file" accept=".pdf" className="text-xs" ref={soatInputRef} onChange={(e) => setSoatFile(e.target.files?.[0] || null)} />
                  {existingSoat && !soatFile && <p className="text-[10px] text-green-600 font-bold">Documento actual guardado</p>}
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4 bg-slate-50">
              <h3 className="font-bold text-sm mb-4">Revisión Técnica</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold uppercase text-slate-700">Vencimiento <span className="text-red-500">*</span></Label>
                  <Input type="date" value={rtVencimiento} onChange={(e) => setRtVencimiento(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold uppercase text-slate-700">Archivo Revisión</Label>
                  <input type="file" accept=".pdf" className="text-xs" ref={rtInputRef} onChange={(e) => setRtFile(e.target.files?.[0] || null)} />
                  {existingRt && !rtFile && <p className="text-[10px] text-green-600 font-bold">Documento actual guardado</p>}
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4 bg-slate-50">
              <h3 className="font-bold text-sm mb-4">Tarjeta de Propiedad</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold uppercase text-slate-700">Archivo Tarjeta Prop.</Label>
                  <input type="file" accept=".pdf" className="text-xs" ref={tpInputRef} onChange={(e) => setTpFile(e.target.files?.[0] || null)} />
                  {existingTp && !tpFile && <p className="text-[10px] text-green-600 font-bold">Documento actual guardado</p>}
                </div>
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Guardar Vehículo"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Confirmar Eliminación
            </DialogTitle>
            <DialogDescription className="pt-2">
              ¿Estás seguro de que deseas eliminar el vehículo <strong>{vehiculoToDelete?.nombre}</strong>? Se borrarán también los documentos adjuntos y esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
