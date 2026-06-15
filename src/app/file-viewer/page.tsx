"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Download, ExternalLink } from "lucide-react";

import mammoth from "mammoth";

function FileViewerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const fileUrl = searchParams.get("url");
  const fileName = searchParams.get("name") || "Documento";
  
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [wordHtml, setWordHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>("");

  useEffect(() => {
    if (!fileUrl) {
      setError("No se proporcionó una URL de archivo válida.");
      setLoading(false);
      return;
    }

    const fetchFile = async () => {
      try {
        const { token } = useAuthStore.getState();
        const response = await fetch(fileUrl, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error(`Error: ${response.statusText}`);

        const arrayBuffer = await response.arrayBuffer();
        const blob = new Blob([arrayBuffer]);
        const ext = fileUrl.split('?')[0].split('.').pop()?.toLowerCase();
        
        const types: any = {
          'pdf': 'application/pdf',
          'png': 'image/png',
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'webp': 'image/webp',
          'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        };

        const type = types[ext || ''] || blob.type;
        setMimeType(type);

        if (ext === 'docx') {
          // Convertimos Word a HTML usando mammoth
          const result = await mammoth.convertToHtml({ arrayBuffer });
          setWordHtml(result.value);
          setLoading(false);
        } else {
          const url = URL.createObjectURL(new Blob([arrayBuffer], { type }));
          setBlobUrl(url);
          setLoading(false);
        }
      } catch (err: any) {
        console.error("Error cargando archivo:", err);
        setError("No se pudo cargar el archivo para previsualización.");
        setLoading(false);
      }
    };

    fetchFile();

    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [fileUrl]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="font-black uppercase text-[10px] tracking-widest text-center px-6">Renderizando contenido de alta fidelidad...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-6 p-6">
        <div className="bg-white p-10 rounded-2xl shadow-xl border border-slate-200 text-center max-w-md">
          <div className="bg-red-50 text-red-500 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <ArrowLeft className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-800 uppercase mb-2">Error de Carga</h2>
          <p className="text-slate-500 text-sm mb-6">{error}</p>
          <Button onClick={() => window.close()} variant="outline" className="w-full font-bold uppercase text-xs">Cerrar Visor</Button>
        </div>
      </div>
    );
  }

  const isImage = mimeType.startsWith('image/');
  const isWord = mimeType.includes('word');

  return (
    <div className="flex flex-col h-screen bg-slate-800">
      {/* Toolbar */}
      <div className="bg-slate-900 border-b border-slate-700 p-4 flex items-center justify-between text-white shadow-lg z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => window.close()} className="hover:bg-slate-800 rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-sm font-black uppercase tracking-tight truncate max-w-[300px]">{fileName}</h1>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Visor de Documentos Comercial • HH T SOLUCIONA</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-primary hover:bg-primary/90 border-none text-white font-bold text-[10px] uppercase h-9 px-4 gap-2"
            onClick={() => {
              if (blobUrl) {
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = fileName;
                a.click();
              } else {
                alert("La descarga no está disponible en este modo.");
              }
            }}
          >
            <Download className="w-4 h-4" /> Descargar
          </Button>
        </div>
      </div>

      {/* Viewer Content */}
      <div className="flex-1 overflow-auto p-4 md:p-8 flex justify-center items-start">
        {isImage ? (
          <img 
            src={blobUrl || ""} 
            alt={fileName} 
            className="max-h-full w-auto shadow-2xl border-4 border-slate-700 rounded-lg animate-in zoom-in-95 duration-300"
          />
        ) : isWord ? (
          <div className="bg-white w-full max-w-4xl p-12 md:p-20 shadow-2xl rounded-sm min-h-full animate-in slide-in-from-bottom-4 duration-700 overflow-visible">
            <div 
              className="prose prose-slate max-w-none word-content"
              dangerouslySetInnerHTML={{ __html: wordHtml || "" }} 
            />
            <style jsx global>{`
              .word-content h1 { font-size: 24pt; font-weight: bold; margin-bottom: 12pt; color: #1e293b; }
              .word-content h2 { font-size: 18pt; font-weight: bold; margin-top: 18pt; margin-bottom: 10pt; color: #334155; }
              .word-content p { font-size: 11pt; line-height: 1.5; margin-bottom: 10pt; color: #475569; }
              .word-content table { border-collapse: collapse; width: 100%; margin: 15pt 0; }
              .word-content table td, .word-content table th { border: 1px solid #cbd5e1; padding: 8pt; }
              .word-content ul, .word-content ol { margin-left: 20pt; margin-bottom: 10pt; }
            `}</style>
          </div>
        ) : (
          <iframe 
            src={`${blobUrl}#toolbar=1&navpanes=0&scrollbar=1`}
            className="w-full h-full rounded-lg shadow-2xl bg-white border border-slate-700 animate-in fade-in duration-500"
            title={fileName}
          />
        )}
      </div>
    </div>
  );
}

export default function FileViewerPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="font-black uppercase text-[10px] tracking-widest text-center px-6">Iniciando visor de seguridad...</p>
      </div>
    }>
      <FileViewerContent />
    </Suspense>
  );
}

