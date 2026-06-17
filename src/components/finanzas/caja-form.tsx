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
import { Loader2, Wallet, Lock, Activity } from "lucide-react";
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
      subtipo: initialData?.subtipo || "OPERATIVA",
      moneda: initialData?.moneda || "PEN",
      saldoReal: initialData?.saldoReal || 0,
      porcentajeProvision: initialData?.porcentajeProvision || 0,
      esProtegida: initialData?.esProtegida || false,
      esPrincipal: initialData?.esPrincipal || false,
      motivoAjuste: "",
    },
  });

  const handleLocalSubmit = async (data: any) => {
    setLoading(true);
    try {
      // Asegurar que porcentajeProvision sea número
      const payload = {
          ...data,
          porcentajeProvision: parseFloat(data.porcentajeProvision) || 0,
          saldoReal: parseFloat(data.saldoReal) || 0,
          esPrincipal: !!data.esPrincipal
      };
      await onSubmit(payload);
    } finally {
      setLoading(false);
    }
  };

  const selectedMoneda = form.watch("moneda");
  const currentSubtipo = form.watch("subtipo");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleLocalSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="nombre"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Nombre de la Cuenta / Caja</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Banco BCP, Caja Chica..." {...field} className="h-11 text-sm font-bold" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="subtipo"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-black uppercase text-primary tracking-widest">Categoría / Propósito</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-11 text-sm font-black border-primary/20 bg-primary/5 text-primary">
                      <SelectValue placeholder="Propósito de la caja" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-white">
                    <SelectItem value="OPERATIVA" className="text-sm font-bold">Caja Operativa (Día a día)</SelectItem>
                    <SelectItem value="OBLIGACIONES" className="text-sm font-bold text-orange-600">Obligaciones (Impuestos/AFP)</SelectItem>
                    <SelectItem value="RESERVA" className="text-sm font-bold text-emerald-600">Reserva Estratégica</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentSubtipo === 'OPERATIVA' ? (
                <div className="bg-blue-50 p-4 rounded-2xl border-2 border-blue-100 space-y-3 animate-in fade-in duration-300">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                            <Activity className="w-4 h-4 text-blue-600" />
                        </div>
                        <Label className="text-[10px] font-black uppercase text-blue-700 tracking-widest">Ahorro de Impuestos</Label>
                    </div>
                    <FormField
                        control={form.control}
                        name="porcentajeProvision"
                        render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <div className="flex items-center gap-3">
                                    <Input 
                                        type="number" 
                                        {...field} 
                                        className="h-10 w-20 bg-white border-blue-200 font-black text-center text-blue-600"
                                    />
                                    <span className="font-black text-blue-600 text-xs">%</span>
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
            ) : (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
                    <div className="space-y-1">
                        <Label className="text-[10px] font-black uppercase text-slate-600 tracking-widest italic">Cuenta Principal</Label>
                        <p className="text-[8px] font-bold text-slate-400 uppercase leading-tight">Marcar como destino de ahorros</p>
                    </div>
                    <FormField
                        control={form.control}
                        name="esPrincipal"
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
            )}

            <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 flex items-center justify-between shadow-lg">
                <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary italic">Bóveda Blindada</Label>
                    <p className="text-[8px] font-bold text-slate-400 uppercase leading-tight">Solo acceso nivel Admin</p>
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
             control={form.control}
             name="tipo"
             render={({ field }) => (
               <FormItem>
                 <FormLabel className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Tipo de Cuenta</FormLabel>
                 <Select onValueChange={field.onChange} value={field.value}>
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
            <FormField
                control={form.control}
                name="moneda"
                render={({ field }) => (
                <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Moneda</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!!initialData}>
                    <FormControl>
                        <SelectTrigger className="h-11 text-sm font-bold">
                        <SelectValue placeholder="Seleccione moneda" />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white">
                        <SelectItem value="PEN" className="text-sm font-medium">S/ (SOLES)</SelectItem>
                        <SelectItem value="USD" className="text-sm font-medium">$ (DÓLARES)</SelectItem>
                    </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
                )}
            />
        </div>

        <FormField
          control={form.control}
          name="saldoReal"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-black uppercase text-primary">
                {initialData ? `Ajustar Saldo Real (${selectedMoneda})` : `Saldo Inicial (${selectedMoneda})`}
              </FormLabel>
              <FormControl>
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/50 font-black text-xl">{selectedMoneda === 'PEN' ? 'S/' : '$'}</span>
                    <Input 
                        type="number"
                        step="0.01"
                        autoComplete="off"
                        className="h-12 text-xl font-black text-primary bg-primary/5 border-primary/20 focus-visible:ring-primary pl-12" 
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                </div>
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
