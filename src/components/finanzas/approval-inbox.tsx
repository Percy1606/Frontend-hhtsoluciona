"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Loader2, CheckCircle, XCircle, AlertTriangle, User, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { Gasto } from "@/types/finanzas";

export function ApprovalInbox() {
  const [pendientes, setPendientes] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/finanzas/aprobaciones/pendientes");
      setPendientes(res.data || res);
    } catch (e) {
      console.error("Error fetching pending approvals", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApproval = async (id: string, estado: "APROBADO" | "RECHAZADO") => {
    try {
      await api.post(`/finanzas/gastos/${id}/aprobar-config`, { estado });
      toast.success(estado === "APROBADO" ? "Gasto aprobado exitosamente" : "Gasto rechazado");
      fetchData();
    } catch (error: any) {
      toast.error("Error al procesar la aprobación", { description: error.message });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-amber-100 bg-amber-50/20">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl font-black text-amber-700 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> Bandeja de Aprobaciones
            </CardTitle>
            <p className="text-xs font-bold text-amber-600/70 uppercase tracking-widest mt-1">
              Tienes {pendientes.length} solicitudes esperando tu validación
            </p>
          </div>
          <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">
            Pendientes: {pendientes.length}
          </Badge>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-amber-100">
                <TableHead className="text-[10px] font-black uppercase text-amber-700">Solicitante / Proyecto</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-amber-700">Concepto</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-amber-700 text-right">Monto</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-amber-700 text-center">Nivel</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-amber-700 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendientes.map((g) => (
                <TableRow key={g.id} className="border-amber-50 hover:bg-amber-50/50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="bg-amber-100 p-2 rounded-full">
                        <User className="w-3.5 h-3.5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-primary uppercase">Solicitud Operativa</p>
                        <p className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                          <Briefcase className="w-2.5 h-2.5" /> {g.proyecto?.nombre || "Sin Proyecto"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[300px]">
                      <p className="text-xs font-bold text-primary truncate">{g.concepto}</p>
                      <p className="text-[9px] text-muted-foreground uppercase font-black tracking-tighter">
                        {g.tipo} • {formatDate(g.fechaEmision)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-sm font-black text-primary">
                      {formatCurrency(g.montoTotal)}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="text-[9px] font-black border-amber-200 text-amber-600 uppercase">
                      Lvl {g.nivelActual || 1}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-3 text-[10px] font-black border-red-200 text-red-600 hover:bg-red-50"
                        onClick={() => handleApproval(g.id, "RECHAZADO")}
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" /> RECHAZAR
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 px-4 text-[10px] font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-100"
                        onClick={() => handleApproval(g.id, "APROBADO")}
                      >
                        <CheckCircle className="w-3.5 h-3.5 mr-1" /> APROBAR
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {pendientes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center py-10">
                    <div className="flex flex-col items-center justify-center opacity-40">
                      <CheckCircle className="w-10 h-10 text-emerald-500 mb-2" />
                      <p className="text-xs font-black uppercase tracking-widest text-primary">Todo al día</p>
                      <p className="text-[10px] font-bold text-muted-foreground mt-1">No hay solicitudes pendientes de aprobación.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
