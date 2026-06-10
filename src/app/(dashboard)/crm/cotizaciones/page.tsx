"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
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
  Lock
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

// Componente local para estadísticas
const StatsCard = ({ label, value, icon, color, bgColor }: any) => (
  <div className={cn("p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4 bg-white", bgColor)}>
    <div className={cn("p-3 rounded-lg bg-white shadow-sm", color)}>
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider leading-none mb-1">{label}</p>
      <p className={cn("text-2xl font-black leading-none tracking-tight", color)}>
        {typeof value === 'number' && label.includes('S/') ? 
          new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value) : 
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
    deleteQuoteSecure, 
    loading, 
    fetchQuotes, 
    fetchClients 
  } = useCRMStore();
  const { addProyecto } = useOperacionesStore();
  const { token, user: currentUser } = useAuthStore();
  const router = useRouter();
  
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVersionUpdate, setIsVersionUpdate] = useState(false);
  const [historyQuote, setHistoryQuote] = useState<Quote | null>(null);

  // Secure Delete State
  const [isSecureDeleteOpen, setIsSecureDeleteOpen] = useState(false);
  const [quoteToDeleteId, setQuoteToDeleteId] = useState<string | null>(null);
  const [adminPassword, setAdminPassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchQuotes(quotePage, quoteLimit);
    fetchClients();
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
      const matchesStatus = statusFilter === "all" || q.estado === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [quotes, search, statusFilter]);

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

  const handleSecureDelete = async () => {
    if (!quoteToDeleteId || !adminPassword) {
        showError("Contraseña Requerida", "Por favor ingrese la contraseña de administrador.");
        return;
    }

    try {
        setIsDeleting(true);
        await deleteQuoteSecure(quoteToDeleteId, adminPassword);
        
        setIsSecureDeleteOpen(false);
        setQuoteToDeleteId(null);
        setAdminPassword("");
        showSuccess("Cotización Eliminada", "El registro ha sido removido del sistema exitosamente.");
    } catch (err: any) {
        console.error("Error deleting quote:", err);
        const errorMessage = err.message || "La contraseña de administrador es incorrecta.";
        showError("Acceso Denegado", errorMessage);
        setAdminPassword(""); 
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
            if (client && client.etapaComercial !== 'Ganado' && client.etapaComercial !== 'Orden de Servicio') {
                const { updateClient } = useCRMStore.getState();
                await updateClient({ 
                    ...client,
                    etapaComercial: "Ganado",
                    esClienteReal: true 
                });
            }
            
            showSuccess("¡Venta Cerrada!", `La cotización ${selectedQuote.codigo} ha sido aprobada. El cliente ha sido promovido a la etapa "Ganado" y ya es visible en el módulo de Operaciones.`);
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
    setIsSecureDeleteOpen(true);
  };

  const openModal = (quote: Quote | null = null, versionUpdate = false) => {
    setSelectedQuote(quote);
    setIsVersionUpdate(versionUpdate);
    setIsModalOpen(true);
  };

  const handlePreviewFile = (quote: any) => {
    if (quote.documentos && quote.documentos.length > 0) {
      const lastDoc = [...quote.documentos].sort((a: any, b: any) => {
        const vA = parseInt(a.version || "0");
        const vB = parseInt(b.version || "0");
        return vB - vA;
      })[0];
      
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const parts = lastDoc.url.split('/').filter(Boolean);
      const folder = parts[1] || 'cotizaciones';
      const filename = parts[parts.length - 1];
      const previewUrl = `${API_URL}/files/preview/${folder}/${filename}`;

      const viewerUrl = `/api/viewer?url=${encodeURIComponent(previewUrl)}&name=${encodeURIComponent(lastDoc.nombre)}`;
      window.open(viewerUrl, '_blank');
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
        <Button 
          onClick={() => openModal()}
          className="gap-2 font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 px-6 h-10 uppercase text-[10px]"
        >
          <Plus className="w-4 h-4 text-accent" /> Crear Propuesta
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatsCard label="Total" value={stats.total} icon={<FileText />} color="text-primary" bgColor="bg-primary/5" />
        <StatsCard label="Pendientes" value={stats.pendientes} icon={<History />} color="text-warning" bgColor="bg-yellow-50" />
        <StatsCard label="Enviadas" value={stats.enviadas} icon={<Mail />} color="text-blue-600" bgColor="bg-blue-50" />
        <StatsCard label="Aprobadas" value={stats.aprobadas} icon={<FileCheck />} color="text-success" bgColor="bg-green-50" />
        <StatsCard label="Monto Aprob." value={new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 }).format(stats.montoAprobado)} icon={<AlertCircle />} color="text-purple-600" bgColor="bg-purple-50" />
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
        <div className="flex gap-2">
          <Select value={statusFilter === "all" ? "" : statusFilter} onValueChange={(val) => setStatusFilter(val || "all")}>
            <SelectTrigger className="w-48 h-10 text-[10px] font-black uppercase border-border bg-white rounded-xl shadow-sm">
              <SelectValue placeholder="SELECCIONAR ESTADO" />
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200">
              <SelectItem value="Pendiente" className="font-black text-[10px] uppercase">Pendiente</SelectItem>
              <SelectItem value="Revisado" className="font-black text-[10px] uppercase text-blue-500">Revisado</SelectItem>
              <SelectItem value="Aprobado" className="font-black text-[10px] uppercase text-success">Aprobado</SelectItem>
              <SelectItem value="Obsoleto" className="font-black text-[10px] uppercase text-error">Obsoleto</SelectItem>
            </SelectContent>
          </Select>

          {(search !== "" || statusFilter !== "all") && (
            <Button 
              variant="ghost" 
              onClick={() => { setSearch(""); setStatusFilter("all"); }}
              className="h-10 text-error hover:bg-red-50 font-black text-[10px] uppercase gap-2"
            >
              <FilterX className="w-4 h-4" /> Limpiar
            </Button>
          )}
        </div>
      </div>

      {/* Tabla Estilo Documental */}
      <div className="rounded-xl border border-border bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-black text-primary uppercase text-[10px] py-4 pl-6">CÓDIGO</TableHead>
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
              <TableRow><TableCell colSpan={8} className="text-center py-20 uppercase text-[10px] font-black text-slate-400 animate-pulse">Sincronizando con Gestión Documental...</TableCell></TableRow>
            ) : filteredQuotes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-20 text-muted-foreground uppercase text-[10px] font-bold">
                  No hay proformas registradas en esta bandeja.
                </TableCell>
              </TableRow>
            ) : (
              filteredQuotes.map((quote) => (
                <TableRow key={quote.id} className="hover:bg-muted/10 transition-colors group">
                  <TableCell className="font-black text-xs text-primary pl-6">
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
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-secondary" onClick={() => openModal(quote)} title="Editar">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600" onClick={() => setHistoryQuote(quote)} title="Ver Historial">
                        <History className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => openModal(quote, true)} title="Importar Nueva Versión">
                        <FileUp className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-error hover:bg-red-50" onClick={() => handleDeleteQuote(quote.id)} title="Eliminar">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Paginación Integrada (Estilo Cartera) */}
        {quoteTotalPages > 1 && (
          <div className="p-3 bg-slate-50 border-t border-border flex items-center justify-between">
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-2">
              Página {quotePage} de {quoteTotalPages} — Total: {totalQuotes} registros
            </p>
            <div className="flex gap-2 mr-2">
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
      </div>

      {/* Modal Principal de Cotización */}
      <Dialog open={isModalOpen} onOpenChange={(open) => {
        setIsModalOpen(open);
        if (!open) {
          setSelectedQuote(null);
          setIsVersionUpdate(false);
        }
      }}>
        <DialogContent className="max-w-4xl bg-white p-0 border-none shadow-2xl overflow-hidden rounded-2xl">
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

      {/* Modal de Eliminación Segura */}
      <Dialog open={isSecureDeleteOpen} onOpenChange={setIsSecureDeleteOpen}>
        <DialogContent className="sm:max-w-[450px] p-0 border-none shadow-2xl rounded-2xl overflow-hidden bg-white">
          <DialogHeader className="p-8 bg-error text-white flex flex-col items-center gap-4">
            <div className="bg-white/20 p-4 rounded-full">
              <ShieldAlert className="w-12 h-12 text-white" />
            </div>
            <DialogTitle className="text-2xl font-black uppercase text-center tracking-tight">
              Eliminación Restringida
            </DialogTitle>
          </DialogHeader>
          
          <div className="p-8 space-y-6">
            <DialogDescription className="text-center text-slate-600 font-bold text-base leading-relaxed">
              Esta acción es crítica e irreversible. Para eliminar esta cotización, se requiere la autorización de un administrador.
            </DialogDescription>
            
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-primary tracking-widest ml-1">Contraseña de Administrador</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 h-12 border-slate-200 bg-slate-50 focus:bg-white transition-all font-bold text-lg"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSecureDelete()}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 bg-slate-50 border-t flex flex-row justify-center gap-3">
            <Button
              variant="ghost"
              onClick={() => {
                setIsSecureDeleteOpen(false);
                setAdminPassword("");
              }}
              className="h-12 px-8 font-black uppercase text-xs text-slate-500 hover:bg-slate-200"
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSecureDelete}
              disabled={isDeleting || !adminPassword}
              className="h-12 px-10 font-black uppercase text-xs text-white bg-error hover:bg-error/90 shadow-lg shadow-error/20"
            >
              {isDeleting ? "Autorizando..." : "Confirmar Eliminación"}
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
    </div>
  );
}
