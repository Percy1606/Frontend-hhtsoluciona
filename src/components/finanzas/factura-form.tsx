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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import { Factura } from "@/types/finanzas";
import { cn, getSecureUrl } from "@/lib/utils";
import { Loader2, FileText, Wallet, Lock, DollarSign, Calendar, Building2, Receipt, ShieldCheck, AlertCircle, ChevronDown, ChevronRight, CloudUpload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Combobox } from "@/components/ui/combobox";
import { toast } from "sonner";

interface FacturaFormProps {
  initialData?: Factura | null;
  existingFacturas?: Factura[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

// Diccionarios de Negocio
const CLASIFICACIONES_NEGOCIO: Record<string, string> = {
  VENTA_SERVICIO: "Servicios Generales",
  PROYECTO: "Facturación de Proyecto",
  ALQUILER_EQUIPOS: "Alquiler de Equipos"
};

const ESTADOS_FACTURA: Record<string, { label: string, color: string }> = {
  PENDIENTE: { label: "Pendiente de Cobro", color: "bg-amber-100 text-amber-700 border-amber-200" },
  PAGO_PARCIAL: { label: "Pago Parcial", color: "bg-blue-100 text-blue-700 border-blue-200" },
  PAGADA: { label: "Cancelada / Pagada", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  VENCIDA: { label: "Vencida", color: "bg-red-100 text-red-700 border-red-200" },
  ANULADA: { label: "Anulada", color: "bg-slate-100 text-slate-600 border-slate-200" },
};



const getLocalDateString = (date?: string | Date) => {
  if (!date) {
    const d = new Date();
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().split('T')[0];
  }
  const d = new Date(date);
  if (typeof date === 'string' && date.includes('T')) {
    return date.split('T')[0];
  }
  return d.toISOString().split('T')[0];
};

export function FacturaForm({ initialData, existingFacturas = [], onSubmit, onCancel }: FacturaFormProps) {
  const [clientes, setClientes] = useState<any[]>([]);
  const [proyectos, setProyectos] = useState<any[]>([]);
  const [cajas, setCajas] = useState<any[]>([]);
  const [hitos, setHitos] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isManualBalance, setIsManualBalance] = useState(!!initialData);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const form = useForm({
    defaultValues: {
      codigo: initialData?.codigo || "",
      estado: initialData?.estado || "PENDIENTE",
      clasificacion: initialData?.clasificacion || "VENTA_SERVICIO",
      clienteId: (initialData?.clienteId === "none" ? "" : initialData?.clienteId) || "",
      proyectoId: initialData?.proyectoId || "none",
      hitoPagoId: (initialData as any)?.hitoPagoId || "none",
      cajaId: (initialData as any)?.cajaId || "",
      montoSubtotal: initialData?.montoSubtotal || 0,
      montoIgv: initialData?.montoIgv || 0,
      montoTotal: initialData?.montoTotal || 0,
      saldoPendiente: initialData?.saldoPendiente || 0,
      fechaEmision: getLocalDateString(initialData?.fechaEmision),
      fechaVencimiento: initialData?.fechaVencimiento ? getLocalDateString(initialData.fechaVencimiento) : "",
      observaciones: initialData?.observaciones || "",
      archivoUrl: initialData?.archivoUrl || "",
    },
  });

  const selectedClienteId = form.watch("clienteId");
  const selectedProyectoId = form.watch("proyectoId");
  const watchTotal = form.watch("montoTotal");
  const watchSaldo = form.watch("saldoPendiente");
  const watchSubtotal = form.watch("montoSubtotal");
  const watchIgv = form.watch("montoIgv");
  const watchCodigo = form.watch("codigo");
  const watchCajaId = form.watch("cajaId");

  const facturasProyecto = existingFacturas.filter(
    (f: any) => selectedProyectoId && selectedProyectoId !== "none" && f.proyectoId === selectedProyectoId && f.id !== initialData?.id
  );
  const showProyectoWarning = !initialData && facturasProyecto.length > 0;

  // Verificación de código duplicado
  const isDuplicateCode = useMemo(() => {
    if (!watchCodigo || !watchCodigo.trim() || initialData) return false;
    const cleanCode = watchCodigo.trim().toLowerCase();
    return existingFacturas.some(f => f.codigo && f.codigo.trim().toLowerCase() === cleanCode);
  }, [watchCodigo, existingFacturas, initialData]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsRes, projectsRes, cajasRes] = await Promise.all([
          api.get('/crm/clientes?limit=500'),
          api.get('/finanzas/bandeja-proyectos'),
          api.get('/finanzas/cajas')
        ]);
        
        setClientes(Array.isArray(clientsRes) ? clientsRes : (clientsRes.data || []));
        setProyectos(Array.isArray(projectsRes) ? projectsRes : (projectsRes.data || []));
        const cajasList = Array.isArray(cajasRes) ? cajasRes : (cajasRes.data || []);
        setCajas(cajasList);
      } catch (e) {
        console.error("Error cargando datos del formulario de facturas", e);
      }
    };
    fetchData();
  }, []);

  // Cargar Hitos cuando cambie el Proyecto
  useEffect(() => {
    if (selectedProyectoId && selectedProyectoId !== "none") {
      api.get(`/finanzas/bandeja-proyectos/${selectedProyectoId}/detalle`)
        .then(res => {
          if (res?.cotizacionOrigen?.hitosPago) {
            setHitos(res.cotizacionOrigen.hitosPago);
          } else {
            setHitos([]);
          }
        })
        .catch(() => setHitos([]));
    } else {
      setHitos([]);
    }
  }, [selectedProyectoId]);

  const clientOptions = useMemo(() => clientes.map(c => ({
    value: c.id,
    label: c.empresa || c.nombre || "Cliente sin nombre",
    subLabel: `RUC/DNI: ${c.ruc || c.dni || 'N/A'}`
  })), [clientes]);

  const projectOptions = useMemo(() => {
    let filtered = proyectos;
    if (selectedClienteId) filtered = filtered.filter(p => (p.clienteId || p.clientId || p.cliente?.id) === selectedClienteId);
    
    return [
      { value: "none", label: "Facturación General (Sin Proyecto Directo)" },
      ...filtered.map(p => ({
        value: p.id,
        label: `${p.codigo || 'PROY'} - ${p.nombre}`,
        subLabel: `CLIENTE: ${p.cliente?.razonSocial || p.cliente?.empresa || 'S/N'}`
      }))
    ];
  }, [proyectos, selectedClienteId]);

  const hitosOptions = useMemo(() => {
    return [
      { value: "none", label: "Factura Libre (Sin Hito Específico)" },
      ...hitos.map(h => ({
        value: h.id,
        label: h.descripcion || `Cuota Asignada (Ref: ${h.codigo || 'N/A'})`,
        subLabel: `S/ ${Number(h.monto).toLocaleString("es-PE", { minimumFractionDigits: 2 })} - Cotización: ${h.cotizacion?.codigo || 'N/A'}`
      }))
    ];
  }, [hitos]);

  const recalculateAmounts = (newTotal: number) => {
    if (newTotal === 0) {
      form.setValue("montoSubtotal", 0);
      form.setValue("montoIgv", 0);
      form.setValue("saldoPendiente", 0);
      return;
    }
    const base = newTotal / 1.18;
    const igv = newTotal - base;
    
    form.setValue("montoSubtotal", parseFloat(base.toFixed(2)));
    form.setValue("montoIgv", parseFloat(igv.toFixed(2)));
    
    if (!isManualBalance && !initialData) {
      form.setValue("saldoPendiente", newTotal);
    }
  };

  const uploadFile = async (file: File) => {
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await api.post("/crm/upload", formData);
      form.setValue("archivoUrl", res.url);
      toast.success("Documento adjuntado correctamente");
    } catch (e) {
      console.error("Upload error", e);
      toast.error("Error al subir el archivo de factura.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  const submitForm = async (data: any) => {
    if (!data.clienteId || data.clienteId === "none") {
      form.setError("clienteId", { message: "El cliente es obligatorio." });
      return;
    }
    
    const payload = { 
      ...data,
      montoSubtotal: Number(data.montoSubtotal || 0),
      montoIgv: Number(data.montoIgv || 0),
      montoTotal: Number(data.montoTotal || 0),
      saldoPendiente: Number(data.saldoPendiente || 0),
    };
    if (payload.proyectoId === "none") payload.proyectoId = null;
    if (payload.hitoPagoId === "none") payload.hitoPagoId = null;

    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmit(payload);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalNum = Number(watchTotal) || 0;
  const isFormValid = Boolean(
    watchCodigo && watchCodigo.trim() && 
    selectedClienteId && selectedClienteId !== "none" && 
    totalNum > 0 &&
    (initialData || watchCajaId)
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submitForm)} className="flex flex-col h-full bg-white w-full">
        <ScrollArea className="flex-1 px-6 py-4">
          <div className="space-y-4 max-w-full">
            
            {/* FILA 1: Número de Factura | Clasificación */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="codigo"
                rules={{ required: "El número de documento es obligatorio" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-slate-700">
                      N.º de factura / comprobante <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ej. F001-000123" 
                        {...field} 
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        className={cn(
                          "bg-white border-slate-200 h-10 text-xs font-semibold uppercase",
                          isDuplicateCode && "border-amber-400 bg-amber-50/50"
                        )} 
                      />
                    </FormControl>
                    {isDuplicateCode && (
                      <p className="text-[11px] text-amber-700 font-medium mt-1">
                        Aviso: Ya existe un comprobante registrado con este número.
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="clasificacion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-slate-700">
                      Clasificación comercial
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-white border-slate-200 h-10 text-xs font-medium">
                          <SelectValue placeholder="Clasificación" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white">
                        {Object.entries(CLASIFICACIONES_NEGOCIO).map(([key, label]) => (
                          <SelectItem key={key} value={key} className="text-xs font-medium">{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* FILA 2: Cliente / Empresa | Proyecto Asociado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="clienteId"
                rules={{ required: "El cliente es obligatorio" }}
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-xs font-semibold text-slate-700">
                      Empresa / Cliente <span className="text-red-500">*</span>
                    </FormLabel>
                    <Combobox
                      options={clientOptions}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Seleccionar o buscar cliente..."
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="proyectoId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-xs font-semibold text-slate-700">
                      Proyecto asociado
                    </FormLabel>
                    <Combobox
                      options={projectOptions}
                      value={field.value || "none"}
                      onChange={(val: string) => {
                        field.onChange(val);
                        form.setValue("hitoPagoId", "none");
                        if (val && val !== "none") {
                          const selected = proyectos.find((p) => p.id === val);
                          const cId = selected?.clienteId || selected?.clientId || selected?.cliente?.id;
                          if (cId) {
                            form.setValue("clienteId", cId, { shouldValidate: true });
                          }
                        }
                      }}
                      placeholder="Seleccionar proyecto..."
                      className={initialData ? "pointer-events-none opacity-60" : ""}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {showProyectoWarning && (
              <div className="bg-amber-50/80 border border-amber-200 p-3 rounded-xl text-amber-900 text-xs">
                <p className="font-semibold mb-1">Aviso sobre el proyecto seleccionado:</p>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Este proyecto ya cuenta con facturas registradas en la Bandeja de Proyectos. Verifica que este registro no sea un duplicado antes de guardar.
                </p>
              </div>
            )}

            {/* FILA 3: Monto Total (con desglose automático) | Cuenta / Caja de Ingreso */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="montoTotal"
                rules={{ required: "El monto total es obligatorio" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-slate-700">
                      Monto total (con IGV) <span className="text-red-500">*</span>
                    </FormLabel>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500">
                        S/
                      </span>
                      <FormControl>
                        <Input 
                          type="text" 
                          autoComplete="off"
                          placeholder="0.00"
                          value={field.value === 0 ? "" : field.value}
                          onChange={e => {
                            let rawValue = e.target.value.replace(/[^0-9.]/g, '');
                            const parts = rawValue.split('.');
                            if (parts.length > 2) rawValue = parts[0] + '.' + parts.slice(1).join('');
                            field.onChange(rawValue);
                            recalculateAmounts(parseFloat(rawValue) || 0);
                          }}
                          className="bg-white border-slate-200 h-10 pl-8 text-xs font-semibold text-slate-800 focus-visible:ring-1 focus-visible:ring-slate-400"
                        />
                      </FormControl>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 pt-0.5">
                      <span>Base: S/ {Number(watchSubtotal).toFixed(2)}</span>
                      <span>IGV (18%): S/ {Number(watchIgv).toFixed(2)}</span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!initialData ? (
                <FormField
                  control={form.control}
                  name="cajaId"
                  rules={{ required: "La cuenta de destino es obligatoria" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-slate-700">
                        Cuenta / caja de ingreso <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white border-slate-200 h-10 text-xs font-normal">
                            <SelectValue placeholder="Seleccionar cuenta de destino..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white">
                          {cajas.map((c) => (
                            <SelectItem key={c.id} value={c.id} className="text-xs">
                              <span className="font-medium text-slate-800">{c.nombre}</span>
                              <span className="text-slate-400 ml-1.5 font-normal">
                                (Saldo: S/ {Number(c.saldoReal).toLocaleString("es-PE", { minimumFractionDigits: 2 })})
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <FormField
                  control={form.control}
                  name="estado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-slate-700">
                        Estado de la factura
                      </FormLabel>
                      <Select
                        disabled={initialData?.estado === "PAGADA" || initialData?.estado === "ANULADA"}
                        onValueChange={(value) => {
                          field.onChange(value);
                          if (value === "PAGADA") {
                            setIsManualBalance(true);
                            form.setValue("saldoPendiente", 0);
                          }
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-white border-slate-200 h-10 text-xs font-medium">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white">
                          {Object.entries(ESTADOS_FACTURA).map(([key, obj]) => (
                            <SelectItem key={key} value={key} className="text-xs font-medium">
                              {obj.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* SECCIÓN COLAPSABLE: Opciones avanzadas */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors py-1 group"
              >
                {showAdvanced ? (
                  <ChevronDown className="w-4 h-4 text-slate-500 group-hover:text-slate-800 transition-transform" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-800 transition-transform" />
                )}
                <span>Opciones avanzadas</span>
              </button>

              {showAdvanced && (
                <div className="mt-3 p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-4 transition-all">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Fecha de emisión */}
                    <FormField
                      control={form.control}
                      name="fechaEmision"
                      rules={{ required: "Requerido" }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[11px] font-semibold text-slate-600">Fecha de emisión</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} className="bg-white border-slate-200 h-9 text-xs" />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {/* Fecha de vencimiento */}
                    <FormField
                      control={form.control}
                      name="fechaVencimiento"
                      rules={{ required: "Requerido" }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[11px] font-semibold text-slate-600">Fecha de vencimiento</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} className="bg-white border-slate-200 h-9 text-xs" />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {/* Hito de pago */}
                    <FormField
                      control={form.control}
                      name="hitoPagoId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[11px] font-semibold text-slate-600">Hito comercial</FormLabel>
                          <Select
                            value={field.value || "none"}
                            onValueChange={field.onChange}
                            disabled={!selectedProyectoId || selectedProyectoId === "none"}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-white border-slate-200 h-9 text-xs">
                                <SelectValue placeholder="Seleccionar hito..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-white">
                              {hitosOptions.map((h) => (
                                <SelectItem key={h.value} value={h.value} className="text-xs">
                                  {h.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Observaciones */}
                  <FormField
                    control={form.control}
                    name="observaciones"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[11px] font-semibold text-slate-600">Notas u observaciones</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Detalles sobre la factura, orden de compra del cliente o condiciones de pago..."
                            className="bg-white border-slate-200 min-h-[60px] text-xs resize-none"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Zona de carga moderna: Archivo PDF / XML */}
                  <FormField
                    control={form.control}
                    name="archivoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[11px] font-semibold text-slate-600">
                          Comprobante digital (PDF o XML)
                        </FormLabel>
                        <FormControl>
                          <div>
                            {field.value ? (
                              <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg">
                                <div className="flex items-center gap-2 text-xs text-slate-700">
                                  <FileText className="w-4 h-4 text-primary" />
                                  <span className="font-medium truncate max-w-[280px]">Comprobante adjuntado</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <a 
                                    href={getSecureUrl(field.value)} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="text-xs text-primary hover:underline font-medium"
                                  >
                                    Ver archivo
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => field.onChange("")}
                                    className="text-xs text-red-500 hover:text-red-700 font-medium ml-2"
                                  >
                                    Cambiar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={handleDrop}
                                className={cn(
                                  "border-2 border-dashed rounded-xl p-4 text-center transition-colors bg-white cursor-pointer hover:bg-slate-50/80",
                                  isDragging ? "border-primary bg-primary/5" : "border-slate-200"
                                )}
                                onClick={() => document.getElementById("factura-file-upload")?.click()}
                              >
                                <input
                                  id="factura-file-upload"
                                  type="file"
                                  accept=".pdf,.xml,.jpg,.png"
                                  className="hidden"
                                  onChange={handleFileChange}
                                />
                                {isUploading ? (
                                  <div className="flex items-center justify-center gap-2 text-xs text-slate-500 py-1">
                                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                    <span>Subiendo archivo...</span>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center justify-center gap-1 py-1">
                                    <CloudUpload className="w-5 h-5 text-slate-400" />
                                    <p className="text-xs text-slate-600 font-medium">
                                      Arrastra un archivo aquí o haz clic para seleccionar
                                    </p>
                                    <p className="text-[10px] text-slate-400">PDF, XML o Imagen hasta 15 MB</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

          </div>
        </ScrollArea>
        
        {/* FOOTER FIJO */}
        <div className="flex-shrink-0 flex items-center justify-end gap-3 px-6 py-3 border-t border-slate-100 bg-white">
          <Button 
            type="button" 
            variant="ghost" 
            onClick={onCancel} 
            className="text-xs font-medium text-slate-600 hover:text-slate-900 h-9 px-4"
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting || !isFormValid} 
            className="text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white h-9 px-5 rounded-lg disabled:opacity-40 shadow-sm"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Guardando...
              </span>
            ) : initialData ? (
              "Actualizar factura"
            ) : (
              "Guardar factura"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
