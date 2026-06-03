"use client";

import { useState, useEffect } from "react";
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
  FileUp
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { QuoteForm } from "@/components/crm/quote-form";
import { useAuthStore } from "@/store/auth-store";
import { StatsCard } from "@/components/ui/stats-card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function CotizacionesInboxPage() {
  const { clients, quotes, addQuote, updateQuote, deleteQuote, loading, fetchQuotes, fetchClients } = useCRMStore();
  const { token } = useAuthStore();
  const router = useRouter();
  
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVersionUpdate, setIsVersionUpdate] = useState(false);
  const [historyQuote, setHistoryQuote] = useState<Quote | null>(null);

  useEffect(() => {
    fetchQuotes();
    fetchClients();
  }, [fetchQuotes, fetchClients]);

  // Calcular estadísticas
  const stats = {
    total: quotes.length,
    pendientes: quotes.filter(q => q.estado === "Pendiente").length,
    enviadas: quotes.filter(q => q.estado === "Enviado").length,
    aprobadas: quotes.filter(q => q.estado === "Aprobado").length,
    montoAprobado: quotes
      .filter(q => q.estado === "Aprobado")
      .reduce((sum, q) => sum + q.monto, 0),
  };

  const filteredQuotes = quotes.filter(q => {
    const matchesSearch = q.empresa.toLowerCase().includes(search.toLowerCase()) ||
                          (q.codigo && q.codigo.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === "all" || q.estado === statusFilter;
    return matchesSearch && matchesStatus;
  });

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

      // SOLUCIÓN FINAL: Usamos una página visor interna
      const viewerUrl = `/api/viewer?url=${encodeURIComponent(previewUrl)}&name=${encodeURIComponent(lastDoc.nombre)}`;
      window.open(viewerUrl, '_blank');
      
      return;
    }
    alert("Esta cotización no tiene ningún archivo adjunto.");
  };

  const handleWhatsAppQuote = (quote: any) => {
    const client = clients.find(c => c.id === quote.clientId);
    if (!client || !client.telefono) {
      alert("No se encontró el teléfono del cliente.");
      return;
    }
    const cleanPhone = client.telefono.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('51') ? cleanPhone : `51${cleanPhone}`;
    const message = encodeURIComponent(`Hola ${quote.contacto}, te envío la cotización ${quote.codigo || quote.id} por un monto de S/ ${quote.monto}.`);
    window.open(`https://wa.me/${phoneWithCountry}?text=${message}`, '_blank');
  };

  const handleEmailQuote = (quote: any) => {
    const client = clients.find(c => c.id === quote.clientId);
    if (!client || !client.correo) {
      alert("No se encontró el correo del cliente.");
      return;
    }
    const subject = encodeURIComponent(`Cotización ${quote.codigo || quote.id} - HH T Soluciona`);
    window.location.href = `mailto:${client.correo}?subject=${subject}`;
  };

  const handleCreateQuote = async (data: any) => {
    await addQuote(data);
    setIsModalOpen(false);
    setSelectedQuote(null);
  };

  const handleUpdateQuote = async (data: any) => {
    if (selectedQuote) {
      await updateQuote({ ...selectedQuote, ...data });
      setIsModalOpen(false);
      setSelectedQuote(null);
      setIsVersionUpdate(false);
    }
  };

  const handleDeleteQuote = (id: string) => {
    if (confirm("¿Estás seguro de eliminar esta cotización?")) {
      deleteQuote(id);
    }
  };

  const openModal = (quote: Quote | null = null, versionUpdate = false) => {
    setSelectedQuote(quote);
    setIsVersionUpdate(versionUpdate);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Estilo Documental */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <FileCheck className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-black text-primary tracking-tight uppercase">Bandeja de Cotizaciones</h1>
          </div>
          <p className="text-muted-foreground mt-1 font-medium">Control de proformas y propuestas técnicas enviadas a clientes.</p>
        </div>
        <Button 
          onClick={() => openModal()}
          className="gap-2 font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 px-6 h-11 uppercase text-xs"
        >
          <Plus className="w-5 h-5 text-accent" /> Crear Propuesta
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
          <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || "all")}>
            <SelectTrigger className="w-48 h-10 font-bold text-xs">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="all" className="font-bold text-xs uppercase">Todos los Estados</SelectItem>
              <SelectItem value="Pendiente" className="font-bold text-xs uppercase">Pendiente</SelectItem>
              <SelectItem value="Revisado" className="font-bold text-xs uppercase text-blue-500">Revisado</SelectItem>
              <SelectItem value="Aprobado" className="font-bold text-xs uppercase text-success">Aprobado</SelectItem>
              <SelectItem value="Obsoleto" className="font-bold text-xs uppercase text-error">Obsoleto</SelectItem>
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
      </div>

      {/* Modal Principal de Cotización ... */}
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
    </div>
  );
}
