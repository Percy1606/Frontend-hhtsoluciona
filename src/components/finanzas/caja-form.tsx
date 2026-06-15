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
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Loader2, Wallet, Lock } from "lucide-react";

import { Switch } from "@/components/ui/switch";

interface CajaFormProps {
  initialData?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export function CajaForm({ initialData, onSubmit, onCancel }: CajaFormProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm({
    defaultValues: {
      nombre: initialData?.nombre || "",
      tipo: initialData?.tipo || "EFECTIVO",
      saldoReal: initialData?.saldoReal || 0,
      esProtegida: initialData?.esProtegida || false,
      motivoAjuste: "",
    },
  });

  const handleLocalSubmit = async (data: any) => {
    setLoading(true);
    try {
      await onSubmit(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleLocalSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="nombre"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-black uppercase text-slate-500">Nombre de la Cuenta / Caja</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Banco BCP, Caja Chica..." {...field} className="h-11 text-sm font-bold" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tipo"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-black uppercase text-slate-500">Tipo de Cuenta</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-11 text-sm font-bold">
                      <SelectValue placeholder="Seleccione tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-white">
                    <SelectItem value="BANCO" className="text-sm font-medium">CUENTA BANCARIA</SelectItem>
                    <SelectItem value="EFECTIVO" className="text-sm font-medium">EFECTIVO / CAJA CHICA</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30">
                        <Lock className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <Label className="text-xs font-black uppercase tracking-widest text-white">Bóveda Blindada (Protegida)</Label>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Solo administradores podrán ver y usar esta caja</p>
                    </div>
                </div>
                <FormField
                    control={form.control}
                    name="esProtegida"
                    render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <Switch 
                                    checked={field.value} 
                                    onCheckedChange={field.onChange}
                                    className="data-[state=checked]:bg-primary"
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />
            </div>
        </div>

        <FormField
          control={form.control}
          name="saldoReal"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-black uppercase text-primary">
                {initialData ? "Ajustar Saldo Real (S/.)" : "Saldo Inicial (S/.)"}
              </FormLabel>
              <FormControl>
                <Input 
                  type="text" 
                  autoComplete="off"
                  value={field.value === 0 ? "" : Number(field.value).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                  onChange={(e) => {
                    const rawValue = e.target.value.replace(/[^0-9.]/g, '');
                    const num = parseFloat(rawValue);
                    field.onChange(isNaN(num) ? 0 : num);
                  }}
                  className="h-12 text-xl font-black text-primary bg-primary/5 border-primary/20 focus-visible:ring-primary" 
                  placeholder="0.00"
                />
              </FormControl>
              <p className="text-[9px] font-medium text-slate-400 uppercase italic">
                {initialData ? "Use este campo solo para correcciones manuales. Se generará una transacción de ajuste." : "Este será el saldo con el que iniciará la caja en el sistema."}
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        {initialData && (
          <FormField
            control={form.control}
            name="motivoAjuste"
            rules={{ required: form.watch("saldoReal") !== initialData.saldoReal ? "Debe especificar un motivo para el ajuste" : false }}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-black uppercase text-slate-500">Motivo del Ajuste</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Ej: Corrección por error de registro, Saldo inicial real..." 
                    {...field} 
                    className="min-h-[80px] text-xs font-bold"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="ghost" onClick={onCancel} className="font-black uppercase text-[10px] tracking-widest text-slate-500">
            Cancelar
          </Button>
          <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90 text-white font-black uppercase text-[10px] tracking-widest px-8 shadow-lg shadow-primary/20">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Wallet className="w-4 h-4 mr-2" />}
            {initialData ? "Guardar Cambios" : "Crear Caja"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
