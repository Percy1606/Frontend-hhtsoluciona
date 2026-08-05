"use client";

import React, { useMemo } from 'react';
import { Client, Interaction } from '@/types/crm';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { 
  Rocket, 
  Phone, 
  MapPin, 
  Wrench, 
  RefreshCcw, 
  FileText, 
  MessageCircle, 
  CheckCircle2, 
  CheckSquare, 
  Receipt, 
  HeartHandshake, 
  Trophy, 
  XCircle,
  History,
  ArrowRight
} from 'lucide-react';

interface ClientTimelineProps {
  client: Client;
}

export function ClientTimeline({ client }: ClientTimelineProps) {
  const events = useMemo(() => {
    const list: Array<{
      id: string;
      date: Date;
      title: string;
      subtitle: string;
      icon: React.ReactNode;
      color: string;
      isStageChange: boolean;
      description?: string;
    }> = [];

    // 1. Creation event (Prospecto)
    if (client.fechaCreacion) {
      list.push({
        id: 'creation',
        date: new Date(client.fechaCreacion),
        title: 'Prospecto Creado',
        subtitle: `Registrado por ${client.creadoPor || client.asignadoA || 'Sistema'}`,
        icon: <Rocket className="w-5 h-5" />,
        color: 'bg-slate-100 text-slate-500 border-slate-200',
        isStageChange: true
      });
    }

    // 2. Interactions & Stage Changes
    const interacciones = client.historialInteracciones || [];
    interacciones.forEach((int, index) => {
      const date = new Date(int.fecha || (int as any).createdAt);
      
      // Determine if it's a stage change by looking at observaciones
      const obs = (int.observaciones || '').toLowerCase();
      const isStageChange = obs.includes('ha pasado a etapa');
      
      let title = int.accion;
      let icon = <History className="w-5 h-5" />;
      let color = 'bg-slate-50 text-slate-500 border-slate-200';
      
      if (isStageChange) {
        // Extract stage name
        if (obs.includes('contacto inicial')) { icon = <Phone className="w-5 h-5" />; color = 'bg-cyan-50 text-cyan-600 border-cyan-200'; }
        else if (obs.includes('visita comercial')) { icon = <MapPin className="w-5 h-5" />; color = 'bg-indigo-50 text-indigo-600 border-indigo-200'; }
        else if (obs.includes('visita técnica')) { icon = <Wrench className="w-5 h-5" />; color = 'bg-blue-50 text-blue-600 border-blue-200'; }
        else if (obs.includes('seguimiento')) { icon = <RefreshCcw className="w-5 h-5" />; color = 'bg-pink-50 text-pink-600 border-pink-200'; }
        else if (obs.includes('cotización')) { icon = <FileText className="w-5 h-5" />; color = 'bg-violet-50 text-violet-600 border-violet-200'; }
        else if (obs.includes('negociación')) { icon = <MessageCircle className="w-5 h-5" />; color = 'bg-orange-50 text-orange-600 border-orange-200'; }
        else if (obs.includes('orden de servicio')) { icon = <CheckSquare className="w-5 h-5" />; color = 'bg-emerald-50 text-emerald-600 border-emerald-200'; }
        else if (obs.includes('servicio ejecutado')) { icon = <CheckCircle2 className="w-5 h-5" />; color = 'bg-teal-50 text-teal-600 border-teal-200'; }
        else if (obs.includes('facturación')) { icon = <Receipt className="w-5 h-5" />; color = 'bg-blue-50 text-blue-600 border-blue-200'; }
        else if (obs.includes('postventa')) { icon = <HeartHandshake className="w-5 h-5" />; color = 'bg-purple-50 text-purple-600 border-purple-200'; }
        else if (obs.includes('fidelizado') || obs.includes('ganado')) { icon = <Trophy className="w-5 h-5" />; color = 'bg-green-50 text-green-600 border-green-200'; }
        else if (obs.includes('perdido')) { icon = <XCircle className="w-5 h-5" />; color = 'bg-red-50 text-red-600 border-red-200'; }
        
        title = "Cambio de Etapa";
      } else {
        if (int.tipo?.toLowerCase().includes('llamada')) { icon = <Phone className="w-4 h-4" />; color = 'bg-white text-slate-600 border-slate-200'; }
        else if (int.tipo?.toLowerCase().includes('visita')) { icon = <MapPin className="w-4 h-4" />; color = 'bg-white text-slate-600 border-slate-200'; }
        else if (int.tipo?.toLowerCase().includes('cotización')) { icon = <FileText className="w-4 h-4" />; color = 'bg-white text-slate-600 border-slate-200'; }
      }

      const cleanObs = (int.observaciones || '').replace(/\[IMG\].*?\[\/IMG\]/, '').trim();

      list.push({
        id: int.id || `int-${index}`,
        date,
        title,
        subtitle: `${int.tipo} • ${int.usuario || 'Sistema'}`,
        description: cleanObs,
        icon,
        color,
        isStageChange
      });
    });

    // Sort by date descending (newest first)
    return list.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [client]);

  return (
    <div className="py-6 px-4">
      <div className="mb-6 bg-primary/5 border border-primary/10 rounded-xl p-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black text-primary uppercase tracking-tight">Timeline Histórico</h3>
          <p className="text-[11px] font-bold text-slate-500 mt-1">Rastreo de vida del cliente desde su prospección hasta hoy.</p>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-black uppercase text-slate-400">Etapa Actual</span>
          <div className="text-sm font-black text-slate-800 uppercase">{client.etapaComercial}</div>
        </div>
      </div>

      <div className="relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent space-y-6">
        {events.map((event, i) => (
          <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            {/* Dot */}
            <div className={cn(
              "flex items-center justify-center w-12 h-12 rounded-full border-4 border-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10 transition-transform duration-300 group-hover:scale-110",
              event.color
            )}>
              {event.icon}
            </div>

            {/* Content Box */}
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-4 rounded-2xl border border-slate-200/60 bg-white shadow-sm group-hover:shadow-md transition-all duration-300">
              <div className="flex flex-col gap-1 mb-2">
                <time className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 w-fit px-2 py-0.5 rounded border border-slate-100">
                  {format(event.date, "dd MMM yyyy • HH:mm", { locale: es })}
                </time>
                <h4 className={cn("text-sm font-black uppercase tracking-tight", event.isStageChange ? "text-slate-800" : "text-slate-600")}>
                  {event.title}
                </h4>
                <p className="text-[10px] font-bold text-slate-500 uppercase">{event.subtitle}</p>
              </div>
              
              {event.description && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-xs font-medium text-slate-600 leading-relaxed italic">
                    "{event.description}"
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
