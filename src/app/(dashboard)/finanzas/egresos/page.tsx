"use client";

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
  AlertCircle,
  FolderKanban,
  ChevronDown,
  Eye,
  CheckCircle2,
  Clock
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn, formatDate, formatLargeCurrency } from "@/lib/utils";
import { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import { Gasto } from "@/types/finanzas";
import { ModernDialog } from "@/components/ui/modern-dialog";
import { GastoForm } from "@/components/finanzas/gasto-form";
import { GenericSecureDeleteModal } from "@/components/ui/generic-secure-delete-modal";
import { toast } from "sonner";
import { ExportButtons } from "@/components/finanzas/export-buttons";
import { useAuthStore } from "@/store/auth-store";
import { GastosFijosModal } from "@/components/finanzas/gastos-fijos-modal";
import { useOperacionesStore } from "@/store/operaciones-store";
import { useCRMStore } from "@/store/crm-store";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const gastoStatus: Record<string, { label: string, color: string }> = {
  "PENDIENTE": { label: "BORRADOR", color: "bg-slate-100 text-slate-600 border-slate-200" },
  "SOLICITADO": { label: "POR APROBAR", color: "bg-amber-100 text-amber-700 border-amber-200" },
  "APROBADO": { label: "APROBADO", color: "bg-blue-100 text-blue-700 border-blue-200" },
  "PAGADO": { label: "EJECUTADO", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  "ANULADO": { label: "ANULADO", color: "bg-red-50 text-red-400 border-red-200 line-through" },
};

export default function EgresosPage() {
  const { user } = useAuthStore();
  const { proyectos, fetchProyectos } = useOperacionesStore();
  const { quotes: globalQuotes, fetchQuotes } = useCRMStore();

  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGastosFijosOpen, setIsGastosFijosOpen] = useState(false);
  
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODOS");

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [gastoToDelete, setGastoToDelete] = useState<{id: string, name: string} | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [editingGasto, setEditingGasto] = useState<Gasto | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const [cajas, setCajas] = useState<any[]>([]);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [gastoToApprove, setGastoToApprove] = useState<string | null>(null);
  const [selectedCajaId, setSelectedCajaId] = useState<string>("");
  const [approving, setApproving] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const toggleProject = (id: string) => {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpanded(next);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/finanzas/gastos?limit=1000');
      const data = Array.isArray(res) ? res : (res.data || []);
      const filteredData = data.filter((g: any) => !(g.tipo === "PLANILLA" && g.concepto.includes("[RRHH-REVISION]")));
      setGastos(filteredData);
    } catch (e) {
      console.error("Error fetching expenses", e);
      setGastos([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCajas = async () => {
    try {
      const res = await api.get('/finanzas/cajas');
      setCajas(res || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
    fetchProyectos(1, 100);
    fetchQuotes(1, 500);
    fetchCajas();
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

  const openApproveModal = (id: string) => {
    setGastoToApprove(id);
    setSelectedCajaId("");
    setApproveModalOpen(true);
  };

  const handleApproveGasto = async () => {
    if (!gastoToApprove || !selectedCajaId) {
      toast.error("Seleccione una caja de origen");
      return;
    }
    setApproving(true);
    try {
      await api.post(`/finanzas/gastos/${gastoToApprove}/aprobar`, { cajaId: selectedCajaId });
      toast.success("Gasto aprobado con éxito");
      setApproveModalOpen(false);
      setGastoToApprove(null);
      fetchData();
    } catch (error: any) {
      toast.error("Error al aprobar", { description: error.message });
    } finally {
      setApproving(false);
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

    const matchesStatus = statusFilter === "TODOS" || g.estado === statusFilter;

    return matchesSearch && matchesDate && matchesStatus;
  });

  const gastosPorProyecto = useMemo(() => {
    const map = new Map<string, { proyectoId: string, proyectoCodigo: string, proyectoNombre: string, clienteNombre: string, gastos: any[], totalAprobado: number, totalPendiente: number }>();
    const unassignedId = 'unassigned';
    
    filteredGastos.forEach(g => {
      const pId = g.proyectoId || unassignedId;
      const proyectoStore = proyectos.find(p => p.id === pId);
      
      const codigo = proyectoStore?.codigo || g.proyecto?.codigo || 'GASTOS GENERALES';
      const nombre = proyectoStore?.nombre || g.proyecto?.nombre || 'ADMINISTRACIÓN / OFICINA / PLANILLA';
      
      let clienteNombre = (proyectoStore as any)?.cliente?.empresa || (proyectoStore as any)?.cliente?.nombre || (g.proyecto as any)?.cliente?.empresa || (g.proyecto as any)?.cliente?.nombre;
      
      if (!clienteNombre) {
        const searchCode = proyectoStore?.codigo || g.proyecto?.codigo || codigo;
        const linkedQuote = globalQuotes.find(q => {
            if ((proyectoStore as any)?.cotizacionId && q.id === (proyectoStore as any).cotizacionId) return true;
            
            if (searchCode && q.codigo) {
                const projNum = searchCode.split("-").slice(-2).join("-");
                if (projNum && q.codigo.includes(projNum)) return true;
                if (projNum && q.codigo.includes(projNum.replace("26-", "2026-"))) return true;
            }
            return false;
        });
        
        if (linkedQuote) {
            clienteNombre = (linkedQuote as any).cliente?.empresa || (linkedQuote as any).cliente?.nombre;
        }
      }
      
      if (!clienteNombre) clienteNombre = pId === unassignedId ? 'Oficina Central' : 'Sin Cliente';

      if (!map.has(pId)) {
        map.set(pId, {
          proyectoId: pId,
          proyectoCodigo: codigo,
          proyectoNombre: nombre,
          clienteNombre: clienteNombre,
          gastos: [],
          totalAprobado: 0,
          totalPendiente: 0,
        });
      }
      const grupo = map.get(pId)!;
      grupo.gastos.push(g);
      const mTotal = Number(g.montoTotal || 0);
      if (g.estado === 'PAGADO' || g.estado === 'APROBADO') {
        grupo.totalAprobado += mTotal;
      } else if (g.estado !== 'ANULADO') {
        grupo.totalPendiente += mTotal;
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      if (a.proyectoId === unassignedId) return 1;
      if (b.proyectoId === unassignedId) return -1;
      return a.proyectoCodigo.localeCompare(b.proyectoCodigo);
    });
  }, [filteredGastos, proyectos, globalQuotes]);

  const totalPages = Math.ceil(gastosPorProyecto.length / itemsPerPage) || 1;
  const paginatedFolders = gastosPorProyecto.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
    <div className="space-y-6 pb-10">
      
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
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto mt-3 md:mt-0">
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

      <div className="bg-white p-5 rounded-2xl border border-border shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end mb-6">
            <div className="md:col-span-2">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Búsqueda</label>
                <div className="relative mt-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                        placeholder="Buscar concepto o proveedor..." 
                        className="pl-10 h-10 bg-slate-50/50 border-slate-200 rounded-xl font-bold text-xs shadow-none focus:bg-white transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
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
                        <SelectItem value="TODOS" className="font-bold text-xs uppercase text-slate-600">Todos</SelectItem>
                        <SelectItem value="PENDIENTE" className="font-bold text-xs uppercase text-slate-500">Pendiente / Borrador</SelectItem>
                        <SelectItem value="SOLICITADO" className="font-bold text-xs uppercase text-amber-600">Solicitado</SelectItem>
                        <SelectItem value="APROBADO" className="font-bold text-xs uppercase text-blue-600">Aprobado</SelectItem>
                        <SelectItem value="PAGADO" className="font-bold text-xs uppercase text-green-600">Pagado</SelectItem>
                        <SelectItem value="ANULADO" className="font-bold text-xs uppercase text-red-600">Anulado</SelectItem>
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
                    onClick={() => { setDateFrom(""); setDateTo(""); setSearch(""); setStatusFilter("TODOS"); setCurrentPage(1); }}
                    className="h-10 w-full px-4 gap-2 text-xs font-bold rounded-lg border-border text-slate-500 hover:text-slate-700"
                >
                    Limpiar Filtros
                </Button>
            </div>
        </div>

        {/* Lista agrupada por proyecto (Carpetas) */}
        {gastosPorProyecto.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-2xl border border-slate-200">
            <TrendingDown className="w-12 h-12 mx-auto text-slate-200 mb-4 opacity-30" />
            <p className="text-sm font-black uppercase text-slate-400 tracking-wider">No se encontraron gastos</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {paginatedFolders.map((grupo) => {
              const isOpen = expanded.has(grupo.proyectoId);
              return (
              <div key={grupo.proyectoId} className={cn("bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-slate-300", isOpen && "row-span-2")}>
                <button
                  type="button"
                  onClick={() => toggleProject(grupo.proyectoId)}
                  className="w-full text-left transition-colors duration-150"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200", isOpen ? "bg-error shadow-md shadow-error/20" : "bg-error/5")}>
                          <FolderKanban className={cn("w-5 h-5 transition-colors duration-200", isOpen ? "text-white" : "text-error")} />
                        </div>
                        <div className="min-w-0">
                          <h2 className="text-sm font-black uppercase tracking-tight text-slate-800 truncate max-w-[180px]" title={`${grupo.proyectoCodigo} - ${grupo.proyectoNombre}`}>
                            {grupo.proyectoCodigo}
                            {grupo.proyectoNombre.replace(/^proyecto\s*:\s*(cot-\d{4}-\d{3})?/i, '').trim() ? ` - ${grupo.proyectoNombre.replace(/^proyecto\s*:\s*(cot-\d{4}-\d{3})?/i, '').trim()}` : ''}
                          </h2>
                          <p className="text-[10px] font-bold text-slate-500 mt-0.5 truncate max-w-[180px]" title={grupo.clienteNombre}>
                            {grupo.clienteNombre}
                          </p>
                        </div>
                      </div>
                      <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200", isOpen ? "bg-error/10 text-error" : "text-slate-300")}>
                        {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200" title="Total Ejecutado/Aprobado">
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                        <span className="text-[9px] font-bold text-slate-600">S/ {Number(grupo.totalAprobado || 0).toFixed(2)}</span>
                      </span>
                      <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200" title="Total Pendiente">
                        <Clock className="w-3 h-3 text-orange-400" />
                        <span className="text-[9px] font-bold text-slate-600">S/ {Number(grupo.totalPendiente || 0).toFixed(2)}</span>
                      </span>
                      <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200" title="Cant. Gastos">
                        <TrendingDown className="w-3 h-3 text-slate-400" />
                        <span className="text-[9px] font-bold text-slate-600">{grupo.gastos.length}</span>
                      </span>
                    </div>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-slate-100 bg-slate-50/50 max-h-[350px] overflow-y-auto">
                    {grupo.gastos.map((g, idx) => (
                      <div key={g.id} className={`px-4 py-3 transition-colors hover:bg-white ${idx < grupo.gastos.length - 1 ? 'border-b border-slate-300 border-dashed' : ''}`}>
                        <div className="flex items-start justify-between mb-1.5">
                          <span className="font-black text-[10px] uppercase tracking-wide text-slate-700 leading-tight pr-2">
                            {g.codigo || 'S/N'} - {g.concepto.replace(/\[CONDICION:\s*CONTADO\]/gi, '').replace(/\[FECHA:[^\]]*\]/gi, '').trim()}
                          </span>
                          <div className="flex gap-1 shrink-0 ml-2">
                            {g.comprobanteUrl && (
                                <a href={g.comprobanteUrl} target="_blank" rel="noreferrer" title="Ver Adjunto">
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                                        <ExternalLink className="w-3 h-3" />
                                    </Button>
                                </a>
                            )}
                            {g.estado === 'SOLICITADO' && (user?.rol === 'ADMIN' || user?.modulos?.includes('finanzas')) && (
                                <Button variant="ghost" size="icon" onClick={() => openApproveModal(g.id)} className="h-6 w-6 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded" title="Aprobar Gasto">
                                    <CheckCircle className="w-3 h-3" />
                                </Button>
                            )}
                            {(g.estado !== 'APROBADO' && g.estado !== 'PAGADO') && (
                              <Button variant="ghost" size="icon" onClick={() => { setEditingGasto(g); setIsModalOpen(true); }} className="h-6 w-6 text-slate-400 hover:text-primary hover:bg-primary/10 rounded">
                                <Edit2 className="w-3 h-3" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" onClick={() => { setGastoToDelete({ id: g.id, name: `${g.codigo || 'S/N'} - ${g.concepto}` }); setDeleteModalOpen(true); }} className="h-6 w-6 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-1">
                          <span className="font-bold text-[9px] uppercase text-slate-500 truncate max-w-[140px]" title={g.proveedor?.razonSocial}>
                            {g.proveedor?.razonSocial || "Sin Proveedor"}
                          </span>
                          <div className="flex items-center gap-1">
                              <Badge variant="outline" className={cn("text-[8px] font-black uppercase tracking-tighter border px-1.5 py-0",
                                  g.prioridad === 'CRITICA' ? "text-red-600 bg-red-50 border-red-200" :
                                  g.prioridad === 'ALTA' ? "text-orange-600 bg-orange-50 border-orange-200" :
                                  "text-slate-500 bg-slate-50 border-slate-200"
                              )}>
                                  {g.prioridad || 'MEDIA'}
                              </Badge>
                              <Badge className={cn("border font-black text-[8px] uppercase tracking-wider px-1.5 py-0 rounded", gastoStatus[g.estado]?.color || "bg-slate-100 text-slate-600 border-slate-200")}>
                                {gastoStatus[g.estado]?.label || g.estado}
                              </Badge>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100/60">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] text-slate-400 font-bold flex items-center gap-1.5">
                                <Calendar className="w-3 h-3" />
                                {g.fechaEmision ? formatDate(g.fechaEmision) : '-'}
                            </span>
                            {g.fechaProgramadaPago && (
                                <span className="text-[9px] text-amber-600 font-bold flex items-center gap-1.5">
                                    <CalendarClock className="w-3 h-3 text-amber-500" /> Prog: {formatDate(g.fechaProgramadaPago)}
                                </span>
                            )}
                            {g.fechaPago && (
                                <span className="text-[9px] text-emerald-600 font-bold flex items-center gap-1.5">
                                    <CalendarCheck className="w-3 h-3 text-emerald-500" /> Pag: {formatDate(g.fechaPago)}
                                </span>
                            )}
                          </div>
                          <span className="font-black text-[11px] text-slate-800 self-end">S/ {Number(g.montoTotal || 0).toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              );
            })}
          </div>
        )}

        {/* Paginación */}
        {totalPages > 1 && (
            <div className="p-3 mt-4 bg-white border border-border shadow-sm rounded-xl flex items-center justify-between">
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-2">
                    Página {currentPage} de {totalPages} — Total: {gastosPorProyecto.length} carpetas
                </p>
                <div className="flex gap-2 mr-2">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        disabled={currentPage <= 1 || loading}
                        onClick={() => setCurrentPage(currentPage - 1)}
                        className="h-7 px-3 font-black text-[9px] uppercase border-slate-200 bg-white gap-1"
                    >
                        <ChevronLeft className="w-3 h-3" />
                        Anterior
                    </Button>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        disabled={currentPage >= totalPages || loading}
                        onClick={() => setCurrentPage(currentPage + 1)}
                        className="h-7 px-3 font-black text-[9px] uppercase border-slate-200 bg-white gap-1"
                    >
                        Siguiente
                        <ChevronRight className="w-3 h-3" />
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

      <ModernDialog
        isOpen={approveModalOpen}
        onOpenChange={setApproveModalOpen}
        title="Aprobar Gasto"
        maxWidth="sm:max-w-md"
      >
        <div className="p-4 flex flex-col gap-4">
          <p className="text-sm text-slate-600">Seleccione la caja o cuenta de origen para este gasto. Una vez aprobado y asignado, el fondo quedará reservado.</p>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Caja Origen</label>
            <Select value={selectedCajaId} onValueChange={(val) => setSelectedCajaId(val || "")}>
              <SelectTrigger className="h-12 w-full border-slate-200 rounded-xl font-bold">
                <SelectValue placeholder="Seleccione una caja">
                  {selectedCajaId ? cajas.find(c => c.id === selectedCajaId)?.nombre : "Seleccione una caja"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {cajas.map(c => (
                  <SelectItem key={c.id} value={c.id} className="font-bold text-slate-700">
                    {c.nombre} (S/ {Number(c.saldoDisponible || c.saldoReal || 0).toLocaleString()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setApproveModalOpen(false)} className="rounded-xl font-bold" disabled={approving}>
              Cancelar
            </Button>
            <Button onClick={handleApproveGasto} className="rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white" disabled={!selectedCajaId || approving}>
              {approving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              Aprobar Gasto
            </Button>
          </div>
        </div>
      </ModernDialog>
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
