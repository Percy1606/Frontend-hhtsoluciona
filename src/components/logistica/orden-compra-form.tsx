"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useEffect, useMemo, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useLogisticaStore } from "@/store/logistica-store";
import { useOperacionesStore } from "@/store/operaciones-store";
import { useCRMStore } from "@/store/crm-store";
import { useAuthStore } from "@/store/auth-store";
import { api } from "@/lib/api";
import { Loader2, Plus, Trash2, ShoppingCart, Check, ChevronsUpDown, Calendar, Link2, FileText, Calculator } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const itemSchema = z.object({
  insumoId: z.string().min(1, "Seleccione un insumo"),
  cantidad: z.coerce.number().min(0.01, "Mínimo 0.01"),
  precioUnitario: z.coerce.number().min(0, "Mínimo 0"),
});

const ordenSchema = z.object({
  codigo: z.string().min(3, "El código es requerido"),
  proveedorId: z.string().min(1, "Seleccione un proveedor"),
  proyectoId: z.string().optional(),
  
  // Smart Fields
  condicionPago: z.string().optional(),
  fechaEntrega: z.string().optional(),
  estado: z.string().default("PENDIENTE"),
  incluyeIgv: z.boolean().default(true),
  archivoFactura: z.string().optional(),
  observacionesLimpias: z.string().optional(),

  items: z.array(itemSchema).min(1, "Debe agregar al menos un ítem"),
});

type OrdenFormValues = z.infer<typeof ordenSchema>;

interface OrdenCompraFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
  defaultProyectoId?: string;
}

export function OrdenCompraForm({ isOpen, onClose, initialData, defaultProyectoId }: OrdenCompraFormProps) {
  const { createOrden, updateOrden, proveedores, insumos, loading: storeLoading, totalOrdenes } = useLogisticaStore();
  const { proyectos } = useOperacionesStore();
  const globalQuotes = useCRMStore(state => state.quotes);
  const [openProveedor, setOpenProveedor] = useState(false);
  const [openProyecto, setOpenProyecto] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  
  const [presupuesto, setPresupuesto] = useState<any>(null);
  const [loadingPresupuesto, setLoadingPresupuesto] = useState(false);
  const budgetPanelRef = useRef<HTMLDivElement>(null);

  const getProjectLabel = (p: any) => {
    let clientName = (p as any).cliente?.empresa || (p as any).cliente?.nombre;
    if (!clientName) {
      const projNum = p.codigo?.split("-").slice(-2).join("-");
      const quote = globalQuotes.find(q => 
        ((p as any).cotizacionId && q.id === (p as any).cotizacionId) ||
        (projNum && q.codigo?.includes(projNum)) ||
        (projNum && q.codigo?.includes(projNum.replace("26-", "2026-")))
      );
      if (quote) {
        clientName = (quote as any).cliente?.empresa || (quote as any).cliente?.nombre;
      }
    }
    
    const osCodigo = (p as any).ordenesDeServicio?.[0]?.codigo || null;
    const isPreventa = Number((p as any).ventaContratada || 0) === 0;
    const tagTipo = isPreventa ? "[PREVENTA]" : (osCodigo ? `[OS: ${osCodigo}]` : "[OFICIAL]");
    
    let cleanName = p.nombre.replace(/^proyecto\s*:\s*(cot-\d{4}-\d{3})?/i, '').trim() || p.codigo;
    return {
      label: `${tagTipo} ${p.codigo} - ${cleanName}`,
      subLabel: `${clientName ? clientName : 'CLIENTE S/N'}${osCodigo ? ` | OS: ${osCodigo}` : ''} | CÓDIGO: ${p.codigo}`,
      osCodigo
    };
  };

  const user = useAuthStore(state => state.user);
  const canApprove = user?.rol === 'ADMIN' || user?.rol === 'FINANZAS' || user?.rol === 'GERENCIA';

  // Funciones para Empaquetar/Desempaquetar observaciones
  const parseObservaciones = (obs: string) => {
    if (!obs) return { condicion: "CONTADO", fecha: "", clean: "", igv: true };
    const condMatch = obs.match(/\[CONDICION:(.*?)\]/);
    const fechaMatch = obs.match(/\[FECHA:(.*?)\]/);
    const igvMatch = obs.match(/\[IGV:(.*?)\]/);
    
    let clean = obs.replace(/\[CONDICION:.*?\]/g, "").replace(/\[FECHA:.*?\]/g, "").replace(/\[IGV:.*?\]/g, "").trim();
    
    return {
      condicion: condMatch ? condMatch[1].trim() : "CONTADO",
      fecha: fechaMatch ? fechaMatch[1].trim() : "",
      igv: igvMatch ? igvMatch[1].trim() === "SI" : true,
      clean
    };
  };

  const form = useForm<any>({
    resolver: zodResolver(ordenSchema),
    defaultValues: {
      codigo: "",
      proveedorId: "",
      proyectoId: defaultProyectoId || "none",
      condicionPago: "CONTADO",
      fechaEntrega: "",
      estado: "PENDIENTE",
      incluyeIgv: true,
      archivoFactura: "",
      observacionesLimpias: "",
      items: [{ insumoId: "", cantidad: 1, precioUnitario: 0 }],
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        const parsedObs = parseObservaciones(initialData.observaciones || "");
        form.reset({
          codigo: initialData.codigo || "",
          proveedorId: initialData.proveedorId || "",
          proyectoId: initialData.gasto?.proyectoId || initialData.proyectoId || "none",
          estado: initialData.estado || "PENDIENTE",
          condicionPago: parsedObs.condicion,
          fechaEntrega: parsedObs.fecha,
          incluyeIgv: parsedObs.igv,
          archivoFactura: initialData.archivoFactura || "",
          observacionesLimpias: parsedObs.clean,
          items: initialData.items?.length ? initialData.items.map((i: any) => ({
            insumoId: i.insumoId,
            cantidad: i.cantidad,
            precioUnitario: i.precioUnitario
          })) : [{ insumoId: "", cantidad: 1, precioUnitario: 0 }],
        });
      } else {
        form.reset({
          codigo: `OC-${String((totalOrdenes || 0) + 1).padStart(3, '0')}`,
          proveedorId: "",
          proyectoId: defaultProyectoId || "none",
          estado: "PENDIENTE",
          condicionPago: "CONTADO",
          fechaEntrega: "",
          incluyeIgv: true,
          archivoFactura: "",
          observacionesLimpias: "",
          items: [{ insumoId: "", cantidad: 1, precioUnitario: 0 }],
        });
      }
    }
  }, [isOpen, initialData, form, totalOrdenes]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const selectedProyectoId = form.watch("proyectoId");
  const formItems = form.watch("items") || [];
  
  useEffect(() => {
    const fetchPresupuesto = async () => {
      if (!selectedProyectoId || selectedProyectoId === "none") {
        setPresupuesto(null);
        return;
      }
      setLoadingPresupuesto(true);
      try {
        const data = await api.get(`/logistica/presupuesto/${selectedProyectoId}`);
        setPresupuesto(data);
      } catch (err) {
        console.error("Error cargando presupuesto:", err);
      } finally {
        setLoadingPresupuesto(false);
      }
    };
    if (isOpen) {
      fetchPresupuesto();
    }
  }, [selectedProyectoId, isOpen]);

  const montoActual = formItems.reduce((sum: number, item: any) => sum + ((Number(item.cantidad) || 0) * (Number(item.precioUnitario) || 0)), 0);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await api.post("/logistica/upload", formData);
      form.setValue("archivoFactura", res.url);
      toast.success("Documento adjuntado");
    } catch (e) {
      console.error("Upload failed", e);
      toast.error("Error al subir el archivo");
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (values: any) => {
    // Validar sobregiro presupuestal y autorizaciones antes de enviar al backend
    if (presupuesto) {
      if (!presupuesto.autorizaCompras) {
        budgetPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        toast.error("Las compras están bloqueadas para este proyecto.");
        return;
      }
      if (presupuesto.saldoDisponible < montoActual) {
        budgetPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        toast.error("El monto excede el saldo disponible. Ajusta la orden o solicita ampliación.");
        return;
      }
    }

    try {
      // Empaquetar observaciones
      const packedObs = `[CONDICION:${values.condicionPago}] [FECHA:${values.fechaEntrega}] [IGV:${values.incluyeIgv ? 'SI' : 'NO'}] ${values.observacionesLimpias || ""}`.trim();

      const payload = {
        codigo: values.codigo,
        proveedorId: values.proveedorId,
        proyectoId: values.proyectoId === "none" ? undefined : values.proyectoId,
        estado: values.estado,
        observaciones: packedObs,
        archivoFactura: values.archivoFactura || null,
        items: values.items.map((item: any) => ({
          insumoId: item.insumoId,
          cantidad: Number(item.cantidad) || 0,
          precioUnitario: Number(item.precioUnitario) || 0
        }))
      };
      
      if (initialData) {
        await updateOrden(initialData.id, payload);
        toast.success("Orden Actualizada", { description: "La orden de materiales ha sido actualizada con éxito." });
      } else {
        await createOrden(payload);
        toast.success("Orden Registrada", { description: "La orden de materiales ha sido creada." });
      }
      onClose();
      form.reset();
    } catch (error: any) {
      toast.error("Error", { description: error.message || "No se pudo guardar la orden." });
    }
  };

  const watchItems = form.watch("items");
  const igvEnabled = form.watch("incluyeIgv");

  const financial = useMemo(() => {
      const items = watchItems || [];
      const subtotalBase = items.reduce((acc: number, item: any) => acc + ((item?.cantidad || 0) * (item?.precioUnitario || 0)), 0);
      let subtotal = 0;
      let igv = 0;
      let total = 0;

      if (igvEnabled) {
          total = subtotalBase;
          subtotal = total / 1.18;
          igv = total - subtotal;
      } else {
          subtotal = subtotalBase;
          igv = subtotal * 0.18;
          total = subtotal + igv;
      }

      return { subtotal, igv, total };
  }, [watchItems, igvEnabled]);

  const loading = storeLoading || isUploading;

  return (
    <>
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="w-full sm:max-w-4xl lg:max-w-5xl p-0 border-none bg-slate-50 overflow-hidden rounded-2xl flex flex-col max-h-[92vh]">
        <DialogHeader className="px-6 py-4 bg-primary text-white shrink-0">
          <DialogTitle className="text-lg font-black tracking-tight flex items-center gap-3">
            <ShoppingCart className="w-5 h-5 text-accent" />
            {initialData ? "Editar Orden de Materiales" : "Nueva Orden de Materiales"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* SECCIÓN 1: DATOS GENERALES */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <FileText className="w-4 h-4 text-primary" />
                    <h4 className="text-xs font-black uppercase tracking-widest text-primary">1. Datos Generales</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <FormField
                        control={form.control as any}
                        name="codigo"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Código OC *</FormLabel>
                            <FormControl>
                                <Input {...field} className="h-10 border-slate-200 bg-slate-50 font-black text-xs rounded-xl" />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control as any}
                        name="proveedorId"
                        render={({ field }) => (
                            <FormItem className="flex flex-col sm:col-span-2">
                            <FormLabel className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Proveedor *</FormLabel>
                            <Popover open={openProveedor} onOpenChange={setOpenProveedor}>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            className={cn(
                                                "w-full justify-between h-10 border-slate-200 font-bold text-xs rounded-xl",
                                                !field.value && "text-muted-foreground"
                                            )}
                                        >
                                            <span className="truncate flex-1 text-left">
                                            {field.value
                                                ? (() => {
                                                    const p = proveedores.find((p) => p.id === field.value);
                                                    return p ? `${p.ruc} - ${p.razonSocial}` : "Buscar proveedor...";
                                                })()
                                                : "Buscar proveedor..."}
                                            </span>
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-white border-slate-200 shadow-xl">
                                <Command>
                                    <CommandInput placeholder="RUC o Razón Social..." className="h-9 font-bold text-xs" />
                                    <CommandList>
                                    <CommandEmpty>No se encontró el proveedor.</CommandEmpty>
                                    <CommandGroup>
                                        {proveedores.map((p) => (
                                        <CommandItem
                                            value={`${p.ruc} ${p.razonSocial}`}
                                            key={p.id}
                                            onSelect={() => {
                                            form.setValue("proveedorId", p.id);
                                            setOpenProveedor(false);
                                            }}
                                            className="font-bold text-xs cursor-pointer uppercase"
                                        >
                                            <Check
                                            className={cn(
                                                "mr-2 h-4 w-4 text-primary",
                                                p.id === field.value ? "opacity-100" : "opacity-0"
                                            )}
                                            />
                                            {p.ruc} - {p.razonSocial}
                                        </CommandItem>
                                        ))}
                                    </CommandGroup>
                                    </CommandList>
                                </Command>
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                            </FormItem>
                        )}
                    />

                    {canApprove && initialData ? (
                        <FormField
                            control={form.control as any}
                            name="estado"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Estado OM</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                    <SelectTrigger className="h-10 border-slate-200 font-bold text-xs rounded-xl">
                                        <SelectValue placeholder="Estado" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-white border-slate-200">
                                        <SelectItem value="PENDIENTE" className="font-bold text-xs text-orange-600">PENDIENTE</SelectItem>
                                        <SelectItem value="APROBADO" className="font-bold text-xs text-blue-600">APROBADA</SelectItem>
                                        <SelectItem value="RECIBIDO" className="font-bold text-xs text-emerald-600">RECIBIDA (ALMACÉN)</SelectItem>
                                        <SelectItem value="CANCELADO" className="font-bold text-xs text-red-600">ANULADA</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    ) : (
                        <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Estado OM</FormLabel>
                            <div className="h-10 flex items-center px-3 border border-slate-200 bg-slate-50 rounded-xl font-bold text-xs text-slate-500 uppercase">
                                {!initialData ? "PENDIENTE" : (form.watch("estado") === "PENDIENTE" ? "PENDIENTE" : form.watch("estado"))}
                            </div>
                            <p className="text-[9px] text-slate-400 font-bold mt-1 leading-tight">
                                {!initialData ? "Inicia en PENDIENTE." : "Controlado por Finanzas."}
                            </p>
                        </FormItem>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                        control={form.control as any}
                        name="proyectoId"
                        render={({ field }) => (
                            <FormItem className="flex flex-col md:col-span-1">
                            <FormLabel className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Proyecto Destino</FormLabel>
                            <Popover open={openProyecto} onOpenChange={setOpenProyecto}>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            className={cn(
                                                "w-full justify-between min-h-[2.5rem] h-auto py-2 border-slate-200 font-bold text-xs rounded-xl text-primary",
                                                (!field.value || field.value === "none") && "text-muted-foreground"
                                            )}
                                        >
                                            <span className="text-left text-xs whitespace-normal break-words leading-tight line-clamp-2">
                                            {field.value && field.value !== "none"
                                                ? (() => {
                                                    const p = proyectos.find((p) => p.id === field.value);
                                                    return p ? getProjectLabel(p).label : "Para Stock General";
                                                    })()
                                                : "Para Stock General"}
                                            </span>
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-white border-slate-200 shadow-xl">
                                <Command>
                                    <CommandInput placeholder="Nombre o código..." className="h-9 font-bold text-xs" />
                                    <CommandList>
                                    <CommandEmpty>No se encontró el proyecto.</CommandEmpty>
                                    <CommandGroup>
                                        <CommandItem
                                            value="none"
                                            onSelect={() => {
                                                form.setValue("proyectoId", "none");
                                                setOpenProyecto(false);
                                            }}
                                            className="font-bold text-xs cursor-pointer uppercase text-amber-700 bg-amber-50/50 py-2"
                                        >
                                            <Check className={cn("mr-2 h-4 w-4 text-primary", field.value === "none" || !field.value ? "opacity-100" : "opacity-0")} />
                                            [ALMACEN GENERAL] Compra para Stock (Sin Proyecto)
                                        </CommandItem>
                                        {proyectos.map((p) => {
                                          const { label, subLabel } = getProjectLabel(p);
                                          return (
                                            <CommandItem
                                                value={`${label} ${subLabel}`}
                                                key={p.id}
                                                onSelect={() => {
                                                form.setValue("proyectoId", p.id);
                                                setOpenProyecto(false);
                                                }}
                                                className="flex items-center gap-2 px-2 py-1.5 cursor-pointer"
                                            >
                                                <div className="flex items-center justify-center w-4">
                                                    <Check
                                                    className={cn(
                                                        "h-3.5 w-3.5 text-primary stroke-[3px]",
                                                        p.id === field.value ? "opacity-100" : "opacity-0"
                                                    )}
                                                    />
                                                </div>
                                                <div className="flex flex-col min-w-0 flex-1">
                                                    <span className="font-bold text-slate-700 text-xs whitespace-normal break-words leading-tight">{label}</span>
                                                    {subLabel && (
                                                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight whitespace-normal break-words mt-0.5">{subLabel}</span>
                                                    )}
                                                </div>
                                            </CommandItem>
                                          );
                                        })}
                                    </CommandGroup>
                                    </CommandList>
                                </Command>
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control as any}
                        name="condicionPago"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Condición de Pago</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                <SelectTrigger className="h-10 border-slate-200 font-bold text-xs rounded-xl">
                                    <SelectValue placeholder="Condición" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-white border-slate-200">
                                    <SelectItem value="CONTADO" className="font-bold text-xs">AL CONTADO</SelectItem>
                                    <SelectItem value="CREDITO_15" className="font-bold text-xs">CRÉDITO 15 DÍAS</SelectItem>
                                    <SelectItem value="CREDITO_30" className="font-bold text-xs">CRÉDITO 30 DÍAS</SelectItem>
                                    <SelectItem value="CREDITO_45" className="font-bold text-xs">CRÉDITO 45 DÍAS</SelectItem>
                                    <SelectItem value="CREDITO_60" className="font-bold text-xs">CRÉDITO 60 DÍAS</SelectItem>
                                    <SelectItem value="LETRAS" className="font-bold text-xs">LETRAS (ESPECIFICAR)</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control as any}
                        name="fechaEntrega"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Fecha Requerida / Entrega</FormLabel>
                            <FormControl>
                                <Input 
                                  type="date" 
                                  {...field} 
                                  min={(() => {
                                      const d = new Date();
                                      return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, '0') + "-" + String(d.getDate()).padStart(2, '0');
                                  })()}
                                  className="h-10 border-slate-200 bg-slate-50 font-bold text-xs rounded-xl" 
                                />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />

                    {presupuesto && (
                        <div ref={budgetPanelRef} className="md:col-span-3 mt-2 p-4 rounded-xl border border-slate-200 bg-slate-50 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-slate-800" />
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                                    <Calculator className="w-3 h-3" /> Estado Presupuestal
                                </h4>
                                <span className={cn(
                                    "text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-wider",
                                    presupuesto.autorizaCompras ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                                )}>
                                    {presupuesto.autorizaCompras ? "Compras Autorizadas" : "Compras Bloqueadas"}
                                </span>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                                <div>
                                    <p className="text-slate-400 uppercase text-[9px] font-black tracking-widest mb-1">Presupuesto Total</p>
                                    <p className="font-black text-sm text-slate-700">S/ {presupuesto.presupuestoTotal.toFixed(2)}</p>
                                </div>
                                <div>
                                    <p className="text-slate-400 uppercase text-[9px] font-black tracking-widest mb-1">Monto Comprometido</p>
                                    <p className="font-black text-sm text-slate-700">S/ {presupuesto.montoComprometido.toFixed(2)}</p>
                                </div>
                                <div>
                                    <p className="text-slate-400 uppercase text-[9px] font-black tracking-widest mb-1">Monto Ejecutado</p>
                                    <p className="font-black text-sm text-slate-700">S/ {presupuesto.montoEjecutado.toFixed(2)}</p>
                                </div>
                                <div>
                                    <p className="text-slate-400 uppercase text-[9px] font-black tracking-widest mb-1">Saldo Disponible</p>
                                    <p className={cn(
                                        "font-black text-sm",
                                        presupuesto.saldoDisponible < montoActual ? "text-red-600" : "text-emerald-600"
                                    )}>
                                        S/ {presupuesto.saldoDisponible.toFixed(2)}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4">
                                <div className="flex justify-between text-[9px] font-black mb-1 uppercase tracking-widest text-slate-500">
                                    <span>Consumo de Presupuesto</span>
                                    <span>{presupuesto.porcentajeConsumido.toFixed(1)}%</span>
                                </div>
                                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                                    <div 
                                        className={cn(
                                            "h-full transition-all duration-500",
                                            presupuesto.porcentajeConsumido < 80 ? "bg-emerald-500" :
                                            presupuesto.porcentajeConsumido < 90 ? "bg-yellow-500" :
                                            presupuesto.porcentajeConsumido < 100 ? "bg-orange-500" : "bg-red-500"
                                        )} 
                                        style={{ width: `${Math.min(presupuesto.porcentajeConsumido, 100)}%` }}
                                    />
                                </div>
                                {presupuesto.saldoDisponible < montoActual && (
                                    <p className="text-[10px] text-red-500 font-bold mt-2">
                                        La orden actual excede el saldo disponible del proyecto.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* SECCIÓN 2: DETALLE DE MATERIALES */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4 text-emerald-600" />
                        <h4 className="text-xs font-black uppercase tracking-widest text-emerald-700">2. Detalle de Materiales</h4>
                    </div>
                    <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => append({ insumoId: "", cantidad: 1, precioUnitario: 0 })}
                        className="h-8 px-3 border-emerald-600 text-emerald-600 font-black text-[9px] uppercase tracking-widest rounded-lg gap-2 hover:bg-emerald-50"
                    >
                        <Plus className="w-3 h-3" /> Agregar Ítem
                    </Button>
                </div>

                <div className="space-y-2">
                    {/* CABECERA DE LISTA */}
                    <div className="flex gap-2 px-2 mb-1 hidden md:flex items-center">
                        <div className="w-10 text-center">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">#</span>
                        </div>
                        <div className="flex-1">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Material / Insumo</span>
                        </div>
                        <div className="w-24 text-center">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cant.</span>
                        </div>
                        <div className="w-28 text-right pr-2">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">P. Unitario</span>
                        </div>
                        <div className="w-32 text-right pr-2">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Subtotal</span>
                        </div>
                        <div className="w-9"></div>
                    </div>

                    {fields.map((field, index) => {
                        const items = form.watch("items") || [];
                        const cant = Number(items[index]?.cantidad || 0);
                        const pu = Number(items[index]?.precioUnitario || 0);
                        const sub = cant * pu;

                        return (
                            <div key={field.id} className="flex flex-col md:flex-row gap-2 md:items-center bg-slate-50/80 hover:bg-slate-100/80 transition-colors p-3 md:p-2 rounded-xl border border-slate-200/70 group">
                                
                                <div className="w-10 text-center hidden md:block">
                                  <span className="text-[10px] font-bold text-slate-400">{index + 1}</span>
                                </div>

                                <div className="flex-1 w-full min-w-0">
                                    <FormField
                                        control={form.control as any}
                                        name={`items.${index}.insumoId`}
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <InsumoSelector 
                                                    value={field.value} 
                                                    onChange={(val: string) => {
                                                        field.onChange(val);
                                                        // Auto-rellenar precio referencial
                                                        const ins = insumos.find((i: any) => i.id === val);
                                                        if (ins && ins.precioReferencial) {
                                                            form.setValue(`items.${index}.precioUnitario`, Number(ins.precioReferencial));
                                                        }
                                                    }} 
                                                    insumos={insumos} 
                                                />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
                                    <div className="w-1/2 md:w-24">
                                        <FormField
                                            control={form.control as any}
                                            name={`items.${index}.cantidad`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Input 
                                                        type="number" 
                                                        placeholder="Cant." 
                                                        {...field} 
                                                        value={isNaN(field.value) ? "" : field.value}
                                                        onFocus={e => e.target.select()}
                                                        onChange={e => {
                                                            const val = parseFloat(e.target.value);
                                                            field.onChange(isNaN(val) ? 0 : val);
                                                        }}
                                                        className="h-10 md:h-9 border-slate-200 bg-white font-bold text-xs rounded-lg text-center px-1" 
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="w-1/2 md:w-28">
                                        <FormField
                                            control={form.control as any}
                                            name={`items.${index}.precioUnitario`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Input 
                                                        type="number" 
                                                        step="0.01" 
                                                        placeholder="Precio U." 
                                                        {...field} 
                                                        value={isNaN(field.value) ? "" : field.value}
                                                        onFocus={e => e.target.select()}
                                                        onChange={e => {
                                                            const val = parseFloat(e.target.value);
                                                            field.onChange(isNaN(val) ? 0 : val);
                                                        }}
                                                        className="h-10 md:h-9 border-slate-200 bg-white font-black text-xs rounded-lg text-right px-2" 
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="w-28 md:w-32 flex justify-between md:justify-end items-center px-2">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase md:hidden">Subtotal:</span>
                                        <span className="font-black text-xs text-blue-700 whitespace-nowrap">
                                            S/ {sub.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>

                                    <Button 
                                        type="button" 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => remove(index)}
                                        className="h-9 w-9 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg shrink-0"
                                        disabled={fields.length === 1}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* SECCIÓN 3: NOTAS, ADJUNTOS Y RESUMEN FINANCIERO */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Notas y Adjuntos */}
                <div className="space-y-4">
                    <FormField
                    control={form.control as any}
                    name="observacionesLimpias"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Observaciones Adicionales</FormLabel>
                        <FormControl>
                            <Textarea placeholder="Ej: Pago contra entrega, incluye instalación, color específico..." {...field} className="min-h-[80px] border-slate-200 bg-white font-bold text-xs rounded-xl resize-none" />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />

                    <FormField
                        control={form.control as any}
                        name="archivoFactura"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Cotización / Doc Adjunto</FormLabel>
                            <FormControl>
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-3">
                                    <Input 
                                        type="file" 
                                        onChange={handleFileChange} 
                                        className="h-10 cursor-pointer text-xs bg-white border-slate-200 flex-1 rounded-xl"
                                        accept=".pdf,.jpg,.png"
                                    />
                                    {isUploading && <Loader2 className="w-5 h-5 text-primary animate-spin" />}
                                </div>
                                {field.value && (
                                    <div className="flex items-center gap-2 mt-2">
                                        <button 
                                            type="button" 
                                            onClick={() => setPreviewFile(field.value || null)} 
                                            className="flex items-center gap-2 text-[10px] font-black text-blue-600 hover:bg-blue-100 uppercase p-2 bg-blue-50 rounded-lg w-fit transition-colors"
                                        >
                                            <Link2 className="w-3 h-3" /> Ver Documento
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => form.setValue("archivoFactura", "")}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                            title="Eliminar Archivo"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>

                {/* Resumen Financiero */}
                <div className="bg-slate-800 rounded-2xl p-6 text-white flex flex-col justify-between shadow-xl">
                    <div>
                        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-700">
                            <Calculator className="w-4 h-4 text-emerald-400" />
                            <h4 className="text-xs font-black uppercase tracking-widest text-emerald-400">Resumen Financiero</h4>
                        </div>

                        <FormField
                            control={form.control as any}
                            name="incluyeIgv"
                            render={({ field }) => (
                                <FormItem className="flex items-center justify-between mb-4">
                                <FormLabel className="text-[10px] font-black uppercase text-slate-300 tracking-widest mt-2 cursor-pointer">
                                    Precios Unitarios incluyen IGV
                                </FormLabel>
                                <FormControl>
                                    <Switch 
                                        checked={field.value} 
                                        onCheckedChange={field.onChange} 
                                        className="data-[state=checked]:bg-emerald-500"
                                    />
                                </FormControl>
                                </FormItem>
                            )}
                        />

                        <div className="space-y-3 mt-4">
                            <div className="flex justify-between items-center text-slate-300">
                                <span className="text-[10px] font-bold uppercase tracking-widest">Subtotal:</span>
                                <span className="font-mono text-sm">S/ {financial.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-300">
                                <span className="text-[10px] font-bold uppercase tracking-widest">IGV (18%):</span>
                                <span className="font-mono text-sm">S/ {financial.igv.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-700 flex justify-between items-end">
                        <span className="text-[11px] font-black uppercase text-emerald-400 tracking-widest">Total General:</span>
                        <span className="text-3xl font-black text-white">
                            S/ {financial.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>

            </div>

            <div className="pt-4 flex justify-end gap-3 sticky bottom-0 bg-slate-50 p-4 border-t border-slate-200 -mx-6 -mb-6">
              <Button type="button" variant="ghost" onClick={onClose} disabled={loading} className="h-11 px-6 font-black uppercase text-[10px] tracking-widest text-slate-400 hover:bg-slate-200 rounded-xl">
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="h-11 px-10 bg-primary hover:bg-primary/90 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20 rounded-xl">
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {initialData ? "Guardar Cambios" : "Emitir Orden de Materiales"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>

    <Dialog open={!!previewFile} onOpenChange={(val) => !val && setPreviewFile(null)}>
        <DialogContent className="w-full sm:max-w-4xl bg-slate-50 border-slate-200 shadow-2xl overflow-hidden p-0 flex flex-col h-[85vh] z-[60]">
          <DialogHeader className="p-4 bg-white border-b border-slate-200 shrink-0 flex flex-row items-center justify-between">
            <DialogTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" />
              Vista Previa de Documento
            </DialogTitle>
            <Button size="sm" variant="outline" className="h-8 mr-6" onClick={() => previewFile && window.open(api.getFileUrl(previewFile), '_blank')}>
              Abrir en nueva pestaña
            </Button>
          </DialogHeader>
          <div className="flex-1 bg-slate-100 overflow-hidden relative">
            {previewFile?.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/) ? (
              <img src={api.getFileUrl(previewFile)} alt="Vista previa del documento adjunto" className="w-full h-full object-contain p-4" />
            ) : previewFile ? (
              <iframe src={api.getFileUrl(previewFile)} className="w-full h-full border-0" />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Selector de insumo interno con Popover para evitar lag en listas grandes
function InsumoSelector({ value, onChange, insumos }: any) {
    const [open, setOpen] = useState(false);
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                        "w-full justify-between h-10 border-slate-200 bg-white font-bold text-xs rounded-lg",
                        !value && "text-muted-foreground"
                    )}
                >
                    <span className="truncate text-left flex-1">
                        {value
                            ? (() => {
                                const i = insumos.find((ins: any) => ins.id === value);
                                return i ? `${i.nombre} (Stock: ${i.stockActual} ${i.unidadMedida})` : "Elegir Material...";
                            })()
                            : "Elegir Material..."}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-white shadow-xl border-slate-200">
                <Command>
                    <CommandInput placeholder="Buscar material por nombre..." className="h-9 font-bold text-xs" />
                    <CommandList>
                        <CommandEmpty>No encontrado.</CommandEmpty>
                        <CommandGroup>
                            {insumos.map((i: any) => (
                                <CommandItem
                                    key={i.id}
                                    value={i.nombre}
                                    onSelect={() => {
                                        onChange(i.id);
                                        setOpen(false);
                                    }}
                                    className="font-bold text-xs cursor-pointer uppercase flex justify-between"
                                >
                                    <div className="flex items-center">
                                        <Check className={cn("mr-2 h-4 w-4 text-primary", i.id === value ? "opacity-100" : "opacity-0")} />
                                        {i.nombre}
                                    </div>
                                    <span className={cn("text-[9px] font-black", i.stockActual <= i.stockMinimo ? "text-red-500" : "text-emerald-600")}>
                                        {i.stockActual} {i.unidadMedida}
                                    </span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
