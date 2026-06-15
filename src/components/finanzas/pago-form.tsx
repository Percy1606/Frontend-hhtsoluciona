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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Factura } from "@/types/finanzas";
import { 
  Loader2, 
  DollarSign, 
  Calendar, 
  CreditCard, 
  FileText,
  Wallet,
  Lock
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface PagoFormProps {
  factura: Factura;
  onSubmit: () => void;
  onCancel: () => void;
}

export function PagoForm({ factura, onSubmit, onCancel }: PagoFormProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cajas, setCajas] = useState<any[]>([]);

  const form = useForm({
    defaultValues: {
      facturaId: factura.id,
      monto: factura.saldoPendiente,
      cajaId: "",
      fechaPago: new Date().toISOString().split('T')[0],
      metodo: "TRANSFERENCIA",
      referencia: "",
      comprobanteUrl: "",
      observaciones: "",
    },
  });

  useEffect(() => {
    const fetchCajas = async () => {
      try {
        const res = await api.get('/finanzas/cajas');
        setCajas(Array.isArray(res) ? res : []);
        if (Array.isArray(res) && res.length > 0) {
            form.setValue('cajaId', res[0].id);
        }
      } catch (e) {
        console.error("Error fetching cajas for payment:", e);
      }
    };
    fetchCajas();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/crm/cotizaciones/upload', formData);
      form.setValue('comprobanteUrl', res.url);
      toast.success("Comprobante subido");
    } catch (error) {
      console.error("Error subiendo archivo:", error);
      toast.error("Error al subir el comprobante");
    } finally {
      setIsUploading(false);
    }
  };

  const handleLocalSubmit = async (data: any) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        monto: Number(data.monto || 0),
      };
      await api.post('/finanzas/pagos', payload);
      toast.success(payload.monto > factura.saldoPendiente 
        ? "Pago registrado y excedente distribuido correctamente" 
        : "Pago registrado correctamente");
      onSubmit();
    } catch (e: any) {
      console.error("Error registrando pago", e);
      toast.error(e.response?.data?.message || "Error al registrar pago");
    } finally {
      setLoading(false);
    }
  };

  const totalPendienteCliente = Math.round(((factura.saldoPendiente || 0) + (factura.saldoAnterior || 0)) * 100) / 100;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleLocalSubmit)} className="space-y-6">
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-6 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Factura Actual ({factura.codigo})</span>
            <span className="font-black text-xs text-primary">{formatCurrency(factura.saldoPendiente)}</span>
          </div>
          
          {factura.saldoAnterior && factura.saldoAnterior > 0 ? (
            <>
              <div className="flex justify-between items-center text-red-600/80">
                <span className="text-[10px] font-black uppercase tracking-widest">Saldo Pendiente Anterior</span>
                <span className="font-black text-xs">{formatCurrency(factura.saldoAnterior)}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-secondary">
                <span className="text-[10px] font-black uppercase tracking-widest">Total Deuda Cliente</span>
                <span className="font-black text-base">{formatCurrency(totalPendienteCliente)}</span>
              </div>
              <div className="flex justify-end">
                <Button 
                  type="button" 
                  variant="link" 
                  className="text-[9px] font-black uppercase text-secondary p-0 h-auto"
                  onClick={() => form.setValue('monto', totalPendienteCliente)}
                >
                  Pagar Deuda Total
                </Button>
              </div>
            </>
          ) : (
            <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-secondary">
              <span className="text-[10px] font-black uppercase tracking-widest">Total Pendiente</span>
              <span className="font-black text-sm">{formatCurrency(factura.saldoPendiente)}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="monto"
            rules={{ required: "Requerido", min: 0.01 }}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-bold text-[10px] uppercase text-slate-500 tracking-wider">Monto a Pagar (S/)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
                    <Input 
                      type="number" 
                      step="0.01" 
                      {...field} 
                      value={isNaN(field.value) ? "" : field.value}
                      onFocus={(e) => e.target.select()}
                      onChange={e => {
                        const val = parseFloat(e.target.value);
                        field.onChange(isNaN(val) ? 0 : val);
                      }}
                      className="pl-9 bg-white border-slate-200 h-10 font-black text-secondary" 
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fechaPago"
            rules={{ required: "Requerido" }}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-bold text-[10px] uppercase text-slate-500 tracking-wider">Fecha de Pago</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input type="date" {...field} className="pl-9 bg-white border-slate-200 h-10 font-bold" />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="bg-emerald-50/50 p-5 rounded-2xl border-2 border-emerald-100 space-y-4 shadow-sm">
            <FormField
                control={form.control}
                name="cajaId"
                rules={{ required: "Debe seleccionar una cuenta de destino" }}
                render={({ field }) => (
                <FormItem>
                    <FormLabel className="font-black text-[10px] uppercase text-emerald-700 tracking-widest flex items-center gap-2">
                    <Wallet className="w-3.5 h-3.5" /> 💰 Destino de Fondos: ¿En qué cuenta se ha confirmado el depósito del cliente?
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                        <SelectTrigger className="bg-white border-emerald-200 h-11 font-black text-xs shadow-sm">
                        <SelectValue>
                          {cajas.find(c => c.id === field.value)?.nombre || "Seleccione la cuenta de destino..."}
                        </SelectValue>
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {cajas.map((c) => (
                        <SelectItem key={c.id} value={c.id} className="font-bold text-xs py-2">
                            <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <span>{c.nombre}</span>
                                {c.esProtegida && <Lock className="w-3 h-3 text-primary" />}
                            </div>
                            <span className="text-[9px] text-emerald-600 font-black uppercase tracking-widest">Capital Actual: {formatCurrency(Number(c.saldoReal))}</span>
                            </div>
                        </SelectItem>
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
            name="metodo"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-bold text-[10px] uppercase text-slate-500 tracking-wider">Método de Pago</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-10 font-bold text-xs bg-white border-slate-200">
                      <SelectValue placeholder="Seleccione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="TRANSFERENCIA" className="font-bold">Transferencia</SelectItem>
                    <SelectItem value="EFECTIVO" className="font-bold">Efectivo</SelectItem>
                    <SelectItem value="CHEQUE" className="font-bold">Cheque</SelectItem>
                    <SelectItem value="TARJETA" className="font-bold">Tarjeta</SelectItem>
                    <SelectItem value="OTRO" className="font-bold">Otro</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="referencia"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-bold text-[10px] uppercase text-slate-500 tracking-wider">Nro de Operación / Referencia</FormLabel>
                <FormControl>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input {...field} placeholder="Ej: 098234" className="pl-9 bg-white border-slate-200 h-10 font-bold" />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-2">
          <Label className="font-bold text-[10px] uppercase text-slate-500 tracking-wider">Voucher / Comprobante (Opcional)</Label>
          <div className="flex items-center gap-3">
            <Input 
              type="file" 
              onChange={handleFileChange} 
              className="h-10 border-slate-200 cursor-pointer text-xs"
              accept=".pdf,.jpg,.jpeg,.png"
            />
            {isUploading && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
          </div>
          {form.watch("comprobanteUrl") && (
            <p className="text-[9px] font-black text-green-600 uppercase">Voucher cargado correctamente ✓</p>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="ghost" onClick={onCancel} className="font-black uppercase text-[10px] tracking-widest text-slate-500 hover:bg-slate-100 px-6">
            Cancelar
          </Button>
          <Button type="submit" disabled={loading} className="font-black uppercase text-[10px] tracking-widest bg-secondary hover:bg-secondary/90 text-white px-10 shadow-lg shadow-secondary/20">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <DollarSign className="w-4 h-4 mr-2" />}
            Registrar Pago
          </Button>
        </div>
      </form>
    </Form>
  );
}
