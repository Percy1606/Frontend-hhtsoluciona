"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useEffect } from "react";
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
import { Button, buttonVariants } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { useLogisticaStore } from "@/store/logistica-store";
import { useOperacionesStore } from "@/store/operaciones-store";
import { Loader2, Plus, Trash2, ShoppingCart, Check, ChevronsUpDown } from "lucide-react";
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
  observaciones: z.string().optional(),
  items: z.array(itemSchema).min(1, "Debe agregar al menos un ítem"),
});

type OrdenFormValues = z.infer<typeof ordenSchema>;

interface OrdenCompraFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
}

export function OrdenCompraForm({ isOpen, onClose, initialData }: OrdenCompraFormProps) {
  const { createOrden, updateOrden, proveedores, insumos, loading, totalOrdenes } = useLogisticaStore();
  const { proyectos } = useOperacionesStore();
  const [openProveedor, setOpenProveedor] = useState(false);
  const [openProyecto, setOpenProyecto] = useState(false);

  const form = useForm<any>({
    resolver: zodResolver(ordenSchema),
    defaultValues: {
      codigo: `OC-${String((totalOrdenes || 0) + 1).padStart(3, '0')}`,
      proveedorId: "",
      proyectoId: "none",
      observaciones: "",
      items: [{ insumoId: "", cantidad: 1, precioUnitario: 0 }],
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        form.reset({
          codigo: initialData.codigo || "",
          proveedorId: initialData.proveedorId || "",
          proyectoId: initialData.gasto?.proyectoId || initialData.proyectoId || "none",
          observaciones: initialData.observaciones || "",
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
          proyectoId: "none",
          observaciones: "",
          items: [{ insumoId: "", cantidad: 1, precioUnitario: 0 }],
        });
      }
    }
  }, [isOpen, initialData, form, totalOrdenes]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const onSubmit = async (values: OrdenFormValues) => {
    try {
      const payload = {
        ...values,
        proyectoId: values.proyectoId === "none" ? undefined : values.proyectoId,
        items: values.items.map(item => ({
          insumoId: item.insumoId,
          cantidad: Number(item.cantidad) || 0,
          precioUnitario: Number(item.precioUnitario) || 0
        }))
      };
      
      if (initialData) {
        await updateOrden(initialData.id, payload);
        toast.success("Orden Actualizada", { description: "La orden de compra ha sido actualizada con éxito." });
      } else {
        await createOrden(payload);
        toast.success("Orden Registrada", { description: "La orden de compra ha sido creada y enviada a Egresos para su aprobación." });
      }
      onClose();
      form.reset();
    } catch (error: any) {
      toast.error("Error", { description: error.message || "No se pudo guardar la orden." });
    }
  };

  const watchItems = form.watch("items") || [];
  const total = watchItems.reduce((acc: number, item: any) => acc + ((item?.cantidad || 0) * (item?.precioUnitario || 0)), 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 border-none bg-white overflow-hidden rounded-2xl flex flex-col max-h-[85vh]">
        <DialogHeader className="p-5 bg-primary text-white shrink-0">
          <DialogTitle className="text-lg font-black tracking-tight flex items-center gap-3">
            <ShoppingCart className="w-5 h-5 text-accent" />
            {initialData ? "Editar Orden de Compra" : "Nueva Orden de Compra"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-5 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <FormField
                control={form.control}
                name="codigo"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="text-[9px] font-black uppercase text-primary tracking-widest">Código OC *</FormLabel>
                    <FormControl>
                        <Input {...field} className="h-10 border-slate-200 bg-slate-50/50 font-black text-xs rounded-xl" />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />

                <FormField
                control={form.control}
                name="proveedorId"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel className="text-[9px] font-black uppercase text-primary tracking-widest">Proveedor *</FormLabel>
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
                                          ? proveedores.find((p) => p.id === field.value)?.razonSocial
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
                                    value={p.razonSocial}
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
                                    {p.razonSocial}
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

                <FormField
                control={form.control}
                name="proyectoId"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel className="text-[9px] font-black uppercase text-primary tracking-widest">Proyecto Destino</FormLabel>
                    <Popover open={openProyecto} onOpenChange={setOpenProyecto}>
                        <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    className={cn(
                                        "w-full justify-between h-10 border-slate-200 font-bold text-xs rounded-xl text-primary",
                                        (!field.value || field.value === "none") && "text-muted-foreground"
                                    )}
                                >
                                    <span className="truncate flex-1 text-left">
                                      {field.value && field.value !== "none"
                                          ? (() => {
                                              const p = proyectos.find((p) => p.id === field.value);
                                              return p ? `${p.codigo} - ${p.nombre}` : "Sin Proyecto (Stock)";
                                            })()
                                          : "Sin Proyecto (Stock)"}
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
                                    className="font-bold text-xs cursor-pointer uppercase text-slate-500"
                                >
                                    <Check className={cn("mr-2 h-4 w-4 text-primary", field.value === "none" || !field.value ? "opacity-100" : "opacity-0")} />
                                    Sin Proyecto (Para Stock General)
                                </CommandItem>
                                {proyectos.map((p) => (
                                <CommandItem
                                    value={`${p.codigo} ${p.nombre}`}
                                    key={p.id}
                                    onSelect={() => {
                                    form.setValue("proyectoId", p.id);
                                    setOpenProyecto(false);
                                    }}
                                    className="font-bold text-xs cursor-pointer uppercase"
                                >
                                    <Check
                                    className={cn(
                                        "mr-2 h-4 w-4 text-primary",
                                        p.id === field.value ? "opacity-100" : "opacity-0"
                                    )}
                                    />
                                    {p.codigo} - {p.nombre}
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
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Lista de Materiales</h3>
                    <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => append({ insumoId: "", cantidad: 1, precioUnitario: 0 })}
                        className="h-8 px-3 border-primary text-primary font-black text-[9px] uppercase tracking-widest rounded-lg gap-2"
                    >
                        <Plus className="w-3 h-3" /> Agregar Ítem
                    </Button>
                </div>

                <div className="space-y-2">
                    {/* CABECERA DE LISTA */}
                    <div className="flex gap-2 px-2 mb-1">
                        <div className="w-10"></div>
                        <div className="flex-1">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Material / Insumo</span>
                        </div>
                        <div className="w-20 text-center">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Cant.</span>
                        </div>
                        <div className="w-24 text-right pr-2">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">P. Unitario</span>
                        </div>
                        <div className="w-9"></div>
                    </div>

                    {fields.map((field, index) => (
                        <div key={field.id} className="flex gap-2 items-end bg-slate-50 p-2 rounded-xl border border-slate-100 group">
                            
                            <div className="w-16 pb-2 text-left pl-2">
                              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Item {index + 1}</span>
                            </div>

                            <div className="flex-1">
                                <FormField
                                    control={form.control}
                                    name={`items.${index}.insumoId`}
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <InsumoSelector 
                                                value={field.value} 
                                                onChange={field.onChange} 
                                                insumos={insumos} 
                                            />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="w-20">
                                <FormField
                                    control={form.control}
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
                                                  className="h-9 border-slate-200 bg-white font-bold text-[10px] rounded-lg text-center px-1" 
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="w-24">
                                <FormField
                                    control={form.control}
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
                                                  className="h-9 border-slate-200 bg-white font-black text-[10px] rounded-lg text-right px-1" 
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <Button 
                                type="button" 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => remove(index)}
                                className="h-9 w-9 text-slate-400 hover:text-error hover:bg-red-50 rounded-lg"
                                disabled={fields.length === 1}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            </div>

            <FormField
              control={form.control}
              name="observaciones"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[9px] font-black uppercase text-primary tracking-widest">Notas / Términos de Pago</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Ej: Pago a 30 días contra entrega..." {...field} className="min-h-[60px] border-slate-200 font-bold text-xs rounded-xl resize-none" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="bg-primary/5 p-4 rounded-xl flex items-center justify-between border border-primary/10">
                <span className="text-[9px] font-black uppercase text-primary tracking-widest">Inversión Total Estimada:</span>
                <span className="text-xl font-black text-primary">
                    S/ {Number(total || 0).toFixed(2)}
                </span>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={onClose} disabled={loading} className="h-10 px-6 font-black uppercase text-[9px] tracking-widest text-slate-400">
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="h-10 px-8 bg-primary hover:bg-primary/90 font-black uppercase text-[9px] tracking-widest shadow-lg shadow-primary/20 rounded-xl">
                {loading && <Loader2 className="w-3 h-3 mr-2 animate-spin" />}
                {initialData ? "Actualizar Orden" : "Registrar Orden de Compra"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
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
                    {value
                        ? insumos.find((i: any) => i.id === value)?.nombre
                        : "Elegir Material..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-white shadow-xl border-slate-200">
                <Command>
                    <CommandInput placeholder="Buscar material..." className="h-9 font-bold text-xs" />
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
                                    className="font-bold text-xs cursor-pointer uppercase"
                                >
                                    <Check className={cn("mr-2 h-4 w-4 text-primary", i.id === value ? "opacity-100" : "opacity-0")} />
                                    {i.nombre}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
