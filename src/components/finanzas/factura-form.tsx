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
import { Combobox } from "@/components/ui/combobox";
import { Factura } from "@/types/finanzas";
import { cn, getSecureUrl } from "@/lib/utils";
import { Loader2, FileText, Wallet, Lock, DollarSign, Calendar } from "lucide-react";

interface FacturaFormProps {
  initialData?: Factura | null;
  existingFacturas?: Factura[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

// Componente personalizado para búsqueda y selección
function CustomSearchSelect({ options, value, onChange, placeholder, disabled = false }: any) {
  const [search, setSearch] = useState("");
  const filtered = options.filter((o: any) => 
    o.label.toLowerCase().includes(search.toLowerCase()) || 
    (o.subLabel && o.subLabel.toLowerCase().includes(search.toLowerCase()))
  );

  const selectedLabel = options.find((o: any) => o.value === value)?.label || "";

  return (
    <div className="relative">
      <Select onValueChange={onChange} value={value} disabled={disabled}>
        <SelectTrigger className="h-10 font-bold text-xs bg-white border-slate-200">
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
              <div className="p-2 text-center text-xs text-slate-400 font-bold uppercase">No resultados</div>
            ) : (
              filtered.map((opt: any) => (
                <SelectItem key={opt.value} value={opt.value} className="font-bold text-xs py-2">
                  <div className="flex flex-col">
                    <span>{opt.label}</span>
                    {opt.subLabel && <span className="text-[9px] text-slate-400 font-normal">{opt.subLabel}</span>}
                  </div>
                </SelectItem>
              ))
            )}
          </ScrollArea>
        </SelectContent>
      </Select>
    </div>
  );
}

export function FacturaForm({ initialData, existingFacturas = [], onSubmit, onCancel }: FacturaFormProps) {
  const [clientes, setClientes] = useState<any[]>([]);
  const [proyectos, setProyectos] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isManualBalance, setIsManualBalance] = useState(!!initialData);

  const [cajas, setCajas] = useState<any[]>([]);
  const [totalAdelantos, setTotalAdelantos] = useState(0);

  const form = useForm({
    defaultValues: {
      codigo: initialData?.codigo || "",
      estado: initialData?.estado || "PENDIENTE",
      clasificacion: initialData?.clasificacion || "VENTA_SERVICIO",
      clienteId: initialData?.clienteId || "",
      proyectoId: initialData?.proyectoId || "",
      cajaId: (initialData as any)?.cajaId || "",
      montoSubtotal: initialData?.montoSubtotal || 0,
      montoIgv: initialData?.montoIgv || 0,
      montoTotal: initialData?.montoTotal || 0,
      saldoPendiente: initialData?.saldoPendiente || 0,
      fechaEmision: initialData?.fechaEmision ? new Date(initialData.fechaEmision).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      fechaVencimiento: initialData?.fechaVencimiento ? new Date(initialData.fechaVencimiento).toISOString().split('T')[0] : "",
      observaciones: initialData?.observaciones || "",
      archivoUrl: initialData?.archivoUrl || "",
    },
  });

  const selectedProyectoId = form.watch("proyectoId");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsRes, projectsRes, cajasRes] = await Promise.all([
          api.get('/crm/clientes?limit=500'),
          api.get('/operaciones/proyectos?limit=500'),
          api.get('/finanzas/cajas')
        ]);
        
        // Manejo robusto de respuestas (pueden ser array directo o { data: [] })
        setClientes(Array.isArray(clientsRes) ? clientsRes : (clientsRes.data || []));
        setProyectos(Array.isArray(projectsRes) ? projectsRes : (projectsRes.data || []));
        setCajas(Array.isArray(cajasRes) ? cajasRes : (cajasRes.data || []));
        
        if (Array.isArray(cajasRes) && cajasRes.length > 0 && !form.getValues('cajaId')) {
            form.setValue('cajaId', cajasRes[0].id);
        }
      } catch (e) {
        console.error("Error cargando datos para el formulario", e);
      }
    };
    fetchData();
  }, []);

  // Efecto para recuperar adelantos cuando cambia el proyecto
  useEffect(() => {
    if (selectedProyectoId && selectedProyectoId !== "none") {
      api.get(`/finanzas/adelantos?proyectoId=${selectedProyectoId}`).then(res => {
        const total = Array.isArray(res) ? res.reduce((acc, a) => acc + Number(a.saldoDisponible), 0) : 0;
        setTotalAdelantos(total);
        
        // Si estamos registrando una nueva factura, sugerimos el descuento
        if (!initialData) {
            const montoTotal = Number(form.getValues("montoTotal"));
            if (montoTotal > 0) {
                const sugerido = Math.max(0, montoTotal - total);
                form.setValue("saldoPendiente", sugerido);
                if (sugerido === 0) form.setValue("estado", "PAGADA");
            }
        }
      });
    } else {
      setTotalAdelantos(0);
    }
  }, [selectedProyectoId, initialData]);

  const selectedClienteId = form.watch("clienteId");

  const filteredProyectos = useMemo(() => {
    if (!selectedClienteId) return [];
    return proyectos.filter(p => p.clientId === selectedClienteId);
  }, [proyectos, selectedClienteId]);

  // Manejo de carga de archivo
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await api.post('/crm/cotizaciones/upload', formData);
      form.setValue('archivoUrl', res.url);
    } catch (error) {
      console.error("Error subiendo archivo:", error);
    } finally {
      setIsUploading(false);
    }
  };

  // Función unificada para recalcular montos
  const recalculateAmounts = (subtotal: number, igv?: number, total?: number) => {
    // Solo bloqueamos el cálculo automático si es una EDICIÓN de una factura existente (tiene ID)
    if (initialData?.id) return;

    const finalSubtotal = subtotal;
    const finalIgv = igv !== undefined ? igv : Math.round((finalSubtotal * 0.18) * 100) / 100;
    const finalTotal = total !== undefined ? total : Math.round((finalSubtotal + finalIgv) * 100) / 100;

    form.setValue("montoIgv", finalIgv);
    form.setValue("montoTotal", finalTotal);

    // Si el usuario ya seleccionó manualmente el estado, NO recalcular nada
    // Esto respeta la decisión del usuario de marcar como PAGADA
    if (isManualBalance) return;

    // Solo recalcular automáticamente si el usuario NO ha modificado el saldo manualmente
    const sugerido = Math.max(0, finalTotal - totalAdelantos);
    form.setValue("saldoPendiente", sugerido);

    // Determinar estado automáticamente solo si el usuario NO ha elegido uno explícitamente
    // El usuario puede elegir "PAGADA" manualmente, y esa decisión debe respetarse
    const currentEstado = form.getValues("estado");
    if (currentEstado !== "PAGADA" && currentEstado !== "PAGO_PARCIAL" && currentEstado !== "PENDIENTE") {
      if (sugerido === 0 && finalTotal > 0) {
        form.setValue("estado", "PAGADA");
      } else if (sugerido < finalTotal) {
        form.setValue("estado", "PAGO_PARCIAL");
      } else {
        form.setValue("estado", "PENDIENTE");
      }
    }
  };

  const clientOptions = useMemo(() => 
    clientes.map(c => ({
      value: c.id,
      label: c.empresa,
      subLabel: `RUC: ${c.ruc}`
    })), [clientes]);

  const projectOptions = useMemo(() => {
    const options: { value: string; label: string; subLabel?: string }[] = [];
    
    // Si no estamos obligados a un proyecto (es edición o creación global), añadimos la opción 'none'
    if (!initialData?.proyectoId) {
        options.push({ value: "none", label: "Sin Proyecto (Factura Directa)" });
    }

    filteredProyectos.forEach(p => {
      options.push({
        value: p.id,
        label: p.nombre,
        subLabel: `CÓDIGO: ${p.codigo}`
      });
    });
    return options;
  }, [filteredProyectos, initialData]);

  const handleLocalSubmit = (data: any) => {
    const clienteId = data.clienteId;
    // Si viene de initialData (panel proyectos) o fue seleccionado explícitamente
    const rawProyectoId = data.proyectoId;
    const proyectoId = (rawProyectoId === "none" || rawProyectoId === "" || !rawProyectoId) ? null : rawProyectoId;

    if (!initialData && existingFacturas.length > 0) {
      const duplicado = existingFacturas.find(f => 
        f.clienteId === clienteId && 
        (f.proyectoId === proyectoId || (!f.proyectoId && !proyectoId)) &&
        f.estado !== 'ANULADA'
      );

      if (duplicado) {
        const confirmMsg = proyectoId 
          ? `El cliente ya tiene una factura registrada para este proyecto (${duplicado.codigo}). ¿Desea registrar otra factura?`
          : `El cliente ya tiene una factura de Venta Directa registrada (${duplicado.codigo}). ¿Desea registrar otra?`;
        
        if (!window.confirm(confirmMsg)) {
          return;
        }
      }
    }

    const finalData = {
      ...data,
      montoSubtotal: parseFloat(data.montoSubtotal) || 0,
      montoIgv: parseFloat(data.montoIgv) || 0,
      montoTotal: parseFloat(data.montoTotal) || 0,
      saldoPendiente: parseFloat(data.saldoPendiente) || 0,
      proyectoId: proyectoId,
      isManual: isManualBalance,
    };
    onSubmit(finalData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleLocalSubmit)} className="flex flex-col h-[75vh] w-full">     
        <ScrollArea className="flex-grow min-h-0 pr-4">
          <div className="space-y-8 p-1 pb-6">
            
            {/* SECCIÓN 1: IDENTIFICACIÓN Y CLASIFICACIÓN */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-4 w-1 bg-secondary rounded-full" />
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Identificación y Clasificación</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="codigo"
                  rules={{ required: "Requerido" }}
                  render={({ field }) => (
                    <FormItem className="md:col-span-1">
                      <FormLabel className="font-bold text-[10px] uppercase text-slate-500 tracking-wider">Número de Factura</FormLabel>
                      <FormControl>
                        <Input placeholder="F001-000001" {...field} className="bg-white border-slate-200 h-10 font-bold" />
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
                      <FormLabel className="font-bold text-[10px] uppercase text-slate-500 tracking-wider">Estado</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          // Si el usuario elige PAGADA manualmente, forzar saldo pendiente = 0
                          if (value === "PAGADA") {
                            setIsManualBalance(true);
                            form.setValue("saldoPendiente", 0);
                          }
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className={cn(
                            "h-10 font-bold text-xs",
                            field.value === 'PAGADA' ? "bg-green-50 border-green-200 text-green-700" : "bg-blue-50 border-blue-200 text-blue-700"
                          )}>
                            <SelectValue placeholder="Seleccione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="PENDIENTE" className="font-bold">Pendiente</SelectItem>
                          <SelectItem value="PAGADA" className="font-bold text-green-600">Pagada</SelectItem>
                          <SelectItem value="PAGO_PARCIAL" className="font-bold text-orange-600">Pago Parcial</SelectItem>
                          <SelectItem value="VENCIDA" className="font-bold text-red-600">Vencida</SelectItem>
                          <SelectItem value="ANULADA" className="font-bold text-slate-400">Anulada</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="clasificacion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-[10px] uppercase text-secondary tracking-wider">Clasificación *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white border-secondary/20 border-2 h-10 font-bold text-xs">
                            <SelectValue placeholder="Tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="VENTA_SERVICIO" className="font-bold">Venta de Servicios</SelectItem>
                          <SelectItem value="PROYECTO" className="font-bold">Proyecto</SelectItem>
                          <SelectItem value="ALQUILER_EQUIPOS" className="font-bold">Alquiler de Equipos</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* SECCIÓN 2: CLIENTE Y PROYECTO */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-4 w-1 bg-primary rounded-full" />
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Asociación de Cliente</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="clienteId"
                  rules={{ required: "Seleccione un cliente" }}
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="font-bold text-[10px] uppercase text-slate-500 tracking-wider">Cliente</FormLabel>
                      <FormControl>
                        <CustomSearchSelect
                          options={clientOptions}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Buscar cliente..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="proyectoId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="font-bold text-[10px] uppercase text-slate-500 tracking-wider">Proyecto Asociado</FormLabel>
                      <FormControl>
                        <CustomSearchSelect
                          options={projectOptions}
                          value={field.value || "none"}
                          onChange={(val: string) => field.onChange(val === "none" ? null : val)}
                          placeholder={selectedClienteId ? "Seleccione un proyecto..." : "Seleccione un cliente primero"}
                          disabled={!selectedClienteId}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* SECCIÓN 3: FECHAS DE FACTURACIÓN */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-4 w-1 bg-orange-400 rounded-full" />
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cronograma de Pagos</h4>
              </div>

              <div className="bg-emerald-50/50 p-5 rounded-2xl border-2 border-emerald-100 space-y-4 mb-4 shadow-sm">
                <FormField
                  control={form.control}
                  name="cajaId"
                  rules={{ required: "Debe seleccionar una cuenta de destino" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-black text-[10px] uppercase text-emerald-700 tracking-widest flex items-center gap-2">
                        <Wallet className="w-3.5 h-3.5" /> 💰 Destino de Fondos: ¿A qué cuenta ingresó este capital?
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white border-emerald-200 h-11 font-black text-xs shadow-sm">
                            <SelectValue>
                              {cajas.find(c => c.id === field.value)?.nombre || "Seleccione la cuenta de destino..."}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {cajas.map((c) => (
                            <SelectItem key={c.id} value={c.id} className="font-bold text-xs py-2">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                    <span>{c.nombre}</span>
                                    {c.esProtegida && <Lock className="w-3 h-3 text-primary" />}
                                </div>
                                <span className="text-[9px] text-emerald-600 font-black uppercase tracking-widest">Saldo Real: {Number(c.saldoReal).toLocaleString()}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fechaEmision"
                  rules={{ required: "Requerido" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-[10px] uppercase text-slate-500 tracking-wider">Fecha Emisión</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className="bg-white border-slate-200 h-10 font-bold" />
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
                      <FormLabel className="font-bold text-[10px] uppercase text-slate-500 tracking-wider">Fecha Vencimiento</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className="bg-white border-slate-200 h-10 font-bold text-red-600" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* SECCIÓN 4: MONTOS FINANCIEROS */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-4 w-1 bg-green-500 rounded-full" />
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Detalle de Importes</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-100 p-4 rounded-2xl border-2 border-slate-200 shadow-inner">
                <FormField
                  control={form.control}
                  name="montoSubtotal"
                  rules={{ required: "Requerido" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-black text-[10px] uppercase text-primary tracking-tighter">Total Base (S/)</FormLabel>
                      <FormControl>
                        <Input 
                          type="text" 
                          autoComplete="off"
                          placeholder="0.00"
                          value={field.value === 0 ? "" : Number(field.value).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                          onChange={e => {
                            const rawValue = e.target.value.replace(/[^0-9.]/g, '');
                            const val = parseFloat(rawValue) || 0;
                            field.onChange(val);
                            recalculateAmounts(val);
                          }}
                          className="bg-white border-slate-300 font-bold h-10 text-lg"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="montoIgv"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-black text-[10px] uppercase text-primary tracking-tighter">IGV (S/)</FormLabel>
                      <FormControl>
                        <Input 
                          type="text" 
                          autoComplete="off"
                          value={field.value === 0 ? "" : Number(field.value).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                          onChange={e => {
                            const rawValue = e.target.value.replace(/[^0-9.]/g, '');
                            const val = parseFloat(rawValue) || 0;
                            field.onChange(val);
                            const subtotal = parseFloat(form.getValues('montoSubtotal') as any) || 0;
                            recalculateAmounts(subtotal, val);
                          }}
                          className="bg-white border-slate-300 font-bold h-10" 
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="montoTotal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-black text-[10px] uppercase text-secondary tracking-tighter">Total</FormLabel>
                      <FormControl>
                        <Input 
                          type="text" 
                          autoComplete="off"
                          value={field.value === 0 ? "" : Number(field.value).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                          onChange={e => {
                            const rawValue = e.target.value.replace(/[^0-9.]/g, '');
                            const val = parseFloat(rawValue) || 0;
                            field.onChange(val);
                            const subtotal = parseFloat(form.getValues('montoSubtotal') as any) || 0;
                            const igv = parseFloat(form.getValues('montoIgv') as any) || 0;
                            recalculateAmounts(subtotal, igv, val);
                          }}
                          className="bg-secondary/10 border-secondary/20 font-black text-secondary text-xl h-10 shadow-sm" 
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="bg-red-50 p-4 rounded-2xl border border-red-100 mt-4">
                <FormField
                  control={form.control}
                  name="saldoPendiente"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-center mb-1">
                        <FormLabel className="font-black text-[10px] uppercase text-red-600 tracking-widest">Saldo Pendiente Manual (S/)</FormLabel>
                        {!initialData && isManualBalance && (
                          <Button 
                            type="button" 
                            variant="link" 
                            className="h-auto p-0 text-[8px] font-black uppercase text-slate-400"
                            onClick={() => {
                              setIsManualBalance(false);
                              form.setValue('saldoPendiente', form.getValues('montoTotal'));
                            }}
                          >
                            Resetear Auto
                          </Button>
                        )}
                      </div>
                      <FormControl>
                        <Input 
                          type="text" 
                          autoComplete="off"
                          value={field.value === 0 ? "" : Number(field.value).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                          onChange={e => {
                            const rawValue = e.target.value.replace(/[^0-9.]/g, '');
                            const val = parseFloat(rawValue) || 0;
                            field.onChange(val);
                            setIsManualBalance(true);
                          }}
                          className="bg-white border-red-200 font-black text-red-600 text-xl h-12 shadow-sm" 
                        />
                      </FormControl>
                      <p className="text-[9px] font-bold text-red-400 uppercase mt-1">Usa este campo para corregir el saldo si la factura ya tiene abonos externos.</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* SECCIÓN 5: ADJUNTO Y OBSERVACIONES */}
            <div className="space-y-4">
               <div className="flex items-center gap-2 mb-2">
                <div className="h-4 w-1 bg-slate-400 rounded-full" />
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Documento y Notas</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-bold text-[10px] uppercase text-slate-500 tracking-wider">Factura PDF / Imagen (Opcional)</Label>
                  <div className="flex items-center gap-3">
                    <Input 
                      type="file" 
                      onChange={handleFileChange} 
                      className="h-10 border-slate-200 cursor-pointer text-xs"
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                    {isUploading && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
                    {form.watch("archivoUrl") && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-10 px-3 border-secondary text-secondary hover:bg-secondary/5 font-black text-[10px] uppercase shrink-0"
                        onClick={() => {
                          const fullUrl = getSecureUrl(form.getValues("archivoUrl"));
                          window.open(fullUrl, '_blank');
                        }}
                      >
                        <FileText className="w-3.5 h-3.5 mr-1" /> Ver Archivo
                      </Button>
                    )}
                  </div>
                  {form.watch("archivoUrl") && (
                    <p className="text-[9px] font-black text-green-600 uppercase">Archivo cargado correctamente ✓</p>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="observaciones"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-[10px] uppercase text-slate-500 tracking-wider">Notas de Pago</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="..." 
                          {...field} 
                          className="bg-white border-slate-200 min-h-[80px] resize-none focus-visible:ring-secondary text-xs font-bold" 
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
        
        <div className="flex-shrink-0 flex justify-end gap-3 pt-6 border-t bg-white mt-auto">
          <Button type="button" variant="ghost" onClick={onCancel} className="font-black uppercase text-[10px] tracking-widest text-slate-500 hover:bg-slate-100 px-6">
            Cancelar
          </Button>
          <Button type="submit" className="font-black uppercase text-[10px] tracking-widest bg-secondary hover:bg-secondary/90 text-white px-10 shadow-lg shadow-secondary/20">
            {initialData ? "Actualizar Factura" : "Registrar Factura"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
