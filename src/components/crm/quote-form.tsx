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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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
      observaciones: quote.observaciones || "",
      cajaId: quote.cajaId || "",
      cotizacionPadreId: quote.cotizacionPadreId || "",
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
    },
  });

  const selectedClientId = form.watch("clientId");

  const existingQuotesForClient = useMemo(() => 
    quotes.filter(q => q.clientId === selectedClientId && q.id !== quote?.id),
    [quotes, selectedClientId, quote]
  );

  const [hitos, setHitos] = useState<any[]>(
    quote?.hitosPago && quote.hitosPago.length > 0
      ? quote.hitosPago.map((h: any) => ({ ...h, monto: Number(h.monto), porcentaje: Number(h.porcentaje), estado: h.estado || 'PENDIENTE' }))
      : [
          { descripcion: "Adelanto inicial", porcentaje: 40, monto: 0, estado: 'COBRADO' },
          { descripcion: "Finalización de obra", porcentaje: 60, monto: 0, estado: 'PENDIENTE' },
        ]
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
        observaciones: quote.observaciones || "",
        cajaId: quote.cajaId || "",
        cotizacionPadreId: quote.cotizacionPadreId || "",
      });
      
      if (quote.hitosPago && quote.hitosPago.length > 0) {
        setHitos(quote.hitosPago.map((h: any) => ({ 
          ...h, 
          monto: Number(h.monto), 
          porcentaje: Number(h.porcentaje), 
          estado: h.estado || 'PENDIENTE' 
        })));
      }
    }
  }, [quote, form]);

  const totalMonto = form.watch("monto") || 0;

  // Recalcular montos cuando cambie el monto total o los porcentajes
  useEffect(() => {
    setHitos(prev => prev.map(h => ({
      ...h,
      monto: Number(((totalMonto * Number(h.porcentaje)) / 100).toFixed(2))
    })));
  }, [totalMonto]);

  const handleHitoChange = (index: number, field: string, value: any) => {
    const newHitos = [...hitos];
    newHitos[index][field] = value;
    
    if (field === 'porcentaje') {
      newHitos[index].monto = Number(((totalMonto * Number(value)) / 100).toFixed(2));
    } else if (field === 'monto') {
      newHitos[index].porcentaje = totalMonto > 0 ? Number(((Number(value) / totalMonto) * 100).toFixed(2)) : 0;
    }
    
    // Automatización: Si se marca como COBRADO, la cotización debe estar Aprobada
    if (field === 'estado' && value === 'COBRADO') {
      if (form.getValues("estado") !== "Aprobado") {
        form.setValue("estado", "Aprobado");
      }
    }
    
    setHitos(newHitos);
  };

  const addHito = () => {
    const totalActual = hitos.reduce((acc, h) => acc + Number(h.porcentaje), 0);
    const restante = Math.max(0, 100 - totalActual);
    setHitos([...hitos, { descripcion: `Hito ${hitos.length + 1}`, porcentaje: restante, monto: (totalMonto * restante) / 100, estado: 'PENDIENTE' }]);
  };

  const removeHito = (index: number) => {
    if (hitos.length <= 1) return;
    setHitos(hitos.filter((_, i) => i !== index));
  };

  const totalPorcentaje = hitos.reduce((acc, h) => acc + Number(h.porcentaje), 0);
  const isPlanValid = Math.abs(totalPorcentaje - 100) < 0.1;

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
  const isApproved = currentEstado === "Aprobado";
  // Solo se necesita seleccionar caja si hay hitos COBRADOS (confirmados por finanzas)
  const hasCobradoHitos = hitos.some(h => h.estado === 'COBRADO');
  
  // Si hay algo cobrado o está aprobado, NECESITAMOS saber a qué caja va/fue el dinero
  const needsCaja = isApproved || hasCobradoHitos;

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

      // Limpiar datos para el DTO del Backend
      const { empresa, contacto, ...dtoData } = data;
      
      // Sanitizar cotizacionPadreId para que no envíe strings vacíos ni "none"
      if (!dtoData.cotizacionPadreId || dtoData.cotizacionPadreId === "none" || dtoData.cotizacionPadreId === "") {
        delete dtoData.cotizacionPadreId;
      }
      
      await onSubmit({ 
        ...dtoData, 
        ...fileData,
        hitos: hitos.map(h => ({
          descripcion: h.descripcion,
          porcentaje: Number(h.porcentaje),
          monto: Number(h.monto),
          estado: h.estado || 'PENDIENTE'
        }))
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

    if (needsCaja && !data.cajaId) {
      alert("INGRESO A TESORERÍA\nSE HAN DETECTADO HITOS MARCADOS COMO COBRADO. SELECCIONE LA CAJA DE DESTINO.");
      return;
    }

    // NUEVA VALIDACIÓN: Cliente con cotizaciones existentes
    if (!quote && data.clientId) {
      const client = clients.find(c => c.id === data.clientId);
      
      // Intentar obtener el conteo de varias fuentes para mayor robustez
      const qCountFromStore = client?._count?.cotizaciones;
      const qCountFromList = quotes.filter(q => q.clientId === data.clientId).length;
      
      // Intento desesperado: Parsear del nombre si está ahí (Ej: "EMPRESA (3 COTIZACIONES)")
      const nameMatch = (client?.empresa || selectedClient?.empresa || "").match(/\((\d+)\s+COTIZACIONES\)/i);
      const qCountFromName = nameMatch ? parseInt(nameMatch[1]) : 0;
      
      // Si el backend envió el conteo, lo usamos. Si no, usamos lo que tenemos en la lista local o en el nombre.
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

    if (quote && needsCaja) {
      const montoCobradoAnterior = quote.hitosPago
        ?.filter((h: any) => h.estado === 'COBRADO')
        .reduce((sum: number, h: any) => sum + Number(h.monto), 0) || 0;
      
      const montoCobradoNuevo = hitos
        .filter((h: any) => h.estado === 'COBRADO')
        .reduce((sum: number, h: any) => sum + Number(h.monto), 0);

      const diferencia = Number((montoCobradoNuevo - montoCobradoAnterior).toFixed(2));

      if (diferencia > 0) {
        const simboloMoneda = data.moneda === 'PEN' ? 'S/' : '$';
        setConfirmDialog({
          open: true,
          title: "INGRESO A TESORERÍA",
          description: `Se ha detectado un ingreso adicional de ${simboloMoneda} ${diferencia.toLocaleString()}.

¿Desea confirmar el registro de este monto en la caja seleccionada?`,
          diferencia,
          data
        });
        return; 
      }
    }

    await executeSubmit(data);
  };

  return (
    <>
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
                    <p className="text-[9px] text-blue-500 font-medium italic mt-1">
                      * Al seleccionar una anterior, el sistema heredará los pagos ya registrados para no duplicarlos en caja.
                    </p>
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="moneda"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-[10px] font-bold uppercase text-slate-500">Moneda</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex items-center space-x-4 pt-2"
                        >
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <RadioGroupItem value="PEN" id="r1" />
                            </FormControl>
                            <FormLabel htmlFor="r1" className="font-bold text-sm">S/</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <RadioGroupItem value="USD" id="r2" />
                            </FormControl>
                            <FormLabel htmlFor="r2" className="font-bold text-sm">$</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="monto"
                  rules={{ 
                    required: "El monto es obligatorio",
                    min: { value: 0, message: "El monto no puede ser negativo" },
                    max: { value: 1000000000, message: "El monto no puede exceder los 1,000 millones" }
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-bold uppercase text-slate-500">Inversión</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary font-black text-sm">{currentMoneda === 'PEN' ? 'S/' : '$'}</span>
                          <Input 
                            type="number" 
                            step="0.01"
                            min="0"
                            max="1000000000"
                            className="h-11 border-slate-200 font-black text-primary text-base pl-8" 
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
                
                <FormField
                  control={form.control}
                  name="estado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-bold uppercase text-slate-500">Estado</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        disabled={quote?.estado === "Aprobado"}
                      >
                        <FormControl>
                          <SelectTrigger className={cn(
                            "h-11 border-slate-200 font-bold text-xs uppercase",
                            quote?.estado === "Aprobado" && "bg-slate-50 text-slate-500 cursor-not-allowed"
                          )}>
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
                      {quote?.estado === "Aprobado" && (
                        <p className="text-[9px] text-success font-black uppercase mt-1 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Cotización Bloqueada por Aprobación
                        </p>
                      )}
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className={cn("grid gap-6 items-start", needsCaja ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1")}>
              <FormField
                control={form.control}
                name="observaciones"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-bold uppercase text-slate-500">Observaciones Internas</FormLabel>
                    <FormControl>
                      <textarea 
                        {...field}
                        value={field.value ?? ""}
                        placeholder="Agregue notas adicionales sobre esta propuesta..."
                        className="w-full min-h-[115px] p-3 rounded-xl border border-slate-200 text-sm font-bold bg-white focus:border-primary/50 outline-none transition-all resize-none"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {needsCaja && (
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 animate-in fade-in slide-in-from-top-2 duration-300 h-full flex flex-col justify-center">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="bg-white p-2 rounded-lg border border-blue-100 shadow-sm">
                      <Wallet className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-black uppercase text-blue-700 leading-none">Ingreso a Tesorería</h4>
                      <p className="text-[9px] text-blue-600 font-bold uppercase tracking-wide mt-1">
                        {hasCobradoHitos 
                          ? "Se han detectado hitos marcados como COBRADO. Seleccione la caja de destino." 
                          : "La cotización está aprobada. Seleccione la caja de destino para el dinero."}
                      </p>
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="cajaId"
                    rules={{ required: needsCaja ? "Debe seleccionar una caja" : false }}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value || ""}
                          >
                            <SelectTrigger className="h-11 w-full border-blue-200 bg-white font-black text-xs uppercase text-blue-700 shadow-sm flex items-center justify-between">
                              <SelectValue placeholder="SELECCIONAR CAJA DE DESTINO...">
                                {cajas.find(c => c.id === field.value)?.nombre || "SELECCIONAR CAJA DE DESTINO..."}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="z-[150] min-w-[300px]">
                              {cajas.length === 0 ? (
                                <div className="p-4 text-center text-[10px] font-black uppercase text-slate-400">
                                  Cargando cajas...
                                </div>
                              ) : cajas.filter(c => c.moneda === currentMoneda).length === 0 ? (
                                <div className="p-4 text-center text-[10px] font-black uppercase text-error">
                                  No hay cajas en {currentMoneda}
                                </div>
                              ) : (
                                cajas.filter(c => c.moneda === currentMoneda).map(caja => (
                                  <SelectItem key={caja.id} value={caja.id} className="text-xs font-bold uppercase py-3">
                                    {caja.nombre} ({caja.moneda}) — S/ {Number(caja.saldoReal).toLocaleString()}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage className="text-[10px] font-black uppercase mt-1" />
                      </FormItem>
                    )}
                  />

                  {quote && (
                    <div className="mt-3 flex items-center gap-2 bg-white/50 p-2 rounded-lg border border-blue-50">
                      <AlertTriangle className="w-3 h-3 text-blue-400" />
                      <p className="text-[8px] font-bold text-blue-400 uppercase tracking-tighter">Nota: Solo se registrará en caja la diferencia si el monto cobrado ha cambiado.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <Separator className="opacity-50" />

          {/* SECCIÓN 3: CONDICIONES DE PAGO (MONTO DIRECTO) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                Condiciones de Pago (Adelanto y Saldo)
              </h3>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1 space-y-2 w-full">
                <p className="text-[10px] font-black uppercase text-slate-400">Monto de Adelanto (Ingresar)</p>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-slate-300">{currentMoneda === 'PEN' ? 'S/' : '$'}</span>
                  <Input 
                    type="number"
                    value={hitos[0]?.monto || 0} 
                    onChange={(e) => {
                       const val = Number(e.target.value);
                       const safeVal = Math.min(totalMonto, Math.max(0, val));
                       const perc = totalMonto > 0 ? (safeVal / totalMonto) * 100 : 0;
                       const newHitos = [
                         { ...hitos[0], monto: safeVal, porcentaje: perc, descripcion: "Adelanto inicial", estado: hitos[0]?.estado || 'COBRADO' },
                         { ...hitos[1], monto: Number((totalMonto - safeVal).toFixed(2)), porcentaje: 100 - perc, descripcion: "Saldo contra entrega", estado: 'PENDIENTE' }
                       ];
                       setHitos(newHitos);
                    }}
                    className="h-12 text-xl font-black text-primary border-slate-200 bg-white pl-12 rounded-xl"
                  />
                </div>
                <p className="text-[9px] font-bold text-slate-400 uppercase">
                   Equivale al <span className="text-primary">{(hitos[0]?.porcentaje || 0).toFixed(1)}%</span> del total.
                </p>
              </div>

              <div className="w-px h-12 bg-slate-200 hidden md:block" />

              <div className="flex-1 space-y-1 w-full text-right">
                <p className="text-[10px] font-black uppercase text-slate-400">Saldo Pendiente (Automático)</p>
                <p className="text-xl font-black text-slate-600">
                   {currentMoneda === 'PEN' ? 'S/' : '$'} {((hitos[1]?.monto || 0)).toLocaleString(undefined, {minimumFractionDigits: 2})}
                </p>
                <Badge variant="outline" className="bg-white text-[8px] font-black uppercase px-3 py-1 border-slate-200">
                   { (100 - (hitos[0]?.porcentaje || 0)).toFixed(1) }% restante
                </Badge>
              </div>
            </div>
            
            <p className="text-[9px] text-slate-400 font-bold uppercase text-center italic">
              * El total de la inversión es {currentMoneda === 'PEN' ? 'S/' : '$'} {totalMonto.toLocaleString()}. Finanzas gestionará los cobros según estos montos.
            </p>
          </div>

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
            disabled={isUploading || !selectedClientId || !isPlanValid}
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
              onClick={() => executeSubmit(confirmDialog.data)}
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
