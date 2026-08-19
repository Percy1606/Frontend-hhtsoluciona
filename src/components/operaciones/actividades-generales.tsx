"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  Briefcase,
  Calendar,
  FileText,
  Trash2,
  Search,
  Plus,
  Eye,
  User,
  CheckCircle2,
  Clock,
  Pencil,
  AlertTriangle,
  Upload,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { useOperacionesStore } from "@/store/operaciones-store";

interface ActividadData {
  id: string;
  nombre: string; // Titulo
  fechaVencimiento: string | null;
  actividadData: {
    descripcion: string;
    responsableId: string;
    tipoActividad?: string;
    clienteNombre?: string;
    estado: string;
    adjuntos: any[];
  };
  responsable: {
    id: string;
    nombre: string;
  } | null;
}



export default function ActividadesGenerales() {
  const { responsables, fetchResponsables } = useOperacionesStore();
  const [actividades, setActividades] = useState<ActividadData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Modals
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [actividadToDelete, setActividadToDelete] = useState<ActividadData | null>(null);
  
  // Form
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [responsableId, setResponsableId] = useState("");
  const [fechaProgramada, setFechaProgramada] = useState("");
  const [tipoActividad, setTipoActividad] = useState("Soporte");
  const [estado, setEstado] = useState("PENDIENTE");
  const [adjuntos, setAdjuntos] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  
  // Cliente Opcional
  const [clientes, setClientes] = useState<any[]>([]);
  const [clienteNombre, setClienteNombre] = useState("");

  const loadData = async (searchTerm = "") => {
    try {
      setLoading(true);
      const url = searchTerm ? `/operaciones/actividades-libres?search=${encodeURIComponent(searchTerm)}` : '/operaciones/actividades-libres';
      const data = await api.get<ActividadData[]>(url);
      setActividades(data || []);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar actividades");
    } finally {
      setLoading(false);
    }
  };

  const loadClientes = async () => {
    try {
      const data = await api.get<any>('/crm/clientes?limit=500');
      if (data && data.data) {
        setClientes(data.data);
      } else if (Array.isArray(data)) {
        setClientes(data);
      }
    } catch (error) {
      console.error("Error fetching clientes", error);
    }
  };

  useEffect(() => {
    if (!responsables || responsables.length === 0) {
      fetchResponsables();
    }
    loadClientes();
  }, [responsables, fetchResponsables]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadData(search);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const resetForm = () => {
    setEditingId(null);
    setTitulo("");
    setDescripcion("");
    setResponsableId("");
    setFechaProgramada("");
    setTipoActividad("Soporte");
    setEstado("PENDIENTE");
    setAdjuntos([]);
    setClienteNombre("");
  };

  const handleOpenEdit = (act: ActividadData) => {
    setEditingId(act.id);
    setTitulo(act.nombre || "");
    setDescripcion(act.actividadData?.descripcion || "");
    setResponsableId(act.actividadData?.responsableId || "");
    setFechaProgramada(act.fechaVencimiento ? act.fechaVencimiento.split('T')[0] : "");
    setTipoActividad(act.actividadData?.tipoActividad || "Soporte");
    setEstado(act.actividadData?.estado || "PENDIENTE");
    setAdjuntos(act.actividadData?.adjuntos || []);
    setClienteNombre(act.actividadData?.clienteNombre || "");
    setIsDialogOpen(true);
  };

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      // We can use the existing upload endpoint
      const res = await api.post<{url: string, nombre: string, tipo: string}>('/operaciones/upload', formData);
      setAdjuntos([...adjuntos, { url: res.url, nombre: file.name, tipo: file.type }]);
      toast.success("Archivo subido");
    } catch (error) {
      console.error(error);
      toast.error("Error al subir archivo");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const removeAdjunto = (url: string) => {
    setAdjuntos(adjuntos.filter(a => a.url !== url));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo || !responsableId || !fechaProgramada) {
      toast.error("Por favor completa los campos obligatorios.");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        titulo,
        descripcion,
        responsableId,
        fechaProgramada,
        tipoActividad,
        clienteNombre,
        estado,
        adjuntos
      };

      if (editingId) {
        await api.put(`/operaciones/actividades-libres/${editingId}`, payload);
        toast.success("Actividad actualizada.");
      } else {
        await api.post('/operaciones/actividades-libres', payload);
        toast.success("Actividad registrada.");
      }

      setIsDialogOpen(false);
      resetForm();
      loadData(search);
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar la actividad");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!actividadToDelete) return;
    try {
      setIsSubmitting(true);
      await api.delete(`/operaciones/actividades-libres/${actividadToDelete.id}`);
      toast.success("Actividad eliminada.");
      setIsDeleteDialogOpen(false);
      setActividadToDelete(null);
      loadData(search);
    } catch (error) {
      console.error(error);
      toast.error("Error al eliminar.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const markAsComplete = async (act: ActividadData) => {
    try {
      const payload = {
        estado: "COMPLETADA",
        titulo: act.nombre,
        descripcion: act.actividadData.descripcion,
        responsableId: act.actividadData.responsableId,
        adjuntos: act.actividadData.adjuntos
      };
      await api.put(`/operaciones/actividades-libres/${act.id}`, payload);
      toast.success("Actividad marcada como completada.");
      loadData(search);
    } catch (error) {
      toast.error("Error al actualizar el estado.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar actividad..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 border-slate-200 bg-white"
            />
          </div>
          <Button className="gap-2 shadow-sm rounded-xl" onClick={() => { resetForm(); setIsDialogOpen(true); }}>
            <Plus className="w-4 h-4" />
            NUEVA ACTIVIDAD
          </Button>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                <TableHead className="text-[10px] font-black uppercase text-slate-500">Actividad</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-slate-500">Responsable</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-slate-500">Fecha Prog.</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-slate-500">Evidencias</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-slate-500 text-center">Estado</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-slate-500 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-sm text-slate-500">Cargando actividades...</TableCell>
                </TableRow>
              ) : actividades.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-sm text-slate-500">No hay actividades registradas.</TableCell>
                </TableRow>
              ) : (
                actividades.map((act) => {
                  const isCompleted = act.actividadData?.estado === 'COMPLETADA';
                  return (
                    <TableRow key={act.id} className="hover:bg-slate-50 transition-colors group">
                      <TableCell>
                        <div className="font-bold text-sm text-slate-800">{act.nombre}</div>
                        {act.actividadData?.descripcion && (
                          <div className="text-[11px] text-slate-500 mt-1 line-clamp-2">{act.actividadData.descripcion}</div>
                        )}
                        <Badge variant="outline" className="text-[9px] font-bold uppercase mt-2 bg-indigo-50 text-indigo-700 border-indigo-200">
                          {act.actividadData?.tipoActividad || 'OTRO'}
                        </Badge>
                        {act.actividadData?.clienteNombre && (
                          <Badge variant="outline" className="text-[8px] font-bold uppercase mt-2 ml-1 bg-slate-100 text-slate-600 border-slate-200">
                            {act.actividadData.clienteNombre}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                            <User className="w-3 h-3 text-slate-500" />
                          </div>
                          <span className="text-xs font-bold text-slate-700">{act.responsable?.nombre || 'Sin asignar'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                          <Calendar className="w-3.5 h-3.5" />
                          {act.fechaVencimiento ? format(new Date(act.fechaVencimiento), 'dd MMM yyyy', { locale: es }) : '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {act.actividadData?.adjuntos?.length > 0 ? (
                            act.actividadData.adjuntos.map((adj: any, idx: number) => (
                              <a
                                key={idx}
                                href={api.getFileUrl(adj.url)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100 hover:bg-blue-100 transition-colors"
                              >
                                <Eye className="w-3 h-3" /> Ver
                              </a>
                            ))
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Sin archivos</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={cn(
                          "text-[9px] font-black uppercase px-2 h-5 border-0",
                          isCompleted ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                        )}>
                          {act.actividadData?.estado || 'PENDIENTE'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!isCompleted && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:bg-emerald-50" onClick={() => markAsComplete(act)} title="Marcar completada">
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50" onClick={() => handleOpenEdit(act)} title="Editar/Adjuntar">
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-50" onClick={() => { setActividadToDelete(act); setIsDeleteDialogOpen(true); }} title="Eliminar">
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

      {/* Creación / Edición */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Actividad" : "Nueva Actividad"}</DialogTitle>
            <DialogDescription>Asigna una tarea operativa y sube documentos.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-slate-500">Título de Actividad <span className="text-red-500">*</span></Label>
              <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ej: Mantenimiento de servidores" required />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-slate-500">Descripción / Instrucciones</Label>
              <Textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Detalla lo que se debe hacer..." className="resize-none" rows={3} />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-slate-500">Cliente Asignado <span className="text-slate-400 font-normal">(Opcional)</span></Label>
              <select 
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={clienteNombre}
                onChange={(e) => setClienteNombre(e.target.value)}
              >
                <option value="">Ninguno / Uso Interno</option>
                {clientes.map((c: any) => (
                  <option key={c.id} value={c.empresa || c.nombre}>{c.empresa || c.nombre}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-500">Responsable <span className="text-red-500">*</span></Label>
                <select 
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={responsableId}
                  onChange={(e) => setResponsableId(e.target.value)}
                  required
                >
                  <option value="">Seleccionar...</option>
                  {responsables.map((r) => (
                    <option key={r.id} value={r.id}>{r.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-500">Tipo de Actividad <span className="text-red-500">*</span></Label>
                <select 
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={tipoActividad}
                  onChange={(e) => setTipoActividad(e.target.value)}
                  required
                >
                  <option value="Soporte">Soporte</option>
                  <option value="Instalación">Instalación</option>
                  <option value="Mantenimiento">Mantenimiento</option>
                  <option value="Revisión">Revisión</option>
                  <option value="Administrativo">Administrativo</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div className="space-y-2 col-span-2">
                <Label className="text-xs font-bold uppercase text-slate-500">Fecha Prog. <span className="text-red-500">*</span></Label>
                <Input type="date" value={fechaProgramada} onChange={(e) => setFechaProgramada(e.target.value)} required />
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t mt-4">
              <Label className="text-xs font-bold uppercase text-slate-500">Evidencias / Documentos</Label>
              
              {adjuntos.length > 0 && (
                <div className="flex flex-col gap-2 mb-3">
                  {adjuntos.map((adj, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-50 p-2 rounded border text-xs">
                      <span className="truncate max-w-[250px] font-medium">{adj.nombre}</span>
                      <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500" onClick={() => removeAdjunto(adj.url)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2">
                <Input type="file" id="file-upload" className="hidden" onChange={handleUploadFile} disabled={uploading} />
                <Label htmlFor="file-upload" className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 border-dashed rounded-lg p-3 w-full cursor-pointer transition-colors text-sm font-medium text-slate-600">
                  <Upload className="w-4 h-4" />
                  {uploading ? "Subiendo..." : "Subir nuevo archivo"}
                </Label>
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting || uploading}>
                {isSubmitting ? "Guardando..." : "Guardar Actividad"}
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
              ¿Estás seguro de que deseas eliminar la actividad <strong>{actividadToDelete?.nombre}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isSubmitting}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
