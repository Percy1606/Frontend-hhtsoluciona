"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface Inyeccion {
  id: string;
  monto: number;
  motivo: string;
  fecha: string;
  usuario: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proyectoId: string;
  codigoProyecto: string;
  ventaContratada: number;
  onSuccess: () => void;
}

export default function PresupuestoDialog({ open, onOpenChange, proyectoId, codigoProyecto, ventaContratada, onSuccess }: Props) {
  const [historial, setHistorial] = useState<Inyeccion[]>([]);
  const [loading, setLoading] = useState(false);
  const [monto, setMonto] = useState("");
  const [motivo, setMotivo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open && proyectoId) {
      fetchHistorial();
    } else {
      setMonto("");
      setMotivo("");
    }
  }, [open, proyectoId]);

  const fetchHistorial = async () => {
    setLoading(true);
    try {
      const data = await api.get(`/finanzas/bandeja-proyectos/${proyectoId}/inyecciones-presupuesto`);
      setHistorial(data);
    } catch (err) {
      toast.error("Error al cargar el historial.");
    } finally {
      setLoading(false);
    }
  };

  const handleInyectar = async () => {
    if (!monto || isNaN(Number(monto)) || Number(monto) <= 0) {
      toast.error("Ingrese un monto válido.");
      return;
    }
    if (!motivo.trim()) {
      toast.error("Ingrese un motivo para la asignación.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post(`/finanzas/bandeja-proyectos/${proyectoId}/inyeccion-presupuesto`, {
        monto: Number(monto),
        motivo: motivo.trim()
      });
      toast.success("Presupuesto inyectado correctamente.");
      setMonto("");
      setMotivo("");
      fetchHistorial();
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error al inyectar presupuesto.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEliminar = async (inyeccionId: string) => {
    if (!confirm("¿Estás seguro de eliminar esta asignación? El monto se restará del presupuesto de Logística.")) return;
    
    try {
      await api.delete(`/finanzas/bandeja-proyectos/${proyectoId}/inyecciones-presupuesto/${inyeccionId}`);
      toast.success("Asignación eliminada correctamente.");
      fetchHistorial();
      onSuccess();
    } catch (err: any) {
      toast.error("Error al eliminar la asignación.");
    }
  };

  const total = historial.reduce((sum, h) => sum + h.monto, 0);
  const topeGasto = ventaContratada * 0.60;
  const margenLibre = Math.max(0, topeGasto - total);
  
  const nuevoMonto = Number(monto) || 0;
  const excedeTope = (total + nuevoMonto) > topeGasto;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Asignaciones de Presupuesto
            <span className="block text-xs font-normal text-slate-500 mt-1">Proyecto {codigoProyecto}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div className="space-y-4">
            
            <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 mb-4">
              <h4 className="text-[10px] uppercase font-black tracking-widest text-blue-800 mb-3">Control Financiero</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Venta Contratada:</span>
                  <span className="font-bold text-slate-800">S/ {ventaContratada.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Tope de Gasto (60%):</span>
                  <span className="font-bold text-blue-700">S/ {topeGasto.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Ya Asignado:</span>
                  <span className="font-bold text-emerald-600">S/ {total.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="h-px bg-blue-100 my-1"></div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-700 font-bold">Margen Libre:</span>
                  <span className={`font-black ${margenLibre > 0 ? 'text-blue-700' : 'text-red-600'}`}>
                    S/ {margenLibre.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h4 className="text-[10px] uppercase font-black tracking-widest text-slate-500 mb-3">Nueva Asignación</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-600">Monto a Inyectar (S/)</label>
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    value={monto} 
                    onChange={e => setMonto(e.target.value)} 
                    className={`mt-1 ${excedeTope ? 'border-red-500 text-red-600 focus-visible:ring-red-500' : ''}`}
                  />
                  {excedeTope && (
                    <p className="text-[10px] text-red-600 mt-1 font-medium">⚠️ Supera el tope máximo del 60%.</p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">Motivo / Descripción</label>
                  <Input 
                    type="text" 
                    placeholder="Ej: Adelanto para materiales de arranque" 
                    value={motivo} 
                    onChange={e => setMotivo(e.target.value)} 
                    className="mt-1"
                  />
                </div>
                <Button 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white disabled:bg-slate-300 disabled:text-slate-500" 
                  onClick={handleInyectar}
                  disabled={isSubmitting || excedeTope || nuevoMonto <= 0}
                >
                  {isSubmitting ? 'Procesando...' : 'Asignar Fondos'}
                </Button>
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-[10px] uppercase font-black tracking-widest text-slate-500">Historial</h4>
              <span className="text-xs font-bold text-emerald-600">Total: S/ {total.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
            </div>
            
            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2">
              {loading ? (
                <div className="text-center text-xs text-slate-400 py-4">Cargando...</div>
              ) : historial.length === 0 ? (
                <div className="text-center text-xs text-slate-400 py-4 border border-dashed rounded-lg">
                  No hay fondos asignados aún.
                </div>
              ) : (
                historial.map(h => (
                  <div key={h.id} className="p-3 bg-white border border-slate-100 rounded-lg shadow-sm flex gap-3 group hover:border-red-200 transition-colors">
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-black text-sm text-slate-800">S/ {h.monto.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
                        <span className="text-[9px] font-bold text-slate-400">{format(new Date(h.fecha), "dd MMM yyyy HH:mm", { locale: es })}</span>
                      </div>
                      <p className="text-xs text-slate-600">{h.motivo}</p>
                      <p className="text-[9px] text-slate-400 mt-1 uppercase">Por: {h.usuario}</p>
                    </div>
                    <button 
                      onClick={() => handleEliminar(h.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md self-center"
                      title="Eliminar asignación"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
