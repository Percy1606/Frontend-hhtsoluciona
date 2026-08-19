import { 
  Users, 
  Target, 
  FileText, 
  Activity, 
  DollarSign, 
  TrendingUp, 
  CheckCircle2 
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useCRMStore } from "@/store/crm-store";
import { useOperacionesStore } from "@/store/operaciones-store";
import { useFinanzasStore } from "@/store/finanzas-store";
import { cn } from "@/lib/utils";

export function KPIStats({ 
  clients: customClients, 
  proyectos: customProyectos,
  cotizacionesCount,
  proyectosActivosCount,
  totalFacturado: customTotalFacturado,
  totalCobrado: customTotalCobrado,
  porcentajeCobranza: customPorcentajeCobranza
}: { 
  clients?: any[]; 
  proyectos?: any[];
  cotizacionesCount?: number;
  proyectosActivosCount?: number;
  totalFacturado?: number;
  totalCobrado?: number;
  porcentajeCobranza?: number;
} = {}) {
  const { clients: storeClients, quotes } = useCRMStore();
  const { proyectos: storeProyectos } = useOperacionesStore();
  const { globalKPIs } = useFinanzasStore();

  const clients = customClients ?? storeClients;
  const proyectos = customProyectos ?? storeProyectos;

  // Clientes: SOLO los que tienen 'Ganado / Fidelizado' o 'Orden de Servicio'
  const totalClientes = clients.filter(c => ['Orden de Servicio', 'Servicio Ejecutado', 'Facturaci�n', 'Postventa', 'Ganado / Fidelizado'].includes(c.etapaComercial)).length;

  // Prospectos: Todo lo que NO sea Cliente, ni Orden de Servicio, ni Perdido
  const prospectos = clients.filter(c => !['Ganado / Fidelizado', 'Orden de Servicio', 'Perdido'].includes(c.etapaComercial)).length;
  
  const ordenesServicio = clients.filter(c => ['Orden de Servicio', 'Servicio Ejecutado', 'Facturaci�n', 'Postventa', 'Ganado / Fidelizado'].includes(c.etapaComercial)).length;
  const proyectosActivos = proyectosActivosCount || (globalKPIs as any)?.proyectosActivos || proyectos.filter(p => p.estado?.includes('Ejecuci') || p.estado?.includes('Planificaci')).length || 0;
  
  const totalFacturado = customTotalFacturado ?? ((globalKPIs as any)?.totalFacturado ?? 0);
  const totalCobrado = customTotalCobrado ?? ((globalKPIs as any)?.totalCobrado ?? 0);
  const porcentajeCobranza = customPorcentajeCobranza ?? ((globalKPIs as any)?.porcentajeCobranza ?? 0); 

  const kpiConfig = [
    { label: "Total Clientes", value: totalClientes, icon: Users, color: "bg-blue-500/10 text-blue-600", sub: "Fidelizados" },
    { label: "Prospectos", value: prospectos, icon: Target, color: "bg-orange-500/10 text-orange-600", sub: "En cartera" },
    { label: "Órdenes de Servicio", value: ordenesServicio, icon: FileText, color: "bg-purple-500/10 text-purple-600", sub: "Contratadas" },
    { label: "Proyectos Activos", value: proyectosActivos, icon: Activity, color: "bg-green-500/10 text-green-600", sub: "En ejecución" },
    { label: "Cobrado en Bancos", value: totalCobrado, icon: TrendingUp, color: "bg-emerald-500/10 text-emerald-600", isCurrency: true, sub: "Recaudación real" },
    { label: "Ventas Emitidas", value: totalFacturado, icon: DollarSign, color: "bg-blue-500/10 text-blue-600", isCurrency: true, sub: "Total facturado" },
    { label: "% Cobranza", value: porcentajeCobranza, icon: CheckCircle2, color: "bg-teal-500/10 text-teal-600", isPercent: true, sub: "Efectividad cobro" },
  ];

  const formatFinancialValue = (val: number) => {
    if (val >= 1_000_000_000) {
      return `S/ ${(val / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`;
    }
    if (val >= 1_000_000) {
      return `S/ ${(val / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
    }
    if (val >= 100_000) {
      return `S/ ${(val / 1_000).toFixed(0)}k`;
    }
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 }).format(val);
  };

  const formatValue = (kpi: typeof kpiConfig[0]) => {
    if (kpi.isCurrency) {
      return formatFinancialValue(kpi.value);
    }
    if (kpi.isPercent) {
      return `${Number.isInteger(kpi.value) ? kpi.value : Number(kpi.value).toFixed(1)}%`;
    }
    return kpi.value.toLocaleString();
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-7 gap-3">
      {kpiConfig.map((kpi) => (
        <Card key={kpi.label} className="border-none shadow-sm overflow-hidden bg-white hover:shadow-md transition-all hover:-translate-y-1 rounded-2xl">
          <CardContent className="p-3 flex flex-col items-center text-center gap-1">
            <div className={`p-2 rounded-xl shrink-0 ${kpi.color} mb-1`}>
              <kpi.icon className="w-4 h-4" />
            </div>
            <div className="min-w-0 w-full px-1">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest truncate mb-0.5" title={kpi.label}>{kpi.label}</p>
              <h3 className={cn(
                "font-black text-slate-800 leading-none tracking-tight truncate",
                kpi.isCurrency ? "text-sm" : "text-base"
              )}>
                {formatValue(kpi)}
              </h3>
              {kpi.sub && (
                <p className="text-[7.5px] font-bold text-slate-400 mt-1 uppercase tracking-tighter truncate opacity-80">{kpi.sub}</p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
