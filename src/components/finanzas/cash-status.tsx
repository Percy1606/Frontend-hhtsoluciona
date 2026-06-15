"use client";

import { useState, useEffect } from "react";
import { 
  Building2, 
  Lock, 
  Unlock,
  CheckCircle2, 
  ArrowRightLeft,
  History,
  TrendingUp,
  TrendingDown,
  Plus,
  Minus,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ModernDialog } from "@/components/ui/modern-dialog";
import { toast } from "sonner";
import { cn, formatDate } from "@/lib/utils";
import { api } from "@/lib/api";

export function CashStatus() {
  const [cajas, setCajas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Manual action state
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState<'block' | 'release'>('block');
  const [selectedCaja, setSelectedCaja] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [concept, setConcept] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadCajas = async () => {
    try {
      const res = await api.get('/finanzas/cajas');
      setCajas(res);
    } catch (error) {
      console.error("Error loading cajas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCajas();
  }, []);

  const handleInitialize = async () => {
    try {
      await api.post('/finanzas/cajas/ensure', {});
      loadCajas();
    } catch (error) {
      console.error("Error initializing caja:", error);
    }
  };

  const handleManualAction = async () => {
    if (!selectedCaja || !amount || !concept) {
      toast.error("Por favor completa todos los campos");
      return;
    }
    
    try {
      setSubmitting(true);
      const endpoint = actionType === 'block' ? `/finanzas/cajas/${selectedCaja.id}/block` : `/finanzas/cajas/${selectedCaja.id}/release`;
      await api.post(endpoint, {
        monto: parseFloat(amount),
        concepto: concept
      });
      
      toast.success(actionType === 'block' ? "Fondos bloqueados correctamente" : "Fondos liberados correctamente");
      setIsActionModalOpen(false);
      setAmount("");
      setConcept("");
      loadCajas();
    } catch (error: any) {
      toast.error(error.message || "Error al procesar la solicitud");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="h-32 flex items-center justify-center text-[10px] font-black uppercase text-slate-400 animate-pulse">Cargando Estado de Caja...</div>;

  if (cajas.length === 0) {
    return (
        <Card className="border-2 border-dashed border-slate-200 p-8 text-center bg-slate-50/50 rounded-3xl">
            <p className="text-sm font-bold text-slate-400 uppercase mb-4 tracking-widest">No se ha inicializado el Motor de Seguridad Financiera</p>
            <button 
                onClick={handleInitialize}
                className="bg-primary text-white font-black text-[10px] uppercase px-6 py-3 rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all"
            >
                Activar Control de Caja y Fondos
            </button>
        </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cajas.map((caja) => (
        <Card key={caja.id} className="border-slate-200 shadow-md overflow-hidden hover:shadow-lg transition-all duration-300">
          <div className="bg-slate-900 p-4 text-white">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cuenta / Fondos</p>
                <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                   <Building2 className="w-4 h-4 text-primary" /> {caja.nombre}
                </h3>
              </div>
              <Badge className="bg-white/10 text-white border-none text-[8px] font-black uppercase">
                {caja.tipo}
              </Badge>
            </div>
            
            <div className="mt-6 flex items-end justify-between">
               <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Saldo Real Total</p>
                  <p className="text-lg font-black tracking-tight">
                    {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 }).format(caja.saldoReal || 0)}
                  </p>
               </div>
               <div className="text-right">
                  <div className={cn(
                    "flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full",
                    (caja.saldoDisponible || 0) > 0 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                  )}>
                    {(caja.saldoDisponible || 0) > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    DISPONIBLE
                  </div>
               </div>
            </div>
          </div>

          <CardContent className="p-5 space-y-5 bg-white">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px] font-black uppercase">
                <span className="text-slate-500 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-orange-500" /> Comprometido
                </span>
                <div className="flex items-center gap-1.5">
                   <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-7 w-7 rounded-lg border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:border-emerald-300 transition-all shadow-sm"
                    title="Liberar fondos manualmente"
                    onClick={() => {
                      setSelectedCaja(caja);
                      setActionType('release');
                      setIsActionModalOpen(true);
                    }}
                   >
                     <Unlock className="w-3.5 h-3.5" />
                   </Button>
                   <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-7 w-7 rounded-lg border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-100 hover:border-orange-300 transition-all shadow-sm"
                    title="Bloquear fondos manualmente"
                    onClick={() => {
                      setSelectedCaja(caja);
                      setActionType('block');
                      setIsActionModalOpen(true);
                    }}
                   >
                     <Lock className="w-3.5 h-3.5" />
                   </Button>
                   <span className="text-orange-600 ml-1 font-black">
                     {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 }).format(caja.saldoComprometido || 0)}
                   </span>
                </div>
              </div>
              <Progress 
                value={caja.saldoReal > 0 ? ((caja.saldoComprometido || 0) / caja.saldoReal) * 100 : 0} 
                className="h-2 bg-slate-100" 
                indicatorClassName="bg-orange-500"
              />
              <p className="text-[8px] font-bold text-slate-400 text-right">
                {Math.round(caja.saldoReal > 0 ? ((caja.saldoComprometido || 0) / caja.saldoReal) * 100 : 0)}% del capital bloqueado
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-green-500" /> Disponible
                  </p>
                  <p className="text-sm font-black text-slate-800">
                    {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 }).format(caja.saldoDisponible || 0)}
                  </p>
               </div>
               <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1">
                    <History className="w-3 h-3 text-blue-500" /> Operaciones
                  </p>
                  <p className="text-sm font-black text-slate-800">{(caja._count?.transacciones || 0)} reg.</p>
               </div>
            </div>

            <div className="pt-2 border-t border-dashed border-slate-200">
               <p className="text-[8px] font-black text-slate-400 uppercase text-center">
                 Motor de Seguridad Financiera Activo
               </p>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* MANUAL ACTION MODAL */}
      <ModernDialog
        isOpen={isActionModalOpen}
        onOpenChange={setIsActionModalOpen}
        title={actionType === 'block' ? "Bloquear Fondos Manualmente" : "Liberar Fondos Comprometidos"}
        type={actionType === 'block' ? 'warning' : 'success'}
      >
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Monto a {actionType === 'block' ? 'Bloquear' : 'Liberar'}</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-slate-400">S/</span>
              <Input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00" 
                className="pl-9 h-12 border-slate-200 font-black text-lg"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Concepto / Motivo</label>
            <Input 
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="Ej: Reserva para impuestos, Liberación de OC anulada..." 
              className="h-12 border-slate-200 text-xs font-bold"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              variant="ghost" 
              onClick={() => setIsActionModalOpen(false)}
              className="font-black uppercase text-[10px]"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleManualAction}
              disabled={submitting}
              className={cn(
                "font-black uppercase text-[10px] px-8 h-10 shadow-lg",
                actionType === 'block' ? "bg-orange-500 hover:bg-orange-600 shadow-orange-200" : "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200"
              )}
            >
              {submitting && <Loader2 className="w-3 h-3 mr-2 animate-spin" />}
              Confirmar {actionType === 'block' ? 'Bloqueo' : 'Liberación'}
            </Button>
          </div>
        </div>
      </ModernDialog>
    </div>
  );
}
