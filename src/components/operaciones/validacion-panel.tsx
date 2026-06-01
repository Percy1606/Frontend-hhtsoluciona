"use client";

import { useOperacionesStore } from "@/store/operaciones-store";
import { 
  FileCheck, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  ExternalLink,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatDate } from "@/lib/utils";

export function ValidacionPanel() {
  const { getValidaciones, aprobarValidacion, rechazarValidacion } = useOperacionesStore();
  const validaciones = getValidaciones();

  const pendingValidations = validaciones.filter(v => v.validacion.estado === "Pendiente");

  if (pendingValidations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-emerald-50/20 rounded-2xl border border-dashed border-emerald-200">
        <CheckCircle2 className="w-12 h-12 mb-4 text-emerald-200" />
        <p className="font-black text-emerald-800 uppercase tracking-tight">Todo al día</p>
        <p className="text-sm">No hay validaciones pendientes de revisión</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-emerald-500" />
            Centro de Validaciones
          </h3>
          <p className="text-xs text-slate-500 font-medium">Revisa y aprueba las actividades finalizadas</p>
        </div>
        <Badge className="bg-emerald-500 shadow-none font-black">{pendingValidations.length} PENDIENTES</Badge>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {pendingValidations.map((item, idx) => (
          <div 
            key={`${item.actividad.id}-${item.validacion.id}-${idx}`}
            className="group bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all hover:border-emerald-200"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] font-black uppercase border-slate-200 text-slate-500">
                    {item.proyecto.codigo}
                  </Badge>
                  <span className="text-xs font-bold text-slate-400">/</span>
                  <span className="text-xs font-black text-primary uppercase">{item.validacion.tipo}</span>
                </div>
                
                <h4 className="font-black text-slate-800 group-hover:text-emerald-700 transition-colors">
                  {item.actividad.descripcion}
                </h4>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase">
                    <Clock className="w-3 h-3" />
                    Venció: {formatDate(item.actividad.fechaVencimiento)}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded">
                    <FileCheck className="w-3 h-3" />
                    Área: {item.validacion.area}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  className="gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-black uppercase text-[10px] h-9"
                  onClick={() => rechazarValidacion(item.proyecto.id, item.actividad.id, item.validacion.id, "Rechazado por revisión técnica")}
                >
                  <XCircle className="w-4 h-4" /> Rechazar
                </Button>
                <Button 
                  className="gap-2 bg-emerald-500 hover:bg-emerald-600 font-black uppercase text-[10px] h-9"
                  onClick={() => aprobarValidacion(item.proyecto.id, item.actividad.id, item.validacion.id, "Aprobación conforme")}
                >
                  <CheckCircle2 className="w-4 h-4" /> Aprobar Actividad
                </Button>
              </div>
            </div>

            {item.actividad.observaciones && (
              <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 flex gap-3">
                <MessageSquare className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-600 italic">"{item.actividad.observaciones}"</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
