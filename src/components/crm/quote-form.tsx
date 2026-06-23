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
import { useOperacionesStore } from "@/store/operaciones-store";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { FileUp, FileText, X, User, Building2, Smartphone, Mail, List, MapPin, CheckCircle2, Wallet, AlertTriangle, Plus, Hash } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Combobox } from "@/components/ui/combobox";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface QuoteFormProps {
  quote?: Quote | null;
  canManageFinances?: boolean;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export function QuoteForm({ quote, canManageFinances = false, onSubmit, onCancel }: QuoteFormProps) {
  const { clients, uploadQuoteFile, quotes } = useCRMStore();
  const { responsables, fetchResponsables } = useOperacionesStore();
  const [selectedLiderId, setSelectedLiderId] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const isQuoteWon = useMemo(() => 
    quote ? ['Ganada', 'Aprobado', 'Aprobada'].includes(quote.estado) : false,
    [quote]
  );

  useEffect(() => {
    fetchResponsables();
  }, [fetchResponsables]);

  useEffect(() => {
    if (quote && (quote as any).proyectoGenerado) {
      setSelectedLiderId((quote as any).proyectoGenerado.responsablePrincipalId || "");
    }
  }, [quote]);
  const [isUploading, setIsUploading] = useState(false);
  const [cajas, setCajas] = useState<any[]>([]);
  
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    diferencia?: number;
    data: any;
    confirmText?: string;
  }>({ open: false, title: "", description: "", diferencia: 0, data: null, confirmText: "Confirmar Ajuste" });

  const form = useForm({
    defaultValues: quote ? {
      clientId: quote.clientId || "",
      monto: Number(quote.monto) || 0,
      moneda: quote.moneda || "PEN",
      estado: quote.estado || "Pendiente",
      fecha: quote.fecha ? new Date(quote.fecha).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      referencia: quote.referencia || "",
      cajaId: quote.cajaId || "",
      cotizacionPadreId: quote.cotizacionPadreId || "",
      formaPago: quote.formaPago || "",
    } : {
      clientId: "",
      empresa: "",
      contacto: "",
      monto: 0,
      moneda: "PEN",
      estado: "Pendiente",
      fecha: new Date().toISOString().split('T')[0],
      referencia: "",
      cajaId: "",
      cotizacionPadreId: "",
      formaPago: "",
    },
  });

  const selectedClientId = form.watch("clientId");

  const existingQuotesForClient = useMemo(() => 
    quotes.filter(q => q.clientId === selectedClientId && q.id !== quote?.id),
    [quotes, selectedClientId, quote]
  );

  // Sincronizar formulario e hitos cuando cambie la cotización seleccionada (Carga de datos al editar)
  useEffect(() => {
    if (quote) {
      form.reset({
        clientId: quote.clientId || "",
        monto: Number(quote.monto) || 0,
        moneda: quote.moneda || "PEN",
        estado: quote.estado || "Pendiente",
        fecha: quote.fecha ? new Date(quote.fecha).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        referencia: quote.referencia || "",
        cajaId: quote.cajaId || "",
        cotizacionPadreId: quote.cotizacionPadreId || "",
        formaPago: quote.formaPago || "",
      });
    }
  }, [quote, form]);

  const totalMonto = form.watch("monto") || 0;

  useEffect(() => {
    const fetchCajas = async () => {
      try {
        const data = await api.get('/finanzas/cajas');
        if (Array.isArray(data)) setCajas(data);
      } catch (error) {
        console.error("Error fetching cajas:", error);
      }
    };
    fetchCajas();
  }, []);

  const clientOptions = useMemo(() => 
    clients.map(c => ({
      value: c.id,
      label: c.empresa,
      subLabel: `${c.codigo} - RUC: ${c.ruc}`
    })), [clients]
  );

  const currentEstado = form.watch("estado");
  const isApproved = currentEstado === "Ganada";

  const currentMoneda = form.watch("moneda");

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

  const executeSubmit = async (data: any) => {
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

      const { empresa, contacto, ...dtoData } = data;
      
      if (!dtoData.cotizacionPadreId || dtoData.cotizacionPadreId === "none" || dtoData.cotizacionPadreId === "") {
        delete dtoData.cotizacionPadreId;
      }
      
      await onSubmit({ 
        ...dtoData, 
        ...fileData,
        liderId: selectedLiderId
      });
      setConfirmDialog(prev => ({ ...prev, open: false }));
    } catch (error: any) {
      console.error("Error al procesar el formulario:", error);
      const errorMessage = error.response?.data?.message 
        || error.message 
        || "Hubo un error al guardar la cotización o el documento.";
      alert(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFormSubmit = async (data: any) => {
    if (!selectedFile && (!quote || !quote.documentos || quote.documentos.length === 0)) {
      alert("Debes cargar un documento (Word o PDF) antes de guardar la cotización.");
      return;
    }

    if (!quote && data.clientId) {
      const client = clients.find(c => c.id === data.clientId);
      const qCountFromStore = client?._count?.cotizaciones;
      const qCountFromList = quotes.filter(q => q.clientId === data.clientId).length;
      const nameMatch = (client?.empresa || selectedClient?.empresa || "").match(/\((\d+)\s+COTIZACIONES\)/i);
      const qCountFromName = nameMatch ? parseInt(nameMatch[1]) : 0;
      
      const qCount = Math.max(
        qCountFromStore !== undefined ? qCountFromStore : qCountFromList,
        qCountFromName
      );

      if (qCount > 0) {
        setConfirmDialog({
          open: true,
          title: "CLIENTE CON COTIZACIONES EXISTENTES",
          description: `El cliente "${client?.empresa || selectedClient?.empresa}" ya tiene ${qCount} cotización(es) registrada(s). \n\n¿Desea crear una nueva cotización para este mismo cliente?`,
          data,
          confirmText: "Sí, crear nueva"
        });
        return;
      }
    }

    if (quote) {
      const oldQuoteTotal = Number(quote.monto);
      const newTotal = Number(data.monto);
      if (Math.abs(oldQuoteTotal - newTotal) > 0.01) {
        setConfirmDialog({
          open: true,
          title: "Modificación de Monto",
          description: `El monto de la cotización ganada ha cambiado. Se generará un ajuste financiero y logístico automático.`,
          diferencia: newTotal - oldQuoteTotal,
          data
        });
        return;
      }
    }
    
    if (data.estado === "Ganada" && !isQuoteWon) {
      const tieneDocumentos = quote?.documentos && quote.documentos.length > 0;
      const descripcion = tieneDocumentos
        ? "Se generará automáticamente el Proyecto, la Orden de Servicio, y se notificará a Finanzas y Logística. ¿Desea continuar?"
        : "⚠️ No se han adjuntado documentos (cotización + orden de servicio). El proyecto se generará igualmente, pero deberás adjuntarlos después desde el detalle de la cotización. ¿Estás seguro de continuar?";

      setConfirmDialog({
        open: true,
        title: "¡Cotización Ganada!",
        description: descripcion,
        data,
        confirmText: "Ganar Cotización"
      });
      return;
    }

    await executeSubmit(data);
  };

  return (
    <>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-0">
        <div className="p-6 space-y-8 overflow-y-auto max-h-[70vh]">
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

            {selectedClient && existingQuotesForClient.length > 0 && !quote && (
              <FormField
                control={form.control}
                name="cotizacionPadreId"
                render={({ field }) => (
                  <FormItem className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <FormLabel className="text-[10px] font-bold uppercase text-blue-600 mb-1 flex items-center gap-1.5">
                      <AlertTriangle className="w-3 h-3" />
                      ¿Es una revisión o cambio de una cotización anterior?
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger className="h-11 border-blue-100 bg-blue-50/30 font-bold text-xs">
                          <SelectValue placeholder="No, es una cotización totalmente nueva">
                            {field.value ? (
                              (() => {
                                const q = quotes.find(x => x.id === field.value);
                                return q ? (q.referencia || q.codigo) : "Cotización Seleccionada";
                              })()
                            ) : "No, es una cotización totalmente nueva"}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white">
                        <SelectItem value="none" className="text-xs font-bold">No, es una cotización totalmente nueva</SelectItem>
                        {existingQuotesForClient.map(q => (
                          <SelectItem key={q.id} value={q.id} className="text-xs font-bold">
                            {q.referencia || q.codigo} [{q.codigo}] - {q.moneda} {Number(q.monto).toLocaleString()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            )}

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
              </div>
            )}
          </div>

          <Separator className="opacity-50" />

          <div className="space-y-6">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Detalles de la Propuesta
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="referencia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-bold uppercase text-slate-500">Título / Servicio Principal</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ej: Mantenimiento Preventivo de HVAC" 
                          className="h-12 bg-slate-50 border-slate-200 font-bold text-sm focus:bg-white transition-colors"
                          {...field} 
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="formaPago"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-bold uppercase text-slate-500">Forma de Pago (Sugerencia)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ej: 50% al inicio, 50% al finalizar" 
                          className="h-12 bg-slate-50 border-slate-200 font-bold text-sm focus:bg-white transition-colors"
                          {...field} 
                        />
                      </FormControl>
                      <p className="text-[9px] text-slate-400 font-bold italic mt-1.5">
                        * Finanzas armará el cronograma exacto si se gana.
                      </p>
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <FormField
                    control={form.control}
                    name="moneda"
                    render={({ field }) => (
                      <FormItem className="w-1/3">
                        <FormLabel className="text-[10px] font-bold uppercase text-slate-500">Moneda</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 bg-slate-50 border-slate-200 font-black text-sm">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-white">
                            <SelectItem value="PEN" className="font-bold">S/ (Soles)</SelectItem>
                            <SelectItem value="USD" className="font-bold">$ (Dólares)</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="monto"
                    rules={{ 
                      required: "El monto es obligatorio",
                      min: { value: 0, message: "El monto no puede ser negativo" }
                    }}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel className="text-[10px] font-bold uppercase text-slate-500">Inversión Total</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/50 font-black text-lg">
                              {form.watch("moneda") === 'PEN' ? 'S/' : '$'}
                            </span>
                            <Input 
                              type="number" 
                              step="0.01"
                              min="0"
                              className="h-12 bg-blue-50/30 border-blue-100 font-black text-blue-700 text-lg pl-10 focus:bg-white transition-colors" 
                              placeholder="0.00"
                              {...field}
                              onChange={(e) => {
                                const val = e.target.value;
                                field.onChange(val === '' ? 0 : parseFloat(val));
                              }}
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-[10px] font-black uppercase mt-1" />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="estado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-bold uppercase text-slate-500">Estado de la Propuesta</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        disabled={isQuoteWon}
                      >
                        <FormControl>
                          <SelectTrigger className={cn(
                            "h-12 border-slate-200 font-black text-xs uppercase",
                            field.value === "Ganada" ? "bg-success/10 text-success border-success/20" :
                            field.value === "Perdida" ? "bg-error/10 text-error border-error/20" :
                            field.value === "Enviado" ? "bg-blue-50 text-blue-600 border-blue-200" :
                            "bg-slate-50"
                          )}>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white">
                          <SelectItem value="Pendiente" className="text-xs font-bold uppercase">Pendiente</SelectItem>
                          <SelectItem value="Enviado" className="text-xs font-bold uppercase text-blue-600">Enviado al Cliente</SelectItem>
                          <SelectItem value="Revisión" className="text-xs font-bold uppercase text-amber-600">En Revisión</SelectItem>
                          <SelectItem value="Ganada" className="text-xs font-black uppercase text-success">Ganada</SelectItem>
                          <SelectItem value="Perdida" className="text-xs font-bold uppercase text-error">Perdida</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                {(isQuoteWon || currentEstado === "Ganada") && (
                  <div className="space-y-1.5 mt-4">
                    <FormLabel className="text-[10px] font-black text-slate-500 uppercase ml-1">Líder del Proyecto Operativo</FormLabel>
                    <Select value={selectedLiderId} onValueChange={(val) => setSelectedLiderId(val || "")}>
                      <SelectTrigger className="h-12 border-slate-200 bg-slate-50 font-bold text-xs uppercase rounded-xl">
                        <SelectValue placeholder="SELECCIONAR LÍDER" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {responsables.map(r => (
                          <SelectItem key={r.id} value={r.id} className="text-xs font-bold uppercase">{r.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[9px] text-slate-400 font-bold italic mt-1">
                      * Cambiar el líder aquí actualizará al responsable principal en el proyecto operativo asignado.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <Separator className="opacity-50" />

          <Separator className="opacity-50" />



          <Separator className="opacity-50" />

          {/* SECCIÓN 4: ARCHIVO WORD/PDF */}
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

    <Dialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog(prev => ({ ...prev, open: false }))}>
        <DialogContent className="max-w-md bg-white border-none shadow-2xl rounded-3xl p-6 overflow-hidden">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-blue-600" />
            </div>
            <DialogTitle className="text-center text-lg font-black uppercase tracking-tighter text-slate-900">
              {confirmDialog.title}
            </DialogTitle>
            <DialogDescription className="text-center text-sm font-bold text-slate-500 mt-2 whitespace-pre-wrap">
              {confirmDialog.description}
            </DialogDescription>
          </DialogHeader>

          {confirmDialog.title === "¡Cotización Ganada!" && (
            <div className="mt-4 px-2 animate-in fade-in slide-in-from-bottom-2">
              <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block">Asignar Líder de Proyecto:</label>
              <Select value={selectedLiderId} onValueChange={(val) => setSelectedLiderId(val || "")}>
                <SelectTrigger className="w-full h-11 border-blue-200 bg-blue-50/50 font-bold text-xs text-blue-800">
                  <SelectValue placeholder="-- SELECCIONAR LÍDER --" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {responsables.map(r => (
                    <SelectItem key={r.id} value={r.id} className="text-xs font-bold uppercase">
                      {r.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter className="mt-6 flex gap-3 sm:justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
              className="flex-1 rounded-xl h-11 font-black text-[10px] uppercase text-slate-500 border-slate-200"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (confirmDialog.title === "¡Cotización Ganada!") {
                  if (!selectedLiderId) {
                    alert("Debe seleccionar obligatoriamente un líder de proyecto para continuar.");
                    return;
                  }
                  executeSubmit({ ...confirmDialog.data, liderId: selectedLiderId });
                } else {
                  executeSubmit(confirmDialog.data);
                }
              }}
              className="flex-1 rounded-xl h-11 font-black text-[10px] uppercase bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20"
            >
              {confirmDialog.confirmText || "Confirmar Ajuste"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
