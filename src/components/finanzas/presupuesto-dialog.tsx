"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";
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
  const [tipo, setTipo] = useState<"MATERIALES" | "MANO_OBRA">("MATERIALES");
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open && proyectoId) {
      fetchHistorial();
    } else {
      cancelarEdicion();
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

  const handleInyectarOrUpdate = async () => {
    if (!monto || isNaN(Number(monto)) || Number(monto) <= 0) {
      toast.error("Ingrese un monto válido.");
      return;
    }
    if (!motivo.trim()) {
      toast.error("Ingrese un motivo para la asignación.");
      return;
    }

    const prefijo = tipo === "MATERIALES" ? "[MATERIALES]" : "[MANO_OBRA]";
    const motivoCompleto = `${prefijo} ${motivo.replace(/^\[(MATERIALES|MANO_OBRA)\]\s*/i, '').trim()}`;

    setIsSubmitting(true);
    try {
      if (editandoId) {
        await api.patch(`/finanzas/bandeja-proyectos/${proyectoId}/inyecciones-presupuesto/${editandoId}`, {
          monto: Number(monto),
          motivo: motivoCompleto
        });
        toast.success("Asignación actualizada correctamente.");
      } else {
        await api.post(`/finanzas/bandeja-proyectos/${proyectoId}/inyeccion-presupuesto`, {
          monto: Number(monto),
          motivo: motivoCompleto
        });
        toast.success("Presupuesto inyectado correctamente.");
      }
      cancelarEdicion();
      fetchHistorial();
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error al procesar presupuesto.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEliminar = async (inyeccionId: string) => {
    if (!confirm("¿Estás seguro de eliminar esta asignación? El monto se restará del presupuesto de Logística.")) return;
    
    try {
      await api.delete(`/finanzas/bandeja-proyectos/${proyectoId}/inyecciones-presupuesto/${inyeccionId}`);
      toast.success("Asignación eliminada correctamente.");
      if (editandoId === inyeccionId) {
        cancelarEdicion();
      }
      fetchHistorial();
      onSuccess();
    } catch (err: any) {
      toast.error("Error al eliminar la asignación.");
    }
  };

  const iniciarEdicion = (h: Inyeccion) => {
    setEditandoId(h.id);
    setMonto(String(h.monto));
    
    const isManoObra = h.motivo.startsWith("[MANO_OBRA]");
    setTipo(isManoObra ? "MANO_OBRA" : "MATERIALES");
    
    // Limpiar el prefijo para mostrar solo el texto limpio en el input
    const limpio = h.motivo.replace(/^\[(MATERIALES|MANO_OBRA)\]\s*/i, '');
    setMotivo(limpio);
  };

  const cancelarEdicion = () => {
    setMonto("");
    setMotivo("");
    setTipo("MATERIALES");
    setEditandoId(null);
  };

  const total = historial.reduce((sum, h) => sum + h.monto, 0);
  const topeGasto = ventaContratada * 0.60;
  const margenLibre = Math.max(0, topeGasto - total);
  
  const nuevoMonto = Number(monto) || 0;
  
  // Si estamos editando, para el cálculo del tope no sumamos el monto anterior del registro
  const montoAnteriorRegistro = editandoId ? (historial.find(h => h.id === editandoId)?.monto || 0) : 0;
  const excedeTope = (total - montoAnteriorRegistro + nuevoMonto) > topeGasto;

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
              <h4 className="text-[10px] uppercase font-black tracking-widest text-slate-500 mb-3">
                {editandoId ? "Editar Asignación" : "Nueva Asignación"}
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Tipo de Presupuesto</label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => setTipo("MATERIALES")}
                      className={cn(
                        "h-8 text-[10px] font-black uppercase rounded-lg border transition-all",
                        tipo === "MATERIALES"
                          ? "bg-orange-50 border-orange-200 text-orange-700 shadow-sm"
                          : "bg-white border-slate-200 text-slate-500 hover:bg-slate-100"
                      )}
                    >
                      Materiales
                    </button>
                    <button
                      type="button"
                      onClick={() => setTipo("MANO_OBRA")}
                      className={cn(
                        "h-8 text-[10px] font-black uppercase rounded-lg border transition-all",
                        tipo === "MANO_OBRA"
                          ? "bg-blue-50 border-blue-200 text-blue-700 shadow-sm"
                          : "bg-white border-slate-200 text-slate-500 hover:bg-slate-100"
                      )}
                    >
                      Mano de Obra
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">Monto (S/)</label>
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
                    placeholder="Ej: Insumos de arranque" 
                    value={motivo} 
                    onChange={e => setMotivo(e.target.value)} 
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-2">
                  {editandoId && (
                    <Button
                      variant="outline"
                      className="flex-1 h-10 text-[10px] font-black uppercase rounded-xl border-slate-200"
                      onClick={cancelarEdicion}
                      type="button"
                    >
                      Cancelar
                    </Button>
                  )}
                  <Button 
                    className={cn(
                      "flex-1 text-white text-[10px] font-black uppercase h-10 rounded-xl shadow-lg transition-all",
                      editandoId 
                        ? "bg-blue-600 hover:bg-blue-700 shadow-blue-500/10" 
                        : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/10"
                    )}
                    onClick={handleInyectarOrUpdate}
                    disabled={isSubmitting || excedeTope || nuevoMonto <= 0}
                  >
                    {isSubmitting ? 'Procesando...' : editandoId ? 'Guardar Cambios' : 'Asignar Fondos'}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-[10px] uppercase font-black tracking-widest text-slate-500">Historial</h4>
              <span className="text-xs font-bold text-emerald-600">Total: S/ {total.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
            </div>
            
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
              {loading ? (
                <div className="text-center text-xs text-slate-400 py-4">Cargando...</div>
              ) : historial.length === 0 ? (
                <div className="text-center text-xs text-slate-400 py-4 border border-dashed rounded-lg">
                  No hay fondos asignados aún.
                </div>
              ) : (
                historial.map(h => {
                  const isManoObra = h.motivo.startsWith("[MANO_OBRA]");
                  const isMateriales = h.motivo.startsWith("[MATERIALES]");
                  const limpio = h.motivo.replace(/^\[(MATERIALES|MANO_OBRA)\]\s*/i, '');
                  const labelTipo = isManoObra ? "Mano de Obra" : isMateriales ? "Adelanto de materiales" : "Asignación General";

                  return (
                    <div key={h.id} className="p-3 bg-white border border-slate-100 rounded-lg shadow-sm flex gap-3 group hover:border-slate-200 transition-colors">
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-black text-sm text-slate-800">S/ {h.monto.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
                          <span className="text-[9px] font-bold text-slate-400">{format(new Date(h.fecha), "dd MMM yyyy HH:mm", { locale: es })}</span>
                        </div>
                        <div className="text-[9px] font-black uppercase mb-1">
                          <span className={cn(
                            "px-1.5 py-0.5 rounded-sm",
                            isManoObra ? "bg-blue-50 text-blue-700 border border-blue-100" :
                            isMateriales ? "bg-orange-50 text-orange-700 border border-orange-100" :
                            "bg-slate-50 text-slate-600 border border-slate-100"
                          )}>
                            {labelTipo}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">{limpio}</p>
                        <p className="text-[9px] text-slate-400 mt-1 uppercase">Por: {h.usuario}</p>
                      </div>
                      <div className="flex flex-col gap-1 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => iniciarEdicion(h)}
                          className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-md"
                          title="Editar asignación"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleEliminar(h.id)}
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                          title="Eliminar asignación"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
