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
      // Mostrar todo el flujo de Horas Extras de Operaciones
      const solicitudes = data.filter((g: any) => 
        g.tipo === "PLANILLA" && 
        (g.concepto.includes("[RRHH-REVISION]") || g.concepto.includes("[RRHH-APROBADO]") || g.concepto.includes("[RRHH-RECHAZADO]"))
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

  const handleAction = async (gasto: any, isApprove: boolean) => {
    setActionLoading(gasto.id);
    try {
      if (isApprove) {
        await api.patch(`/finanzas/gastos/${gasto.id}`, {
          concepto: gasto.concepto.replace("[RRHH-REVISION]", "[RRHH-APROBADO]"),
          estado: "PENDIENTE"
        });
        toast.success("Solicitud aprobada y enviada a Finanzas.");
      } else {
        await api.patch(`/finanzas/gastos/${gasto.id}`, {
          estado: "ANULADO",
          concepto: gasto.concepto.replace("[RRHH-REVISION]", "[RRHH-RECHAZADO]"),
        });
        toast.success("Solicitud rechazada.");
      }
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

      {/* VISTA MÓVIL (Tarjetas) */}
      <div className="block md:hidden space-y-4">
        {loading ? (
            <div className="text-center py-10"><Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" /></div>
        ) : gastos.length === 0 ? (
            <div className="text-center py-10 text-slate-500 font-bold uppercase text-[10px]">No hay solicitudes pendientes de revisión.</div>
        ) : (
            gastos.map((g) => {
                const isRevision = g.concepto.includes("[RRHH-REVISION]");
                const isAprobado = g.concepto.includes("[RRHH-APROBADO]");
                const isRechazado = g.concepto.includes("[RRHH-RECHAZADO]");
                const cleanConcepto = g.concepto.replace("[RRHH-REVISION] ", "").replace("[RRHH-APROBADO] ", "").replace("[RRHH-RECHAZADO] ", "");
                
                return (
                    <div key={g.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-3 relative">
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">{new Date(g.fechaEmision).toLocaleDateString('es-PE', { timeZone: 'UTC' })}</span>
                            <span className="font-black text-sm text-slate-700 uppercase leading-tight">{cleanConcepto}</span>
                        </div>
                        <p className="text-[10px] text-slate-600 uppercase font-medium">{g.justificacion}</p>
                        <div className="grid grid-cols-2 gap-2 mt-1 pt-2 border-t border-slate-50">
                            <div className="flex flex-col gap-1">
                                <span className="text-[9px] font-black uppercase text-slate-500">Monto (S/.)</span>
                                {Number(g.montoTotal) === 0 ? (
                                    <span className="text-slate-400 italic font-normal text-[10px]">Por definir</span>
                                ) : (
                                    <span className="font-black text-sm text-slate-800">S/. {Number(g.montoTotal).toFixed(2)}</span>
                                )}
                            </div>
                            <div className="flex flex-col items-end gap-1 justify-center">
                                {isRevision ? (
                                    <div className="flex gap-2">
                                        <Button size="icon" variant="outline" className="h-7 w-7 bg-emerald-50 text-emerald-600 border-emerald-200" onClick={() => handleAction(g, true)} disabled={actionLoading === g.id}>{actionLoading === g.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}</Button>
                                        <Button size="icon" variant="outline" className="h-7 w-7 bg-red-50 text-red-600 border-red-200" onClick={() => handleAction(g, false)} disabled={actionLoading === g.id}>{actionLoading === g.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-4 h-4" />}</Button>
                                    </div>
                                ) : isAprobado ? (
                                    <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 text-[8px] uppercase font-black"><CheckCircle2 className="w-3 h-3 mr-1" /> Aprobado</Badge>
                                ) : (
                                    <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 text-[8px] uppercase font-black"><XCircle className="w-3 h-3 mr-1" /> Rechazado</Badge>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })
        )}
      </div>

      {/* VISTA PC */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
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
                  No hay solicitudes pendientes de revisión.
                </TableCell>
              </TableRow>
            ) : (
              gastos.map((g) => {
                const isRevision = g.concepto.includes("[RRHH-REVISION]");
                const isAprobado = g.concepto.includes("[RRHH-APROBADO]");
                const isRechazado = g.concepto.includes("[RRHH-RECHAZADO]");
                const cleanConcepto = g.concepto.replace("[RRHH-REVISION] ", "").replace("[RRHH-APROBADO] ", "").replace("[RRHH-RECHAZADO] ", "");
                
                return (
                <TableRow key={g.id}>
                  <TableCell className="font-medium">
                    {new Date(g.fechaEmision).toLocaleDateString('es-PE', { timeZone: 'UTC' })}
                  </TableCell>
                  <TableCell className="font-semibold text-slate-700">
                    {cleanConcepto}
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {g.justificacion}
                  </TableCell>
                  <TableCell className="font-bold text-slate-800">
                    {Number(g.montoTotal) === 0 ? (
                      <span className="text-slate-400 italic font-normal text-xs">Por definir</span>
                    ) : (
                      `S/. ${Number(g.montoTotal).toFixed(2)}`
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {isRevision ? (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
                          onClick={() => handleAction(g, true)}
                          disabled={actionLoading === g.id}
                        >
                          {actionLoading === g.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
                          Aprobar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                          onClick={() => handleAction(g, false)}
                          disabled={actionLoading === g.id}
                        >
                          {actionLoading === g.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4 mr-1" />}
                          Rechazar
                        </Button>
                      </div>
                    ) : isAprobado ? (
                      <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Aprobado
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
                        <XCircle className="w-3 h-3 mr-1" /> Rechazado
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
