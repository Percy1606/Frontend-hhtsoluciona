"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, TrendingDown, TrendingUp, Calculator, DollarSign, Settings2, DownloadCloud, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const getEstadoBadge = (estado: string) => {
  const norm = estado?.toUpperCase();
  if (norm === "PAGADA" || norm === "PAGADO" || norm === "APROBADO") {
    return <Badge className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 text-[9px] font-black uppercase">PAGADO</Badge>;
  }
  if (norm === "PENDIENTE" || norm === "SOLICITADO") {
    return <Badge className="bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200 text-[9px] font-black uppercase">PENDIENTE</Badge>;
  }
  if (norm === "PAGO_PARCIAL") {
    return <Badge className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 text-[9px] font-black uppercase">PAGO PARCIAL</Badge>;
  }
  if (norm === "VENCIDA" || norm === "RECHAZADO") {
    return <Badge className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200 text-[9px] font-black uppercase">VENCIDO</Badge>;
  }
  return <Badge className="bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 text-[9px] font-black uppercase">{estado}</Badge>;
};

const getNombreMes = (mesNum: string) => {
  const m = parseInt(mesNum);
  const meses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  return meses[m - 1] || "";
};

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
    <div className="p-4 md:p-6 space-y-6 bg-slate-50/50 min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Calculator className="w-6 h-6 text-indigo-600" />
            Declaración de Impuestos
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1">
            Cálculo de IGV y Renta automatizado con SUNAT para <span className="text-indigo-600 font-bold uppercase">{getNombreMes(mes)} {anio}</span>.
          </p>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
          <Select value={mes} onValueChange={(v) => setMes(v || "1")}>
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

          <Select value={anio} onValueChange={(v) => setAnio(v || "2026")}>
            <SelectTrigger className="w-[100px] h-10 border-none bg-slate-50 font-bold focus:ring-0">
              <SelectValue placeholder="Año" />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026, 2027].map(a => (
                <SelectItem key={a} value={a.toString()} className="font-bold">{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => {
              const d = new Date();
              setMes((d.getMonth() + 1).toString());
              setAnio(d.getFullYear().toString());
              toast.success("Filtros restablecidos al mes actual");
            }}
            title="Restablecer filtros al mes actual"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>

          <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
            <DialogTrigger className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-100 transition-colors">
              <Settings2 className="w-4 h-4 text-slate-600" />
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-white">
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
                <Button onClick={handleSaveConfig} disabled={isSavingConfig} className="bg-indigo-600 hover:bg-indigo-700 text-white">
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
                <div className="absolute right-0 top-0 w-16 h-16 bg-emerald-100/50 rounded-bl-full -mr-2 -mt-2 pointer-events-none" />
                <CardHeader className="pb-1 px-5 pt-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-emerald-800 font-bold text-sm flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        IGV Ventas
                      </CardTitle>
                      <CardDescription className="font-medium text-[10px] text-emerald-600/80">Débito Fiscal Facturado</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-5 pb-5">
                  <div className="mt-2">
                    <p className="text-2xl font-black text-emerald-700 tracking-tight">
                      S/ {data.ventas.igv.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                    </p>
                    <div className="mt-3 flex justify-between items-center text-[10px] font-bold text-emerald-600/70 border-t border-emerald-100/50 pt-2">
                      <span>BASE IMPONIBLE (SUBTOTAL)</span>
                      <span>S/ {data.ventas.subtotal.toLocaleString("es-PE", { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Compras */}
              <Card className="border-rose-100 shadow-sm bg-gradient-to-br from-white to-rose-50/30 overflow-hidden relative">
                <div className="absolute right-0 top-0 w-16 h-16 bg-rose-100/50 rounded-bl-full -mr-2 -mt-2 pointer-events-none" />
                <CardHeader className="pb-1 px-5 pt-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-rose-800 font-bold text-sm flex items-center gap-2">
                        <TrendingDown className="w-4 h-4" />
                        IGV Compras
                      </CardTitle>
                      <CardDescription className="font-medium text-[10px] text-rose-600/80">Crédito Fiscal Acumulado</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-5 pb-5">
                  <div className="mt-2">
                    <p className="text-2xl font-black text-rose-700 tracking-tight">
                      S/ {data.compras.igv.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                    </p>
                    <div className="mt-3 flex justify-between items-center text-[10px] font-bold text-rose-600/70 border-t border-rose-100/50 pt-2">
                      <span>BASE IMPONIBLE (SUBTOTAL)</span>
                      <span>S/ {data.compras.subtotal.toLocaleString("es-PE", { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Credito Fiscal Alerta */}
            {data.creditoFiscalAcumulado > 0 && (
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-amber-100 p-1.5 rounded-lg">
                    <DollarSign className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-bold text-amber-800 text-xs">Crédito Fiscal a Favor</p>
                    <p className="text-[10px] text-amber-700 font-medium">Tus compras superaron tus ventas este mes.</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-amber-700 tracking-tight">
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
              <CardHeader className="pb-3 px-5 pt-5">
                <CardTitle className="text-lg font-black text-slate-800">Resumen SUNAT</CardTitle>
                <CardDescription className="text-xs font-medium">Total de impuestos a pagar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 px-5 pb-5">
                
                <div className="flex justify-between items-center">
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-bold text-slate-500 uppercase">IGV por Pagar</p>
                    <p className="text-[9px] text-slate-400">Ventas - Compras</p>
                  </div>
                  <p className="text-base font-black text-slate-700">
                    S/ {data.igvPorPagar.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="flex justify-between items-center pb-4 border-b border-dashed border-slate-200">
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
                      Impuesto Renta 
                      <span className="bg-indigo-100 text-indigo-700 px-1 py-0.5 rounded text-[8px]">{data.porcentajeRenta}%</span>
                    </p>
                    <p className="text-[9px] text-slate-400">Sobre subtotal de ventas</p>
                  </div>
                  <p className="text-base font-black text-slate-700">
                    S/ {data.impuestoRenta.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="pt-1">
                  <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest text-center mb-1.5">Total a Pagar a SUNAT</p>
                  <div className="bg-slate-900 rounded-xl p-4 text-center shadow-inner relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
                    <p className="text-2xl font-black text-white tracking-tighter relative z-10">
                      S/ {data.montoFinalSunat.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                <Button className="w-full h-10 rounded-lg bg-indigo-600 hover:bg-indigo-700 font-black tracking-wide text-[11px] group mt-2" disabled>
                  <DownloadCloud className="w-3.5 h-3.5 mr-2 group-hover:-translate-y-0.5 transition-transform" />
                  Descargar Reporte (Proximamente)
                </Button>

              </CardContent>
            </Card>
          </div>

          {/* Fila Inferior: Detalles de IGV Ventas y IGV Compras */}
          <div className="md:col-span-6 mt-2">
            <Card className="border-slate-200 shadow-sm bg-white">
              <CardHeader className="pb-3 px-5 pt-5">
                <CardTitle className="text-sm font-black text-slate-800 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  Detalle IGV Ventas (Facturas de Ingresos)
                </CardTitle>
                <CardDescription className="text-[10px] font-medium text-slate-500 mt-1">
                  Listado de facturas de ingresos emitidas en este periodo.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <div className="overflow-x-auto max-h-[350px] overflow-y-auto pr-1">
                  <Table className="min-w-full">
                    <TableHeader className="bg-slate-50 sticky top-0 z-10">
                      <TableRow>
                        <TableHead className="font-black text-[9px] text-primary uppercase p-2">Factura</TableHead>
                        <TableHead className="font-black text-[9px] text-primary uppercase p-2">Cliente</TableHead>
                        <TableHead className="font-black text-[9px] text-primary uppercase p-2">F. Emisión</TableHead>
                        <TableHead className="font-black text-[9px] text-primary uppercase p-2">Estado</TableHead>
                        <TableHead className="font-black text-[9px] text-primary uppercase p-2 text-right">IGV</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!data.detalleFacturas || data.detalleFacturas.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-20 text-center text-slate-400 font-bold italic text-xs">
                            No hay facturas emitidas este mes.
                          </TableCell>
                        </TableRow>
                      ) : (
                        data.detalleFacturas.map((f: any) => (
                          <TableRow key={f.id} className="hover:bg-slate-50 transition-colors">
                            <TableCell className="p-2 font-black text-[10px] text-slate-700">{f.codigo}</TableCell>
                            <TableCell className="p-2 font-bold text-[10px] text-slate-600 uppercase max-w-[120px] truncate" title={f.cliente?.empresa}>{f.cliente?.empresa}</TableCell>
                            <TableCell className="p-2 font-medium text-[10px] text-slate-500">
                              {new Date(f.fechaEmision).toLocaleDateString("es-PE", { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </TableCell>
                            <TableCell className="p-2">
                              {getEstadoBadge(f.estado)}
                            </TableCell>
                            <TableCell className="p-2 font-black text-[10px] text-slate-800 text-right font-mono">
                              S/ {Number(f.montoIgv).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-6 mt-2">
            <Card className="border-slate-200 shadow-sm bg-white">
              <CardHeader className="pb-3 px-5 pt-5">
                <CardTitle className="text-sm font-black text-slate-800 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-rose-600" />
                  Detalle IGV Compras (Facturas de Gastos)
                </CardTitle>
                <CardDescription className="text-[10px] font-medium text-slate-500 mt-1">
                  Listado de gastos registrados con tipo factura y con IGV aplicado.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <div className="overflow-x-auto max-h-[350px] overflow-y-auto pr-1">
                  <Table className="min-w-full">
                    <TableHeader className="bg-slate-50 sticky top-0 z-10">
                      <TableRow>
                        <TableHead className="font-black text-[9px] text-primary uppercase p-2">Comprobante</TableHead>
                        <TableHead className="font-black text-[9px] text-primary uppercase p-2">Proveedor / Concepto</TableHead>
                        <TableHead className="font-black text-[9px] text-primary uppercase p-2">F. Emisión</TableHead>
                        <TableHead className="font-black text-[9px] text-primary uppercase p-2">Estado</TableHead>
                        <TableHead className="font-black text-[9px] text-primary uppercase p-2 text-right">IGV</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!data.detalleGastos || data.detalleGastos.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-20 text-center text-slate-400 font-bold italic text-xs">
                            No hay compras con IGV este mes.
                          </TableCell>
                        </TableRow>
                      ) : (
                        data.detalleGastos.map((g: any) => (
                          <TableRow key={g.id} className="hover:bg-slate-50 transition-colors">
                            <TableCell className="p-2 font-black text-[10px] text-slate-700">{g.codigo || 'S/N'}</TableCell>
                            <TableCell className="p-2 font-bold text-[10px] text-slate-600 uppercase max-w-[120px] truncate" title={g.proveedor?.razonSocial || g.concepto}>
                              {g.proveedor?.razonSocial || g.concepto}
                            </TableCell>
                            <TableCell className="p-2 font-medium text-[10px] text-slate-500">
                              {new Date(g.fechaEmision).toLocaleDateString("es-PE", { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </TableCell>
                            <TableCell className="p-2">
                              {getEstadoBadge(g.estado)}
                            </TableCell>
                            <TableCell className="p-2 font-black text-[10px] text-slate-800 text-right font-mono">
                              S/ {Number(g.montoIgv || 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      ) : null}
    </div>
  );
}
