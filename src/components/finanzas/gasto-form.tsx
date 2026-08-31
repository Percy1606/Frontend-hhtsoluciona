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
import { Wallet, Lock, Loader2, Link2, AlertTriangle, CheckCircle2, FileText, Building2, Briefcase } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
  const [projectStats, setProjectStats] = useState<any>(null);
  const [personalProyectoList, setPersonalProyectoList] = useState<any[]>([]);
  const [loadingPersonal, setLoadingPersonal] = useState(false);
  const [selectedPersonalId, setSelectedPersonalId] = useState<string>("none");

  // Extraer metodoPago guardado en justificación (si lo hay) para mostrarlo en UI
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
      area: initialData?.area || "", // Centro de Costo
      metodoPago: defaultMetodo, // Pseudo-campo
      tipo: initialData?.tipo || "OPERATIVO",
      prioridad: initialData?.prioridad || "MEDIA",
      clasificacion: initialData?.clasificacion || "VENTA_SERVICIO",
      categoriaDistribucion: initialData?.categoriaDistribucion || "",
      concepto: initialData?.concepto || "",
      montoTotal: initialData?.montoTotal || 0,
      tipoComprobante: (initialData as any)?.tipoComprobante || "FACTURA",
      aplicaImpuestos: (initialData as any)?.aplicaImpuestos ?? false,
      montoSubtotal: (initialData as any)?.montoSubtotal || 0,
      montoIgv: (initialData as any)?.montoIgv || 0,
      fechaEmision: getLocalDateString(initialData?.fechaEmision),
      fechaVencimiento: initialData?.fechaVencimiento ? getLocalDateString(initialData.fechaVencimiento) : "",
      fechaProgramadaPago: initialData?.fechaProgramadaPago ? getLocalDateString(initialData.fechaProgramadaPago) : "",
      estado: initialData?.estado || "PENDIENTE",
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
        setCajas(Array.isArray(cajasRes) ? cajasRes : (cajasRes.data || []));
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
    const options: { value: string; label: string; subLabel?: string }[] = [{ value: "none", label: "Gasto General (Sin Proyecto)" }];
    proyectos.forEach(p => {
      const clientName = p.cliente?.razonSocial || p.cliente?.empresa || p.clienteNombre || '';
      options.push({
        value: p.id,
        label: `${p.codigo} - ${p.nombre}${clientName ? ` - ${clientName}` : ''}`,
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

      api.get(`/finanzas/bandeja-proyectos/${selectedProjectId}/detalle`)
        .then(res => {
           const adelantosTotales = res.adelantos?.reduce((acc: number, a: any) => acc + Number(a.monto), 0) || 0;
           const facturadoPagado = res.facturas?.filter((f: any) => f.estado === 'PAGADA' || f.estado === 'PAGO_PARCIAL')
                                               .reduce((acc: number, f: any) => acc + (Number(f.montoTotal) - Number(f.saldoPendiente)), 0) || 0;
           const ingresosReales = adelantosTotales + facturadoPagado;
           
           setProjectStats({
             ingresos: ingresosReales,
             hasAdelanto: ingresosReales > 0
           });
        })
        .catch(() => setProjectStats(null));
    } else {
      setProjectStats(null);
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
    } catch (e) {
      console.error("Upload failed", e);
      toast.error("Error al subir el archivo o comprobante. Intente nuevamente.");
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

  const watchEstado = form.watch("estado");
  const watchSaldoPendiente = initialData?.saldoPendiente !== undefined ? Number(initialData.saldoPendiente) : watchMonto;
  
  // Lógica para resumen financiero
  const montoAprobado = (watchEstado === "APROBADO" || watchEstado === "PAGADO") ? watchMonto : 0;
  const montoEjecutado = watchEstado === "PAGADO" ? (watchMonto - watchSaldoPendiente) || watchMonto : 0;

  const handleLocalSubmit = async (data: any) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
    const justificacionFinal = data.metodoPago ? `[${data.metodoPago}] ${data.justificacion}` : data.justificacion;

    const finalData = {
      codigo: data.codigo,
      comprobanteUrl: data.comprobanteUrl || null,
      tipo: data.tipo,
      prioridad: data.prioridad,
      clasificacion: data.clasificacion,
      categoriaDistribucion: data.categoriaDistribucion || null,
      concepto: data.concepto,
      estado: data.estado,
      fechaEmision: data.fechaEmision,
      area: data.area || null,
      cajaId: data.cajaId === "none" ? null : data.cajaId,
      montoTotal: parseFloat(data.montoTotal) || 0,
      proyectoId: data.proyectoId === "none" ? null : data.proyectoId,
      proveedorId: data.proveedorId || null,
      fechaVencimiento: data.fechaVencimiento || null,
      fechaProgramadaPago: data.fechaProgramadaPago || null,
      justificacion: justificacionFinal,
      tipoComprobante: data.tipoComprobante,
      aplicaImpuestos: data.aplicaImpuestos,
      montoSubtotal: data.montoSubtotal,
      montoIgv: data.montoIgv,
    };
    await onSubmit(finalData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleLocalSubmit)} className="flex flex-col h-full bg-slate-50 w-full">     
        <ScrollArea className="flex-1 p-6">
          <div className="max-w-4xl mx-auto space-y-6 pb-6">
            
            {/* SECCIÓN 1: ASOCIACIÓN Y CENTRO DE COSTO */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                <Building2 className="w-4 h-4 text-primary" />
                <h4 className="text-xs font-black uppercase tracking-widest text-primary">1. Asociación y Centro de Costo</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="proyectoId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="font-bold text-[10px] uppercase text-slate-500 tracking-wider">Proyecto Asociado</FormLabel>
                      <Combobox
                        options={projectOptions}
                        value={field.value || ""}
                        onChange={field.onChange}
                        placeholder="Asociar a un proyecto..."
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="proveedorId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="font-bold text-[10px] uppercase text-slate-500 tracking-wider">Proveedor / RUC</FormLabel>
                      <Combobox
                        options={providerOptions}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Seleccionar proveedor..."
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="area"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-[10px] uppercase text-slate-500 tracking-wider">Centro de Costo / Área</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white border-slate-200 h-10 font-bold text-xs">
                            <SelectValue placeholder="Seleccione Centro de Costo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="LogisticaYRecursos" className="font-bold text-xs">Logística y Recursos</SelectItem>
                          <SelectItem value="IngenieriaYSupervision" className="font-bold text-xs">Ingeniería y Supervisión</SelectItem>
                          <SelectItem value="OperacionesDeCampo" className="font-bold text-xs">Operaciones de Campo</SelectItem>
                          <SelectItem value="GestionDocumentaria" className="font-bold text-xs">Gestión Documentaria</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* SELECCIÓN INTELIGENTE DE PERSONAL DE LOGÍSTICA SI HAY PROYECTO */}
              {selectedProjectId && selectedProjectId !== "none" && (
                <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-3.5 h-3.5 text-slate-700" />
                      <span className="text-xs font-black tracking-wider uppercase text-slate-800">
                        Asignación de Personal Técnico
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 bg-slate-200/80 px-2.5 py-0.5 rounded uppercase tracking-wider">
                      Logística
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-600 font-medium leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                    <p>
                      <strong className="text-slate-800">Control de Mano de Obra:</strong> Si el desembolso corresponde al jornal o planilla de un trabajador, selecciónelo directamente para sincronizarlo con el costo real del proyecto. Para registrar nuevos técnicos, debe realizarse previamente en el módulo de <strong>Logística / Personal de Obra</strong>.
                    </p>
                  </div>

                  {loadingPersonal ? (
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600 py-1">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-600" /> Consultando personal asignado al proyecto...
                    </div>
                  ) : personalProyectoList.length > 0 ? (
                    <Select
                      value={selectedPersonalId}
                      onValueChange={(val: string | null) => {
                        const v = val || "none";
                        setSelectedPersonalId(v);
                        if (v && v !== "none") {
                          const persona = personalProyectoList.find((p) => p.id === v);
                          if (persona) {
                            const monto = Number(persona.montoDiario) || 0;
                            form.setValue("concepto", `Pago Jornal: ${persona.nombre} (${persona.rol || "Técnico"}) - ${selectedProjectObj?.nombre || ""}`);
                            form.setValue("categoriaDistribucion", "MANO_OBRA");
                            form.setValue("area", "OperacionesDeCampo");
                            if (monto > 0) {
                              form.setValue("montoTotal", monto);
                            }
                            toast.info(`Personal asignado: ${persona.nombre}. Puede ajustar el monto final si incluye viáticos o pasajes.`);
                          }
                        }
                      }}
                    >
                      <SelectTrigger className="h-10 bg-white border-slate-200 text-xs font-bold text-slate-800">
                        <SelectValue placeholder="Seleccionar trabajador asignado en Logística..." />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="none" className="text-xs font-bold text-slate-500">
                          -- Gasto Operativo General / Materiales / Otros --
                        </SelectItem>
                        {personalProyectoList.map((p) => (
                          <SelectItem key={p.id} value={p.id} className="text-xs font-bold">
                            {p.nombre} ({p.rol || "Técnico"}) — Jornal Base: S/ {Number(p.montoDiario || 0).toFixed(2)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="text-[11px] text-slate-600 bg-white p-3 rounded-lg border border-slate-200 font-medium">
                      No se registra personal asignado en Logística para este proyecto. Puede ingresar el gasto de forma manual o coordinar con Logística para su registro previo.
                    </div>
                  )}
                </div>
              )}

              {/* RESUMEN PRESUPUESTAL Y ALERTAS FINANCIERAS */}
              {selectedProjectObj && (
                <div className="mt-4 space-y-3">
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase text-blue-800 tracking-widest">Presupuesto del Proyecto</p>
                      <p className="text-xs font-medium text-blue-600">{selectedProjectObj.nombre}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase text-slate-400">Total Presupuestado</p>
                      <p className="text-sm font-black text-blue-700">S/ {Number(selectedProjectObj.costoPresupuestado || selectedProjectObj.presupuesto || 0).toLocaleString()}</p>
                    </div>
                  </div>
                  

                  {projectStats && watchMonto > Number(selectedProjectObj.costoPresupuestado || selectedProjectObj.presupuesto || 0) && (
                    <Alert className="bg-orange-50 border-orange-200">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <AlertTitle className="text-xs font-black uppercase tracking-widest text-orange-800">Advertencia de Presupuesto</AlertTitle>
                      <AlertDescription className="text-[10px] font-bold text-orange-700">
                        El monto de este gasto supera el presupuesto base de este proyecto. Se requerirá autorización especial.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>

            {/* SECCIÓN 2: DOCUMENTO, CLASIFICACIÓN Y COMPROBANTE */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                <FileText className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-black uppercase tracking-widest text-emerald-700">2. Detalles y Documentación</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <FormField
                  control={form.control}
                  name="tipoComprobante"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-[10px] uppercase text-slate-500 tracking-wider">Tipo Comprobante</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white border-slate-200 h-10 font-bold text-xs">
                            <SelectValue placeholder="Tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="FACTURA" className="font-bold text-xs">Factura</SelectItem>
                          <SelectItem value="BOLETA" className="font-bold text-xs">Boleta</SelectItem>
                          <SelectItem value="RECIBO_HONORARIOS" className="font-bold text-xs">RxH</SelectItem>
                          <SelectItem value="TICKET" className="font-bold text-xs">Ticket / Varios</SelectItem>
                          <SelectItem value="OTROS" className="font-bold text-xs">Otros</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="codigo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-[10px] uppercase text-slate-500 tracking-wider">Doc / Comprobante</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: F001-1234" {...field} className="bg-white border-slate-200 h-10 font-bold text-xs" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="comprobanteUrl"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="font-bold text-[10px] uppercase text-slate-500 tracking-wider">Documento / PDF Adjunto (Opcional)</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-3">
                          <Input 
                            type="file" 
                            onChange={handleFileChange} 
                            className="h-10 cursor-pointer text-xs bg-white border-slate-200 flex-1"
                            accept=".pdf,.xml,.jpg,.png"
                          />
                          {isUploading && <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />}
                          {field.value && (
                            <Button
                              type="button"
                              variant="outline"
                              className="h-10 border-blue-200 text-blue-700 bg-blue-50 font-bold text-xs shrink-0"
                              onClick={() => window.open(getSecureUrl(field.value), '_blank')}
                            >
                              Ver Archivo
                            </Button>
                          )}
                        </div>
                      </FormControl>
                      <p className="text-[9px] text-slate-400">Puedes subir un PDF o imagen.</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="concepto"
                  rules={{ required: "Requerido" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-[10px] uppercase text-slate-500 tracking-wider">Concepto del Gasto *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Pago de transporte..." {...field} className="bg-white border-slate-200 h-10 font-bold text-xs" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="clasificacion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-[10px] uppercase text-slate-500 tracking-wider">Clasificación de Negocio</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white border-slate-200 h-10 font-bold text-xs">
                            <SelectValue placeholder="Clasificación" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="VENTA_SERVICIO" className="font-bold text-xs">Ventas y Servicios Generales</SelectItem>
                          <SelectItem value="PROYECTO" className="font-bold text-xs">Proyectos Operativos</SelectItem>
                          <SelectItem value="ALQUILER_EQUIPOS" className="font-bold text-xs">Alquiler de Equipos</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* SECCIÓN 3: FECHAS, PRIORIDAD Y GESTIÓN DE FONDOS */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                <Wallet className="w-4 h-4 text-amber-600" />
                <h4 className="text-xs font-black uppercase tracking-widest text-amber-700">3. Calendario y Tesorería</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <FormField
                  control={form.control}
                  name="fechaEmision"
                  rules={{ required: "Requerido" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-[10px] uppercase text-slate-500 tracking-wider">Emisión</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className="bg-white border-slate-200 h-10 font-bold text-xs" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fechaVencimiento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-[10px] uppercase text-slate-500 tracking-wider">Vencimiento</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className="bg-white border-slate-200 h-10 font-bold text-xs" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fechaProgramadaPago"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-[10px] uppercase text-amber-600 tracking-wider">Programación</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className="bg-amber-50 border-amber-200 h-10 font-bold text-amber-700 text-xs" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="cajaId"
                  rules={{ required: "Debe seleccionar una cuenta de origen obligatoriamente" }}
                  render={({ field }) => {
                    const selectedCajaObj = cajas.find(c => c.id === field.value);
                    const montoGasto = Number(watchMonto) || 0;
                    const saldoRestante = selectedCajaObj ? Number(selectedCajaObj.saldoDisponible) - montoGasto : 0;
                    const esInsuficiente = selectedCajaObj && saldoRestante < 0;

                    return (
                      <FormItem className="md:col-span-2 space-y-2">
                        <div className="flex items-center justify-between">
                          <FormLabel className="font-black text-[10px] uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                            <Wallet className="w-3.5 h-3.5 text-amber-600" /> Caja / Cuenta de Origen (Egreso) *
                          </FormLabel>
                          {selectedCajaObj && (
                            <span className={cn(
                              "text-[10px] font-black uppercase px-2 py-0.5 rounded-md",
                              esInsuficiente ? "bg-red-100 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            )}>
                              Disp: S/ {Number(selectedCajaObj.saldoDisponible).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                            </span>
                          )}
                        </div>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className={cn(
                              "h-11 font-black text-xs transition-all",
                              !field.value ? "border-amber-300 bg-amber-50/40 text-amber-900" : "bg-white border-slate-200"
                            )}>
                              <SelectValue placeholder="SELECCIONAR CUENTA OBLIGATORIAMENTE...">
                                {selectedCajaObj ? (
                                  <div className="flex items-center gap-2">
                                    <span className="font-black uppercase">{selectedCajaObj.nombre}</span>
                                    <span className="text-[9px] text-slate-400 font-bold">({selectedCajaObj.subtipo || selectedCajaObj.tipo})</span>
                                  </div>
                                ) : (
                                  <span className="text-amber-800 font-bold">SELECCIONAR CUENTA OBLIGATORIAMENTE...</span>
                                )}
                              </SelectValue>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none" className="font-bold text-xs italic text-slate-500 py-2">
                              NO AFECTA CAJA (Gasto sin movimiento bancario)
                            </SelectItem>
                            {cajas.map((c) => {
                              const disp = Number(c.saldoDisponible || 0);
                              return (
                                <SelectItem key={c.id} value={c.id} className="font-bold text-xs py-2 border-b last:border-none">
                                  <div className="flex items-center justify-between gap-4 w-full">
                                    <div className="flex items-center gap-2">
                                      <span className="font-black uppercase text-slate-800">{c.nombre}</span>
                                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-bold">{c.subtipo || c.tipo}</span>
                                      {c.esProtegida && <Lock className="w-3 h-3 text-primary" />}
                                    </div>
                                    <span className={cn(
                                      "text-[10px] font-black ml-auto",
                                      disp < 0 ? "text-red-600" : "text-emerald-600"
                                    )}>
                                      S/ {disp.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                                    </span>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>

                        {/* Banner de Impacto Inmediato */}
                        {selectedCajaObj && montoGasto > 0 && (
                          <div className={cn(
                            "p-2.5 rounded-xl border text-[11px] font-bold flex items-center justify-between",
                            esInsuficiente ? "bg-red-50 border-red-200 text-red-800" : "bg-slate-50 border-slate-200 text-slate-700"
                          )}>
                            <span>
                              Descuenta <strong className="text-primary font-black">S/ {montoGasto.toLocaleString("es-PE", { minimumFractionDigits: 2 })}</strong> de <strong>{selectedCajaObj.nombre}</strong>
                            </span>
                            <span>
                              Quedara: <strong className={esInsuficiente ? "text-red-600 font-black" : "text-emerald-600 font-black"}>
                                S/ {saldoRestante.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                              </strong>
                            </span>
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
                <FormField
                  control={form.control}
                  name="prioridad"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-[10px] uppercase text-slate-500 tracking-wider">Prioridad</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white border-slate-200 h-10 font-bold text-xs">
                            <SelectValue placeholder="Prioridad" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="BAJA" className="font-bold text-xs text-slate-500">BAJA</SelectItem>
                          <SelectItem value="MEDIA" className="font-bold text-xs text-blue-600">MEDIA</SelectItem>
                          <SelectItem value="ALTA" className="font-bold text-xs text-orange-600">ALTA</SelectItem>
                          <SelectItem value="CRITICA" className="font-bold text-xs text-red-600">CRÍTICA</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* SECCIÓN 4: ESTADO Y RESUMEN FINANCIERO */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  <h4 className="text-xs font-black uppercase tracking-widest text-blue-700">4. Estado y Resumen Financiero</h4>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start mb-4">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="montoTotal"
                    rules={{ required: "Requerido" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-black text-[11px] uppercase text-slate-600 tracking-wider">Monto Total (S/.) *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            autoComplete="off"
                            placeholder="0.00"
                            value={field.value || ""}
                            onChange={e => field.onChange(e.target.value)}
                            className="bg-slate-50 border-slate-200 h-12 font-black text-xl text-primary shadow-inner"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch("tipoComprobante") === "FACTURA" && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                      <FormField
                        control={form.control}
                        name="aplicaImpuestos"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between">
                            <div className="space-y-0.5">
                              <FormLabel className="font-bold text-xs text-slate-700 uppercase tracking-wider">Aplica para Crédito Fiscal (IGV)</FormLabel>
                              <p className="text-[10px] text-slate-500">Separar IGV para declaración de impuestos</p>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      {watchAplicaImpuestos && (
                        <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Subtotal</p>
                            <p className="text-sm font-black text-slate-700">S/ {form.watch("montoSubtotal")}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">IGV (18%)</p>
                            <p className="text-sm font-black text-emerald-600">S/ {form.watch("montoIgv")}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="estado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-black text-[11px] uppercase text-slate-600 tracking-wider">Flujo de Aprobación *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className={cn(
                            "h-12 font-black text-xs rounded-xl border-2 transition-all",
                            field.value === 'PENDIENTE' ? "bg-slate-50 border-slate-200 text-slate-600" :
                            field.value === 'SOLICITADO' ? "bg-amber-50 border-amber-200 text-amber-700" :
                            field.value === 'APROBADO' ? "bg-blue-50 border-blue-200 text-blue-700" :
                            field.value === 'PAGADO' ? "bg-green-50 border-green-200 text-green-700" :
                            "bg-red-50 border-red-200 text-red-700"
                          )}>
                            <SelectValue placeholder="Seleccione estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="PENDIENTE" className="font-bold text-xs text-slate-600">1. BORRADOR / REGISTRO INICIAL</SelectItem>
                          <SelectItem value="SOLICITADO" className="font-bold text-xs text-amber-600">2. PENDIENTE DE APROBACIÓN</SelectItem>
                          <SelectItem 
                            value="APROBADO" 
                            disabled={!isFinanzasOrAdmin} 
                            className="font-bold text-xs text-blue-600"
                          >
                            3. APROBADO (LISTO PARA PAGO) {!isFinanzasOrAdmin ? '(Solo Finanzas)' : ''}
                          </SelectItem>
                          <SelectItem 
                            value="PAGADO" 
                            disabled={!isFinanzasOrAdmin} 
                            className="font-bold text-xs text-green-600"
                          >
                            4. EJECUTADO / PAGADO {!isFinanzasOrAdmin ? '(Solo Finanzas)' : ''}
                          </SelectItem>
                          <SelectItem value="ANULADO" className="font-bold text-xs text-red-600">ANULADO / RECHAZADO</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* DASHBOARD FINANCIERO AUTOMÁTICO */}
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 mt-4">
                <div className="text-center p-2 border-r border-slate-200">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Solicitado</p>
                  <p className="text-sm font-black text-slate-700">S/ {Number(watchMonto).toLocaleString("es-PE", { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="text-center p-2 border-r border-slate-200">
                  <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Aprobado</p>
                  <p className="text-sm font-black text-blue-700">S/ {Number(montoAprobado).toLocaleString("es-PE", { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="text-center p-2">
                  <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Ejecutado</p>
                  <p className="text-sm font-black text-emerald-600">S/ {Number(montoEjecutado).toLocaleString("es-PE", { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            </div>

          </div>
        </ScrollArea>

        <div className="flex-shrink-0 flex justify-end gap-3 p-5 border-t border-slate-200 bg-white">
          <Button type="button" variant="ghost" onClick={onCancel} className="font-black uppercase text-xs text-slate-500 hover:bg-slate-100 px-6 h-11 rounded-xl">
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting} className="font-black uppercase text-xs bg-primary hover:bg-primary/90 text-white px-8 h-11 rounded-xl shadow-lg disabled:opacity-50">
            {isSubmitting ? "Procesando..." : initialData ? "Guardar Cambios" : "Registrar Gasto"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
