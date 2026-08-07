"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  FileX,
  CheckCircle2,
  Download,
  UploadCloud,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { api } from "@/lib/api";
import { toast } from "sonner";

export interface DocumentItem {
  key: string;
  label: string;
  file: {
    filename: string;
    url: string;
    size: string;
    uploadedAt: string;
  } | null;
}

export function TrabajadorDocumentosView({ workerId }: { workerId: string }) {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  const fetchDocs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get(`/config/trabajadores/${workerId}/documentos`);
      setDocuments(data || []);
    } catch (e) {
      console.error("Error fetching documents:", e);
      toast.error("No se pudieron cargar los documentos.");
    } finally {
      setLoading(false);
    }
  }, [workerId]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const handleFileUpload = async (key: string, file: File) => {
    try {
      setUploadingKey(key);
      const formData = new FormData();
      formData.append("file", file);

      await api.post(`/config/trabajadores/${workerId}/documento/${key}`, formData);
      toast.success("Documento subido correctamente.");
      fetchDocs();
    } catch (e) {
      console.error("Error uploading file:", e);
      toast.error("Error al subir el archivo.");
    } finally {
      setUploadingKey(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center bg-white rounded-2xl border border-slate-100 shadow-sm">
        <Loader2 className="h-8 w-8 animate-spin text-[#001F3F]" />
      </div>
    );
  }

  return (
    <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
      <CardHeader className="bg-slate-50/50 border-b border-slate-100">
        <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <FileText className="h-5 w-5 text-[#003087]" />
          Documentos y Expediente del Trabajador
        </CardTitle>
        <CardDescription>
          Suba y gestione sus documentos obligatorios (formatos PDF, imágenes o Word).
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents.map((doc) => {
            const hasFile = !!doc.file;
            return (
              <div
                key={doc.key}
                className={`p-4 rounded-xl border flex flex-col justify-between gap-3 transition-all ${
                  hasFile
                    ? "bg-emerald-50/30 border-emerald-100 hover:border-emerald-200"
                    : "bg-slate-50/50 border-slate-100 hover:border-slate-200"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2.5 rounded-lg ${
                        hasFile ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-slate-800 text-sm truncate">{doc.label}</h4>
                      {hasFile ? (
                        <div className="text-xs text-slate-600 mt-0.5 space-y-0.5">
                          <p className="font-mono text-[10px] text-slate-500 truncate max-w-[220px]">
                            {doc.file?.filename}
                          </p>
                          <p>
                            {doc.file?.size} •{" "}
                            {new Date(doc.file!.uploadedAt).toLocaleDateString("es-ES")}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          <FileX className="h-3.5 w-3.5" /> Sin archivo cargado
                        </p>
                      )}
                    </div>
                  </div>
                  {hasFile && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                      <CheckCircle2 className="h-3 w-3" /> Cargado
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-2">
                  {hasFile && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white border-slate-200 rounded-lg text-xs h-8 px-3 hover:bg-slate-50"
                      onClick={() => window.open(api.getFileUrl(doc.file!.url), "_blank")}
                    >
                      <Download className="h-3.5 w-3.5 mr-1 text-[#003087]" />
                      Descargar
                    </Button>
                  )}

                  <div className="relative">
                    <input
                      type="file"
                      id={`file-${workerId}-${doc.key}`}
                      className="hidden"
                      accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileUpload(doc.key, file);
                        }
                      }}
                      disabled={uploadingKey === doc.key}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className={`rounded-lg text-xs h-8 px-3 ${
                        hasFile
                          ? "bg-white border-slate-200 text-slate-600"
                          : "bg-[#001F3F] text-white hover:bg-[#003087]"
                      }`}
                      onClick={() => document.getElementById(`file-${workerId}-${doc.key}`)?.click()}
                      disabled={uploadingKey === doc.key}
                    >
                      {uploadingKey === doc.key ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                      ) : hasFile ? (
                        <RefreshCw className="h-3.5 w-3.5 mr-1" />
                      ) : (
                        <UploadCloud className="h-3.5 w-3.5 mr-1" />
                      )}
                      {hasFile ? "Reemplazar" : "Subir archivo"}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
