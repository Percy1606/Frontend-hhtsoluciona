"use client";

import { useState, useEffect, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Briefcase,
  Calendar,
  ClipboardList,
  History,
  X,
  Download,
  Upload,
  FilePlus,
  Trash2,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  TrendingUp,
  Package,
  DollarSign,
  LineChart,
  TrendingDown,
} from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useOperacionesStore } from "@/store/operaciones-store";
import { useCRMStore } from "@/store/crm-store";
import { api } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn, formatDate, formatCurrency, getSecureUrl } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

import type { Proyecto } from "@/lib/types";
import { ActividadesPanel } from "./actividades-panel";
import { TimelinePanel } from "./timeline-panel";
import { FinancePanel } from "./finance-panel";

// ============================================
// CONSTANTES
// ============================================

const statusColors: Record<string, string> = {
  "Planificación": "bg-blue-100 text-blue-700",
  "En Ejecución": "bg-orange-100 text-orange-700",
  "Detenido": "bg-red-100 text-red-700",
  "Finalizado": "bg-green-100 text-green-700",
};

const prioridadColors: Record<string, string> = {
  "Baja": "bg-gray-100 text-gray-700",
  "Media": "bg-yellow-100 text-yellow-700",
  "Alta": "bg-orange-100 text-orange-700",
  "Crítica": "bg-red-100 text-red-700",
};

interface ProyectoDetailProps {
  proyecto: Proyecto;
  onClose: () => void;
}

export function ProyectoDetail({ proyecto, onClose }: ProyectoDetailProps) {
  const { user } = useAuthStore();
  const { responsables, fetchProjectProfitability, addDocumento, deleteDocumento } = useOperacionesStore();
  const { clients: crmClients } = useCRMStore();
  const [activeTab, setActiveTab] = useState("actividades");
  const [financeData, setFinanceData] = useState<any>(null);
  const [loadingFinance, setLoadingFinance] = useState(false);

  const clientName = crmClients.find(c => c.id === proyecto.clientId)?.empresa || "Cliente Externo";
  const responsableName = responsables.find(r => r.id === proyecto.responsablePrincipalId)?.nombre || "Sin asignar";

  useEffect(() => {
    const loadFinance = async () => {
      setLoadingFinance(true);
      try {
        const data = await fetchProjectProfitability(proyecto.id);
        setFinanceData(data);
      } catch (error) {
        console.error("Error loading finance data:", error);
      } finally {
        setLoadingFinance(false);
      }
    };
    loadFinance();
  }, [proyecto.id, fetchProjectProfitability]);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl w-[95vw] max-h-[95vh] p-0 border-none bg-slate-50 flex flex-col rounded-2xl shadow-2xl overflow-hidden">
        {/* HEADER REDUCIDO */}
        <DialogHeader className="p-6 bg-gradient-to-br from-primary via-primary to-primary/90 text-white rounded-t-2xl shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
            <Briefcase className="w-32 h-32 -mr-5 -mt-5 rotate-12" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <Badge className="bg-accent text-primary border-none font-black uppercase text-[9px] tracking-widest px-2.5 py-1 rounded-full shadow-lg shadow-black/10">
                {clientName}
              </Badge>
              <Badge className="bg-white/10 text-white/90 border-white/20 font-black uppercase text-[9px] tracking-widest px-2.5 py-1 rounded-full backdrop-blur-md">
                CÓDIGO: {proyecto.codigo}
              </Badge>
            </div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <DialogTitle className="text-xl lg:text-2xl font-black tracking-tight flex items-center gap-4 uppercase">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-lg border border-white/20 shadow-xl shrink-0">
                    <Briefcase className="w-6 h-6 text-accent" />
                </div>
                <div className="flex flex-col">
                    <span className="text-white drop-shadow-sm leading-tight">{proyecto.nombre}</span>
                </div>
              </DialogTitle>

              <div className="flex flex-col items-end gap-1.5 bg-white/10 p-3 rounded-xl backdrop-blur-md border border-white/10">
                <p className="text-[9px] font-black uppercase tracking-widest text-accent/80">Progreso Operativo</p>
                <div className="flex items-center gap-3">
                  <span className="text-xl font-black">{proyecto.avanceCalculado}%</span>
                  <div className="w-24 h-2 bg-white/20 rounded-full overflow-hidden border border-white/10">
                    <div className="h-full bg-accent transition-all duration-1000" style={{ width: `${proyecto.avanceCalculado}%` }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 mt-4">
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-sm">
                  <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-primary font-black text-[10px]">
                    {responsableName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-[8px] font-black uppercase opacity-60 tracking-widest">Líder</p>
                    <p className="text-[10px] font-black uppercase">{responsableName}</p>
                  </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge className={cn("border-none font-black text-[9px] uppercase px-3 py-1 shadow-md", statusColors[proyecto.estado])}>
                  {proyecto.estado}
                </Badge>
                <Badge className={cn("border-none font-black text-[9px] uppercase px-3 py-1 shadow-md", prioridadColors[proyecto.prioridad])}>
                  {proyecto.prioridad}
                </Badge>
              </div>

              <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-sm">
                <Calendar className="w-3 h-3 text-accent" />
                <span className="font-black text-[9px] uppercase tracking-tight">
                  {formatDate(proyecto.fechaInicio)} — {formatDate(proyecto.fechaFinEstimada)}
                </span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 bg-white">
          <div className="px-6 border-b bg-white shrink-0">
            <TabsList className="bg-transparent h-12 w-full justify-start gap-6 rounded-none p-0">
                <TabsTrigger value="actividades" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-[3px] data-[state=active]:border-primary rounded-none font-black text-[11px] uppercase h-full gap-2 text-slate-400 data-[state=active]:text-primary transition-all duration-300">
                    <ClipboardList className="w-4 h-4" /> Actividades ({proyecto.actividades.length})
                </TabsTrigger>
                <TabsTrigger value="logistica" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-[3px] data-[state=active]:border-primary rounded-none font-black text-[11px] uppercase h-full gap-2 text-slate-400 data-[state=active]:text-primary transition-all duration-300">
                    <Package className="w-4 h-4" /> Logística y Costos
                </TabsTrigger>
                <TabsTrigger value="finanzas" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-[3px] data-[state=active]:border-primary rounded-none font-black text-[11px] uppercase h-full gap-2 text-slate-400 data-[state=active]:text-primary transition-all duration-300">
                    <DollarSign className="w-4 h-4" /> Finanzas y Rentabilidad
                </TabsTrigger>
                <TabsTrigger value="documentos" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-[3px] data-[state=active]:border-primary rounded-none font-black text-[11px] uppercase h-full gap-2 text-slate-400 data-[state=active]:text-primary transition-all duration-300">
                    <FileText className="w-4 h-4" /> Documentos ({proyecto.documentos?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="historial" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-[3px] data-[state=active]:border-primary rounded-none font-black text-[11px] uppercase h-full gap-2 text-slate-400 data-[state=active]:text-primary transition-all duration-300">
                    <History className="w-4 h-4" /> Historial
                </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-6">
              <TabsContent value="actividades" className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-400 outline-none">
                <ActividadesPanel proyecto={proyecto} />
              </TabsContent>

              <TabsContent value="logistica" className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-400 outline-none">
                <LogisticaPanel proyecto={proyecto} data={financeData} loading={loadingFinance} />
              </TabsContent>

              <TabsContent value="finanzas" className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-400 outline-none">
                <FinancePanel proyectoId={proyecto.id} />
              </TabsContent>

              <TabsContent value="historial" className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-400 outline-none">
                <TimelinePanel />
              </TabsContent>

              <TabsContent value="documentos" className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-400 outline-none">
                <DocumentosPanel proyecto={proyecto} />
              </TabsContent>
            </div>
          </div>
        </Tabs>

        <DialogFooter className="p-3 border-t bg-slate-50 flex items-center justify-between shrink-0">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-4">HH T SOLUCIONA S.A.C. - SISTEMA DE GESTIÓN OPERATIVA v2.0</p>
          <Button variant="outline" onClick={onClose} className="gap-2 font-black uppercase text-[10px] border-slate-300 hover:bg-white hover:text-error hover:border-error transition-all rounded-xl h-10 px-6 shadow-sm">
            <X className="w-4 h-4" /> CERRAR VISTA DETALLADA
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// COMPONENTE: LogisticaPanel
// ============================================

function LogisticaPanel({ proyecto, data, loading }: { proyecto: Proyecto, data: any, loading: boolean }) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Calculando costos...</p>
      </div>
    );
  }

  if (!data) return null;

  const montoCotizado = Number(data.montoCotizado || 0);
  const costoTotal = Number(data.egresos?.costoTotal || 0);
  const historialMateriales = data.historialMateriales || [];
  const historialGastos = data.historialGastos || [];
  const presupuestoExcedido = data.presupuestoExcedido || (costoTotal > montoCotizado && montoCotizado > 0);

  const porcentajeConsumo = montoCotizado > 0 ? Math.round((costoTotal / montoCotizado) * 100) : 0;
  const margenRestante = montoCotizado - costoTotal;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* ALERTA DE PRESUPUESTO EXCEDIDO */}
      {presupuestoExcedido && (
        <div className="bg-red-600 text-white p-4 rounded-2xl flex items-center gap-4 shadow-lg shadow-red-200">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <div>
                <h4 className="text-sm font-black uppercase">¡ALERTA DE SOBRECOSTO!</h4>
                <p className="text-[10px] font-bold opacity-90 uppercase">Este proyecto ha dejado de ser rentable. Los costos superan el presupuesto en S/ {Math.abs(margenRestante).toLocaleString()}.</p>
            </div>
        </div>
      )}

      {/* RESUMEN FINANCIERO REDUCIDO */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-white rounded-lg shadow-sm">
              <TrendingUp className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="text-[8px] font-black text-primary uppercase tracking-widest">Presupuesto Base</span>
          </div>
          <p className="text-lg font-black text-primary tracking-tight">S/ {montoCotizado?.toLocaleString() || '0.00'}</p>
        </div>

        <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-white rounded-lg shadow-sm">
              <DollarSign className="w-3.5 h-3.5 text-orange-600" />
            </div>
            <span className="text-[8px] font-black text-orange-600 uppercase tracking-widest">Inversión Actual</span>
          </div>
          <p className="text-lg font-black text-orange-600 tracking-tight">S/ {costoTotal?.toLocaleString() || '0.00'}</p>
        </div>

        <div className={cn("p-4 rounded-2xl border", porcentajeConsumo > 90 ? "bg-red-50 border-red-100" : "bg-emerald-50 border-emerald-100")}>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-white rounded-lg shadow-sm">
              <LineChart className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <span className="text-[8px] font-black uppercase tracking-widest">Ejecución</span>
          </div>
          <p className={cn("text-lg font-black tracking-tight", porcentajeConsumo > 90 ? "text-red-600" : "text-emerald-600")}>
            {porcentajeConsumo}%
          </p>
        </div>

        <div className={cn("p-4 rounded-2xl border", margenRestante < 0 ? "bg-red-600 text-white" : "bg-blue-50 border-blue-100")}>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-white rounded-lg shadow-sm">
              <History className={cn("w-3.5 h-3.5", margenRestante < 0 ? "text-red-600" : "text-blue-600")} />
            </div>
            <span className={cn("text-[8px] font-black uppercase tracking-widest", margenRestante < 0 ? "text-white" : "text-blue-600")}>Disponible</span>
          </div>
          <p className="text-lg font-black tracking-tight">S/ {margenRestante?.toLocaleString() || '0.00'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LISTADO DE MATERIALES */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
                <Package className="w-4 h-4 text-primary" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-tight">Detalle de Materiales (Kardex)</h3>
            </div>
            <Badge className="bg-primary/5 text-primary border-primary/10 font-black text-[9px] px-2 py-0.5">
              S/ {Number(data.egresos?.materiales || 0).toLocaleString()}
            </Badge>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="border-b border-slate-100">
                  <TableHead className="font-black uppercase text-[9px] py-2.5 pl-4">Material / Fecha</TableHead>
                  <TableHead className="font-black uppercase text-[9px] text-center">Cant.</TableHead>
                  <TableHead className="font-black uppercase text-[9px] text-right pr-4">Costo S/.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historialMateriales?.length > 0 ? (
                  historialMateriales.map((item: any, idx: number) => (
                    <TableRow key={idx} className="border-b border-slate-50 hover:bg-slate-50/30">
                      <TableCell className="py-2.5 pl-4">
                        <p className="font-bold text-[10px] uppercase text-slate-700">{item.material}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <p className="text-[8px] font-medium text-slate-400">{formatDate(item.fecha)}</p>
                          {item.origen && (
                             <Badge variant="outline" className="text-[7px] h-3 px-1 py-0 bg-slate-50 text-slate-400 border-slate-200">
                               {item.origen}
                             </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-bold text-[10px]">{item.cantidad}</TableCell>
                      <TableCell className="text-right pr-4 font-black text-[10px] text-primary">S/ {item.costoTotal?.toLocaleString()}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="py-12 text-center">
                      <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Sin despachos de almacén</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* LISTADO DE GASTOS DIRECTOS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-orange-600" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-tight">Gastos y Servicios Directos</h3>
            </div>
            <Badge className="bg-orange-50 text-orange-600 border-orange-100 font-black text-[9px] px-2 py-0.5">
              S/ {Number(data.egresos?.gastosDirectos || 0).toLocaleString()}
            </Badge>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="border-b border-slate-100">
                  <TableHead className="font-black uppercase text-[9px] py-2.5 pl-4">Concepto / Comprobante</TableHead>
                  <TableHead className="font-black uppercase text-[9px] text-center">Estado</TableHead>
                  <TableHead className="font-black uppercase text-[9px] text-right pr-4">Monto S/.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historialGastos?.length > 0 ? (
                  historialGastos.map((g: any, idx: number) => (
                    <TableRow key={idx} className="border-b border-slate-50 hover:bg-slate-50/30">
                      <TableCell className="py-2.5 pl-4">
                        <p className="font-bold text-[10px] uppercase text-slate-700 truncate max-w-[200px]">{g.concepto}</p>
                        <p className="text-[8px] font-black text-primary uppercase">{g.codigo || 'S/N'}</p>
                      </TableCell>
                      <TableCell className="text-center">
                         <Badge className={cn(
                           "text-[7px] font-black uppercase h-4",
                           g.estado === 'PAGADO' ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                         )}>
                            {g.estado}
                         </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-4 font-black text-[10px] text-orange-600">S/ {g.monto?.toLocaleString()}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="py-12 text-center">
                      <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Sin gastos registrados</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// COMPONENTE: DocumentosPanel
// ============================================

const tipoDocumentoOptions = [
  { label: "Técnico (Planos, Especificaciones)", value: "Técnico" },
  { label: "Administrativo (Contratos, Actas)", value: "Administrativo" },
  { label: "Legal (Permisos, Licencias)", value: "Legal" },
  { label: "Financiero (Presupuestos, Facturas)", value: "Financiero" },
  { label: "Otro", value: "Otro" },
];

const estadoDocumentoColors: Record<string, string> = {
  "Pendiente": "bg-yellow-100 text-yellow-700",
  "En Revisión": "bg-blue-100 text-blue-700",
  "Aprobado": "bg-green-100 text-green-700",
  "Rechazado": "bg-red-100 text-red-700",
  "Borrador": "bg-gray-100 text-gray-700",
};

interface DocumentosPanelProps {
  proyecto: Proyecto;
}

function DocumentosPanel({ proyecto }: DocumentosPanelProps) {
  const { user } = useAuthStore();
  const { addDocumento, deleteDocumento, loading } = useOperacionesStore();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newDoc, setNewDoc] = useState<{
    nombre: string;
    tipo: string;
    url: string;
    observaciones: string;
  }>({
    nombre: "",
    tipo: "",
    url: "",
    observaciones: "",
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setNewDoc((prev) => ({
        ...prev,
        nombre: file.name,
      }));
    }
  };

  const handleUploadDocument = async () => {
    if (!selectedFile || !newDoc.tipo) return;

    const MAX_SIZE = 10 * 1024 * 1024;
    if (selectedFile.size > MAX_SIZE) {
      alert("El archivo es demasiado pesado (máx 10MB). Reduzca el tamaño o use una imagen más ligera.");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const uploadResponse = await api.post('/operaciones/upload', formData);
      const fileUrl = uploadResponse.url;

      if (!fileUrl) throw new Error("No se recibió la URL del archivo");

      await addDocumento(proyecto.id, {
        proyectoId: proyecto.id,
        nombre: newDoc.nombre || selectedFile.name,
        tipo: newDoc.tipo as any,
        url: fileUrl,
        estado: "Borrador",
        subidoPor: user?.nombre || "Sistema",
        observaciones: newDoc.observaciones,
        fechaSubida: new Date().toISOString(),
        validaciones: [],
      });

      setNewDoc({ nombre: "", tipo: "", url: "", observaciones: "" });
      setSelectedFile(null);
      setIsUploadOpen(false);
    } catch (error: any) {
      console.error("Error al subir archivo:", error);
      alert("No se pudo guardar el documento.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveDocument = async (docId: string) => {
    if (!confirm("¿Está seguro de que desea eliminar este documento?")) return;
    try {
      await deleteDocumento(proyecto.id, docId);
    } catch (error) {
      alert("No se pudo eliminar el documento.");
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-tight">Expediente del Proyecto</h3>
            <p className="text-[10px] font-medium text-slate-400">Gestión de planos, actas y certificados técnicos.</p>
          </div>
        </div>
        <Button
          onClick={() => setIsUploadOpen(true)}
          className="gap-2 font-black uppercase text-[10px] h-10 px-4 shadow-lg shadow-primary/10"
        >
          <Upload className="w-3.5 h-3.5" /> Subir
        </Button>
      </div>

      {proyecto.documentos && proyecto.documentos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {proyecto.documentos.map((doc) => (
            <div
              key={doc.id}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-primary/20 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-red-500" />
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="font-bold text-slate-800 text-[11px] truncate uppercase" title={doc.nombre}>{doc.nombre}</h4>
                    <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">{doc.tipo}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-3 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                <Badge className={cn("text-[8px] font-black uppercase border-none h-4 shadow-none", estadoDocumentoColors[doc.estado] || "bg-slate-200")}>
                  {doc.estado}
                </Badge>
                <span className="text-[8px] text-slate-400 font-bold uppercase flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  {formatDate(doc.fechaSubida)}
                </span>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="flex-1 h-8 text-[9px] font-black uppercase text-primary hover:bg-primary/5"
                  onClick={() => {
                    const fullUrl = getSecureUrl(doc.url);
                    window.open(fullUrl, '_blank');
                  }}
                >
                  <Download className="w-3 h-3 mr-1" /> Ver
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                  onClick={() => handleRemoveDocument(doc.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
          <FilePlus className="w-10 h-10 text-slate-200 mx-auto mb-2" />
          <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">No hay documentos</p>
        </div>
      )}

      {isUploadOpen && (
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogContent className="max-w-md p-0 border-none overflow-hidden rounded-2xl shadow-2xl bg-white">
                <DialogHeader className="p-4 bg-primary text-white shrink-0">
                    <DialogTitle className="text-sm font-black uppercase flex items-center gap-2">
                        <Upload className="w-4 h-4 text-accent" /> Subir al Expediente
                    </DialogTitle>
                </DialogHeader>
                <div className="p-4 space-y-4 bg-white">
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <Label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Archivo *</Label>
                            <Input
                                type="file"
                                onChange={handleFileChange}
                                className="h-10 border-slate-200 cursor-pointer text-xs"
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.dwg,.dxf"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Tipo *</Label>
                            <Select value={newDoc.tipo} onValueChange={(v) => setNewDoc(prev => ({ ...prev, tipo: v || "" }))}>
                                <SelectTrigger className="h-10 border-slate-200 font-bold text-xs">
                                    <SelectValue placeholder="Categoría..." />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                    {tipoDocumentoOptions.map((tipo) => (
                                        <SelectItem key={tipo.value} value={tipo.value} className="font-bold text-xs">
                                            {tipo.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Observaciones</Label>
                            <Textarea
                                placeholder="..."
                                value={newDoc.observaciones}
                                onChange={(e) => setNewDoc(prev => ({ ...prev, observaciones: e.target.value }))}
                                className="h-16 resize-none border-slate-200 text-xs"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2 pt-3 border-t border-slate-100">
                        <Button variant="ghost" onClick={() => setIsUploadOpen(false)} className="flex-1 font-bold text-slate-500 uppercase text-[10px]">Cerrar</Button>
                        <Button
                            onClick={handleUploadDocument}
                            disabled={!selectedFile || !newDoc.tipo || isUploading}
                            className="flex-1 font-black uppercase text-[10px] shadow-lg shadow-primary/20"
                        >
                            {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Upload className="w-3.5 h-3.5 mr-1.5" />}
                            Subir
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export function StatsCard({
  label,
  value,
  icon,
  color,
  bgColor,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="bg-white p-3 rounded-xl border border-border shadow-sm transition-all hover:shadow-md hover:border-primary/20 group">
      <div className="flex items-center gap-2">
        <div className={cn("p-1.5 rounded-lg transition-transform group-hover:scale-110", bgColor)}>
          <div className={cn("w-4 h-4", color)}>{icon}</div>
        </div>
        <div>
          <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">{label}</p>
          <p className={cn("text-lg font-black tracking-tighter", color)}>{value}</p>
        </div>
      </div>
    </div>
  );
}
