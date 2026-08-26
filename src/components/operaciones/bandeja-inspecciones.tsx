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
import { ClipboardList, Calendar, User, Clock, CheckCircle2, FileText, Printer, FilterX, Search, Info, ChevronLeft, ChevronRight, RotateCw, Trash2, Camera, Upload, Download, X, Coins, Receipt, Plus, Pencil, Trash, Eye } from "lucide-react";
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

export default function BandejaInspecciones() {
  const { user } = useAuthStore();
  const { 
    responsables,
    fetchResponsables,
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
  
  // Filtros - Fecha libre por defecto
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [searchTerm, setSearchQuery] = useState<string>("");

  const [isAttachmentsOpen, setIsAttachmentsOpen] = useState(false);
  const [selectedFichaForAttachments, setSelectedFichaForAttachments] = useState<any>(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  // Gestión Dinámica de Costos por Visita Técnica
  const [isCostsModalOpen, setIsCostsModalOpen] = useState(false);
  const [selectedFichaForCosts, setSelectedFichaForCosts] = useState<any>(null);
  const [gastosItems, setGastosItems] = useState<any[]>([]);

  // Estado para Edición de Visita Técnica
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [fichaToEdit, setFichaToEdit] = useState<any>(null);
  const [editFechaVisita, setEditFechaVisita] = useState<string>("");
  const [editObservaciones, setEditObservaciones] = useState<string>("");
  const [editTecnicoId, setEditTecnicoId] = useState<string>("");
  const [savingEdit, setSavingEdit] = useState(false);
  
  // Estado para el ítem individual en edición/creación
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemConcepto, setItemConcepto] = useState<string>("");
  const [itemCategoria, setItemCategoria] = useState<string>("Movilidad");
  const [itemMonto, setItemMonto] = useState<string>("");
  const [itemObservacion, setItemObservacion] = useState<string>("");
  const [savingCosts, setSavingCosts] = useState(false);

  // Estado para comprobante/boleta adjunta al ítem
  const [uploadingItemProof, setUploadingItemProof] = useState(false);
  const [itemComprobanteUrl, setItemComprobanteUrl] = useState<string>("");
  const [itemComprobanteNombre, setItemComprobanteNombre] = useState<string>("");
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Estado para Eliminación Segura del ítem con Clave de Admin
  const [isDeleteItemModalOpen, setIsDeleteItemModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [isDeletingItem, setIsDeletingItem] = useState(false);

  const handleOpenCostsModal = (ficha: any) => {
    setSelectedFichaForCosts(ficha);
    setEditingItemId(null);
    setItemConcepto("");
    setItemCategoria("Movilidad");
    setItemMonto("");
    setItemObservacion("");
    setItemComprobanteUrl("");
    setItemComprobanteNombre("");

    // Cargar los ítems guardados previamente en datosTecnicos.gastosDetalle
    const datosTec: any = ficha.datosTecnicos || {};
    let savedItems: any[] = [];
    if (Array.isArray(datosTec.gastosDetalle) && datosTec.gastosDetalle.length > 0) {
      savedItems = datosTec.gastosDetalle;
    } else {
      // Reconstruir ítems por defecto si existen costos tradicionales previos
      if (Number(ficha.costoMovilidad || 0) > 0) {
        savedItems.push({
          id: 'mov-init',
          concepto: 'Movilidad y Traslado',
          categoria: 'Movilidad',
          monto: Number(ficha.costoMovilidad),
          observacion: 'Registro anterior'
        });
      }
      if (Number(ficha.costoViaticos || 0) > 0) {
        savedItems.push({
          id: 'viat-init',
          concepto: 'Viáticos y Alimentación',
          categoria: 'Viáticos',
          monto: Number(ficha.costoViaticos),
          observacion: 'Registro anterior'
        });
      }
      if (Number(ficha.costoOtros || 0) > 0) {
        savedItems.push({
          id: 'otr-init',
          concepto: 'Otros Gastos de Inspección',
          categoria: 'Otros',
          monto: Number(ficha.costoOtros),
          observacion: ficha.observacionesCostos || 'Registro anterior'
        });
      }
    }

    setGastosItems(savedItems);
    setIsCostsModalOpen(true);
  };

  const handleUploadItemProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingItemProof(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/operaciones/fichas-tecnicas/upload', formData);
      setItemComprobanteUrl(res.url);
      setItemComprobanteNombre(file.name);
      toast.success("Comprobante Subido", { description: `Adjunto: ${file.name}` });
    } catch (error: any) {
      toast.error("Error al subir comprobante", { description: error.message || "No se pudo guardar la foto." });
    } finally {
      setUploadingItemProof(false);
      e.target.value = "";
    }
  };

  const handleAddOrUpdateItem = () => {
    if (!itemConcepto.trim()) {
      toast.error("Campo Requerido", { description: "Por favor escribe el concepto o detalle del gasto." });
      return;
    }
    const montoNum = parseFloat(itemMonto);
    if (isNaN(montoNum) || montoNum <= 0) {
      toast.error("Monto Inválido", { description: "Por favor ingresa un monto válido mayor a 0." });
      return;
    }

    if (editingItemId) {
      // Actualizar ítem existente
      setGastosItems(prev => prev.map(item => item.id === editingItemId ? {
        ...item,
        concepto: itemConcepto.trim(),
        categoria: itemCategoria,
        monto: montoNum,
        observacion: itemObservacion.trim(),
        comprobanteUrl: itemComprobanteUrl || "",
        comprobanteNombre: itemComprobanteNombre || ""
      } : item));
      toast.success("Ítem Actualizado", { description: `Se modificó "${itemConcepto}".` });
      setEditingItemId(null);
    } else {
      // Agregar nuevo ítem
      const newItem = {
        id: `gasto-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        concepto: itemConcepto.trim(),
        categoria: itemCategoria,
        monto: montoNum,
        observacion: itemObservacion.trim(),
        comprobanteUrl: itemComprobanteUrl || "",
        comprobanteNombre: itemComprobanteNombre || ""
      };
      setGastosItems(prev => [...prev, newItem]);
      toast.success("Ítem Agregado", { description: `Se registró S/ ${montoNum.toFixed(2)} por ${itemConcepto}.` });
    }

    // Resetear campos del formulario individual
    setItemConcepto("");
    setItemMonto("");
    setItemObservacion("");
    setItemComprobanteUrl("");
    setItemComprobanteNombre("");
  };

  const handleEditItem = (item: any) => {
    setEditingItemId(item.id);
    setItemConcepto(item.concepto || "");
    setItemCategoria(item.categoria || "Movilidad");
    setItemMonto(String(item.monto || 0));
    setItemObservacion(item.observacion || "");
    setItemComprobanteUrl(item.comprobanteUrl || "");
    setItemComprobanteNombre(item.comprobanteNombre || "");
  };

  const handleRequestDeleteItem = (item: any) => {
    setItemToDelete(item);
    setIsDeleteItemModalOpen(true);
  };

  const handleConfirmDeleteItem = async (password: string) => {
    if (!itemToDelete) return;
    setIsDeletingItem(true);
    try {
      await api.post('/auth/verify-password', { password });
      setGastosItems(prev => prev.filter(i => i.id !== itemToDelete.id));
      if (editingItemId === itemToDelete.id) {
        setEditingItemId(null);
        setItemConcepto("");
        setItemMonto("");
        setItemObservacion("");
        setItemComprobanteUrl("");
        setItemComprobanteNombre("");
      }
      toast.success("Ítem Eliminado", { description: `El gasto "${itemToDelete.concepto}" fue eliminado.` });
      setIsDeleteItemModalOpen(false);
      setItemToDelete(null);
    } catch (error: any) {
      toast.error("Acceso Denegado", { description: error.response?.data?.message || error.message || "Contraseña de administrador incorrecta." });
      throw error;
    } finally {
      setIsDeletingItem(false);
    }
  };

  const handleSaveCosts = async () => {
    if (!selectedFichaForCosts) return;
    setSavingCosts(true);
    try {
      // Calcular totales por categoría
      const movTotal = gastosItems.filter(i => i.categoria === 'Movilidad').reduce((acc, i) => acc + (Number(i.monto) || 0), 0);
      const viatTotal = gastosItems.filter(i => i.categoria === 'Viáticos').reduce((acc, i) => acc + (Number(i.monto) || 0), 0);
      const otrTotal = gastosItems.filter(i => i.categoria !== 'Movilidad' && i.categoria !== 'Viáticos').reduce((acc, i) => acc + (Number(i.monto) || 0), 0);
      const totalGeneral = movTotal + viatTotal + otrTotal;

      const currentDatosTec = selectedFichaForCosts.datosTecnicos || {};
      const updatedDatosTec = {
        ...currentDatosTec,
        gastosDetalle: gastosItems
      };

      const resumenConceptos = gastosItems.map(i => `${i.concepto} (S/ ${Number(i.monto).toFixed(2)})`).join(', ');

      const payload = {
        costoMovilidad: movTotal,
        costoViaticos: viatTotal,
        costoOtros: otrTotal,
        costoTotal: totalGeneral,
        observacionesCostos: resumenConceptos || "Sin detalle de gastos",
        datosTecnicos: updatedDatosTec
      };

      await api.put(`/operaciones/fichas-tecnicas/${selectedFichaForCosts.id}`, payload);

      toast.success("Gastos de Visita Guardados", {
        description: `Se guardó el desglose completo (${gastosItems.length} ítems, Total: S/ ${totalGeneral.toFixed(2)}).`
      });
      setIsCostsModalOpen(false);
      handleRefresh();
    } catch (error: any) {
      console.error(error);
      toast.error("Error al guardar costos", { description: error.message || "No se pudo actualizar." });
    } finally {
      setSavingCosts(false);
    }
  };

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
    if (!responsables || responsables.length === 0) {
      fetchResponsables();
    }
  }, [fetchFichasTecnicas, fetchResponsables, responsables, searchTerm, startDate, endDate]);

  const handleOpenEditModal = (ficha: any) => {
    setFichaToEdit(ficha);
    // Formatear la fecha para la entrada date/datetime
    const fechaVal = ficha.fechaVisita 
      ? new Date(ficha.fechaVisita).toISOString().slice(0, 16)
      : "";
    setEditFechaVisita(fechaVal);
    setEditObservaciones(ficha.observaciones || "");
    setEditTecnicoId(ficha.tecnicoId || ficha.tecnico?.id || "");
    setIsEditModalOpen(true);
  };

  const handleSaveEditVisita = async () => {
    if (!fichaToEdit) return;
    setSavingEdit(true);
    try {
      const payload: any = {
        observaciones: editObservaciones,
      };

      if (editFechaVisita) {
        payload.fechaVisita = new Date(editFechaVisita).toISOString();
      }

      if (editTecnicoId) {
        payload.tecnicoId = editTecnicoId;
      }

      await api.put(`/operaciones/fichas-tecnicas/${fichaToEdit.id}`, payload);
      toast.success("Visita Técnica Actualizada", {
        description: "Se han guardado los cambios correctamente."
      });
      setIsEditModalOpen(false);
      setFichaToEdit(null);
      handleRefresh();
    } catch (error: any) {
      console.error(error);
      toast.error("Error al actualizar visita", {
        description: error.message || "No se pudieron guardar los cambios."
      });
    } finally {
      setSavingEdit(false);
    }
  };

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
                      <Badge variant="outline" className="text-[9px] font-black uppercase bg-indigo-50 text-indigo-700 border-indigo-200">
                        ORIGEN: COMERCIAL
                      </Badge>
                      <Badge className={cn(
                        "font-black text-[9px] uppercase px-3 h-5.5 shadow-none border-none rounded-lg flex items-center justify-center",
                        ficha.estado === 'PENDIENTE' ? "bg-amber-100 text-amber-700" : "bg-emerald-500 text-white"
                      )}>
                        {ficha.estado}
                      </Badge>
                      {Number(ficha.costoTotal || 0) > 0 ? (
                        <Badge variant="outline" className={cn(
                          "font-black text-[9px] uppercase px-2.5 h-5.5 border rounded-lg flex items-center gap-1 shadow-none",
                          ficha.gastosImputados 
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                            : "bg-amber-50 text-amber-800 border-amber-200"
                        )}>
                          <Coins className="w-3 h-3 text-amber-600" />
                          S/ {Number(ficha.costoTotal).toFixed(2)}
                          {ficha.gastosImputados ? " (Imputado)" : " (Pre-venta)"}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="font-bold text-[9px] uppercase text-slate-400 border-slate-200 bg-slate-50/80 h-5.5">
                          S/ 0.00 Costos
                        </Badge>
                      )}
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
                    {/* 
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
                    */}
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8 text-blue-600 hover:bg-white rounded-lg transition-all" 
                      onClick={() => { setSelectedFichaForAttachments(ficha); setIsAttachmentsOpen(true); }}
                      title="Gestionar fotos/archivos"
                    >
                      <Camera className="w-4.5 h-4.5" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8 text-[#001529] hover:bg-white rounded-lg transition-all" 
                      onClick={() => handleOpenEditModal(ficha)} 
                      title="Editar Visita Técnica"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8 text-amber-600 hover:bg-white rounded-lg transition-all" 
                      onClick={() => handleOpenCostsModal(ficha)} 
                      title="Registrar / Editar Costos de Visita"
                    >
                      <Coins className="w-4.5 h-4.5" />
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
        <DialogContent className="max-w-lg w-full p-0 border-none bg-white shadow-2xl rounded-2xl overflow-hidden">
          <DialogHeader className="p-6 bg-blue-900 text-white shrink-0 flex flex-row items-center justify-between">
            <DialogTitle className="text-lg font-black tracking-tight flex items-center gap-2 uppercase">
              <Camera className="w-5 h-5 text-blue-200 shrink-0" />
              Gestión de Adjuntos
            </DialogTitle>
          </DialogHeader>
          
          <div className="p-6 space-y-6 w-full min-w-0 overflow-hidden">
            {/* Info de la Ficha */}
            <div className="min-w-0">
              <h4 className="text-sm font-black text-slate-800 uppercase truncate" title={selectedFichaForAttachments?.cliente?.empresa}>
                {selectedFichaForAttachments?.cliente?.empresa || "Cliente"}
              </h4>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                Visita técnica del {selectedFichaForAttachments?.fechaVisita ? format(new Date(selectedFichaForAttachments.fechaVisita), "dd/MM/yyyy") : "---"}
              </p>
            </div>

            {/* Subidor de archivo */}
            <div className="space-y-2 w-full">
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
            <div className="space-y-3 w-full min-w-0">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                Archivos adjuntos ({selectedFichaForAttachments?.adjuntos?.length || 0})
              </span>
              
              {(!selectedFichaForAttachments?.adjuntos || selectedFichaForAttachments.adjuntos.length === 0) ? (
                <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <span className="text-[10px] text-slate-400 uppercase font-bold italic">No hay archivos adjuntos en esta visita</span>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1 w-full min-w-0">
                  {selectedFichaForAttachments.adjuntos.map((adj: any, idx: number) => {
                    const isImage = adj?.tipo?.toLowerCase()?.includes('image') || 
                      adj?.nombre?.toLowerCase()?.endsWith('.png') || 
                      adj?.nombre?.toLowerCase()?.endsWith('.jpg') || 
                      adj?.nombre?.toLowerCase()?.endsWith('.jpeg') ||
                      (typeof adj?.url === 'string' && (adj.url.includes('.png') || adj.url.includes('.jpg') || adj.url.includes('.jpeg') || adj.url.includes('.webp')));
                    const fullUrl = api.getFileUrl(adj.url);
                    return (
                      <div
                        key={adj.id || adj.url || idx}
                        className="w-full min-w-0 flex items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-xl p-2.5 hover:bg-slate-100/50 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden">
                          {isImage ? (
                            <img
                              src={fullUrl}
                              alt={adj.nombre || "Foto"}
                              className="w-8 h-8 rounded object-cover border border-slate-200 shrink-0 bg-white"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0">
                              <FileText className="w-4 h-4 text-[#001529]" />
                            </div>
                          )}
                          <span className="truncate text-xs font-bold text-slate-700 uppercase block min-w-0 flex-1" title={adj.nombre || "Archivo"}>
                            {adj.nombre || "Archivo Adjunto"}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-500 hover:text-primary hover:bg-slate-200 rounded-lg"
                            onClick={() => window.open(fullUrl, '_blank')}
                            title="Descargar / Ver"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
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

      {/* Modal de Desglose Dinámico de Costos por Visita Técnica */}
      <Dialog open={isCostsModalOpen} onOpenChange={setIsCostsModalOpen}>
        <DialogContent className="max-w-xl w-full p-0 border-none bg-white shadow-2xl rounded-2xl overflow-hidden">
          <DialogHeader className="p-5 bg-[#001529] text-white shrink-0 flex flex-row items-center justify-between">
            <DialogTitle className="text-lg font-black tracking-tight flex items-center gap-2 uppercase">
              <Coins className="w-5 h-5 text-amber-400" />
              Desglose de Gastos de Visita Técnica
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            {/* Header info del cliente */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-sm font-black text-slate-800 uppercase truncate">
                  {selectedFichaForCosts?.cliente?.empresa}
                </h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                  Visita del {selectedFichaForCosts?.fechaVisita ? format(new Date(selectedFichaForCosts.fechaVisita), "dd/MM/yyyy") : "---"}
                </p>
              </div>

              <div className="bg-slate-900 text-white px-4 py-2 rounded-xl text-right">
                <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest block leading-none">TOTAL ACUMULADO</span>
                <span className="text-lg font-black leading-none mt-1 inline-block">
                  S/ {gastosItems.reduce((acc, i) => acc + (Number(i.monto) || 0), 0).toFixed(2)}
                </span>
              </div>
            </div>

            {selectedFichaForCosts?.gastosImputados && (
              <Alert className="bg-emerald-50 border-emerald-200 rounded-xl p-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <AlertTitle className="text-emerald-800 font-black text-[10px] uppercase">Gastos Imputados a Proyecto</AlertTitle>
                <AlertDescription className="text-emerald-700 text-[10px] font-medium leading-tight">
                  Esta visita ya fue transferida como gasto real al Proyecto operativo al ganar la cotización.
                </AlertDescription>
              </Alert>
            )}

            {/* Formulario para agregar / editar un ítem */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                <span className="text-[10px] font-black uppercase text-primary tracking-wider flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5" />
                  {editingItemId ? "Editar Ítem de Gasto" : "Agregar Nuevo Ítem de Gasto"}
                </span>
                {editingItemId && (
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => { setEditingItemId(null); setItemConcepto(""); setItemMonto(""); setItemObservacion(""); setItemComprobanteUrl(""); setItemComprobanteNombre(""); }}
                    className="h-6 text-[9px] font-bold uppercase text-slate-400 hover:text-slate-700 px-2"
                  >
                    Cancelar Edición
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                <div className="md:col-span-2 space-y-1">
                  <Label className="text-[8px] font-black uppercase text-slate-500 tracking-wider">Concepto / Detalle del Gasto *</Label>
                  <Input 
                    placeholder="Ej: Pasaje taxi ida y vuelta, Almuerzo..."
                    value={itemConcepto}
                    onChange={(e) => setItemConcepto(e.target.value)}
                    className="h-8 border-slate-200 font-bold text-[10px] placeholder:text-[9px] rounded-lg bg-white uppercase placeholder:text-slate-300"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[8px] font-black uppercase text-slate-500 tracking-wider">Categoría *</Label>
                  <select 
                    value={itemCategoria}
                    onChange={(e) => setItemCategoria(e.target.value)}
                    className="w-full h-8 border border-slate-200 bg-white font-bold text-[10px] rounded-lg px-2 uppercase text-slate-700 focus:ring-1 focus:ring-primary outline-none"
                  >
                    <option value="Movilidad">Movilidad / Pasajes</option>
                    <option value="Viáticos">Viáticos / Comida</option>
                    <option value="Insumos">Materiales / Insumos</option>
                    <option value="Otros">Otros Gastos</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[8px] font-black uppercase text-slate-500 tracking-wider">Monto (S/) *</Label>
                  <Input 
                    type="number"
                    min="0"
                    step="0.50"
                    placeholder="0.00"
                    value={itemMonto}
                    onChange={(e) => setItemMonto(e.target.value)}
                    className="h-8 border-slate-200 font-bold text-[10px] placeholder:text-[9px] rounded-lg bg-white"
                  />
                </div>

                <div className="md:col-span-2 space-y-1">
                  <Label className="text-[8px] font-black uppercase text-slate-500 tracking-wider">Notas / Comprobante (Opcional)</Label>
                  <Input 
                    placeholder="Ej: Boleta B001-1234, consumo de grifo..."
                    value={itemObservacion}
                    onChange={(e) => setItemObservacion(e.target.value)}
                    className="h-8 border-slate-200 font-bold text-[10px] placeholder:text-[9px] rounded-lg bg-white uppercase placeholder:text-slate-300"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[8px] font-black uppercase text-slate-500 tracking-wider">Foto / Boleta / Factura</Label>
                  <div className="flex items-center gap-1.5">
                    <Label
                      htmlFor="item-proof-upload"
                      className={cn(
                        "flex items-center justify-center gap-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg h-8 px-2.5 cursor-pointer text-[8px] font-black uppercase text-slate-600 transition-all whitespace-nowrap shrink-0",
                        uploadingItemProof && "opacity-50 pointer-events-none"
                      )}
                    >
                      <Camera className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="whitespace-nowrap">
                        {uploadingItemProof ? "Subiendo..." : "Seleccionar Archivo"}
                      </span>
                    </Label>
                    <input
                      id="item-proof-upload"
                      type="file"
                      className="hidden"
                      onChange={handleUploadItemProof}
                      disabled={uploadingItemProof}
                      accept="image/*,application/pdf"
                    />

                    {itemComprobanteUrl && (
                      <div className="flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg px-2 h-8 min-w-0 max-w-[160px] shrink-0">
                        <FileText className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="text-[8px] font-black uppercase truncate flex-1" title={itemComprobanteNombre || "Archivo Adjunto"}>
                          {itemComprobanteNombre || "Adjunto"}
                        </span>
                        <button
                          type="button"
                          onClick={() => setPreviewImageUrl(api.getFileUrl(itemComprobanteUrl))}
                          className="text-emerald-700 hover:text-emerald-900 p-0.5 rounded shrink-0"
                          title="Ver archivo grande"
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => { setItemComprobanteUrl(""); setItemComprobanteNombre(""); }}
                          className="text-red-500 hover:text-red-700 p-0.5 rounded shrink-0"
                          title="Remover archivo"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-0.5">
                <Button
                  type="button"
                  onClick={handleAddOrUpdateItem}
                  className={cn(
                    "font-black uppercase text-[9px] h-8 px-4 rounded-lg shadow-sm gap-1.5 transition-all",
                    editingItemId ? "bg-amber-600 hover:bg-amber-700 text-white" : "bg-primary hover:bg-primary/90 text-white"
                  )}
                >
                  {editingItemId ? <Pencil className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                  {editingItemId ? "Guardar Cambios del Ítem" : "Agregar Ítem a la Lista"}
                </Button>
              </div>
            </div>

            {/* Listado de Ítems Agregados */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Ítems Registrados ({gastosItems.length})
                </span>
                {gastosItems.length > 0 && (
                  <span className="text-[9px] font-bold text-slate-400 uppercase">
                    Movilidad: S/ {gastosItems.filter(i => i.categoria === 'Movilidad').reduce((a, b) => a + Number(b.monto || 0), 0).toFixed(2)} | 
                    Viáticos: S/ {gastosItems.filter(i => i.categoria === 'Viáticos').reduce((a, b) => a + Number(b.monto || 0), 0).toFixed(2)}
                  </span>
                )}
              </div>

              {gastosItems.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  <Coins className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                  <p className="text-[11px] font-bold text-slate-400 uppercase">No hay gastos registrados en esta visita.</p>
                  <p className="text-[9px] font-medium text-slate-400 uppercase mt-0.5">Agrega los detalles usando el formulario superior.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {gastosItems.map((item, idx) => (
                    <div 
                      key={item.id || idx}
                      className={cn(
                        "p-3 rounded-xl border flex items-center justify-between gap-3 transition-all",
                        editingItemId === item.id ? "bg-amber-50 border-amber-300 ring-2 ring-amber-200" : "bg-white border-slate-200 hover:border-slate-300"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Badge variant="outline" className={cn(
                          "font-black text-[8px] uppercase px-2 h-5 shrink-0 border rounded-md",
                          item.categoria === 'Movilidad' && "bg-blue-50 text-blue-700 border-blue-200",
                          item.categoria === 'Viáticos' && "bg-purple-50 text-purple-700 border-purple-200",
                          item.categoria === 'Insumos' && "bg-emerald-50 text-emerald-700 border-emerald-200",
                          item.categoria === 'Otros' && "bg-amber-50 text-amber-700 border-amber-200"
                        )}>
                          {item.categoria || 'Otros'}
                        </Badge>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-800 uppercase block truncate">{item.concepto}</span>
                            {item.comprobanteUrl && (
                              <button
                                type="button"
                                onClick={() => setPreviewImageUrl(api.getFileUrl(item.comprobanteUrl))}
                                className="flex items-center gap-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-md px-1.5 py-0.5 text-[8px] font-black uppercase transition-all shrink-0 cursor-pointer"
                                title="Ver foto o comprobante"
                              >
                                <FileText className="w-3 h-3 text-emerald-600" /> Ver Archivo
                              </button>
                            )}
                          </div>
                          {item.observacion && (
                            <span className="text-[9px] font-bold text-slate-400 uppercase block truncate">{item.observacion}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-black text-primary">
                          S/ {Number(item.monto || 0).toFixed(2)}
                        </span>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg"
                            onClick={() => handleEditItem(item)}
                            title="Editar ítem"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            onClick={() => handleRequestDeleteItem(item)}
                            title="Eliminar ítem (Requiere clave Admin)"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="font-black uppercase text-[10px] h-9 px-4 rounded-xl border-slate-200"
              onClick={() => setIsCostsModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={savingCosts}
              className="bg-primary hover:bg-primary/90 text-white font-black uppercase text-[10px] h-9 px-6 rounded-xl shadow-md"
              onClick={handleSaveCosts}
            >
              {savingCosts ? "Guardando Desglose..." : "Guardar Todos los Gastos"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Eliminación Segura de Ítem de Gasto con Clave Admin */}
      <GenericSecureDeleteModal
        isOpen={isDeleteItemModalOpen}
        onClose={() => { setIsDeleteItemModalOpen(false); setItemToDelete(null); }}
        onConfirm={handleConfirmDeleteItem}
        entityName={itemToDelete ? `Ítem de Gasto: "${itemToDelete.concepto}" (S/ ${Number(itemToDelete.monto || 0).toFixed(2)})` : "Ítem de Gasto"}
        loading={isDeletingItem}
      />

      {/* Modal Lightbox de Previsualización de Imagen / Comprobante */}
      <Dialog open={!!previewImageUrl} onOpenChange={() => setPreviewImageUrl(null)}>
        <DialogContent className="max-w-2xl p-0 border-none bg-slate-950 overflow-hidden rounded-2xl shadow-2xl">
          <DialogHeader className="p-4 bg-slate-900 text-white flex flex-row items-center justify-between">
            <DialogTitle className="text-xs font-black uppercase text-amber-400 flex items-center gap-2">
              <Camera className="w-4 h-4" /> Comprobante / Foto Adjunta
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 flex items-center justify-center bg-slate-900/50 min-h-[300px] max-h-[75vh] overflow-auto">
            {previewImageUrl && (
              <img 
                src={previewImageUrl} 
                alt="Comprobante de Gasto" 
                className="max-w-full max-h-[65vh] object-contain rounded-xl shadow-2xl border border-slate-800"
              />
            )}
          </div>
          <div className="p-3 bg-slate-900 border-t border-slate-800 flex justify-between items-center px-4">
            <a 
              href={previewImageUrl || '#'} 
              target="_blank" 
              rel="noreferrer" 
              className="text-[10px] font-black uppercase text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" /> Abrir en pestaña nueva
            </a>
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => setPreviewImageUrl(null)}
              className="h-8 text-[10px] font-black uppercase rounded-lg px-4 bg-slate-800 text-white hover:bg-slate-700"
            >
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Modal para Editar Visita Técnica */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md w-full p-0 border-none bg-white shadow-2xl rounded-2xl overflow-hidden">
          <DialogHeader className="p-6 bg-[#001529] text-white shrink-0 flex flex-row items-center justify-between">
            <DialogTitle className="text-lg font-black tracking-tight flex items-center gap-2 uppercase">
              <Pencil className="w-5 h-5 text-accent" />
              Editar Visita Técnica
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 space-y-5">
            {fichaToEdit && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Cliente / Empresa</span>
                <p className="text-xs font-black text-primary uppercase">{fichaToEdit.cliente?.empresa}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase">RUC: {fichaToEdit.cliente?.ruc || 'N/A'}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-600 tracking-wider">
                Fecha y Hora de Visita
              </Label>
              <Input 
                type="datetime-local"
                value={editFechaVisita}
                onChange={(e) => setEditFechaVisita(e.target.value)}
                className="h-10 border-slate-200 font-bold text-xs rounded-xl bg-white focus:ring-2 focus:ring-primary/10"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-600 tracking-wider">
                Técnico Asignado
              </Label>
              <select
                value={editTecnicoId}
                onChange={(e) => setEditTecnicoId(e.target.value)}
                className="w-full h-10 border border-slate-200 bg-white font-bold text-xs rounded-xl px-3 uppercase text-slate-700 focus:ring-2 focus:ring-primary/10 outline-none"
              >
                <option value="">-- Seleccionar Técnico --</option>
                {responsables && responsables.map((resp: any) => (
                  <option key={resp.id} value={resp.id}>
                    {resp.nombre} ({resp.cargo || 'Técnico'})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-600 tracking-wider">
                Observaciones de Coordinación / Indicaciones
              </Label>
              <textarea 
                rows={4}
                placeholder="Escriba aquí las indicaciones o detalles de la visita..."
                value={editObservaciones}
                onChange={(e) => setEditObservaciones(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl font-bold text-xs uppercase bg-white text-slate-700 focus:ring-2 focus:ring-primary/10 outline-none resize-none placeholder:text-slate-300"
              />
            </div>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="font-black uppercase text-[10px] h-9 px-4 rounded-xl border-slate-200"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={savingEdit}
              className="bg-primary hover:bg-primary/90 text-white font-black uppercase text-[10px] h-9 px-6 rounded-xl shadow-md gap-1.5"
              onClick={handleSaveEditVisita}
            >
              <Pencil className="w-3.5 h-3.5" />
              {savingEdit ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
