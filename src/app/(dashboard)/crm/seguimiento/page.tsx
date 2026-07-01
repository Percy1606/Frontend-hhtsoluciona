"use client";

import { ClientTable } from "@/components/crm/client-table";
import { CRMHeader } from "@/components/crm/crm-header";
import { useCRMStore, isFollowUpOverdue } from "@/store/crm-store";
import { Card, CardContent } from "@/components/ui/card";
import { cn, getPeruDateString } from "@/lib/utils";
import { 
  Calendar, 
  AlertCircle, 
  Clock, 
  CheckCircle2,
  Bell,
  Target,
  Users
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SeguimientoPage() {
  const { clients, fetchClients } = useCRMStore();
  const [activeTab, setActiveTab] = useState("ventas");

  useEffect(() => {
    fetchClients(1, 1000); // Cargar todos para métricas globales
  }, [fetchClients]);

  const today = new Date();
  const dayName = today.toLocaleDateString('es-ES', { weekday: 'long' });
  const isReviewDay = dayName.toLowerCase().includes('martes') || dayName.toLowerCase().includes('jueves');
  const currentReviewDay = dayName.charAt(0).toUpperCase() + dayName.slice(1).split(',')[0];

  const todayStr = getPeruDateString();

  const isGanado = (etapa?: string) => {
    if (!etapa) return false;
    const e = etapa.toLowerCase().trim();
    return e.includes('ganad') || e.includes('orden');
  };
  const isPerdido = (etapa?: string) => {
    if (!etapa) return false;
    return etapa.toLowerCase().trim().includes('perdid');
  };

  const salesClients = clients.filter(c => !isGanado(c.etapaComercial) && !isPerdido(c.etapaComercial));
  const wonClients = clients.filter(c => isGanado(c.etapaComercial));

  // Métricas Globales (Ventas + Ganados)
  const globalClients = [...salesClients, ...wonClients];

  const totalPendientes = globalClients.filter(c => !c.proximoSeguimiento).length;
  const totalVencidos = globalClients.filter(c => isFollowUpOverdue(c)).length;
  const totalHoy = globalClients.filter(c => {
    if (!c.proximoSeguimiento) return false;
    const followUpDate = c.proximoSeguimiento.split('T')[0];
    return followUpDate === todayStr;
  }).length;
  
  const clientsToReview = salesClients.filter(c => 
    c.diaTrabajo === (dayName.toLowerCase().includes('martes') ? 'Martes' : 'Jueves')
  );

  return (
    <div className="space-y-6">
      <CRMHeader 
        title="Seguimiento y Agenda" 
        subtitle="Control de actividades, recordatorios y alertas de clientes desatendidos." 
      />

      <Tabs defaultValue="ventas" onValueChange={setActiveTab} className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <TabsList className="bg-slate-100 p-1 rounded-xl h-12 border border-slate-200">
            <TabsTrigger 
              value="ventas" 
              className="rounded-lg px-6 font-black text-[10px] uppercase data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm gap-2"
            >
              <Target className="w-4 h-4" /> Embudo de Ventas
            </TabsTrigger>
            <TabsTrigger 
              value="fidelizacion" 
              className="rounded-lg px-6 font-black text-[10px] uppercase data-[state=active]:bg-white data-[state=active]:text-success data-[state=active]:shadow-sm gap-2"
            >
              <Users className="w-4 h-4" /> Cartera Ganada
            </TabsTrigger>
          </TabsList>

          {activeTab === "ventas" && isReviewDay && (
            <div className="bg-primary px-4 py-2 rounded-xl border border-primary/20 shadow-lg animate-in fade-in slide-in-from-right-2">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-accent animate-pulse" />
                <div>
                  <h2 className="text-[10px] font-black text-white uppercase tracking-tighter leading-none">Comité Comercial</h2>
                  <p className="text-[8px] text-accent/80 font-bold uppercase tracking-wide mt-0.5">{currentReviewDay}: {clientsToReview.length} Clientes</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Card className="border-none shadow-sm rounded-2xl w-full sm:w-auto min-w-[220px] bg-red-50">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="p-2 rounded-xl shrink-0 bg-red-100 text-red-600">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-wider text-red-400">
                  Seguimientos Vencidos
                </p>
                <p className="text-xl font-black leading-none mt-1 text-red-700">{totalVencidos}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-2xl w-full sm:w-auto min-w-[220px] bg-orange-50">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="p-2 rounded-xl shrink-0 bg-orange-100 text-orange-600">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-wider text-orange-400">
                  Sin Fecha Programada
                </p>
                <p className="text-xl font-black leading-none mt-1 text-orange-700">{totalPendientes}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-2xl w-full sm:w-auto min-w-[220px] bg-blue-50">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="p-2 rounded-xl shrink-0 bg-blue-100 text-blue-600">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-wider text-blue-400">Gestiones para Hoy</p>
                <p className="text-xl font-black leading-none mt-1 text-blue-700">{totalHoy}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-2xl w-full sm:w-auto min-w-[220px] bg-emerald-50">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="p-2 rounded-xl shrink-0 bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-wider text-emerald-400">Cartera Ganada</p>
                <p className="text-xl font-black leading-none mt-1 text-emerald-700">{wonClients.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <TabsContent value="ventas" className="mt-0 space-y-6">
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
          <ClientTable mode="seguimiento" data={salesClients} />
        </TabsContent>

        <TabsContent value="fidelizacion" className="mt-0 space-y-6">
          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 shadow-sm flex items-center gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-[10px] font-black text-emerald-700 uppercase">Fidelización de Clientes Reales</span>
            </div>
            <p className="text-[10px] text-emerald-600 font-bold ml-auto uppercase tracking-tighter">Mantén el contacto mensual para asegurar la recompra.</p>
          </div>
          <ClientTable mode="seguimiento" data={wonClients} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
