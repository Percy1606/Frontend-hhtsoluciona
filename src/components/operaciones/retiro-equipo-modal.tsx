"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Wrench, Loader2 } from "lucide-react";

import { useOperacionesStore } from "@/store/operaciones-store";

interface Insumo {
  id: string;
  nombre: string;
  stockActual: number;
  categoria: string;
}

export function RetiroEquipoModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [equipos, setEquipos] = useState<Insumo[]>([]);
  
  // Form state
  const [proyectoId, setProyectoId] = useState("");
  const [equipoId, setEquipoId] = useState("");
  const [fechaDevolucion, setFechaDevolucion] = useState("");
  const [responsable, setResponsable] = useState("");
  const [condicion, setCondicion] = useState("");

  const { proyectos } = useOperacionesStore();

  useEffect(() => {
    if (isOpen) {
      fetchEquipos();
    }
  }, [isOpen]);

  const fetchEquipos = async () => {
    try {
      const res = await api.get('/logistica/insumos?limit=1000');
      let rawData: Insumo[] = [];
      
      if (res && res.data && Array.isArray(res.data)) {
        rawData = res.data;
      } else if (Array.isArray(res)) {
        rawData = res;
      } else if (res && res.data && res.data.data && Array.isArray(res.data.data)) {
        rawData = res.data.data;
      }

      const filtered = (rawData || []).filter((i: Insumo) => {
        const cat = i.categoria ? i.categoria.toUpperCase() : "";
        return cat.includes('EQUIPO') || cat.includes('EPP');
      });
      setEquipos(filtered);
    } catch (error) {
      console.error("Error fetching equipos", error);
      toast.error("Error cargando la lista de equipos del almacén");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proyectoId || !equipoId || !fechaDevolucion || !responsable) {
      toast.error("Complete todos los campos obligatorios");
      return;
    }

    setLoading(true);
    try {
      // Create JSON motivo
      const motivoData = {
        tipo: "RETIRO_EQUIPO",
        fechaDevolucionEsperada: fechaDevolucion,
        solicitante: responsable,
        condicionEntrega: condicion
      };

      await api.post('/logistica/despacho', {
        insumoId: equipoId,
        cantidad: 1, // asumiendo 1 equipo a la vez
        proyectoId: proyectoId,
        motivo: JSON.stringify(motivoData)
      });

      toast.success("Retiro de equipo registrado correctamente en almacén");
      setIsOpen(false);
      
      // Reset form
      setProyectoId("");
      setEquipoId("");
      setFechaDevolucion("");
      setResponsable("");
      setCondicion("");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al registrar el retiro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="h-9 gap-2 font-black uppercase text-[10px] border-secondary/20 bg-secondary/5 text-secondary hover:bg-secondary/10"
        >
          <Wrench className="w-4 h-4" /> Solicitud Retiro Equipo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg w-full bg-slate-50 border-slate-200 shadow-2xl p-0 overflow-hidden rounded-2xl">
        <div className="bg-gradient-to-r from-secondary to-secondary/90 p-5 flex flex-col items-center border-b border-white/10">
          <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 mb-2 shadow-inner">
            <Wrench className="w-6 h-6 text-white" />
          </div>
          <DialogTitle className="text-lg font-black text-white uppercase tracking-wider text-center">
            Retiro de Equipo
          </DialogTitle>
          <p className="text-white/80 text-[11px] font-bold mt-0.5 text-center max-w-[320px]">
            Registra la salida de un equipo del almacén asignado a un proyecto.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Proyecto Destino</label>
            <Select value={proyectoId} onValueChange={(val) => setProyectoId(val || "")}>
              <SelectTrigger className="h-11 w-full border-slate-200 rounded-xl font-bold bg-white text-xs">
                <SelectValue placeholder="SELECCIONE EL PROYECTO">
                  {proyectoId ? (() => {
                    const p = proyectos.find(proj => proj.id === proyectoId);
                    if (!p) return "SELECCIONE EL PROYECTO";
                    const osCodigo = (p as any).ordenesDeServicio?.[0]?.codigo || p.codigo;
                    const clienteEmpresa = (p as any).cliente?.empresa || (p as any).cliente?.nombre || "";
                    return `${osCodigo} · ${p.nombre}${clienteEmpresa ? ` (${clienteEmpresa})` : ''}`;
                  })() : "SELECCIONE EL PROYECTO"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-80 bg-white border-slate-200 w-[var(--radix-select-trigger-width)] max-w-full">
                {proyectos.map(p => {
                  const osCodigo = (p as any).ordenesDeServicio?.[0]?.codigo || p.codigo;
                  const clienteEmpresa = (p as any).cliente?.empresa || (p as any).cliente?.nombre || "";
                  return (
                    <SelectItem key={p.id} value={p.id} className="py-2.5 px-3 border-b border-slate-100 last:border-none focus:bg-slate-100 data-highlighted:bg-slate-100 hover:bg-slate-100 cursor-pointer">
                      <div className="flex flex-col gap-1 text-left w-full min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-[11px] text-primary bg-primary/10 px-2 py-0.5 rounded-md shrink-0">
                            {osCodigo}
                          </span>
                        </div>
                        <div className="font-bold text-xs text-slate-800 uppercase leading-snug whitespace-normal break-words">
                          {p.nombre}
                        </div>
                        {clienteEmpresa && (
                          <div className="text-[10px] font-black text-slate-500 uppercase tracking-tight">
                            {clienteEmpresa}
                          </div>
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
                {proyectos.length === 0 && (
                  <div className="p-3 text-center text-xs text-slate-400 font-bold uppercase">No hay proyectos activos registrados.</div>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Equipo (Almacén)</label>
            <Select value={equipoId} onValueChange={(val) => setEquipoId(val || "")}>
              <SelectTrigger className="h-11 w-full border-slate-200 rounded-xl font-bold bg-white text-xs">
                <SelectValue placeholder="SELECCIONE EL EQUIPO">
                  {equipoId ? equipos.find(e => e.id === equipoId)?.nombre : "SELECCIONE EL EQUIPO"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-60 bg-white border-slate-200">
                {equipos.map(e => (
                  <SelectItem key={e.id} value={e.id} className="font-bold text-slate-700 uppercase text-xs py-2">
                    {e.nombre} (Stock: {e.stockActual})
                  </SelectItem>
                ))}
                {equipos.length === 0 && (
                  <div className="p-3 text-center text-xs text-slate-400 font-bold uppercase">No se encontraron equipos disponibles.</div>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Responsable</label>
              <Input
                value={responsable}
                onChange={e => setResponsable(e.target.value)}
                placeholder="Nombre de quien retira"
                className="h-12 rounded-xl border-slate-200 font-bold bg-white text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Fecha Retorno</label>
              <Input
                type="date"
                value={fechaDevolucion}
                onChange={e => setFechaDevolucion(e.target.value)}
                className="h-12 rounded-xl border-slate-200 font-bold bg-white text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Condición / Notas (Opcional)</label>
            <Textarea
              value={condicion}
              onChange={e => setCondicion(e.target.value)}
              placeholder="Ej: Se entrega con baterías cargadas, rayón en la pantalla..."
              className="resize-none rounded-xl border-slate-200 font-bold bg-white text-xs min-h-[80px]"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="h-12 px-6 rounded-xl font-black uppercase text-xs text-slate-500"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="h-12 px-8 rounded-xl font-black uppercase text-xs bg-secondary hover:bg-secondary/90 shadow-lg shadow-secondary/20"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Registrar Salida"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
