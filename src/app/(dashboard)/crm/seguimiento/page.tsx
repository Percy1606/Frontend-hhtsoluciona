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

export default function SeguimientoPage() {
  const { clients } = useCRMStore();

  const totalPendientes = clients.filter(c => !c.proximoSeguimiento).length;
  const totalVencidos = clients.filter(c => isFollowUpOverdue(c)).length;
  const totalHoy = clients.filter(c => c.proximoSeguimiento === new Date().toISOString().split('T')[0]).length;

  return (
    <div className="space-y-6">
      <CRMHeader 
        title="Seguimiento y Agenda" 
        subtitle="Control de actividades, recordatorios y alertas de clientes desatendidos." 
      />

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
