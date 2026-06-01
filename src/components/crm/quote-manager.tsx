"use client";

import { useState } from "react";
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
  Plus, 
  FileText, 
  MessageSquare, 
  Mail, 
  Download,
  Search,
  CheckCircle2,
  Clock,
  Edit,
  Trash2
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QuoteForm } from "./quote-form";

export function QuoteManager() {
  const { clients, quotes, addQuote, updateQuote, deleteQuote } = useCRMStore();
  const [search, setSearch] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);

  const filteredQuotes = quotes.filter(q => 
    q.empresa.toLowerCase().includes(search.toLowerCase()) ||
    q.id.toLowerCase().includes(search.toLowerCase())
  );

  const handleWhatsAppQuote = (quote: any) => {
    const client = clients.find(c => c.id === quote.clientId);
    if (!client || !client.telefono) {
      alert("No se encontró el teléfono del cliente.");
      return;
    }
    
    const cleanPhone = client.telefono.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('51') ? cleanPhone : `51${cleanPhone}`;
    
    const message = encodeURIComponent(`Hola ${quote.contacto}, te envío adjunto el PDF de la cotización ${quote.id} por un monto de S/ ${quote.monto}. Quedo atento a tus comentarios.`);
    const whatsappUrl = `https://wa.me/${phoneWithCountry}?text=${message}`;
    
    window.open(whatsappUrl, '_blank');
  };

  const handleEmailQuote = (quote: any) => {
    const client = clients.find(c => c.id === quote.clientId);
    if (!client || !client.correo) {
      alert("No se encontró el correo del cliente.");
      return;
    }

    const subject = encodeURIComponent(`Cotización ${quote.id} - HH T Soluciona S.A.C.`);
    const body = encodeURIComponent(`Estimado/a ${quote.contacto},\n\nEs un gusto saludarte. Adjunto a este correo encontrarás la cotización ${quote.id} para ${quote.empresa} por un valor de S/ ${quote.monto}.\n\nQuedamos atentos a cualquier consulta.\n\nSaludos cordiales,\nEquipo Comercial\nHH T Soluciona S.A.C.`);
    
    window.location.href = `mailto:${client.correo}?subject=${subject}&body=${body}`;
  };

  const handleDownloadQuote = (quote: any) => {
    const content = `
      HH T SOLUCIONA S.A.C.
      COTIZACION: ${quote.id}
      ---------------------------------
      CLIENTE: ${quote.empresa}
      CONTACTO: ${quote.contacto}
      MONTO: S/ ${quote.monto}
      FECHA: ${quote.fecha}
      ---------------------------------
      Gracias por su preferencia.
    `;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Cotizacion_${quote.id}_${quote.empresa.replace(/\s+/g, '_')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCreateQuote = (data: any) => {
    addQuote(data);
    setIsAddModalOpen(false);
  };

  const handleEditQuote = (quote: Quote) => {
    setSelectedQuote(quote);
  };

  const handleUpdateQuote = (data: any) => {
    if (selectedQuote) {
      updateQuote({ ...selectedQuote, ...data });
      setSelectedQuote(null);
    }
  };

  const handleDeleteQuote = (id: string) => {
    if (confirm("¿Estás seguro de eliminar esta cotización?")) {
      deleteQuote(id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-xl border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Buscar cotización por empresa o número..." 
            className="pl-10 h-9 border-border bg-slate-50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button 
          className="bg-primary hover:bg-primary/95 text-white font-bold h-9 gap-2"
          onClick={() => setIsAddModalOpen(true)}
        >
          <Plus className="w-4 h-4" /> Nueva Cotización
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-black text-primary text-[10px] uppercase">N° Cotización</TableHead>
              <TableHead className="font-black text-primary text-[10px] uppercase">Empresa</TableHead>
              <TableHead className="font-black text-primary text-[10px] uppercase">Contacto</TableHead>
              <TableHead className="font-black text-primary text-[10px] uppercase text-right">Monto</TableHead>
              <TableHead className="font-black text-primary text-[10px] uppercase text-center">Estado</TableHead>
              <TableHead className="font-black text-primary text-[10px] uppercase text-center">Fecha</TableHead>
              <TableHead className="font-black text-primary text-[10px] uppercase text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredQuotes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  No se encontraron cotizaciones.
                </TableCell>
              </TableRow>
            ) : (
              filteredQuotes.map((quote) => (
                <TableRow key={quote.id} className="hover:bg-slate-50/50">
                  <TableCell className="font-bold text-xs text-primary">{quote.id}</TableCell>
                  <TableCell className="font-black text-xs text-slate-700">{quote.empresa}</TableCell>
                  <TableCell className="text-xs font-semibold text-slate-600">{quote.contacto}</TableCell>
                  <TableCell className="text-right font-black text-xs text-primary">
                    {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(quote.monto)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={cn(
                      "text-[9px] font-black uppercase border-none",
                      quote.estado === "Enviado" || quote.estado === "Aprobado" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                    )}>
                      {quote.estado === "Enviado" || quote.estado === "Aprobado" ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                      {quote.estado}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center text-xs font-semibold text-slate-500">{formatDate(quote.fecha)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-success hover:bg-green-50" onClick={() => handleWhatsAppQuote(quote)} title="WhatsApp">
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-blue-50" onClick={() => handleEmailQuote(quote)} title="Correo">
                        <Mail className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:bg-slate-100" onClick={() => handleDownloadQuote(quote)} title="Descargar">
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-secondary hover:bg-slate-100" onClick={() => handleEditQuote(quote)} title="Editar">
                        <Edit className="w-4 h-4" />
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

      {/* Modal: Nueva Cotización */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-3xl bg-white p-0 border-none shadow-2xl">
          <DialogHeader className="p-6 bg-primary text-white shrink-0">
            <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-2">
              <Plus className="w-6 h-6 text-accent" />
              Nueva Cotización
            </DialogTitle>
          </DialogHeader>
          <div className="p-6">
            <QuoteForm 
              onSubmit={handleCreateQuote} 
              onCancel={() => setIsAddModalOpen(false)} 
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Editar Cotización */}
      <Dialog open={!!selectedQuote} onOpenChange={(open) => !open && setSelectedQuote(null)}>
        <DialogContent className="max-w-3xl bg-white p-0 border-none shadow-2xl">
          <DialogHeader className="p-6 bg-primary text-white shrink-0">
            <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-2">
              <Edit className="w-6 h-6 text-accent" />
              Editar Cotización {selectedQuote?.id}
            </DialogTitle>
          </DialogHeader>
          <div className="p-6">
            <QuoteForm 
              quote={selectedQuote}
              onSubmit={handleUpdateQuote} 
              onCancel={() => setSelectedQuote(null)} 
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
