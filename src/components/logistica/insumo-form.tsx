"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useLogisticaStore, Insumo } from "@/store/logistica-store";
import { Loader2, Package } from "lucide-react";
import { toast } from "sonner";

const insumoSchema = z.object({
  nombre: z.string().min(3, "El nombre es requerido"),
  descripcion: z.string().optional(),
  unidadMedida: z.string().min(1, "La unidad es requerida"),
  stockActual: z.coerce.number().min(0),
  stockMinimo: z.coerce.number().min(0),
  precioReferencial: z.coerce.number().min(0),
  categoria: z.string().optional(),
});

type InsumoFormValues = z.infer<typeof insumoSchema>;

interface InsumoFormProps {
  isOpen: boolean;
  onClose: () => void;
  insumo?: Insumo | null;
}

export function InsumoForm({ isOpen, onClose, insumo }: InsumoFormProps) {
  const { addInsumo, updateInsumo, loading } = useLogisticaStore();

  const form = useForm<any>({
    resolver: zodResolver(insumoSchema),
    defaultValues: {
      nombre: "",
      descripcion: "",
      unidadMedida: "unidades",
      stockActual: 0,
      stockMinimo: 0,
      precioReferencial: 0,
      categoria: "General",
    },
  });

  useEffect(() => {
    if (insumo) {
      form.reset({
        nombre: insumo.nombre,
        descripcion: insumo.descripcion || "",
        unidadMedida: insumo.unidadMedida,
        stockActual: insumo.stockActual,
        stockMinimo: insumo.stockMinimo,
        precioReferencial: insumo.precioReferencial,
        categoria: insumo.categoria || "General",
      });
    } else {
      form.reset({
        nombre: "",
        descripcion: "",
        unidadMedida: "unidades",
        stockActual: 0,
        stockMinimo: 0,
        precioReferencial: 0,
        categoria: "General",
      });
    }
  }, [insumo, form, isOpen]);

  const onSubmit = async (values: InsumoFormValues) => {
    try {
      if (insumo) {
        await updateInsumo(insumo.id, values);
        toast.success("Insumo Actualizado", { description: "Los cambios se han guardado correctamente." });
      } else {
        await addInsumo(values);
        toast.success("Insumo Registrado", { description: "El material ha sido añadido al almacén." });
      }
      onClose();
      form.reset();
    } catch (error) {
      toast.error("Error", { description: "No se pudo procesar la solicitud." });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-0 border-none bg-white overflow-hidden rounded-2xl">
        <DialogHeader className="p-6 bg-primary text-white shrink-0">
          <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-3">
            <Package className="w-6 h-6 text-accent" />
            {insumo ? "Editar Material / Insumo" : "Nuevo Material / Insumo"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-4">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase text-primary tracking-widest">Nombre del Material *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Cable NYY 2x4mm" {...field} className="h-11 border-slate-200 bg-slate-50/50 focus:bg-white transition-all font-bold text-xs rounded-xl" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="categoria"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase text-primary tracking-widest">Categoría</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                        <SelectTrigger className="h-11 border-slate-200 font-bold text-xs rounded-xl">
                            <SelectValue placeholder="Categoría" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white border-slate-200">
                            {["General", "Eléctrico", "Civil", "EPP", "Herramienta", "Oficina"].map(c => (
                                <SelectItem key={c} value={c} className="font-bold text-xs">{c}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />

                <FormField
                control={form.control}
                name="unidadMedida"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase text-primary tracking-widest">Unidad de Medida</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                        <SelectTrigger className="h-11 border-slate-200 font-bold text-xs rounded-xl">
                            <SelectValue placeholder="Unidad" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white border-slate-200">
                            {["unidades", "metros", "kilogramos", "galones", "global"].map(u => (
                                <SelectItem key={u} value={u} className="font-bold text-xs uppercase">{u}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>

            <div className="grid grid-cols-3 gap-4">
                <FormField
                control={form.control}
                name="stockActual"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase text-primary tracking-widest">Stock Inicial</FormLabel>
                    <FormControl>
                        <Input type="number" {...field} className="h-11 border-slate-200 bg-slate-50/50 font-bold text-xs rounded-xl" />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="stockMinimo"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase text-primary tracking-widest">Stock Mínimo</FormLabel>
                    <FormControl>
                        <Input type="number" {...field} className="h-11 border-slate-200 bg-slate-50/50 font-bold text-xs rounded-xl" />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="precioReferencial"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase text-primary tracking-widest">Precio Unit.</FormLabel>
                    <FormControl>
                        <Input type="number" step="0.01" {...field} className="h-11 border-slate-200 bg-slate-50/50 font-bold text-xs rounded-xl" />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>

            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase text-primary tracking-widest">Notas Adicionales</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Marca, modelo o especificaciones..." {...field} className="min-h-[80px] border-slate-200 font-bold text-xs rounded-xl resize-none" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-4 flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={onClose} disabled={loading} className="h-12 px-8 font-black uppercase text-[10px] tracking-widest text-slate-400">
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="h-12 px-10 bg-primary hover:bg-primary/90 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20">
                {loading && <Loader2 className="w-3 h-3 mr-2 animate-spin" />}
                Guardar Insumo
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
