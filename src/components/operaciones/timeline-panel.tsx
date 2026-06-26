"use client";

import { useOperacionesStore } from "@/store/operaciones-store";
import { 
  History, 
  User, 
  Calendar, 
  Tag, 
  ArrowRight,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
  Settings,
  MoreVertical,
  ClipboardList,
  Trash2,
  Briefcase,
  Archive
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export function TimelinePanel() {
  const { getTimelineEvents, proyectos } = useOperacionesStore();
  const events = getTimelineEvents();
  
  const proyectosFinalizados = proyectos.filter(p => p.estado === 'Finalizado').length;
  const eventosFinalizados = events.filter(e => {
    const proy = proyectos.find(p => p.nombre === e.proyectoNombre);
    return proy?.estado === 'Finalizado';
  }).length;

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-muted/5 rounded-xl border border-dashed">
        <History className="w-12 h-12 mb-4 opacity-20" />
        <p className="font-medium">No hay eventos registrados en el historial</p>
      </div>
    );
  }

  const getEventConfig = (campo: string) => {
    switch (campo) {
      case 'PROYECTO_CREADO': 
        return { label: 'Proyecto Creado', icon: <PlusCircle className="w-5 h-5 text-green-600" />, color: 'bg-green-50 border-green-200' };
      case 'ACTIVIDAD_CREADA': 
        return { label: 'Nueva Actividad', icon: <ClipboardList className="w-5 h-5 text-blue-600" />, color: 'bg-blue-50 border-blue-200' };
      case 'ESTADO_PROYECTO': 
        return { label: 'Cambio de Estado', icon: <Settings className="w-5 h-5 text-purple-600" />, color: 'bg-purple-50 border-purple-200' };
      case 'ESTADO_ACTIVIDAD': 
        return { label: 'Avance de Actividad', icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />, color: 'bg-emerald-50 border-emerald-200' };
      case 'VALIDACION_APROBADA': 
        return { label: 'Validación Aprobada', icon: <CheckCircle2 className="w-5 h-5 text-green-600" />, color: 'bg-green-50 border-green-200' };
      case 'VALIDACION_RECHAZADA': 
        return { label: 'Validación Rechazada', icon: <AlertCircle className="w-5 h-5 text-red-600" />, color: 'bg-red-50 border-red-200' };
      case 'CHECKLIST_BLOQUEADO': 
        return { label: 'Control Bloqueado', icon: <Tag className="w-5 h-5 text-orange-600" />, color: 'bg-orange-50 border-orange-200' };
      case 'ACTIVIDAD_ELIMINADA':
        return { label: 'Actividad Eliminada', icon: <Trash2 className="w-5 h-5 text-red-600" />, color: 'bg-red-50 border-red-200' };
      default: 
        return { label: campo.replace('_', ' '), icon: <History className="w-5 h-5 text-slate-600" />, color: 'bg-slate-50 border-slate-200' };
    }
  };

  return (
    <div className="space-y-6">
      {/* BANNER: Proyectos finalizados incluidos */}
      {proyectosFinalizados > 0 && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
          <Archive className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <p className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">
              Proyectos finalizados incluidos en el historial
            </p>
            <p className="text-[9px] font-medium text-emerald-600">
              {proyectosFinalizados} proyecto(s) finalizado(s) — {eventosFinalizados} evento(s) registrado(s). Los datos persisten aunque el proyecto haya terminado.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-slate-200 before:via-slate-200 before:to-transparent">
      {events.map((event, idx) => {
        const config = getEventConfig(event.campo);
        
        return (
          <div key={event.id || idx} className="relative flex items-start gap-6 group">
            {/* Dot/Icon */}
            <div className={cn(
              "absolute left-0 mt-1 w-10 h-10 rounded-full bg-white border-2 flex items-center justify-center z-10 shadow-sm transition-all group-hover:scale-110",
              config.color.split(' ')[1] // Usar el color del borde
            )}>
              {config.icon}
            </div>

            {/* Content */}
            <div className={cn(
              "flex-1 ml-10 border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group-hover:translate-x-1",
              config.color
            )}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-white/80 border border-current/10">
                    {config.label}
                  </span>
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                    ID: {event.id.substring(0, 5)}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 flex items-center gap-1.5 font-medium bg-white/50 px-2 py-1 rounded-lg">
                  <Calendar className="w-3.5 h-3.5" />
                  {format(new Date(event.fecha), "dd MMM yyyy HH:mm", { locale: es })}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-slate-400" />
                  <p className="text-sm font-black text-slate-800 uppercase tracking-tight">
                    {event.proyectoCodigo} — {event.proyectoNombre}
                  </p>
                </div>
                
                {event.actividadDescripcion && (
                  <div className="flex items-start gap-2 bg-white/40 p-3 rounded-xl border border-white/60">
                    <ClipboardList className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-slate-600 font-medium leading-relaxed italic">
                      "{event.actividadDescripcion}"
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3 text-xs">
                  {event.valorAnterior && (
                    <div className="flex items-center gap-2 bg-white/60 px-3 py-1.5 rounded-lg border border-white/80">
                      <span className="text-[10px] font-black text-slate-400 uppercase">Anterior:</span>
                      <span className="line-through text-slate-500 font-medium">{event.valorAnterior}</span>
                    </div>
                  )}
                  {event.valorAnterior && <ArrowRight className="w-4 h-4 text-slate-300" />}
                  <div className="flex items-center gap-2 bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/10">
                    <span className="text-[10px] font-black text-primary uppercase">Actual:</span>
                    <span className="font-black text-primary">{event.valorNuevo}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-200/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 shadow-inner">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-700 uppercase">{event.usuario}</p>
                    <p className="text-[9px] text-slate-400 font-black tracking-widest">{event.area}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
    </div>
  );
}

