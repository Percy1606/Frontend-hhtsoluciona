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
import { Client } from "@/mocks/data";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface ClientFormProps {
  client?: Client | null;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export function ClientForm({ client, onSubmit, onCancel }: ClientFormProps) {
  const form = useForm({
    defaultValues: client || {
      empresa: "",
      ruc: "",
      direccion: "",
      tarifa: "MT3",
      contacto: "",
      telefono: "",
      cargo: "",
      correo: "",
      asignadoA: "Angi",
      diaTrabajo: "Lunes",
      estado: "Activo",
      prioridad: "Media",
      zona: "",
      temperatura: "Tibio",
      montoEstimado: 0,
      probabilidad: 0.5,
      observaciones: "",
      accion: "",
      ultimoContacto: new Date().toISOString().split('T')[0],
      proximoSeguimiento: "",
      tipoCliente: "Nuevo",
      etapaComercial: "Prospecto",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <ScrollArea className="h-[68vh] pr-4">
          <div className="space-y-8 p-1">
            {/* Sección: Información de la Empresa */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-2">
                <span className="w-2 h-4 bg-primary rounded-sm" />
                Información de la Empresa
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="empresa"
                  rules={{ required: "La razón social es obligatoria" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-slate-700">Razón Social <span className="text-error">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre de la empresa" {...field} className="border-border" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ruc"
                  rules={{ 
                    required: "El RUC es obligatorio",
                    pattern: { value: /^\d{11}$/, message: "El RUC debe tener 11 dígitos" } 
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-slate-700">RUC <span className="text-error">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="11 dígitos" maxLength={11} {...field} className="border-border" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="direccion"
                  rules={{ required: "La dirección es obligatoria" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-slate-700">Dirección Fiscal / Planta <span className="text-error">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Av. Principal #123..." {...field} className="border-border" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="zona"
                  rules={{ required: "La zona es obligatoria" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-slate-700">Zona / Distrito <span className="text-error">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Piura, Paita, Sullana..." {...field} className="border-border" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator className="bg-slate-100" />

            {/* Sección: Datos de Contacto */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-2">
                <span className="w-2 h-4 bg-primary rounded-sm" />
                Contacto & Comunicación
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contacto"
                  rules={{ required: "El nombre de contacto es obligatorio" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-slate-700">Nombre de Contacto <span className="text-error">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Persona encargada" {...field} className="border-border" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cargo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-slate-700">Cargo</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Jefe de Mantenimiento, Administrador" {...field} className="border-border" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="telefono"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-slate-700">Teléfono / Celular</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: 999888777" {...field} className="border-border" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="correo"
                  rules={{ 
                    pattern: { 
                      value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/, 
                      message: "Correo inválido" 
                    } 
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-slate-700">Correo Electrónico</FormLabel>
                      <FormControl>
                        <Input placeholder="correo@empresa.com" type="email" {...field} className="border-border" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator className="bg-slate-100" />

            {/* Sección: Información Comercial */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-2">
                <span className="w-2 h-4 bg-primary rounded-sm" />
                Gestión Comercial & Pipeline
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="etapaComercial"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-slate-700">Etapa Comercial</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="border-border bg-white">
                            <SelectValue placeholder="Seleccionar etapa" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white">
                          <SelectItem value="Prospecto">Prospecto</SelectItem>
                          <SelectItem value="Contactado">Contactado</SelectItem>
                          <SelectItem value="Llamada Realizada">Llamada Realizada</SelectItem>
                          <SelectItem value="Visita Agendada">Visita Agendada</SelectItem>
                          <SelectItem value="Inspección Realizada">Inspección Realizada</SelectItem>
                          <SelectItem value="Cotización Enviada">Cotización Enviada</SelectItem>
                          <SelectItem value="Seguimiento">Seguimiento</SelectItem>
                          <SelectItem value="Negociación">Negociación</SelectItem>
                          <SelectItem value="Orden de Servicio">Orden de Servicio</SelectItem>
                          <SelectItem value="Ganado">Cerrado / Ganado</SelectItem>
                          <SelectItem value="Perdido">Cerrado / Perdido</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="asignadoA"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-slate-700">Asignado A</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="border-border bg-white">
                            <SelectValue placeholder="Responsable" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white">
                          <SelectItem value="Angi">Angi</SelectItem>
                          <SelectItem value="Valentina">Valentina</SelectItem>
                          <SelectItem value="Ariana">Ariana</SelectItem>
                          <SelectItem value="Nicol">Nicol</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tipoCliente"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-slate-700">Tipo Cliente</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="border-border bg-white">
                            <SelectValue placeholder="Tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white">
                          <SelectItem value="Nuevo">Nuevo</SelectItem>
                          <SelectItem value="Recurrente">Recurrente</SelectItem>
                          <SelectItem value="Reactivado">Reactivado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="tarifa"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-slate-700">Tarifa</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="border-border bg-white">
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white">
                          <SelectItem value="MT3">MT3</SelectItem>
                          <SelectItem value="MT4">MT4</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="temperatura"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-slate-700">Temperatura</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="border-border bg-white">
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white">
                          <SelectItem value="Frío">Frío</SelectItem>
                          <SelectItem value="Tibio">Tibio</SelectItem>
                          <SelectItem value="Caliente">Caliente</SelectItem>
                          <SelectItem value="Muy Caliente">Muy Caliente</SelectItem>
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
                      <FormLabel className="font-bold text-slate-700">Prioridad</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="border-border bg-white">
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white">
                          <SelectItem value="Baja">Baja</SelectItem>
                          <SelectItem value="Media">Media</SelectItem>
                          <SelectItem value="Alta">Alta</SelectItem>
                          <SelectItem value="Crítica">Crítica</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="diaTrabajo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-slate-700">Día de Trabajo</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="border-border bg-white">
                            <SelectValue placeholder="Día" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white">
                          <SelectItem value="Lunes">Lunes</SelectItem>
                          <SelectItem value="Martes">Martes</SelectItem>
                          <SelectItem value="Miércoles">Miércoles</SelectItem>
                          <SelectItem value="Jueves">Jueves</SelectItem>
                          <SelectItem value="Viernes">Viernes</SelectItem>
                          <SelectItem value="Sábado">Sábado</SelectItem>
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
                  name="montoEstimado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-slate-700">Monto Estimado (S/.)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} className="border-border" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="probabilidad"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-slate-700">Probabilidad de Cierre (0.1 - 1.0)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" min="0" max="1" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} className="border-border" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator className="bg-slate-100" />

            {/* Sección: Alertas y Próximo Seguimiento */}
            <div className="space-y-4 bg-accent/[0.03] p-4 rounded-xl border border-accent/10">
              <h3 className="text-xs font-black uppercase tracking-wider text-accent flex items-center gap-2">
                <span className="w-2 h-4 bg-accent rounded-sm" />
                Seguimiento & Alertas (Obligatorio)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="accion"
                  rules={{ required: "Debe registrar la acción a realizar" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-slate-700">Acción Comercial Programada <span className="text-error">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Llamada para sustentar propuesta" {...field} className="border-border bg-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="proximoSeguimiento"
                  rules={{ required: "La fecha de próximo seguimiento es obligatoria" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-slate-700">Fecha Próximo Seguimiento <span className="text-error">*</span></FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className="border-border bg-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="ultimoContacto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-slate-700">Fecha Último Contacto</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className="border-border bg-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator className="bg-slate-100" />

            {/* Sección: Observaciones */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-2">
                <span className="w-2 h-4 bg-primary rounded-sm" />
                Observaciones & Notas
              </h3>
              <FormField
                control={form.control}
                name="observaciones"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-slate-700">Detalles Adicionales</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Ingrese comentarios sobre el estado actual del cliente, requerimientos técnicos, etc." 
                        className="min-h-[100px] border-border resize-none"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-3 pt-6 px-6 pb-6 border-t border-border bg-white rounded-b-xl shrink-0">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel} 
            className="font-bold border-border bg-white hover:bg-muted"
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            className="bg-primary hover:bg-primary/90 text-white font-bold px-8 shadow-lg shadow-primary/20"
          >
            {client ? "Guardar Cambios" : "Crear Cliente"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
