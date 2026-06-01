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
} from "lucide-react";
import { useOperacionesStore } from "@/store/operaciones-store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const [activeTab, setActiveTab] = useState("actividades");

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] p-0 border-none bg-white flex flex-col overflow-y-auto">
        <DialogHeader className="p-6 bg-primary text-white rounded-t-lg shrink-0">
          <DialogTitle className="text-2xl font-medium tracking-tight flex items-center gap-3">
            <Briefcase className="w-6 h-6 text-accent" />
            {proyecto.codigo} - {proyecto.nombre}
          </DialogTitle>
          <div className="flex items-center gap-4 mt-2 text-sm text-white/80">
            <Badge className={cn("border-none font-medium", statusColors[proyecto.estado])}>
              {proyecto.estado}
            </Badge>
            <Badge className={cn("border-none font-medium", prioridadColors[proyecto.prioridad])}>
              {proyecto.prioridad}
            </Badge>
            <span className="flex items-center gap-1 font-medium">
              <Calendar className="w-4 h-4" />
              {formatDate(proyecto.fechaInicio)} → {formatDate(proyecto.fechaFinEstimada)}
            </span>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="w-full justify-start px-6 pt-4 border-b bg-transparent gap-2 h-14">
            <TabsTrigger value="actividades" className="gap-2 font-medium uppercase text-[10px]">
              <ClipboardList className="w-4 h-4" />
              Actividades ({proyecto.actividades.length})
            </TabsTrigger>
            <TabsTrigger value="documentos" className="gap-2 font-medium uppercase text-[10px]">
              <FileText className="w-4 h-4" />
              Documentos ({proyecto.documentos?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="historial" className="gap-2 font-medium uppercase text-[10px]">
              <History className="w-4 h-4" />
              Historial
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1">
            <div className="p-6">
              <TabsContent value="actividades" className="space-y-4 mt-0">
                <ActividadesPanel proyecto={proyecto} />
              </TabsContent>

              <TabsContent value="historial" className="mt-0">
                <TimelinePanel />
              </TabsContent>

              <TabsContent value="documentos" className="mt-0">
                <DocumentosPanel proyecto={proyecto} />
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="p-4 border-t bg-slate-50">
          <Button variant="outline" onClick={onClose} className="gap-2 font-medium uppercase text-xs">
            <X className="w-4 h-4" /> Cerrar Vista Detallada
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
  "Plano",
  "Especificación Técnica",
  "Informe",
  "Contrato",
  "Certificado",
  "Permiso",
  "Otro",
];

const estadoDocumentoColors: Record<string, string> = {
  "Pendiente": "bg-yellow-100 text-yellow-700",
  "En Revisión": "bg-blue-100 text-blue-700",
  "Aprobado": "bg-green-100 text-green-700",
  "Rechazado": "bg-red-100 text-red-700",
};

interface DocumentosPanelProps {
  proyecto: Proyecto;
}

function DocumentosPanel({ proyecto }: DocumentosPanelProps) {
  const { addDocumento } = useOperacionesStore();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Simular URL de archivo (en un caso real, esto subiría a un servidor/storage)
      const mockUrl = `/uploads/${file.name}`;
      setNewDoc((prev) => ({
        ...prev,
        nombre: file.name,
        url: mockUrl,
      }));
    }
  };

  const handleUploadDocument = () => {
    if (!newDoc.nombre || !newDoc.tipo) return;

    addDocumento(proyecto.id, {
      proyectoId: proyecto.id,
      nombre: newDoc.nombre,
      tipo: newDoc.tipo as "Técnico" | "Administrativo" | "Legal" | "Financiero" | "Otro",
      url: newDoc.url || "#",
      estado: "Borrador",
      subidoPor: "Usuario Actual",
      fechaSubida: new Date().toISOString(),
      observaciones: newDoc.observaciones || "",
      validaciones: [],
    });

    setNewDoc({ nombre: "", tipo: "", url: "", observaciones: "" });
    setIsUploadOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Header con botón de subir */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-black flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Documentos del Proyecto
        </h3>
        <Button
          onClick={() => setIsUploadOpen(true)}
          className="gap-2 font-black uppercase text-xs"
        >
          <Upload className="w-4 h-4" /> Subir Documento
        </Button>
      </div>

      {/* Grid de documentos */}
      {proyecto.documentos && proyecto.documentos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {proyecto.documentos.map((doc) => (
            <div
              key={doc.id}
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-800 text-sm line-clamp-1">{doc.nombre}</h4>
                    <p className="text-[10px] text-slate-400 uppercase">{doc.tipo}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-2">
                <Badge className={cn("text-[9px] font-black uppercase", estadoDocumentoColors[doc.estado] || "bg-slate-100")}>
                  {doc.estado}
                </Badge>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDate(doc.fechaSubida)}
                </span>
              </div>

              {doc.observaciones && (
                <p className="text-xs text-slate-500 line-clamp-2 mb-3">{doc.observaciones}</p>
              )}

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <Button size="sm" variant="ghost" className="flex-1 h-8 text-slate-500">
                  <Download className="w-4 h-4 mr-1" /> Descargar
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">No hay documentos registrados</p>
          <p className="text-xs text-slate-300 mt-1">Sube el primer documento del proyecto</p>
        </div>
      )}

      {/* Modal de subida de documentos */}
      {isUploadOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-black mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              Subir Documento
            </h3>

            <div className="space-y-4">
              {/* Input file */}
              <div className="space-y-2">
                <Label className="text-xs font-bold">Archivo</Label>
                <Input
                  type="file"
                  onChange={handleFileChange}
                  className="h-10 text-xs"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.dwg,.dxf"
                />
              </div>

              {/* Tipo de documento */}
              <div className="space-y-2">
                <Label className="text-xs font-bold">Tipo de Documento</Label>
                <Select value={newDoc.tipo} onValueChange={(v) => setNewDoc(prev => ({ ...prev, tipo: v || "" }))}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tipoDocumentoOptions.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Observaciones */}
              <div className="space-y-2">
                <Label className="text-xs font-bold">Observaciones</Label>
                <Input
                  placeholder="Descripción opcional..."
                  value={newDoc.observaciones}
                  onChange={(e) => setNewDoc(prev => ({ ...prev, observaciones: e.target.value }))}
                  className="h-10"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setIsUploadOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUploadDocument}
                disabled={!newDoc.nombre || !newDoc.tipo}
                className="flex-1"
              >
                <Upload className="w-4 h-4 mr-2" />
                Subir
              </Button>
            </div>
          </div>
        </div>
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
    <div className="bg-white p-4 rounded-xl border border-border shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg", bgColor)}>
          <div className={cn("w-5 h-5", color)}>{icon}</div>
        </div>
        <div>
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className={cn("text-2xl font-medium", color)}>{value}</p>
        </div>
      </div>
    </div>
  );
}
