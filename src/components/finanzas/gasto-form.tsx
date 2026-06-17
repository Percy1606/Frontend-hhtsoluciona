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
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import { Combobox } from "@/components/ui/combobox";
import { Gasto } from "@/types/finanzas";
import { cn } from "@/lib/utils";
import { Wallet, Lock, Loader2 } from "lucide-react";

interface GastoFormProps {
  initialData?: Gasto | null;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export function GastoForm({ initialData, onSubmit, onCancel }: GastoFormProps) {
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [proyectos, setProyectos] = useState<any[]>([]);

  const [cajas, setCajas] = useState<any[]>([]);

  const form = useForm({
    defaultValues: {
      codigo: initialData?.codigo || "",
      proveedorId: initialData?.proveedorId || "",
      proyectoId: initialData?.proyectoId || "",
      cajaId: (initialData as any)?.cajaId || "",
      tipo: initialData?.tipo || "OPERATIVO",
      prioridad: initialData?.prioridad || "MEDIA",
      clasificacion: initialData?.clasificacion || "VENTA_SERVICIO",
      categoriaDistribucion: initialData?.categoriaDistribucion || "",
      concepto: initialData?.concepto || "",
      montoTotal: initialData?.montoTotal || 0,
      fechaEmision: initialData?.fechaEmision ? new Date(initialData.fechaEmision).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      fechaVencimiento: initialData?.fechaVencimiento ? new Date(initialData.fechaVencimiento).toISOString().split('T')[0] : "",
      fechaProgramadaPago: initialData?.fechaProgramadaPago ? new Date(initialData.fechaProgramadaPago).toISOString().split('T')[0] : "",
      estado: initialData?.estado || "PENDIENTE",
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [provRes, projectsRes, cajasRes] = await Promise.all([
          api.get('/logistica/proveedores?limit=500'),
          api.get('/operaciones/proyectos?limit=500'),
          api.get('/finanzas/cajas')
        ]);
        
        // Manejo robusto de respuestas (pueden ser array directo o { data: [] })
        setProveedores(Array.isArray(provRes) ? provRes : (provRes.data || []));
        setProyectos(Array.isArray(projectsRes) ? projectsRes : (projectsRes.data || []));
        setCajas(Array.isArray(cajasRes) ? cajasRes : (cajasRes.data || []));

        if (Array.isArray(cajasRes) && cajasRes.length > 0 && !form.getValues('cajaId')) {
            form.setValue('cajaId', cajasRes[0].id);
        }
      } catch (e) {
        console.error("Error cargando datos para el formulario de gastos", e);
      }
    };
    fetchData();
  }, []);

  const providerOptions = useMemo(() => 
    proveedores.map(p => ({
      value: p.id,
      label: p.razonSocial,
      subLabel: `RUC: ${p.ruc}`
    })), [proveedores]);

  const projectOptions = useMemo(() => {
    const options: { value: string; label: string; subLabel?: string }[] = [{ value: "none", label: "Sin Proyecto (Gasto General)" }];
    proyectos.forEach(p => {
      options.push({
        value: p.id,
        label: p.nombre,
        subLabel: `CÓDIGO: ${p.codigo}`
      });
    });
    return options;
  }, [proyectos]);

  // Si cambia el proyecto, intentar detectar si es clasificación PROYECTO
  const selectedProjectId = form.watch("proyectoId");
  useEffect(() => {
    if (selectedProjectId && selectedProjectId !== "none") {
      form.setValue("clasificacion", "PROYECTO");
      form.setValue("tipo", "PROYECTO");
    }
  }, [selectedProjectId, form]);

  const handleLocalSubmit = (data: any) => {
    const finalData = {
      ...data,
      montoTotal: parseFloat(data.montoTotal) || 0,
      proyectoId: data.proyectoId === "none" ? null : data.proyectoId,
      proveedorId: data.proveedorId || null,
      fechaVencimiento: data.fechaVencimiento || null,
      fechaProgramadaPago: data.fechaProgramadaPago || null,
      categoriaDistribucion: data.categoriaDistribucion || null
    };
    onSubmit(finalData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleLocalSubmit)} className="flex flex-col h-[70vh] w-full">     
        <ScrollArea className="flex-grow min-h-0 pr-4">
          <div className="space-y-6 p-1 pb-6">
            
            {/* SECCIÓN 1: DOCUMENTO Y CONCEPTOS */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-4 w-1 bg-error rounded-full" />
                <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400">Documento y Concepto</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <FormField
                  control={form.control}
                  name="codigo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-[9px] uppercase text-slate-500 tracking-wider">Número de Comprobante</FormLabel>
                      <FormControl>
                        <Input placeholder="E001-000001" {...field} className="bg-white border-slate-200 h-10 font-bold text-xs" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fechaEmision"
                  rules={{ required: "Requerido" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-[9px] uppercase text-slate-500 tracking-wider">Fecha Emisión</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className="bg-white border-slate-200 h-10 font-bold text-xs" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fechaVencimiento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-[9px] uppercase text-slate-500 tracking-wider">Fecha Vencimiento</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className="bg-white border-slate-200 h-10 font-bold text-slate-400 text-xs" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fechaProgramadaPago"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-[9px] uppercase text-blue-600 tracking-wider">Programación Pago</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className="bg-white border-blue-100 h-10 font-bold text-blue-600 text-xs shadow-sm" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="concepto"
                  rules={{ required: "Requerido" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-[9px] uppercase text-slate-500 tracking-wider">Concepto / Glosa del Gasto</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Pago de servicios de transporte, materiales, etc." {...field} className="bg-white border-slate-200 h-10 font-bold text-xs" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="prioridad"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-[9px] uppercase text-slate-500 tracking-wider">Prioridad</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white border-slate-200 h-10 font-bold text-xs">
                            <SelectValue placeholder="Prioridad" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="BAJA" className="font-bold text-xs">BAJA</SelectItem>
                          <SelectItem value="MEDIA" className="font-bold text-xs">MEDIA</SelectItem>
                          <SelectItem value="ALTA" className="font-bold text-xs text-orange-600">ALTA</SelectItem>
                          <SelectItem value="CRITICA" className="font-bold text-xs text-red-600">CRÍTICA</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* SECCIÓN 2: ASOCIACIÓN Y CLASIFICACIÓN */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-4 w-1 bg-primary rounded-full" />
                <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400">Asociación y Clasificación</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="proveedorId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="font-bold text-[9px] uppercase text-slate-500 tracking-wider">Proveedor</FormLabel>
                      <Combobox
                        options={providerOptions}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Seleccionar proveedor..."
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
                      <FormLabel className="font-bold text-[9px] uppercase text-slate-500 tracking-wider">Proyecto Asociado</FormLabel>
                      <Combobox
                        options={projectOptions}
                        value={field.value || ""}
                        onChange={field.onChange}
                        placeholder="Asociar a un proyecto..."
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <FormField
                  control={form.control}
                  name="clasificacion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-[9px] uppercase text-error tracking-wider">Clasificación *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white border-error/20 border-2 h-10 font-bold text-xs">
                            <SelectValue placeholder="Clasificación" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="VENTA_SERVICIO" className="font-bold text-xs">Venta de Servicios</SelectItem>
                          <SelectItem value="PROYECTO" className="font-bold text-xs">Proyecto</SelectItem>
                          <SelectItem value="ALQUILER_EQUIPOS" className="font-bold text-xs">Alquiler de Equipos</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tipo"
                  rules={{ required: "Requerido" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-[9px] uppercase text-slate-500 tracking-wider">Tipo de Gasto</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white border-slate-200 h-10 font-bold text-xs">
                            <SelectValue placeholder="Tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="OPERATIVO" className="font-bold text-xs">OPERATIVO</SelectItem>
                          <SelectItem value="ADMINISTRATIVO" className="font-bold text-xs">ADMINISTRATIVO</SelectItem>
                          <SelectItem value="FINANCIERO" className="font-bold text-xs">FINANCIERO</SelectItem>
                          <SelectItem value="PROYECTO" className="font-bold text-xs">PROYECTO</SelectItem>
                          <SelectItem value="PERSONAL" className="font-bold text-xs">PERSONAL</SelectItem>
                          <SelectItem value="PLANILLA" className="font-bold text-xs">PLANILLA</SelectItem>
                          <SelectItem value="IMPUESTOS" className="font-bold text-xs">IMPUESTOS</SelectItem>
                          <SelectItem value="VIATICOS" className="font-bold text-xs">VIATICOS</SelectItem>
                          <SelectItem value="COMBUSTIBLE" className="font-bold text-xs">COMBUSTIBLE</SelectItem>
                          <SelectItem value="MANTENIMIENTO" className="font-bold text-xs">MANTENIMIENTO</SelectItem>
                          <SelectItem value="SERVICIOS" className="font-bold text-xs">SERVICIOS</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="categoriaDistribucion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-[9px] uppercase text-slate-500 tracking-wider">Bolsa de Gasto</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white border-slate-200 h-10 font-bold text-xs">
                            <SelectValue placeholder="Bolsa" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="MATERIALES" className="font-bold text-xs">Materiales</SelectItem>
                          <SelectItem value="MANO_OBRA" className="font-bold text-xs">Mano de Obra</SelectItem>
                          <SelectItem value="LOGISTICA_MOVILIDAD" className="font-bold text-xs">Movilidad</SelectItem>
                          <SelectItem value="OPERATIVO_VARIO" className="font-bold text-xs">Operativo Varios</SelectItem>
                          <SelectItem value="UTILIDAD_RESERVA" className="font-bold text-xs">Utilidad</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* SECCIÓN 3: GESTIÓN DE FONDOS (NUEVO) */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-4 w-1 bg-blue-600 rounded-full" />
                <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400">Gestión de Fondos</h4>
              </div>

              <div className="bg-blue-50/50 p-5 rounded-2xl border-2 border-blue-100 space-y-4 shadow-sm">
                <FormField
                  control={form.control}
                  name="cajaId"
                  rules={{ required: "Debe seleccionar una caja" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-black text-[10px] uppercase text-blue-700 tracking-widest flex items-center gap-2">
                        <Wallet className="w-3.5 h-3.5" /> 💳 Gestión de Salida: ¿De qué caja o cuenta bancaria se debitarán estos fondos?
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white border-blue-200 h-11 font-black text-xs shadow-sm">
                            <SelectValue>
                              {cajas.find(c => c.id === field.value)?.nombre || "Seleccione la cuenta de origen..."}
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
                                <span className="text-[9px] text-emerald-600 font-black uppercase tracking-widest">DISPONIBLE: S/ {Number(c.saldoDisponible).toLocaleString()}</span>
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
            </div>

            {/* SECCIÓN 4: DETALLES FINANCIEROS */}
            <div className="space-y-4 pb-2">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-4 w-1 bg-green-500 rounded-full" />
                <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400">Importe y Estado</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-5 rounded-2xl border-2 border-dashed border-slate-200">
                <FormField
                  control={form.control}
                  name="montoTotal"
                  rules={{ required: "Requerido" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-[9px] uppercase text-slate-500 tracking-wider">Monto Total (S/.)</FormLabel>
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
                          }}
                          className="bg-white border-slate-200 h-11 font-black text-lg text-error"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="estado"
                  rules={{ required: "Requerido" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-[9px] uppercase text-slate-500 tracking-wider">Estado de Pago</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className={cn(
                            "h-11 font-black text-xs rounded-xl border-2 shadow-sm transition-all",
                            field.value === 'PAGADO' 
                              ? "bg-green-50 border-green-200 text-green-700 shadow-green-100" 
                              : "bg-red-50 border-red-200 text-red-700 shadow-red-100"
                          )}>
                            <SelectValue placeholder="Seleccione estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="PENDIENTE" className="text-red-600 font-bold text-xs">PENDIENTE</SelectItem>
                          <SelectItem value="PAGADO" className="text-green-600 font-bold text-xs">PAGADO</SelectItem>
                          <SelectItem value="ANULADO" className="text-slate-400 font-bold text-xs">ANULADO</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="flex-shrink-0 flex justify-end gap-3 pt-5 border-t mt-2">
          <Button type="button" variant="ghost" onClick={onCancel} className="font-black uppercase text-[9px] tracking-widest text-slate-500 hover:bg-slate-100 px-6 h-10 rounded-xl">
            Cancelar
          </Button>
          <Button type="submit" className="font-black uppercase text-[9px] tracking-widest bg-error hover:bg-error/90 text-white px-8 h-10 rounded-xl shadow-lg shadow-error/20">
            {initialData ? "Guardar Cambios" : "Registrar Gasto"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
