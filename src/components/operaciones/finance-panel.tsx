"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Receipt, 
  Wallet, 
  Package, 
  Plus, 
  Loader2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Lock
} from "lucide-react";
import { useOperacionesStore } from "@/store/operaciones-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn, formatDate, formatCurrency } from "@/lib/utils";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FacturaForm } from "../finanzas/factura-form";

interface FinancePanelProps {
  proyectoId: string;
}

const CATEGORIAS_DISTRIBUCION = [
  { id: 'MATERIALES', label: 'Materiales (Logística)', color: 'bg-blue-500' },
  { id: 'MANO_OBRA', label: 'Mano de Obra / Personal', color: 'bg-orange-500' },
  { id: 'LOGISTICA_MOVILIDAD', label: 'Movilidad y Viáticos', color: 'bg-purple-500' },
  { id: 'OPERATIVO_VARIO', label: 'Gastos Operativos Varios', color: 'bg-slate-500' },
  { id: 'UTILIDAD_RESERVA', label: 'Utilidad y Reservas', color: 'bg-green-500' },
];

export function FinancePanel({ proyectoId }: FinancePanelProps) {
  const { fetchProjectProfitability, proyectos } = useOperacionesStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [isFacturaModalOpen, setIsFacturaModalOpen] = useState(false);
  const [adelantos, setAdelantos] = useState<any[]>([]);
  const [facturas, setFacturas] = useState<any[]>([]);
  const [distribucion, setDistribucion] = useState<any[]>([]);

  // Buscar el proyecto actual para obtener el monto de la cotización
  const currentProyecto = useMemo(() => 
    proyectos.find(p => p.id === proyectoId), 
  [proyectos, proyectoId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [profitData, adelantosRes, distRes] = await Promise.all([
        fetchProjectProfitability(proyectoId),
        api.get(`/finanzas/adelantos?proyectoId=${proyectoId}`),
        api.get(`/finanzas/proyectos/${proyectoId}/distribucion`)
      ]);
      setData(profitData);
      setAdelantos(adelantosRes);
      setDistribucion(distRes);
      // Usar las facturas consolidadas que vienen dentro del reporte de rentabilidad
      setFacturas(profitData.facturas || []);
    } catch (error) {
      console.error("Error loading project finance data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [proyectoId]);

  const handleAddAdvance = async (formData: any) => {
    try {
      await api.post('/finanzas/adelantos', {
        ...formData,
        proyectoId,
        monto: parseFloat(formData.monto)
      });
      toast.success("Adelanto registrado y distribuido correctamente");
      setIsAdvanceModalOpen(false);
      loadData();
    } catch (error) {
      toast.error("Error al registrar adelanto");
    }
  };

  const handleRegisterFactura = async (formData: any) => {
    try {
      await api.post('/finanzas/facturas', {
        ...formData,
        proyectoId
      });
      toast.success("Factura registrada exitosamente");
      setIsFacturaModalOpen(false);
      loadData();
    } catch (error) {
      toast.error("Error al registrar factura");
    }
  };

  if (loading && !data) {
    return (
      <div className="h-64 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-xs font-black uppercase text-slate-400 animate-pulse">Calculando Rentabilidad...</p>
      </div>
    );
  }

  const financiero = data?.financiero || { totalFacturado: 0, totalCobrado: 0, totalGastos: 0, totalMateriales: 0 };
  const egresos = data?.egresos || { costoTotal: 0, materiales: 0, gastosDirectos: 0 };
  const adelantosStats = data?.adelantos || { totalRecibido: 0, disponible: 0 };
  const indicadores = data?.indicadores || { utilidadProyectada: 0, rentabilidadProyectada: 0 };
  const presupuestoExcedido = data?.presupuestoExcedido || false;
  
  // Usar el monto de la cotización como base si existe
  const montoCotizacion = data?.montoCotizado || currentProyecto?.cotizacionOrigen?.monto || financiero.totalFacturado || 0;
  const totalPagosRecibidos = Number(financiero.totalCobrado) + Number(adelantosStats.totalRecibido - adelantosStats.disponible);
  const saldoRealPendiente = Number(montoCotizacion) - Number(financiero.totalCobrado) - Number(adelantosStats.disponible);

  return (
    <div className="space-y-6">
      {/* ALERTA DE PRESUPUESTO EXCEDIDO */}
      {presupuestoExcedido && (
        <div className="bg-red-50 border-2 border-red-200 p-4 rounded-2xl flex items-center gap-4 animate-bounce">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                <AlertCircle className="w-7 h-7 text-red-600" />
            </div>
            <div>
                <h4 className="text-sm font-black text-red-800 uppercase">¡Proyecto no Rentable!</h4>
                <p className="text-[10px] font-bold text-red-600 uppercase">Los costos actuales (S/ {(Number(egresos.costoTotal) || 0).toLocaleString()}) han superado el monto de la cotización (S/ {(Number(montoCotizacion) || 0).toLocaleString()}).</p>
            </div>
        </div>
      )}

      {/* INDICADORES CLAVE */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <FinanceCard 
          label="Valor de Obra" 
          value={Number(montoCotizacion) || 0} 
          icon={<Receipt className="w-5 h-5 text-blue-500" />}
          subLabel={`Total Cotizado`}
        />
        <FinanceCard 
          label="Costo Acumulado" 
          value={Number(egresos.costoTotal) || 0} 
          icon={<TrendingDown className={cn("w-5 h-5", presupuestoExcedido ? "text-red-600" : "text-orange-500")} />}
          subLabel={`Gastos + Materiales`}
          highlight={presupuestoExcedido}
          color={presupuestoExcedido ? "bg-red-600" : undefined}
        />
        <FinanceCard 
          label="Utilidad Proyectada" 
          value={Number(indicadores.utilidadProyectada) || 0} 
          icon={<TrendingUp className="w-5 h-5 text-green-500" />}
          subLabel={`Margen: ${Number(indicadores.rentabilidadProyectada) || 0}%`}
        />
        <FinanceCard 
          label="Saldo Real Pendiente" 
          value={saldoRealPendiente > 0 ? Number(saldoRealPendiente) : 0} 
          icon={<Wallet className="w-5 h-5 text-blue-500" />}
          subLabel={`Por cobrar al cliente`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* RESUMEN DE ESTADO FINANCIERO */}
        <Card className="lg:col-span-1 border-slate-200 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary" /> Resumen de Saldos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-5">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase">Monto Total del Proyecto</p>
              <p className="text-xl font-black text-slate-800">S/ {(Number(montoCotizacion) || 0).toLocaleString()}</p>
            </div>
            
            <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className="text-slate-500 uppercase">Adelantos Recibidos</span>
                    <span className="text-green-600">S/ {(Number(adelantosStats.totalRecibido) || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className="text-slate-500 uppercase">Cobrado via Facturas</span>
                    <span className="text-blue-600">S/ {(Number(financiero.totalCobrado) || 0).toLocaleString()}</span>
                </div>
                <div className="w-full h-px bg-slate-100" />
                <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-700 uppercase">Saldo Restante</span>
                    <span className="text-sm font-black text-red-600">S/ {(Math.max(0, Number(saldoRealPendiente)) || 0).toLocaleString()}</span>
                </div>
            </div>

            <div className="pt-4 border-t border-dashed border-slate-200">
               <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Ejecución Presupuestal (Gastos)</p>
                  <div className="flex items-end justify-between">
                    <span className="text-xl font-black text-slate-800">
                      {Math.round((Number(egresos.costoTotal) / (Number(montoCotizacion) || 1)) * 100 || 0)}%
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">S/ {(Number(egresos.costoTotal) || 0).toLocaleString()} gastados</span>
                  </div>
                  <Progress value={(Number(egresos.costoTotal) / (Number(montoCotizacion) || 1)) * 100 || 0} className="h-2 mt-2 bg-slate-200" indicatorClassName="bg-orange-500" />
               </div>
            </div>
          </CardContent>
        </Card>

        {/* LISTADO DE FACTURAS VINCULADAS */}
        <Card className="lg:col-span-2 border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="pb-3 border-b border-slate-100 bg-slate-900 text-white flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> Facturación y Cobranzas
            </CardTitle>
            <Button size="sm" onClick={() => setIsFacturaModalOpen(true)} className="h-7 text-[9px] font-black uppercase bg-primary hover:bg-primary/90 text-white">
              <Plus className="w-3 h-3 mr-1" /> Registrar Factura
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[300px]">
              <Table>
                <TableHeader className="bg-slate-50/50 sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="text-[9px] font-black uppercase pl-6">Nro. Factura</TableHead>
                    <TableHead className="text-[9px] font-black uppercase">Estado</TableHead>
                    <TableHead className="text-[9px] font-black uppercase">Monto Total</TableHead>
                    <TableHead className="text-[9px] font-black uppercase pr-6 text-right">Saldo Pendiente</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {facturas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-20 text-slate-400 font-bold text-[10px] uppercase italic">
                        No hay facturas registradas para este proyecto
                      </TableCell>
                    </TableRow>
                  ) : (
                    facturas.map((f) => (
                      <TableRow key={f.id} className="hover:bg-slate-50 transition-colors">
                        <TableCell className="pl-6">
                            <p className="text-[10px] font-black text-slate-800 uppercase">{f.codigo}</p>
                            <p className="text-[8px] font-bold text-slate-400">{formatDate(f.fechaEmision)}</p>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn(
                              "text-[8px] font-black uppercase h-5",
                              f.estado === 'PAGADA' ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                          )}>
                            {f.estado}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-[10px] font-bold text-slate-600">S/ {Number(f.montoTotal || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-right pr-6">
                            <span className={cn(
                                "text-[11px] font-black",
                                Number(f.saldoPendiente) > 0 ? "text-red-600" : "text-green-600"
                            )}>
                                S/ {Number(f.saldoPendiente || 0).toLocaleString()}
                            </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* LISTADO DE ADELANTOS */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-500" /> Historial de Adelantos (Entradas de Capital)
          </CardTitle>
          <Button size="sm" onClick={() => setIsAdvanceModalOpen(true)} className="h-7 text-[9px] font-black uppercase bg-green-600 hover:bg-green-700 text-white">
            <Plus className="w-3 h-3 mr-1" /> Registrar Nuevo Adelanto
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[200px]">
            <Table>
              <TableHeader className="bg-slate-50/50 sticky top-0 z-10">
                <TableRow>
                  <TableHead className="text-[9px] font-black uppercase pl-6">Fecha</TableHead>
                  <TableHead className="text-[9px] font-black uppercase">Monto</TableHead>
                  <TableHead className="text-[9px] font-black uppercase">Método</TableHead>
                  <TableHead className="text-[9px] font-black uppercase">Referencia</TableHead>
                  <TableHead className="text-[9px] font-black uppercase pr-6 text-right">Disponible</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adelantos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-slate-400 font-bold text-[10px] uppercase italic">
                      No hay adelantos registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  adelantos.map((a) => (
                    <TableRow key={a.id} className="hover:bg-slate-50 transition-colors">
                      <TableCell className="text-[10px] font-bold text-slate-600 pl-6">{formatDate(a.fechaRecibido)}</TableCell>
                      <TableCell className="text-[10px] font-black text-slate-800">S/ {Number(a.monto || 0).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[8px] font-black uppercase border-slate-200 text-slate-500">
                          {a.metodo}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[10px] font-medium text-slate-500">{a.referencia || "—"}</TableCell>
                      <TableCell className="text-[10px] font-black text-green-600 pr-6 text-right">S/ {Number(a.saldoDisponible || 0).toFixed(2)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      <AdvanceModal 
        isOpen={isAdvanceModalOpen} 
        onClose={() => setIsAdvanceModalOpen(false)} 
        onSubmit={handleAddAdvance} 
      />

      {/* MODAL DE FACTURACIÓN INTEGRADA */}
      <Dialog open={isFacturaModalOpen} onOpenChange={setIsFacturaModalOpen}>
        <DialogContent className="max-w-4xl bg-white border-none shadow-2xl rounded-3xl p-0 overflow-hidden">
          <DialogHeader className="bg-slate-900 text-white p-6">
            <DialogTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" /> Registrar Factura de Proyecto
            </DialogTitle>
          </DialogHeader>
          <div className="p-6">
            <FacturaForm 
                initialData={{ 
                    proyectoId: proyectoId, 
                    clienteId: currentProyecto?.clientId || "",
                    clasificacion: 'PROYECTO'
                } as any}
                onSubmit={handleRegisterFactura}
                onCancel={() => setIsFacturaModalOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FinanceCard({ label, value, icon, subLabel, highlight, color }: any) {
  const numericValue = typeof value === 'number' ? value : 0;
  
  return (
    <Card className={cn("border-slate-200 shadow-sm", highlight && (color || "bg-primary text-white border-primary shadow-lg shadow-primary/20"))}>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <p className={cn("text-[9px] font-black uppercase tracking-widest", highlight ? "text-white/70" : "text-slate-400")}>{label}</p>
          <div className={cn("p-1.5 rounded-lg", highlight ? "bg-white/20" : "bg-slate-50")}>
            {icon}
          </div>
        </div>
        <div className="space-y-0.5">
          <p className="text-xl font-black tracking-tight">S/ {numericValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className={cn("text-[9px] font-bold", highlight ? "text-white/80" : "text-slate-500")}>{subLabel}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function AdvanceModal({ isOpen, onClose, onSubmit }: any) {
  const [cajas, setCajas] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    monto: "",
    cajaId: "",
    fechaRecibido: new Date().toISOString().split('T')[0],
    metodo: "TRANSFERENCIA",
    referencia: "",
    observaciones: "",
    distribuciones: CATEGORIAS_DISTRIBUCION.map(c => ({ categoria: c.id, monto: 0 }))
  });

  useEffect(() => {
    if (isOpen) {
        api.get('/finanzas/cajas').then(res => {
            setCajas(res);
            if (res.length > 0 && !formData.cajaId) {
                setFormData(prev => ({ ...prev, cajaId: res[0].id }));
            }
        });
    }
  }, [isOpen]);

  const totalDistribuido = formData.distribuciones.reduce((acc, d) => acc + (parseFloat(d.monto as any) || 0), 0);
  const montoIngresado = parseFloat(formData.monto) || 0;
  const saldoPorDistribuir = montoIngresado - totalDistribuido;

  const handleDistChange = (catId: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      distribuciones: prev.distribuciones.map(d => 
        d.categoria === catId ? { ...d, monto: parseFloat(value) || 0 } : d
      )
    }));
  };

  const handleAutoDist = () => {
      if (montoIngresado <= 0) return;
      const sugerida = [0.4, 0.3, 0.1, 0.1, 0.1];
      setFormData(prev => ({
          ...prev,
          distribuciones: prev.distribuciones.map((d, i) => ({
              ...d,
              monto: Number((montoIngresado * sugerida[i]).toFixed(2))
          }))
      }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] bg-white p-0 overflow-hidden rounded-3xl border-none shadow-2xl">
        <DialogHeader className="bg-slate-900 text-white p-6">
          <DialogTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" /> Registrar y Distribuir Capital
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="p-6 space-y-5 border-r border-slate-100">
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500">Monto Total del Adelanto (S/.)</Label>
                    <Input 
                        type="text" 
                        autoComplete="off"
                        value={formData.monto === "" ? "" : Number(formData.monto).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                        onChange={(e) => {
                            const raw = e.target.value.replace(/[^0-9.]/g, '');
                            setFormData({...formData, monto: raw});
                        }} 
                        className="h-12 text-xl font-black text-primary bg-primary/5 border-primary/20 focus-visible:ring-primary"
                        placeholder="0.00"
                    />
                </div>

                <div className="bg-emerald-50/50 p-4 rounded-2xl border-2 border-emerald-100 space-y-3 shadow-sm">
                    <Label className="text-[9px] font-black uppercase text-emerald-700 tracking-widest flex items-center gap-1.5">
                        <Wallet className="w-3 h-3" /> 💰 Destino: ¿A qué cuenta ingresó este capital?
                    </Label>
                    <Select value={formData.cajaId} onValueChange={(v) => setFormData({...formData, cajaId: v || ""})}>
                        <SelectTrigger className="h-10 font-black text-xs bg-white border-emerald-200">
                            <SelectValue>
                                {cajas.find(c => c.id === formData.cajaId)?.nombre || "Seleccione cuenta..."}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {cajas.map(c => (
                                <SelectItem key={c.id} value={c.id} className="font-bold text-xs">
                                    <div className="flex items-center gap-2">
                                        {c.nombre}
                                        {c.esProtegida && <Lock className="w-3 h-3 text-primary" />}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <Label className="text-[9px] font-black text-slate-400 uppercase">Fecha</Label>
                        <Input type="date" value={formData.fechaRecibido} onChange={(e) => setFormData({...formData, fechaRecibido: e.target.value})} className="h-9 text-xs font-bold" />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[9px] font-black text-slate-400 uppercase">Método</Label>
                        <Select value={formData.metodo} onValueChange={(v) => setFormData({...formData, metodo: v || ""})}>
                            <SelectTrigger className="h-9 text-xs font-bold">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="TRANSFERENCIA">Transferencia</SelectItem>
                                <SelectItem value="EFECTIVO">Efectivo</SelectItem>
                                <SelectItem value="CHEQUE">Cheque</SelectItem>
                                <SelectItem value="TARJETA">Tarjeta</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-1">
                    <Label className="text-[9px] font-black text-slate-400 uppercase">Referencia / Operación</Label>
                    <Input value={formData.referencia} onChange={(e) => setFormData({...formData, referencia: e.target.value})} className="h-9 text-xs font-bold" placeholder="Nro Operación" />
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-500">
                        <span>Estado de Distribución</span>
                        <span className={cn(saldoPorDistribuir === 0 && montoIngresado > 0 ? "text-green-600" : "text-orange-600")}>
                            {saldoPorDistribuir === 0 && montoIngresado > 0 ? "Completado ✓" : "Pendiente"}
                        </span>
                    </div>
                    <div className="flex justify-between items-end">
                        <p className="text-sm font-black text-slate-700">S/ {totalDistribuido.toFixed(2)}</p>
                        <p className="text-[9px] font-bold text-slate-400">Restante: S/ {saldoPorDistribuir.toFixed(2)}</p>
                    </div>
                    <Progress value={montoIngresado > 0 ? (totalDistribuido / montoIngresado) * 100 : 0} className="h-1.5 bg-white" indicatorClassName={saldoPorDistribuir === 0 ? "bg-green-500" : "bg-orange-500"} />
                </div>
            </div>

            <div className="bg-slate-50/50 p-6 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Plan de Gasto</h4>
                    <Button onClick={handleAutoDist} variant="ghost" className="h-6 text-[8px] font-black uppercase bg-white border border-slate-200 shadow-sm">Auto-Distribuir</Button>
                </div>
                
                <ScrollArea className="flex-grow pr-4 -mr-4">
                    <div className="space-y-4 pr-1">
                        {CATEGORIAS_DISTRIBUCION.map((cat) => {
                            const dist = formData.distribuciones.find(d => d.categoria === cat.id);
                            return (
                                <div key={cat.id} className="space-y-1.5">
                                    <div className="flex justify-between">
                                        <Label className="text-[9px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                                            <div className={cn("w-1.5 h-1.5 rounded-full", cat.color)} />
                                            {cat.label}
                                        </Label>
                                        <span className="text-[9px] font-black text-slate-400">
                                            {montoIngresado > 0 ? Math.round(((dist?.monto || 0) / montoIngresado) * 100) : 0}%
                                        </span>
                                    </div>
                                    <Input 
                                        type="number" 
                                        step="1" 
                                        value={dist?.monto} 
                                        onChange={(e) => handleDistChange(cat.id, e.target.value)}
                                        className="h-8 text-xs font-bold border-slate-200 focus-visible:ring-primary bg-white"
                                    />
                                </div>
                            );
                        })}
                    </div>
                </ScrollArea>

                <div className="mt-6 pt-4 border-t border-slate-200">
                    <Button 
                        onClick={() => onSubmit(formData)} 
                        disabled={montoIngresado <= 0 || saldoPorDistribuir !== 0 || !formData.cajaId}
                        className="w-full h-11 font-black uppercase text-xs bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200/50 disabled:opacity-50"
                    >
                        Confirmar e Inyectar Capital
                    </Button>
                    <p className="text-[8px] font-bold text-slate-400 text-center mt-2 uppercase">El monto total debe estar 100% distribuido</p>
                </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
