"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Search,
  Receipt,
  Loader2,
  Calendar,
  Filter,
  MoreVertical,
  Clock,
  Download,
  DollarSign,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Edit2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn, formatDate, formatCurrency } from "@/lib/utils";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Factura } from "@/types/finanzas";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ModernDialog } from "@/components/ui/modern-dialog";
import { FacturaForm } from "@/components/finanzas/factura-form";
import { PagoForm } from "@/components/finanzas/pago-form";
import { PagoHistorial } from "@/components/finanzas/pago-historial";
import { GenericSecureDeleteModal } from "@/components/ui/generic-secure-delete-modal";
import { toast } from "sonner";
import { ExportButtons } from "@/components/finanzas/export-buttons";

const financeStatus: Record<string, string> = {
  "PAGADA": "bg-green-100 text-green-700 border-green-200",
  "PAGO_PARCIAL": "bg-yellow-100 text-yellow-700 border-yellow-200",
  "PENDIENTE": "bg-blue-100 text-blue-700 border-blue-200",
  "ANULADA": "bg-slate-100 text-slate-700 border-slate-200",
  "VENCIDA": "bg-red-100 text-red-700 border-red-200",
};

export default function IngresosPage() {
  const [facturas, setFacturas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPagoModalOpen, setIsPagoModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODOS");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [facturaToDelete, setFacturaToDelete] = useState<{id: string, name: string} | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [editingFactura, setEditingFactura] = useState<any | null>(null);
  const [selectedFactura, setSelectedFactura] = useState<any | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/finanzas/facturas');
      const data = Array.isArray(res) ? res : (res.data || []);
      setFacturas(data);
    } catch (e) {
      console.error("Error fetching invoices", e);
      setFacturas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateOrUpdateFactura = async (data: any) => {
    try {
      const payload = {
        ...data,
        proyectoId: (data.proyectoId === 'none' || !data.proyectoId) ? undefined : data.proyectoId,
      };

      if (editingFactura) {
        await api.patch(`/finanzas/facturas/${editingFactura.id}`, payload);
        toast.success("Factura actualizada exitosamente");
      } else {
        await api.post('/finanzas/facturas', payload);
        toast.success("Factura registrada exitosamente");
      }
      setIsModalOpen(false);
      setEditingFactura(null);
      fetchData();
    } catch (e: any) {
      console.error("Error saving invoice", e);
      toast.error(e.message || (editingFactura ? "Error al actualizar la factura" : "Error al registrar la factura"));
    }
  };

  const handleSecureDelete = async (password: string) => {
    if (!facturaToDelete) return;
    try {
      setDeleting(true);
      const response = await api.post(`/finanzas/facturas/${facturaToDelete.id}/secure-delete`, { password });
      
      const facturaCodigo = response?.codigo || facturaToDelete.name;
      toast.success(`Factura ${facturaCodigo} ANULADA correctamente y saldo revertido`);
      
      setDeleteModalOpen(false);
      fetchData();
    } catch (e: any) {
      console.error("[DEBUG] Error al anular:", e);
      toast.error(e.message || "Error al anular la factura");
    } finally {
      setDeleting(false);
    }
  };

  const filteredFacturas = (facturas || [])
    .slice() // Create a copy to avoid mutating the original array
    .sort((a, b) => new Date(b.fechaEmision).getTime() - new Date(a.fechaEmision).getTime())
    .filter(f => {
    const matchesSearch = f.codigo.toLowerCase().includes(search.toLowerCase()) ||
                          f.cliente?.empresa.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === "TODOS" || f.estado === statusFilter;
                          
    let matchesDate = true;
    if (dateFrom || dateTo) {
      const fDate = new Date(f.fechaEmision).getTime();
      const fromTime = dateFrom ? new Date(dateFrom).getTime() : 0;
      const toTime = dateTo ? new Date(dateTo).getTime() : Infinity;
      matchesDate = fDate >= fromTime && fDate <= toTime;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const totalPages = Math.ceil(filteredFacturas.length / itemsPerPage);
  const paginatedFacturas = filteredFacturas.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading && facturas.length === 0) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="font-black text-primary uppercase text-xs tracking-widest">Cargando Facturación...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-8 rounded-3xl border border-border shadow-sm">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/10 p-3 rounded-2xl">
              <Receipt className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-black text-primary tracking-tight">Ingresos / Facturas</h1>
              <p className="text-muted-foreground font-medium text-xs mt-1">Gestión de comprobantes emitidos y cobranzas.</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <ExportButtons type="facturas" filters={{ search, statusFilter, dateFrom, dateTo }} />
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="h-10 px-6 gap-2 text-xs font-black bg-secondary hover:bg-secondary/90 shadow-lg shadow-secondary/20 rounded-xl"
          >
            <Plus className="w-4 h-4" /> Nueva Factura
          </Button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-border shadow-sm grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
        <div className="md:col-span-2">
          <label htmlFor="search-input" className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Búsqueda</label>
          <div className="relative mt-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              id="search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por factura o cliente..." 
              className="pl-9 h-10 border-slate-200 bg-transparent rounded-lg text-xs font-medium w-full" 
            />
          </div>
        </div>
        <div>
          <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Estado</label>
          <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || "TODOS")}>
            <SelectTrigger className="h-10 w-full border-slate-200 rounded-lg text-xs font-bold text-slate-500 mt-1">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS" className="font-bold text-xs uppercase text-slate-600">Todos los Estados</SelectItem>
              <SelectItem value="PENDIENTE" className="font-bold text-xs uppercase text-blue-600">Pendiente</SelectItem>
              <SelectItem value="PAGO_PARCIAL" className="font-bold text-xs uppercase text-yellow-600">Pago Parcial</SelectItem>
              <SelectItem value="PAGADA" className="font-bold text-xs uppercase text-green-600">Pagada</SelectItem>
              <SelectItem value="VENCIDA" className="font-bold text-xs uppercase text-red-600">Vencida</SelectItem>
              <SelectItem value="ANULADA" className="font-bold text-xs uppercase text-slate-400">Anulada</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label htmlFor="date-from" className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Fecha Inicio</label>
          <Input 
            id="date-from"
            type="date" 
            value={dateFrom} 
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-10 w-full border-slate-200 rounded-lg text-xs font-bold text-slate-500 mt-1"
          />
        </div>
        <div>
          <label htmlFor="date-to" className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Fecha Fin</label>
          <Input 
            id="date-to"
            type="date" 
            value={dateTo} 
            onChange={(e) => setDateTo(e.target.value)}
            className="h-10 w-full border-slate-200 rounded-lg text-xs font-bold text-slate-500 mt-1"
          />
        </div>
        <div>
          <Button 
            variant="outline" 
            onClick={() => { setDateFrom(""); setDateTo(""); setSearch(""); setStatusFilter("TODOS"); }}
            className="h-10 w-full px-4 gap-2 text-xs font-bold rounded-lg border-border text-slate-500 hover:text-slate-700"
          >
            Limpiar Filtros
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50 h-12">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-primary pl-6 w-[50px]">Item</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-primary">Factura</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-primary">Cliente / Proyecto</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-primary">Emisión / Venc.</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-primary text-right">Cobro / Progreso</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-primary text-right">Saldo Pendiente</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-primary text-center">Estado</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedFacturas.map((inv, index) => {
              const montoPagado = inv.montoTotal - inv.saldoPendiente;
              const porcentajePagado = inv.montoTotal > 0 ? (montoPagado / inv.montoTotal) * 100 : 0;
              
              // Determinar si está vencida o por vencer (próximos 2 días)
              const dueDate = new Date(inv.fechaVencimiento);
              const today = new Date();
              const isOverdue = dueDate < today && inv.estado !== 'PAGADA' && inv.estado !== 'ANULADA';
              const isExpiringSoon = (dueDate.getTime() - today.getTime()) < (48 * 60 * 60 * 1000) && inv.estado !== 'PAGADA' && inv.estado !== 'ANULADA';

              return (
                <TableRow key={inv.id} className="hover:bg-muted/10 transition-colors border-border group h-16">
                  <TableCell className="pl-6 text-[11px] font-bold text-slate-400">
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="bg-blue-50 p-1.5 rounded-md">
                        <Receipt className="w-3.5 h-3.5 text-blue-500" />
                      </div>
                      <span className="font-black text-xs text-primary">{inv.codigo}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[250px]">
                      <p className="font-black text-xs text-primary group-hover:text-secondary transition-colors truncate">{inv.cliente?.empresa}</p>
                      <p className="text-[9px] text-muted-foreground truncate uppercase font-bold tracking-tighter opacity-70">{inv.proyecto?.nombre || 'VENTA DIRECTA'}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" /> {formatDate(inv.fechaEmision)}
                      </span>
                      <span className={cn("text-[9px] font-black uppercase mt-0.5", 
                        (isOverdue || isExpiringSoon) ? "text-red-600 font-black animate-pulse-slow" : "text-slate-400")}>
                        Vence: {formatDate(inv.fechaVencimiento)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-black text-xs text-primary" title={`Factura: ${formatCurrency(inv.montoTotal)} + Pendiente en otras: ${formatCurrency(inv.saldoAnterior || 0)}`}>
                        {formatCurrency(inv.montoTotal)}
                      </span>
                      {inv.estado === 'PAGO_PARCIAL' && (
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-secondary" 
                              style={{ width: `${porcentajePagado}%` }}
                            />
                          </div>
                          <span className="text-[9px] font-black text-secondary">{Math.round(porcentajePagado)}%</span>
                        </div>
                      )}
                      {inv.saldoAnterior && inv.saldoAnterior > 0 ? (
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
                          Total Acumulado: {formatCurrency(inv.totalAcumulado)}
                        </span>
                      ) : (inv.estado === 'PAGO_PARCIAL' || inv.estado === 'PAGADA') && (
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
                          Pagado: {formatCurrency(montoPagado)}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col items-end">
                      <span className={cn("font-black text-xs", inv.saldoPendiente > 0 ? "text-error" : "text-green-500")}>
                        {formatCurrency(inv.saldoPendiente || 0)}
                      </span>
                      {inv.saldoTotalCliente > inv.saldoPendiente && (
                        <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">
                          Deuda Total: {formatCurrency(inv.saldoTotalCliente)}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={cn("border font-black text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-md", financeStatus[inv.estado])}>
                      {inv.estado.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="pr-4">
                    <div className="flex items-center gap-0.5">
                      {inv.estado !== 'PAGADA' && inv.estado !== 'ANULADA' && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="rounded-md hover:bg-green-50 hover:text-green-600 text-slate-400 h-7 w-7"
                          onClick={() => {
                            setSelectedFactura(inv);
                            setIsPagoModalOpen(true);
                          }}
                          title="Registrar Pago"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-md hover:bg-blue-50 hover:text-blue-600 text-slate-400 h-7 w-7"
                        onClick={async () => {
                          try {
                            const fullFactura = await api.get(`/finanzas/facturas/${inv.id}`);
                            setSelectedFactura(fullFactura);
                            setIsHistoryModalOpen(true);
                          } catch (e) {
                            toast.error("Error al cargar historial de pagos");
                          }
                        }}
                        title="Ver Historial de Pagos"
                      >
                        <Clock className="w-3.5 h-3.5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-md hover:bg-blue-50 hover:text-blue-600 text-slate-400 h-7 w-7"
                        onClick={() => {
                          setEditingFactura(inv);
                          setIsModalOpen(true);
                        }}
                        title="Editar Factura"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-md hover:bg-red-50 hover:text-red-600 text-slate-400 h-7 w-7"
                        onClick={() => {
                          setFacturaToDelete({ id: inv.id, name: `Factura ${inv.codigo}` });
                          setDeleteModalOpen(true);
                        }}
                        title="Eliminar Factura"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {filteredFacturas.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 opacity-30">
                    <Receipt className="w-12 h-12" />
                    <p className="font-black text-xs uppercase tracking-widest">No se encontraron facturas</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* PAGINATION CONTROLS */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Mostrando {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredFacturas.length)} de {filteredFacturas.length}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 border-slate-200"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-xs font-black text-primary px-2">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-8 border-slate-200"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <ModernDialog
        isOpen={isModalOpen}
        onOpenChange={(open) => setIsModalOpen(open)}
        title={editingFactura ? "Editar Factura" : "Registrar Nueva Factura"}
      >
        <FacturaForm 
          initialData={editingFactura}
          existingFacturas={facturas}
          onSubmit={handleCreateOrUpdateFactura}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingFactura(null);
          }}
        />
      </ModernDialog>

      <ModernDialog
        isOpen={isPagoModalOpen}
        onOpenChange={(open) => setIsPagoModalOpen(open)}
        title="Registrar Pago de Factura"
      >
        {selectedFactura && (
          <PagoForm 
            factura={selectedFactura}
            onSubmit={() => {
              setIsPagoModalOpen(false);
              setSelectedFactura(null);
              fetchData();
            }}
            onCancel={() => {
              setIsPagoModalOpen(false);
              setSelectedFactura(null);
            }}
          />
        )}
      </ModernDialog>

      <ModernDialog
        isOpen={isHistoryModalOpen}
        onOpenChange={(open) => setIsHistoryModalOpen(open)}
        title={`Historial de Pagos - ${selectedFactura?.codigo}`}
      >
        {selectedFactura && (
          <div className="space-y-6">
             <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Total Facturado</p>
                  <p className="font-black text-sm text-primary">{formatCurrency(selectedFactura.montoTotal)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase text-secondary tracking-widest mb-1">Saldo Pendiente</p>
                  <p className="font-black text-sm text-secondary">{formatCurrency(selectedFactura.saldoPendiente)}</p>
                </div>
             </div>
             <PagoHistorial pagos={selectedFactura.pagos || []} />
             <div className="flex justify-end">
                <Button variant="outline" onClick={() => setIsHistoryModalOpen(false)} className="font-black uppercase text-[10px] tracking-widest px-8">
                  Cerrar
                </Button>
             </div>
          </div>
        )}
      </ModernDialog>

      <GenericSecureDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleSecureDelete}
        entityName={facturaToDelete?.name || ""}
        loading={deleting}
      />
    </div>
  );
}
