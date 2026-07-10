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
import { Loader2, FileText, Wallet, Lock, DollarSign, Calendar, Building2, Receipt, ShieldCheck, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

// Componente Búsqueda Personalizada (Combobox simplificado)
function CustomSearchSelect({ options, value, onChange, placeholder, disabled = false }: any) {
  const [search, setSearch] = useState("");
  const filtered = options.filter((o: any) => 
    o.label.toLowerCase().includes(search.toLowerCase()) || 
    (o.subLabel && o.subLabel.toLowerCase().includes(search.toLowerCase()))
  );
  const selectedLabel = options.find((o: any) => o.value === value)?.label || "";

  return (
    <Select onValueChange={onChange} value={value} disabled={disabled}>
      <SelectTrigger className="h-10 bg-white border-slate-200">
        <SelectValue placeholder={placeholder}>
          {selectedLabel || placeholder}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <div className="p-2 sticky top-0 bg-white z-10 border-b">
          <Input
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-xs mb-2"
            onKeyDown={(e) => e.stopPropagation()}
          />
        </div>
        <ScrollArea className="h-[200px]">
          {filtered.length === 0 ? (
            <div className="p-2 text-center text-xs text-slate-400">Sin resultados</div>
          ) : (
            filtered.map((opt: any) => (
              <SelectItem key={opt.value} value={opt.value} className="py-2">
                <div className="flex flex-col">
                  <span className="font-bold text-xs">{opt.label}</span>
                  {opt.subLabel && <span className="text-[10px] text-slate-400">{opt.subLabel}</span>}
                </div>
              </SelectItem>
            ))
          )}
        </ScrollArea>
      </SelectContent>
    </Select>
  );
}

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
  const [isManualBalance, setIsManualBalance] = useState(!!initialData);

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

  const facturasProyecto = existingFacturas.filter(
    (f: any) => selectedProyectoId && selectedProyectoId !== "none" && f.proyectoId === selectedProyectoId && f.id !== initialData?.id
  );
  const showProyectoWarning = !initialData && facturasProyecto.length > 0;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsRes, projectsRes, cajasRes] = await Promise.all([
          api.get('/crm/clientes?limit=500'),
          api.get('/operaciones/proyectos?limit=500'),
          api.get('/finanzas/cajas')
        ]);
        
        setClientes(Array.isArray(clientsRes) ? clientsRes : (clientsRes.data || []));
        setProyectos(Array.isArray(projectsRes) ? projectsRes : (projectsRes.data || []));
        setCajas(Array.isArray(cajasRes) ? cajasRes : (cajasRes.data || []));
        
        if (Array.isArray(cajasRes) && cajasRes.length > 0 && !form.getValues('cajaId')) {
            form.setValue('cajaId', cajasRes[0].id);
        }
      } catch (e) {
        console.error("Error loading form data", e);
      }
    };
    fetchData();
  }, []);

  // Fetch Hitos when Project changes
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
    
    // Filtrar: Solo mostrar proyectos cuya cotización de origen esté aprobada/ganada/orden de servicio
    filtered = filtered.filter((p: any) => {
      if (p.cotizacionOrigen) {
        const estadoCot = p.cotizacionOrigen?.estado?.toLowerCase();
        return (
          estadoCot === 'aprobada' ||
          estadoCot === 'ganada' ||
          estadoCot === 'orden_servicio' ||
          estadoCot === 'orden de servicio'
        );
      }
      return true; // Permitir proyectos manuales/venta directa
    });

    if (selectedClienteId) filtered = filtered.filter(p => (p.clienteId || p.clientId) === selectedClienteId);
    
    return [
      { value: "none", label: "-- Sin Proyecto (Venta Directa) --", subLabel: "" },
      ...filtered.map(p => ({
        value: p.id,
        label: p.nombre,
        subLabel: p.codigo
      }))
    ];
  }, [proyectos, selectedClienteId]);

  const hitosOptions = useMemo(() => {
    return [
      { value: "none", label: "-- Factura Libre (Sin hito) --", subLabel: "" },
      ...hitos.map(h => ({
        value: h.id,
        label: h.descripcion || `Cuota Asignada (Ref: ${h.codigo || 'N/A'})`,
        subLabel: `S/ ${Number(h.monto).toLocaleString()} - Cotización: ${h.cotizacion?.codigo || 'N/A'}`
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
    // Auto calcular Base e IGV
    const base = newTotal / 1.18;
    const igv = newTotal - base;
    
    form.setValue("montoSubtotal", parseFloat(base.toFixed(2)));
    form.setValue("montoIgv", parseFloat(igv.toFixed(2)));
    
    // Si no está editando manualmente el saldo, el saldo es igual al total (recién creada)
    if (!isManualBalance && !initialData) {
      form.setValue("saldoPendiente", newTotal);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await api.post("/crm/upload", formData);
      form.setValue("archivoUrl", res.url);
    } catch (e) {
      console.error("Upload error", e);
    } finally {
      setIsUploading(false);
    }
  };

  const submitForm = (data: any) => {
    if (!data.clienteId || data.clienteId === "none") {
      form.setError("clienteId", { message: "El cliente es estrictamente obligatorio." });
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

    onSubmit(payload);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submitForm)} className="flex flex-col h-full bg-slate-50">
        <ScrollArea className="flex-1 p-6">
          <div className="max-w-3xl mx-auto space-y-6">
            
            {/* BLOQUE A: IDENTIFICACIÓN Y CLIENTE */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">1. Identificación y Cliente</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField
                  control={form.control}
                  name="codigo"
                  rules={{ required: "Requerido" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-slate-500">Número de Factura *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej. F001-000123" {...field} className="font-bold bg-slate-50 uppercase" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="clasificacion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-slate-500">Clasificación Financiera</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="font-bold text-slate-700">
                            <SelectValue placeholder="Tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(CLASIFICACIONES_NEGOCIO).map(([key, label]) => (
                            <SelectItem key={key} value={key} className="font-bold">{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="clienteId"
                  rules={{ required: "El cliente es obligatorio" }}
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="text-xs font-bold text-slate-500">Empresa / Cliente *</FormLabel>
                      <FormControl>
                        <CustomSearchSelect
                          options={clientOptions}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="🔍 Seleccione un cliente registrado..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* BLOQUE B: TIEMPOS Y CICLO DE VIDA */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-500" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">2. Fechas y Estado</h3>
                </div>
                <Badge variant="outline" className={cn("px-3 py-1 font-black", form.watch("estado") === "PENDIENTE" && form.watch("montoTotal") === 0 ? "bg-slate-100 text-slate-500 border-slate-200" : (ESTADOS_FACTURA[form.watch("estado")]?.color || "bg-slate-100 text-slate-500"))}>
                  {form.watch("estado") === "PENDIENTE" && form.watch("montoTotal") === 0 ? "Borrador (Sin Monto)" : (ESTADOS_FACTURA[form.watch("estado")]?.label || form.watch("estado"))}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <FormField
                  control={form.control}
                  name="fechaEmision"
                  rules={{ required: "Requerido" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-slate-500">Fecha de Emisión</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className="font-bold text-slate-700" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fechaVencimiento"
                  rules={{ required: "Requerido" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-slate-500">Fecha de Vencimiento</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className="font-bold text-red-600 border-red-200 focus-visible:ring-red-500" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="estado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-slate-500">Cambiar Estado</FormLabel>
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
                          <SelectTrigger className="font-bold">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(ESTADOS_FACTURA).map(([key, obj]) => (
                            <SelectItem key={key} value={key} className="font-bold">
                              {obj.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {(initialData?.estado === "PAGADA" || initialData?.estado === "ANULADA") && (
                        <p className="text-[10px] text-amber-600 font-medium leading-tight mt-1">
                          El estado está bloqueado. Si necesitas revertir esta operación, debes eliminar (anular) el registro usando el botón de la papelera en la tabla.
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* BLOQUE C: RESUMEN FINANCIERO */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                <DollarSign className="w-40 h-40" />
              </div>
              <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                <Receipt className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">3. Resumen Financiero Automático</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                <FormField
                  control={form.control}
                  name="montoTotal"
                  rules={{ required: "Requerido" }}
                  render={({ field }) => (
                    <FormItem className="md:col-span-3">
                      <FormLabel className="text-xs font-black text-slate-700 uppercase tracking-widest">Ingrese el Monto Total (Incluido IGV) *</FormLabel>
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
                          className="bg-emerald-50 border-emerald-200 font-black h-10 text-base text-emerald-700 shadow-inner"
                        />
                      </FormControl>
                      <p className="text-[10px] text-slate-400">El sistema calculará automáticamente la Base y el IGV.</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Subtotal (Base)</p>
                  <p className="text-sm font-black text-slate-700">S/ {Number(watchSubtotal).toLocaleString("es-PE", { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">IGV (18%)</p>
                  <p className="text-sm font-black text-slate-700">S/ {Number(watchIgv).toLocaleString("es-PE", { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Cobrado a la fecha</p>
                  <p className="text-sm font-black text-blue-600">S/ {Math.max(0, Number(watchTotal) - Number(watchSaldo)).toLocaleString("es-PE", { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-red-50 p-2 rounded-lg -m-2">
                  <FormField
                    control={form.control}
                    name="saldoPendiente"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-bold text-red-500 uppercase flex justify-between">
                          Saldo Deuda 
                          {!initialData && isManualBalance && (
                            <button type="button" onClick={() => { setIsManualBalance(false); form.setValue('saldoPendiente', form.getValues('montoTotal')); }} className="text-[8px] text-red-400 underline">Reset</button>
                          )}
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="text" 
                            value={field.value === 0 ? "" : field.value}
                            onChange={e => {
                              let rawValue = e.target.value.replace(/[^0-9.]/g, '');
                              const parts = rawValue.split('.');
                              if (parts.length > 2) rawValue = parts[0] + '.' + parts.slice(1).join('');
                              field.onChange(rawValue);
                              setIsManualBalance(true);
                            }}
                            className="h-8 font-black text-red-600 bg-white border-red-200 px-2"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* BLOQUE D: CRONOGRAMA Y COBROS */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                <ShieldCheck className="w-5 h-5 text-indigo-500" />
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">4. Trazabilidad Comercial (Cronograma)</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                <FormField
                  control={form.control}
                  name="proyectoId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-slate-500">Proyecto de Origen</FormLabel>
                      <FormControl>
                        <CustomSearchSelect
                          options={projectOptions}
                          value={field.value}
                          onChange={(val: string) => {
                            field.onChange(val);
                            form.setValue("hitoPagoId", "none");
                            if (val && val !== "none") {
                              const selected = proyectos.find((p) => p.id === val);
                              if (selected && selected.clienteId) {
                                form.setValue("clienteId", selected.clienteId);
                              }
                            }
                          }}
                          placeholder="Buscar proyecto..."
                          disabled={!!initialData}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hitoPagoId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-slate-500">Hito / Cronograma</FormLabel>
                      <FormControl>
                        <CustomSearchSelect
                          options={hitosOptions}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Buscar hito o fase..."
                          disabled={!selectedProyectoId || selectedProyectoId === "none"}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

                {showProyectoWarning && (
                  <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-5 rounded-r-xl text-amber-800">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 mt-0.5 text-amber-600 flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-black uppercase tracking-wide mb-1">
                          ⚠️ ¡Alerta! Proyecto con Facturas Previas
                        </h4>
                        <p className="text-xs mb-2 leading-relaxed">
                          Este proyecto ya tiene <strong>{facturasProyecto.length} factura(s)</strong> generadas, probablemente desde la <strong>Bandeja de Proyectos</strong>. 
                          Si intentas cobrar un Hito/Adelanto, <span className="font-bold underline">no debes crear la factura aquí</span>. Usa este formulario solo si es por un servicio o adicional extra.
                        </p>
                        <div className="text-[10px] space-y-1 opacity-80 mt-2 bg-amber-100/50 p-2 rounded">
                          <p className="font-bold">Facturas existentes:</p>
                          {facturasProyecto.slice(0, 3).map((f: any) => (
                            <div key={f.id} className="flex justify-between border-b border-amber-200/50 pb-1">
                              <span>{f.codigo} - {f.estado}</span>
                              <span className="font-semibold">S/ {Number(f.montoTotal).toLocaleString("es-PE")}</span>
                            </div>
                          ))}
                          {facturasProyecto.length > 3 && <p className="pt-1">... y {facturasProyecto.length - 3} ms</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Si es una factura nueva, pedir caja */}
              {!initialData && (
                <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                  <FormField
                    control={form.control}
                    name="cajaId"
                    rules={{ required: "Se requiere caja de destino" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase text-indigo-700 tracking-widest flex items-center gap-2">
                          <Wallet className="w-3.5 h-3.5" /> ¿A qué caja ingresó o ingresará este dinero? *
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white border-indigo-200 font-bold h-10">
                              <SelectValue placeholder="Seleccione...">
                                {cajas.find(c => c.id === field.value)?.nombre || "Seleccione caja..."}
                              </SelectValue>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {cajas.map((c) => (
                              <SelectItem key={c.id} value={c.id} className="font-bold py-2">
                                {c.nombre} <span className="text-[9px] text-slate-400 font-normal ml-2">Saldo: S/ {Number(c.saldoReal).toLocaleString()}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

            {/* BLOQUE E: SOPORTES */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                <FileText className="w-5 h-5 text-slate-500" />
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">5. Soportes Físicos y Notas</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500">Documento PDF / XML (Opcional)</Label>
                  <div className="flex items-center gap-3">
                    <Input 
                      type="file" 
                      onChange={handleFileChange} 
                      className="h-10 cursor-pointer text-xs"
                      accept=".pdf,.xml,.jpg,.png"
                    />
                    {isUploading && <Loader2 className="w-5 h-5 animate-spin text-blue-600" />}
                    {form.watch("archivoUrl") && (
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10 border-blue-200 text-blue-700 bg-blue-50 font-bold text-xs"
                        onClick={() => window.open(getSecureUrl(form.getValues("archivoUrl")), '_blank')}
                      >
                        Ver Archivo
                      </Button>
                    )}
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="observaciones"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-slate-500">Notas u Observaciones (Opcional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Detalles sobre el pago, retenciones, etc."
                          className="min-h-[80px] text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

          </div>
        </ScrollArea>
        
        <div className="flex-shrink-0 flex justify-end gap-3 p-5 border-t border-slate-200 bg-white">
          <Button type="button" variant="ghost" onClick={onCancel} className="font-bold uppercase text-xs text-slate-500">
            Cancelar
          </Button>
          <Button type="submit" className="font-black uppercase text-xs bg-slate-800 hover:bg-slate-900 text-white px-8">
            {initialData ? "Actualizar ERP" : "Registrar Oficialmente"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
