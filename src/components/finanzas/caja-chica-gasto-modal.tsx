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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { useOperacionesStore } from "@/store/operaciones-store";
import { Loader2, Upload, CheckCircle2, Wallet, ChevronsUpDown, Check, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

interface CajaChicaGastoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultProyectoId?: string;
  moduloOrigen?: "logistica" | "operaciones";
}

export function CajaChicaGastoModal({
  isOpen,
  onClose,
  onSuccess,
  defaultProyectoId,
  moduloOrigen,
}: CajaChicaGastoModalProps) {
  const { user } = useAuthStore();
  const { proyectos, fetchProyectos } = useOperacionesStore();

  const [cajaUsuario, setCajaUsuario] = useState<any>(null);
  const [loadingCaja, setLoadingCaja] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [comprobanteUrl, setComprobanteUrl] = useState<string>("");
  const [openProjectCombobox, setOpenProjectCombobox] = useState(false);

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
      setOpenProjectCombobox(false);
    }
  }, [isOpen, defaultProyectoId, moduloOrigen]);

  const fetchUserCaja = async () => {
    setLoadingCaja(true);
    try {
      const res = await api.get("/finanzas/cajas");
      const list = Array.isArray(res) ? res : res?.data || [];
      const userName = (user?.nombre || "").toLowerCase();

      let found = null;

      // 1. Si se invoca desde el módulo de Logística -> Siempre Caja Chica - Steven
      if (moduloOrigen === "logistica") {
        found = list.find((c: any) => c.nombre.toLowerCase().includes("steven"));
      } 
      // 2. Si se invoca desde el módulo de Operaciones -> Siempre Caja Chica - Mario
      else if (moduloOrigen === "operaciones") {
        found = list.find((c: any) => c.nombre.toLowerCase().includes("mario"));
      } 
      // 3. Fallback por nombre de usuario logueado
      else if (userName.includes("steven")) {
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
      toast.error("No se detectó la Caja Chica correspondiente.");
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
      toast.error(`Saldo insuficiente en ${cajaUsuario.nombre}. Disponible: S/ ${saldoDisp.toFixed(2)}`);
      return;
    }

    try {
      setSubmitting(true);

      const areaAsignada = moduloOrigen === "logistica" || cajaUsuario.nombre.toLowerCase().includes("steven")
        ? "LOGISTICA"
        : "OPERACIONES";

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
        justificacion: `[${cajaUsuario.nombre.toUpperCase()}] ${values.justificacion || values.concepto}`,
        estado: "PAGADO",
        area: areaAsignada,
      };

      await api.post("/finanzas/gastos", payload);
      toast.success(`Gasto registrado en ${cajaUsuario.nombre}.`);
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
  const selectedProyectoId = form.watch("proyectoId");
  const selectedProjectObj = proyectos.find((p) => p.id === selectedProyectoId);
  const saldoDisponible = Number(cajaUsuario?.saldoDisponible || cajaUsuario?.saldoReal || 0);
  const saldoFinalProyectado = saldoDisponible - montoActual;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg w-full min-w-0 overflow-hidden bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-2xl box-border">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-base font-black uppercase text-slate-900 truncate">
                Registrar Gasto de Caja Chica
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 font-bold truncate">
                {cajaUsuario ? (
                  <span>
                    Cuenta asignada: <strong className="text-slate-800 uppercase">{cajaUsuario.nombre}</strong> (Fondo Fijo)
                  </span>
                ) : (
                  "Cargando cuenta asignada..."
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {cajaUsuario && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs font-bold w-full min-w-0 box-border">
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3.5 mt-2 w-full min-w-0 box-border">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full min-w-0 box-border">
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

            {/* SELECTOR DE PROYECTO COMPACTO Y MODERNO */}
            <FormField
              control={form.control}
              name="proyectoId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-[10px] font-black uppercase text-slate-500">¿Es de algún Proyecto / OS?</FormLabel>
                  <Popover open={openProjectCombobox} onOpenChange={setOpenProjectCombobox}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openProjectCombobox}
                          className={cn(
                            "w-full max-w-full min-w-0 justify-between h-11 px-3 border rounded-xl text-left font-bold transition-all bg-white overflow-hidden",
                            field.value && field.value !== "none"
                              ? "border-primary/40 bg-primary/5 text-primary"
                              : "border-slate-200 text-slate-700"
                          )}
                        >
                          <div className="flex items-center gap-2 truncate min-w-0 max-w-[calc(100%-20px)] flex-1 overflow-hidden">
                            {field.value && field.value !== "none" && selectedProjectObj ? (() => {
                              const osCodigo = (selectedProjectObj as any).ordenesDeServicio?.[0]?.codigo || selectedProjectObj.codigo || "PROY";
                              const clienteEmpresa = (selectedProjectObj as any).cliente?.empresa || (selectedProjectObj as any).cliente?.nombre || (selectedProjectObj as any).cliente?.razonSocial || (selectedProjectObj as any).clienteNombre || "";
                              return (
                                <div className="flex items-center gap-2 truncate min-w-0 max-w-full overflow-hidden">
                                  <span className="font-black text-primary text-[11px] shrink-0 px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20">
                                    {osCodigo}
                                  </span>
                                  <span className="text-xs text-slate-800 truncate font-bold min-w-0 max-w-full">
                                    {selectedProjectObj.nombre} {clienteEmpresa ? `(${clienteEmpresa})` : ''}
                                  </span>
                                </div>
                              );
                            })() : (
                              <span className="text-xs font-bold text-slate-500 truncate min-w-0">
                                [GASTO GENERAL] No pertenece a ningún proyecto
                              </span>
                            )}
                          </div>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-40" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>

                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] max-w-full p-0 bg-white border border-slate-200 shadow-xl rounded-xl" align="start">
                      <Command className="w-full">
                        <CommandInput 
                          placeholder="Buscar código, proyecto o cliente..." 
                          className="h-10 text-xs font-bold border-b border-slate-100" 
                        />
                        <CommandList className="max-h-72 overflow-y-auto p-1">
                          <CommandEmpty className="py-3 text-center text-xs font-bold text-slate-400">
                            No se encontraron proyectos.
                          </CommandEmpty>
                          
                          <CommandGroup>
                            {/* OPCIÓN 1: GASTO GENERAL */}
                            <CommandItem
                              value="gasto general no pertenece a ningun proyecto none"
                              onSelect={() => {
                                form.setValue("proyectoId", "none");
                                setOpenProjectCombobox(false);
                              }}
                              className={cn(
                                "flex items-center justify-between p-2.5 rounded-lg cursor-pointer text-xs font-bold transition-colors mb-1",
                                field.value === "none" || !field.value
                                  ? "bg-slate-100 text-slate-900"
                                  : "text-slate-600 hover:bg-slate-100"
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                                <span>[GASTO GENERAL] No pertenece a ningún proyecto</span>
                              </div>
                              {(field.value === "none" || !field.value) && (
                                <Check className="w-4 h-4 text-slate-700 shrink-0" />
                              )}
                            </CommandItem>

                            {/* LISTA DE PROYECTOS */}
                            {proyectos.map((p) => {
                              const isSelected = field.value === p.id;
                              const osCodigo = (p as any).ordenesDeServicio?.[0]?.codigo || p.codigo || "PROY";
                              const clienteEmpresa = (p as any).cliente?.empresa || (p as any).cliente?.nombre || (p as any).cliente?.razonSocial || (p as any).clienteNombre || "";
                              return (
                                <CommandItem
                                  key={p.id}
                                  value={`${osCodigo} ${p.codigo || ""} ${p.nombre} ${clienteEmpresa}`}
                                  onSelect={() => {
                                    form.setValue("proyectoId", p.id);
                                    setOpenProjectCombobox(false);
                                  }}
                                  className={cn(
                                    "flex items-start justify-between p-2.5 rounded-lg cursor-pointer text-xs transition-colors mb-1 border-b last:border-none border-slate-100",
                                    isSelected
                                      ? "bg-slate-100 text-slate-900 border border-slate-200"
                                      : "text-slate-700 hover:bg-slate-100"
                                  )}
                                >
                                  <div className="flex flex-col gap-1 text-left w-full min-w-0 pr-2">
                                    <div className="flex items-center gap-2">
                                      <span className="font-black text-[11px] text-primary bg-primary/10 px-2 py-0.5 rounded-md shrink-0">
                                        {osCodigo}
                                      </span>
                                    </div>
                                    <div className="font-bold text-xs text-slate-800 uppercase leading-snug whitespace-normal break-words">
                                      {p.nombre}
                                    </div>
                                    {clienteEmpresa && (
                                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-tight">
                                        {clienteEmpresa}
                                      </div>
                                    )}
                                  </div>

                                  {isSelected && (
                                    <Check className="w-4 h-4 text-primary shrink-0 stroke-[2.5] mt-1" />
                                  )}
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
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

            <DialogFooter className="pt-2 flex flex-col-reverse sm:flex-row justify-end gap-2 w-full min-w-0 box-border">
              <Button type="button" variant="outline" className="h-10 w-full sm:w-auto text-xs font-bold rounded-xl" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={submitting || isUploading || !cajaUsuario}
                className="h-10 w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md"
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