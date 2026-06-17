"use client";

import { ClientTable } from "@/components/crm/client-table";
import { CRMHeader } from "@/components/crm/crm-header";
import { useCRMStore, isFollowUpOverdue } from "@/store/crm-store";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
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
    fetchClients();
  }, [fetchClients]);

  const today = new Date();
  const dayName = today.toLocaleDateString('es-ES', { weekday: 'long' });
  const isReviewDay = dayName.toLowerCase().includes('martes') || dayName.toLowerCase().includes('jueves');
  const currentReviewDay = dayName.charAt(0).toUpperCase() + dayName.slice(1).split(',')[0];

  const todayStr = new Date().toISOString().split('T')[0];

  // Filtrado por contexto
  const salesClients = clients.filter(c => c.etapaComercial !== "Ganado" && c.etapaComercial !== "Perdido");
  const wonClients = clients.filter(c => c.etapaComercial === "Ganado");

  // Métricas según el tab activo
  const currentClients = activeTab === "ventas" ? salesClients : wonClients;

  const totalPendientes = currentClients.filter(c => !c.proximoSeguimiento).length;
  const totalVencidos = currentClients.filter(c => isFollowUpOverdue(c)).length;
  const totalHoy = currentClients.filter(c => {
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className={cn("border-none shadow-sm", activeTab === "ventas" ? "bg-red-50" : "bg-emerald-50")}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className={cn("p-2.5 rounded-xl", activeTab === "ventas" ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600")}>
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <p className={cn("text-[10px] font-black uppercase tracking-wider", activeTab === "ventas" ? "text-red-400" : "text-emerald-500")}>
                  {activeTab === "ventas" ? "Seguimientos Vencidos" : "Fidelización Pendiente"}
                </p>
                <p className={cn("text-2xl font-black leading-none mt-1", activeTab === "ventas" ? "text-red-700" : "text-emerald-700")}>{totalVencidos}</p>
              </div>
            </CardContent>
          </Card>

          <Card className={cn("border-none shadow-sm", activeTab === "ventas" ? "bg-orange-50" : "bg-blue-50")}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className={cn("p-2.5 rounded-xl", activeTab === "ventas" ? "bg-orange-100 text-orange-600" : "bg-blue-100 text-blue-600")}>
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <p className={cn("text-[10px] font-black uppercase tracking-wider", activeTab === "ventas" ? "text-orange-400" : "text-blue-500")}>
                  {activeTab === "ventas" ? "Sin Fecha Programada" : "Sin Recordatorio"}
                </p>
                <p className={cn("text-2xl font-black leading-none mt-1", activeTab === "ventas" ? "text-orange-700" : "text-blue-700")}>{totalPendientes}</p>
              </div>
            </CardContent>
          </Card>

          <Card className={cn("border-none shadow-sm", activeTab === "ventas" ? "bg-blue-50" : "bg-primary/5")}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className={cn("p-2.5 rounded-xl", activeTab === "ventas" ? "bg-blue-100 text-blue-600" : "bg-primary/10 text-primary")}>
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className={cn("text-[10px] font-black uppercase tracking-wider", activeTab === "ventas" ? "text-blue-400" : "text-primary/60")}>Gestiones para Hoy</p>
                <p className={cn("text-2xl font-black leading-none mt-1", activeTab === "ventas" ? "text-blue-700" : "text-primary")}>{totalHoy}</p>
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
