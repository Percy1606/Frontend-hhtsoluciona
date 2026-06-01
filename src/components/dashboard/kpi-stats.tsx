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

export function KPIStats() {
  const { clients, quotes } = useCRMStore();
  const { proyectos } = useOperacionesStore();

  const totalClientes = clients.length;
  const prospectos = clients.filter(c => c.etapaComercial !== 'Ganado' && c.etapaComercial !== 'Perdido').length;
  const cotizacionesEnviadas = quotes.length;
  const proyectosActivos = proyectos.filter(p => p.estado === 'En Ejecución').length;
  const montoEstimado = clients.reduce((acc, c) => acc + (c.montoEstimado || 0), 0);
  const ventaProyectada = clients.reduce((acc, c) => acc + (c.ventaProyectada || 0), 0);
  
  // % Cobranza simulado por ahora si no hay datos de facturación
  const porcentajeCobranza = 85; 

  const kpiConfig = [
    { label: "Total Clientes", value: totalClientes, icon: Users, color: "bg-blue-500/10 text-blue-600" },
    { label: "Prospectos", value: prospectos, icon: Target, color: "bg-orange-500/10 text-orange-600" },
    { label: "Cotizaciones", value: cotizacionesEnviadas, icon: FileText, color: "bg-purple-500/10 text-purple-600" },
    { label: "Proyectos Activos", value: proyectosActivos, icon: Activity, color: "bg-green-500/10 text-green-600" },
    { label: "Monto Estimado", value: montoEstimado, icon: DollarSign, color: "bg-primary/10 text-primary", isCurrency: true },
    { label: "Venta Proyectada", value: ventaProyectada, icon: TrendingUp, color: "bg-secondary/10 text-secondary", isCurrency: true },
    { label: "% Cobranza", value: porcentajeCobranza, icon: CheckCircle2, color: "bg-teal-500/10 text-teal-600", isPercent: true },
  ];

  const formatValue = (kpi: typeof kpiConfig[0]) => {
    if (kpi.isCurrency) {
      return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 }).format(kpi.value);
    }
    if (kpi.isPercent) {
      return `${kpi.value}%`;
    }
    return kpi.value.toLocaleString();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
      {kpiConfig.map((kpi) => (
        <Card key={kpi.label} className="border-none shadow-sm overflow-hidden">
          <CardContent className="p-4 flex flex-col items-center text-center">
            <div className={`p-2 rounded-full mb-3 ${kpi.color}`}>
              <kpi.icon className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-tight">{kpi.label}</p>
            <h3 className="text-lg font-black mt-1">{formatValue(kpi)}</h3>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
