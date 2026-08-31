"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCRMStore, Quote } from "@/store/crm-store";
import { cn, formatDate } from "@/lib/utils";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Search, 
  Edit, 
  Eye, 
  MoreVertical, 
  Copy, 
  History, 
  Download, 
  Trash2, 
  Plus,
  AlertCircle,
  FileCheck,
  FilterX,
  Mail,
  MessageSquare,
  FileUp,
  Share2,
  Clock,
  ExternalLink,
  Pencil,
  ShieldAlert,
  Lock,
  Calendar,
  X as CloseIcon
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { QuoteForm } from "@/components/crm/quote-form";
import { useAuthStore } from "@/store/auth-store";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ModernDialog, DialogType } from "@/components/ui/modern-dialog";
import { useOperacionesStore } from "@/store/operaciones-store";
import { toast } from "sonner";
import { api } from "@/lib/api";

// Componente local para estadísticas
const StatsCard = ({ label, value, icon, color, bgColor }: any) => (
  <div className={cn("p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3 bg-white", bgColor)}>
    <div className={cn("p-2.5 rounded-lg bg-white shadow-sm", color)}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider leading-none mb-1">{label}</p>
      <p className={cn("text-lg font-black leading-none tracking-tight truncate", color)}>
        {typeof value === 'number' && (label.includes('S/') || label.includes('Monto')) ? 
          new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 }).format(value) : 
          value}
      </p>
    </div>
  </div>
);

export default function CotizacionesInboxPage() {
  const { 
    clients, 
    quotes, 
    totalQuotes,
    quotePage,
    quoteLimit,
    quoteTotalPages,
    addQuote, 
    updateQuote, 
    deleteQuote, 
    loading, 
    fetchQuotes, 
    fetchClients 
  } = useCRMStore();
  const { addProyecto } = useOperacionesStore();
  const { token, user: currentUser } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromFinanzas = searchParams.get("from") === "finanzas";
  
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVersionUpdate, setIsVersionUpdate] = useState(false);
  const [historyQuote, setHistoryQuote] = useState<Quote | null>(null);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [isUploadingContract, setIsUploadingContract] = useState(false);

  // Document list viewer states
  const [isFileListOpen, setIsFileListOpen] = useState(false);
  const [fileListQuote, setFileListQuote] = useState<Quote | null>(null);

  // Delete State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [quoteToDeleteId, setQuoteToDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Verificación de acceso a Finanzas
  const canManageFinances = currentUser?.rol === 'ADMIN' || currentUser?.modulos?.includes('finanzas');

  useEffect(() => {
    if (fromFinanzas) {
      setStatusFilter("Ganada");
    }
  }, [fromFinanzas]);

  useEffect(() => {
    fetchQuotes(quotePage, quoteLimit);
    fetchClients(1, 5000, false, true);
  }, [fetchQuotes, fetchClients, quotePage, quoteLimit]);

  const handlePageChange = (newPage: number) => {
    fetchQuotes(newPage, quoteLimit);
  };

  // CALCULO DE ESTADISTICAS
  const stats = useMemo(() => {
    return {
      total: quotes.length,
      pendientes: quotes.filter(q => q.estado === "Pendiente").length,
      enviadas: quotes.filter(q => q.estado === "Enviado").length,
      aprobadas: quotes.filter(q => q.estado === "Aprobado" || q.estado === "Aprobada").length,
      montoAprobado: quotes
        .filter(q => q.estado === "Aprobado" || q.estado === "Aprobada")
        .reduce((sum, q) => sum + (q.monto || 0), 0),
    };
  }, [quotes]);

  const filteredQuotes = useMemo(() => {
    return quotes.filter(q => {
      const matchesSearch = (q.empresa?.toLowerCase() || "").includes(search.toLowerCase()) ||
                            (q.codigo && q.codigo.toLowerCase().includes(search.toLowerCase())) ||
                            (q.referencia && q.referencia.toLowerCase().includes(search.toLowerCase()));
      const matchesStatus = statusFilter === "all" || 
                            (statusFilter === "Ganada" 
                              ? ((q.estado as string) === "Ganada" || (q.estado as string) === "Ganado" || (q.estado as string) === "Aprobado" || (q.estado as string) === "Aprobada") 
                              : q.estado === statusFilter);
      
      const quoteDate = new Date(q.fecha);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      
      if (start) start.setHours(0, 0, 0, 0);
      if (end) end.setHours(23, 59, 59, 999);
      
      const matchesDate = (!start || quoteDate >= start) && (!end || quoteDate <= end);
      
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [quotes, search, statusFilter, startDate, endDate]);

  // Modern Dialog State
  const [modernDialog, setModernDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    type: DialogType;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    showCancel?: boolean;
  }>({
    isOpen: false,
    title: "",
    description: "",
    type: "info"
  });

  const closeModernDialog = () => setModernDialog(prev => ({ ...prev, isOpen: false }));

  const showSuccess = (title: string, description: string) => {
    toast.success(title, { description });
    setModernDialog({
      isOpen: true,
      title,
      description,
      type: "success",
      confirmText: "Excelente"
    });
  };

  const showError = (title: string, description: string) => {
    toast.error(title, { description });
    setModernDialog({
      isOpen: true,
      title,
      description,
      type: "error",
      confirmText: "Entendido"
    });
  };

  const handleDeleteConfirm = async () => {
    if (!quoteToDeleteId) return;

    try {
        setIsDeleting(true);
        await deleteQuote(quoteToDeleteId);
        
        setIsDeleteDialogOpen(false);
        setQuoteToDeleteId(null);
        showSuccess("Cotización Eliminada", "El registro ha sido removido del sistema exitosamente.");
    } catch (err: any) {
        console.error("Error deleting quote:", err);
        showError("Error al Eliminar", err.message || "No se pudo eliminar la cotización.");
    } finally {
        setIsDeleting(false);
    }
  };

  const handleCreateQuote = async (data: any) => {
    try {
        await addQuote(data);
        setIsModalOpen(false);
        setSelectedQuote(null);
        showSuccess("Propuesta Registrada", "La cotización se ha guardado correctamente en el sistema.");
    } catch (err) {
        showError("Error de Registro", "No se pudo crear la cotización. Por favor intente de nuevo.");
    }
  };

  const handleUpdateQuote = async (data: any) => {
    if (!selectedQuote) return;

    try {
        await updateQuote({ ...selectedQuote, ...data });
        
        if (data.estado === "Aprobado") {
            const client = clients.find(c => c.id === selectedQuote.clientId);
            const postClosingStages = ['Orden de Servicio', 'Servicio Ejecutado', 'Facturación', 'Postventa', 'Ganado / Fidelizado'];
            if (client && !postClosingStages.includes(client.etapaComercial as string)) {
                const { updateClient } = useCRMStore.getState();
                await updateClient({ 
                    ...client,
                    etapaComercial: "Orden de Servicio",
                    esClienteReal: true 
                } as any);
            }
            
            showSuccess("¡Venta Cerrada!", `La cotización ${selectedQuote.codigo} ha sido aprobada. El cliente ha sido promovido a la etapa "Orden de Servicio" y ya es visible en el módulo de Operaciones.`);
        } else {
            showSuccess("Actualización Exitosa", "La cotización ha sido actualizada con éxito.");
        }

        setIsModalOpen(false);
        setSelectedQuote(null);
        setIsVersionUpdate(false);
        fetchClients(); 
    } catch (err) {
        showError("Error al Actualizar", "No se pudieron guardar los cambios en la cotización.");
    }
  };

  const handleDeleteQuote = (id: string) => {
    setQuoteToDeleteId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleUploadContract = async () => {
    if (!selectedQuote || !contractFile) return;

    try {
      setIsUploadingContract(true);
      const { uploadQuoteFile, attachQuoteFile } = useCRMStore.getState();
      
      // 1. Subir el archivo físicamente
      const uploadRes = await uploadQuoteFile(contractFile);
      
      // 2. Vincularlo como documento de la cotización
      await attachQuoteFile(selectedQuote.id, selectedQuote.clientId, {
        nombre: uploadRes.nombre,
        url: uploadRes.url,
        tipo: 'Administrativa',
        subtype: 'ORDEN_SERVICIO',
        tamano: uploadRes.tamano,
        subidoPor: currentUser?.nombre || 'Admin'
      });

      showSuccess("OS/Contrato Vinculado", "El documento ha sido cargado y vinculado exitosamente a esta cotización.");
      setIsContractModalOpen(false);
      setContractFile(null);
    } catch (err) {
      showError("Error de Carga", "No se pudo subir el documento contractual.");
    } finally {
      setIsUploadingContract(false);
    }
  };

  const openModal = (quote: Quote | null = null, versionUpdate = false) => {
    setSelectedQuote(quote);
    setIsVersionUpdate(versionUpdate);
    setIsModalOpen(true);
  };

  const handleOpenDocument = (doc: any) => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    
    // Parsear la URL para extraer carpeta y nombre de archivo
    const parts = doc.url.split('/').filter(Boolean);
    
    let folder = 'cotizaciones';
    let filename = parts[parts.length - 1];

    if (parts.length >= 3) {
      folder = parts[1];
      filename = parts[2];
    } else if (parts.length === 2) {
      folder = 'root';
    }

    const { token } = useAuthStore.getState();
    
    let previewUrl = `${API_URL}/files/preview/${folder}/${filename}?token=${token}`;
    
    if (folder === 'root') {
      previewUrl = `${API_URL}/uploads/${filename}?token=${token}`;
    }

    const viewerUrl = `/file-viewer?url=${encodeURIComponent(previewUrl)}&name=${encodeURIComponent(doc.nombre)}&token=${token}`;
    window.open(viewerUrl, '_blank');
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm("¿Está seguro de que desea eliminar este documento?")) return;
    try {
      await api.delete(`/crm/documentos/${docId}`);
      toast.success("Documento Eliminado", { description: "El archivo ha sido removido exitosamente." });
      
      // Actualizar la cotización seleccionada en la vista local del modal
      if (fileListQuote) {
        const updatedDocs = fileListQuote.documentos?.filter((d: any) => d.id !== docId) || [];
        setFileListQuote({
          ...fileListQuote,
          documentos: updatedDocs
        });
        
        // También actualizar la lista de cotizaciones general
        fetchQuotes(quotePage, quoteLimit);
      }
    } catch (error) {
      toast.error("Error al Eliminar", { description: "No se pudo eliminar el documento." });
    }
  };

  const handlePreviewFile = (quote: any) => {
    if (quote.documentos && quote.documentos.length > 0) {
      setFileListQuote(quote);
      setIsFileListOpen(true);
      return;
    }
    showError("Sin Documentos", "Esta cotización no tiene ningún archivo adjunto.");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Estilo Documental */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <FileCheck className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-xl font-black text-primary tracking-tight uppercase">Bandeja de Cotizaciones</h1>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 font-bold uppercase tracking-wide">Control de proformas y propuestas técnicas enviadas a clientes.</p>
        </div>
        {canManageFinances && (
          <Button 
            onClick={() => openModal()}
            className="gap-2 font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 px-6 h-10 uppercase text-[10px]"
          >
            <Plus className="w-4 h-4 text-accent" /> Crear Propuesta
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard label="Total" value={stats.total} icon={<FileText />} color="text-primary" bgColor="bg-primary/5" />
        <StatsCard label="Pendientes" value={stats.pendientes} icon={<History />} color="text-warning" bgColor="bg-yellow-50" />
        <StatsCard label="Enviadas" value={stats.enviadas} icon={<Mail />} color="text-blue-600" bgColor="bg-blue-50" />
        <StatsCard label="Aprobadas" value={stats.aprobadas} icon={<FileCheck />} color="text-success" bgColor="bg-green-50" />
      </div>

      {/* Filtros Estilo Documental */}
      <div className="bg-white p-4 rounded-xl border border-border shadow-sm flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente o código de cotización..."
            className="pl-10 h-10 border-border font-bold text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2 bg-white border border-border rounded-xl px-3 h-10 shadow-sm">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <input 
              type="date" 
              className="bg-transparent border-none text-[10px] font-black uppercase focus:outline-none w-28"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span className="text-slate-300 font-bold">-</span>
            <input 
              type="date" 
              className="bg-transparent border-none text-[10px] font-black uppercase focus:outline-none w-28"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <Select value={statusFilter === "all" ? "" : statusFilter} onValueChange={(val) => setStatusFilter(val || "all")}>
            <SelectTrigger className="w-48 h-10 text-[10px] font-black uppercase border-border bg-white rounded-xl shadow-sm">
              <SelectValue placeholder="SELECCIONAR ESTADO" />
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200">
              <SelectItem value="Pendiente" className="font-black text-[10px] uppercase">Pendiente</SelectItem>
              <SelectItem value="Revisado" className="font-black text-[10px] uppercase text-blue-500">Revisado</SelectItem>
              <SelectItem value="Aprobado" className="font-black text-[10px] uppercase text-success">Aprobado</SelectItem>
              <SelectItem value="Obsoleto" className="font-black text-[10px] uppercase text-error">Obsoleto</SelectItem>
              {canManageFinances && (
                <SelectItem value="Ganada" className="font-black text-[10px] uppercase text-emerald-600">Ganadas</SelectItem>
              )}
            </SelectContent>
          </Select>

          {(search !== "" || statusFilter !== "all" || startDate !== "" || endDate !== "") && (
            <Button 
              variant="ghost" 
              onClick={() => { setSearch(""); setStatusFilter("all"); setStartDate(""); setEndDate(""); }}
              className="h-10 text-error hover:bg-red-50 font-black text-[10px] uppercase gap-2"
            >
              <FilterX className="w-4 h-4" /> Limpiar
            </Button>
          )}
        </div>
      </div>

      {/* VISTA MÓVIL (Tarjetas) */}
      <div className="block md:hidden space-y-4">
        {loading ? (
          <div className="text-center py-10 uppercase text-[10px] font-black text-slate-400 animate-pulse">Sincronizando con Gestión Documental...</div>
        ) : filteredQuotes.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground uppercase text-[10px] font-bold">No hay proformas registradas en esta bandeja.</div>
        ) : (
          filteredQuotes.map((quote, index) => (
            <div key={quote.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-3 relative">
              <div className="absolute top-4 right-4 flex items-center bg-white/80 rounded-lg p-1 backdrop-blur-sm z-10">
                <Button variant="ghost" size="icon" className="h-7 w-7 text-indigo-600" onClick={() => handlePreviewFile(quote)} title="Ver en Nueva Pestaña"><Eye className="w-4 h-4" /></Button>
                {canManageFinances && (
                  <>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-secondary" onClick={() => openModal(quote)} title="Editar"><Edit className="w-4 h-4" /></Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="h-7 w-7 text-slate-400 hover:text-primary flex items-center justify-center rounded-lg hover:bg-primary/10 transition-colors outline-none cursor-pointer">
                        <MoreVertical className="w-4 h-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-white border-slate-200 w-48 shadow-xl rounded-xl p-1">
                        <DropdownMenuItem className="gap-2 font-black text-[9px] uppercase cursor-pointer py-2.5 text-primary focus:!bg-[#001F3F] focus:!text-white data-[highlighted]:!bg-[#001F3F] data-[highlighted]:!text-white transition-colors" onClick={() => { setSelectedQuote(quote); setIsContractModalOpen(true); }}>
                          <FileCheck className="w-4 h-4 opacity-80" /> Subir OS / Contrato
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-2 font-black text-[9px] uppercase cursor-pointer py-2.5 text-error focus:!bg-[#001F3F] focus:!text-white data-[highlighted]:!bg-[#001F3F] data-[highlighted]:!text-white transition-colors" onClick={() => handleDeleteQuote(quote.id)}>
                          <Trash2 className="w-4 h-4 opacity-80" /> Eliminar Permanente
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )}
              </div>

              <div className="flex flex-col gap-1 pr-24">
                <span className="font-black text-xs text-primary">{quote.codigo || "—"}</span>
                <span className="font-black text-sm text-slate-700 uppercase leading-tight">{quote.referencia || "Cotización Comercial"}</span>
                <span className="text-[10px] text-slate-400 font-bold mt-0.5 uppercase">{quote.empresa}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-1 pt-2 border-t border-slate-50">
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-black uppercase text-slate-500 bg-slate-50 w-fit px-2 py-0.5 rounded-md border border-slate-200">Propuesta Comercial</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1 mt-1"><Calendar className="w-3 h-3"/> {formatDate(quote.fecha)}</span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] font-bold text-slate-600">v{quote.version || 1}</span>
                  <Badge className={cn("text-[9px] font-black uppercase border-none px-2 h-5 shadow-none mt-1",
                    quote.estado === "Aprobado" ? "bg-success text-white" : 
                    quote.estado === "Obsoleto" || quote.estado === "Rechazado" ? "bg-error text-white" : 
                    quote.estado === "Revisado" || quote.estado === "Enviado" ? "bg-blue-500 text-white" : "bg-warning/20 text-warning-foreground"
                  )}>{quote.estado}</Badge>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* VISTA PC */}
      <div className="hidden md:block rounded-xl border border-border bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-black text-primary uppercase text-[10px] py-4 pl-6 w-[50px]">#</TableHead>
              <TableHead className="font-black text-primary uppercase text-[10px]">CÓDIGO</TableHead>
              <TableHead className="font-black text-primary uppercase text-[10px]">DOCUMENTO</TableHead>
              <TableHead className="font-black text-primary uppercase text-[10px]">TIPO</TableHead>
              <TableHead className="font-black text-primary uppercase text-[10px]">ÁREA</TableHead>
              <TableHead className="font-black text-primary uppercase text-[10px] text-center">VERSION</TableHead>
              <TableHead className="font-black text-primary uppercase text-[10px] text-center">FECHA</TableHead>
              <TableHead className="font-black text-primary uppercase text-[10px] text-center">ESTADO</TableHead>
              <TableHead className="font-black text-primary uppercase text-[10px] text-right pr-6">ACCIONES</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={9} className="text-center py-20 uppercase text-[10px] font-black text-slate-400 animate-pulse">Sincronizando con Gestión Documental...</TableCell></TableRow>
            ) : filteredQuotes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-20 text-muted-foreground uppercase text-[10px] font-bold">
                  No hay proformas registradas en esta bandeja.
                </TableCell>
              </TableRow>
            ) : (
              filteredQuotes.map((quote, index) => (
                <TableRow key={quote.id} className="hover:bg-muted/10 transition-colors group">
                  <TableCell className="font-black text-[10px] text-slate-400 pl-6 w-[40px]">
                    {(quotePage - 1) * quoteLimit + index + 1}
                  </TableCell>
                  <TableCell className="font-black text-xs text-primary">
                    {quote.codigo || "—"}
                  </TableCell>
                  <TableCell>
                    <p className="font-black text-sm text-slate-700 uppercase group-hover:text-primary transition-colors max-w-[250px] truncate" title={quote.referencia || "Cotización Comercial"}>
                      {quote.referencia || "Cotización Comercial"}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5 uppercase truncate">{quote.empresa}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[9px] font-black uppercase text-slate-500 bg-slate-50">
                      Propuesta Comercial
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Comercial</span>
                  </TableCell>
                  <TableCell className="text-center text-sm font-bold text-slate-600">
                    v{quote.version || 1}
                  </TableCell>
                  <TableCell className="text-center text-[10px] font-bold text-slate-500 uppercase">
                    {formatDate(quote.fecha)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={cn(
                      "text-[9px] font-black uppercase border-none px-3 h-5 shadow-none",
                      quote.estado === "Aprobado" ? "bg-success text-white" : 
                      quote.estado === "Obsoleto" || quote.estado === "Rechazado" ? "bg-error text-white" : 
                      quote.estado === "Revisado" || quote.estado === "Enviado" ? "bg-blue-500 text-white" : "bg-warning/20 text-warning-foreground"
                    )}>
                      {quote.estado}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex justify-end gap-1 opacity-60 group-hover:opacity-100 transition-all duration-300">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-indigo-600" onClick={() => handlePreviewFile(quote)} title="Ver en Nueva Pestaña">
                        <Eye className="w-4 h-4" />
                      </Button>
                      
                      {canManageFinances && (
                        <>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-secondary" onClick={() => openModal(quote)} title="Editar">
                            <Edit className="w-4 h-4" />
                          </Button>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger className="h-8 w-8 text-slate-400 hover:text-primary flex items-center justify-center rounded-lg hover:bg-primary/10 transition-colors outline-none cursor-pointer">
                              <MoreVertical className="w-4 h-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-white border-slate-200 w-48 shadow-xl rounded-xl p-1">
                              <DropdownMenuItem 
                                className="gap-2 font-black text-[9px] uppercase cursor-pointer py-2.5 text-primary focus:!bg-[#001F3F] focus:!text-white data-[highlighted]:!bg-[#001F3F] data-[highlighted]:!text-white transition-colors"
                                onClick={() => {
                                  setSelectedQuote(quote);
                                  setIsContractModalOpen(true);
                                }}
                              >
                                <FileCheck className="w-4 h-4 opacity-80" /> Subir OS / Contrato
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="gap-2 font-black text-[9px] uppercase cursor-pointer py-2.5 text-error focus:!bg-[#001F3F] focus:!text-white data-[highlighted]:!bg-[#001F3F] data-[highlighted]:!text-white transition-colors" onClick={() => handleDeleteQuote(quote.id)}>
                                <Trash2 className="w-4 h-4 opacity-80" /> Eliminar Permanente
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

        {/* Paginación Integrada (Estilo Cartera) */}
        {quoteTotalPages > 1 && (
          <div className="mt-4 md:mt-0 p-3 bg-slate-50 md:border-t md:border-border rounded-xl md:rounded-none md:rounded-b-xl border border-slate-200 md:border-x-slate-100 md:border-b-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-2 text-center sm:text-left">
              Página {quotePage} de {quoteTotalPages} — Total: {totalQuotes} registros
            </p>
            <div className="flex justify-center gap-2 mr-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 px-4 font-black text-[9px] uppercase border-slate-200 bg-white"
                onClick={() => handlePageChange(quotePage - 1)}
                disabled={quotePage <= 1 || loading}
              >
                Anterior
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 px-4 font-black text-[9px] uppercase border-slate-200 bg-white"
                onClick={() => handlePageChange(quotePage + 1)}
                disabled={quotePage >= quoteTotalPages || loading}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}

      {/* Modal Principal de Cotización */}
      <Dialog open={isModalOpen} onOpenChange={(open) => {
        setIsModalOpen(open);
        if (!open) {
          setSelectedQuote(null);
          setIsVersionUpdate(false);
        }
      }}>
        <DialogContent className="w-[94%] sm:w-full max-w-2xl bg-white p-0 border-none shadow-2xl overflow-hidden rounded-2xl mx-auto">
          <DialogHeader className="p-6 bg-primary text-white shrink-0">
            <div className="flex items-center gap-4">
              <div className="bg-white/10 p-2 rounded-lg">
                <FileText className="w-6 h-6 text-accent" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black tracking-tight uppercase">
                  {isVersionUpdate ? `Importar Nueva Versión: ${selectedQuote?.codigo}` : selectedQuote ? `Editar Propuesta: ${selectedQuote.codigo}` : 'Nueva Propuesta Técnica'}
                </DialogTitle>
                <p className="text-[10px] text-white/70 font-bold uppercase tracking-widest mt-0.5">Gestión Documental Comercial</p>
              </div>
            </div>
          </DialogHeader>
          
          <QuoteForm 
            key={selectedQuote?.id ? (isVersionUpdate ? `ver-${selectedQuote.id}` : selectedQuote.id) : 'new'}
            quote={selectedQuote} 
            canManageFinances={canManageFinances}
            onSubmit={selectedQuote ? handleUpdateQuote : handleCreateQuote} 
            onCancel={() => {
              setIsModalOpen(false);
              setSelectedQuote(null);
              setIsVersionUpdate(false);
            }} 
          />
        </DialogContent>
      </Dialog>

      {/* Modal de Historial */}
      <Dialog open={!!historyQuote} onOpenChange={(open) => !open && setHistoryQuote(null)}>
        <DialogContent className="max-w-2xl bg-white p-0 border-none shadow-2xl overflow-hidden rounded-xl">
          <DialogHeader className="p-6 bg-slate-800 text-white shrink-0">
            <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-2 uppercase">
              <History className="w-6 h-6 text-accent" /> Historial: {historyQuote?.codigo}
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {!historyQuote?.interacciones || historyQuote.interacciones.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground font-bold uppercase text-xs">No hay historial registrado para esta cotización.</p>
            ) : (
              <div className="space-y-4">
                {historyQuote.interacciones.map((item, idx) => (
                  <div key={idx} className="flex gap-4 p-4 rounded-lg bg-slate-50 border border-slate-100 relative">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs">
                        {item.usuario.substring(0, 2).toUpperCase()}
                      </div>
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-start">
                        <span className="font-black text-xs text-primary uppercase">{item.tipo}</span>
                        <span className="text-[10px] font-bold text-slate-400">{formatDate(item.fecha)}</span>
                      </div>
                      <p className="text-sm font-bold text-slate-700">{item.accion}</p>
                      {item.observaciones && <p className="text-xs text-slate-500 italic">{item.observaciones}</p>}
                      <p className="text-[9px] font-black text-slate-400 uppercase pt-1">— Por: {item.usuario}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
            <Button onClick={() => setHistoryQuote(null)} className="font-bold text-xs uppercase">Cerrar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Eliminación */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[450px] p-0 border-none shadow-2xl rounded-2xl overflow-hidden bg-white">
          <DialogHeader className="p-8 bg-error text-white flex flex-col items-center gap-4">
            <div className="bg-white/20 p-4 rounded-full">
              <Trash2 className="w-12 h-12 text-white" />
            </div>
            <DialogTitle className="text-2xl font-black uppercase text-center tracking-tight">
              ¿Eliminar Cotización?
            </DialogTitle>
          </DialogHeader>
          
          <div className="p-8 space-y-6">
            <DialogDescription className="text-center text-slate-600 font-bold text-base leading-relaxed">
              ¿Estás seguro de eliminar esta cotización de forma permanente? Esta acción no se puede deshacer y el registro desaparecerá de la bandeja comercial.
            </DialogDescription>
          </div>

          <DialogFooter className="p-6 bg-slate-50 border-t flex flex-row justify-center gap-3">
            <Button
              variant="ghost"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setQuoteToDeleteId(null);
              }}
              className="h-12 px-8 font-black uppercase text-xs text-slate-500 hover:bg-slate-200"
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="h-12 px-10 font-black uppercase text-xs text-white bg-error hover:bg-error/90 shadow-lg shadow-error/20"
            >
              {isDeleting ? "Eliminando..." : "Sí, Eliminar Permanente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modern Dialogs (Success, Error, Confirm) */}
      <ModernDialog 
        isOpen={modernDialog.isOpen}
        onOpenChange={(open) => setModernDialog(prev => ({ ...prev, isOpen: open }))}
        title={modernDialog.title}
        description={modernDialog.description}
        type={modernDialog.type}
        confirmText={modernDialog.confirmText}
        cancelText={modernDialog.cancelText}
        showCancel={modernDialog.showCancel}
        onConfirm={modernDialog.onConfirm}
      />

      {/* Modal de Carga de OS/Contrato */}
      <Dialog open={isContractModalOpen} onOpenChange={(open) => {
        setIsContractModalOpen(open);
        if (!open) {
          setSelectedQuote(null);
          setContractFile(null);
        }
      }}>
        <DialogContent className="sm:max-w-[500px] p-0 border-none shadow-2xl rounded-2xl overflow-hidden bg-white">
          <DialogHeader className="p-8 bg-blue-600 text-white flex flex-col items-center gap-4">
            <div className="bg-white/20 p-4 rounded-full">
              <FileUp className="w-12 h-12 text-white" />
            </div>
            <DialogTitle className="text-2xl font-black uppercase text-center tracking-tight">
              Sustento Contractual
            </DialogTitle>
          </DialogHeader>
          
          <div className="p-8 space-y-6">
            <DialogDescription className="text-center text-slate-600 font-bold text-sm leading-relaxed">
              Suba la Orden de Servicio o Contrato firmado por el cliente para la cotización <span className="text-blue-600 font-black">{selectedQuote?.codigo}</span>.
            </DialogDescription>
            
            <div className="space-y-4">
              <div 
                className={cn(
                  "border-2 border-dashed rounded-2xl p-8 transition-all flex flex-col items-center justify-center gap-3 cursor-pointer",
                  contractFile ? "border-success bg-green-50/50" : "border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-blue-300"
                )}
                onClick={() => document.getElementById('contract-upload')?.click()}
              >
                <input 
                  id="contract-upload"
                  type="file" 
                  className="hidden" 
                  accept=".pdf,.doc,.docx,.jpg,.png"
                  onChange={(e) => setContractFile(e.target.files?.[0] || null)}
                />
                
                {contractFile ? (
                  <>
                    <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center text-success">
                      <FileCheck className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-black text-slate-700 uppercase truncate max-w-[250px]">{contractFile.name}</p>
                      <p className="text-[10px] font-bold text-slate-400">{(contractFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 text-[10px] font-black uppercase text-error" onClick={(e) => { e.stopPropagation(); setContractFile(null); }}>
                      Cambiar Archivo
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      <Plus className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest text-center">Haga clic o arrastre para subir</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase text-center">Formatos aceptados: PDF, Word, Imagen</p>
                  </>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 bg-slate-50 border-t flex flex-row justify-center gap-3">
            <Button
              variant="ghost"
              onClick={() => {
                setIsContractModalOpen(false);
                setContractFile(null);
              }}
              className="h-12 px-8 font-black uppercase text-xs text-slate-500 hover:bg-slate-200"
              disabled={isUploadingContract}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUploadContract}
              disabled={isUploadingContract || !contractFile}
              className="h-12 px-10 font-black uppercase text-xs text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20"
            >
              {isUploadingContract ? "Procesando..." : "Cargar y Vincular"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Lista de Archivos */}
      <Dialog open={isFileListOpen} onOpenChange={(open) => {
        setIsFileListOpen(open);
        if (!open) setFileListQuote(null);
      }}>
        <DialogContent className="sm:max-w-[600px] p-0 border-none shadow-2xl rounded-2xl overflow-hidden bg-white">
          <DialogHeader className="p-6 bg-primary text-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-2 rounded-lg">
                <FileText className="w-5 h-5 text-accent" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black tracking-tight uppercase">
                  Documentos Asociados: {fileListQuote?.codigo}
                </DialogTitle>
                <p className="text-[10px] text-white/70 font-bold uppercase tracking-widest mt-0.5">Expediente de la Cotización</p>
              </div>
            </div>
          </DialogHeader>
          
          <div className="p-6 max-h-[50vh] overflow-y-auto">
            {fileListQuote?.documentos && fileListQuote.documentos.length > 0 ? (
              <div className="space-y-3">
                {fileListQuote.documentos.map((doc: any, index: number) => (
                  <div key={doc.id || index} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-primary/20 hover:bg-slate-100/50 transition-all group">
                    <div className="flex items-center gap-3 overflow-hidden mr-4">
                      <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center text-red-500 shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-black text-slate-700 uppercase truncate" title={doc.nombre}>
                          {doc.nombre}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] font-black text-slate-400 uppercase bg-slate-200/60 px-1.5 py-0.5 rounded">
                            {doc.subtype === 'ORDEN_SERVICIO' ? 'Sustento Contractual' : 'Propuesta Técnica'}
                          </span>
                          <span className="text-[8px] font-bold text-slate-400">
                            {formatDate(doc.fechaSubida || doc.createdAt)}
                          </span>
                          {doc.tamano && (
                            <span className="text-[8px] font-bold text-slate-400">
                              • {doc.tamano}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button 
                        onClick={() => handleOpenDocument(doc)}
                        className="gap-1.5 font-bold uppercase text-[9px] h-8 px-3.5 bg-primary hover:bg-primary/90 shadow-sm"
                      >
                        <Eye className="w-3.5 h-3.5" /> Ver
                      </Button>
                      <Button 
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="h-8 w-8 text-slate-300 hover:text-error hover:bg-red-50 transition-colors"
                        title="Eliminar Documento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">No hay documentos en esta cotización</p>
              </div>
            )}
          </div>
          
          <DialogFooter className="p-4 bg-slate-50 border-t flex justify-end">
            <Button onClick={() => { setIsFileListOpen(false); setFileListQuote(null); }} className="font-bold text-xs uppercase h-10 px-6 rounded-xl">
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
