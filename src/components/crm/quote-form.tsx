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
import { Quote, useCRMStore } from "@/store/crm-store";
import { useEffect } from "react";

interface QuoteFormProps {
  quote?: Quote | null;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export function QuoteForm({ quote, onSubmit, onCancel }: QuoteFormProps) {
  const { clients } = useCRMStore();
  
  const form = useForm({
    defaultValues: quote || {
      clientId: "",
      empresa: "",
      contacto: "",
      monto: 0,
      estado: "Pendiente",
      fecha: new Date().toISOString().split('T')[0],
      validez: "15 días",
      observaciones: "",
    },
  });

  // Automatically fill client details when clientId changes
  const selectedClientId = form.watch("clientId");
  useEffect(() => {
    if (selectedClientId && !quote) {
      const client = clients.find(c => c.id === selectedClientId);
      if (client) {
        form.setValue("empresa", client.empresa);
        form.setValue("contacto", client.contacto);
      }
    }
  }, [selectedClientId, clients, form, quote]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="clientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-black uppercase text-primary">Vincular Cliente</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-11 border-slate-200">
                      <SelectValue placeholder="Seleccionar cliente..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-white">
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.empresa} ({client.ruc})
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
            name="monto"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-black uppercase text-primary">Monto Total (S/)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01" 
                    className="h-11 border-slate-200 font-bold" 
                    {...field} 
                    onChange={e => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="empresa"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-black uppercase text-primary">Empresa</FormLabel>
                <FormControl>
                  <Input placeholder="Nombre de la empresa" className="h-11 border-slate-200" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contacto"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-black uppercase text-primary">Persona de Contacto</FormLabel>
                <FormControl>
                  <Input placeholder="Nombre del contacto" className="h-11 border-slate-200" {...field} />
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
                <FormLabel className="text-xs font-black uppercase text-primary">Estado</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-11 border-slate-200">
                      <SelectValue placeholder="Estado..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-white">
                    <SelectItem value="Pendiente">Pendiente</SelectItem>
                    <SelectItem value="Enviado">Enviado</SelectItem>
                    <SelectItem value="Aprobado">Aprobado</SelectItem>
                    <SelectItem value="Rechazado">Rechazado</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fecha"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-black uppercase text-primary">Fecha de Emisión</FormLabel>
                <FormControl>
                  <Input type="date" className="h-11 border-slate-200" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="observaciones"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-black uppercase text-primary">Observaciones / Notas</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Detalles adicionales de la propuesta..." 
                  className="min-h-[100px] border-slate-200 resize-none" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            className="border-slate-200 text-slate-500 font-bold px-8 h-11"
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            className="bg-primary hover:bg-primary/90 text-white font-bold px-8 shadow-lg shadow-primary/20 h-11"
          >
            {quote ? "Actualizar Cotización" : "Registrar Cotización"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
