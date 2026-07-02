"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Loader2, Plus, Clock, CheckCircle2, AlertCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function MisHorasExtras() {
  const { user } = useAuthStore();
  const [gastos, setGastos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    montoTotal: "",
    fechaEmision: new Date().toISOString().split("T")[0],
    justificacion: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/finanzas/gastos?limit=500');
      const data = Array.isArray(res) ? res : (res.data || []);
      // Filtrar los que son de tipo PLANILLA y de este usuario
      const misExtras = data.filter((g: any) => 
        g.tipo === "PLANILLA" && 
        g.concepto.includes("Horas Extras") &&
        g.concepto.includes(user?.nombre || "")
      );
      setGastos(misExtras);
    } catch (e) {
      console.error(e);
      toast.error("Error al cargar solicitudes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.nombre]);

  const handleSubmit = async () => {
    if (!formData.montoTotal || !formData.justificacion) {
      toast.error("Complete el monto y la justificación.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/finanzas/gastos", {
        tipo: "PLANILLA",
        clasificacion: "PROYECTO",
        concepto: `[RRHH-REVISION] Horas Extras - ${user?.nombre || "Usuario"}`,
        montoTotal: Number(formData.montoTotal),
        estado: "PENDIENTE",
        fechaEmision: formData.fechaEmision,
        area: "LogisticaYRecursos",
        justificacion: formData.justificacion,
        proyectoId: null,
      });
      toast.success("Solicitud enviada a Logística.");
      setIsModalOpen(false);
      setFormData({ ...formData, montoTotal: "", justificacion: "" });
      fetchData();
    } catch (e: any) {
      toast.error(e.message || "Error al solicitar horas extras");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (g: any) => {
    try {
      await api.patch(`/finanzas/gastos/${g.id}`, { 
        estado: "ANULADO", 
        concepto: g.concepto.replace("[RRHH-REVISION]", "[CANCELADO]") 
      });
      toast.success("Solicitud cancelada correctamente.");
      fetchData();
    } catch (e: any) {
      toast.error(e.message || "Error al eliminar la solicitud.");
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Mis Horas Extras</h1>
          <p className="text-sm text-slate-500">Solicita a Logística el pago de tus horas adicionales o trabajos extra.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-amber-600 hover:bg-amber-700">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Solicitud
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Concepto / Detalle</TableHead>
              <TableHead>Monto (S/.)</TableHead>
              <TableHead>Estado</TableHead>
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
                  No tienes solicitudes de horas extras registradas.
                </TableCell>
              </TableRow>
            ) : (
              gastos.map((g) => {
                const enRevision = g.concepto.includes("[RRHH-REVISION]");
                return (
                  <TableRow key={g.id}>
                    <TableCell className="font-medium">
                      {new Date(g.fechaEmision).toLocaleDateString('es-PE', { timeZone: 'UTC' })}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-slate-800">{g.concepto.replace("[RRHH-REVISION] ", "").replace("[RRHH-APROBADO] ", "")}</p>
                      <p className="text-xs text-slate-500">{g.justificacion}</p>
                    </TableCell>
                    <TableCell className="font-bold text-slate-700">
                      S/. {Number(g.montoTotal).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {enRevision ? (
                        <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">
                          <Clock className="w-3 h-3 mr-1" /> En Revisión (Logística)
                        </Badge>
                      ) : g.estado === "PAGADO" ? (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Pagado
                        </Badge>
                      ) : g.concepto.includes("[RRHH-APROBADO]") ? (
                        <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Aprobado, Pendiente de Pago
                        </Badge>
                      ) : (
                        <Badge variant="outline">{g.estado}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {enRevision && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(g)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-sm bg-white">
          <DialogHeader>
            <DialogTitle>Solicitar Pago Extra</DialogTitle>
            <DialogDescription>
              Esta solicitud pasará primero a revisión por Logística.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1.5 block">Fecha de la actividad</label>
              <Input type="date" value={formData.fechaEmision} onChange={(e) => setFormData({ ...formData, fechaEmision: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1.5 block">Monto a solicitar (S/.)</label>
              <Input type="number" step="0.01" min="0" placeholder="Ej: 50.00" value={formData.montoTotal} onChange={(e) => setFormData({ ...formData, montoTotal: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1.5 block">Sustento / Justificación</label>
              <Input placeholder="Ej: Feriado trabajado en el proyecto X" value={formData.justificacion} onChange={(e) => setFormData({ ...formData, justificacion: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-amber-600 hover:bg-amber-700">
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Enviar Solicitud
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
