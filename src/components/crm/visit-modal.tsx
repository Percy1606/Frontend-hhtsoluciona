"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCRMStore } from "@/store/crm-store";
import { useOperacionesStore } from "@/store/operaciones-store";
import { Calendar, User, ClipboardList, Info } from "lucide-react";
import { ModernDialog, DialogType } from "@/components/ui/modern-dialog";
import { format } from "date-fns";

interface VisitModalProps {
  clientId: string;
  clientName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function VisitModal({ clientId, clientName, isOpen, onClose }: VisitModalProps) {
  const { scheduleTechnicalVisit } = useCRMStore();
  const { responsables, fetchResponsables } = useOperacionesStore();

  const [tecnicoId, setTecnicoId] = useState("");
  const [fecha, setFecha] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeVisit, setActiveVisit] = useState<any | null>(null);
  const [checkingVisit, setCheckingVisit] = useState(false);

  // Modern Dialog State
  const [modernDialog, setModernDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    type: DialogType;
    showCancel?: boolean;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: "",
    description: "",
    type: "info"
  });

  useEffect(() => {
    if (isOpen) {
      // Limpiar estados previos para nueva visita
      setTecnicoId("");
      setFecha("");
      setObservaciones("");
      setActiveVisit(null);
      
      fetchResponsables();
      checkExistingVisit();
    }
  }, [isOpen, fetchResponsables, clientId]);

  const checkExistingVisit = async () => {
    setCheckingVisit(true);
    try {
      const visit = await useOperacionesStore.getState().fetchActiveVisit(clientId);
      setActiveVisit(visit);
    } catch (error) {
      console.error("Error checking visit:", error);
    } finally {
      setCheckingVisit(false);
    }
  };

  const handleProcessVisit = async () => {
    setLoading(true);
    try {
      const tecnico = responsables.find(r => r.id === tecnicoId);
      await scheduleTechnicalVisit(clientId, tecnicoId, fecha, `${observaciones} (Asignado a: ${tecnico?.nombre || 'Técnico'})`);
      
      setModernDialog({
        isOpen: true,
        title: "Visita Agendada",
        description: `Se ha programado la inspección para el cliente ${clientName}. El técnico ${tecnico?.nombre} ha sido notificado y la ficha técnica ya está en su bandeja de operaciones.`,
        type: "success"
      });
    } catch (error: any) {
      console.error("Error scheduling visit:", error);
      setModernDialog({
        isOpen: true,
        title: "Error al Agendar",
        description: error.message || "Hubo un problema al conectar con el servidor de operaciones. Por favor, verifique su conexión e intente nuevamente.",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tecnicoId || !fecha || activeVisit) return;

    const selectedDate = new Date(fecha);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const compareDate = new Date(fecha);
    compareDate.setHours(0, 0, 0, 0);

    // 1. Validar año irreal
    if (selectedDate.getFullYear() < 2024) {
      setModernDialog({
        isOpen: true,
        title: "Fecha Inválida",
        description: `El año ${selectedDate.getFullYear()} no es aceptable para programar visitas técnicas.`,
        type: "error"
      });
      return;
    }

    // 2. Restricción del mismo día
    if (compareDate.getTime() === today.getTime()) {
      setModernDialog({
        isOpen: true,
        title: "Visita Inmediata",
        description: "Está intentando programar una visita para el día de hoy. ¿Está seguro que el técnico tiene disponibilidad inmediata?",
        type: "warning",
        showCancel: true,
        onConfirm: handleProcessVisit
      });
      return;
    }

    // 3. Confirmación de fecha pasada
    if (compareDate < today) {
      setModernDialog({
        isOpen: true,
        title: "Fecha Retroactiva",
        description: `Está programando una visita para una fecha que ya pasó (${format(selectedDate, "dd/MM/yyyy HH:mm")}). ¿Desea registrarla de todas formas para el historial?`,
        type: "confirm",
        showCancel: true,
        onConfirm: handleProcessVisit
      });
      return;
    }

    handleProcessVisit();
  };

  const handleCloseAll = () => {
    if (modernDialog.type === "confirm" || modernDialog.type === "warning") {
        setModernDialog(prev => ({ ...prev, isOpen: false }));
        return;
    }

    setModernDialog(prev => ({ ...prev, isOpen: false }));
    if (modernDialog.type === "success") {
        onClose();
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md w-full p-0 border-none bg-white shadow-2xl rounded-xl overflow-hidden">
          <DialogHeader className="p-6 bg-primary text-white shrink-0">
            <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-2 uppercase">
              <Calendar className="w-6 h-6 text-accent" />
              Agendar Visita Técnica
            </DialogTitle>
            <p className="text-xs text-white/70 font-bold uppercase mt-1">
              Cliente: {clientName}
            </p>
          </DialogHeader>

          {checkingVisit ? (
            <div className="p-12 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-xs font-bold text-slate-500 uppercase">Validando historial de visitas...</p>
            </div>
          ) : activeVisit ? (
            <div className="p-8 space-y-6 text-center">
              <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <Info className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Visita Técnica Activa</h3>
                <p className="text-sm text-slate-600 font-medium leading-relaxed px-4">
                  Este cliente ya cuenta con una visita en estado <span className="text-amber-600 font-bold">{activeVisit.estado}</span> asignada al técnico <span className="font-bold">{activeVisit.tecnico?.nombre || 'Mario'}</span>.
                </p>
                <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl mt-4 text-left">
                    <p className="text-[10px] text-amber-800 font-bold uppercase leading-tight">
                        Regla de negocio:
                    </p>
                    <p className="text-[11px] text-amber-700 font-medium mt-1">
                        Cada cliente podrá tener únicamente una visita técnica abierta. No se permite la creación de visitas duplicadas hasta que la visita vigente haya sido finalizada.
                    </p>
                </div>
              </div>
              <Button onClick={onClose} className="w-full bg-slate-800 hover:bg-slate-900 text-white font-black uppercase text-xs h-12 rounded-xl">
                Entendido
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1 flex items-center gap-1">
                  <User className="w-3 h-3" /> Técnico Asignado
                </Label>
                <Select value={tecnicoId} onValueChange={(val) => setTecnicoId(val as string)} required>
                  <SelectTrigger className="h-11 border-slate-200 bg-slate-50/50 font-bold text-sm rounded-xl focus:bg-white transition-all">
                    <SelectValue placeholder="SELECCIONAR TÉCNICO">
                      {tecnicoId ? responsables.find(r => r.id === tecnicoId)?.nombre : undefined}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 shadow-xl">
                    {responsables.filter(r => r.area === 'Ingeniería y Supervisión Técnica' || r.area === 'Operaciones de Campo y Control de Obra').map(r => (
                      <SelectItem key={r.id} value={r.id} className="font-black text-[10px] uppercase">
                        {r.nombre} ({r.cargo})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Fecha y Hora
                </Label>
                <Input
                  type="datetime-local"
                  required
                  className="h-11 border-slate-200 bg-slate-50/50 font-bold text-sm rounded-xl focus:bg-white transition-all"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1 flex items-center gap-1">
                  <ClipboardList className="w-3 h-3" /> Requerimientos / Notas
                </Label>
                <Textarea
                  placeholder="Indique qué debe revisar el técnico o qué herramientas necesita..."
                  className="min-h-[100px] border-slate-200 bg-slate-50/50 resize-none text-sm rounded-xl focus:bg-white transition-all"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                />
              </div>

              <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl flex gap-3">
                <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-blue-700 leading-tight font-medium uppercase">
                  Esta acción creará automáticamente una ficha en la <span className="font-black">Bandeja Técnica</span> y moverá al cliente a la etapa <span className="font-black">"Visita Agendada"</span>.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="ghost" className="flex-1 font-bold text-slate-500 uppercase text-xs h-11" onClick={onClose} disabled={loading}>
                  Cancelar
                </Button>
                <Button type="submit" className="flex-[2] bg-primary hover:bg-primary/90 text-white font-black uppercase text-xs h-11 shadow-lg shadow-primary/20" disabled={loading}>
                  {loading ? "Procesando..." : "Confirmar Visita"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <ModernDialog 
        isOpen={modernDialog.isOpen}
        onOpenChange={handleCloseAll}
        title={modernDialog.title}
        description={modernDialog.description}
        type={modernDialog.type}
        showCancel={modernDialog.showCancel}
        onConfirm={modernDialog.onConfirm}
        confirmText={modernDialog.type === "confirm" || modernDialog.type === "warning" ? "Sí, Proceder" : "Entendido"}
        cancelText="Volver"
      />
    </>
  );
}
