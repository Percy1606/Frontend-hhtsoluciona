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
import { Client } from "@/types/crm";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface ClientFormProps {
  client?: Client | null;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export function ClientForm({ client, onSubmit, onCancel }: ClientFormProps) {
  const form = useForm({
    defaultValues: client ? {
      ...client,
      telefono: client.telefono || "",
      cargo: client.cargo || "",
      correo: client.correo || "",
      cartera: client.cartera || "",
      clasificacion: client.clasificacion || "RENTABLE",
      diaTrabajo: client.diaTrabajo || "Otros",
      ultimoContacto: client.ultimoContacto ? client.ultimoContacto.split('T')[0] : "",
      proximoSeguimiento: client.proximoSeguimiento ? client.proximoSeguimiento.split('T')[0] : "",
      observaciones: client.observaciones || "",
      accion: client.accion || "",
      tarifa: client.tarifa || "MT3",
      asignadoA: client.asignadoA || "Angie",
      prioridad: client.prioridad || "Media",
      etapaComercial: client.etapaComercial || "Prospecto",
      tipoCliente: client.tipoCliente || "PROSPECTO",
      estado: client.estado || "Activo",
      } : {
      codigo: "",
      empresa: "",
      ruc: "",
      direccion: "",
      tarifa: "MT3",
      contacto: "",
      telefono: "",
      cargo: "",
      correo: "",
      cartera: "",
      clasificacion: "RENTABLE",
      asignadoA: "Angie",
      diaTrabajo: "Otros",
      estado: "Activo",
      prioridad: "Media",
      zona: "",
      observaciones: "",
      accion: "",
      ultimoContacto: new Date().toISOString().split('T')[0],
      proximoSeguimiento: "",
      tipoCliente: "PROSPECTO",
      etapaComercial: "Prospecto",
      },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="h-full flex flex-col">
        <ScrollArea className="flex-1 max-h-[60vh]">
          <div className="space-y-6 p-6">
            {/* Sección: Información de la Empresa */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-2">
                <span className="w-1 h-4 bg-primary rounded-full" />
                Información de la Empresa
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="codigo"
                  rules={{ required: "Requerido" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-slate-700 text-[11px] uppercase">Código Empresa <span className="text-error">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="HHT-..." {...field} className="h-9 text-sm border-slate-200 focus:border-primary" />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="empresa"
                  rules={{ required: "Requerido" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-slate-700 text-[11px] uppercase">Razón Social <span className="text-error">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Empresa S.A.C." {...field} className="h-9 text-sm border-slate-200 focus:border-primary" />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="ruc"
                  rules={{ 
                    required: form.watch("etapaComercial") !== "Prospecto" ? "Requerido para esta etapa" : false,
                    pattern: { value: /^\d{11}$/, message: "11 dígitos" } 
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-slate-700 text-[11px] uppercase">
                        RUC {form.watch("etapaComercial") !== "Prospecto" && <span className="text-error">*</span>}
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="20..." maxLength={11} {...field} className="h-9 text-sm border-slate-200 focus:border-primary" />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tarifa"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-slate-700 text-[11px] uppercase">Tarifa</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-9 text-sm bg-white border-slate-200">
                            <SelectValue placeholder="MT2/MT3/MT4" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white">
                          <SelectItem value="MT1">MT1</SelectItem>
                          <SelectItem value="MT2">MT2</SelectItem>
                          <SelectItem value="MT3">MT3</SelectItem>
                          <SelectItem value="MT4">MT4</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="direccion"
                  rules={{ required: "Requerido" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-slate-700 text-[11px] uppercase">Dirección <span className="text-error">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Av. Principal..." {...field} className="h-9 text-sm border-slate-200" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="zona"
                  rules={{ required: "Requerido" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-slate-700 text-[11px] uppercase">Zona / Distrito <span className="text-error">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Piura" {...field} className="h-9 text-sm border-slate-200" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator className="opacity-50" />

            {/* Sección: Datos de Contacto */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-2">
                <span className="w-1 h-4 bg-primary rounded-full" />
                Contacto & Comunicación
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contacto"
                  rules={{ required: "Requerido" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-slate-700 text-[11px] uppercase">Nombre Contacto <span className="text-error">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Persona responsable" {...field} className="h-9 text-sm border-slate-200" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cargo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-slate-700 text-[11px] uppercase">Cargo</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Administrador" {...field} className="h-9 text-sm border-slate-200" />
                      </FormControl>
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
                      <FormLabel className="font-bold text-slate-700 text-[11px] uppercase">Teléfono</FormLabel>
                      <FormControl>
                        <Input placeholder="999..." {...field} className="h-9 text-sm border-slate-200" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="correo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-slate-700 text-[11px] uppercase">Correo</FormLabel>
                      <FormControl>
                        <Input placeholder="email@ejemplo.com" type="email" {...field} className="h-9 text-sm border-slate-200" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator className="opacity-50" />

            {/* Sección: Gestión Comercial */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-2">
                <span className="w-1 h-4 bg-primary rounded-full" />
                Gestión Comercial
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="etapaComercial"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-slate-700 text-[11px] uppercase">Etapa</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        disabled={client?.etapaComercial === 'Ganado'}
                      >
                        <FormControl>
                          <SelectTrigger className="h-9 text-sm bg-white border-slate-200">
                            <SelectValue />
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
                          <SelectItem value="Ganado">Ganado</SelectItem>
                          <SelectItem value="Perdido">Perdido</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="asignadoA"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-slate-700 text-[11px] uppercase">Asignado A</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-9 text-sm bg-white border-slate-200">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white">
                          <SelectItem value="Angie">Angie</SelectItem>
                          <SelectItem value="Valentina">Valentina</SelectItem>
                          <SelectItem value="Ariana">Ariana</SelectItem>
                          <SelectItem value="Nicoll">Nicoll</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="diaTrabajo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-slate-700 text-[11px] uppercase">Día de Revisión</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-9 text-sm bg-white border-slate-200">
                            <SelectValue placeholder="Seleccionar día" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white">
                          <SelectItem value="Martes">Martes</SelectItem>
                          <SelectItem value="Jueves">Jueves</SelectItem>
                          <SelectItem value="Otros">Otros / Sin asignar</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="prioridad"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-slate-700 text-[11px] uppercase">Prioridad</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-9 text-sm bg-white border-slate-200">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white">
                          <SelectItem value="Baja">Baja</SelectItem>
                          <SelectItem value="Media">Media</SelectItem>
                          <SelectItem value="Alta">Alta</SelectItem>
                          <SelectItem value="Crítica">Crítica</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="clasificacion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-slate-700 text-[11px] uppercase">Clasificación</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-9 text-sm bg-white border-slate-200">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white">
                          <SelectItem value="MUY_RENTABLE">Muy Rentable</SelectItem>
                          <SelectItem value="RENTABLE">Rentable</SelectItem>
                          <SelectItem value="POCO_RENTABLE">Poco Rentable</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator className="opacity-50" />

            {/* Sección: Seguimiento */}
            <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200 border-dashed">
              <h3 className="text-xs font-black uppercase tracking-wider text-accent flex items-center gap-2">
                <span className="w-1 h-4 bg-accent rounded-full" />
                Seguimiento
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="accion"
                  rules={{ required: "Requerido" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-slate-700 text-[11px] uppercase">Acción Programada <span className="text-error">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Llamar" {...field} className="h-9 text-sm border-slate-200" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="proximoSeguimiento"
                  rules={{ required: "Requerido" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-slate-700 text-[11px] uppercase">Fecha <span className="text-error">*</span></FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className="h-9 text-sm border-slate-200" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Observaciones */}
            <FormField
              control={form.control}
              name="observaciones"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold text-slate-700 text-[11px] uppercase">Observaciones Generales</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Detalles adicionales..." 
                      className="min-h-[80px] text-sm resize-none border-slate-200"
                      {...field} 
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </ScrollArea>

        {/* Footer fijo con botones */}
        <div className="flex items-center justify-end gap-3 p-4 border-t bg-slate-50 mt-auto shrink-0">
          <Button 
            type="button" 
            variant="ghost" 
            onClick={onCancel} 
            className="font-bold text-slate-500 hover:bg-slate-200 h-9"
          >
            CANCELAR
          </Button>
          <Button 
            type="submit" 
            className="bg-primary hover:bg-primary/90 text-white font-black px-8 h-9 shadow-md"
          >
            {client ? "ACTUALIZAR DATOS" : "GUARDAR CLIENTE"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
