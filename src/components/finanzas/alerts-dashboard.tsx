"use client";

import { useEffect, useState } from "react";
import { AlertCircle, FileWarning, Wallet, TrendingDown, Loader2, CheckCircle2, Settings } from "lucide-react";
import { api } from "@/lib/api";
import { Gasto, Factura } from "@/types/finanzas";
import { formatCurrency, cn } from "@/lib/utils";

type Alert = {
  id: string;
  type: "CRITICAL" | "WARNING" | "INFO";
  title: string;
  description: string;
  icon: any;
  value?: string;
  actionText: string;
  actionLink: string;
};

export function AlertsDashboard() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [minLiquidez, setMinLiquidez] = useState(30000);

  useEffect(() => {
    const stored = localStorage.getItem('minLiquidez');
    if (stored) setMinLiquidez(Number(stored));
  }, []);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        // Fetch data
        const [facturasRaw, gastosRaw, cajasRaw, proyectosRaw] = await Promise.all([
          api.get<any>("/finanzas/facturas").catch(() => []),
          api.get<any>("/finanzas/gastos?limit=1000").catch(() => []),
          api.get<any>("/finanzas/cajas").catch(() => []),
          api.get<any>("/operaciones/proyectos").catch(() => []),
        ]);

        const facturas: any[] = Array.isArray(facturasRaw) ? facturasRaw : (facturasRaw?.data || []);
        const gastos: any[] = Array.isArray(gastosRaw) ? gastosRaw : (gastosRaw?.data || []);
        const cajas: any[] = Array.isArray(cajasRaw) ? cajasRaw : (cajasRaw?.data || []);
        const proyectos: any[] = Array.isArray(proyectosRaw) ? proyectosRaw : (proyectosRaw?.data || []);

        const newAlerts: Alert[] = [];
        const today = new Date().getTime();

        // 1. Facturas Vencidas (> 30 days)
        let facturasCriticasCount = 0;
        let facturasCriticasMonto = 0;

        facturas.forEach((f) => {
          if (f.estado !== "PAGADA" && f.fechaVencimiento) {
            const vencimiento = new Date(f.fechaVencimiento).getTime();
            const diffDays = Math.floor((today - vencimiento) / (1000 * 60 * 60 * 24));
            
            if (diffDays > 30) {
              facturasCriticasCount++;
              facturasCriticasMonto += Number(f.saldoPendiente !== undefined ? f.saldoPendiente : f.montoTotal);
            }
          }
        });

        if (facturasCriticasCount > 0) {
          newAlerts.push({
            id: `fac-criticas`,
            type: "CRITICAL",
            title: `${facturasCriticasCount} Facturas muy vencidas (>30 días)`,
            description: `Cuentas por cobrar con un alto nivel de atraso que requieren atención.`,
            value: formatCurrency(facturasCriticasMonto),
            icon: FileWarning,
            actionText: "Ver Facturas",
            actionLink: "/finanzas/ingresos",
          });
        }

        // 2. Gastos por vencer (next 3 days) or already vencidos
        let gastosVencidosCount = 0;
        let gastosVencidosMonto = 0;
        let gastosProximosCount = 0;
        let gastosProximosMonto = 0;

        gastos.forEach((g) => {
          if (g.estado !== "PAGADO" && g.estado !== "ANULADO" && g.fechaEmision) { 
            const due = new Date(g.fechaEmision).getTime(); // Idealmente fechaVencimiento
            const diffDays = Math.floor((due - today) / (1000 * 60 * 60 * 24));
            
            if (diffDays < 0) {
              gastosVencidosCount++;
              gastosVencidosMonto += Number(g.saldoPendiente !== undefined ? g.saldoPendiente : g.montoTotal);
            } else if (diffDays <= 3) {
              gastosProximosCount++;
              gastosProximosMonto += Number(g.saldoPendiente !== undefined ? g.saldoPendiente : g.montoTotal);
            }
          }
        });

        if (gastosVencidosCount > 0) {
          newAlerts.push({
            id: `gas-vencidos`,
            type: "CRITICAL",
            title: `${gastosVencidosCount} Obligaciones vencidas`,
            description: `Tienes pagos a proveedores o servicios que ya superaron su fecha límite.`,
            value: formatCurrency(gastosVencidosMonto),
            icon: TrendingDown,
            actionText: "Ver Egresos",
            actionLink: "/finanzas/egresos",
          });
        }

        if (gastosProximosCount > 0) {
          newAlerts.push({
            id: `gas-proximos`,
            type: "WARNING",
            title: `${gastosProximosCount} Obligaciones por vencer`,
            description: `Pagos próximos a vencer en los siguientes 3 días.`,
            value: formatCurrency(gastosProximosMonto),
            icon: TrendingDown,
            actionText: "Ver Egresos",
            actionLink: "/finanzas/egresos",
          });
        }

        // 3. Liquidez General Crítica (Fondo Mínimo variable)
        const liquidezTotal = cajas.reduce((acc, c) => acc + Number(c.saldoActual || 0), 0);
        if (liquidezTotal < minLiquidez && cajas.length > 0) {
          newAlerts.push({
            id: `caja-liquidez-critica`,
            type: "CRITICAL",
            title: "Liquidez General Crítica",
            description: `El efectivo total disponible está por debajo del fondo mínimo de seguridad (S/ ${minLiquidez.toLocaleString('es-PE')}).`,
            value: formatCurrency(liquidezTotal),
            icon: Wallet,
            actionText: "Ver Cajas",
            actionLink: "/finanzas/cajas",
          });
        }

        // 4. Proyectos sobre el presupuesto 60%
        proyectos.forEach((p) => {
          if (p.rentabilidad) {
            const venta = Number(p.rentabilidad.ventaReal || 0);
            const costo = Number(p.rentabilidad.costoRealAcumulado || 0);
            if (venta > 0) {
              const porcentaje = (costo / venta) * 100;
              if (porcentaje >= 60 && p.estado !== "FINALIZADO") {
                newAlerts.push({
                  id: `proy-${p.id}`,
                  type: "WARNING",
                  title: `Presupuesto al límite: ${p.codigo}`,
                  description: `El proyecto ha consumido el ${porcentaje.toFixed(1)}% de la venta (Límite 60%).`,
                  value: formatCurrency(costo),
                  icon: AlertCircle,
                  actionText: "Ver Control de Costos",
                  actionLink: "/finanzas/costos-proyecto",
                });
              }
            }
          }
        });

        // Sort: CRITICAL first, then WARNING
        newAlerts.sort((a, b) => {
          if (a.type === "CRITICAL" && b.type !== "CRITICAL") return -1;
          if (b.type === "CRITICAL" && a.type !== "CRITICAL") return 1;
          return 0;
        });

        // Limit to top 6 alerts so it doesn't flood the UI
        setAlerts(newAlerts.slice(0, 6));
      } catch (error) {
        console.error("Error fetching alerts", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, [minLiquidez]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-border shadow-sm p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="w-5 h-5 text-slate-400" />
          <h2 className="text-lg font-black text-primary">Alertas Gerenciales</h2>
        </div>
        <div className="flex justify-center items-center h-20">
          <Loader2 className="w-6 h-6 text-slate-300 animate-spin" />
        </div>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-border shadow-sm p-6 mb-6">
        <div className="flex items-center mb-4">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-500/10 p-2 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <h2 className="text-lg font-black text-primary">Estado General: Saludable</h2>
          </div>
        </div>
        <p className="text-sm text-slate-500">No hay alertas críticas en este momento. La liquidez y cobranzas están bajo control.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm p-6 mb-6">
      <div className="flex items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-error/10 p-2 rounded-xl">
            <AlertCircle className="w-5 h-5 text-error" />
          </div>
          <div>
            <h2 className="text-lg font-black text-primary tracking-tight">Panel de Alertas Gerenciales</h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5">Atención requerida para mantener la salud financiera.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {alerts.map((alert) => (
          <div 
            key={alert.id}
            className={cn(
              "p-4 rounded-xl border flex flex-col justify-between gap-3",
              alert.type === "CRITICAL" ? "bg-red-50/50 border-red-100" : "bg-amber-50/50 border-amber-100"
            )}
          >
            <div className="flex items-start gap-3">
              <div className={cn(
                "p-2 rounded-lg mt-0.5",
                alert.type === "CRITICAL" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"
              )}>
                <alert.icon className="w-4 h-4" />
              </div>
              <div>
                <h3 className={cn(
                  "font-bold text-sm",
                  alert.type === "CRITICAL" ? "text-red-950" : "text-amber-950"
                )}>
                  {alert.title}
                </h3>
                <p className={cn(
                  "text-[11px] mt-1 leading-relaxed",
                  alert.type === "CRITICAL" ? "text-red-700/80" : "text-amber-700/80"
                )}>
                  {alert.description}
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-2 pt-3 border-t border-black/5">
              {alert.value ? (
                <span className={cn(
                  "font-black text-sm",
                  alert.type === "CRITICAL" ? "text-red-700" : "text-amber-700"
                )}>
                  {alert.value}
                </span>
              ) : <div />}
              
              <a 
                href={alert.actionLink}
                className={cn(
                  "text-[10px] font-bold uppercase tracking-widest hover:underline",
                  alert.type === "CRITICAL" ? "text-red-600" : "text-amber-600"
                )}
              >
                {alert.actionText} &rarr;
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
