"use client";

import { useState, useEffect } from "react";
import { 
  TrendingUp, 
  AlertTriangle, 
  Activity
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export function ExecutivePanel() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadExecutiveData = async () => {
      try {
        const res = await api.get('/finanzas/executive-dashboard');
        setData(res);
      } catch (error) {
        console.error("Error loading executive data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadExecutiveData();
  }, []);

  if (loading || !data) return null;

  const { resumenCaja, proyectos, cartera, indicadores } = data;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* RENTABILIDAD TOP PROYECTOS */}
      <Card className="lg:col-span-2 border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-3">
          <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" /> Top Rentabilidad (Proyectos Activos)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            {proyectos.topRentabilidad.map((p: any) => (
              <div key={p.id} className="space-y-2">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-black text-primary uppercase leading-none mb-1">{p.codigo}</p>
                    <h4 className="text-sm font-bold text-slate-800 leading-tight">{p.nombre}</h4>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-black text-slate-700">
                      {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 }).format(p.utilidad || 0)}
                    </p>
                    <p className={cn(
                      "text-[9px] font-black uppercase",
                      (p.rentabilidad || 0) > 20 ? "text-green-600" : "text-orange-600"
                    )}>
                      {(p.rentabilidad || 0).toFixed(1)}% Margen
                    </p>
                  </div>
                </div>
                <Progress 
                  value={p.rentabilidad || 0} 
                  max={100} 
                  className="h-2 bg-slate-100" 
                  indicatorClassName={cn(
                    (p.rentabilidad || 0) > 30 ? "bg-green-500" : 
                    (p.rentabilidad || 0) > 15 ? "bg-primary" : "bg-orange-500"
                  )}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* SALUD FINANCIERA Y CARTERA */}
      <div className="space-y-6">
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-900 p-4 text-white">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Indicador de Liquidez</CardTitle>
          </CardHeader>
          <CardContent className="p-6 bg-white flex flex-col items-center text-center">
             <div className={cn(
               "w-16 h-16 rounded-full flex items-center justify-center mb-4",
               indicadores.saludFinanciera === 'ESTABLE' ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
             )}>
                <TrendingUp className="w-8 h-8" />
             </div>
             <h3 className="text-xl font-black text-slate-800">{indicadores.saludFinanciera || 'N/A'}</h3>
             <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Ratio de Liquidez: {(indicadores.ratioLiquidez || 0).toFixed(2)}</p>
             <div className="w-full h-px bg-slate-100 my-4" />
             <div className="grid grid-cols-2 w-full gap-4">
                <div>
                   <p className="text-[9px] font-black text-slate-400 uppercase">Caja Disponible</p>
                   <p className="text-[11px] font-black text-green-600">
                     {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 }).format(resumenCaja.disponible || 0)}
                   </p>
                </div>
                <div>
                   <p className="text-[9px] font-black text-slate-400 uppercase">Pasivo Pendiente</p>
                   <p className="text-[11px] font-black text-red-600">
                     {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 }).format(cartera.porPagar || 0)}
                   </p>
                </div>
             </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-orange-50/30">
          <CardContent className="p-5 space-y-4">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                   <AlertTriangle className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                   <p className="text-[10px] font-black text-orange-800 uppercase tracking-wider">Cartera Vencida</p>
                   <p className="text-lg font-black text-slate-800">{cartera.facturasCriticas || 0} Facturas</p>
                </div>
             </div>
             <div className="bg-white p-3 rounded-xl border border-orange-200/50">
                <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Monto por recuperar</p>
                <p className="text-base font-black text-orange-600">
                  {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 }).format(cartera.porCobrarVencido || 0)}
                </p>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
