"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  FileText, 
  Upload, 
  CheckCircle2, 
  AlertCircle,
  FileCode,
  Users,
  ArrowRight
} from "lucide-react";
import { useCRMStore } from "@/store/crm-store";
import { cn } from "@/lib/utils";

export function WordImporter({ onImportComplete }: { onImportComplete?: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const { clients, importQuotes } = useCRMStore();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && (selectedFile.name.endsWith('.doc') || selectedFile.name.endsWith('.docx'))) {
      setFile(selectedFile);
      setExtractedData(null);
    } else {
      alert("Por favor sube un archivo Word (.doc o .docx)");
    }
  };

  const simulateParsing = () => {
    if (!file) return;
    setIsParsing(true);
    
    // Simulate 2s parsing delay
    setTimeout(() => {
      // Mock data extraction from Word
      const mockExtracted = {
        empresa: file.name.split('_')[0].toUpperCase() || "CLIENTE EXTRAÍDO",
        contacto: "Extraído de Word",
        monto: Math.floor(Math.random() * 5000) + 1000,
        fecha: new Date().toISOString().split('T')[0],
        estado: "Pendiente" as const
      };
      setExtractedData(mockExtracted);
      setIsParsing(false);
    }, 1500);
  };

  const handleFinalImport = () => {
    if (!extractedData) return;
    
    // Find matching client by name or pick the first one as mock
    const client = clients.find(c => c.empresa.toLowerCase().includes(extractedData.empresa.toLowerCase())) || clients[0];
    
    importQuotes([{
      ...extractedData,
      clientId: client?.id || "unknown",
      empresa: client?.empresa || extractedData.empresa,
      contacto: client?.contacto || extractedData.contacto
    }]);
    
    setFile(null);
    setExtractedData(null);
    if (onImportComplete) onImportComplete();
  };

  return (
    <div className="space-y-6">
      <div className={cn(
        "border-2 border-dashed rounded-2xl p-10 transition-all flex flex-col items-center justify-center text-center",
        file ? "border-primary bg-primary/5" : "border-slate-200 hover:border-slate-300 bg-slate-50"
      )}>
        {file ? (
          <div className="space-y-4">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
              <FileCode className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="font-black text-primary uppercase">{file.name}</p>
              <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            {!extractedData && (
              <Button 
                onClick={simulateParsing} 
                disabled={isParsing}
                className="bg-primary hover:bg-primary/90 font-bold"
              >
                {isParsing ? "Analizando Documento..." : "Procesar y Extraer Datos"}
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
              <Upload className="w-8 h-8 text-slate-400" />
            </div>
            <div>
              <p className="font-bold text-slate-700">Arrastra tu Proforma en Word aquí</p>
              <p className="text-sm text-slate-400 mt-1">Soporta formatos .docx y .doc</p>
            </div>
            <label className="block">
              <span className="sr-only">Seleccionar archivo</span>
              <input 
                type="file" 
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90 cursor-pointer"
                accept=".doc,.docx"
                onChange={handleFileChange}
              />
            </label>
          </div>
        )}
      </div>

      {extractedData && (
        <div className="bg-white border border-border rounded-xl p-6 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300 shadow-sm">
          <div className="flex items-center gap-2 text-success">
            <CheckCircle2 className="w-5 h-5" />
            <h3 className="font-black text-sm uppercase tracking-wider">Datos Extraídos Exitosamente</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-[10px] font-black text-slate-400 uppercase">Empresa</p>
              <p className="text-xs font-bold text-primary">{extractedData.empresa}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-[10px] font-black text-slate-400 uppercase">Contacto</p>
              <p className="text-xs font-bold text-primary">{extractedData.contacto}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-[10px] font-black text-slate-400 uppercase">Monto</p>
              <p className="text-xs font-black text-primary">S/ {extractedData.monto}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-[10px] font-black text-slate-400 uppercase">Fecha</p>
              <p className="text-xs font-bold text-primary">{extractedData.fecha}</p>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-100">
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Verifica que los datos coincidan con tu documento antes de importar.
            </p>
            <Button 
              onClick={handleFinalImport}
              className="bg-accent hover:bg-accent/90 text-white font-black uppercase text-xs gap-2"
            >
              Confirmar e Importar <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
