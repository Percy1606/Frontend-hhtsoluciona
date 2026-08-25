"use client";

import { useRef, useState, useEffect } from "react";
import { 
  Download, 
  BookOpen, 
  Info,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  Zap,
  Users,
  Briefcase,
  BarChart3,
  Settings,
  Truck,
  Video,
  Plus,
  Trash2,
  ExternalLink,
  PlayCircle,
  FileVideo,
  FileText,
  AlertCircle,
  Clock,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/auth-store";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface ManualVideo {
  id: string;
  titulo: string;
  descripcion?: string;
  moduloId: string;
  driveUrl: string;
  driveEmbedUrl: string;
  orden?: number;
  duracion?: string;
  fechaCreacion: string;
}

interface ManualModulo {
  id: string;
  nombre: string;
  descripcion: string;
  icono: string;
}

const MODULOS_ICON_MAP: Record<string, any> = {
  comercial: Users,
  operaciones: Briefcase,
  logistica: Truck,
  finanzas: BarChart3,
  configuracion: Settings,
};

const sections = [
  {
    title: "Primeros Pasos y Acceso",
    icon: BookOpen,
    content: "Conceptos fundamentales para iniciar su jornada en el ecosistema SOFTWARE HH.",
    steps: [
      "Autenticación y Login: Ingrese sus credenciales únicas (Usuario y Contraseña) en la pantalla de inicio provista por su administrador.",
      "Seguridad de la Sesión: El sistema cuenta con cierre de sesión automático tras inactividad para garantizar la protección de la información de la empresa.",
      "Navegación Principal: Utilice el menú lateral izquierdo para acceder rápidamente a los módulos asignados a su perfil de usuario.",
      "Dashboard Ejecutivo: Pantalla de inicio con KPI's críticos en tiempo real, alertas de sistema, estados de proyectos y resumen de actividades recientes.",
      "Perfil de Usuario: Puede actualizar sus datos personales, cambiar su contraseña y ajustar preferencias visuales desde la esquina superior derecha."
    ]
  },
  {
    title: "Módulo CRM Comercial (Ventas)",
    icon: Users,
    content: "Gestión integral de clientes, prospectos y control exhaustivo del embudo de ventas.",
    steps: [
      "Mantenimiento de Cartera: Registre y actualice perfiles de clientes detallados (RUC, Razón Social, Zona, Tarifario MT1-MT4, Contactos clave).",
      "Gestión del Pipeline Comercial: Visualice y mueva oportunidades a través de etapas personalizadas (Prospecto, Contactado, Propuesta, Negociación, Cierre Ganado/Perdido).",
      "Bitácora de Interacciones: Registre cada punto de contacto (llamadas, reuniones, correos) para mantener un historial completo y evitar pérdida de información.",
      "Módulo de Cotizaciones: Genere propuestas económicas profesionales en formato PDF, con cálculo automático de impuestos y descuentos, vinculadas al cliente.",
      "Análisis de Conversión: Monitoree indicadores de rendimiento comercial, volumen de ventas proyectadas y efectividad del equipo de ventas."
    ]
  },
  {
    title: "Operaciones y Proyectos",
    icon: Briefcase,
    content: "El motor de ejecución técnica, planificación y seguimiento de HH T-SOLUCIONA.",
    steps: [
      "Creación de Proyectos: Estructure nuevos proyectos definiendo alcances, presupuesto inicial, Responsable Principal (Jefe de Proyecto) y equipo asignado.",
      "Cronograma y Gantt (Timeline): Visualice de forma gráfica el avance temporal de las fases del proyecto, identificando cuellos de botella y dependencias.",
      "Gestión de Tareas y Actividades: Desglose el trabajo en tareas específicas, asignando responsables y controlando estados (Pendiente, En Progreso, Observado, Completado).",
      "Control de Calidad y Validaciones: Implemente flujos de aprobación obligatorios y checklist de hitos técnicos para garantizar los estándares de calidad en campo.",
      "Centro de Notificaciones: Los técnicos e ingenieros reciben alertas directas sobre nuevas asignaciones, fechas de vencimiento y cambios en los requerimientos."
    ]
  },
  {
    title: "Logística y Almacén",
    icon: Truck,
    content: "Administración eficiente de inventario, trazabilidad de activos y cadena de suministro.",
    steps: [
      "Control de Inventario en Tiempo Real: Monitoree el stock disponible de materiales, insumos, EPPs y ubicación de herramientas o equipos pesados.",
      "Gestión de Órdenes de Compra (OC): Genere, apruebe y envíe solicitudes de compra a proveedores, vinculando los costos directamente a proyectos específicos.",
      "Kardex Digital Avanzado: Registre cada movimiento (entrada, salida, transferencia, merma) con fecha exacta, responsable y sustento del movimiento.",
      "Gestión de Proveedores: Mantenga un directorio actualizado, evaluando tiempos de respuesta, calidad y condiciones crediticias.",
      "Alertas de Stock Mínimo: El sistema notificará automáticamente cuando un material crítico alcance su punto de reposición."
    ]
  },
  {
    title: "Finanzas e Ingresos",
    icon: BarChart3,
    content: "Transparencia económica, facturación y control de flujos de caja operativos.",
    steps: [
      "Emisión y Control de Facturas: Registre comprobantes de pago emitidos, controlando fechas de vencimiento y vinculándolos al progreso de los proyectos.",
      "Gestión de Cuentas por Cobrar: Realice seguimiento a saldos pendientes de clientes, enviando recordatorios y registrando pagos parciales o totales.",
      "Control de Gastos (Egresos): Registre facturas de proveedores y comprobantes de caja chica para calcular la rentabilidad real y márgenes de cada proyecto.",
      "Reportes y Dashboards Financieros: Analice gráficos dinámicos de ingresos vs egresos, flujo de caja proyectado y estados de resultados por centro de costo.",
      "Conciliación Básica: Cruce la información de pagos registrados en sistema con los abonos reales en cuentas bancarias."
    ]
  },
  {
    title: "Configuración y Auditoría",
    icon: Settings,
    content: "Administración global del sistema, gestión de seguridad y personalización avanzada.",
    steps: [
      "Gestión de Usuarios y Roles: Cree cuentas de acceso y asigne roles con permisos granulares (lectura, escritura, eliminación) por cada módulo.",
      "Parametrización del Sistema: Ajuste variables globales como tipo de cambio, correlativos de documentos, impuestos y datos de la empresa.",
      "Mantenimiento de Catálogos: Gestione listas desplegables (categorías, zonas, marcas, unidades de medida) que alimentan todos los formularios.",
      "Log de Auditoría Inmutable: Consulte el registro detallado de transacciones (quién, qué, cuándo, desde qué IP) para rastrear cambios críticos o eliminaciones.",
      "Copias de Seguridad (Backups): Programe y monitoree los respaldos automáticos de la base de datos para garantizar la continuidad del negocio."
    ]
  }
];


export default function ManualPage() {
  const manualRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<"videos" | "texto">("videos");
  const [expandedSections, setExpandedSections] = useState<number[]>([]);
  
  // Estado para Videos
  const [modulos, setModulos] = useState<ManualModulo[]>([]);
  const [videos, setVideos] = useState<ManualVideo[]>([]);
  const [selectedModuloId, setSelectedModuloId] = useState<string>("comercial");
  const [selectedVideo, setSelectedVideo] = useState<ManualVideo | null>(null);
  const [loadingVideos, setLoadingVideos] = useState<boolean>(true);

  // Modal para agregar video
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [savingVideo, setSavingVideo] = useState(false);
  const [formModuloId, setFormModuloId] = useState("comercial");
  const [formTitulo, setFormTitulo] = useState("");
  const [formDescripcion, setFormDescripcion] = useState("");
  const [formDriveUrl, setFormDriveUrl] = useState("");
  const [formDuracion, setFormDuracion] = useState("");

  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.rol === "ADMIN";

  const fetchVideos = async () => {
    try {
      setLoadingVideos(true);
      const data = await api.get<{ modulos: ManualModulo[]; videos: ManualVideo[] }>('/config/manuales');
      if (data) {
        setModulos(data.modulos || []);
        setVideos(data.videos || []);
        if (data.modulos?.length > 0 && !selectedModuloId) {
          setSelectedModuloId(data.modulos[0].id);
        }
      }
    } catch (error) {
      console.error("Error al cargar videos:", error);
    } finally {
      setLoadingVideos(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  useEffect(() => {
    const videosDelModulo = videos.filter((v) => v.moduloId === selectedModuloId);
    if (videosDelModulo.length > 0) {
      if (!selectedVideo || selectedVideo.moduloId !== selectedModuloId) {
        setSelectedVideo(videosDelModulo[0]);
      }
    } else {
      setSelectedVideo(null);
    }
  }, [selectedModuloId, videos]);

  const toggleSection = (idx: number) => {
    setExpandedSections((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const handleDownload = async () => {
    if (typeof window === 'undefined') return;

    try {
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = html2pdfModule.default || html2pdfModule;

      const element = manualRef.current;
      if (!element) return;

      const opt = {
        margin: 10,
        filename: `Manual_Usuario_SOFTWARE_HH_${new Date().getFullYear()}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          logging: false,
          letterRendering: true,
          allowTaint: false
        },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
      };

      const allIds = sections.map((_, i) => i);
      setExpandedSections(allIds);
      await new Promise((r) => setTimeout(r, 500));
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  const handleCreateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitulo.trim() || !formDriveUrl.trim()) {
      toast.error("Por favor ingresa el título y el enlace de Drive");
      return;
    }

    try {
      setSavingVideo(true);
      const res = await api.post<ManualVideo>('/config/manuales/video', {
        moduloId: formModuloId,
        titulo: formTitulo,
        descripcion: formDescripcion,
        driveUrl: formDriveUrl,
        duracion: formDuracion,
      });

      toast.success("Video tutorial agregado correctamente");
      setFormTitulo("");
      setFormDescripcion("");
      setFormDriveUrl("");
      setFormDuracion("");
      setIsModalOpen(false);
      
      await fetchVideos();
      setSelectedModuloId(formModuloId);
      if (res) setSelectedVideo(res);
    } catch (error: any) {
      toast.error(error?.message || "Error al guardar el video");
    } finally {
      setSavingVideo(false);
    }
  };

  // Modal para confirmar eliminación
  const [videoAEliminar, setVideoAEliminar] = useState<ManualVideo | null>(null);
  const [deletingVideo, setDeletingVideo] = useState(false);

  const confirmDelete = async () => {
    if (!videoAEliminar) return;

    try {
      setDeletingVideo(true);
      await api.delete(`/config/manuales/video/${videoAEliminar.id}`);
      toast.success(`Video "${videoAEliminar.titulo}" eliminado con éxito`);
      setVideoAEliminar(null);
      await fetchVideos();
    } catch (error: any) {
      toast.error(error?.message || "Error al eliminar video");
    } finally {
      setDeletingVideo(false);
    }
  };

  const videosActuales = videos.filter((v) => v.moduloId === selectedModuloId);
  const moduloActual = modulos.find((m) => m.id === selectedModuloId);

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Principal */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#001F3F] rounded-2xl text-white shadow-md">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-[#001F3F]">Centro de Capacitación y Manuales</h1>
            <p className="text-xs text-slate-500 font-medium">Documentación oficial y videotutoriales por módulos de SOFTWARE HH</p>
          </div>
        </div>

        {/* Selector de Pestañas */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab("videos")}
            className={`flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all flex-1 sm:flex-initial ${
              activeTab === "videos"
                ? "bg-[#001F3F] text-white shadow-md"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
            }`}
          >
            <Video className="w-4 h-4 text-rose-400" />
            Videotutoriales Drive
          </button>
          <button
            onClick={() => setActiveTab("texto")}
            className={`flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all flex-1 sm:flex-initial ${
              activeTab === "texto"
                ? "bg-[#001F3F] text-white shadow-md"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
            }`}
          >
            <FileText className="w-4 h-4 text-blue-400" />
            Guía Escrita & PDF
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* VISTA 1: VIDEOTUTORIALES DRIVE POR MÓDULOS */}
      {/* ======================================================== */}
      {activeTab === "videos" && (
        <div className="space-y-6">
          {/* Barra de Módulos */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
            <div className="flex flex-wrap gap-2">
              {modulos.map((mod) => {
                const IconComponent = MODULOS_ICON_MAP[mod.id] || FileVideo;
                const isSelected = selectedModuloId === mod.id;
                const count = videos.filter((v) => v.moduloId === mod.id).length;

                return (
                  <button
                    key={mod.id}
                    onClick={() => setSelectedModuloId(mod.id)}
                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
                      isSelected
                        ? "bg-[#001F3F] text-white shadow-md scale-[1.02]"
                        : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 shadow-sm"
                    }`}
                  >
                    <IconComponent className={`w-4 h-4 ${isSelected ? "text-rose-400" : "text-slate-500"}`} />
                    <span>{mod.nombre}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {isAdmin && (
              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[#E30613] hover:bg-[#C20510] text-white font-bold rounded-xl h-10 px-4 text-xs shadow-md shadow-rose-600/20 gap-2">
                    <Plus className="w-4 h-4" />
                    Subir Video de Drive
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px] rounded-3xl p-6 bg-white">
                  <DialogHeader>
                    <DialogTitle className="text-lg font-black uppercase text-[#001F3F] flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-[#E30613]" />
                      Agregar Video Tutorial de Drive
                    </DialogTitle>
                  </DialogHeader>

                  <form onSubmit={handleCreateVideo} className="space-y-4 mt-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700">Módulo del Sistema</Label>
                      <select
                        value={formModuloId}
                        onChange={(e) => setFormModuloId(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#001F3F]"
                      >
                        {modulos.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700">Nombre / Título del Video *</Label>
                      <Input
                        required
                        placeholder="Ej: 1. Cómo registrar cotizaciones y emitir PDF"
                        value={formTitulo}
                        onChange={(e) => setFormTitulo(e.target.value)}
                        className="rounded-xl text-xs h-10"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700">Enlace de Google Drive *</Label>
                      <Input
                        required
                        placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
                        value={formDriveUrl}
                        onChange={(e) => setFormDriveUrl(e.target.value)}
                        className="rounded-xl text-xs h-10"
                      />
                      <p className="text-[11px] text-slate-500">
                        Pega el enlace compartido de Google Drive (debe tener permiso de visualización).
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-700">Duración Estimada</Label>
                        <Input
                          placeholder="Ej: 4:30 min"
                          value={formDuracion}
                          onChange={(e) => setFormDuracion(e.target.value)}
                          className="rounded-xl text-xs h-10"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-700">Descripción (Opcional)</Label>
                        <Input
                          placeholder="Breve detalle del video"
                          value={formDescripcion}
                          onChange={(e) => setFormDescripcion(e.target.value)}
                          className="rounded-xl text-xs h-10"
                        />
                      </div>
                    </div>

                    <DialogFooter className="mt-4 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsModalOpen(false)}
                        className="rounded-xl h-10 text-xs"
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={savingVideo}
                        className="bg-[#001F3F] hover:bg-[#001F3F]/90 text-white rounded-xl h-10 text-xs font-bold"
                      >
                        {savingVideo ? "Guardando..." : "Guardar Video"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Contenido: Reproductor y Lista */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Reproductor Principal */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                {selectedVideo ? (
                  <>
                    <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-inner border border-slate-200">
                      <iframe
                        src={selectedVideo.driveEmbedUrl}
                        className="w-full h-full border-0"
                        allow="autoplay; encrypted-media; fullscreen"
                        allowFullScreen
                        title={selectedVideo.titulo}
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-[#E30613] border border-rose-200">
                            {moduloActual?.nombre || selectedVideo.moduloId}
                          </span>
                          {selectedVideo.duracion && (
                            <span className="flex items-center gap-1 text-[11px] text-slate-500 font-semibold">
                              <Clock className="w-3 h-3" />
                              {selectedVideo.duracion}
                            </span>
                          )}
                        </div>
                        <h2 className="text-lg font-black text-[#001F3F] mt-1 tracking-tight">
                          {selectedVideo.titulo}
                        </h2>
                        {selectedVideo.descripcion && (
                          <p className="text-xs text-slate-600 mt-1 font-medium">
                            {selectedVideo.descripcion}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={selectedVideo.driveUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Abrir en Drive
                        </a>

                        <button
                          onClick={() => setVideoAEliminar(selectedVideo)}
                          title="Eliminar este video"
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Eliminar Video
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="aspect-video w-full rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-8 text-center">
                    <Video className="w-12 h-12 text-slate-300 mb-3" />
                    <h3 className="text-sm font-bold text-slate-700 uppercase">No hay videos en este módulo</h3>
                    <p className="text-xs text-slate-500 max-w-sm mt-1">
                      {videosActuales.length === 0
                        ? "Aún no se han agregado videos para este módulo. Los administradores pueden añadir enlaces de Drive haciendo clic en 'Subir Video de Drive'."
                        : "Selecciona un video de la lista para reproducirlo."}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Lista Lateral de Videos */}
            <div className="space-y-3">
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-black uppercase text-[#001F3F] tracking-wider flex items-center gap-2">
                    <PlayCircle className="w-4 h-4 text-[#E30613]" />
                    Videos del Módulo ({videosActuales.length})
                  </h3>
                </div>

                <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                  {videosActuales.length === 0 ? (
                    <div className="py-8 text-center space-y-2">
                      <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="text-xs font-semibold text-slate-500">Sin videos en este módulo</p>
                    </div>
                  ) : (
                    videosActuales.map((vid, idx) => {
                      const isPlaying = selectedVideo?.id === vid.id;
                      return (
                        <div
                          key={vid.id}
                          onClick={() => setSelectedVideo(vid)}
                          className={`p-3 rounded-2xl cursor-pointer transition-all border group relative ${
                            isPlaying
                              ? "bg-[#001F3F] text-white border-[#001F3F] shadow-md"
                              : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2.5">
                              <div className={`p-2 rounded-xl mt-0.5 ${
                                isPlaying ? "bg-white/10 text-rose-400" : "bg-white text-[#001F3F] shadow-sm"
                              }`}>
                                <PlayCircle className="w-4 h-4" />
                              </div>
                              <div>
                                <span className={`text-[10px] font-black uppercase block ${
                                  isPlaying ? "text-slate-300" : "text-slate-400"
                                }`}>
                                  Video #{idx + 1}
                                </span>
                                <h4 className="text-xs font-bold line-clamp-2 leading-snug">
                                  {vid.titulo}
                                </h4>
                                {vid.duracion && (
                                  <span className={`text-[10px] font-medium mt-1 inline-block ${
                                    isPlaying ? "text-slate-300" : "text-slate-500"
                                  }`}>
                                    ⏱️ {vid.duracion}
                                  </span>
                                )}
                              </div>
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setVideoAEliminar(vid);
                              }}
                              title="Eliminar Video"
                              className={`p-2 rounded-xl transition-all ${
                                isPlaying
                                  ? "hover:bg-white/20 text-rose-300"
                                  : "hover:bg-rose-100 text-rose-500"
                              }`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Modal / Dialog de Confirmación de Eliminación */}
          <Dialog open={!!videoAEliminar} onOpenChange={(open) => !open && setVideoAEliminar(null)}>
            <DialogContent className="sm:max-w-[420px] rounded-3xl p-6 bg-white">
              <DialogHeader>
                <div className="mx-auto w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-2">
                  <Trash2 className="w-6 h-6" />
                </div>
                <DialogTitle className="text-center text-lg font-black uppercase text-[#001F3F]">
                  ¿Deseas eliminar este video?
                </DialogTitle>
              </DialogHeader>

              <div className="text-center space-y-2 py-2">
                <p className="text-xs text-slate-600 font-medium">
                  Estás a punto de eliminar el siguiente videotutorial del sistema:
                </p>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <p className="text-xs font-bold text-[#001F3F]">
                    {videoAEliminar?.titulo}
                  </p>
                </div>
                <p className="text-[11px] text-slate-400">
                  (El enlace se quitará de la plataforma. El archivo original en tu Google Drive permanecerá intacto).
                </p>
              </div>

              <DialogFooter className="mt-4 flex gap-2 justify-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setVideoAEliminar(null)}
                  disabled={deletingVideo}
                  className="rounded-xl h-10 text-xs font-semibold flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={confirmDelete}
                  disabled={deletingVideo}
                  className="bg-[#E30613] hover:bg-[#C20510] text-white rounded-xl h-10 text-xs font-bold flex-1 shadow-md shadow-rose-600/20"
                >
                  {deletingVideo ? "Eliminando..." : "Sí, Eliminar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* ======================================================== */}
      {/* VISTA 2: GUÍA ESCRITA */}
      {/* ======================================================== */}
      {activeTab === "texto" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
            <Alert className="bg-[#EFF6FF] border-[#DBEAFE] border rounded-2xl flex-1 mr-4">
              <Info className="h-4 w-4 text-[#2563EB]" />
              <AlertTitle className="font-black text-[#1E40AF] uppercase text-[11px] tracking-wider">Centro de Guías Oficiales</AlertTitle>
              <AlertDescription className="text-[#1E40AF] text-xs font-medium">
                Consulte las especificaciones paso a paso o descargue el manual completo en formato PDF imprimible.
              </AlertDescription>
            </Alert>
            <Button 
              onClick={handleDownload}
              className="bg-[#E30613] hover:bg-[#C20510] text-white font-bold rounded-xl h-11 px-5 shadow-md shadow-rose-600/20 transition-all text-xs shrink-0"
            >
              <Download className="mr-2 h-4 w-4" />
              Exportar PDF
            </Button>
          </div>

          <div ref={manualRef} className="space-y-6 bg-slate-50/50 p-2 rounded-3xl">
            <div className="hidden pdf-only flex flex-col items-center justify-center p-12 border-b-2 border-[#F1F5F9] mb-8">
              <div className="flex items-center gap-4 mb-4">
                <Zap className="w-12 h-12 text-[#001F3F]" />
                <h1 className="text-4xl font-black text-[#001F3F]">SOFTWARE HH</h1>
              </div>
              <h2 className="text-2xl font-bold text-[#475569] uppercase tracking-widest">Manual de Usuario</h2>
              <p className="text-[#94A3B8] mt-2 font-mono">Versión 2026.1 - HH T-SOLUCIONA S.A.C.</p>
            </div>

            <div className="grid gap-4">
              {sections.map((section, idx) => {
                const isExpanded = expandedSections.includes(idx);
                return (
                  <div key={idx} className="border border-slate-100 shadow-sm bg-white rounded-3xl overflow-hidden hover:shadow-md transition-all duration-300">
                    <div 
                      className="flex flex-row items-center justify-between gap-5 p-6 pb-4 cursor-pointer select-none"
                      onClick={() => toggleSection(idx)}
                    >
                      <div className="flex flex-row items-center gap-4">
                        <div className="p-3.5 rounded-2xl bg-slate-50 text-[#001F3F] border border-slate-100 shadow-inner">
                          <section.icon className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-[#001F3F] uppercase tracking-tight">{section.title}</h3>
                          <p className="text-[#64748B] font-medium text-xs mt-0.5">{section.content}</p>
                        </div>
                      </div>
                      <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors">
                        <ChevronDown className={`w-5 h-5 text-[#001F3F] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="p-6 pt-0 animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="h-px bg-slate-100 mb-4" />
                        <ul className="space-y-3">
                          {section.steps.map((step, sIdx) => (
                            <li key={sIdx} className="flex items-start gap-3.5 group">
                              <div className="mt-0.5 flex items-center justify-center w-5 h-5 rounded-full bg-rose-50 text-[#E30613] group-hover:bg-[#E30613] group-hover:text-white transition-colors duration-300">
                                <ChevronRight className="h-3 w-3 shrink-0" />
                              </div>
                              <span className="text-slate-600 text-xs font-semibold leading-relaxed group-hover:text-[#001F3F] transition-colors">{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="text-center p-6 mt-8 border-t border-slate-100">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                © 2026 HH T-SOLUCIONA S.A.C. - Confidencial
              </p>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @media print {
          .pdf-only { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
