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

  // Clientes: anything beyond 'Prospecto' stage (excluding Lost/Perdido) or explicitly marked as CLIENTE.
  const totalClientes = clients.filter(c => {
    const stage = c.etapaComercial || c.estado || '';
    return (stage !== 'Prospecto' && stage !== 'Perdido' && stage !== '') || c.tipoCliente === 'CLIENTE';
  }).length;

  // Prospectos: only those in 'Prospecto' stage or empty, and not marked as CLIENTE.
  const prospectos = clients.filter(c => {
    const stage = c.etapaComercial || c.estado || '';
    return (stage === 'Prospecto' || stage === '') && c.tipoCliente !== 'CLIENTE';
  }).length;
  
  const cotizacionesEnviadas = cotizacionesCount ?? (globalKPIs?.cotizacionesTotal ?? quotes.length);
  const proyectosActivos = proyectosActivosCount ?? (globalKPIs?.proyectosActivos ?? proyectos.filter(p => p.estado === 'En Ejecución' || p.estado === 'EnEjecucion').length);
  
  const totalFacturado = customTotalFacturado ?? ((globalKPIs as any)?.totalFacturado ?? 0);
  const totalCobrado = customTotalCobrado ?? ((globalKPIs as any)?.totalCobrado ?? 0);
  const porcentajeCobranza = customPorcentajeCobranza ?? ((globalKPIs as any)?.porcentajeCobranza ?? 0); 

  const kpiConfig = [
    { label: "Total Clientes", value: totalClientes, icon: Users, color: "bg-blue-500/10 text-blue-600" },
    { label: "Prospectos", value: prospectos, icon: Target, color: "bg-orange-500/10 text-orange-600" },
    { label: "Cotizaciones", value: cotizacionesEnviadas, icon: FileText, color: "bg-purple-500/10 text-purple-600" },
    { label: "Proyectos Activos", value: proyectosActivos, icon: Activity, color: "bg-green-500/10 text-green-600" },
    { label: "Total Facturado", value: totalFacturado, icon: DollarSign, color: "bg-primary/10 text-primary", isCurrency: true },
    { label: "Total Cobrado", value: totalCobrado, icon: TrendingUp, color: "bg-secondary/10 text-secondary", isCurrency: true },
    { label: "% Cobranza", value: porcentajeCobranza, icon: CheckCircle2, color: "bg-teal-500/10 text-teal-600", isPercent: true },
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
      return `${kpi.value}%`;
    }
    return kpi.value.toLocaleString();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
      {kpiConfig.map((kpi) => (
        <Card key={kpi.label} className="border-none shadow-sm overflow-hidden bg-white hover:shadow-md transition-all hover:-translate-y-1 rounded-2xl">
          <CardContent className="p-3 flex flex-col items-center text-center gap-1">
            <div className={`p-2 rounded-xl shrink-0 ${kpi.color} mb-1`}>
              <kpi.icon className="w-4 h-4" />
            </div>
            <div className="min-w-0 w-full px-1">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest truncate mb-0.5">{kpi.label}</p>
              <h3 className={cn(
                "font-black text-slate-800 leading-none tracking-tight truncate",
                kpi.isCurrency ? "text-sm" : "text-base"
              )}>
                {formatValue(kpi)}
              </h3>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
