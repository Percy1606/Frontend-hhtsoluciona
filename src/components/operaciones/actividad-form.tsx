"use client";

import React, { useState, useEffect } from "react";
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
import { format } from "date-fns";
import { Loader2, ClipboardList, AlertCircle, Search, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

const actividadSchema = z.object({
  proyectoId: z.string().min(1, "El proyecto es requerido"),
  descripcion: z.string().min(3, "La descripción es requerida"),
  tipo: z.enum(["Técnica", "Administrativa", "Logística", "Documental", "Validación", "Tecnica", "Logistica", "Validacion"]),
  prioridad: z.enum(["Baja", "Media", "Alta", "Crítica"]),
  estado: z.enum(["Pendiente", "En Progreso", "Completada", "Validada", "Bloqueada", "EnProgreso"]),
  fechaInicio: z.string().refine((val) => {
    if (!val) return true;
    const date = new Date(val);
    return date.getFullYear() >= 2000;
  }, "La fecha no puede ser anterior al año 2000").optional(),
  fechaFin: z.string().optional(),
  fechaVencimiento: z.string().refine((val) => {
    if (!val) return true;
    const date = new Date(val);
    return date.getFullYear() >= 2000;
  }, "La fecha no puede ser anterior al año 2000").optional(),
  responsablePrincipalId: z.string().min(1, "El responsable es requerido"),
  responsablesApoyo: z.array(z.string()),
  ponderacion: z.number().optional(),
  orden: z.number(),
  progreso: z.number().min(0).max(100).optional(),
  observaciones: z.string().optional(),
}).refine((data) => {
  if (data.fechaInicio && data.fechaVencimiento) {
    return new Date(data.fechaVencimiento) >= new Date(data.fechaInicio);
  }
  return true;
}, {
  message: "La fecha de vencimiento no puede ser anterior a la fecha de inicio",
  path: ["fechaVencimiento"],
});

type ActividadFormValues = z.infer<typeof actividadSchema>;

interface ActividadFormProps {
  proyectoId?: string;
  actividad?: Actividad | null;
  isOpen: boolean;
  onClose: () => void;
  /** @deprecated Mantenido por retrocompatibilidad con otras pantallas; ya no se usa */
  defaultGroup?: string;
}

/**
 * Limpia un prefijo legacy del tipo "[DOCUMENTACIÓN] X" presente en la
 * descripción de actividades creadas con la versión anterior del módulo.
 *
 * Si la descripción no tiene prefijo, se retorna tal cual.
 */
const stripLegacyPrefix = (text: string): string => {
  if (!text) return "";
  const match = text.match(/^\[(.*?)\]\s*(.*)$/i);
  return match ? match[2].trim() : text;
};

export function ActividadForm({ proyectoId, actividad, isOpen, onClose }: ActividadFormProps) {
  const { proyectos, responsables, addActividad, updateActividad, loading, error, fetchProyectos } = useOperacionesStore();

  // States for searchable project selector
  const [projectSearch, setProjectSearch] = useState("");
  const [isProjectSelectOpen, setIsProjectSelectOpen] = useState(false);

  // States for searchable responsible selector
  const [responsibleSearch, setResponsibleSearch] = useState("");
  const [isResponsibleSelectOpen, setIsResponsibleSelectOpen] = useState(false);

  // Cache de funciones para evitar re-renders innecesarios
  const fetchProyectosRef = React.useRef(fetchProyectos);
  useEffect(() => {
    fetchProyectosRef.current = fetchProyectos;
  }, [fetchProyectos]);

  // Fetch projects when the modal opens if not already loaded
  useEffect(() => {
    if (isOpen) {
      fetchProyectosRef.current(1, 1000).catch(err => console.error("[ActividadForm] Error fetching projects:", err));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

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
      fechaInicio: format(new Date(), "yyyy-MM-dd"),
      fechaFin: "",
      fechaVencimiento: "",
      responsablePrincipalId: "",
      responsablesApoyo: [],
      ponderacion: 1,
      orden: 0,
      progreso: 0,
      observaciones: "",
    },
  });

  useEffect(() => {
    if (actividad) {
      // Limpia el prefijo legacy "[GRUPO]" para mostrar la descripción pura al usuario.
      const cleanedDescription = stripLegacyPrefix(actividad.descripcion);

      form.reset({
        proyectoId: actividad.proyectoId,
        descripcion: cleanedDescription,
        tipo: actividad.tipo,
        prioridad: actividad.prioridad,
        estado: actividad.estado,
        fechaInicio: actividad.fechaInicio
          ? actividad.fechaInicio.split("T")[0]
          : (actividad.fechaCreacion ? actividad.fechaCreacion.split("T")[0] : ""),
        fechaFin: actividad.fechaFin ? actividad.fechaFin.split("T")[0] : "",
        fechaVencimiento: actividad.fechaVencimiento ? actividad.fechaVencimiento.split("T")[0] : "",
        responsablePrincipalId: actividad.responsablePrincipalId,
        responsablesApoyo: actividad.responsablesApoyo || [],
        ponderacion: actividad.ponderacion || 1,
        orden: actividad.orden || 0,
        progreso: actividad.progreso ?? 0,
        observaciones: actividad.observaciones || "",
      });
    } else {
      form.reset({
        proyectoId: proyectoId || "",
        descripcion: "",
        tipo: "Técnica",
        prioridad: "Media",
        estado: "Pendiente",
        fechaInicio: format(new Date(), "yyyy-MM-dd"),
        fechaFin: "",
        fechaVencimiento: "",
        responsablePrincipalId: "",
        responsablesApoyo: [],
        ponderacion: 1,
        orden: 0,
        progreso: 0,
        observaciones: "",
      });
    }
  }, [actividad, proyectoId, form, isOpen]);

  const onSubmit = async (values: ActividadFormValues) => {
    const toLocalISO = (dateStr?: string) => {
      if (!dateStr) return undefined;
      const normalized = dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`;
      return new Date(normalized).toISOString();
    };

    try {
      if (actividad) {
        await updateActividad(values.proyectoId, {
          ...actividad,
          ...values,
          progreso: values.progreso ?? actividad.progreso ?? 0,
          fechaInicio: toLocalISO(values.fechaInicio),
          fechaVencimiento: toLocalISO(values.fechaVencimiento)
        });
        toast.success("Actividad Actualizada", { description: "Los cambios se guardaron correctamente." });
      } else {
        await addActividad(values.proyectoId, {
          ...values,
          fechaCreacion: new Date().toISOString(),
          fechaInicio: toLocalISO(values.fechaInicio),
          fechaVencimiento: toLocalISO(values.fechaVencimiento),
          subtareas: [],
          validacionesRequeridas: [],
          comentarios: [],
          evidencias: [],
          progreso: values.progreso ?? 0,
        });
        toast.success("Actividad Creada", { description: "La nueva tarea ha sido registrada." });
      }
      onClose();
    } catch (error: any) {
      console.error("Error saving actividad", error);
      const isNotFound = error.message?.includes("no encontrada") || error.message?.includes("404");
      toast.error("Error al Guardar", {
        description: isNotFound
          ? "Esta actividad no existe en el servidor. Por favor, refresca la página para limpiar datos obsoletos."
          : (error.message || "No se pudo procesar la solicitud.")
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] p-0 border-none bg-white flex flex-col overflow-y-auto z-[100]">
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
                  <div className="relative">
                    <button
                      type="button"
                      disabled={!!proyectoId && !actividad}
                      className={cn(
                        buttonVariants({ variant: "outline" }),
                        "h-12 w-full justify-between border-slate-200 bg-slate-50/50 hover:bg-white transition-colors focus:ring-primary shadow-none font-medium text-left px-4",
                        !field.value && "text-muted-foreground"
                      )}
                      onClick={() => setIsProjectSelectOpen(!isProjectSelectOpen)}
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
                    </button>
                    {isProjectSelectOpen && (
                      <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg z-[200] p-0">
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
                      </div>
                    )}
                  </div>
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
                        {["Pendiente", "En Progreso", "Completada"].map(e => (
                          <SelectItem key={e} value={e} className="font-medium">{e}</SelectItem>
                        ))}
                        {((field.value as any) === "Validada" || (field.value as any) === "Bloqueada" || (field.value as any) === "EnProgreso") && (
                          <SelectItem value={field.value} className="font-medium">
                            {field.value === "EnProgreso" ? "En Progreso" : field.value}
                          </SelectItem>
                        )}
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
                  <div className="relative">
                    <button
                      type="button"
                      className={cn(
                        buttonVariants({ variant: "outline" }),
                        "h-12 w-full justify-between border-slate-200 bg-slate-50/50 hover:bg-white transition-colors focus:ring-primary shadow-none font-medium text-left px-4",
                        !field.value && "text-muted-foreground"
                      )}
                      onClick={() => setIsResponsibleSelectOpen(!isResponsibleSelectOpen)}
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
                    </button>
                    {isResponsibleSelectOpen && (
                      <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg z-[200] p-0">
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
                      </div>
                    )}
                  </div>
                  <FormMessage className="text-[10px] font-black uppercase" />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="progreso"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-black uppercase text-primary tracking-widest">% Progreso</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                          className="h-10 border-slate-200 font-bold pr-8"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">%</span>
                      </div>
                    </FormControl>
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
            </div>

            <DialogFooter className="pt-4 border-t border-slate-100 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="h-12 px-8 font-black uppercase text-xs tracking-widest">
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="h-12 px-10 bg-primary hover:bg-primary/90 font-black uppercase text-xs tracking-widest shadow-lg shadow-primary/20">
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {actividad ? "Actualizar Actividad" : "Crear Actividad"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
