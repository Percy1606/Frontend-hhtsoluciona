"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { useOperacionesStore } from "@/store/operaciones-store";
import { Loader2, Upload, CheckCircle2, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

interface CajaChicaGastoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultProyectoId?: string;
}

export function CajaChicaGastoModal({
  isOpen,
  onClose,
  onSuccess,
  defaultProyectoId,
}: CajaChicaGastoModalProps) {
  const { user } = useAuthStore();
  const { proyectos, fetchProyectos } = useOperacionesStore();

  const [cajaUsuario, setCajaUsuario] = useState<any>(null);
  const [loadingCaja, setLoadingCaja] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [comprobanteUrl, setComprobanteUrl] = useState<string>("");

  const form = useForm({
    defaultValues: {
      concepto: "",
      montoTotal: 0,
      proyectoId: defaultProyectoId || "none",
      tipoComprobante: "BOLETA",
      justificacion: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      fetchProyectos();
      fetchUserCaja();
      form.reset({
        concepto: "",
        montoTotal: 0,
        proyectoId: defaultProyectoId || "none",
        tipoComprobante: "BOLETA",
        justificacion: "",
      });
      setComprobanteUrl("");
    }
  }, [isOpen, defaultProyectoId]);

  const fetchUserCaja = async () => {
    setLoadingCaja(true);
    try {
      const res = await api.get("/finanzas/cajas");
      const list = Array.isArray(res) ? res : res?.data || [];
      const userName = (user?.nombre || "").toLowerCase();

      let found = null;
      if (userName.includes("steven")) {
        found = list.find((c: any) => c.nombre.toLowerCase().includes("steven"));
      } else if (userName.includes("mario")) {
        found = list.find((c: any) => c.nombre.toLowerCase().includes("mario"));
      } else {
        found = list.find((c: any) => c.nombre.toLowerCase().includes("chica")) || list[0];
      }
      setCajaUsuario(found);
    } catch (e) {
      console.error("Error al obtener caja chica:", e);
    } finally {
      setLoadingCaja(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post("/operaciones/upload", formData);
      setComprobanteUrl(res.url);
      toast.success("Foto / Documento adjuntado correctamente");
    } catch (error) {
      console.error("Error subiendo comprobante:", error);
      toast.error("No se pudo subir el archivo comprobante");
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (values: any) => {
    if (!cajaUsuario) {
      toast.error("No se detectó la Caja Chica del usuario.");
      return;
    }

    const monto = Number(values.montoTotal);
    if (!monto || monto <= 0) {
      toast.error("Ingresa un monto válido mayor a cero.");
      return;
    }

    if (!values.concepto || values.concepto.trim().length < 3) {
      toast.error("El concepto del gasto es obligatorio.");
      return;
    }

    const saldoDisp = Number(cajaUsuario.saldoDisponible || cajaUsuario.saldoReal || 0);
    if (monto > saldoDisp) {
      toast.error(`Saldo insuficiente en tu caja chica. Disponible: S/ ${saldoDisp.toFixed(2)}`);
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        concepto: values.concepto,
        montoTotal: monto,
        proyectoId: values.proyectoId === "none" ? null : values.proyectoId,
        cajaId: cajaUsuario.id,
        tipo: "OPERATIVO",
        clasificacion: "COSTO_DIRECTO",
        tipoComprobante: values.tipoComprobante,
        fechaEmision: new Date().toISOString().split("T")[0],
        comprobanteUrl: comprobanteUrl || null,
        justificacion: `[CAJA CHICA - ${user?.nombre || "USUARIO"}] ${values.justificacion || values.concepto}`,
        estado: "PAGADO",
        area: user?.nombre?.toLowerCase().includes("steven") ? "LOGISTICA" : "OPERACIONES",
      };

      await api.post("/finanzas/gastos", payload);
      toast.success("Gasto de Caja Chica registrado exitosamente.");
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error("Error guardando gasto de caja chica:", err);
      toast.error(err.message || "Error al registrar el gasto de caja chica.");
    } finally {
      setSubmitting(false);
    }
  };

  const montoActual = Number(form.watch("montoTotal") || 0);
  const saldoDisponible = Number(cajaUsuario?.saldoDisponible || cajaUsuario?.saldoReal || 0);
  const saldoFinalProyectado = saldoDisponible - montoActual;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-white p-6 rounded-2xl border border-slate-200 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-black uppercase text-slate-900">
                Registrar Gasto de Caja Chica
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 font-bold">
                {cajaUsuario ? (
                  <span>
                    Cuenta: <strong className="text-slate-800 uppercase">{cajaUsuario.nombre}</strong> (Fondo Fijo)
                  </span>
                ) : (
                  "Cargando cuenta de usuario..."
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {cajaUsuario && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs font-bold">
            <div>
              <p className="text-[9px] uppercase text-slate-400 font-black">Efectivo Disponible</p>
              <p className="text-emerald-700 font-black text-sm">
                S/ {saldoDisponible.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
              </p>
            </div>
            {montoActual > 0 && (
              <div className="text-right">
                <p className="text-[9px] uppercase text-slate-400 font-black">Quedará en Caja</p>
                <p className={cn("font-black text-sm", saldoFinalProyectado < 0 ? "text-red-600" : "text-slate-700")}>
                  S/ {saldoFinalProyectado.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                </p>
              </div>
            )}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3.5 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="montoTotal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase text-slate-500">Monto Gastado (S/) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="h-10 font-black text-base border-slate-200 bg-white"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tipoComprobante"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase text-slate-500">Comprobante *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-10 text-xs font-bold border-slate-200">
                          <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white">
                        <SelectItem value="BOLETA" className="text-xs font-bold">BOLETA</SelectItem>
                        <SelectItem value="FACTURA" className="text-xs font-bold">FACTURA</SelectItem>
                        <SelectItem value="RECIBO" className="text-xs font-bold">RECIBO / TICKET</SelectItem>
                        <SelectItem value="DECLARACION_JURADA" className="text-xs font-bold">DECLARACION JURADA</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="concepto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase text-slate-500">Concepto / Motivo del Gasto *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: Taxi a obra Parachique / Compra de pernos / Almuerzo técnico"
                      className="h-10 text-xs font-bold border-slate-200 bg-white"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="proyectoId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase text-slate-500">¿Es de algún Proyecto / OS?</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-10 text-xs font-bold border-slate-200">
                        <SelectValue placeholder="Seleccionar Proyecto u Operación General" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white max-h-56">
                      <SelectItem value="none" className="text-xs font-bold text-slate-500 py-2">
                        [GASTO GENERAL] No pertenece a ningún proyecto
                      </SelectItem>
                      {proyectos.map((p) => (
                        <SelectItem key={p.id} value={p.id} className="text-xs font-bold py-2 border-b last:border-none">
                          <span className="font-black text-primary uppercase">{p.codigo || "PROY"}</span> - {p.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                Foto de Boleta / Ticket (Sustento)
              </label>
              <div className="flex items-center gap-2">
                <label className="flex-1 flex items-center justify-center gap-2 h-10 border border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors text-xs font-bold text-slate-600">
                  <Upload className="w-4 h-4 text-slate-400" />
                  <span>{comprobanteUrl ? "Comprobante Adjunto" : "Subir Foto / PDF"}</span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                  />
                </label>
                {isUploading && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                {comprobanteUrl && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              </div>
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button type="button" variant="outline" className="h-10 text-xs font-bold rounded-xl" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={submitting || isUploading || !cajaUsuario}
                className="h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...
                  </>
                ) : (
                  "Guardar Gasto en Caja Chica"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}