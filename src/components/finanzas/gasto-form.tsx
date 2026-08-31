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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { useEffect, useState, useMemo, useRef } from "react";
import { api } from "@/lib/api";
import { Combobox } from "@/components/ui/combobox";
import { Gasto } from "@/types/finanzas";
import { cn, getSecureUrl } from "@/lib/utils";
import { Wallet, Loader2, UploadCloud, ChevronDown, ChevronRight, Briefcase, FileCheck, CheckCircle2 } from "lucide-react";
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
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Extraer metodoPago guardado en justificación
  const initialJustificacion = (initialData as any)?.justificacion || "";
  const matchMetodo = initialJustificacion.match(/^\[(.*?)\]\s*(.*)$/);
  const defaultMetodo = matchMetodo ? matchMetodo[1] : "TRANSFERENCIA";
  const defaultJustificacion = matchMetodo ? matchMetodo[2] : initialJustificacion;

  const form = useForm({
    mode: "onChange",
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
        const [provRes, projectsRes, cajasRes, quotesRes] = await Promise.all([
          api.get('/logistica/proveedores?limit=500'),
          api.get('/operaciones/proyectos?limit=500'),
          api.get('/finanzas/cajas'),
          api.get('/crm/quotes?limit=500').catch(() => [])
        ]);
        
        setProveedores(Array.isArray(provRes) ? provRes : (provRes.data || []));
        setProyectos(Array.isArray(projectsRes) ? projectsRes : (projectsRes.data || []));
        const quotesList = Array.isArray(quotesRes) ? quotesRes : (quotesRes.data || []);
        const cajasList = Array.isArray(cajasRes) ? cajasRes : (cajasRes.data || []);
        setCajas(cajasList);
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
    const options: { value: string; label: string; subLabel?: string }[] = [{ value: "none", label: "Gasto General (Sin Proyecto / Oficina / Flota)" }];
    
    // Proyectos de Operaciones
    proyectos.forEach(p => {
      const clientName = p.cliente?.razonSocial || p.cliente?.empresa || p.clienteNombre || '';
      options.push({
        value: p.id,
        label: `${p.codigo} - ${p.nombre}`,
        subLabel: clientName ? `CLIENTE: ${clientName}` : `PROYECTO: ${p.codigo}`
      });
    });

    return options;
  }, [proyectos]);

  const selectedProjectId = form.watch("proyectoId");

  useEffect(() => {
    if (selectedProjectId && selectedProjectId !== "none") {
      form.setValue("clasificacion", "PROYECTO");
      form.setValue("tipo", "PROYECTO");
    }
  }, [selectedProjectId, form]);

  const uploadFile = async (file: File) => {
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  // Watchers para cálculo de impuestos
  const watchAplicaImpuestos = form.watch("aplicaImpuestos");
  const watchMonto = form.watch("montoTotal");
  const watchConcepto = form.watch("concepto");
  const watchCajaId = form.watch("cajaId");

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

  const selectedCajaObj = cajas.find(c => c.id === watchCajaId);
  const montoNum = Number(watchMonto) || 0;
  const saldoRestante = selectedCajaObj ? Number(selectedCajaObj.saldoDisponible) - montoNum : 0;
  const esInsuficiente = selectedCajaObj && saldoRestante < 0;

  // Validación para deshabilitar botón Guardar gasto si faltan campos obligatorios
  const isFormValid = Boolean(watchConcepto && watchConcepto.trim() && montoNum > 0 && watchCajaId);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleLocalSubmit)} className="flex flex-col h-full bg-white w-full">     
        <ScrollArea className="flex-1 px-6 py-4">
          <div className="space-y-4 max-w-full">
            
            {/* FILA 1: Proyecto / Gasto General | Proveedor / Comercio (Fijo y Permanente) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="proyectoId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-xs font-semibold text-slate-700">
                      Proyecto / gasto general
                    </FormLabel>
                    <Combobox
                      options={projectOptions}
                      value={field.value || "none"}
                      onChange={field.onChange}
                      placeholder="Seleccionar proyecto o general..."
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
                    <FormLabel className="text-xs font-semibold text-slate-700">
                      Proveedor / comercio
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
            </div>

            {/* FILA 2: Concepto / descripción del gasto */}
            <FormField
              control={form.control}
              name="concepto"
              rules={{ required: "El concepto es obligatorio" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold text-slate-700">
                    Concepto / descripción del gasto <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ej: Combustible camioneta Duster, Compra de herramientas, Peaje..." 
                      {...field} 
                      className="bg-white border-slate-200 h-10 text-xs font-medium placeholder:text-slate-400" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* FILA 3: Monto total | Cuenta / caja de pago */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              <FormField
                control={form.control}
                name="montoTotal"
                rules={{ required: "Monto requerido" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-slate-700">
                      Monto total <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 select-none">
                          S/
                        </span>
                        <Input 
                          type="number" 
                          step="0.01"
                          placeholder="0.00"
                          value={field.value || ""}
                          onChange={e => field.onChange(e.target.value)}
                          className={cn(
                            "h-10 pl-8 pr-3 font-semibold text-sm bg-white border-slate-200 transition-colors focus:border-slate-400",
                            esInsuficiente && "border-red-300 bg-red-50/40"
                          )} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cajaId"
                rules={{ required: "Seleccione una cuenta de pago" }}
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-xs font-semibold text-slate-700">
                        Cuenta / caja de pago <span className="text-red-500">*</span>
                      </FormLabel>
                      {selectedCajaObj && (
                        <span className={cn(
                          "text-[11px] font-medium transition-colors",
                          esInsuficiente ? "text-red-600 font-semibold" : "text-emerald-600"
                        )}>
                          Disponible: S/ {Number(selectedCajaObj.saldoDisponible).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      )}
                    </div>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-10 bg-white border-slate-200 text-xs font-normal">
                          <SelectValue placeholder="Seleccionar caja de origen..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white">
                        <SelectItem value="none" className="text-xs text-slate-500">Sin afectación de caja (A crédito)</SelectItem>
                        {cajas.map((c) => (
                          <SelectItem key={c.id} value={c.id} className="text-xs">
                            <div className="flex items-center justify-between gap-3 w-full">
                              <span>{c.nombre}</span>
                              <span className="text-[11px] text-emerald-600 font-mono">
                                S/ {Number(c.saldoDisponible || 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* FILA 4: Comprobante | N.° de documento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tipoComprobante"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-slate-700">
                      Comprobante
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-white border-slate-200 h-10 text-xs font-normal">
                          <SelectValue placeholder="Tipo de comprobante" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white">
                        <SelectItem value="BOLETA" className="text-xs">Boleta</SelectItem>
                        <SelectItem value="FACTURA" className="text-xs">Factura</SelectItem>
                        <SelectItem value="RECIBO_HONORARIOS" className="text-xs">Recibo por Honorarios (RxH)</SelectItem>
                        <SelectItem value="TICKET" className="text-xs">Ticket / Varios</SelectItem>
                        <SelectItem value="OTROS" className="text-xs">Otros</SelectItem>
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
                    <FormLabel className="text-xs font-semibold text-slate-700">
                      N.º de documento
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: B001-12345" {...field} className="bg-white border-slate-200 h-10 text-xs" />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* SECCIÓN COLAPSABLE: Opciones avanzadas */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors py-1 group"
              >
                {showAdvanced ? (
                  <ChevronDown className="w-4 h-4 text-slate-500 group-hover:text-slate-800 transition-transform" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-800 transition-transform" />
                )}
                <span>Opciones avanzadas</span>
              </button>

              {showAdvanced && (
                <div className="mt-3 p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-4 transition-all">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Fecha de emisión */}
                    <FormField
                      control={form.control}
                      name="fechaEmision"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[11px] font-semibold text-slate-600">Fecha de emisión</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} className="bg-white border-slate-200 h-9 text-xs" />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {/* Fecha de vencimiento */}
                    <FormField
                      control={form.control}
                      name="fechaVencimiento"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[11px] font-semibold text-slate-600">Fecha de vencimiento</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} className="bg-white border-slate-200 h-9 text-xs" />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {/* Fecha programada de pago */}
                    <FormField
                      control={form.control}
                      name="fechaProgramadaPago"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[11px] font-semibold text-slate-600">Fecha programada de pago</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} className="bg-white border-slate-200 h-9 text-xs" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Estado del pago */}
                    <FormField
                      control={form.control}
                      name="estado"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[11px] font-semibold text-slate-600">Estado del pago</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-white border-slate-200 h-9 text-xs">
                                <SelectValue placeholder="Estado" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-white">
                              <SelectItem value="PAGADO" className="text-xs text-emerald-700 font-medium">EJECUTADO / PAGADO</SelectItem>
                              <SelectItem value="SOLICITADO" className="text-xs text-amber-700 font-medium">POR APROBAR (CRÉDITO)</SelectItem>
                              <SelectItem value="APROBADO" className="text-xs text-blue-700 font-medium">APROBADO (LISTO PARA PAGO)</SelectItem>
                              <SelectItem value="PENDIENTE" className="text-xs text-slate-600 font-medium">BORRADOR</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />

                    {/* Categoría */}
                    <FormField
                      control={form.control}
                      name="categoriaDistribucion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[11px] font-semibold text-slate-600">Categoría</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-white border-slate-200 h-9 text-xs">
                                <SelectValue placeholder="Categoría" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-white">
                              <SelectItem value="OPERATIVO_VARIO" className="text-xs">Operativo Varios</SelectItem>
                              <SelectItem value="LOGISTICA_MOVILIDAD" className="text-xs">Movilidad / Combustible</SelectItem>
                              <SelectItem value="MANO_OBRA" className="text-xs">Mano de Obra / Jornales</SelectItem>
                              <SelectItem value="MATERIALES" className="text-xs">Materiales y Ferretería</SelectItem>
                              <SelectItem value="EQUIPOS" className="text-xs">Equipos y Herramientas</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Zona de carga moderna: Archivo / sustento */}
                  <FormField
                    control={form.control}
                    name="comprobanteUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[11px] font-semibold text-slate-600">
                          Archivo / sustento (PDF o Imagen)
                        </FormLabel>
                        <FormControl>
                          <div>
                            <input 
                              ref={fileInputRef}
                              type="file" 
                              onChange={handleFileChange} 
                              className="hidden"
                              accept=".pdf,.xml,.jpg,.jpeg,.png"
                            />
                            
                            {field.value ? (
                              <div className="flex items-center justify-between p-3 bg-white border border-emerald-200 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <FileCheck className="w-4 h-4 text-emerald-600" />
                                  <span className="text-xs text-slate-700 font-medium">Archivo adjuntado con éxito</span>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs font-medium text-blue-600 border-blue-200 hover:bg-blue-50"
                                    onClick={() => window.open(getSecureUrl(field.value), '_blank')}
                                  >
                                    Ver archivo
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-xs text-slate-500 hover:text-slate-700"
                                    onClick={() => fileInputRef.current?.click()}
                                  >
                                    Cambiar
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={cn(
                                  "border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all bg-white hover:bg-slate-50 flex flex-col items-center justify-center gap-1.5",
                                  isDragging ? "border-primary bg-primary/5" : "border-slate-200 hover:border-slate-300"
                                )}
                              >
                                {isUploading ? (
                                  <div className="flex items-center gap-2 text-xs text-slate-600">
                                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                    <span>Subiendo archivo...</span>
                                  </div>
                                ) : (
                                  <>
                                    <UploadCloud className="w-6 h-6 text-slate-400" />
                                    <p className="text-xs font-medium text-slate-700">
                                      Arrastra un archivo aquí o <span className="text-primary hover:underline">haz clic para seleccionar</span>
                                    </p>
                                    <p className="text-[10px] text-slate-400">Formatos soportados: PDF, PNG, JPG, XML (máx. 10MB)</p>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Toggle IGV si es Factura */}
                  {form.watch("tipoComprobante") === "FACTURA" && (
                    <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg">
                      <div>
                        <p className="text-xs font-semibold text-slate-800">Aplica para Crédito Fiscal (IGV 18%)</p>
                        {watchAplicaImpuestos && (
                          <p className="text-[11px] text-slate-500 font-mono mt-0.5">
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

        {/* FOOTER FIJO DENTRO DEL MODAL */}
        <div className="flex-shrink-0 flex items-center justify-end gap-3 px-6 py-3.5 border-t border-slate-100 bg-white">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel} 
            className="font-medium text-xs text-slate-600 hover:text-slate-800 hover:bg-slate-50 border-slate-200 h-9 px-4 rounded-lg"
          >
            Cancelar
          </Button>

          <Button 
            type="submit" 
            disabled={isSubmitting || !isFormValid} 
            className="font-medium text-xs bg-primary hover:bg-primary/90 text-white h-9 px-5 rounded-lg shadow-sm disabled:opacity-50 transition-all"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Guardando...
              </span>
            ) : initialData ? (
              "Guardar gasto"
            ) : (
              "Guardar gasto"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
