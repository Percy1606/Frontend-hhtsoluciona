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
import { Gasto } from "@/types/finanzas";

interface GastoFormProps {
  initialData?: Gasto | null;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export function GastoForm({ initialData, onSubmit, onCancel }: GastoFormProps) {
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [proyectos, setProyectos] = useState<any[]>([]);

  const form = useForm({
    defaultValues: {
      codigo: initialData?.codigo || "",
      proveedorId: initialData?.proveedorId || "",
      proyectoId: initialData?.proyectoId || "",
      tipo: initialData?.tipo || "OPERATIVO",
      concepto: initialData?.concepto || "",
      montoTotal: initialData?.montoTotal || "" as any,
      fechaEmision: initialData?.fechaEmision ? new Date(initialData.fechaEmision).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      fechaVencimiento: initialData?.fechaVencimiento ? new Date(initialData.fechaVencimiento).toISOString().split('T')[0] : "",
      estado: initialData?.estado || "PENDIENTE",
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [provRes, projectsRes] = await Promise.all([
          api.get('/logistica/proveedores?limit=200'),
          api.get('/operaciones/proyectos?limit=200')
        ]);
        setProveedores(Array.isArray(provRes.data) ? provRes.data : []);
        setProyectos(Array.isArray(projectsRes.data) ? projectsRes.data : []);
      } catch (e) {
        console.error("Error cargando datos para el formulario de gastos", e);
      }
    };
    fetchData();
  }, []);

  const providerOptions = useMemo(() => 
    proveedores.map(p => ({
      value: p.id,
      label: p.razonSocial,
      subLabel: `RUC: ${p.ruc}`
    })), [proveedores]);

  const projectOptions = useMemo(() => {
    const options: { value: string; label: string; subLabel?: string }[] = [{ value: "none", label: "Sin Proyecto (Gasto General)" }];
    proyectos.forEach(p => {
      options.push({
        value: p.id,
        label: p.nombre,
        subLabel: `CÓDIGO: ${p.codigo}`
      });
    });
    return options;
  }, [proyectos]);

  const handleLocalSubmit = (data: any) => {
    const finalData = {
      ...data,
      montoTotal: parseFloat(data.montoTotal) || 0,
      proyectoId: data.proyectoId === "none" ? null : data.proyectoId,
      proveedorId: data.proveedorId || null,
      fechaVencimiento: data.fechaVencimiento || null
    };
    onSubmit(finalData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleLocalSubmit)} className="flex flex-col h-[65vh] w-full">
        <ScrollArea className="flex-grow p-1 pr-4">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="codigo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-[11px] uppercase text-slate-500 tracking-wider">Número de Comprobante</FormLabel>
                    <FormControl>
                      <Input placeholder="E001-000001" {...field} className="bg-white border-slate-200" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tipo"
                rules={{ required: "Requerido" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-[11px] uppercase text-slate-500 tracking-wider">Tipo de Gasto</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-white border-slate-200">
                          <SelectValue placeholder="Seleccione tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="OPERATIVO">OPERATIVO</SelectItem>
                        <SelectItem value="ADMINISTRATIVO">ADMINISTRATIVO</SelectItem>
                        <SelectItem value="FINANCIERO">FINANCIERO</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="concepto"
              rules={{ required: "Requerido" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold text-[11px] uppercase text-slate-500 tracking-wider">Concepto / Glosa</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Pago de servicios de transporte" {...field} className="bg-white border-slate-200" />
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
                  <FormLabel className="font-bold text-[11px] uppercase text-slate-500 tracking-wider">Proveedor</FormLabel>
                  <Combobox
                    options={providerOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Buscar proveedor..."
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
                name="montoTotal"
                rules={{ required: "Requerido" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-[11px] uppercase text-slate-500 tracking-wider">Monto Total (S/.)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00"
                        {...field} 
                        className="bg-white border-slate-200 font-bold text-error"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="estado"
              rules={{ required: "Requerido" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold text-[11px] uppercase text-slate-500 tracking-wider">Estado de Pago</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-white border-slate-200">
                        <SelectValue placeholder="Seleccione estado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PENDIENTE">PENDIENTE</SelectItem>
                      <SelectItem value="PAGADO">PAGADO</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </ScrollArea>

        <div className="flex-shrink-0 flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="ghost" onClick={onCancel} className="font-black uppercase text-[10px] tracking-widest text-slate-500 hover:bg-slate-100 px-6">
            Cancelar
          </Button>
          <Button type="submit" className="font-black uppercase text-[10px] tracking-widest bg-error hover:bg-error/90 text-white px-10 shadow-lg shadow-error/20">
            {initialData ? "Actualizar Gasto" : "Registrar Gasto"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
