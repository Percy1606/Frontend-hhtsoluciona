"use client";

import Link from "next/link";
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
  Edit2,
  ClipboardList,
  FilterX
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
import { CRMHeader } from "@/components/crm/crm-header";

const financeStatus: Record<string, string> = {
  "PAGADA": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "PAGO_PARCIAL": "bg-yellow-100 text-yellow-700 border-yellow-200",
  "PENDIENTE": "bg-blue-100 text-blue-700 border-blue-200",
  "ANULADA": "bg-slate-100 text-slate-700 border-slate-200",
  "VENCIDA": "bg-red-100 text-red-700 border-red-200",
};

const CLASIFICACIONES_NEGOCIO: Record<string, string> = {
  VENTA_SERVICIO: "Servicios Generales",
  PROYECTO: "Facturación de Proyecto",
  ALQUILER_EQUIPOS: "Alquiler de Equipos"
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

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, dateFrom, dateTo]);

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
    <div className="space-y-4">
      <CRMHeader 
        title="Ingresos / Facturas" 
        subtitle="Gestión de comprobantes emitidos y cobranzas." 
      />

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        {/* Fila 1: Búsqueda y Acciones */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-primary" />
                <label htmlFor="search-input" className="text-[10px] font-black uppercase text-primary tracking-widest ml-1">Búsqueda Global</label>
            </div>
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  id="search-input"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por factura o cliente..." 
                  className="pl-11 h-12 border-slate-200 bg-slate-50/50 focus:bg-white transition-all shadow-none font-bold text-sm rounded-xl w-full" 
                />
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <ExportButtons type="facturas" filters={{ search, statusFilter, dateFrom, dateTo }} />
            
            <Link href="/crm/cotizaciones?from=finanzas" className="flex-1 sm:flex-none">
              <Button 
                variant="outline"
                className="h-12 w-full gap-2 font-black uppercase text-[10px] border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl px-4"
              >
                <ClipboardList className="w-4 h-4 text-blue-500" /> Cotizaciones
              </Button>
            </Link>

            <Button 
              onClick={() => setIsModalOpen(true)}
              className="h-12 flex-1 sm:flex-none gap-2 font-black uppercase text-[10px] bg-secondary hover:bg-secondary/90 text-white shadow-lg shadow-secondary/20 rounded-xl px-4"
            >
              <Plus className="w-4 h-4" /> Nueva Factura
            </Button>
          </div>
        </div>

        {/* Separador sutil */}
        <div className="border-t border-slate-100" />

        {/* Fila 2: Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Estado</label>
            <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || "TODOS")}>
              <SelectTrigger className="h-10 w-full border-slate-200 bg-slate-50 rounded-lg text-xs font-bold text-slate-500 mt-1 shadow-none">
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
              className="mt-1 h-10 border-slate-200 bg-slate-50 rounded-lg text-xs font-medium w-full shadow-none" 
            />
          </div>
          <div>
            <label htmlFor="date-to" className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Fecha Fin</label>
            <Input 
              id="date-to"
              type="date" 
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="mt-1 h-10 border-slate-200 bg-slate-50 rounded-lg text-xs font-medium w-full shadow-none" 
            />
          </div>
          <div>
            <Button 
              variant="outline" 
              onClick={() => { setDateFrom(""); setDateTo(""); setSearch(""); setStatusFilter("TODOS"); }}
              className="h-10 w-full px-4 gap-2 text-[10px] uppercase font-black tracking-widest rounded-lg border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            >
              <FilterX className="w-4 h-4" /> Limpiar Filtros
            </Button>
          </div>
        </div>
      </div>

      {/* VISTA MÓVIL (Tarjetas) */}
      <div className="block md:hidden space-y-4">
        {paginatedFacturas.map((inv, index) => {
          const montoPagado = inv.montoTotal - inv.saldoPendiente;
          const isUnpaidWithDate = !!inv.fechaVencimiento && (inv.estado === 'PENDIENTE' || inv.estado === 'PAGO_PARCIAL');
          let visualStatus = inv.estado;
          let visualBadgeClass = financeStatus[inv.estado];
          if (inv.estado === 'PENDIENTE') {
              if (inv.montoTotal === 0) {
                visualStatus = 'BORRADOR';
                visualBadgeClass = "bg-slate-100 text-slate-500 border-slate-200";
              } else {
                visualStatus = 'PENDIENTE';
                visualBadgeClass = "bg-blue-50 text-blue-600 border-blue-200";
              }
          }
          let hitoDesc = "";
          if (inv.hitoPago) {
            hitoDesc = inv.hitoPago.descripcion || `Cuota ${inv.hitoPago.codigo || 'asignada'}`;
          }

          return (
            <div key={inv.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-3 relative">
              <div className="absolute top-4 right-2 flex items-center bg-white/80 rounded-lg p-1 backdrop-blur-sm z-10">
                {inv.estado !== 'PAGADA' && inv.estado !== 'ANULADA' && (
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-600" onClick={() => { setSelectedFactura(inv); setIsPagoModalOpen(true); }}><DollarSign className="w-4 h-4" /></Button>
                )}
                <Button variant="ghost" size="icon" className="h-7 w-7 text-indigo-600" onClick={async () => {
                  try {
                    const fullFactura = await api.get(`/finanzas/facturas/${inv.id}`);
                    setSelectedFactura(fullFactura);
                    setIsHistoryModalOpen(true);
                  } catch (e) {
                    toast.error("Error al cargar historial de pagos");
                  }
                }}><Clock className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-600" onClick={() => { setEditingFactura(inv); setIsModalOpen(true); }}><Edit2 className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600" onClick={() => { setFacturaToDelete({ id: inv.id, name: `Factura ${inv.codigo}` }); setDeleteModalOpen(true); }}><Trash2 className="w-4 h-4" /></Button>
              </div>

              <div className="pr-[110px] flex flex-col">
                <span className="font-black text-sm text-slate-800 uppercase">{inv.codigo}</span>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{CLASIFICACIONES_NEGOCIO[inv.clasificacion] || 'Venta Directa'}</span>
              </div>

              <div className="flex flex-col gap-1">
                {inv.cliente?.empresa && inv.cliente?.empresa !== "none" ? (
                  <p className="font-bold text-xs text-slate-800 truncate" title={inv.cliente.empresa}>{inv.cliente.empresa}</p>
                ) : (
                  <p className="font-bold text-xs text-red-500 flex items-center gap-1">⚠️ Cliente Inválido / No Asignado</p>
                )}
                <p className="text-[10px] text-slate-500 truncate uppercase font-bold tracking-tighter">
                  {inv.proyecto?.nombre ? `Ref: ${inv.proyecto.nombre}` : 'Sin Referencia'}
                </p>
                {hitoDesc && (
                  <Badge variant="outline" className="text-[8px] bg-slate-50 py-0 px-1 border-slate-200 text-slate-500 w-fit">
                    {hitoDesc}
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 mt-1 pt-2 border-t border-slate-50">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600">
                    <Calendar className="w-3 h-3 text-slate-400" /> {formatDate(inv.fechaEmision)}
                  </div>
                  <div className={cn("flex items-center gap-1.5 text-[11px] font-bold", isUnpaidWithDate ? "text-red-600" : "text-slate-500")}>
                    <Clock className={cn("w-3 h-3", isUnpaidWithDate ? "text-red-500" : "text-slate-400")} /> {formatDate(inv.fechaVencimiento)}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="text-[10px] font-medium flex justify-between w-full">
                    <span className="text-slate-500 uppercase">Total</span>
                    <span className="font-mono font-black text-slate-800">{formatCurrency(inv.montoTotal)}</span>
                  </div>
                  <div className="text-[10px] font-medium flex justify-between w-full border-t border-slate-100 pt-0.5">
                    <span className="text-emerald-600/80 uppercase">Pagado</span>
                    <span className={cn("font-mono font-bold", montoPagado > 0 ? "text-emerald-600" : "text-slate-300")}>{formatCurrency(montoPagado)}</span>
                  </div>
                  <div className="text-[10px] font-medium flex justify-between w-full border-t border-slate-100 pt-0.5">
                    <span className="text-red-500/80 uppercase">Saldo</span>
                    <span className={cn("font-mono font-black", inv.saldoPendiente > 0 ? "text-red-600" : "text-slate-300")}>{formatCurrency(inv.saldoPendiente)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-1">
                <Badge className={cn("border font-black text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-md", visualBadgeClass)}>
                  {visualStatus.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          );
        })}
        {filteredFacturas.length === 0 && (
          <div className="text-center py-8 text-slate-500 font-bold bg-slate-50/50 rounded-xl flex flex-col items-center justify-center gap-2">
            <Receipt className="w-8 h-8 opacity-30" />
            No se encontraron facturas
          </div>
        )}
      </div>

      {/* VISTA PC */}
      <div className="hidden md:block bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50/80 h-12 border-b border-slate-100">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 pl-6 w-[50px]">Item</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500">Documento</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500">Cliente y Referencia</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500">Fechas</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 text-right">Resumen Financiero</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 text-center">Estado</TableHead>
              <TableHead className="w-[120px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedFacturas.map((inv, index) => {
              const montoPagado = inv.montoTotal - inv.saldoPendiente;
              const porcentajePagado = inv.montoTotal > 0 ? (montoPagado / inv.montoTotal) * 100 : 0;
              
              const isUnpaidWithDate = !!inv.fechaVencimiento && (inv.estado === 'PENDIENTE' || inv.estado === 'PAGO_PARCIAL');

              // Visual Status Mapping
              let visualStatus = inv.estado;
              let visualBadgeClass = financeStatus[inv.estado];
              if (inv.estado === 'PENDIENTE') {
                  if (inv.montoTotal === 0) {
                    visualStatus = 'BORRADOR';
                    visualBadgeClass = "bg-slate-100 text-slate-500 border-slate-200";
                  } else {
                    visualStatus = 'PENDIENTE';
                    visualBadgeClass = "bg-blue-50 text-blue-600 border-blue-200";
                  }
              }

              // Hito Description formatting
              let hitoDesc = "";
              if (inv.hitoPago) {
                hitoDesc = inv.hitoPago.descripcion || `Cuota ${inv.hitoPago.codigo || 'asignada'}`;
              }

              return (
                <TableRow key={inv.id} className="hover:bg-primary/5 transition-colors group h-20">
                  <TableCell className="pl-6 text-[11px] font-bold text-slate-400 border-b border-slate-300 border-dashed p-2">
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </TableCell>
                  
                  <TableCell className="border-b border-slate-300 border-dashed p-2">
                    <div className="flex items-start gap-3">
                      <div className="bg-white border border-slate-200 p-2 rounded-xl shadow-sm">
                        <Receipt className="w-4 h-4 text-slate-600" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-black text-sm text-slate-800">{inv.codigo}</span>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                          {CLASIFICACIONES_NEGOCIO[inv.clasificacion] || 'Venta Directa'}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="border-b border-slate-300 border-dashed p-2">
                    <div className="flex flex-col gap-1 max-w-[280px]">
                      {inv.cliente?.empresa && inv.cliente?.empresa !== "none" ? (
                        <p className="font-bold text-xs text-slate-800 truncate" title={inv.cliente.empresa}>
                          {inv.cliente.empresa}
                        </p>
                      ) : (
                        <p className="font-bold text-xs text-red-500 flex items-center gap-1">
                          ⚠️ Cliente Inválido / No Asignado
                        </p>
                      )}
                      <div className="flex items-center gap-1 flex-wrap">
                        <p className="text-[10px] text-slate-500 truncate uppercase font-bold tracking-tighter">
                          {inv.proyecto?.nombre ? `Ref: ${inv.proyecto.nombre}` : 'Sin Referencia'}
                        </p>
                        {hitoDesc && (
                          <Badge variant="outline" className="text-[8px] bg-white py-0 px-1 border-slate-200 text-slate-500">
                            {hitoDesc}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="border-b border-slate-300 border-dashed p-2">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5" title="Fecha de Emisión">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-[11px] font-medium text-slate-600">{formatDate(inv.fechaEmision)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Clock className={cn("w-3.5 h-3.5", isUnpaidWithDate ? "text-red-500" : "text-slate-400")} />
                        <span className={cn("text-[11px] font-bold", isUnpaidWithDate ? "text-red-600" : "text-slate-500")}>
                          {formatDate(inv.fechaVencimiento)}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="text-right border-b border-slate-300 border-dashed p-2">
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center justify-between w-[140px] text-[10px] font-medium">
                        <span className="text-slate-500 uppercase">Total</span>
                        <span className="font-mono font-black text-slate-800">{formatCurrency(inv.montoTotal)}</span>
                      </div>
                      <div className="flex items-center justify-between w-[140px] text-[10px] font-medium border-t border-slate-100 pt-0.5">
                        <span className="text-emerald-600/80 uppercase">Pagado</span>
                        <span className={cn("font-mono font-bold", montoPagado > 0 ? "text-emerald-600" : "text-slate-300")}>
                          {formatCurrency(montoPagado)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between w-[140px] text-[10px] font-medium border-t border-slate-100 pt-0.5">
                        <span className="text-red-500/80 uppercase">Saldo</span>
                        <span className={cn("font-mono font-black", inv.saldoPendiente > 0 ? "text-red-600" : "text-slate-300")}>
                          {formatCurrency(inv.saldoPendiente)}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="text-center border-b border-slate-300 border-dashed p-2">
                    <Badge className={cn("border font-black text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-md", visualBadgeClass)}>
                      {visualStatus.replace('_', ' ')}
                    </Badge>
                  </TableCell>

                  <TableCell className="pr-4 border-b border-slate-300 border-dashed p-2">
                    <div className="flex items-center justify-end gap-0.5">
                      {inv.estado !== 'PAGADA' && inv.estado !== 'ANULADA' && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="rounded-md hover:bg-emerald-50 hover:text-emerald-600 text-slate-400 h-8 w-8 transition-colors"
                          onClick={() => {
                            setSelectedFactura(inv);
                            setIsPagoModalOpen(true);
                          }}
                          title="Registrar Pago"
                        >
                          <DollarSign className="w-4 h-4" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-md hover:bg-indigo-50 hover:text-indigo-600 text-slate-400 h-8 w-8 transition-colors"
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
                        <Clock className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-md hover:bg-blue-50 hover:text-blue-600 text-slate-400 h-8 w-8 transition-colors"
                        onClick={() => {
                          setEditingFactura(inv);
                          setIsModalOpen(true);
                        }}
                        title="Editar Factura"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-md hover:bg-red-50 hover:text-red-600 text-slate-400 h-8 w-8 transition-colors"
                        onClick={() => {
                          setFacturaToDelete({ id: inv.id, name: `Factura ${inv.codigo}` });
                          setDeleteModalOpen(true);
                        }}
                        title="Eliminar Factura"
                      >
                        <Trash2 className="w-4 h-4" />
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
        maxWidth="sm:max-w-3xl"
        className="max-h-[90vh] flex flex-col"
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
        maxWidth="sm:max-w-xl"
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
                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Total Comprobante (Venta)</p>
                  <p className="font-black text-sm text-primary">{formatCurrency(selectedFactura.montoTotal)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase text-secondary tracking-widest mb-1">Pendiente de Cobro</p>
                  <p className="font-black text-sm text-secondary">{formatCurrency(selectedFactura.saldoPendiente)}</p>
                </div>
             </div>
             <PagoHistorial pagos={selectedFactura.pagos || []} onSuccess={fetchData} />
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
