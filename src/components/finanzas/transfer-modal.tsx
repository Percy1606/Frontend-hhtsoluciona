"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
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
import { ArrowRightLeft, Loader2, Wallet, Lock } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  cajas: any[];
  initialOrigenId?: string;
}

export function TransferModal({ isOpen, onClose, onSubmit, cajas, initialOrigenId }: TransferModalProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm({
    defaultValues: {
      origenId: initialOrigenId || "",
      destinoId: "",
      monto: 0,
      concepto: "",
    },
  });

  const origenId = form.watch("origenId");
  const origenCaja = cajas.find(c => c.id === origenId);
  const filteredDestinos = cajas.filter(c => c.id !== origenId);

  const handleLocalSubmit = async (data: any) => {
    setLoading(true);
    try {
      await onSubmit(data);
      form.reset();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white p-0 overflow-hidden rounded-3xl border-none shadow-2xl">
        <DialogHeader className="bg-slate-900 text-white p-6">
          <DialogTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-primary" /> Transferencia entre Cuentas
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleLocalSubmit)} className="p-6 space-y-6">
            <div className="space-y-4">
              {/* CUENTA ORIGEN */}
              <FormField
                control={form.control}
                name="origenId"
                rules={{ required: "Seleccione origen" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase text-slate-500">De la Cuenta (Origen)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11 font-bold text-xs border-slate-200">
                          <SelectValue placeholder="Seleccione origen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {cajas.map(c => (
                          <SelectItem key={c.id} value={c.id} className="font-bold text-xs">
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                    {c.nombre}
                                    {c.esProtegida && <Lock className="w-3 h-3 text-primary" />}
                                </div>
                                <span className="text-[9px] text-slate-400 font-normal uppercase">Disponible: {formatCurrency(Number(c.saldoDisponible))}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-center -my-2 relative z-10">
                  <div className="bg-slate-100 p-2 rounded-full border-2 border-white shadow-sm">
                    <ArrowRightLeft className="w-4 h-4 text-slate-400 rotate-90" />
                  </div>
              </div>

              {/* CUENTA DESTINO */}
              <FormField
                control={form.control}
                name="destinoId"
                rules={{ required: "Seleccione destino" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase text-slate-500">A la Cuenta (Destino)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11 font-bold text-xs border-slate-200">
                          <SelectValue placeholder="Seleccione destino" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredDestinos.map(c => (
                          <SelectItem key={c.id} value={c.id} className="font-bold text-xs">
                            <div className="flex items-center gap-2">
                                {c.nombre}
                                {c.esProtegida && <Lock className="w-3 h-3 text-primary" />}
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

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4">
                <FormField
                    control={form.control}
                    name="monto"
                    rules={{ 
                        required: "Ingrese el monto",
                        min: { value: 0.01, message: "El monto debe ser mayor a 0" },
                        validate: (val) => val <= Number(origenCaja?.saldoDisponible || 0) || "Fondos insuficientes"
                    }}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase text-primary">Monto a Transferir (S/.)</FormLabel>
                            <FormControl>
                                <Input 
                                    type="text"
                                    autoComplete="off"
                                    placeholder="0.00"
                                    className="h-12 text-xl font-black text-primary bg-white border-primary/20 focus-visible:ring-primary"
                                    value={field.value === 0 ? "" : Number(field.value).toLocaleString('en-US')}
                                    onChange={(e) => {
                                        const raw = e.target.value.replace(/[^0-9.]/g, '');
                                        field.onChange(parseFloat(raw) || 0);
                                    }}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {origenCaja && form.watch("destinoId") && Number(form.watch("monto")) > 0 && (
                  <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1.5 text-xs">
                    <p className="text-[10px] font-black uppercase text-blue-800 tracking-wider">Resumen de la Transferencia</p>
                    <div className="flex justify-between items-center text-slate-700">
                      <span>Cuenta Origen: <strong>{origenCaja.nombre}</strong></span>
                      <span className="text-red-600 font-black">- S/ {Number(form.watch("monto")).toLocaleString("es-PE", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-700">
                      <span>Cuenta Destino: <strong>{cajas.find(c => c.id === form.watch("destinoId"))?.nombre}</strong></span>
                      <span className="text-emerald-600 font-black">+ S/ {Number(form.watch("monto")).toLocaleString("es-PE", { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                )}

                <FormField
                    control={form.control}
                    name="concepto"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase text-slate-500">Motivo / Concepto</FormLabel>
                            <FormControl>
                                <Textarea 
                                    placeholder="Ej: Traspaso a reserva de planillas, Carga de caja chica..." 
                                    {...field} 
                                    className="min-h-[80px] text-xs font-bold bg-white resize-none"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <div className="flex gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={onClose} className="flex-1 font-black uppercase text-[10px] tracking-widest text-slate-500">
                    Cancelar
                </Button>
                <Button type="submit" disabled={loading} className="flex-[2] bg-primary hover:bg-primary/90 text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ArrowRightLeft className="w-4 h-4 mr-2" />}
                    Confirmar Traspaso
                </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
