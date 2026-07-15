"use client";

import { useState, useEffect } from "react";
import { CRMHeader } from "@/components/crm/crm-header";
import { api } from "@/lib/api";
import { cn, formatCurrency } from "@/lib/utils";
import { Loader2, Plus, Calendar, Settings2, Trash2, Power, Briefcase, Users, Bolt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

interface GastoFijo {
  id: string;
  concepto: string;
  monto: number;
  tipo: string;
  diaMes: number;
  activo: boolean;
  cajaId?: string;
}

export default function PresupuestoClient() {
  const [gastos, setGastos] = useState<GastoFijo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [concepto, setConcepto] = useState("");
  const [monto, setMonto] = useState("");
  const [tipo, setTipo] = useState("");
  const [diaMes, setDiaMes] = useState("");

  const fetchData = async () => {
    try {
      const data = await api.get('/finanzas/gastos-fijos');
      // Sort by diaMes ascending
      const sorted = (data || []).sort((a: GastoFijo, b: GastoFijo) => a.diaMes - b.diaMes);
      setGastos(sorted);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar el presupuesto");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = async () => {
    if (!concepto || !monto || !tipo || !diaMes) {
      toast.error("Completa todos los campos obligatorios");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await api.post('/finanzas/gastos-fijos', {
        concepto,
        monto: Number(monto),
        tipo,
        diaMes: Number(diaMes)
      });
      toast.success("Gasto fijo registrado correctamente");
      setConcepto("");
      setMonto("");
      setTipo("");
      setDiaMes("");
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Error al registrar el gasto");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await api.patch(`/finanzas/gastos-fijos/${id}/toggle`, {});
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Error al cambiar estado");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este gasto fijo del presupuesto?")) return;
    try {
      await api.delete(`/finanzas/gastos-fijos/${id}`);
      toast.success("Eliminado correctamente");
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Error al eliminar");
    }
  };

  // KPIs Calculations
  const activeGastos = gastos.filter(g => g.activo);
  const totalMensual = activeGastos.reduce((sum, g) => sum + Number(g.monto), 0);
  
  const totalPlanilla = activeGastos.filter(g => g.tipo === 'PLANILLA').reduce((sum, g) => sum + Number(g.monto), 0);
  const totalAdministrativo = activeGastos.filter(g => g.tipo === 'ADMINISTRATIVO').reduce((sum, g) => sum + Number(g.monto), 0);
  const totalServicios = activeGastos.filter(g => g.tipo === 'SERVICIOS').reduce((sum, g) => sum + Number(g.monto), 0);

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'PLANILLA': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'ADMINISTRATIVO': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'SERVICIOS': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'ALQUILERES': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'FINANCIERO': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="font-black text-primary uppercase text-xs tracking-[0.2em] animate-pulse">Cargando Presupuesto...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      <CRMHeader 
        title="Presupuesto Operativo" 
        subtitle="Control de gastos fijos mensuales, planillas y obligaciones de la empresa." 
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#001F3F] text-white p-4 rounded-xl border border-blue-900 shadow-md">
          <div className="flex justify-between items-center mb-2">
            <div className="font-black text-[9px] uppercase tracking-widest text-blue-200">Total Fijo Mensual</div>
            <Settings2 className="w-3 h-3 text-blue-300 min-w-3 min-h-3" />
          </div>
          <div className="text-xl font-black truncate" title={formatCurrency(totalMensual)}>{formatCurrency(totalMensual)}</div>
          <div className="text-[10px] font-bold text-blue-300 mt-1">{activeGastos.length} obligaciones activas</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <div className="font-black text-[9px] uppercase tracking-widest text-slate-500">Planilla & Personal</div>
            <Users className="w-3 h-3 text-purple-500 min-w-3 min-h-3" />
          </div>
          <div className="text-lg font-black text-slate-800 truncate" title={formatCurrency(totalPlanilla)}>{formatCurrency(totalPlanilla)}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <div className="font-black text-[9px] uppercase tracking-widest text-slate-500">Administrativos</div>
            <Briefcase className="w-3 h-3 text-blue-500 min-w-3 min-h-3" />
          </div>
          <div className="text-lg font-black text-slate-800 truncate" title={formatCurrency(totalAdministrativo)}>{formatCurrency(totalAdministrativo)}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <div className="font-black text-[9px] uppercase tracking-widest text-slate-500">Servicios & Alquiler</div>
            <Bolt className="w-3 h-3 text-amber-500 min-w-3 min-h-3" />
          </div>
          <div className="text-lg font-black text-slate-800 truncate" title={formatCurrency(totalServicios)}>{formatCurrency(totalServicios)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm sticky top-6">
            <div className="flex items-center gap-2 mb-6">
              <Plus className="w-5 h-5 text-primary" />
              <h3 className="font-black text-xs uppercase tracking-widest text-primary">Nuevo Gasto Fijo</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Concepto</Label>
                <Input 
                  placeholder="Ej. Alquiler de Oficina, Internet..." 
                  value={concepto}
                  onChange={e => setConcepto(e.target.value)}
                  className="font-bold text-sm bg-slate-50/50"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Monto Mensual (S/)</Label>
                <Input 
                  type="number"
                  placeholder="0.00" 
                  value={monto}
                  onChange={e => setMonto(e.target.value)}
                  className="font-black text-sm text-emerald-600 bg-slate-50/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Día de Cobro</Label>
                  <Select value={diaMes} onValueChange={(val) => setDiaMes(val || "")}>
                    <SelectTrigger className="font-bold text-sm bg-slate-50/50">
                      <SelectValue placeholder="Día" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({length: 31}, (_, i) => i + 1).map(day => (
                        <SelectItem key={day} value={day.toString()} className="font-bold">
                          Día {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Categoría</Label>
                  <Select value={tipo} onValueChange={(val) => setTipo(val || "")}>
                    <SelectTrigger className="font-bold text-sm text-[10px] uppercase bg-slate-50/50">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PLANILLA" className="font-bold text-[10px] uppercase">Planilla</SelectItem>
                      <SelectItem value="ADMINISTRATIVO" className="font-bold text-[10px] uppercase">Administrativo</SelectItem>
                      <SelectItem value="SERVICIOS" className="font-bold text-[10px] uppercase">Servicios</SelectItem>
                      <SelectItem value="ALQUILERES" className="font-bold text-[10px] uppercase">Alquileres</SelectItem>
                      <SelectItem value="FINANCIERO" className="font-bold text-[10px] uppercase">Financiero (Préstamos)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                className="w-full h-12 mt-4 font-black text-[10px] uppercase tracking-widest gap-2 bg-[#001F3F] hover:bg-[#003366] text-white"
                onClick={handleAdd}
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Registrar Obligación
              </Button>
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="font-black text-xs uppercase tracking-widest text-slate-700 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Cronograma de Pagos Fijos
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow>
                    <TableHead className="font-black text-[9px] uppercase tracking-widest text-slate-500 w-16 text-center">Día</TableHead>
                    <TableHead className="font-black text-[9px] uppercase tracking-widest text-slate-500">Concepto</TableHead>
                    <TableHead className="font-black text-[9px] uppercase tracking-widest text-slate-500">Categoría</TableHead>
                    <TableHead className="font-black text-[9px] uppercase tracking-widest text-slate-500 text-right">Monto</TableHead>
                    <TableHead className="font-black text-[9px] uppercase tracking-widest text-slate-500 text-center">Estado</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gastos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-slate-400 font-bold text-xs uppercase">
                        No hay gastos fijos registrados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    gastos.map((gasto) => (
                      <TableRow key={gasto.id} className={cn("transition-colors", !gasto.activo && "opacity-50 bg-slate-50")}>
                        <TableCell className="text-center border-r border-slate-100">
                          <div className="inline-flex flex-col items-center justify-center w-10 h-10 rounded-xl bg-slate-100 text-slate-700">
                            <span className="text-[9px] font-black uppercase text-slate-400 -mb-1">Día</span>
                            <span className="text-sm font-black">{gasto.diaMes}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={cn("font-black text-xs uppercase", gasto.activo ? "text-slate-700" : "text-slate-500")}>
                            {gasto.concepto}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("text-[9px] uppercase font-black px-2 py-0.5", getTipoColor(gasto.tipo))}>
                            {gasto.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={cn("font-black text-sm", gasto.activo ? "text-orange-600" : "text-slate-400")}>
                            {formatCurrency(gasto.monto)}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Switch 
                              checked={gasto.activo} 
                              onCheckedChange={() => handleToggle(gasto.id)}
                            />
                            <span className={cn("text-[9px] font-black uppercase w-12 text-left", gasto.activo ? "text-emerald-600" : "text-slate-400")}>
                              {gasto.activo ? 'ACTIVO' : 'INACTIVO'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            onClick={() => handleDelete(gasto.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
