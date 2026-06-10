"use client";

import { ClientTable } from "@/components/crm/client-table";
import { CRMHeader } from "@/components/crm/crm-header";
import { useCRMStore, isFollowUpOverdue } from "@/store/crm-store";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Calendar, 
  AlertCircle, 
  Clock, 
  CheckCircle2,
  Bell
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useEffect } from "react";

export default function SeguimientoPage() {
  const { clients, fetchClients } = useCRMStore();

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const today = new Date();
  const dayName = today.toLocaleDateString('es-ES', { weekday: 'long' });
  const isReviewDay = dayName.toLowerCase().includes('martes') || dayName.toLowerCase().includes('jueves');
  const currentReviewDay = dayName.charAt(0).toUpperCase() + dayName.slice(1).split(',')[0];

  const todayStr = new Date().toISOString().split('T')[0];

  const totalPendientes = clients.filter(c => !c.proximoSeguimiento && c.etapaComercial !== "Ganado" && c.etapaComercial !== "Perdido").length;
  const totalVencidos = clients.filter(c => isFollowUpOverdue(c)).length;
  const totalHoy = clients.filter(c => {
    if (!c.proximoSeguimiento) return false;
    const followUpDate = c.proximoSeguimiento.split('T')[0];
    return followUpDate === todayStr && c.etapaComercial !== "Ganado" && c.etapaComercial !== "Perdido";
  }).length;
  
  const clientsToReview = clients.filter(c => 
    c.diaTrabajo === (dayName.toLowerCase().includes('martes') ? 'Martes' : 'Jueves')
  );

  return (
    <div className="space-y-6">
      <CRMHeader 
        title="Seguimiento y Agenda" 
        subtitle="Control de actividades, recordatorios y alertas de clientes desatendidos." 
      />

      {isReviewDay && (
        <div className="bg-primary p-4 rounded-xl border-2 border-accent/10 shadow-lg animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-sm border border-white/20">
                <Calendar className="w-5 h-5 text-accent animate-pulse" />
              </div>
              <div>
                <h2 className="text-sm font-black text-white uppercase tracking-tighter">Comité de Revisión Comercial</h2>
                <p className="text-[10px] text-accent/80 font-bold uppercase tracking-wide">Hoy es {currentReviewDay} — Foco en Prospección y Seguimiento</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-accent text-primary font-black px-3 py-1 rounded-md text-[9px] uppercase shadow-sm">
                {clientsToReview.length} Clientes para Revisar
              </Badge>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-red-50 border-red-100">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="bg-red-100 p-2.5 rounded-lg text-red-600">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black text-red-400 uppercase tracking-wider">Seguimientos Vencidos</p>
              <p className="text-2xl font-black text-red-700">{totalVencidos}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-100">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="bg-orange-100 p-2.5 rounded-lg text-orange-600">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black text-orange-400 uppercase tracking-wider">Sin Fecha Programada</p>
              <p className="text-2xl font-black text-orange-700">{totalPendientes}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-100">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="bg-blue-100 p-2.5 rounded-lg text-blue-600">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-wider">Gestiones para Hoy</p>
              <p className="text-2xl font-black text-blue-700">{totalHoy}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white p-4 rounded-xl border border-border shadow-sm flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-success shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
          <span className="text-[10px] font-bold text-slate-500 uppercase">Seguimiento al día</span>
        </div>
        <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
          <div className="w-3 h-3 rounded-full bg-warning shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
          <span className="text-[10px] font-bold text-slate-500 uppercase">7-15 días sin contacto</span>
        </div>
        <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
          <div className="w-3 h-3 rounded-full bg-error shadow-[0_0_8px_rgba(227,6,19,0.5)]" />
          <span className="text-[10px] font-bold text-slate-500 uppercase">Crítico (+15 días)</span>
        </div>
      </div>

      <ClientTable mode="seguimiento" />
    </div>
  );
}
