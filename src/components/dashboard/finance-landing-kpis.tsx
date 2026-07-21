"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Wallet, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  Layers, 
  ShieldCheck, 
  ClipboardCheck, 
  TrendingUp, 
  Calendar, 
  Loader2 
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface FinanceLandingKPIsProps {
  startDate: Date | null;
  endDate: Date | null;
}

export function FinanceLandingKPIs({ startDate, endDate }: FinanceLandingKPIsProps) {
  const [kpis, setKpis] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        setLoading(true);
        const queryParams = new URLSearchParams();
        if (startDate) queryParams.append("startDate", startDate.toISOString());
        if (endDate) queryParams.append("endDate", endDate.toISOString());
        const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";

        const res = await api.get(`/finanzas/landing-kpis${queryString}`);
        setKpis(res);
      } catch (err) {
        console.error("Error loading landing KPIs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchKPIs();
  }, [startDate, endDate]);

  if (loading && !kpis) {
    return (
      <Card className="border-slate-200 shadow-sm bg-white rounded-3xl h-[280px] flex items-center justify-center animate-pulse">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cargando métricas consolidadas...</p>
        </div>
      </Card>
    );
  }

  if (!kpis) return null;

  const formatCurrency = (val: number, currency = "PEN") => {
    return new Intl.NumberFormat('es-PE', { 
      style: 'currency', 
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    }).format(val);
  };

  // Cálculo del ratio de cobranza vs pagos
  const totalCartera = kpis.cuentasPorCobrar + kpis.cuentasPorPagar;
  const ratioCobranza = totalCartera > 0 ? (kpis.cuentasPorCobrar / totalCartera) * 100 : 50;

  return (
    <Card className="border border-slate-200/80 shadow-md bg-white rounded-[2rem] overflow-hidden transition-all hover:shadow-lg">
      <CardHeader className="bg-slate-50/60 border-b border-slate-100 p-5 flex flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
            Resumen de Subdashboard de Finanzas
          </CardTitle>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
            Liquidez actual, saldos de cartera y rendimiento del periodo filtrado
          </p>
        </div>
        {loading ? (
          <Loader2 className="w-4 h-4 text-primary animate-spin" />
        ) : (
          <div className="flex gap-2 items-center">
            <Link href="/finanzas/presupuesto" className="flex items-center h-6 px-3 rounded-md font-bold text-[9px] uppercase bg-slate-800 hover:bg-slate-900 text-white shadow-sm transition-colors cursor-pointer">
              Ppto. Operativo
            </Link>
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 font-black text-[8px] uppercase tracking-wider px-2.5 py-0.5">
              Filtrado Activo
            </Badge>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
          
          {/* COLUMNA 1: DISPONIBILIDAD Y FONDOS */}
          <div className="p-6 space-y-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-500" /> Disponibilidad y Fondos
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-emerald-50/20 p-4 rounded-2xl border border-emerald-100/40">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Saldo en Soles</span>
                <p className="text-base font-black text-slate-800 tracking-tight mt-1">
                  {formatCurrency(kpis.disponiblePEN, "PEN")}
                </p>
              </div>
              <div className="bg-blue-50/20 p-4 rounded-2xl border border-blue-100/40">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Saldo en Dólares</span>
                <p className="text-base font-black text-slate-800 tracking-tight mt-1">
                  {formatCurrency(kpis.disponibleUSD, "USD")}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-1">
              <div>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-500" /> Caja Operativa
                </span>
                <p className="text-xs font-black text-slate-700 mt-1">{formatCurrency(kpis.cajaOperativa.PEN, "PEN")}</p>
                <p className="text-[9px] font-bold text-slate-400">USD {formatCurrency(kpis.cajaOperativa.USD, "USD")}</p>
              </div>
              <div>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-500" /> Fondo de Reserva
                </span>
                <p className="text-xs font-black text-slate-700 mt-1">{formatCurrency(kpis.fondoReserva.PEN, "PEN")}</p>
                <p className="text-[9px] font-bold text-slate-400">USD {formatCurrency(kpis.fondoReserva.USD, "USD")}</p>
              </div>
            </div>
          </div>

          {/* COLUMNA 2: CARTERA COMERCIAL */}
          <div className="p-6 space-y-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-500" /> Cartera Comercial (CxC vs CxP)
            </h3>

            <div className="space-y-4">
              <div className="flex justify-between items-center bg-slate-50/60 p-3.5 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <ArrowUpRight className="w-3 h-3 text-emerald-500" /> Por Cobrar (CxC)
                  </span>
                  <p className="text-sm font-black text-slate-800 mt-0.5">{formatCurrency(kpis.cuentasPorCobrar, "PEN")}</p>
                </div>
                <div className="text-right">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1 justify-end">
                    <ArrowDownRight className="w-3 h-3 text-rose-500" /> Por Pagar (CxP)
                  </span>
                  <p className="text-sm font-black text-slate-800 mt-0.5">{formatCurrency(kpis.cuentasPorPagar, "PEN")}</p>
                </div>
              </div>

              {/* Progress Bar Comparativo */}
              <div className="space-y-1">
                <div className="flex justify-between text-[8px] font-black uppercase text-slate-400 tracking-wide">
                  <span>Cobros ({Math.round(ratioCobranza)}%)</span>
                  <span>Pagos ({Math.round(100 - ratioCobranza)}%)</span>
                </div>
                <Progress 
                  value={ratioCobranza} 
                  className="h-2 bg-rose-100" 
                  indicatorClassName="bg-emerald-500" 
                />
              </div>

              <div className="pt-1.5 flex justify-between items-center text-[10px] font-black uppercase">
                <span className="text-slate-400">Balance Neto:</span>
                <span className={cn(
                  "text-xs px-2.5 py-0.5 rounded-lg font-black",
                  (kpis.cuentasPorCobrar - kpis.cuentasPorPagar) >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                )}>
                  {formatCurrency(kpis.cuentasPorCobrar - kpis.cuentasPorPagar, "PEN")}
                </span>
              </div>
            </div>
          </div>

          {/* COLUMNA 3: DESEMPEÑO Y PROYECCIONES */}
          <div className="p-6 space-y-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-blue-500" /> Desempeño y Proyecciones
            </h3>

            <div className="space-y-4">
              {/* Utilidad Facturada (Devengada) */}
              <div className="flex justify-between items-center text-[10px]">
                <div>
                  <span className="font-bold text-slate-500 uppercase block">Utilidad Facturada:</span>
                  <span className="text-[8px] text-slate-400 font-bold lowercase leading-none">
                    ({formatCurrency(kpis.totalFacturadoPeriodo ?? 0)} - {formatCurrency(kpis.totalGastosPeriodo ?? 0)})
                  </span>
                </div>
                <span className={cn(
                  "font-black text-sm",
                  kpis.utilidadAcumuladaMes >= 0 ? "text-indigo-600" : "text-rose-600"
                )}>
                  {formatCurrency(kpis.utilidadAcumuladaMes, "PEN")}
                </span>
              </div>

              {/* Utilidad Real (Caja/Recaudada) */}
              <div className="flex justify-between items-center text-[10px] pt-1">
                <div>
                  <span className="font-bold text-slate-500 uppercase block">Utilidad Recaudada:</span>
                  <span className="text-[8px] text-slate-400 font-bold lowercase leading-none">
                    ({formatCurrency(kpis.totalInflowsPeriodo ?? 0)} - {formatCurrency(kpis.totalOutflowsPeriodo ?? 0)})
                  </span>
                </div>
                <span className={cn(
                  "font-black text-sm",
                  (kpis.utilidadRealMes ?? 0) >= 0 ? "text-emerald-600" : "text-rose-600"
                )}>
                  {formatCurrency(kpis.utilidadRealMes ?? 0, "PEN")}
                </span>
              </div>

              {/* Órdenes */}
              <div className="flex justify-between items-center text-[10px]">
                <span className="font-bold text-slate-500 uppercase">OS por Ejecutar:</span>
                <div className="text-right">
                  <span className="font-black text-sm text-slate-800">{kpis.ordenesServicio.cantidad} Órdenes</span>
                  <p className="text-[8px] font-bold text-slate-400 mt-0.5">
                    Valor: {formatCurrency(kpis.ordenesServicio.montoPEN, "PEN")}
                  </p>
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              {/* Proyección 90d */}
              <div className="bg-blue-50/20 p-3.5 rounded-2xl border border-blue-100/40 flex justify-between items-center">
                <div>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-500" /> Proyección a 90 días
                  </span>
                  <p className="text-[8px] text-slate-400 font-bold mt-0.5 uppercase">Saldo proyectado estimado</p>
                </div>
                <p className="text-sm font-black text-blue-700">{formatCurrency(kpis.flujoProyectado90, "PEN")}</p>
              </div>
            </div>
          </div>
          
        </div>
      </CardContent>
    </Card>
  );
}
