"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, TrendingDown, TrendingUp, Calculator, DollarSign, Settings2, DownloadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function ImpuestosPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  
  const currentDate = new Date();
  const [mes, setMes] = useState<string>((currentDate.getMonth() + 1).toString());
  const [anio, setAnio] = useState<string>(currentDate.getFullYear().toString());
  
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [newPorcentaje, setNewPorcentaje] = useState<string>("1.5");
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/finanzas/impuestos?mes=${mes}&anio=${anio}`);
      setData(res);
      setNewPorcentaje(res.porcentajeRenta?.toString() || "1.5");
    } catch (e) {
      console.error(e);
      toast.error("Error al cargar datos de impuestos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [mes, anio]);

  const handleSaveConfig = async () => {
    setIsSavingConfig(true);
    try {
      await api.post("/finanzas/impuestos/config", { porcentajeRenta: parseFloat(newPorcentaje) });
      toast.success("Configuración actualizada");
      setIsConfigOpen(false);
      fetchData();
    } catch (e) {
      toast.error("Error al guardar configuración");
    } finally {
      setIsSavingConfig(false);
    }
  };

  return (
    <div className="p-6 md:p-10 space-y-8 bg-slate-50/50 min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <Calculator className="w-8 h-8 text-indigo-600" />
            Declaración de Impuestos
          </h1>
          <p className="text-slate-500 font-medium mt-1">Cálculo de IGV y Renta automatizado con SUNAT.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
          <Select value={mes} onValueChange={setMes}>
            <SelectTrigger className="w-[140px] h-10 border-none bg-slate-50 font-bold focus:ring-0">
              <SelectValue placeholder="Mes" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <SelectItem key={m} value={m.toString()} className="font-bold">
                  {new Date(2000, m - 1).toLocaleString('es-PE', { month: 'long' }).toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={anio} onValueChange={setAnio}>
            <SelectTrigger className="w-[100px] h-10 border-none bg-slate-50 font-bold focus:ring-0">
              <SelectValue placeholder="Año" />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026, 2027].map(a => (
                <SelectItem key={a} value={a.toString()} className="font-bold">{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" className="h-10 w-10 shrink-0 rounded-xl border-slate-200">
                <Settings2 className="w-4 h-4 text-slate-600" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="font-black text-xl">Configuración de Renta</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="porcentaje" className="font-bold text-xs uppercase text-slate-500">Porcentaje de Impuesto a la Renta (%)</Label>
                  <Input
                    id="porcentaje"
                    type="number"
                    step="0.01"
                    value={newPorcentaje}
                    onChange={(e) => setNewPorcentaje(e.target.value)}
                    className="font-bold h-12 text-lg"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setIsConfigOpen(false)}>Cancelar</Button>
                <Button onClick={handleSaveConfig} disabled={isSavingConfig} className="bg-indigo-600 hover:bg-indigo-700">
                  {isSavingConfig ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Guardar Cambios
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Columna Izquierda: Ventas vs Compras */}
          <div className="md:col-span-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Ventas */}
              <Card className="border-emerald-100 shadow-sm bg-gradient-to-br from-white to-emerald-50/30 overflow-hidden relative">
                <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-100/50 rounded-bl-full -mr-4 -mt-4 pointer-events-none" />
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-emerald-800 font-black flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        IGV Ventas
                      </CardTitle>
                      <CardDescription className="font-medium text-emerald-600/80">Débito Fiscal Facturado</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mt-4">
                    <p className="text-4xl font-black text-emerald-700 tracking-tight">
                      S/ {data.ventas.igv.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                    </p>
                    <div className="mt-4 flex justify-between items-center text-xs font-bold text-emerald-600/70 border-t border-emerald-100/50 pt-3">
                      <span>BASE IMPONIBLE (SUBTOTAL)</span>
                      <span>S/ {data.ventas.subtotal.toLocaleString("es-PE", { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Compras */}
              <Card className="border-rose-100 shadow-sm bg-gradient-to-br from-white to-rose-50/30 overflow-hidden relative">
                <div className="absolute right-0 top-0 w-24 h-24 bg-rose-100/50 rounded-bl-full -mr-4 -mt-4 pointer-events-none" />
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-rose-800 font-black flex items-center gap-2">
                        <TrendingDown className="w-5 h-5" />
                        IGV Compras
                      </CardTitle>
                      <CardDescription className="font-medium text-rose-600/80">Crédito Fiscal Acumulado</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mt-4">
                    <p className="text-4xl font-black text-rose-700 tracking-tight">
                      S/ {data.compras.igv.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                    </p>
                    <div className="mt-4 flex justify-between items-center text-xs font-bold text-rose-600/70 border-t border-rose-100/50 pt-3">
                      <span>BASE IMPONIBLE (SUBTOTAL)</span>
                      <span>S/ {data.compras.subtotal.toLocaleString("es-PE", { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Credito Fiscal Alerta */}
            {data.creditoFiscalAcumulado > 0 && (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-100 p-2 rounded-lg">
                    <DollarSign className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-black text-amber-800 text-sm">Crédito Fiscal a Favor</p>
                    <p className="text-xs text-amber-700 font-medium">Tus compras superaron tus ventas este mes.</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-amber-700 tracking-tight">
                    S/ {data.creditoFiscalAcumulado.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Columna Derecha: Resumen de Pago */}
          <div className="md:col-span-4">
            <Card className="border-slate-200 shadow-md h-full bg-white relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-600" />
              <CardHeader>
                <CardTitle className="text-xl font-black text-slate-800">Resumen SUNAT</CardTitle>
                <CardDescription className="font-medium">Total de impuestos a pagar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-500 uppercase">IGV por Pagar</p>
                    <p className="text-[10px] text-slate-400">Ventas - Compras</p>
                  </div>
                  <p className="text-lg font-black text-slate-700">
                    S/ {data.igvPorPagar.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="flex justify-between items-center pb-6 border-b border-dashed border-slate-200">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                      Impuesto Renta 
                      <span className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded text-[9px]">{data.porcentajeRenta}%</span>
                    </p>
                    <p className="text-[10px] text-slate-400">Sobre subtotal de ventas</p>
                  </div>
                  <p className="text-lg font-black text-slate-700">
                    S/ {data.impuestoRenta.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="pt-2">
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest text-center mb-2">Total a Pagar a SUNAT</p>
                  <div className="bg-slate-900 rounded-2xl p-6 text-center shadow-inner relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
                    <p className="text-4xl font-black text-white tracking-tighter relative z-10">
                      S/ {data.montoFinalSunat.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                <Button className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-black tracking-wide text-xs group" disabled>
                  <DownloadCloud className="w-4 h-4 mr-2 group-hover:-translate-y-0.5 transition-transform" />
                  Descargar Reporte (Proximamente)
                </Button>

              </CardContent>
            </Card>
          </div>

        </div>
      ) : null}
    </div>
  );
}
