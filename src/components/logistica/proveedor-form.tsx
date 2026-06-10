"use client";

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
import { useLogisticaStore } from "@/store/logistica-store";
import { Loader2, Truck } from "lucide-react";
import { toast } from "sonner";

const proveedorSchema = z.object({
  ruc: z.string().length(11, "El RUC debe tener 11 dígitos"),
  razonSocial: z.string().min(3, "La razón social es requerida"),
  contacto: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email("Correo inválido").optional().or(z.literal("")),
  direccion: z.string().optional(),
});

type ProveedorFormValues = z.infer<typeof proveedorSchema>;

interface ProveedorFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProveedorForm({ isOpen, onClose }: ProveedorFormProps) {
  const { addProveedor, loading } = useLogisticaStore();

  const form = useForm<ProveedorFormValues>({
    resolver: zodResolver(proveedorSchema),
    defaultValues: {
      ruc: "",
      razonSocial: "",
      contacto: "",
      telefono: "",
      email: "",
      direccion: "",
    },
  });

  const onSubmit = async (values: ProveedorFormValues) => {
    try {
      await addProveedor(values);
      toast.success("Proveedor Registrado", { description: "La empresa ha sido añadida al directorio." });
      onClose();
      form.reset();
    } catch (error: any) {
      toast.error("Error", { description: error.message || "No se pudo guardar el proveedor." });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-0 border-none bg-white overflow-hidden rounded-2xl">
        <DialogHeader className="p-6 bg-primary text-white shrink-0">
          <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-3">
            <Truck className="w-6 h-6 text-accent" />
            Nuevo Proveedor
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="ruc"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase text-primary tracking-widest">RUC *</FormLabel>
                    <FormControl>
                        <Input placeholder="11 dígitos" {...field} className="h-11 border-slate-200 bg-slate-50/50 font-bold text-xs rounded-xl" />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="razonSocial"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase text-primary tracking-widest">Razón Social *</FormLabel>
                    <FormControl>
                        <Input placeholder="Nombre de la empresa" {...field} className="h-11 border-slate-200 bg-slate-50/50 font-bold text-xs rounded-xl" />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="contacto"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase text-primary tracking-widest">Persona de Contacto</FormLabel>
                    <FormControl>
                        <Input placeholder="Nombre del vendedor" {...field} className="h-11 border-slate-200 bg-slate-50/50 font-bold text-xs rounded-xl" />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="telefono"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase text-primary tracking-widest">Teléfono / WhatsApp</FormLabel>
                    <FormControl>
                        <Input placeholder="999..." {...field} className="h-11 border-slate-200 bg-slate-50/50 font-bold text-xs rounded-xl" />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase text-primary tracking-widest">Correo Electrónico</FormLabel>
                  <FormControl>
                    <Input placeholder="ventas@empresa.com" {...field} className="h-11 border-slate-200 bg-slate-50/50 font-bold text-xs rounded-xl" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="direccion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase text-primary tracking-widest">Dirección Fiscal / Almacén</FormLabel>
                  <FormControl>
                    <Input placeholder="Dirección completa" {...field} className="h-11 border-slate-200 bg-slate-50/50 font-bold text-xs rounded-xl" />
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
                Guardar Proveedor
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
