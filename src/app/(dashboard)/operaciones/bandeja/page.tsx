"use client";

import { useEffect, useState } from "react";
import { useOperacionesStore } from "@/store/operaciones-store";
import { useAuthStore } from "@/store/auth-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { ClipboardList, Calendar, User, Clock, CheckCircle2, FileText, Printer, FilterX, Search, Info, ChevronLeft, ChevronRight, RotateCw, Trash2, Camera, Upload, Download, X } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RegistroVisitaImpresion } from "@/components/operaciones/registro-visita-impresion";
import { ConstanciaVisitaImpresion } from "@/components/operaciones/constancia-visita-impresion";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { GenericSecureDeleteModal } from "@/components/ui/generic-secure-delete-modal";

export default function BandejaTecnicaPage() {
  const { user } = useAuthStore();
  const { 
    fichasTecnicas, 
    totalFichas,
    fichaPage,
    fichaTotalPages,
    fetchFichasTecnicas, 
    submitFichaTecnica, 
    loading,
    borradoresImpresion,
    setBorradorImpresion,
    borradoresConstancia,
    setBorradorConstancia,
    fichaStats
  } = useOperacionesStore();
  const [selectedFicha, setSelectedFicha] = useState<any>(null);
  const [isRouteSheetOpen, setIsRouteSheetOpen] = useState(false);
  const [isConstanciaOpen, setIsConstanciaOpen] = useState(false);
  
  // Seguridad: Eliminación
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [fichaToDelete, setFichaToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Filtros - Por defecto el día actual
  const [startDate, setStartDate] = useState<string>(() => format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState<string>(() => format(new Date(), "yyyy-MM-dd"));
  const [searchTerm, setSearchQuery] = useState<string>("");

  const [isAttachmentsOpen, setIsAttachmentsOpen] = useState(false);
  const [selectedFichaForAttachments, setSelectedFichaForAttachments] = useState<any>(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  const handleUploadAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedFichaForAttachments) return;

    setUploadingAttachment(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/operaciones/fichas-tecnicas/upload', formData);
      const newAdjunto = {
        nombre: file.name,
        url: res.url,
        tipo: file.type.includes('image') ? 'Imagen' : 'Documento'
      };

      const currentAdjuntos = (selectedFichaForAttachments.adjuntos || []).map((a: any) => ({
        nombre: a.nombre,
        url: a.url,
        tipo: a.tipo
      }));
      const updatedAdjuntos = [...currentAdjuntos, newAdjunto];

      const payload = {
        ...selectedFichaForAttachments,
        adjuntos: updatedAdjuntos
      };

      delete payload.cliente;
      delete payload.tecnico;

      const response = await api.put(`/operaciones/fichas-tecnicas/${selectedFichaForAttachments.id}`, payload);
      
      toast.success("Archivo subido con éxito", { description: `El archivo ${file.name} fue adjuntado.` });
      
      setSelectedFichaForAttachments(response);
      handleRefresh();
    } catch (error: any) {
      console.error(error);
      toast.error("Error al subir archivo", { description: error.message || "Fallo en la comunicación." });
    } finally {
      setUploadingAttachment(false);
    }
  };

  const handleDeleteAttachment = async (adjToDelete: any) => {
    if (!selectedFichaForAttachments) return;
    
    try {
      setUploadingAttachment(true);
      const updatedAdjuntos = (selectedFichaForAttachments.adjuntos || [])
        .filter((a: any) => a.url !== adjToDelete.url)
        .map((a: any) => ({
          nombre: a.nombre,
          url: a.url,
          tipo: a.tipo
        }));

      const payload = {
        ...selectedFichaForAttachments,
        adjuntos: updatedAdjuntos
      };

      delete payload.cliente;
      delete payload.tecnico;

      const response = await api.put(`/operaciones/fichas-tecnicas/${selectedFichaForAttachments.id}`, payload);
      
      toast.success("Archivo eliminado", { description: "El archivo ha sido removido correctamente." });
      setSelectedFichaForAttachments(response);
      handleRefresh();
    } catch (error: any) {
      console.error(error);
      toast.error("Error al eliminar", { description: error.message || "No se pudo actualizar." });
    } finally {
      setUploadingAttachment(false);
    }
  };

  useEffect(() => {
    // Ya no filtramos por técnico automáticamente, mostramos todo
    fetchFichasTecnicas(1, 20, undefined, searchTerm, startDate, endDate);
  }, [fetchFichasTecnicas, searchTerm, startDate, endDate]);

  const handlePageChange = (newPage: number) => {
    fetchFichasTecnicas(newPage, 20, undefined, searchTerm, startDate, endDate);
  };

  const handleRefresh = () => {
    fetchFichasTecnicas(fichaPage, 20, undefined, searchTerm, startDate, endDate);
    toast.info("Sincronizando...", { description: "Actualizando lista de visitas técnicas." });
  };

  const handleSecureDelete = async (password: string) => {
    if (!fichaToDelete) return;
    try {
      setIsDeleting(true);
      await api.post(`/operaciones/fichas-tecnicas/${fichaToDelete.id}/secure-delete`, { password });
      toast.success("Visita Técnica Eliminada", { description: "Los datos han sido removidos de forma segura." });
      setIsDeleteModalOpen(false);
      setFichaToDelete(null);
      handleRefresh();
    } catch (error: any) {
      toast.error("Error al Eliminar", { description: error.message || "Contraseña incorrecta o fallo del servidor." });
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredFichas = fichasTecnicas;

  const handleOpenRouteSheet = (ficha: any) => {
    setSelectedFicha(ficha);
    setIsRouteSheetOpen(true);
  };

  const handleOpenConstancia = (ficha: any) => {
    setSelectedFicha(ficha);
    setIsConstanciaOpen(true);
  };

  const handleDirectSubmit = async (ficha: any) => {
    try {
      const borrador = borradoresImpresion[ficha.id] || {};
      const dataToSubmit = {
        hallazgos: borrador.comentariosCliente || "Ver Hoja de Ruta física/PDF para detalles.",
        recomendaciones: borrador.comentariosExtras || "Ver Hoja de Ruta física/PDF para detalles.",
        observaciones: ficha.observaciones || "Inspección finalizada directamente desde la Bandeja Técnica usando los datos de la Hoja de Ruta.",
        firmaTecnico: "",
        adjuntos: ficha.adjuntos || [],
        datosTecnicos: {
          ...ficha.datosTecnicos,
          ...borrador
        }
      };

      await submitFichaTecnica(ficha.id, dataToSubmit);
      toast.success("Ficha Técnica Finalizada", { description: "La información ha sido sincronizada correctamente." });
    } catch (error) {
      toast.error("Error al Guardar", { description: "No se pudo sincronizar la ficha técnica." });
    }
  };

  const handlePrint = () => {
    if (selectedFicha) {
      window.open(`/operaciones/imprimir/${selectedFicha.id}`, '_blank');
    }
  };

  const handlePrintConstancia = () => {
    if (selectedFicha) {
      window.open(`/operaciones/constancia/${selectedFicha.id}`, '_blank');
    }
  };

  const isUserLinked = !!user?.responsable?.id || user?.rol === 'ADMIN' || user?.rol === 'SUPERVISOR';

  return (
    <div className="space-y-6 flex flex-col pb-8">
      {!isUserLinked && (
        <Alert className="bg-amber-50 border-amber-200 rounded-2xl shadow-sm">
            <Info className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800 font-black text-xs uppercase tracking-wider">Usuario no Vinculado</AlertTitle>
            <AlertDescription className="text-amber-700 text-[11px] font-medium leading-relaxed">
                Su cuenta no está vinculada a un perfil de trabajador. Vincule su usuario en Configuración para ver las visitas asignadas.
            </AlertDescription>
        </Alert>
      )}

      {/* Header Normalizado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-3 rounded-2xl border border-primary/5">
            <ClipboardList className="w-6 h-6 text-primary" />
          </div>
          <div>
              <h1 className="text-2xl font-black text-primary tracking-tight uppercase leading-none">Bandeja Técnica</h1>
              <p className="text-[10px] text-muted-foreground mt-1.5 font-bold uppercase tracking-widest opacity-60">
                  Control Operativo de Inspecciones en Campo
              </p>
          </div>
        </div>
        
        <div className="bg-white border border-slate-200 rounded-2xl px-6 py-2.5 flex items-center gap-6 shadow-sm h-14">
          <div className="flex items-center gap-3 border-r border-slate-100 pr-6">
            <Clock className="w-4 h-4 text-warning" />
            <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-400 uppercase leading-none">Pendientes</span>
                <span className="text-base font-black text-primary leading-none mt-1">{fichaStats.pending}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-4 h-4 text-success" />
            <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-400 uppercase leading-none">Completadas</span>
                <span className="text-base font-black text-primary leading-none mt-1">{fichaStats.completed}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros Normalizados con Mejor Espaciado */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          
          {/* Lado Izquierdo: Buscador */}
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Buscar cliente, técnico o zona..." 
              className="pl-10 h-10 border-slate-200 bg-slate-50/30 focus:bg-white focus:ring-2 focus:ring-primary/5 transition-all shadow-none font-bold text-xs rounded-xl uppercase placeholder:text-slate-300" 
              value={searchTerm}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Lado Derecho: Rango de Fechas y Acciones */}
          <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
            <div className="flex items-center bg-slate-50 p-1.5 rounded-xl border border-slate-200 shadow-inner">
              <div className="flex items-center px-3 gap-2 border-r border-slate-200 mr-1">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Rango de Visitas:</span>
              </div>
              <div className="flex items-center gap-1">
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent border-none focus:ring-0 font-bold text-[10px] text-slate-600 uppercase px-1 h-7 cursor-pointer hover:text-primary transition-colors" 
                />
                <span className="text-slate-300 font-bold px-1">/</span>
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent border-none focus:ring-0 font-bold text-[10px] text-slate-600 uppercase px-1 h-7 cursor-pointer hover:text-primary transition-colors" 
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={handleRefresh}
                disabled={loading}
                className="h-10 text-primary hover:bg-primary hover:text-white border-slate-200 rounded-xl gap-2 font-black text-[10px] uppercase px-5 shadow-sm transition-all active:scale-95"
              >
                <RotateCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} /> 
                {loading ? "Sincronizando..." : "Refrescar"}
              </Button>

              {(startDate || endDate || searchTerm) && (
                <Button 
                    variant="ghost" 
                    onClick={() => { setStartDate(""); setEndDate(""); setSearchQuery(""); }}
                    className="h-10 w-10 text-slate-400 hover:text-error hover:bg-red-50 rounded-xl transition-all"
                    title="Limpiar Filtros"
                >
                    <FilterX className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print:hidden flex-1">
        <div className="flex flex-col">
          {filteredFichas.length === 0 ? (
            <div className="h-48 text-center flex flex-col items-center justify-center gap-3">
              <FilterX className="w-8 h-8 text-slate-200" />
              <p className="text-slate-400 font-bold italic text-xs uppercase tracking-tighter">Sin registros activos</p>
            </div>
          ) : (
            filteredFichas.map((ficha, idx) => (
              <div key={ficha.id} className={`p-5 flex flex-col md:flex-row md:items-stretch gap-6 hover:bg-slate-50/30 transition-all duration-200 group ${idx < filteredFichas.length - 1 ? 'border-b border-slate-300 border-dashed' : ''}`}>
                {/* Lado Izquierdo: Información y Fila Central */}
                <div className="flex-1 flex flex-col justify-between space-y-4">
                  {/* Fila Superior: Cliente, RUC, Fecha, Estado */}
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="font-black text-sm text-primary uppercase tracking-tight">{ficha.cliente?.empresa}</span>
                      <Badge variant="outline" className="text-[9px] font-bold text-slate-400 border-slate-200 bg-slate-50/50">RUC: {ficha.cliente?.ruc}</Badge>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-wider">
                          {ficha.fechaVisita ? format(new Date(ficha.fechaVisita), "dd MMM yyyy - hh:mm a", { locale: es }) : "---"}
                        </span>
                      </div>
                      <Badge className={cn(
                        "font-black text-[9px] uppercase px-3 h-5.5 shadow-none border-none rounded-lg flex items-center justify-center",
                        ficha.estado === 'PENDIENTE' ? "bg-amber-100 text-amber-700" : "bg-emerald-500 text-white"
                      )}>
                        {ficha.estado}
                      </Badge>
                    </div>
                  </div>

                  {/* Fila Central: Observación de Coordinación y Archivos Adjuntos */}
                  <div className="space-y-3 pr-2">
                    {ficha.observaciones ? (
                      <div className="space-y-1">
                        <span className="font-black text-[9px] text-amber-700 bg-amber-50 border border-amber-100/50 rounded px-2 py-0.5 uppercase tracking-wider inline-block">
                          Observación de Coordinación
                        </span>
                        <p className="text-slate-600 font-bold text-xs pl-1 leading-relaxed whitespace-pre-wrap">
                          {ficha.observaciones}
                        </p>
                      </div>
                    ) : (
                      <p className="text-[10px] font-medium text-slate-400 italic pl-1">Sin observaciones de coordinación registradas.</p>
                    )}
                    
                    {ficha.adjuntos && ficha.adjuntos.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="font-black text-[8px] text-slate-400 uppercase tracking-widest block pl-1">
                          Archivos / Evidencias Adjuntas
                        </span>
                        <div className="flex flex-row flex-nowrap gap-2 pl-1 overflow-x-auto pb-1.5 no-scrollbar max-w-full">
                          {ficha.adjuntos.map((adj: any) => {
                            const isImage = adj.tipo?.toLowerCase().includes('image') || adj.nombre?.toLowerCase().endsWith('.png') || adj.nombre?.toLowerCase().endsWith('.jpg') || adj.nombre?.toLowerCase().endsWith('.jpeg');
                            const fullUrl = api.getFileUrl(adj.url);
                            return (
                              <a
                                key={adj.id || adj.url}
                                href={fullUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2 bg-slate-50 hover:bg-primary/5 hover:border-primary/20 border border-slate-200 rounded-xl p-1.5 text-[9px] font-black text-slate-600 uppercase transition-all duration-200 shrink-0 hover:scale-[1.02] shadow-sm"
                                title={adj.nombre}
                              >
                                {isImage ? (
                                  <img
                                    src={fullUrl}
                                    alt={adj.nombre}
                                    className="w-6 h-6 rounded-lg object-cover border border-slate-100 shrink-0"
                                  />
                                ) : (
                                  <div className="w-6 h-6 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-100 shrink-0">
                                    <FileText className="w-3.5 h-3.5 text-primary" />
                                  </div>
                                )}
                                <span className="truncate max-w-[120px] pr-1">{adj.nombre}</span>
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Separador vertical visual */}
                <div className="hidden md:block w-px bg-slate-100/80 my-1" />

                {/* Lado Derecho: Técnico Asignado, Botón Finalizar, Acciones */}
                <div className="w-full md:w-56 shrink-0 flex flex-col justify-between gap-4 md:pl-2">
                  {/* Técnico Asignado */}
                  <div className="flex items-center gap-3 bg-slate-50/80 px-3.5 py-2 rounded-2xl border border-slate-100 w-full">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary border border-primary/20 shrink-0">
                      {ficha.tecnico?.nombre ? ficha.tecnico.nombre[0] : "?"}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[8px] font-black text-slate-400 uppercase leading-none">Técnico Asignado</span>
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter truncate mt-1">{ficha.tecnico?.nombre || "SIN ASIGNAR"}</span>
                    </div>
                  </div>

                  {/* Botón Finalizar o Estado Cerrado */}
                  <div className="w-full">
                    {ficha.estado === 'PENDIENTE' ? (
                      <Button 
                        className="w-full bg-primary hover:bg-primary/90 text-white font-black text-[10px] uppercase h-10 px-4 rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all"
                        onClick={() => handleDirectSubmit(ficha)}
                        disabled={loading}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" /> Finalizar Visita
                      </Button>
                    ) : (
                      <div className="h-10 w-full bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center gap-2">
                         <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                         <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Servicio Cerrado</span>
                      </div>
                    )}
                  </div>

                  {/* Acciones del sistema (las hojitas son las importantes) */}
                  <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200 gap-1.5 shadow-inner justify-center w-full">
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8 text-slate-500 hover:text-primary hover:bg-white rounded-lg transition-all" 
                      onClick={() => handleOpenRouteSheet(ficha)} 
                      title="Ver Hoja de Ruta"
                    >
                      <FileText className="w-4.5 h-4.5" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8 text-emerald-600 hover:bg-white rounded-lg transition-all" 
                      onClick={() => handleOpenConstancia(ficha)} 
                      title="Ver Constancia"
                    >
                      <ClipboardList className="w-4.5 h-4.5" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8 text-blue-600 hover:bg-white rounded-lg transition-all" 
                      onClick={() => { setSelectedFichaForAttachments(ficha); setIsAttachmentsOpen(true); }}
                      title="Gestionar fotos/archivos"
                    >
                      <Camera className="w-4.5 h-4.5" />
                    </Button>
                    {user?.rol === 'ADMIN' && (
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg transition-all" 
                        onClick={() => { setFichaToDelete(ficha); setIsDeleteModalOpen(true); }} 
                        title="Eliminar Visita"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Paginación Normalizada */}
        {fichaTotalPages > 1 && (
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-2">
                    Página {fichaPage} de {fichaTotalPages} — Total: {totalFichas} visitas
                </p>
                <div className="flex gap-2 mr-2">
                    <Button variant="outline" size="sm" disabled={fichaPage <= 1 || loading} onClick={() => handlePageChange(fichaPage - 1)} className="h-8 px-4 font-black text-[9px] uppercase border-slate-200 bg-white rounded-xl shadow-sm">
                        Anterior
                    </Button>
                    <Button variant="outline" size="sm" disabled={fichaPage >= fichaTotalPages || loading} onClick={() => handlePageChange(fichaPage + 1)} className="h-8 px-4 font-black text-[9px] uppercase border-slate-200 bg-white rounded-xl shadow-sm">
                        Siguiente
                    </Button>
                </div>
            </div>
        )}
      </div>

      <GenericSecureDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleSecureDelete}
        entityName={`Ficha Técnica: ${fichaToDelete?.cliente?.empresa}`}
        loading={isDeleting}
      />

      <Dialog open={isRouteSheetOpen} onOpenChange={setIsRouteSheetOpen}>
        <DialogContent className="max-w-4xl p-0 border-none bg-white shadow-2xl rounded-2xl overflow-hidden">
          <DialogHeader className="p-6 bg-[#001529] text-white shrink-0 flex flex-row items-center justify-between print:hidden">
            <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-2 uppercase">
              <FileText className="w-6 h-6 text-accent" />
              Vista de Impresión: Registro de Visita
            </DialogTitle>
            <Button className="bg-accent hover:bg-accent/90 text-white font-black text-xs uppercase h-9 px-6 shadow-lg shadow-accent/20" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" /> Generar PDF
            </Button>
          </DialogHeader>
          {selectedFicha && (
            <ScrollArea className="max-h-[80vh] p-0 bg-slate-100">
              <div className="py-8">
                <RegistroVisitaImpresion 
                  ficha={selectedFicha} 
                  borrador={borradoresImpresion[selectedFicha.id]} 
                  onBorradorChange={(data) => setBorradorImpresion(selectedFicha.id, data)}
                />
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isConstanciaOpen} onOpenChange={setIsConstanciaOpen}>
        <DialogContent className="max-w-4xl p-0 border-none bg-white shadow-2xl rounded-2xl overflow-hidden">
          <DialogHeader className="p-6 bg-emerald-900 text-white shrink-0 flex flex-row items-center justify-between print:hidden">
            <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-2 uppercase">
              <ClipboardList className="w-6 h-6 text-emerald-200" />
              Vista de Impresión: Constancia
            </DialogTitle>
            <Button className="bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xs uppercase h-9 px-6 shadow-lg shadow-emerald-500/20" onClick={handlePrintConstancia}>
              <Printer className="w-4 h-4 mr-2" /> Generar PDF
            </Button>
          </DialogHeader>
          {selectedFicha && (
            <ScrollArea className="max-h-[80vh] p-0 bg-slate-100">
              <div className="py-8">
                <ConstanciaVisitaImpresion 
                  ficha={selectedFicha} 
                  borrador={borradoresConstancia[selectedFicha.id]} 
                  onBorradorChange={(data) => setBorradorConstancia(selectedFicha.id, data)}
                />
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isAttachmentsOpen} onOpenChange={setIsAttachmentsOpen}>
        <DialogContent className="max-w-md w-full p-0 border-none bg-white shadow-2xl rounded-2xl overflow-hidden">
          <DialogHeader className="p-6 bg-blue-900 text-white shrink-0 flex flex-row items-center justify-between">
            <DialogTitle className="text-lg font-black tracking-tight flex items-center gap-2 uppercase">
              <Camera className="w-5 h-5 text-blue-200" />
              Gestión de Adjuntos
            </DialogTitle>
          </DialogHeader>
          
          <div className="p-6 space-y-6">
            {/* Info de la Ficha */}
            <div>
              <h4 className="text-sm font-black text-slate-800 uppercase truncate">
                {selectedFichaForAttachments?.cliente?.empresa}
              </h4>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                Visita técnica del {selectedFichaForAttachments?.fechaVisita ? format(new Date(selectedFichaForAttachments.fechaVisita), "dd/MM/yyyy") : "---"}
              </p>
            </div>

            {/* Subidor de archivo */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-1">
                <Upload className="w-3.5 h-3.5" /> Subir Nueva Foto / Evidencia
              </Label>
              <div className="flex items-center gap-3">
                <Label
                  htmlFor="dialog-image-upload"
                  className={cn(
                    "flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-primary/50 hover:bg-slate-50/50 rounded-xl p-4 cursor-pointer transition-all w-full h-24 gap-1.5",
                    uploadingAttachment && "opacity-50 pointer-events-none"
                  )}
                >
                  <Upload className="w-5 h-5 text-slate-400" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    {uploadingAttachment ? "Subiendo archivo..." : "Seleccionar Archivo"}
                  </span>
                  <span className="text-[8px] text-slate-400 font-bold uppercase">PNG, JPG, PDF (MÁX. 10MB)</span>
                </Label>
                <input
                  id="dialog-image-upload"
                  type="file"
                  className="hidden"
                  onChange={handleUploadAttachment}
                  disabled={uploadingAttachment}
                  accept="image/*,application/pdf"
                />
              </div>
            </div>

            {/* Listado de archivos actuales */}
            <div className="space-y-3">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                Archivos adjuntos ({selectedFichaForAttachments?.adjuntos?.length || 0})
              </span>
              
              {(!selectedFichaForAttachments?.adjuntos || selectedFichaForAttachments.adjuntos.length === 0) ? (
                <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <span className="text-[10px] text-slate-400 uppercase font-bold italic">No hay archivos adjuntos en esta visita</span>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {selectedFichaForAttachments.adjuntos.map((adj: any) => {
                    const isImage = adj.tipo?.toLowerCase().includes('image') || adj.nombre?.toLowerCase().endsWith('.png') || adj.nombre?.toLowerCase().endsWith('.jpg') || adj.nombre?.toLowerCase().endsWith('.jpeg');
                    const fullUrl = api.getFileUrl(adj.url);
                    return (
                      <div
                        key={adj.id || adj.url}
                        className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 uppercase hover:bg-slate-100/50 transition-colors"
                      >
                        <div className="flex items-center gap-2 truncate pr-4">
                          {isImage ? (
                            <img
                              src={fullUrl}
                              alt={adj.nombre}
                              className="w-8 h-8 rounded object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <FileText className="w-6 h-6 text-[#001529] shrink-0" />
                          )}
                          <span className="truncate text-[10px]" title={adj.nombre}>{adj.nombre}</span>
                        </div>
                        
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-slate-400 hover:text-primary hover:bg-slate-200 rounded-lg"
                            onClick={() => window.open(fullUrl, '_blank')}
                            title="Descargar / Ver"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                            onClick={() => handleDeleteAttachment(adj)}
                            disabled={uploadingAttachment}
                            title="Eliminar"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
            <Button
              type="button"
              className="bg-slate-800 hover:bg-slate-900 text-white font-black uppercase text-[10px] h-9 px-4 rounded-xl"
              onClick={() => setIsAttachmentsOpen(false)}
            >
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
