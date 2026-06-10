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
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import { Combobox } from "@/components/ui/combobox";
import { Factura } from "@/types/finanzas";

interface FacturaFormProps {
  initialData?: Factura | null;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export function FacturaForm({ initialData, onSubmit, onCancel }: FacturaFormProps) {
  const [clientes, setClientes] = useState<any[]>([]);
  const [proyectos, setProyectos] = useState<any[]>([]);

  const form = useForm({
    defaultValues: {
      codigo: initialData?.codigo || "",
      estado: initialData?.estado || "PENDIENTE",
      clienteId: initialData?.clienteId || "",
      proyectoId: initialData?.proyectoId || "",
      montoSubtotal: initialData?.montoSubtotal || "" as any,
      montoIgv: initialData?.montoIgv || 0,
      montoTotal: initialData?.montoTotal || 0,
      fechaEmision: initialData?.fechaEmision ? new Date(initialData.fechaEmision).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      fechaVencimiento: initialData?.fechaVencimiento ? new Date(initialData.fechaVencimiento).toISOString().split('T')[0] : "",
      observaciones: initialData?.observaciones || "",
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsRes, projectsRes] = await Promise.all([
          api.get('/crm/clientes?limit=200'),
          api.get('/operaciones/proyectos?limit=200')
        ]);
        setClientes(Array.isArray(clientsRes.data) ? clientsRes.data : []);
        setProyectos(Array.isArray(projectsRes.data) ? projectsRes.data : []);
      } catch (e) {
        console.error("Error cargando datos para el formulario", e);
      }
    };
    fetchData();
  }, []);

  const selectedClienteId = form.watch("clienteId");
  const filteredProyectos = useMemo(() => {
    if (!selectedClienteId) return [];
    return proyectos.filter(p => p.clientId === selectedClienteId);
  }, [proyectos, selectedClienteId]);

  useEffect(() => {
    const currentProyectoId = form.getValues("proyectoId");
    if (currentProyectoId && currentProyectoId !== "none") {
      const isValid = filteredProyectos.some(p => p.id === currentProyectoId);
      if (!isValid) form.setValue("proyectoId", "");
    }
    if (filteredProyectos.length === 1 && !form.getValues("proyectoId")) {
      form.setValue("proyectoId", filteredProyectos[0].id);
    }
  }, [filteredProyectos, form, selectedClienteId]);

  // Calcular IGV y Total automáticamente
  const subtotalValue = form.watch("montoSubtotal");
  useEffect(() => {
    const subtotal = parseFloat(subtotalValue) || 0;
    const igv = subtotal * 0.18;
    const total = subtotal + igv;
    form.setValue("montoIgv", Number(igv.toFixed(2)));
    form.setValue("montoTotal", Number(total.toFixed(2)));
  }, [subtotalValue, form]);

  const clientOptions = useMemo(() => 
    clientes.map(c => ({
      value: c.id,
      label: c.empresa,
      subLabel: `RUC: ${c.ruc}`
    })), [clientes]);

  const projectOptions = useMemo(() => {
    const options: { value: string; label: string; subLabel?: string }[] = [{ value: "none", label: "Sin Proyecto (Factura Directa)" }];
    filteredProyectos.forEach(p => {
      options.push({
        value: p.id,
        label: p.nombre,
        subLabel: `CÓDIGO: ${p.codigo}`
      });
    });
    return options;
  }, [filteredProyectos]);

  const handleLocalSubmit = (data: any) => {
    // Convertir el subtotal a número antes de enviar
    const finalData = {
      ...data,
      montoSubtotal: parseFloat(data.montoSubtotal) || 0,
      proyectoId: data.proyectoId === "none" ? null : data.proyectoId
    };
    onSubmit(finalData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleLocalSubmit)} className="flex flex-col h-[65vh] w-full">
        {/* Navigation Indicator */}
        <div className="flex justify-center py-2">
            <div className="w-16 h-1.5 bg-slate-200 rounded-full"></div>
        </div>
        
        <div className="flex-grow overflow-hidden relative factura-scroll-area">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="codigo"
                  rules={{ required: "Requerido" }}
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel className="font-bold text-[11px] uppercase text-slate-500 tracking-wider">Número de Factura</FormLabel>
                      <FormControl>
                        <Input placeholder="F001-000001" {...field} className="bg-white border-slate-200" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="estado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-[11px] uppercase text-slate-500 tracking-wider">Estado</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white border-slate-200">
                            <SelectValue placeholder="Seleccione un estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                          <SelectItem value="PAGADA">Pagada</SelectItem>
                          <SelectItem value="PAGADA_PARCIAL">Pagada Parcial</SelectItem>
                          <SelectItem value="ANULADA">Anulada</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="clienteId"
                rules={{ required: "Seleccione un cliente" }}
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="font-bold text-[11px] uppercase text-slate-500 tracking-wider">Cliente</FormLabel>
                    <Combobox
                      options={clientOptions}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Buscar cliente..."
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="proyectoId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="font-bold text-[11px] uppercase text-slate-500 tracking-wider">Proyecto Asociado</FormLabel>
                    <Combobox
                      options={projectOptions}
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="Buscar proyecto..."
                      emptyMessage={selectedClienteId ? "No hay proyectos para este cliente." : "Seleccione un cliente primero."}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fechaEmision"
                  rules={{ required: "Requerido" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-[11px] uppercase text-slate-500 tracking-wider">Fecha Emisión</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className="bg-white border-slate-200" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fechaVencimiento"
                  rules={{ required: "Requerido" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-[11px] uppercase text-slate-500 tracking-wider">Fecha Vencimiento</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className="bg-white border-slate-200" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4 bg-slate-100 p-4 rounded-xl border-2 border-slate-200 shadow-inner">
                <FormField
                  control={form.control}
                  name="montoSubtotal"
                  rules={{ required: "Requerido" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-black text-[10px] uppercase text-primary tracking-tighter">Subtotal</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00"
                          {...field} 
                          className="bg-white border-slate-300 font-bold"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="montoIgv"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-black text-[10px] uppercase text-primary tracking-tighter">IGV (18%)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" value={field.value} readOnly className="bg-slate-200 border-none font-bold text-slate-500" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="montoTotal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-black text-[10px] uppercase text-secondary tracking-tighter">Total PEN</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" value={field.value} readOnly className="bg-secondary/10 border-secondary/20 font-black text-secondary text-lg h-10 shadow-sm" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="observaciones"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-[11px] uppercase text-slate-500 tracking-wider">Observaciones</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Detalles adicionales, condiciones de pago, etc." 
                        {...field} 
                        className="bg-white border-slate-200 min-h-[120px] resize-none focus-visible:ring-secondary" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </ScrollArea>
        </div>

        <div className="flex-shrink-0 flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="ghost" onClick={onCancel} className="font-black uppercase text-[10px] tracking-widest text-slate-500 hover:bg-slate-100 px-6">
            Cancelar
          </Button>
          <Button type="submit" className="font-black uppercase text-[10px] tracking-widest bg-secondary hover:bg-secondary/90 text-white px-10 shadow-lg shadow-secondary/20">
            {initialData ? "Actualizar Factura" : "Registrar Factura"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
