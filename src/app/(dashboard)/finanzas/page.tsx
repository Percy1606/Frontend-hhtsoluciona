"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  DollarSign,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Receipt,
  Loader2,
  TrendingUp,
  TrendingDown,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CashFlowChart } from "@/components/finanzas/cash-flow-chart";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { FinanceStats } from "@/types/finanzas";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MESES = [
  { value: "1", label: "Enero" },
  { value: "2", label: "Febrero" },
  { value: "3", label: "Marzo" },
  { value: "4", label: "Abril" },
  { value: "5", label: "Mayo" },
  { value: "6", label: "Junio" },
  { value: "7", label: "Julio" },
  { value: "8", label: "Agosto" },
  { value: "9", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
];

const ANIOS = ["2024", "2025", "2026", "2027"];

export default function FinanzasReportesPage() {
  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [cashFlow, setCashFlow] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedMes, setSelectedMes] = useState<string>("all");
  const [selectedAnio, setSelectedAnio] = useState<string>("all");
  
  const searchParams = useSearchParams();
  const isPrintMode = searchParams.get('print') === 'true';

  const fetchData = async () => {
    try {
      setLoading(true);
      const mesParam = searchParams.get('mes') || selectedMes;
      const anioParam = searchParams.get('anio') || selectedAnio;
      
      const queryParams = new URLSearchParams();
      if (mesParam !== "all" && mesParam) queryParams.append("mes", mesParam);
      if (anioParam !== "all" && anioParam) queryParams.append("anio", anioParam);
      
      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";

      const [statsRes, cashFlowRes] = await Promise.all([
        api.get<FinanceStats>(`/finanzas/dashboard-stats${queryString}`),
        api.get<any[]>(`/finanzas/cash-flow${queryString}`)
      ]);
      setStats(statsRes);
      setCashFlow(cashFlowRes);
    } catch (e) {
      console.error("Error fetching finance reports", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMes, selectedAnio, searchParams]);

  useEffect(() => {
    if (isPrintMode && !loading && stats) {
      // Small delay to ensure charts are rendered before printing
      setTimeout(() => {
        window.print();
      }, 800);
    }
  }, [isPrintMode, loading, stats]);

  const handleImprimir = () => {
    window.print();
  };

  const handleDescargarPDF = () => {
    // Abrir la ventana de impresión pero en modo de guardado de PDF
    window.print();
  };

  if (loading && !stats) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <BarChart3 className="w-6 h-6 text-secondary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="font-black text-primary uppercase text-xs tracking-[0.2em] animate-pulse">Generando Reportes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-8 rounded-3xl border border-border shadow-sm">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="bg-primary/5 p-3 rounded-2xl">
              <BarChart3 className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-black text-primary tracking-tight">Reportes Financieros</h1>
              <div className="flex items-center gap-4 text-muted-foreground font-bold text-xs mt-2">
                <div className="flex items-center gap-2">
                  <label className="text-[10px] uppercase tracking-widest">Filtro por Mes:</label>
                  <Select value={selectedMes} onValueChange={(v) => setSelectedMes(v || "all")}>
                    <SelectTrigger className="h-8 text-xs font-bold border-slate-200 w-32 bg-white">
                      <SelectValue>
                        {MESES.find(m => m.value === selectedMes)?.label || "Mes"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {MESES.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[10px] uppercase tracking-widest">Año:</label>
                  <Select value={selectedAnio} onValueChange={(v) => setSelectedAnio(v || "all")}>
                    <SelectTrigger className="h-8 text-xs font-bold border-slate-200 w-24 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {ANIOS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => { setSelectedMes("all"); setSelectedAnio("all"); }}
                  className="h-8 px-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  Limpiar Filtro
                </Button>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-3 print:hidden">
          <Button 
            variant="outline" 
            onClick={() => window.open(`/print/finanzas?mes=${selectedMes}&anio=${selectedAnio}`, '_blank')}
            className="h-10 px-4 gap-2 text-xs font-black border-2 border-primary/20 text-primary hover:bg-primary/5 rounded-xl transition-all"
          >
            <Download className="w-4 h-4" /> Descargar PDF
          </Button>
          <Button 
            onClick={() => window.print()}
            className="h-10 px-6 gap-2 text-xs font-black bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-xl transition-all"
          >
            Imprimir Reporte
          </Button>
        </div>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          label="Total Facturado" 
          value={stats?.totalFacturado || 0} 
          icon={<Receipt className="w-6 h-6 text-blue-600" />} 
          color="bg-blue-500"
        />
        <StatsCard 
          label="Cobranza Efectiva" 
          value={stats?.totalCobrado || 0} 
          icon={<Wallet className="w-6 h-6 text-green-600" />} 
          color="bg-green-500"
          percentage={`${stats?.totalFacturado ? Math.round((stats.totalCobrado / stats.totalFacturado) * 100) : 0}%`}
          isUp={true}
          description="Total cobrado vs facturado"
        />
        <StatsCard 
          label="Gastos Operativos" 
          value={stats?.totalGastos || 0} 
          icon={<TrendingDown className="w-6 h-6 text-error" />} 
          color="bg-error"
        />
        <StatsCard 
          label="Utilidad Bruta" 
          value={stats?.utilidadProyectada || 0} 
          icon={<TrendingUp className="w-6 h-6 text-secondary" />} 
          color="bg-secondary"
          description="Ingresos menos gastos"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-border shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-black text-primary uppercase tracking-tighter flex items-center gap-2 text-xl">
                Flujo de Caja Mensual
              </h3>
              <p className="text-muted-foreground text-sm font-medium">Comparativa de ingresos y egresos registrados.</p>
            </div>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500 shadow-lg shadow-green-200" />
                <span className="text-[10px] font-black uppercase text-muted-foreground">Ingresos</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-error shadow-lg shadow-error/20" />
                <span className="text-[10px] font-black uppercase text-muted-foreground">Egresos</span>
              </div>
            </div>
          </div>
          <div className="h-[350px]">
            <CashFlowChart data={cashFlow} />
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-border shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-primary uppercase tracking-tighter flex items-center gap-2 text-xl">
              Cobranzas Críticas
            </h3>
            <Badge className="bg-error/10 text-error border-none font-black text-[10px]">{stats?.facturasCriticas.length || 0}</Badge>
          </div>
          <div className="space-y-4 flex-1 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
            {stats?.facturasCriticas.map((fc: any) => (
              <AlertItem 
                key={fc.id}
                project={fc.proyecto} 
                client={fc.cliente}
                invoice={fc.codigo} 
                amount={fc.saldo} 
                days={fc.diasVencidos} 
              />
            ))}
            {stats?.facturasCriticas.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-100 rounded-3xl">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-tight">Cartera al día<br/><span className="text-[10px]">No hay facturas vencidas</span></p>
              </div>
            )}
          </div>
          <Button 
            variant="outline" 
            className="w-full mt-6 h-12 font-black text-xs uppercase tracking-widest border-2 border-primary/10 text-primary hover:bg-primary/5 rounded-2xl"
          >
            Ver Detalle de Cobranzas
          </Button>
        </div>
      </div>
    </div>
  );
}

function StatsCard({ label, value, icon, color, percentage, isUp, description }: { 
  label: string, 
  value: number, 
  icon: React.ReactNode, 
  color: string,
  percentage?: string,
  isUp?: boolean,
  description?: string
}) {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-border shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 group relative overflow-hidden">
      <div className={cn("absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-[0.03] transition-all group-hover:scale-150", color)} />
      
      <div className="flex justify-between items-start mb-6">
        <div className={cn("p-4 rounded-2xl shadow-lg shadow-black/5", color.replace('bg-', 'bg-opacity-10 text-'))}>
          {icon}
        </div>
        {percentage && (
          <Badge className={cn("border-none font-black text-[10px] px-2 py-0.5 rounded-lg", 
            isUp ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
            {isUp ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
            {percentage}
          </Badge>
        )}
      </div>
      
      <div className="space-y-1">
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em]">{label}</p>
        <div className="flex items-baseline gap-1">
          <p className="text-2xl font-black text-primary tracking-tighter">
            {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 }).format(value)}
          </p>
          <span className="text-[10px] font-bold text-muted-foreground">PEN</span>
        </div>
        {description && <p className="text-[10px] font-medium text-slate-400 mt-2 italic">{description}</p>}
      </div>
    </div>
  );
}

function AlertItem({ project, client, invoice, amount, days }: { project: string, client: string, invoice: string, amount: number, days: number }) {
  return (
    <div className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm group hover:border-error/30 hover:shadow-md transition-all relative overflow-hidden">
      <div className={cn("absolute left-0 top-0 bottom-0 w-1.5", days > 15 ? "bg-error" : "bg-orange-400")} />
      
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <Badge className={cn("border-none font-black text-[8px] uppercase px-2 py-0.5 rounded-md", 
            days > 15 ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600")}>
            {days > 0 ? `Vencido hace ${days} días` : 'Vence hoy'}
          </Badge>
          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{invoice}</span>
        </div>
        <p className="text-sm font-black text-error">
          {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount)}
        </p>
      </div>
      
      <div className="space-y-0.5">
        <p className="text-xs font-black text-primary leading-tight group-hover:text-error transition-colors">{client}</p>
        <p className="text-[10px] font-bold text-muted-foreground truncate uppercase tracking-tighter opacity-60">{project}</p>
      </div>
    </div>
  );
}
