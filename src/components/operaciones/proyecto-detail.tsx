"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Briefcase,
  Calendar,
  ClipboardList,
  History,
  X,
  Download,
  Upload,
  FilePlus,
  Trash2,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useOperacionesStore } from "@/store/operaciones-store";
import { useCRMStore } from "@/store/crm-store";
import { api } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn, formatDate } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

import type { Proyecto } from "@/lib/types";
import { ActividadesPanel } from "./actividades-panel";
import { TimelinePanel } from "./timeline-panel";

// ============================================
// CONSTANTES
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

interface ProyectoDetailProps {
  proyecto: Proyecto;
  onClose: () => void;
}

export function ProyectoDetail({ proyecto, onClose }: ProyectoDetailProps) {
  const { responsables } = useOperacionesStore();
  const { clients: crmClients } = useCRMStore();
  const [activeTab, setActiveTab] = useState("actividades");

  const clientName = crmClients.find(c => c.id === proyecto.clientId)?.empresa || "Cliente Externo";
  const responsableName = responsables.find(r => r.id === proyecto.responsablePrincipalId)?.nombre || "Sin asignar";

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] p-0 border-none bg-white flex flex-col overflow-y-auto rounded-xl shadow-2xl">
        <DialogHeader className="p-8 bg-primary text-white rounded-t-xl shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-white/20 text-white border-none font-black uppercase text-[10px] tracking-widest px-3">
              {clientName}
            </Badge>
          </div>
          <DialogTitle className="text-3xl font-black tracking-tight flex items-center gap-4 uppercase">
            <Briefcase className="w-10 h-10 text-accent" />
            <div className="flex flex-col">
                <span className="text-[10px] opacity-60 font-black tracking-widest">PROYECTO CÓDIGO: {proyecto.codigo}</span>
                <span>{proyecto.nombre}</span>
            </div>
          </DialogTitle>
          <div className="flex flex-wrap items-center gap-4 mt-4">
            <div className="flex items-center gap-1.5 font-black uppercase text-[10px] bg-white/10 px-3 py-1 rounded-full">
                <span className="opacity-60">LÍDER:</span> {responsableName}
            </div>
            <Separator orientation="vertical" className="h-4 bg-white/20 hidden md:block" />
            <Badge className={cn("border-none font-black text-[10px] uppercase px-3 py-1", statusColors[proyecto.estado])}>
              {proyecto.estado}
            </Badge>
            <Badge className={cn("border-none font-black text-[10px] uppercase px-3 py-1", prioridadColors[proyecto.prioridad])}>
              {proyecto.prioridad}
            </Badge>
            <span className="flex items-center gap-2 font-black text-[10px] uppercase bg-white/10 px-3 py-1 rounded-full">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(proyecto.fechaInicio)} → {formatDate(proyecto.fechaFinEstimada)}
            </span>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-8 pt-4 border-b bg-slate-50/50 shrink-0">
            <TabsList className="bg-transparent h-12 w-full justify-start gap-8 rounded-none p-0">
                <TabsTrigger value="actividades" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none font-black text-xs uppercase h-full gap-2 text-slate-500">
                    <ClipboardList className="w-4 h-4" /> Actividades ({proyecto.actividades.length})
                </TabsTrigger>
                <TabsTrigger value="documentos" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none font-black text-xs uppercase h-full gap-2 text-slate-500">
                    <FileText className="w-4 h-4" /> Documentos ({proyecto.documentos?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="historial" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none font-black text-xs uppercase h-full gap-2 text-slate-500">
                    <History className="w-4 h-4" /> Historial
                </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-8">
              <TabsContent value="actividades" className="space-y-4 mt-0 animate-in fade-in duration-300">
                <ActividadesPanel proyecto={proyecto} />
              </TabsContent>

              <TabsContent value="historial" className="mt-0 animate-in fade-in duration-300">
                <TimelinePanel />
              </TabsContent>

              <TabsContent value="documentos" className="mt-0 animate-in fade-in duration-300">
                <DocumentosPanel proyecto={proyecto} />
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="p-4 border-t bg-slate-100 flex items-center justify-between shrink-0">
          <p className="text-[9px] font-black text-slate-400 uppercase italic ml-4">HH T SOLUCIONA S.A.C. - SISTEMA DE CONTROL OPERATIVO</p>
          <Button variant="outline" onClick={onClose} className="gap-2 font-black uppercase text-xs border-slate-300 hover:bg-slate-200 shadow-sm text-slate-600">
            <X className="w-4 h-4" /> CERRAR VISTA DETALLADA
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// COMPONENTE: DocumentosPanel
// ============================================

const tipoDocumentoOptions = [
  { label: "Técnico (Planos, Especificaciones)", value: "Técnico" },
  { label: "Administrativo (Contratos, Actas)", value: "Administrativo" },
  { label: "Legal (Permisos, Licencias)", value: "Legal" },
  { label: "Financiero (Presupuestos, Facturas)", value: "Financiero" },
  { label: "Otro", value: "Otro" },
];

const estadoDocumentoColors: Record<string, string> = {
  "Pendiente": "bg-yellow-100 text-yellow-700",
  "En Revisión": "bg-blue-100 text-blue-700",
  "Aprobado": "bg-green-100 text-green-700",
  "Rechazado": "bg-red-100 text-red-700",
  "Borrador": "bg-gray-100 text-gray-700",
};

interface DocumentosPanelProps {
  proyecto: Proyecto;
}

function DocumentosPanel({ proyecto }: DocumentosPanelProps) {
  const { addDocumento, deleteDocumento, loading } = useOperacionesStore();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newDoc, setNewDoc] = useState<{
    nombre: string;
    tipo: string;
    url: string;
    observaciones: string;
  }>({
    nombre: "",
    tipo: "",
    url: "",
    observaciones: "",
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setNewDoc((prev) => ({
        ...prev,
        nombre: file.name,
      }));
    }
  };

  const handleUploadDocument = async () => {
    if (!selectedFile || !newDoc.tipo) return;

    const MAX_SIZE = 10 * 1024 * 1024;
    if (selectedFile.size > MAX_SIZE) {
      alert("El archivo es demasiado pesado (máx 10MB). Reduzca el tamaño o use una imagen más ligera.");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const uploadResponse = await api.post('/operaciones/upload', formData);
      const fileUrl = uploadResponse.url;

      if (!fileUrl) throw new Error("No se recibió la URL del archivo");

      await addDocumento(proyecto.id, {
        proyectoId: proyecto.id,
        nombre: newDoc.nombre || selectedFile.name,
        tipo: newDoc.tipo as any,
        url: fileUrl,
        estado: "Borrador",
        subidoPor: "Admin",
        fechaSubida: new Date().toISOString(),
        validaciones: [],
        observaciones: newDoc.observaciones || "",
      });

      setNewDoc({ nombre: "", tipo: "", url: "", observaciones: "" });
      setSelectedFile(null);
      setIsUploadOpen(false);
    } catch (error: any) {
      console.error("Error al subir archivo:", error);
      alert("No se pudo guardar el documento.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveDocument = async (docId: string) => {
    if (!confirm("¿Está seguro de que desea eliminar este documento?")) return;
    try {
      await deleteDocumento(proyecto.id, docId);
    } catch (error) {
      alert("No se pudo eliminar el documento.");
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-black uppercase tracking-tight">Expediente del Proyecto</h3>
            <p className="text-xs font-medium text-slate-400">Gestión de planos, actas y certificados técnicos.</p>
          </div>
        </div>
        <Button
          onClick={() => setIsUploadOpen(true)}
          className="gap-2 font-black uppercase text-xs h-12 px-6 shadow-lg shadow-primary/10"
        >
          <Upload className="w-4 h-4" /> Subir Documento
        </Button>
      </div>

      {proyecto.documentos && proyecto.documentos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {proyecto.documentos.map((doc) => (
            <div
              key={doc.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-primary/20 transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="font-bold text-slate-800 text-sm truncate uppercase" title={doc.nombre}>{doc.nombre}</h4>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{doc.tipo}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4 bg-slate-50 p-2 rounded-lg border border-slate-100">
                <Badge className={cn("text-[9px] font-black uppercase border-none h-5 shadow-none", estadoDocumentoColors[doc.estado] || "bg-slate-200")}>
                  {doc.estado}
                </Badge>
                <span className="text-[9px] text-slate-400 font-bold uppercase flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDate(doc.fechaSubida)}
                </span>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="flex-1 h-9 text-[10px] font-black uppercase text-primary hover:bg-primary/5"
                  onClick={() => {
                    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
                    const fullUrl = doc.url.startsWith('http') ? doc.url : `${API_URL}${doc.url}`;
                    window.open(fullUrl, '_blank');
                  }}
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" /> Descargar
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-9 w-9 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                  onClick={() => handleRemoveDocument(doc.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
          <FilePlus className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-400 font-black uppercase text-sm tracking-widest">No hay documentos técnicos</p>
          <p className="text-xs text-slate-300 font-medium mt-1">El expediente está vacío por el momento.</p>
        </div>
      )}

      {isUploadOpen && (
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogContent className="max-w-md p-0 border-none overflow-hidden rounded-2xl shadow-2xl">
                <DialogHeader className="p-6 bg-primary text-white shrink-0">
                    <DialogTitle className="text-xl font-black uppercase flex items-center gap-2">
                        <Upload className="w-6 h-6 text-accent" /> Subir al Expediente
                    </DialogTitle>
                </DialogHeader>
                <div className="p-6 space-y-6 bg-white">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Seleccionar Archivo *</Label>
                            <Input
                                type="file"
                                onChange={handleFileChange}
                                className="h-12 border-slate-200 cursor-pointer"
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.dwg,.dxf"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Tipo de Documento *</Label>
                            <Select value={newDoc.tipo} onValueChange={(v) => setNewDoc(prev => ({ ...prev, tipo: v || "" }))}>
                                <SelectTrigger className="h-12 border-slate-200 font-bold">
                                    <SelectValue placeholder="Categoría técnica..." />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                    {tipoDocumentoOptions.map((tipo) => (
                                        <SelectItem key={tipo.value} value={tipo.value} className="font-bold">
                                            {tipo.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Observaciones</Label>
                            <Textarea
                                placeholder="Referencia u observaciones..."
                                value={newDoc.observaciones}
                                onChange={(e) => setNewDoc(prev => ({ ...prev, observaciones: e.target.value }))}
                                className="h-20 resize-none border-slate-200"
                            />
                        </div>
                    </div>
                    <div className="flex gap-3 pt-4 border-t border-slate-100">
                        <Button variant="ghost" onClick={() => setIsUploadOpen(false)} className="flex-1 font-bold text-slate-500 uppercase text-xs">Cancelar</Button>
                        <Button
                            onClick={handleUploadDocument}
                            disabled={!selectedFile || !newDoc.tipo || isUploading}
                            className="flex-1 font-black uppercase text-xs shadow-lg shadow-primary/20"
                        >
                            {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                            Iniciar Carga
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export function StatsCard({
  label,
  value,
  icon,
  color,
  bgColor,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="bg-white p-4 rounded-xl border border-border shadow-sm transition-all hover:shadow-md hover:border-primary/20 group">
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg transition-transform group-hover:scale-110", bgColor)}>
          <div className={cn("w-5 h-5", color)}>{icon}</div>
        </div>
        <div>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">{label}</p>
          <p className={cn("text-2xl font-black tracking-tighter", color)}>{value}</p>
        </div>
      </div>
    </div>
  );
}
