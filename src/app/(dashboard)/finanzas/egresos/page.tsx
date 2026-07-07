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
  TrendingDown,
  Loader2,
  Calendar,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Edit2,
  HandCoins,
  ArrowRightLeft,
  CalendarClock,
  CalendarCheck,
  AlertTriangle,
  ExternalLink,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn, formatDate, formatLargeCurrency } from "@/lib/utils";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Gasto } from "@/types/finanzas";
import { ModernDialog } from "@/components/ui/modern-dialog";
import { GastoForm } from "@/components/finanzas/gasto-form";
import { GenericSecureDeleteModal } from "@/components/ui/generic-secure-delete-modal";
import { toast } from "sonner";
import { ExportButtons } from "@/components/finanzas/export-buttons";
import { useAuthStore } from "@/store/auth-store";
import { GastosFijosModal } from "@/components/finanzas/gastos-fijos-modal";

const gastoStatus: Record<string, { label: string, color: string }> = {
  "PENDIENTE": { label: "BORRADOR", color: "bg-slate-100 text-slate-600 border-slate-200" },
  "SOLICITADO": { label: "POR APROBAR", color: "bg-amber-100 text-amber-700 border-amber-200" },
  "APROBADO": { label: "APROBADO", color: "bg-blue-100 text-blue-700 border-blue-200" },
  "PAGADO": { label: "EJECUTADO", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  "ANULADO": { label: "ANULADO", color: "bg-red-50 text-red-400 border-red-200 line-through" },
};

export default function EgresosPage() {
  const { user } = useAuthStore();
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGastosFijosOpen, setIsGastosFijosOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [gastoToDelete, setGastoToDelete] = useState<{id: string, name: string} | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [editingGasto, setEditingGasto] = useState<Gasto | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/finanzas/gastos?limit=1000');
      const data = Array.isArray(res) ? res : (res.data || []);
      // Finanzas no debe ver gastos de Horas Extras que sigan en revisión por RRHH
      const filteredData = data.filter((g: any) => !(g.tipo === "PLANILLA" && g.concepto.includes("[RRHH-REVISION]")));
      setGastos(filteredData);
    } catch (e) {
      console.error("Error fetching expenses", e);
      setGastos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateOrUpdateGasto = async (data: any) => {
    try {
      const payload = {
        ...data,
        proyectoId: (data.proyectoId === 'none' || !data.proyectoId) ? undefined : data.proyectoId,
      };

      if (editingGasto) {
        await api.patch(`/finanzas/gastos/${editingGasto.id}`, payload);
        toast.success("Gasto actualizado exitosamente");
      } else {
        await api.post('/finanzas/gastos', payload);
        toast.success("Gasto registrado exitosamente");
      }
      setIsModalOpen(false);
      setEditingGasto(null);
      fetchData();
    } catch (e) {
      console.error("Error saving expense", e);
      toast.error(editingGasto ? "Error al actualizar el gasto" : "Error al registrar el gasto");
    }
  };

  const handleSecureDelete = async (password: string) => {
    if (!gastoToDelete) return;
    try {
      setDeleting(true);
      await api.post(`/finanzas/gastos/${gastoToDelete.id}/secure-delete`, { password });
      toast.success("Gasto eliminado correctamente");
      setDeleteModalOpen(false);
      fetchData();
    } finally {
      setDeleting(false);
    }
  };

  const handleApproveGasto = async (id: string) => {
    try {
      await api.post(`/finanzas/gastos/${id}/aprobar`, {});
      toast.success("Gasto aprobado con éxito");
      fetchData();
    } catch (error: any) {
      toast.error("Error al aprobar", { description: error.message });
    }
  };

  const filteredGastos = (gastos || []).filter(g => {
    const matchesSearch = g.concepto.toLowerCase().includes(search.toLowerCase()) ||
                          (g.proveedor?.razonSocial || '').toLowerCase().includes(search.toLowerCase()) ||
                          (g.codigo || '').toLowerCase().includes(search.toLowerCase());
    
    let matchesDate = true;
    if (dateFrom || dateTo) {
      const gDate = new Date(g.fechaEmision).getTime();
      const fromTime = dateFrom ? new Date(dateFrom).getTime() : 0;
      const toTime = dateTo ? new Date(dateTo).getTime() : Infinity;
      matchesDate = gDate >= fromTime && gDate <= toTime;
    }

    return matchesSearch && matchesDate;
  });

  const totalPages = Math.ceil(filteredGastos.length / itemsPerPage);
  const paginatedGastos = filteredGastos.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // KPIs
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const gastosDelMes = filteredGastos.filter(g => {
    if (!g.fechaEmision) return false;
    const d = new Date(g.fechaEmision);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).reduce((acc, g) => acc + Number(g.montoTotal), 0);

  const totalEgresos = filteredGastos.reduce((acc, g) => acc + Number(g.montoTotal), 0);
  const pendientesAprob = gastos.filter(g => g.estado === 'SOLICITADO').length;
  const porRendir = gastos.filter(g => g.estado === 'PAGADO' && (g as any).estadoRendicion !== 'COMPLETADA').length;
  const gastosCriticos = gastos.filter(g => g.prioridad === 'CRITICA' || g.prioridad === 'ALTA').length;

  if (loading && gastos.length === 0) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="font-black text-primary uppercase text-xs tracking-widest">Cargando Egresos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      
      {/* KPIs SUPERIORES */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <SummaryCard 
          label="Total Egresos" 
          value={totalEgresos} 
          icon={<TrendingDown className="w-4 h-4 text-slate-600" />} 
          color="text-slate-800"
        />
        <SummaryCard 
          label="Gastos del Mes" 
          value={gastosDelMes} 
          icon={<Calendar className="w-4 h-4 text-emerald-600" />} 
          color="text-emerald-700"
        />
        <SummaryCard 
          label="Por Aprobar" 
          value={pendientesAprob} 
          icon={<HandCoins className="w-4 h-4 text-amber-500" />} 
          color="text-amber-600"
          isCount
        />
        <SummaryCard 
          label="Por Rendir" 
          value={porRendir} 
          icon={<ArrowRightLeft className="w-4 h-4 text-blue-500" />} 
          color="text-blue-600"
          isCount
        />
        <SummaryCard 
          label="Urgentes" 
          value={gastosCriticos} 
          icon={<AlertCircle className="w-4 h-4 text-error" />} 
          color="text-error"
          isCount
        />
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-border shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="bg-error/10 p-2 rounded-xl">
              <TrendingDown className="w-5 h-5 text-error" />
            </div>
            <div>
              <h1 className="text-lg font-black text-primary tracking-tight">Egresos / Gastos</h1>
              <p className="text-muted-foreground font-medium text-[10px] mt-0.5">Control financiero, cuentas por pagar y rendiciones.</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <ExportButtons type="gastos" filters={{ search, dateFrom, dateTo }} />
          <Button 
            variant="outline"
            onClick={() => setIsGastosFijosOpen(true)}
            className="h-10 px-4 gap-2 text-xs font-black border-slate-200 hover:bg-slate-50 rounded-xl"
          >
            <CalendarClock className="w-4 h-4 text-slate-500" /> Gastos Fijos
          </Button>
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="h-10 px-6 gap-2 text-xs font-black bg-error hover:bg-error/90 shadow-lg shadow-error/20 rounded-xl text-white"
          >
            <Plus className="w-4 h-4" /> Nuevo Gasto
          </Button>
        </div>
      </div>

      <div className="bg-white p-3 rounded-2xl border border-border shadow-sm flex flex-col md:flex-row items-end gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por concepto, proveedor o comprobante..." 
            className="pl-9 h-10 border-none bg-muted/30 rounded-lg text-xs font-medium" 
          />
        </div>
        <div className="flex items-center gap-2 border-r pr-3">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Fecha Inicio</label>
            <Input 
              type="date" 
              value={dateFrom} 
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-10 w-36 border-slate-200 rounded-lg text-xs font-bold text-slate-500"
            />
          </div>
          <span className="text-slate-300 font-bold mt-4">-</span>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Fecha Fin</label>
            <Input 
              type="date" 
              value={dateTo} 
              onChange={(e) => setDateTo(e.target.value)}
              className="h-10 w-36 border-slate-200 rounded-lg text-xs font-bold text-slate-500"
            />
          </div>
        </div>
        <Button 
          variant="outline" 
          onClick={() => { setDateFrom(""); setDateTo(""); setSearch(""); }}
          className="h-10 px-4 gap-2 text-xs font-bold rounded-lg border-border text-slate-500 hover:text-slate-700"
        >
          Limpiar
        </Button>
      </div>

      {/* VISTA MÓVIL (Tarjetas) */}
      <div className="block md:hidden space-y-4">
        {paginatedGastos.map((g, index) => (
          <div key={g.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-3 relative">
            <div className="absolute top-4 right-2 flex items-center bg-white/80 rounded-lg p-1 backdrop-blur-sm z-10">
              {g.comprobanteUrl && (
                <a href={g.comprobanteUrl} target="_blank" rel="noreferrer" title="Ver Documento Adjunto">
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-500 rounded-md">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                </a>
              )}
              {g.estado === 'SOLICITADO' && (user?.rol === 'ADMIN' || user?.modulos?.includes('finanzas')) && (
                <Button variant="ghost" size="icon" className="h-7 w-7 text-amber-500 rounded-md" onClick={() => handleApproveGasto(g.id)}>
                  <CheckCircle className="w-3.5 h-3.5" />
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 rounded-md" onClick={() => { setEditingGasto(g); setIsModalOpen(true); }}>
                <Edit2 className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 rounded-md" onClick={() => { setGastoToDelete({ id: g.id, name: `${g.codigo || 'S/N'} - ${g.concepto}` }); setDeleteModalOpen(true); }}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>

            <div className="pr-[110px] flex flex-col">
              <span className="font-black text-sm text-primary uppercase leading-tight">{g.codigo || 'S/N'}</span>
              <span className="text-[10px] font-bold text-slate-700 mt-1 line-clamp-2 leading-tight" title={g.concepto}>{g.concepto}</span>
            </div>

            <div className="flex flex-col gap-1">
              {g.proveedor ? (
                <div className="flex flex-col">
                  <span className="font-black text-[11px] text-slate-700 truncate">{g.proveedor.razonSocial}</span>
                  <span className="text-[9px] text-slate-400 font-bold">RUC: {g.proveedor.ruc || 'S/N'}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-red-600">
                  <AlertTriangle className="w-3 h-3" />
                  <span className="text-[9px] font-black uppercase">Sin Proveedor</span>
                </div>
              )}
              
              {g.proyecto ? (
                <div className="flex flex-col mt-1">
                  <span className="font-black text-[10px] text-blue-700 truncate">{g.proyecto.nombre}</span>
                  <span className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">C.C: {(g as any).area || 'N/A'}</span>
                </div>
              ) : (
                <div className="flex flex-col mt-1">
                  <span className="font-black text-[10px] text-slate-500 italic truncate">Gasto General</span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">C.C: {(g as any).area || 'ADMINISTRACIÓN'}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mt-1 pt-2 border-t border-slate-50">
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" /> {g.fechaEmision ? formatDate(g.fechaEmision) : '-'}
                </span>
                {g.fechaProgramadaPago && (
                  <span className="text-[9px] text-amber-600 flex items-center gap-1 font-medium">
                    <CalendarClock className="w-3 h-3 text-amber-500" /> Prog: {formatDate(g.fechaProgramadaPago)}
                  </span>
                )}
                {g.fechaPago && (
                  <span className="text-[9px] text-emerald-600 flex items-center gap-1 font-medium">
                    <CalendarCheck className="w-3 h-3 text-emerald-500" /> Pag: {formatDate(g.fechaPago)}
                  </span>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="font-mono font-black text-sm text-slate-800 tracking-tight">
                  S/ {Number(g.montoTotal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                {g.estado === 'PAGADO' && Number(g.saldoPendiente) > 0 && (
                  <span className="font-mono text-[9px] text-red-500 font-bold mt-1">
                    Saldo: S/ {Number(g.saldoPendiente).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-1 flex items-center justify-between">
              <Badge variant="outline" className={cn("text-[8px] font-black uppercase tracking-tighter border px-2 py-0.5",
                g.prioridad === 'CRITICA' ? "text-red-600 bg-red-50 border-red-200" :
                g.prioridad === 'ALTA' ? "text-orange-600 bg-orange-50 border-orange-200" :
                "text-slate-500 bg-slate-50 border-slate-200"
              )}>
                {g.prioridad || 'MEDIA'}
              </Badge>
              <Badge className={cn("border font-black text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md", gastoStatus[g.estado]?.color || "bg-slate-100 text-slate-600 border-slate-200")}>
                {gastoStatus[g.estado]?.label || g.estado}
              </Badge>
            </div>
          </div>
        ))}
        
        {filteredGastos.length === 0 && (
          <div className="text-center py-8 text-slate-500 font-bold bg-slate-50/50 rounded-xl flex flex-col items-center justify-center gap-2">
            <TrendingDown className="w-8 h-8 opacity-30" />
            No se encontraron gastos
          </div>
        )}
      </div>

      {/* VISTA PC */}
      <div className="hidden md:block bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50 h-12">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="w-[40px] font-black text-[10px] uppercase tracking-widest text-primary pl-4 text-center">Nº</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-primary pl-4">Doc. & Fechas</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-primary">Concepto & Prioridad</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-primary">Proveedor</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-primary">Proyecto & Área</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-primary text-right">Importe</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-primary text-center">Estado</TableHead>
              <TableHead className="w-[120px] text-right pr-6">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedGastos.map((g, index) => (
              <TableRow key={g.id} className="hover:bg-muted/10 transition-colors border-border group py-2">
                <TableCell className="pl-4 text-center align-top pt-4 font-black text-xs text-slate-400">
                  {(currentPage - 1) * itemsPerPage + index + 1}
                </TableCell>
                
                {/* 1. Doc y Fechas */}
                <TableCell className="pl-4 align-top pt-4 pb-4">
                  <div className="font-black text-xs text-primary mb-1.5">{g.codigo || 'S/N'}</div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" /> {g.fechaEmision ? formatDate(g.fechaEmision) : '-'}
                    </span>
                    {g.fechaProgramadaPago && (
                      <span className="text-[9px] text-amber-600 flex items-center gap-1 font-medium">
                        <CalendarClock className="w-3 h-3 text-amber-500" /> Prog: {formatDate(g.fechaProgramadaPago)}
                      </span>
                    )}
                    {g.fechaPago && (
                      <span className="text-[9px] text-emerald-600 flex items-center gap-1 font-medium">
                        <CalendarCheck className="w-3 h-3 text-emerald-500" /> Pag: {formatDate(g.fechaPago)}
                      </span>
                    )}
                  </div>
                </TableCell>

                {/* 2. Concepto y Prioridad */}
                <TableCell className="align-top pt-4 pb-4">
                  <div className="max-w-[220px]">
                    <p className="font-bold text-xs text-slate-700 line-clamp-2 leading-tight mb-2" title={g.concepto}>{g.concepto}</p>
                    <Badge variant="outline" className={cn(
                      "text-[8px] font-black uppercase tracking-tighter border",
                      g.prioridad === 'CRITICA' ? "text-red-600 bg-red-50 border-red-200" :
                      g.prioridad === 'ALTA' ? "text-orange-600 bg-orange-50 border-orange-200" :
                      "text-slate-500 bg-slate-50 border-slate-200"
                    )}>
                      {g.prioridad || 'MEDIA'}
                    </Badge>
                  </div>
                </TableCell>

                {/* 3. Proveedor */}
                <TableCell className="align-top pt-4 pb-4">
                  {g.proveedor ? (
                    <div className="max-w-[150px]">
                      <p className="font-black text-[10px] text-slate-700 truncate" title={g.proveedor.razonSocial}>{g.proveedor.razonSocial}</p>
                      <p className="text-[9px] text-slate-400 font-bold mt-0.5">RUC: {g.proveedor.ruc || 'S/N'}</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 bg-red-50 text-red-600 px-2 py-1 rounded border border-red-100 max-w-fit mt-1">
                      <AlertTriangle className="w-3 h-3" />
                      <span className="text-[9px] font-black uppercase">Sin Proveedor</span>
                    </div>
                  )}
                </TableCell>

                {/* 4. Proyecto y Área */}
                <TableCell className="align-top pt-4 pb-4">
                  {g.proyecto ? (
                    <div className="max-w-[160px]">
                      <p className="font-black text-[10px] text-blue-700 truncate" title={g.proyecto.nombre}>{g.proyecto.nombre}</p>
                      <p className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">C.C: {(g as any).area || 'N/A'}</p>
                    </div>
                  ) : (
                    <div className="max-w-[160px]">
                      <p className="font-black text-[10px] text-slate-500 italic truncate">Gasto General</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">C.C: {(g as any).area || 'ADMINISTRACIÓN'}</p>
                    </div>
                  )}
                </TableCell>

                {/* 5. Importe */}
                <TableCell className="text-right align-top pt-4 pb-4">
                  <div className="flex flex-col items-end">
                    <span className="font-mono font-black text-sm text-slate-800 tracking-tight">
                      S/ {Number(g.montoTotal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    {g.estado === 'PAGADO' && Number(g.saldoPendiente) > 0 && (
                      <span className="font-mono text-[9px] text-red-500 font-bold mt-1">
                        Saldo: S/ {Number(g.saldoPendiente).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    )}
                  </div>
                </TableCell>

                {/* 6. Estado */}
                <TableCell className="text-center align-top pt-4 pb-4">
                  <Badge className={cn("border font-black text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md", gastoStatus[g.estado]?.color || "bg-slate-100 text-slate-600 border-slate-200")}>
                    {gastoStatus[g.estado]?.label || g.estado}
                  </Badge>
                </TableCell>

                {/* 7. Acciones */}
                <TableCell className="pr-6 text-right align-top pt-4 pb-4">
                  <div className="flex items-center justify-end gap-0.5">
                    {g.comprobanteUrl && (
                      <a href={g.comprobanteUrl} target="_blank" rel="noreferrer" title="Ver Documento Adjunto">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-500 hover:bg-blue-50 hover:text-blue-600 rounded-md">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                      </a>
                    )}
                    {g.estado === 'SOLICITADO' && (user?.rol === 'ADMIN' || user?.modulos?.includes('finanzas')) && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-amber-500 hover:bg-amber-50 hover:text-amber-600 rounded-md" 
                        title="Aprobar Gasto"
                        onClick={() => handleApproveGasto(g.id)}
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-md" 
                      title="Editar"
                      onClick={() => {
                        setEditingGasto(g);
                        setIsModalOpen(true);
                      }}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-md" 
                      title="Eliminar"
                      onClick={() => {
                        setGastoToDelete({ id: g.id, name: `${g.codigo || 'S/N'} - ${g.concepto}` });
                        setDeleteModalOpen(true);
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            
            {filteredGastos.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 opacity-30">
                    <TrendingDown className="w-12 h-12" />
                    <p className="font-black text-xs uppercase tracking-widest">No se encontraron gastos</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Mostrando {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredGastos.length)} de {filteredGastos.length}
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
              <span className="text-[11px] font-black text-primary px-2">
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
        title={editingGasto ? "Editar Gasto" : "Registrar Nuevo Gasto"}
        maxWidth="sm:max-w-4xl"
        className="max-h-[90vh] flex flex-col"
      >
        <div className="flex-1 overflow-y-auto pr-1">
          <GastoForm 
            initialData={editingGasto}
            onSubmit={handleCreateOrUpdateGasto}
            onCancel={() => {
              setIsModalOpen(false);
              setEditingGasto(null);
            }}
          />
        </div>
      </ModernDialog>

      <GenericSecureDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleSecureDelete}
        entityName={gastoToDelete?.name || ''}
        loading={deleting}
      />

      <GastosFijosModal
        open={isGastosFijosOpen}
        onOpenChange={setIsGastosFijosOpen}
      />
    </div>
  );
}

function SummaryCard({ label, value, icon, color, isCount }: any) {
  return (
    <div 
      className="bg-white p-3 rounded-2xl border border-border shadow-sm flex flex-col justify-center transition-all hover:shadow-md"
      title={!isCount ? `S/ ${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : undefined}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className={cn("p-1.5 rounded-lg bg-slate-50")}>
          {icon}
        </div>
        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{label}</p>
      </div>
      <div>
        <p className={cn("text-lg font-black tracking-tighter pl-1", color)}>
          {isCount ? value : formatLargeCurrency(value)}
        </p>
      </div>
    </div>
  );
}
