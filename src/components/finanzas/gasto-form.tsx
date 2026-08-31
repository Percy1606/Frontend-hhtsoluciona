"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import { Combobox } from "@/components/ui/combobox";
import { Gasto } from "@/types/finanzas";
import { cn, getSecureUrl } from "@/lib/utils";
import { Wallet, Lock, Loader2, FileText, Building2, Briefcase, ChevronDown, ChevronUp, Layers, CheckCircle2, DollarSign } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { toast } from "sonner";

interface GastoFormProps {
  initialData?: Gasto | null;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const getLocalDateString = (date?: string | Date) => {
  if (!date) {
    const d = new Date();
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().split('T')[0];
  }
  const d = new Date(date);
  if (typeof date === 'string' && date.includes('T')) {
    return date.split('T')[0];
  }
  return d.toISOString().split('T')[0];
};

export function GastoForm({ initialData, onSubmit, onCancel }: GastoFormProps) {
  const { user } = useAuthStore();
  const isFinanzasOrAdmin = user?.rol === 'ADMIN' || user?.modulos?.includes('finanzas');
  
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [proyectos, setProyectos] = useState<any[]>([]);
  const [cajas, setCajas] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [personalProyectoList, setPersonalProyectoList] = useState<any[]>([]);
  const [loadingPersonal, setLoadingPersonal] = useState(false);
  const [selectedPersonalId, setSelectedPersonalId] = useState<string>("none");
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Extraer metodoPago guardado en justificación
  const initialJustificacion = (initialData as any)?.justificacion || "";
  const matchMetodo = initialJustificacion.match(/^\[(.*?)\]\s*(.*)$/);
  const defaultMetodo = matchMetodo ? matchMetodo[1] : "TRANSFERENCIA";
  const defaultJustificacion = matchMetodo ? matchMetodo[2] : initialJustificacion;

  const form = useForm({
    defaultValues: {
      codigo: initialData?.codigo || "",
      comprobanteUrl: initialData?.comprobanteUrl || "",
      proveedorId: initialData?.proveedorId || "",
      proyectoId: initialData?.proyectoId || "",
      cajaId: (initialData as any)?.cajaId || "",
      area: initialData?.area || "LogisticaYRecursos",
      metodoPago: defaultMetodo,
      tipo: initialData?.tipo || "OPERATIVO",
      prioridad: initialData?.prioridad || "MEDIA",
      clasificacion: initialData?.clasificacion || "VENTA_SERVICIO",
      categoriaDistribucion: initialData?.categoriaDistribucion || "OPERATIVO_VARIO",
      concepto: initialData?.concepto || "",
      montoTotal: initialData?.montoTotal || "",
      tipoComprobante: (initialData as any)?.tipoComprobante || "BOLETA",
      aplicaImpuestos: (initialData as any)?.aplicaImpuestos ?? false,
      montoSubtotal: (initialData as any)?.montoSubtotal || 0,
      montoIgv: (initialData as any)?.montoIgv || 0,
      fechaEmision: getLocalDateString(initialData?.fechaEmision),
      fechaVencimiento: initialData?.fechaVencimiento ? getLocalDateString(initialData.fechaVencimiento) : "",
      fechaProgramadaPago: initialData?.fechaProgramadaPago ? getLocalDateString(initialData.fechaProgramadaPago) : "",
      estado: initialData?.estado || "PAGADO",
      justificacion: defaultJustificacion,
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [provRes, projectsRes, cajasRes] = await Promise.all([
          api.get('/logistica/proveedores?limit=500'),
          api.get('/operaciones/proyectos?limit=500'),
          api.get('/finanzas/cajas')
        ]);
        
        setProveedores(Array.isArray(provRes) ? provRes : (provRes.data || []));
        setProyectos(Array.isArray(projectsRes) ? projectsRes : (projectsRes.data || []));
        const cajasList = Array.isArray(cajasRes) ? cajasRes : (cajasRes.data || []);
        setCajas(cajasList);

        // Seleccionar Caja General por defecto
        if (!form.getValues("cajaId") && cajasList.length > 0) {
          const cajaDefault = cajasList.find((c: any) => c.nombre.toLowerCase().includes("general")) ||
                              cajasList.find((c: any) => c.nombre.toLowerCase().includes("steven")) ||
                              cajasList[0];
          if (cajaDefault) {
            form.setValue("cajaId", cajaDefault.id);
          }
        }
      } catch (e) {
        console.error("Error cargando datos para el formulario de gastos", e);
      }
    };
    fetchData();
  }, []);

  const providerOptions = useMemo(() => 
    proveedores.map(p => ({
      value: p.id,
      label: p.razonSocial,
      subLabel: `RUC: ${p.ruc || 'S/N'}`
    })), [proveedores]);

  const projectOptions = useMemo(() => {
    const options: { value: string; label: string; subLabel?: string }[] = [{ value: "none", label: "Gasto General / Sin Proyecto" }];
    proyectos.forEach(p => {
      const clientName = p.cliente?.razonSocial || p.cliente?.empresa || p.clienteNombre || '';
      options.push({
        value: p.id,
        label: `${p.codigo} - ${p.nombre}${clientName ? ` (${clientName})` : ''}`,
        subLabel: clientName ? `CLIENTE: ${clientName}` : `CÓDIGO: ${p.codigo}`
      });
    });
    return options;
  }, [proyectos]);

  const selectedProjectId = form.watch("proyectoId");
  const selectedProjectObj = proyectos.find(p => p.id === selectedProjectId);

  useEffect(() => {
    if (selectedProjectId && selectedProjectId !== "none") {
      form.setValue("clasificacion", "PROYECTO");
      form.setValue("tipo", "PROYECTO");

      setLoadingPersonal(true);
      api.get(`/logistica/personal?proyectoId=${selectedProjectId}&limit=100`)
        .then((res: any) => {
          const list = res?.data || (Array.isArray(res) ? res : []);
          setPersonalProyectoList(list);
        })
        .catch(() => setPersonalProyectoList([]))
        .finally(() => setLoadingPersonal(false));
    } else {
      setPersonalProyectoList([]);
      setSelectedPersonalId("none");
    }
  }, [selectedProjectId, form]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await api.post("/files/upload", formData);
      form.setValue("comprobanteUrl", res.url);
      toast.success("Comprobante adjuntado correctamente");
    } catch (e) {
      console.error("Upload failed", e);
      toast.error("Error al subir el archivo.");
    } finally {
      setIsUploading(false);
    }
  };

  // Watchers para el cálculo de impuestos
  const watchAplicaImpuestos = form.watch("aplicaImpuestos");
  const watchMonto = form.watch("montoTotal");

  useEffect(() => {
    const monto = Number(watchMonto) || 0;
    if (watchAplicaImpuestos) {
      const subtotal = monto / 1.18;
      const igv = monto - subtotal;
      form.setValue("montoSubtotal", Number(subtotal.toFixed(2)));
      form.setValue("montoIgv", Number(igv.toFixed(2)));
    } else {
      form.setValue("montoSubtotal", monto);
      form.setValue("montoIgv", 0);
    }
  }, [watchAplicaImpuestos, watchMonto, form]);

  const handleLocalSubmit = async (data: any) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const justificacionFinal = data.metodoPago ? `[${data.metodoPago}] ${data.justificacion || ''}`.trim() : data.justificacion;

      const finalData = {
        codigo: data.codigo || 'S/N',
        comprobanteUrl: data.comprobanteUrl || null,
        tipo: data.tipo,
        prioridad: data.prioridad || 'MEDIA',
        clasificacion: data.clasificacion || (data.proyectoId && data.proyectoId !== 'none' ? 'PROYECTO' : 'VENTA_SERVICIO'),
        categoriaDistribucion: data.categoriaDistribucion || 'OPERATIVO_VARIO',
        concepto: data.concepto,
        estado: data.estado || 'PAGADO',
        fechaEmision: data.fechaEmision || getLocalDateString(),
        area: data.area || 'LogisticaYRecursos',
        cajaId: data.cajaId === "none" ? null : data.cajaId,
        montoTotal: parseFloat(data.montoTotal) || 0,
        proyectoId: data.proyectoId === "none" ? null : data.proyectoId,
        proveedorId: data.proveedorId || null,
        fechaVencimiento: data.fechaVencimiento || null,
        fechaProgramadaPago: data.fechaProgramadaPago || null,
        justificacion: justificacionFinal,
        tipoComprobante: data.tipoComprobante || 'BOLETA',
        aplicaImpuestos: data.aplicaImpuestos || false,
        montoSubtotal: data.montoSubtotal,
        montoIgv: data.montoIgv,
      };

      await onSubmit(finalData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCajaId = form.watch("cajaId");
  const selectedCajaObj = cajas.find(c => c.id === selectedCajaId);
  const montoNum = Number(watchMonto) || 0;
  const saldoRestante = selectedCajaObj ? Number(selectedCajaObj.saldoDisponible) - montoNum : 0;
  const esInsuficiente = selectedCajaObj && saldoRestante < 0;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleLocalSubmit)} className="flex flex-col h-full bg-white w-full">     
        <ScrollArea className="flex-1 px-6 py-4">
          <div className="max-w-2xl mx-auto space-y-4">
            
            {/* 1. ASIGNACIÓN DE PROYECTO / DESTINO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="proyectoId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="font-bold text-[10px] uppercase text-slate-500 tracking-wider">
                      Proyecto o Gasto General
                    </FormLabel>
                    <Combobox
                      options={projectOptions}
                      value={field.value || "none"}
                      onChange={field.onChange}
                      placeholder="Buscar proyecto o general..."
                    />
                    <p className="text-[9px] text-slate-400 font-medium">Elige la obra o deja en General si es oficina/flota.</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Selector Rápido de Trabajador si hay Proyecto */}
              {selectedProjectId && selectedProjectId !== "none" ? (
                <div className="space-y-1">
                  <FormLabel className="font-bold text-[10px] uppercase text-slate-500 tracking-wider flex items-center gap-1">
                    <Briefcase className="w-3 h-3 text-slate-600" /> Personal Técnico (Opcional)
                  </FormLabel>
                  {loadingPersonal ? (
                    <div className="h-10 flex items-center gap-2 text-xs text-slate-400 bg-slate-50 rounded-xl px-3 border">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Consultando técnicos...
                    </div>
                  ) : (
                    <>
                    <Select
                      value={selectedPersonalId}
                      onValueChange={(val: string | null) => {
                        const v = val || "none";
                        setSelectedPersonalId(v);
                        if (v && v !== "none") {
                          const persona = personalProyectoList.find((p) => p.id === v);
                          if (persona) {
                            const monto = Number(persona.montoDiario) || 0;
                            form.setValue("concepto", `Pago Jornal: ${persona.nombre} (${persona.rol || "Técnico"})`);
                            form.setValue("categoriaDistribucion", "MANO_OBRA");
                            form.setValue("area", "OperacionesDeCampo");
                            if (monto > 0) form.setValue("montoTotal", monto as any);
                          }
                        }
                      }}
                    >
                      <SelectTrigger className="h-10 bg-slate-50/70 border-slate-200 text-xs font-bold text-slate-800">
                        <SelectValue placeholder="Seleccionar técnico..." />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="none" className="text-xs font-bold text-slate-400">-- Ninguno (Materiales / Viáticos) --</SelectItem>
                        {personalProyectoList.map((p) => (
                          <SelectItem key={p.id} value={p.id} className="text-xs font-bold">
                            {p.nombre} ({p.rol || "Técnico"}) — S/ {Number(p.montoDiario || 0).toFixed(2)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[9px] text-slate-400 font-medium">Jornal fijado por Logística.</p>
                    </>
                  )}
                </div>
              ) : (
                <FormField
                  control={form.control}
                  name="proveedorId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="font-bold text-[10px] uppercase text-slate-500 tracking-wider">
                        Proveedor / Comercio (Opcional)
                      </FormLabel>
                      <Combobox
                        options={providerOptions}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Buscar proveedor o RUC..."
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* 2. CONCEPTO Y MONTO */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <FormField
                control={form.control}
                name="concepto"
                rules={{ required: "El concepto es obligatorio" }}
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel className="font-bold text-[10px] uppercase text-slate-600 tracking-wider">
                      Concepto / Descripción del Gasto *
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ej: Combustible Duster, Compra de guantes, Peaje..." 
                        {...field} 
                        className="bg-white border-slate-200 h-11 font-bold text-xs" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="montoTotal"
                rules={{ required: "Monto requerido" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-black text-[10px] uppercase text-slate-700 tracking-wider">
                      Monto Total (S/) *
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        placeholder="0.00"
                        value={field.value || ""}
                        onChange={e => field.onChange(e.target.value)}
                        className="bg-amber-50/50 border-amber-300 focus:border-amber-500 h-11 font-black text-base text-slate-900 text-right pr-3 font-mono" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 3. CAJA DE PAGO Y COMPROBANTE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="cajaId"
                rules={{ required: "Seleccione una cuenta de pago" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-[10px] uppercase text-slate-600 tracking-wider flex items-center justify-between">
                      <span className="flex items-center gap-1"><Wallet className="w-3.5 h-3.5 text-amber-600" /> Cuenta / Caja de Pago *</span>
                      {selectedCajaObj && (
                        <span className={cn("text-[9px] font-black uppercase px-1.5 py-0.2 rounded", esInsuficiente ? "text-red-600 bg-red-50" : "text-emerald-700 bg-emerald-50")}>
                          Disp: S/ {Number(selectedCajaObj.saldoDisponible).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                        </span>
                      )}
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-10 bg-white border-slate-200 text-xs font-bold">
                          <SelectValue placeholder="Seleccionar caja..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white">
                        <SelectItem value="none" className="font-bold text-xs text-slate-400">Sin afectación de caja (A crédito)</SelectItem>
                        {cajas.map((c) => (
                          <SelectItem key={c.id} value={c.id} className="font-bold text-xs">
                            <div className="flex items-center justify-between gap-3 w-full">
                              <span className="uppercase">{c.nombre}</span>
                              <span className="text-[10px] text-slate-400 font-mono">S/ {Number(c.saldoDisponible || 0).toFixed(2)}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[9px] text-slate-400 font-medium">Caja General cargada por defecto.</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-2">
                <FormField
                  control={form.control}
                  name="tipoComprobante"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-[10px] uppercase text-slate-500 tracking-wider">
                        Comprobante
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white border-slate-200 h-10 font-bold text-xs">
                            <SelectValue placeholder="Tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white">
                          <SelectItem value="BOLETA" className="font-bold text-xs">Boleta</SelectItem>
                          <SelectItem value="FACTURA" className="font-bold text-xs">Factura</SelectItem>
                          <SelectItem value="RECIBO_HONORARIOS" className="font-bold text-xs">RxH</SelectItem>
                          <SelectItem value="TICKET" className="font-bold text-xs">Ticket / Varios</SelectItem>
                          <SelectItem value="OTROS" className="font-bold text-xs">Otros</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="codigo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-[10px] uppercase text-slate-500 tracking-wider">
                        N° Doc (Opcional)
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: B001-123" {...field} className="bg-white border-slate-200 h-10 font-bold text-xs" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* BOTÓN DESPLEGABLE DE OPCIONES AVANZADAS */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-500 hover:text-slate-800 transition-colors py-1"
              >
                {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                {showAdvanced ? "Ocultar Opciones Avanzadas" : "Opciones Avanzadas (Sustento PDF, IGV, Fechas, Estado)"}
              </button>

              {showAdvanced && (
                <div className="mt-2.5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3 transition-all text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <FormField
                      control={form.control}
                      name="fechaEmision"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold text-[9px] uppercase text-slate-500">Fecha Emisión</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} className="bg-white border-slate-200 h-9 font-bold text-xs" />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="estado"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold text-[9px] uppercase text-slate-500">Estado del Pago</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-white border-slate-200 h-9 font-bold text-xs">
                                <SelectValue placeholder="Estado" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-white">
                              <SelectItem value="PAGADO" className="font-bold text-xs text-emerald-700">EJECUTADO / PAGADO</SelectItem>
                              <SelectItem value="SOLICITADO" className="font-bold text-xs text-amber-700">POR APROBAR</SelectItem>
                              <SelectItem value="APROBADO" className="font-bold text-xs text-blue-700">APROBADO</SelectItem>
                              <SelectItem value="PENDIENTE" className="font-bold text-xs text-slate-500">BORRADOR</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="categoriaDistribucion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold text-[9px] uppercase text-slate-500">Categoría</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-white border-slate-200 h-9 font-bold text-xs">
                                <SelectValue placeholder="Categoría" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-white">
                              <SelectItem value="OPERATIVO_VARIO" className="font-bold text-xs">Operativo Varios</SelectItem>
                              <SelectItem value="LOGISTICA_MOVILIDAD" className="font-bold text-xs">Movilidad / Combustible</SelectItem>
                              <SelectItem value="MANO_OBRA" className="font-bold text-xs">Mano de Obra / Jornales</SelectItem>
                              <SelectItem value="MATERIALES" className="font-bold text-xs">Materiales y Ferretería</SelectItem>
                              <SelectItem value="EQUIPOS" className="font-bold text-xs">Equipos y Herramientas</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Subir comprobante adjunto */}
                  <FormField
                    control={form.control}
                    name="comprobanteUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold text-[9px] uppercase text-slate-500">Adjuntar Sustento / Foto / PDF</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <Input 
                              type="file" 
                              onChange={handleFileChange} 
                              className="h-9 cursor-pointer text-xs bg-white border-slate-200 flex-1"
                              accept=".pdf,.xml,.jpg,.png"
                            />
                            {isUploading && <Loader2 className="w-4 h-4 animate-spin text-slate-600" />}
                            {field.value && (
                              <Button
                                type="button"
                                variant="outline"
                                className="h-9 text-[10px] font-bold border-blue-200 text-blue-700 bg-blue-50 shrink-0"
                                onClick={() => window.open(getSecureUrl(field.value), '_blank')}
                              >
                                Ver Adjunto
                              </Button>
                            )}
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Toggle IGV si es Factura */}
                  {form.watch("tipoComprobante") === "FACTURA" && (
                    <div className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg">
                      <div>
                        <p className="text-[10px] font-bold text-slate-800 uppercase">Aplica Crédito Fiscal (IGV 18%)</p>
                        {watchAplicaImpuestos && (
                          <p className="text-[9px] text-slate-500">
                            Subtotal: S/ {form.watch("montoSubtotal")} | IGV: S/ {form.watch("montoIgv")}
                          </p>
                        )}
                      </div>
                      <FormField
                        control={form.control}
                        name="aplicaImpuestos"
                        render={({ field }) => (
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        )}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </ScrollArea>

        {/* PIE DEL MODAL */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 border-t border-slate-100 bg-white">
          <Button 
            type="button" 
            variant="ghost" 
            onClick={onCancel} 
            className="font-bold text-xs text-slate-500 hover:bg-slate-100 h-10 px-5 rounded-xl"
          >
            Cancelar
          </Button>

          <Button 
            type="submit" 
            disabled={isSubmitting} 
            className="font-bold text-xs bg-primary hover:bg-primary/90 text-white h-10 px-6 rounded-xl shadow-md disabled:opacity-50"
          >
            {isSubmitting ? "Guardar Gasto..." : initialData ? "Actualizar Gasto" : "Guardar Gasto"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
