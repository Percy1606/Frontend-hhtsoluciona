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
  DialogFooter,
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
import { useOperacionesStore } from "@/store/operaciones-store";
import type { Actividad, Responsable } from "@/lib/types";
import { Loader2, ClipboardList, AlertCircle } from "lucide-react";

const actividadSchema = z.object({
  proyectoId: z.string().min(1, "El proyecto es requerido"),
  descripcion: z.string().min(3, "La descripción es requerida"),
  tipo: z.enum(["Técnica", "Administrativa", "Logística", "Documental", "Validación"]),
  prioridad: z.enum(["Baja", "Media", "Alta", "Crítica"]),
  estado: z.enum(["Pendiente", "En Progreso", "Completada", "Validada", "Bloqueada"]),
  fechaInicio: z.string().optional(),
  fechaFin: z.string().optional(),
  fechaVencimiento: z.string().optional(),
  responsablePrincipalId: z.string().min(1, "El responsable es requerido"),
  responsablesApoyo: z.array(z.string()),
  ponderacion: z.number().optional(),
  orden: z.number(),
  observaciones: z.string().optional(),
});

type ActividadFormValues = z.infer<typeof actividadSchema>;

interface ActividadFormProps {
  proyectoId?: string; // Ahora es opcional
  actividad?: Actividad | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ActividadForm({ proyectoId, actividad, isOpen, onClose }: ActividadFormProps) {
  const { proyectos, responsables, addActividad, updateActividad, loading, error } = useOperacionesStore();
  
  const form = useForm<ActividadFormValues>({
    resolver: zodResolver(actividadSchema),
    defaultValues: {
      proyectoId: proyectoId || "",
      descripcion: "",
      tipo: "Técnica",
      prioridad: "Media",
      estado: "Pendiente",
      fechaInicio: new Date().toISOString().split("T")[0],
      fechaFin: "",
      fechaVencimiento: "",
      responsablePrincipalId: "",
      responsablesApoyo: [],
      ponderacion: 1,
      orden: 0,
      observaciones: "",
    },
  });

  useEffect(() => {
    if (actividad) {
      form.reset({
        proyectoId: actividad.proyectoId,
        descripcion: actividad.descripcion,
        tipo: actividad.tipo,
        prioridad: actividad.prioridad,
        estado: actividad.estado,
        fechaInicio: actividad.fechaInicio ? actividad.fechaInicio.split("T")[0] : "",
        fechaFin: actividad.fechaFin ? actividad.fechaFin.split("T")[0] : "",
        fechaVencimiento: actividad.fechaVencimiento ? actividad.fechaVencimiento.split("T")[0] : "",
        responsablePrincipalId: actividad.responsablePrincipalId,
        responsablesApoyo: actividad.responsablesApoyo || [],
        ponderacion: actividad.ponderacion || 1,
        orden: actividad.orden || 0,
        observaciones: actividad.observaciones || "",
      });
    } else {
      form.reset({
        proyectoId: proyectoId || "",
        descripcion: "",
        tipo: "Técnica",
        prioridad: "Media",
        estado: "Pendiente",
        fechaInicio: new Date().toISOString().split("T")[0],
        fechaFin: "",
        fechaVencimiento: "",
        responsablePrincipalId: "",
        responsablesApoyo: [],
        ponderacion: 1,
        orden: 0,
        observaciones: "",
      });
    }
  }, [actividad, proyectoId, form, isOpen]);

  const onSubmit = async (values: ActividadFormValues) => {
    try {
      if (actividad) {
        await updateActividad(values.proyectoId, { ...actividad, ...values });
      } else {
        await addActividad(values.proyectoId, {
          ...values,
          fechaCreacion: new Date().toISOString().split("T")[0],
          subtareas: [],
          validacionesRequeridas: [],
          comentarios: [],
          evidencias: [],
          progreso: 0,
        });
      }
      onClose();
    } catch (error) {
      console.error("Error saving actividad", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] p-0 border-none bg-white flex flex-col overflow-y-auto">
        <DialogHeader className="p-6 bg-primary text-white rounded-t-lg shrink-0">
          <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
            <ClipboardList className="w-6 h-6 text-accent" />
            {actividad ? "Editar Actividad" : "Nueva Actividad"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-4 overflow-y-auto flex-1">
            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            )}

            <FormField
              control={form.control}
              name="proyectoId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-black uppercase text-primary tracking-widest">Proyecto / Operación *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={!!proyectoId && !actividad}>
                    <FormControl>
                      <SelectTrigger className="h-12 border-slate-200 bg-slate-50/50 hover:bg-white transition-colors focus:ring-primary shadow-none font-medium">
                        <SelectValue placeholder="Seleccionar proyecto" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white border-slate-200">
                      {proyectos.map((p) => (
                        <SelectItem key={p.id} value={p.id} className="focus:bg-primary focus:text-white group">
                          <div className="flex flex-col py-1">
                            <span className="font-black text-sm text-primary group-focus:text-white uppercase">{p.codigo}</span>
                            <span className="text-[10px] text-slate-500 group-focus:text-white/80">{p.nombre}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-[10px] font-black uppercase" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-black uppercase text-primary tracking-widest">Descripción de la Actividad *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre de la actividad..." {...field} className="h-12 border-slate-200 bg-slate-50/50 hover:bg-white transition-colors focus:ring-primary shadow-none font-medium" />
                  </FormControl>
                  <FormMessage className="text-[10px] font-black uppercase" />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-black uppercase text-primary tracking-widest">Tipo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-10 border-slate-200 font-medium">
                          <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white border-slate-200">
                        {["Técnica", "Administrativa", "Logística", "Documental", "Validación"].map(t => (
                          <SelectItem key={t} value={t} className="font-medium">{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="prioridad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-black uppercase text-primary tracking-widest">Prioridad</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-10 border-slate-200 font-medium">
                          <SelectValue placeholder="Prioridad" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white border-slate-200">
                        {["Baja", "Media", "Alta", "Crítica"].map(p => (
                          <SelectItem key={p} value={p} className="font-medium">{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-black uppercase text-primary tracking-widest">Estado</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-10 border-slate-200 font-medium">
                          <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white border-slate-200">
                        {["Pendiente", "En Progreso", "Completada", "Validada", "Bloqueada"].map(e => (
                          <SelectItem key={e} value={e} className="font-medium">{e}</SelectItem>
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
                name="fechaInicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-black uppercase text-primary tracking-widest">Fecha Inicio</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} className="h-10 border-slate-200 font-medium" />
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
                    <FormLabel className="text-xs font-black uppercase text-primary tracking-widest">Fecha Vencimiento</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} className="h-10 border-slate-200 font-medium text-red-600" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="responsablePrincipalId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-black uppercase text-primary tracking-widest">Responsable Principal *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12 border-slate-200 font-medium">
                        <SelectValue placeholder="Seleccionar responsable" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white border-slate-200">
                      {responsables.map((r) => (
                        <SelectItem key={r.id} value={r.id} className="font-medium">
                          {r.nombre} ({r.area})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="observaciones"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-black uppercase text-primary tracking-widest">Observaciones (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Detalles adicionales, requisitos especiales o notas para el equipo..." {...field} className="min-h-[100px] border-slate-200 font-medium bg-slate-50/30" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="h-12 px-8 font-black uppercase text-xs tracking-widest">
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="h-12 px-10 bg-primary hover:bg-primary/90 font-black uppercase text-xs tracking-widest shadow-lg shadow-primary/20">
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {actividad ? "Actualizar Actividad" : "Crear Actividad"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
