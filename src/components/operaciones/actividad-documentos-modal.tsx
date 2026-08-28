"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOperacionesStore } from "@/store/operaciones-store";
import { useAuthStore } from "@/store/auth-store";
import { api } from "@/lib/api";
import {
  Paperclip,
  FileUp,
  FileText,
  Trash2,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { formatDate, getSecureUrl } from "@/lib/utils";

interface ActividadDocumentosModalProps {
  proyectoId: string;
  actividad: any | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ActividadDocumentosModal({
  proyectoId,
  actividad,
  isOpen,
  onClose,
}: ActividadDocumentosModalProps) {
  const { user } = useAuthStore();
  const { proyectos, addDocumento, deleteDocumento, fetchProyectos } = useOperacionesStore();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docNombre, setDocNombre] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [documentosLocales, setDocumentosLocales] = useState<any[]>([]);

  const loadDocuments = async () => {
    if (!proyectoId) return;
    setIsLoadingDocs(true);
    try {
      // Consultar directamente el proyecto con sus documentos
      const proj = await api.get(`/operaciones/proyectos/${proyectoId}`);
      if (proj && Array.isArray(proj.documentos)) {
        setDocumentosLocales(proj.documentos);
      }
    } catch (e) {
      console.error("Error al cargar documentos:", e);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  React.useEffect(() => {
    if (isOpen && proyectoId) {
      loadDocuments();
    }
  }, [isOpen, proyectoId]);

  if (!actividad) return null;

  const currentProject = proyectos.find((p) => p.id === proyectoId);
  const allDocs = documentosLocales.length > 0 ? documentosLocales : (currentProject?.documentos || []);
  const actividadDocs = allDocs.filter(
    (d: any) =>
      d.observaciones?.includes(`[Actividad: ${actividad.id}]`) ||
      d.observaciones?.includes(actividad.id) ||
      d.nombre?.toLowerCase().includes(`act-${actividad.id.slice(0, 4)}`)
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!docNombre) {
        setDocNombre(file.name);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Seleccione un archivo primero");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const uploadResponse = await api.post("/operaciones/upload", formData);
      const fileUrl = uploadResponse.url;

      if (!fileUrl) throw new Error("No se recibió URL del servidor");

      await addDocumento(proyectoId, {
        proyectoId,
        nombre: docNombre || selectedFile.name,
        tipo: "Tecnica" as any,
        url: fileUrl,
        estado: "Aprobado" as any,
        subidoPor: user?.nombre || "Técnico de Campo",
        observaciones: `[Actividad: ${actividad.id}] ${actividad.descripcion}`,
        fechaSubida: new Date().toISOString(),
        area: "OperacionesDeCampo" as any,
      } as any);

      toast.success("Documento adjuntado exitosamente a la actividad");
      setSelectedFile(null);
      setDocNombre("");
      await loadDocuments();
      await fetchProyectos();
    } catch (error: any) {
      console.error("Error al subir documento de actividad:", error);
      toast.error("Error al subir", {
        description: error.message || "No se pudo subir el archivo.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (confirm("¿Estás seguro de eliminar este documento adjunto?")) {
      try {
        await deleteDocumento(proyectoId, docId);
        toast.success("Documento eliminado");
        await loadDocuments();
        await fetchProyectos();
      } catch (error) {
        toast.error("Error al eliminar");
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full sm:max-w-2xl bg-white border-none shadow-2xl rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="p-6 bg-primary text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl border border-white/20">
              <Paperclip className="w-6 h-6 text-accent" />
            </div>
            <div>
              <DialogTitle className="text-lg font-black uppercase tracking-tight">
                Documentos y Evidencias de la Actividad
              </DialogTitle>
              <DialogDescription className="text-white/80 text-xs mt-0.5 line-clamp-1">
                {actividad.descripcion}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* SECCIÓN CARGA DE ARCHIVO */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4">
            <div className="flex items-center gap-2">
              <FileUp className="w-4 h-4 text-primary" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                Adjuntar Nuevo Archivo / Foto de Campo
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[9px] font-black uppercase text-slate-400">
                  Nombre descriptivo
                </Label>
                <Input
                  placeholder="Ej: Foto Termografía Tablero Principal"
                  value={docNombre}
                  onChange={(e) => setDocNombre(e.target.value)}
                  className="h-10 text-xs font-bold bg-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[9px] font-black uppercase text-slate-400">
                  Seleccionar archivo (PDF, JPG, PNG)
                </Label>
                <Input
                  type="file"
                  onChange={handleFileChange}
                  className="h-10 text-xs bg-white cursor-pointer"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                className="h-9 px-6 font-black uppercase text-[10px] gap-2 shadow-sm"
              >
                {isUploading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileUp className="w-3.5 h-3.5" />
                )}
                {isUploading ? "Subiendo..." : "Subir a la Actividad"}
              </Button>
            </div>
          </div>

          {/* LISTA DE ARCHIVOS DE LA ACTIVIDAD */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Archivos Adjuntos a esta Tarea ({actividadDocs.length})
              </span>
            </div>

            {isLoadingDocs ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
                <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-500 uppercase">
                  Cargando documentos...
                </p>
              </div>
            ) : actividadDocs.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-500 uppercase">
                  No hay documentos adjuntos todavía
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Sube actas de conformidad, fotografías de avance o reportes técnicos aquí.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                {actividadDocs.map((doc: any) => (
                  <div
                    key={doc.id}
                    className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 hover:border-primary/30 transition-all shadow-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 bg-primary/5 text-primary rounded-lg shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-800 uppercase truncate">
                          {doc.nombre}
                        </p>
                        <p className="text-[9px] text-slate-400 font-medium">
                          Subido por {doc.subidoPor} • {formatDate(doc.fechaSubida)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <a
                        href={getSecureUrl(doc.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-8 px-2.5 text-[9px] font-black uppercase gap-1 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg inline-flex items-center justify-center transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" /> Ver
                      </a>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(doc.id)}
                        className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="p-4 bg-slate-50 border-t flex justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            className="h-9 px-6 font-black uppercase text-[10px] border-slate-200"
          >
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
