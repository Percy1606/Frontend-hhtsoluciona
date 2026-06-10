"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
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
  const { createOrden, updateOrden, proveedores, insumos, loading } = useLogisticaStore();
  const [openProveedor, setOpenProveedor] = useState(false);

  const form = useForm<any>({
    resolver: zodResolver(ordenSchema),
    defaultValues: {
      codigo: initialData?.codigo || `OC-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      proveedorId: initialData?.proveedorId || "",
      observaciones: initialData?.observaciones || "",
      items: initialData?.items?.length ? initialData.items.map((i: any) => ({
        insumoId: i.insumoId,
        cantidad: i.cantidad,
        precioUnitario: i.precioUnitario
      })) : [{ insumoId: "", cantidad: 1, precioUnitario: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const onSubmit = async (values: OrdenFormValues) => {
    try {
      if (initialData) {
        await updateOrden(initialData.id, values);
        toast.success("Orden Actualizada", { description: "La orden de compra ha sido actualizada con éxito." });
      } else {
        await createOrden(values);
        toast.success("Orden Registrada", { description: "La orden de compra ha sido creada con éxito." });
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
      <DialogContent className="max-w-3xl p-0 border-none bg-white overflow-hidden rounded-2xl flex flex-col max-h-[90vh]">
        <DialogHeader className="p-6 bg-primary text-white shrink-0">
          <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-3">
            <ShoppingCart className="w-6 h-6 text-accent" />
            {initialData ? "Editar Orden de Compra" : "Nueva Orden de Compra"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="codigo"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase text-primary tracking-widest">Código OC *</FormLabel>
                    <FormControl>
                        <Input {...field} className="h-11 border-slate-200 bg-slate-50/50 font-black text-xs rounded-xl" />
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
                    <FormLabel className="text-[10px] font-black uppercase text-primary tracking-widest">Proveedor *</FormLabel>
                    <Popover open={openProveedor} onOpenChange={setOpenProveedor}>
                        <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    className={cn(
                                        "w-full justify-between h-11 border-slate-200 font-bold text-xs rounded-xl",
                                        !field.value && "text-muted-foreground"
                                    )}
                                >
                                    {field.value
                                        ? proveedores.find((p) => p.id === field.value)?.razonSocial
                                        : "Buscar proveedor..."}
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
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Lista de Materiales</h3>
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
                    {fields.map((field, index) => (
                        <div key={field.id} className="flex gap-3 items-end bg-slate-50 p-3 rounded-xl border border-slate-100 group">
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

                            <div className="w-24">
                                <FormField
                                    control={form.control}
                                    name={`items.${index}.cantidad`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Input type="number" placeholder="Cant." {...field} className="h-10 border-slate-200 bg-white font-bold text-xs rounded-lg text-center" />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="w-32">
                                <FormField
                                    control={form.control}
                                    name={`items.${index}.precioUnitario`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Input type="number" step="0.01" placeholder="Precio U." {...field} className="h-10 border-slate-200 bg-white font-black text-xs rounded-lg text-right" />
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
                                className="h-10 w-10 text-slate-400 hover:text-error hover:bg-red-50 rounded-lg"
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
                  <FormLabel className="text-[10px] font-black uppercase text-primary tracking-widest">Notas / Términos de Pago</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Ej: Pago a 30 días contra entrega..." {...field} className="min-h-[80px] border-slate-200 font-bold text-xs rounded-xl resize-none" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="bg-primary/5 p-4 rounded-2xl flex items-center justify-between border border-primary/10">
                <span className="text-[10px] font-black uppercase text-primary tracking-widest">Inversión Total Estimada:</span>
                <span className="text-2xl font-black text-primary">
                    S/ {total.toFixed(2)}
                </span>
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={onClose} disabled={loading} className="h-12 px-8 font-black uppercase text-[10px] tracking-widest text-slate-400">
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="h-12 px-10 bg-primary hover:bg-primary/90 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20">
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
