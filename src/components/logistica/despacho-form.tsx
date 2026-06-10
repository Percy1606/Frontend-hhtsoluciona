"use client";

import { useForm } from "react-hook-form";
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
import { useLogisticaStore, Insumo } from "@/store/logistica-store";
import { useOperacionesStore } from "@/store/operaciones-store";
import { Loader2, Truck, Check, ChevronsUpDown, Search } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const despachoSchema = z.object({
  insumoId: z.string().min(1, "Seleccione un insumo"),
  proyectoId: z.string().min(1, "Seleccione un proyecto"),
  cantidad: z.coerce.number().min(0.01, "Mínimo 0.01"),
  motivo: z.string().optional(),
});

type DespachoFormValues = z.infer<typeof despachoSchema>;

interface DespachoFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialInsumo?: Insumo | null;
}

export function DespachoForm({ isOpen, onClose, initialInsumo }: DespachoFormProps) {
  const { registrarDespacho, loading, insumos } = useLogisticaStore();
  const { proyectos } = useOperacionesStore();

  const [openInsumo, setOpenInsumo] = useState(false);
  const [openProyecto, setOpenProyecto] = useState(false);

  const form = useForm<any>({
    resolver: zodResolver(despachoSchema),
    defaultValues: {
      insumoId: initialInsumo?.id || "",
      proyectoId: "",
      cantidad: 1,
      motivo: "Despacho directo a obra",
    },
  });

  const selectedInsumoId = form.watch("insumoId");
  const selectedProyectoId = form.watch("proyectoId");
  const currentInsumo = insumos.find(i => i.id === selectedInsumoId);
  const currentProyecto = proyectos.find(p => p.id === selectedProyectoId);

  const onSubmit = async (values: DespachoFormValues) => {
    if (currentInsumo && values.cantidad > currentInsumo.stockActual) {
        toast.error("Stock Insuficiente", { description: `Solo tienes ${currentInsumo.stockActual} en almacén.` });
        return;
    }

    try {
      await registrarDespacho(values);
      toast.success("Despacho Exitoso", { description: "Los materiales han sido asignados al proyecto." });
      onClose();
      form.reset();
    } catch (error: any) {
      toast.error("Error", { description: error.message || "No se pudo realizar el despacho." });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 border-none bg-white overflow-hidden rounded-2xl">
        <DialogHeader className="p-6 bg-slate-800 text-white shrink-0">
          <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-3 text-white">
            <Truck className="w-6 h-6 text-accent" />
            Despacho a Obra / Proyecto
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-5">
            <FormField
              control={form.control}
              name="insumoId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Material / Insumo *</FormLabel>
                  <Popover open={openInsumo} onOpenChange={setOpenInsumo}>
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
                            ? insumos.find((i) => i.id === field.value)?.nombre
                            : "Buscar material..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-white border-slate-200 shadow-xl">
                      <Command>
                        <CommandInput placeholder="Nombre del insumo..." className="h-9 font-bold text-xs" />
                        <CommandList>
                          <CommandEmpty>No se encontró el material.</CommandEmpty>
                          <CommandGroup>
                            {insumos.filter(i => i.stockActual > 0).map((i) => (
                              <CommandItem
                                value={i.nombre}
                                key={i.id}
                                onSelect={() => {
                                  form.setValue("insumoId", i.id);
                                  setOpenInsumo(false);
                                }}
                                className="font-bold text-xs cursor-pointer"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4 text-primary",
                                    i.id === field.value ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {i.nombre} (Stock: {i.stockActual} {i.unidadMedida})
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
                  <FormLabel className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Proyecto Destino *</FormLabel>
                  <Popover open={openProyecto} onOpenChange={setOpenProyecto}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between h-11 border-slate-200 font-bold text-xs rounded-xl text-primary",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value
                            ? (() => {
                                const p = proyectos.find((p) => p.id === field.value);
                                return p ? `${p.codigo} - ${p.nombre}` : "Elegir proyecto...";
                              })()
                            : "Buscar proyecto..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-white border-slate-200 shadow-xl">
                      <Command>
                        <CommandInput placeholder="Nombre o código del proyecto..." className="h-9 font-bold text-xs" />
                        <CommandList>
                          <CommandEmpty>No se encontró el proyecto.</CommandEmpty>
                          <CommandGroup>
                            {proyectos.map((p) => (
                              <CommandItem
                                value={`${p.codigo} ${p.nombre}`}
                                key={p.id}
                                onSelect={() => {
                                  form.setValue("proyectoId", p.id);
                                  setOpenProyecto(false);
                                }}
                                className="font-bold text-xs cursor-pointer"
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

            <FormField
              control={form.control}
              name="cantidad"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Cantidad a Despachar *</FormLabel>
                  <FormControl>
                    <div className="relative">
                        <Input type="number" step="0.01" {...field} className="h-12 border-slate-200 bg-slate-50/50 font-black text-lg rounded-xl pl-4" />
                        {currentInsumo && (
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">
                                Disponible: {currentInsumo.stockActual} {currentInsumo.unidadMedida}
                            </span>
                        )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="motivo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Observación / Guía</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Guía de remisión 001-..." {...field} className="h-11 border-slate-200 bg-slate-50/50 font-bold text-xs rounded-xl" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-4 flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={onClose} disabled={loading} className="h-12 px-8 font-black uppercase text-[10px] tracking-widest text-slate-400">
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="h-12 px-10 bg-slate-800 hover:bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-slate-200">
                {loading && <Loader2 className="w-3 h-3 mr-2 animate-spin" />}
                Confirmar Salida
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
