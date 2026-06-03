"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Quote, useCRMStore } from "@/store/crm-store";
import { useEffect, useMemo, useState } from "react";
import { FileUp, FileText, X, User, Building2, Smartphone, Mail, Hash, MapPin, CheckCircle2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Combobox } from "@/components/ui/combobox";
import { cn } from "@/lib/utils";

interface QuoteFormProps {
  quote?: Quote | null;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export function QuoteForm({ quote, onSubmit, onCancel }: QuoteFormProps) {
  const { clients, uploadQuoteFile } = useCRMStore();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const form = useForm({
    defaultValues: quote ? {
      ...quote,
    } : {
      clientId: "",
      empresa: "",
      contacto: "",
      monto: 0,
      estado: "Pendiente",
      fecha: new Date().toISOString().split('T')[0],
      referencia: "",
    },
  });

  const clientOptions = useMemo(() => 
    clients.map(c => ({
      value: c.id,
      label: c.empresa,
      subLabel: `${c.codigo} - RUC: ${c.ruc}`
    })), [clients]
  );

  const selectedClientId = form.watch("clientId");
  const selectedClient = useMemo(() => 
    clients.find(c => c.id === selectedClientId),
    [clients, selectedClientId]
  );

  useEffect(() => {
    if (selectedClient && !quote) {
      form.setValue("empresa", selectedClient.empresa);
      form.setValue("contacto", selectedClient.contacto);
    }
  }, [selectedClient, form, quote]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleFormSubmit = async (data: any) => {
    if (!selectedFile && (!quote || !quote.documentos || quote.documentos.length === 0)) {
      alert("Debes cargar un documento (Word o PDF) antes de guardar la cotización.");
      return;
    }

    try {
      setIsUploading(true);
      let fileData = {};
      
      if (selectedFile) {
        const response = await uploadQuoteFile(selectedFile);
        fileData = {
          fileUrl: response.url,
          fileName: response.nombre,
          fileType: response.tipo,
        };
      }
      
      await onSubmit({ ...data, ...fileData });
    } catch (error) {
      console.error("Error al procesar el formulario:", error);
      alert("Hubo un error al guardar la cotización o el documento.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-0">
        <div className="p-6 space-y-8 overflow-y-auto max-h-[70vh]">
          {/* SECCIÓN 1: CLIENTE */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Identificación del Cliente
            </h3>
            
            <FormField
              control={form.control}
              name="clientId"
              rules={{ required: "Seleccione un cliente" }}
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-[10px] font-bold uppercase text-slate-500 mb-1">Buscar Cliente</FormLabel>
                  <FormControl>
                    <Combobox
                      options={clientOptions}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Escriba nombre o RUC del cliente..."
                      className="border-slate-200 h-11"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedClient && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                  <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                    <Hash className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase text-slate-400">RUC / Documento</p>
                    <p className="text-sm font-bold text-slate-700">{selectedClient.ruc}</p>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                  <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase text-slate-400">Persona de Contacto</p>
                    <p className="text-sm font-bold text-slate-700">{selectedClient.contacto}</p>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                  <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                    <MapPin className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase text-slate-400">Dirección Fiscal</p>
                    <p className="text-sm font-bold text-slate-700 truncate max-w-[200px]" title={selectedClient.direccion}>{selectedClient.direccion}</p>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                  <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                    <Smartphone className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase text-slate-400">Teléfono / Celular</p>
                    <p className="text-sm font-bold text-slate-700">{selectedClient.telefono || "No registrado"}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator className="opacity-50" />

          {/* SECCIÓN 2: DETALLES DE LA PROPUESTA */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Detalles Comerciales
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="referencia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-bold uppercase text-slate-500">Referencia / Título del Servicio</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ej: Mantenimiento de HVAC - Planta Lurín" 
                        className="h-11 border-slate-200 font-bold text-sm"
                        {...field} 
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="monto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-bold uppercase text-slate-500">Inversión (S/)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          className="h-11 border-slate-200 font-black text-primary text-base" 
                          {...field} 
                          value={field.value || 0}
                          onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="estado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-bold uppercase text-slate-500">Estado Inicial</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-11 border-slate-200 font-bold text-xs uppercase">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white">
                          <SelectItem value="Pendiente" className="text-xs font-bold uppercase">Pendiente</SelectItem>
                          <SelectItem value="Enviado" className="text-xs font-bold uppercase text-blue-600">Enviado</SelectItem>
                          <SelectItem value="Aprobado" className="text-xs font-bold uppercase text-success">Aprobado</SelectItem>
                          <SelectItem value="Rechazado" className="text-xs font-bold uppercase text-error">Rechazado</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>

          <Separator className="opacity-50" />

          {/* SECCIÓN 3: ARCHIVO WORD/PDF */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
              <FileUp className="w-4 h-4" />
              Cargar Documento (Word o PDF)
            </h3>
            
            <div className={cn(
              "border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300",
              selectedFile ? "border-success/30 bg-green-50/30" : "border-slate-200 hover:border-primary/30 hover:bg-slate-50/50"
            )}>
              {!selectedFile ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="bg-primary/10 p-4 rounded-full">
                    <FileUp className="w-10 h-10 text-primary" />
                  </div>
                  <div>
                    {quote?.documentos && quote.documentos.length > 0 ? (
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg inline-flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span className="text-[10px] font-black text-blue-700 uppercase">
                          Archivo Actual: {[...quote.documentos].sort((a, b) => parseInt(b.version || "0") - parseInt(a.version || "0"))[0].nombre}
                        </span>
                      </div>
                    ) : null}
                    <p className="text-sm font-black text-slate-700 uppercase">Selecciona el archivo de cotización</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold mt-1">Formatos admitidos: .docx (Word) o .pdf</p>
                  </div>
                  <Input 
                    type="file" 
                    accept=".docx,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => document.getElementById('file-upload')?.click()}
                    className="mt-2 font-black text-[10px] uppercase border-primary/20 text-primary hover:bg-primary hover:text-white h-9 px-6"
                  >
                    Examinar Archivos
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-white border border-success/20 p-4 rounded-xl shadow-sm max-w-lg mx-auto animate-in zoom-in-95 duration-300">
                  <div className="flex items-center gap-4">
                    <div className="bg-success/10 p-2 rounded-lg">
                      {selectedFile.type.includes('pdf') ? <FileText className="w-6 h-6 text-error" /> : <CheckCircle2 className="w-6 h-6 text-success" />}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-black text-slate-800 truncate max-w-[250px]">{selectedFile.name}</p>
                      <p className="text-[10px] text-success font-black uppercase tracking-tighter">Archivo Listo para Procesar • {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setSelectedFile(null)}
                    className="text-slate-300 hover:text-error hover:bg-red-50 rounded-full h-8 w-8"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-slate-100 bg-slate-50/80">
          <Button 
            type="button" 
            variant="ghost" 
            onClick={onCancel}
            className="text-slate-500 font-bold px-8 h-11 uppercase text-[10px]"
            disabled={isUploading}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={isUploading || !selectedClientId}
            className="bg-primary hover:bg-primary/90 text-white font-black px-10 shadow-lg shadow-primary/20 h-11 uppercase text-[10px] gap-2"
          >
            {isUploading ? (
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Cargando...
              </span>
            ) : (
              quote ? "Actualizar Propuesta" : "Registrar Propuesta"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

