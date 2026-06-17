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
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export function QuoteForm({ quote, onSubmit, onCancel }: QuoteFormProps) {
  const { clients, uploadQuoteFile } = useCRMStore();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [cajas, setCajas] = useState<any[]>([]);
  
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    diferencia: number;
    data: any;
  }>({ open: false, title: "", description: "", diferencia: 0, data: null });

  const form = useForm({
    defaultValues: quote ? {
      ...quote,
      cajaId: "",
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
    },
  });

  const [hitos, setHitos] = useState<any[]>(
    quote?.hitosPago && quote.hitosPago.length > 0
      ? quote.hitosPago.map((h: any) => ({ ...h, monto: Number(h.monto), porcentaje: Number(h.porcentaje), estado: h.estado || 'PENDIENTE' }))
      : [
          { descripcion: "Adelanto inicial", porcentaje: 40, monto: 0, estado: 'COBRADO' },
          { descripcion: "Finalización de obra", porcentaje: 60, monto: 0, estado: 'PENDIENTE' },
        ]
  );

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
    setHitos([...hitos, { descripcion: "Nueva Valorización", porcentaje: restante, monto: (totalMonto * restante) / 100 }]);
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

  const selectedClientId = form.watch("clientId");
  const currentEstado = form.watch("estado");
  const isApproved = currentEstado === "Aprobado";
  const hasCobradoHitos = hitos.some(h => h.estado === 'COBRADO');
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
      alert("Debes seleccionar una caja de destino para el ingreso del dinero.");
      return;
    }

    if (quote && needsCaja && (quote.estado === 'Aprobado' || hasCobradoHitos)) {
      const nuevoMonto = Number(data.monto);
      const montoAnterior = Number(quote.monto);
      const diferencia = nuevoMonto - montoAnterior;

      if (diferencia !== 0) {
        const signo = diferencia > 0 ? '+' : '-';
        const simboloMoneda = data.moneda === 'PEN' ? 'S/' : '$';
        setConfirmDialog({
          open: true,
          title: "Ajuste en Caja Requerido",
          description: `La cotización pasará de ${simboloMoneda} ${montoAnterior.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} a ${simboloMoneda} ${nuevoMonto.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}.

Se generará un ajuste de ${signo}${simboloMoneda} ${Math.abs(diferencia).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} en la caja seleccionada.

¿Desea continuar?`,
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

            {needsCaja && (
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 animate-in fade-in slide-in-from-top-2 duration-300">
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
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className="h-11 border-blue-200 bg-white font-black text-xs uppercase text-blue-700 shadow-sm">
                            <SelectValue placeholder="SELECCIONAR CAJA DE DESTINO..." />
                          </SelectTrigger>
                          <SelectContent className="bg-white">
                            {cajas.filter(c => c.moneda === currentMoneda).map(caja => (
                              <SelectItem key={caja.id} value={caja.id} className="text-xs font-bold uppercase">
                                {caja.nombre} ({caja.moneda})
                              </SelectItem>
                            ))}
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
          
          <Separator className="opacity-50" />

          {/* SECCIÓN 3: PLAN DE FACTURACIÓN (HITOS) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                Plan de Facturación y Adelantos
              </h3>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm"
                onClick={addHito}
                className="h-7 text-[9px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 rounded-lg"
              >
                <List className="w-3 h-3 mr-1" /> Añadir Hito
              </Button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
              <div className="grid grid-cols-12 gap-3 text-[9px] font-black uppercase text-slate-400 px-2">
                <div className="col-span-4">Descripción del Hito</div>
                <div className="col-span-2 text-center">Estado</div>
                <div className="col-span-2 text-center">%</div>
                <div className="col-span-3 text-right">Monto Estimado</div>
                <div className="col-span-1"></div>
              </div>

              <div className="space-y-2">
                {hitos.map((hito, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-3 items-center bg-white p-2 rounded-xl border border-slate-100 shadow-sm animate-in fade-in slide-in-from-left-2 duration-300">
                    <div className="col-span-4">
                      <Input 
                        value={hito.descripcion} 
                        onChange={(e) => handleHitoChange(idx, 'descripcion', e.target.value)}
                        placeholder="Ej: Adelanto inicial"
                        className="h-9 text-xs font-bold border-transparent bg-slate-50/50 focus:bg-white rounded-lg"
                      />
                    </div>
                    <div className="col-span-2">
                      <Select 
                        value={hito.estado || 'PENDIENTE'} 
                        onValueChange={(val) => handleHitoChange(idx, 'estado', val)}
                      >
                        <SelectTrigger className="h-9 border-transparent bg-slate-50/50 text-[10px] font-black uppercase rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value="PENDIENTE" className="text-[10px] font-black uppercase">Pendiente</SelectItem>
                          <SelectItem value="FACTURADO" className="text-[10px] font-black uppercase text-blue-600">Facturado</SelectItem>
                          <SelectItem value="COBRADO" className="text-[10px] font-black uppercase text-success">Aprobado / Cobrado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <div className="relative">
                        <Input 
                          type="number"
                          value={hito.porcentaje} 
                          onChange={(e) => handleHitoChange(idx, 'porcentaje', e.target.value)}
                          className="h-9 text-center text-xs font-black text-primary border-transparent bg-slate-50/50 focus:bg-white pr-4 rounded-lg"
                        />
                        <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400">%</span>
                      </div>
                    </div>
                    <div className="col-span-3">
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400">{currentMoneda === 'PEN' ? 'S/' : '$'}</span>
                        <Input 
                          type="number"
                          value={hito.monto} 
                          onChange={(e) => handleHitoChange(idx, 'monto', e.target.value)}
                          className="h-9 text-right text-xs font-black text-primary border-transparent bg-slate-50/50 focus:bg-white pl-6 rounded-lg"
                        />
                      </div>
                    </div>
                    <div className="col-span-1 text-right">
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeHito(idx)}
                        disabled={hitos.length <= 1}
                        className="h-8 w-8 text-slate-300 hover:text-error hover:bg-red-50 rounded-full"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 px-2 border-t border-dashed border-slate-200 mt-4">
                <div className="flex items-center gap-4">
                   <div className="flex flex-col">
                      <span className="text-[8px] font-black uppercase text-slate-400 tracking-tighter">Suma Total</span>
                      <span className={cn(
                        "text-xs font-black",
                        isPlanValid ? "text-success" : "text-error"
                      )}>
                        {totalPorcentaje.toFixed(1)}% / 100%
                      </span>
                   </div>
                   {!isPlanValid && (
                     <div className="flex items-center gap-1.5 text-error animate-pulse">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span className="text-[8px] font-black uppercase">Debe sumar 100%</span>
                     </div>
                   )}
                </div>
                <div className="text-right">
                   <span className="text-[8px] font-black uppercase text-slate-400 tracking-tighter">Total Programado</span>
                   <p className="text-sm font-black text-primary">{currentMoneda === 'PEN' ? 'S/' : '$'} {totalMonto.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                </div>
              </div>
            </div>
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
              Confirmar Ajuste
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
