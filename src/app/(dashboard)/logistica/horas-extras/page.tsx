"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function SolicitudesRRHH() {
  const [gastos, setGastos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/finanzas/gastos?limit=500');
      const data = Array.isArray(res) ? res : (res.data || []);
      // Filtrar los que son de tipo PLANILLA y están en estado SOLICITADO
      const solicitudes = data.filter((g: any) => 
        g.tipo === "PLANILLA" && 
        g.concepto.includes("Solicitud Horas Extras") &&
        g.estado === "SOLICITADO"
      );
      setGastos(solicitudes);
    } catch (e) {
      console.error(e);
      toast.error("Error al cargar solicitudes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = async (id: string, nuevoEstado: string) => {
    setActionLoading(id);
    try {
      await api.patch(`/finanzas/gastos/${id}`, {
        estado: nuevoEstado,
        // Al aprobar, Finanzas lo verá como PENDIENTE de pago
      });
      toast.success(`Solicitud ${nuevoEstado === 'PENDIENTE' ? 'aprobada' : 'rechazada'}`);
      fetchData();
    } catch (e: any) {
      toast.error(e.message || "Error al actualizar estado");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Solicitudes de RRHH</h1>
          <p className="text-sm text-slate-500">Revisa y aprueba las horas extras solicitadas por el personal de Operaciones.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha Solic.</TableHead>
              <TableHead>Trabajador / Concepto</TableHead>
              <TableHead>Justificación</TableHead>
              <TableHead>Monto (S/.)</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
                </TableCell>
              </TableRow>
            ) : gastos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-slate-500">
                  No hay solicitudes pendientes por revisar.
                </TableCell>
              </TableRow>
            ) : (
              gastos.map((g) => (
                <TableRow key={g.id}>
                  <TableCell className="font-medium">
                    {new Date(g.fechaEmision).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="mb-1">{g.concepto}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {g.justificacion}
                  </TableCell>
                  <TableCell className="font-bold text-slate-700">
                    S/. {Number(g.montoTotal).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-50"
                        disabled={actionLoading === g.id}
                        onClick={() => handleAction(g.id, "ANULADO")}
                      >
                        {actionLoading === g.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4 mr-1" />}
                        Rechazar
                      </Button>
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700"
                        disabled={actionLoading === g.id}
                        onClick={() => handleAction(g.id, "PENDIENTE")}
                      >
                        {actionLoading === g.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
                        Aprobar para Pago
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
