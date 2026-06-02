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
import { Button, buttonVariants } from "@/components/ui/button";
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
import { Loader2, ClipboardList, AlertCircle, Search, Check, ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  
  // States for searchable project selector
  const [projectSearch, setProjectSearch] = useState("");
  const [isProjectSelectOpen, setIsProjectSelectOpen] = useState(false);

  // States for searchable responsible selector
  const [responsibleSearch, setResponsibleSearch] = useState("");
  const [isResponsibleSelectOpen, setIsResponsibleSelectOpen] = useState(false);

  const filteredProyectos = proyectos.filter(p => 
    p.nombre.toLowerCase().includes(projectSearch.toLowerCase()) || 
    p.codigo.toLowerCase().includes(projectSearch.toLowerCase())
  );

  const filteredResponsables = responsables.filter(r => 
    r.nombre.toLowerCase().includes(responsibleSearch.toLowerCase()) || 
    r.area.toLowerCase().includes(responsibleSearch.toLowerCase())
  );

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
                <FormItem className="flex flex-col">
                  <FormLabel className="text-xs font-black uppercase text-primary tracking-widest">Proyecto / Operación *</FormLabel>
                  <Popover open={isProjectSelectOpen} onOpenChange={setIsProjectSelectOpen}>
                    <PopoverTrigger
                      disabled={!!proyectoId && !actividad}
                      className={cn(
                        buttonVariants({ variant: "outline" }),
                        "h-12 w-full justify-between border-slate-200 bg-slate-50/50 hover:bg-white transition-colors focus:ring-primary shadow-none font-medium text-left px-4",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      <span className="truncate">
                        {field.value
                          ? (() => {
                              const p = proyectos.find(p => p.id === field.value);
                              return p ? `${p.codigo} - ${p.nombre}` : "Seleccionar proyecto";
                            })()
                          : "Seleccionar proyecto"}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-white border-slate-200" align="start">
                      <div className="p-2 border-b">
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            placeholder="Buscar proyecto..."
                            className="pl-8 h-9 text-xs border-none bg-slate-100 focus:bg-white"
                            value={projectSearch}
                            onChange={(e) => setProjectSearch(e.target.value)}
                          />
                        </div>
                      </div>
                      <ScrollArea className="h-60">
                        <div className="p-1">
                          {filteredProyectos.length === 0 ? (
                            <div className="py-6 text-center text-xs text-slate-500 italic">
                              No se encontraron proyectos
                            </div>
                          ) : (
                            filteredProyectos.map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                className={cn(
                                  "w-full flex flex-col items-start px-3 py-2 rounded-lg text-left transition-colors hover:bg-slate-100 focus:bg-primary focus:text-white group relative",
                                  field.value === p.id && "bg-slate-100 border border-slate-200"
                                )}
                                onClick={() => {
                                  form.setValue("proyectoId", p.id);
                                  setIsProjectSelectOpen(false);
                                  setProjectSearch("");
                                }}
                              >
                                <div className="flex flex-col">
                                  <span className="font-black text-sm text-primary group-focus:text-white uppercase">{p.codigo}</span>
                                  <span className="text-[10px] text-slate-500 group-focus:text-white/80 line-clamp-1">{p.nombre}</span>
                                </div>
                                {field.value === p.id && (
                                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                                )}
                              </button>
                            ))
                          )}
                        </div>
                      </ScrollArea>
                    </PopoverContent>
                  </Popover>
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
                <FormItem className="flex flex-col">
                  <FormLabel className="text-xs font-black uppercase text-primary tracking-widest">Responsable Principal *</FormLabel>
                  <Popover open={isResponsibleSelectOpen} onOpenChange={setIsResponsibleSelectOpen}>
                    <PopoverTrigger
                      className={cn(
                        buttonVariants({ variant: "outline" }),
                        "h-12 w-full justify-between border-slate-200 bg-slate-50/50 hover:bg-white transition-colors focus:ring-primary shadow-none font-medium text-left px-4",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      <span className="truncate">
                        {field.value
                          ? (() => {
                              const r = responsables.find(r => r.id === field.value);
                              return r ? `${r.nombre} (${r.area})` : "Seleccionar responsable";
                            })()
                          : "Seleccionar responsable"}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-white border-slate-200" align="start">
                      <div className="p-2 border-b">
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            placeholder="Buscar responsable..."
                            className="pl-8 h-9 text-xs border-none bg-slate-100 focus:bg-white"
                            value={responsibleSearch}
                            onChange={(e) => setResponsibleSearch(e.target.value)}
                          />
                        </div>
                      </div>
                      <ScrollArea className="h-60">
                        <div className="p-1">
                          {filteredResponsables.length === 0 ? (
                            <div className="py-6 text-center text-xs text-slate-500 italic">
                              No se encontraron responsables
                            </div>
                          ) : (
                            filteredResponsables.map((r) => (
                              <button
                                key={r.id}
                                type="button"
                                className={cn(
                                  "w-full flex flex-col items-start px-3 py-2 rounded-lg text-left transition-colors hover:bg-slate-100 focus:bg-primary focus:text-white group relative",
                                  field.value === r.id && "bg-slate-100 border border-slate-200"
                                )}
                                onClick={() => {
                                  form.setValue("responsablePrincipalId", r.id);
                                  setIsResponsibleSelectOpen(false);
                                  setResponsibleSearch("");
                                }}
                              >
                                <div className="flex flex-col">
                                  <span className="font-bold text-sm text-slate-700 group-focus:text-white uppercase">{r.nombre}</span>
                                  <span className="text-[10px] text-slate-400 group-focus:text-white/80">{r.area}</span>
                                </div>
                                {field.value === r.id && (
                                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                                )}
                              </button>
                            ))
                          )}
                        </div>
                      </ScrollArea>
                    </PopoverContent>
                  </Popover>
                  <FormMessage className="text-[10px] font-black uppercase" />
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
