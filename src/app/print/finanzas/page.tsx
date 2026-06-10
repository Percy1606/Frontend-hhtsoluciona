"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { FinanceStats } from "@/types/finanzas";
import { Loader2, CheckCircle2, Printer } from "lucide-react";
import { CashFlowChart } from "@/components/finanzas/cash-flow-chart";
import { Button } from "@/components/ui/button";

const MESES = [
  { value: "1", label: "Enero" }, { value: "2", label: "Febrero" },
  { value: "3", label: "Marzo" }, { value: "4", label: "Abril" },
  { value: "5", label: "Mayo" }, { value: "6", label: "Junio" },
  { value: "7", label: "Julio" }, { value: "8", label: "Agosto" },
  { value: "9", label: "Septiembre" }, { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" }, { value: "12", label: "Diciembre" },
];

function PrintReportContent() {
  const searchParams = useSearchParams();
  const mes = searchParams.get('mes');
  const anio = searchParams.get('anio');
  
  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [cashFlow, setCashFlow] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, cashFlowRes] = await Promise.all([
          api.get(`/finanzas/dashboard-stats?mes=${mes}&anio=${anio}`),
          api.get(`/finanzas/cash-flow?mes=${mes}&anio=${anio}`)
        ]);
        setStats(statsRes);
        setCashFlow(cashFlowRes);
        
        // Lanzar diálogo de impresión nativo (que soporta guardar como PDF y oklch)
        setTimeout(() => {
          window.print();
        }, 1500); 
      } catch (e) {
        console.error("Error al cargar reporte", e);
      } finally {
        setLoading(false);
      }
    };

    if (mes && anio) fetchData();
  }, [mes, anio]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="font-black tracking-widest text-primary uppercase text-sm">Preparando Datos...</p>
      </div>
    );
  }

  const mesName = MESES.find(m => m.value === mes)?.label || mes;

  return (
    <div className="bg-slate-50 min-h-screen p-8 flex justify-center">
      <style dangerouslySetInnerHTML={{__html: `
        /* Overriding oklch colors locally for html2canvas compatibility */
        :root {
          --background: #F8F9FA;
          --foreground: #212529;
          --card: #FFFFFF;
          --card-foreground: #212529;
          --popover: #FFFFFF;
          --popover-foreground: #212529;
          --primary: #001F3F;
          --primary-foreground: #FFFFFF;
          --secondary: #003087;
          --secondary-foreground: #FFFFFF;
          --muted: #F1F3F5;
          --muted-foreground: #6c757d;
          --accent: #E30613;
          --accent-foreground: #FFFFFF;
          --destructive: #E30613;
          --destructive-foreground: #FFFFFF;
          --border: #dee2e6;
          --input: #dee2e6;
          --ring: #001F3F;
        }
      `}} />
      <div ref={containerRef} className="bg-white p-8 w-[1000px] shadow-sm" style={{ '--background': '#ffffff', backgroundColor: '#ffffff' } as React.CSSProperties}>
      {/* Cabecera del Reporte */}
      <div className="border-b-4 border-primary pb-6 mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-primary uppercase tracking-tighter">Reporte Financiero</h1>
          <p className="text-slate-500 font-bold tracking-widest mt-2 uppercase text-sm">
            Periodo: {mesName} {anio}
          </p>
        </div>
        <div className="text-right">
          <p className="font-black text-lg text-primary">HH T SOLUCIONA S.A.C.</p>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Documento Confidencial</p>
        </div>
      </div>

      {/* Tarjetas Principales */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="border-2 border-slate-100 rounded-xl p-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Facturado</p>
          <p className="text-2xl font-black text-blue-600">
            {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 }).format(stats?.totalFacturado || 0)}
          </p>
        </div>
        <div className="border-2 border-slate-100 rounded-xl p-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Cobranza Efectiva</p>
          <p className="text-2xl font-black text-green-600">
            {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 }).format(stats?.totalCobrado || 0)}
          </p>
        </div>
        <div className="border-2 border-slate-100 rounded-xl p-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Gastos Operativos</p>
          <p className="text-2xl font-black text-red-600">
            {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 }).format(stats?.totalGastos || 0)}
          </p>
        </div>
        <div className="border-2 border-slate-100 bg-slate-50 rounded-xl p-4">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Utilidad Bruta</p>
          <p className="text-2xl font-black text-primary">
            {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 }).format(stats?.utilidadProyectada || 0)}
          </p>
        </div>
      </div>

      {/* Gráfico y Alertas */}
      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2 border-2 border-slate-100 rounded-2xl p-6">
          <h3 className="font-black text-primary uppercase tracking-widest text-sm mb-6 border-b pb-4">
            Flujo de Caja Histórico (Últimos 6 Meses)
          </h3>
          <div className="h-[300px]">
             <CashFlowChart data={cashFlow} isPrint={true} />
          </div>
        </div>

        <div className="col-span-1 border-2 border-slate-100 rounded-2xl p-6">
          <h3 className="font-black text-red-600 uppercase tracking-widest text-sm mb-6 border-b pb-4">
            Alertas de Cobranza Crítica
          </h3>
          <div className="space-y-4">
            {stats?.facturasCriticas.map(fc => (
              <div key={fc.id} className="border-b border-slate-50 pb-3 mb-3 last:border-0 last:pb-0 last:mb-0">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{fc.codigo}</span>
                  <span className="text-xs font-black text-red-600">
                    {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(fc.saldo)}
                  </span>
                </div>
                <p className="text-[11px] font-bold text-slate-700 uppercase">{fc.cliente}</p>
                <p className="text-[9px] text-red-500 font-bold uppercase mt-1">
                  Vencido hace {fc.diasVencidos} días
                </p>
              </div>
            ))}
            {stats?.facturasCriticas.length === 0 && (
              <div className="flex flex-col items-center justify-center text-center p-4">
                <CheckCircle2 className="w-8 h-8 text-green-500 mb-2" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cartera Saludable<br/>Sin deudas críticas</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-12 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest border-t pt-4">
        Documento generado por HH Soluciona el {new Date().toLocaleDateString('es-PE')} a las {new Date().toLocaleTimeString('es-PE')}
      </div>
      </div>
    </div>
  );
}

export default function IsolatedPrintPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="font-black tracking-widest text-primary uppercase text-sm">Preparando Documento...</p>
      </div>
    }>
      <PrintReportContent />
    </Suspense>
  );
}
