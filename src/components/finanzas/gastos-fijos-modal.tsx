"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Trash2, Wallet, Plus, Loader2 } from "lucide-react";

interface GastosFijosModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TIPOS_GASTO = [
  { value: "OPERATIVO", label: "Operativo" },
  { value: "ADMINISTRATIVO", label: "Administrativo" },
  { value: "FINANCIERO", label: "Financiero" },
  { value: "PERSONAL", label: "Personal" },
  { value: "SERVICIOS", label: "Servicios" },
  { value: "VIATICOS", label: "Viáticos" },
];

export function GastosFijosModal({ open, onOpenChange }: GastosFijosModalProps) {
  const [gastosFijos, setGastosFijos] = useState<any[]>([]);
  const [cajas, setCajas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [concepto, setConcepto] = useState("");
  const [monto, setMonto] = useState("");
  const [tipo, setTipo] = useState("ADMINISTRATIVO");
  const [diaMes, setDiaMes] = useState("1");
  const [cajaId, setCajaId] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [gastosRes, cajasRes] = await Promise.all([
        api.get("/finanzas/gastos-fijos"),
        api.get("/finanzas/cajas"),
      ]);
      setGastosFijos(gastosRes);
      setCajas(cajasRes);
      if (cajasRes && cajasRes.length > 0) {
        setCajaId(cajasRes[0].id);
      }
    } catch (e) {
      toast.error("Error al cargar configuración de gastos fijos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const handleAdd = async () => {
    const valMonto = parseFloat(monto);
    if (!concepto.trim() || isNaN(valMonto) || valMonto <= 0) {
      toast.error("Por favor ingrese un concepto y monto válido.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/finanzas/gastos-fijos", {
        concepto: concepto.trim(),
        monto: valMonto,
        tipo,
        diaMes: parseInt(diaMes, 10),
        cajaId: cajaId || null,
      });
      toast.success("Gasto recurrente programado con éxito.");
      setConcepto("");
      setMonto("");
      loadData();
    } catch (e) {
      toast.error("Error al programar el gasto recurrente.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await api.patch(`/finanzas/gastos-fijos/${id}/toggle`, {});
      loadData();
      toast.success("Estado del gasto recurrente actualizado.");
    } catch (e) {
      toast.error("No se pudo actualizar el estado.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de que desea eliminar este gasto fijos mensual?")) return;
    try {
      await api.delete(`/finanzas/gastos-fijos/${id}`);
      loadData();
      toast.success("Gasto fijo recurrente eliminado.");
    } catch (e) {
      toast.error("No se pudo eliminar el gasto fijo.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 border-none bg-slate-50 flex flex-col rounded-2xl shadow-2xl overflow-hidden max-h-[85vh]">
        <DialogHeader className="p-5 bg-[#001F3F] text-white shrink-0">
          <DialogTitle className="text-sm font-black uppercase flex items-center gap-2">
            <Wallet className="w-4 h-4 text-amber-400" /> Gastos Fijos Mensuales (Recurrentes)
          </DialogTitle>
          <p className="text-[10px] text-slate-300 font-medium">Configure gastos que se generan automáticamente cada mes.</p>
        </DialogHeader>

        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {/* FORMULARIO DE AGREGAR */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
              Programar Nuevo Gasto Fijo
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
              <div className="md:col-span-2">
                <Label className="text-[9px] font-black uppercase text-slate-400">Concepto / Nombre *</Label>
                <Input
                  placeholder="Ej. Alquiler de Local"
                  value={concepto}
                  onChange={(e) => setConcepto(e.target.value)}
                  className="h-9 mt-1 text-xs font-bold"
                />
              </div>

              <div>
                <Label className="text-[9px] font-black uppercase text-slate-400">Monto S/ *</Label>
                <Input
                  type="text"
                  placeholder="0.00"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value.replace(/[^0-9.]/g, ""))}
                  className="h-9 mt-1 text-xs font-mono font-bold"
                />
              </div>

              <div>
                <Label className="text-[9px] font-black uppercase text-slate-400">Tipo de Gasto</Label>
                <Select value={tipo} onValueChange={(val) => setTipo(val || "ADMINISTRATIVO")}>
                  <SelectTrigger className="h-9 mt-1 text-xs font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {TIPOS_GASTO.map((t) => (
                      <SelectItem key={t.value} value={t.value} className="text-xs font-bold">
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-[9px] font-black uppercase text-slate-400">Día de Pago (Mensual)</Label>
                <Select value={diaMes} onValueChange={(val) => setDiaMes(val || "1")}>
                  <SelectTrigger className="h-9 mt-1 text-xs font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white max-h-[200px] overflow-y-auto">
                    {Array.from({ length: 28 }).map((_, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)} className="text-xs font-bold">
                        Día {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <Label className="text-[9px] font-black uppercase text-slate-400">Caja de Origen (Por defecto)</Label>
                <Select value={cajaId} onValueChange={(val) => setCajaId(val || "")}>
                  <SelectTrigger className="h-9 mt-1 text-xs font-bold">
                    <SelectValue placeholder="Seleccione cuenta...">
                      {cajas.find((c) => c.id === cajaId)?.nombre || "Seleccione cuenta..."}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {cajas.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-xs font-bold">
                        {c.nombre} (S/ {Number(c.saldoReal).toLocaleString()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-3">
                <Button
                  onClick={handleAdd}
                  disabled={submitting}
                  className="w-full h-9 gap-2 text-xs font-black uppercase bg-primary hover:bg-primary/90 text-white rounded-lg shadow-md"
                >
                  {submitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  Programar Gasto Fijo
                </Button>
              </div>
            </div>
          </div>

          {/* LISTADO DE PROGRAMADOS */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-black text-[9px] uppercase pl-4">Concepto</TableHead>
                  <TableHead className="font-black text-[9px] uppercase text-center">Frecuencia</TableHead>
                  <TableHead className="font-black text-[9px] uppercase text-right">Monto S/.</TableHead>
                  <TableHead className="font-black text-[9px] uppercase text-center">Caja Def.</TableHead>
                  <TableHead className="font-black text-[9px] uppercase text-center">Activo</TableHead>
                  <TableHead className="w-[50px] pr-4"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      <Loader2 className="w-6 h-6 text-slate-300 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : gastosFijos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-[10px] font-bold text-slate-400 italic">
                      No hay gastos fijos programados.
                    </TableCell>
                  </TableRow>
                ) : (
                  gastosFijos.map((g) => {
                    const cajaName = cajas.find((c) => c.id === g.cajaId)?.nombre || "Ninguna";
                    return (
                      <TableRow key={g.id} className="hover:bg-slate-50/50">
                        <TableCell className="pl-4 font-bold text-xs text-slate-800">
                          <p>{g.concepto}</p>
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">
                            {g.tipo}
                          </span>
                        </TableCell>
                        <TableCell className="text-center font-bold text-xs text-slate-600">
                          Cada día {g.diaMes} del mes
                        </TableCell>
                        <TableCell className="text-right font-black text-xs text-red-600 font-mono">
                          S/ {Number(g.monto).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-center text-xs font-semibold text-slate-500">
                          {cajaName}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center">
                            <Switch checked={g.activo} onCheckedChange={() => handleToggle(g.id)} />
                          </div>
                        </TableCell>
                        <TableCell className="pr-4 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                            onClick={() => handleDelete(g.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
