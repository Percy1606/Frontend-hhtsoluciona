"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Search,
  Filter,
  UserPlus,
  Loader2,
  Edit3,
  Trash2,
  AlertCircle,
  Calendar,
  DollarSign,
  FileText,
  EyeOff,
  Banknote,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Timer,
  HardHat,
  Wrench,
  UserCheck,
  ClipboardList,
  PiggyBank,
  BarChart3,
  Zap,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useLogisticaStore, PersonalProyecto } from "@/store/logistica-store";
import { useOperacionesStore } from "@/store/operaciones-store";
import { Combobox } from "@/components/ui/combobox";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const ROLES = ["Técnico", "Operario", "Supervisor", "Otro"] as const;
const TIPOS_CONTRATO = ["Jornal", "Semanal", "Mensual"] as const;

export default function PersonalPage() {
  const router = useRouter();
  const {
    personal,
    totalPersonal,
    personalPage,
    personalTotalPages,
    loading,
    costosPersonal,
    projectProfitability,
    fetchPersonal,
    addPersonal,
    updatePersonal,
    removePersonal,
    fetchCostosPersonal,
    fetchProjectProfitability,
    generarCompromisoPersonalPorProyecto,
  } = useLogisticaStore();


  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState("all");  // "all"=todos, "true"=activos, "false"=inactivos
  const [filterRol, setFilterRol] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  const formatearMoneda = (valor: number) => {
    const fmt = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `S/ ${fmt.format(valor)}`;
  };

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    proyectoId: "",
    proyectoCodigo: "",
    proyectoNombre: "",
    nombre: "",
    documento: "",
    rol: "Técnico",
    tipoContrato: "Jornal",
    montoDiario: 0,
    fechaInicio: new Date().toISOString().split("T")[0],
    fechaFin: "",
    observaciones: "",
  });

  const [showExtrasForm, setShowExtrasForm] = useState(false);
  const [isSubmittingExtras, setIsSubmittingExtras] = useState(false);
  const [extrasData, setExtrasData] = useState({
    personalId: "",
    montoTotal: 0,
    fecha: new Date().toISOString().split("T")[0],
    observaciones: "",
  });

  const proyectos = useOperacionesStore((s) => s.proyectos);
  const fetchProyectosOp = useOperacionesStore((s) => s.fetchProyectos);

  // Proyectos disponibles: solo los que vienen de cotización ganada ("clientes ganados")
  const proyectosDisponibles = useMemo(() => {
    // Siempre incluir el proyecto del registro que se está editando
    const proyectoEditando = editingId 
      ? proyectos.find((p) => p.id === formData.proyectoId)
      : null;

    const filtrados = proyectos.map((p) => {
      const clientName = (p as any).cliente?.razonSocial || (p as any).cliente?.empresa || (p as any).clienteNombre || '';
      return {
        value: p.id,
        label: `${p.codigo} - ${p.nombre}`,
        subLabel: clientName ? clientName : `CÓDIGO: ${p.codigo}`
      };
    });

    // Si estamos editando y el proyecto no está en la lista filtrada, agregarlo
    if (proyectoEditando && !filtrados.find((p) => p.value === proyectoEditando.id)) {
      const clientName = (proyectoEditando as any).cliente?.razonSocial || (proyectoEditando as any).cliente?.empresa || (proyectoEditando as any).clienteNombre || '';
      filtrados.unshift({
        value: proyectoEditando.id,
        label: `${proyectoEditando.codigo} - ${proyectoEditando.nombre}`,
        subLabel: clientName ? clientName : `CÓDIGO: ${proyectoEditando.codigo}`
      });
    }

    return filtrados;
  }, [proyectos, editingId, formData.proyectoId]);

  useEffect(() => {
    fetchProyectosOp(1, 1000);
  }, [fetchProyectosOp]);

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [comprometerProyecto, setComprometerProyecto] = useState<{
    proyectoId: string;
    proyectoNombre: string;
    totalTrabajadores: number;
    costoTotal: number;
    loading: boolean;
  } | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleProject = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    fetchPersonal(page, 50, undefined, filterEstado, search || undefined, dateFrom || undefined, dateTo || undefined);
  }, [page, filterEstado, dateFrom, dateTo]);

  const handleSearch = () => {
    setPage(1);
    fetchPersonal(1, 50, undefined, filterEstado, search || undefined, dateFrom || undefined, dateTo || undefined);
  };

  const resetForm = () => {
    setFormData({
      proyectoId: "",
      proyectoCodigo: "",
      proyectoNombre: "",
      nombre: "",
      documento: "",
      rol: "Técnico",
      tipoContrato: "Jornal",
      montoDiario: 0,
      fechaInicio: new Date().toISOString().split("T")[0],
      fechaFin: "",
      observaciones: "",
    });
    setEditingId(null);
  };

  const openEdit = (p: PersonalProyecto) => {
    setFormData({
      proyectoId: p.proyectoId,
      proyectoCodigo: p.proyectoCodigo || "",
      proyectoNombre: p.proyectoNombre || "",
      nombre: p.nombre,
      documento: p.documento || "",
      rol: p.rol,
      tipoContrato: p.tipoContrato,
      montoDiario: p.montoDiario,
      fechaInicio: p.fechaInicio?.split("T")[0] || new Date().toISOString().split("T")[0],
      fechaFin: p.fechaFin?.split("T")[0] || "",
      observaciones: p.observaciones || "",
    });
    setEditingId(p.id);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!formData.nombre.trim() || !formData.proyectoId.trim()) {
      alert("El nombre y el proyecto son obligatorios");
      return;
    }

    try {
      if (editingId) {
        await updatePersonal(editingId, {
          ...formData,
          montoDiario: Number(formData.montoDiario),
          fechaFin: formData.fechaFin || undefined,
        });
      } else {
        await addPersonal({
          ...formData,
          montoDiario: Number(formData.montoDiario),
          fechaFin: formData.fechaFin || undefined,
        });
      }
      
      // Auto-generar el compromiso para no depender del clic manual
      await generarCompromisoPersonalPorProyecto(formData.proyectoId);
      fetchCostosPersonal(formData.proyectoId);
      fetchProjectProfitability(formData.proyectoId);
      
      setShowForm(false);
      resetForm();
    } catch (err: any) {
      alert(err.message || "Error al guardar");
    }
  };

  const handleComprometerProyecto = async () => {
    if (!comprometerProyecto) return;
    const { proyectoId } = comprometerProyecto;
    setComprometerProyecto({ ...comprometerProyecto, loading: true });
    try {
      const result = await generarCompromisoPersonalPorProyecto(proyectoId);
      fetchCostosPersonal(proyectoId);
      fetchProjectProfitability(proyectoId);
      setComprometerProyecto(null);
      alert(`✅ Compromiso generado: ${result.totalTrabajadores} trabajadores por ${formatearMoneda(result.costoTotal)}`);
    } catch (err: any) {
      alert(err.message || "Error al generar compromiso");
      setComprometerProyecto(null);
    }
  };

  const handleExtrasSubmit = async () => {
    if (!extrasData.personalId || extrasData.montoTotal <= 0) {
      alert("Seleccione un trabajador e ingrese un monto mayor a 0.");
      return;
    }

    const trabajador = personal.find((p) => p.id === extrasData.personalId);
    if (!trabajador) return;

    setIsSubmittingExtras(true);
    try {
      await api.post("/finanzas/gastos", {
        proyectoId: trabajador.proyectoId,
        tipo: "PLANILLA",
        clasificacion: "PROYECTO",
        concepto: `Horas Extras / Faltas - ${trabajador.nombre}`,
        montoTotal: Number(extrasData.montoTotal),
        estado: "PENDIENTE",
        fechaEmision: extrasData.fecha,
        area: "LogisticaYRecursos",
        justificacion: `Registro de horas extras/ajustes. Observaciones: ${extrasData.observaciones}`
      });

      alert(`✅ Registrado correctamente. El monto se ha sumado a los gastos de Planilla del proyecto ${trabajador.proyectoCodigo || ""}`);
      setShowExtrasForm(false);
      setExtrasData({
        personalId: "",
        montoTotal: 0,
        fecha: new Date().toISOString().split("T")[0],
        observaciones: "",
      });
      // Opcional: refetch costos
      fetchCostosPersonal(trabajador.proyectoId);
    } catch (err: any) {
      alert(err.message || "Error al registrar horas extras");
    } finally {
      setIsSubmittingExtras(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await removePersonal(id);
      setConfirmDelete(null);
    } catch (err: any) {
      alert(err.message || "Error al eliminar");
    }
  };

  const filteredPersonal = useMemo(() => {
    let result = personal;
    if (filterRol) {
      result = result.filter((p) => p.rol === filterRol);
    }
    return result;
  }, [personal, filterRol]);

  // Agrupar trabajadores por proyecto
  const personalPorProyecto = useMemo(() => {
    const grupos = new Map<string, { proyectoNombre: string; proyectoCodigo: string; clienteNombre: string; workers: PersonalProyecto[] }>();
    
    for (const p of filteredPersonal) {
      const key = p.proyectoId;
      if (!grupos.has(key)) {
        // Encontrar el proyecto para sacar el cliente
        const proj = proyectos.find(pr => pr.id === key);
        let cliente = '';
        if (proj) {
          cliente = (proj as any).cliente?.empresa || (proj as any).cliente?.nombre || (proj as any).cotizacion?.cliente?.empresa || (proj as any).cotizacion?.cliente?.nombre || '';
        }

        grupos.set(key, {
          proyectoNombre: p.proyectoNombre || p.proyectoCodigo || `#${key.slice(0, 8)}`,
          proyectoCodigo: p.proyectoCodigo || '',
          clienteNombre: cliente,
          workers: [],
        });
      }
      grupos.get(key)!.workers.push(p);
    }
    
    return Array.from(grupos.entries()).map(([proyectoId, data]) => ({
      proyectoId,
      ...data,
      totalActivos: data.workers.filter(w => w.activo).length,
      costoDiario: data.workers.filter(w => w.activo).reduce((sum, w) => sum + Number(w.montoDiario), 0),
    }));
  }, [filteredPersonal, proyectos]);

  const roleColor = (rol: string) => {
    switch (rol) {
      case "Supervisor": return "bg-blue-100 text-blue-800 border-blue-200";
      case "Técnico": return "bg-amber-100 text-amber-800 border-amber-200";
      case "Operario": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const contractBadge = (tipo: string) => {
    switch (tipo) {
      case "Jornal": return "bg-purple-100 text-purple-800";
      case "Semanal": return "bg-cyan-100 text-cyan-800";
      case "Mensual": return "bg-indigo-100 text-indigo-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  const costoEstimado = (p: PersonalProyecto) => {
    const diario = Number(p.montoDiario);
    if (p.tipoContrato === "Jornal") return diario;
    if (p.tipoContrato === "Semanal") return diario * 6;
    if (p.tipoContrato === "Mensual") return diario * 26;
    return diario;
  };

  const calcularDuracion = (p: PersonalProyecto) => {
    if (p.fechaFin && p.fechaInicio) {
      const diff = new Date(p.fechaFin).getTime() - new Date(p.fechaInicio).getTime();
      return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1);
    }
    if (p.tipoContrato === "Semanal") return 6;
    if (p.tipoContrato === "Mensual") return 26;
    return 1;
  };

  const calcularCostoTotal = (p: PersonalProyecto) => {
    return Number(p.montoDiario) * calcularDuracion(p);
  };

  const costoDiarioTotal = useMemo(() => {
    return personal.filter(p => p.activo).reduce((sum, p) => sum + Number(p.montoDiario), 0);
  }, [personal]);

  const factorMensual = (p: PersonalProyecto) => {
    if (p.tipoContrato === "Semanal") return 4;   // 4 semanas al mes
    if (p.tipoContrato === "Mensual") return 1;    // ya es mensual
    return 26; // Jornal: 26 días al mes
  };

  const costoMensualEstimado = useMemo(() => {
    return personal.filter(p => p.activo).reduce((sum, p) => sum + costoEstimado(p) * factorMensual(p), 0);
  }, [personal]);

  const proximoVenir = useMemo(() => {
    const hoy = new Date();
    const en7dias = new Date(hoy.getTime() + 7 * 24 * 60 * 60 * 1000);
    return personal.filter(p => p.activo && p.fechaFin && new Date(p.fechaFin) <= en7dias && new Date(p.fechaFin) >= hoy);
  }, [personal]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <HardHat className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-xl font-black text-primary tracking-tight uppercase">Mano de Obra</h1>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5 font-bold uppercase tracking-wide">
            Gestiona el personal asignado y los costos laborales de cada proyecto.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <Button onClick={() => router.push('/logistica/horas-extras')} variant="outline" className="h-10 px-6 font-black uppercase text-[10px] tracking-widest gap-2 rounded-xl border-blue-500 text-blue-600 hover:bg-blue-50">
            <CheckCircle2 className="w-4 h-4" />
            Solicitudes RRHH
          </Button>
          <Button onClick={() => { resetForm(); setShowForm(true); }} className="h-10 px-6 bg-primary hover:bg-primary/90 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20 gap-2 rounded-xl">
            <UserPlus className="w-4 h-4" />
            Registrar Personal
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3 bg-white">
          <div className="p-2 rounded-lg bg-white shadow-sm text-amber-600">
            <Zap className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider leading-none mb-0.5">Costo Diario</p>
            <p className="text-xl font-black leading-none tracking-tight text-amber-600">{formatearMoneda(costoDiarioTotal)}</p>
            <p className="text-[8px] font-bold text-slate-400 mt-0.5">{Math.round((costoDiarioTotal / (costoMensualEstimado || 1)) * 100)}% del mensual</p>
          </div>
        </div>
        <div className="p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3 bg-white">
          <div className="p-2 rounded-lg bg-white shadow-sm text-blue-600">
            <BarChart3 className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider leading-none mb-0.5">Costo Mensual</p>
            <p className="text-xl font-black leading-none tracking-tight text-blue-600">{formatearMoneda(costoMensualEstimado)}</p>
            <p className="text-[8px] font-bold text-slate-400 mt-0.5">{personal.filter(p => p.activo).length} trabajadores</p>
          </div>
        </div>
        <div className="p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3 bg-white">
          <div className={`p-2 rounded-lg bg-white shadow-sm ${proximoVenir.length > 0 ? 'text-red-500' : 'text-slate-400'}`}>
            <Timer className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider leading-none mb-0.5">Próx. a Vencer</p>
            <p className={`text-xl font-black leading-none tracking-tight ${proximoVenir.length > 0 ? 'text-red-600' : 'text-slate-400'}`}>{proximoVenir.length}</p>
            {proximoVenir.length > 0 && (
              <div className="mt-0.5 space-y-0.5">
                {proximoVenir.slice(0, 1).map(p => {
                  const diff = new Date(p.fechaFin!).getTime() - new Date().getTime();
                  const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
                  return (
                    <p key={p.id} className="text-[8px] font-bold text-red-500">{p.nombre} ({daysLeft === 0 ? 'hoy' : `${daysLeft}d`})</p>
                  );
                })}
                {proximoVenir.length > 1 && <p className="text-[8px] font-bold text-slate-400">+{proximoVenir.length - 1} más</p>}
              </div>
            )}
          </div>
        </div>
        <div className="p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3 bg-white">
          <div className="p-2 rounded-lg bg-white shadow-sm text-emerald-600">
            <Users className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider leading-none mb-0.5">Personal Activo</p>
            <p className="text-xl font-black leading-none tracking-tight text-emerald-600">{personal.filter(p => p.activo).length}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-5 rounded-2xl border border-border shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 md:items-end w-full">
          <div className="flex-1 w-full">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5 block">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Nombre, documento o proyecto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10 h-11 bg-slate-50/50 border-slate-200 rounded-xl font-bold text-xs shadow-none"
              />
            </div>
          </div>
          <div className="w-full md:w-40">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5 block">Estado</label>
            <Select value={filterEstado} onValueChange={(v) => v && setFilterEstado(v)}>
              <SelectTrigger className="h-11 border-slate-200 bg-slate-50/50 rounded-xl font-bold text-xs shadow-none">
                <SelectValue placeholder="Todos">
                  {filterEstado === "all" ? "Todos" : filterEstado === "true" ? "Activos" : "Inactivos"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="true">Activos</SelectItem>
                <SelectItem value="false">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-40">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5 block">Rol</label>
            <Select value={filterRol} onValueChange={(v) => v !== undefined && setFilterRol(v || "")}>
              <SelectTrigger className="h-11 border-slate-200 bg-slate-50/50 rounded-xl font-bold text-xs shadow-none">
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-36">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5 block">Desde</label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-11 bg-slate-50/50 border-slate-200 rounded-xl font-bold text-xs shadow-none"
            />
          </div>
          <div className="w-36">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5 block">Hasta</label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-11 bg-slate-50/50 border-slate-200 rounded-xl font-bold text-xs shadow-none"
            />
          </div>
          <Button variant="secondary" onClick={handleSearch} className="h-11 px-6 font-black uppercase text-[10px] tracking-widest rounded-xl">
            <Filter className="w-4 h-4 mr-2" />
            Filtrar
          </Button>
        </div>
      </div>

      {/* Lista agrupada por proyecto */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
        </div>
      ) : filteredPersonal.length === 0 ? (
        <div className="py-20 text-center">
          <HardHat className="w-12 h-12 mx-auto text-slate-200 mb-4" />
          <p className="text-sm font-black uppercase text-slate-400 tracking-wider">No hay personal registrado</p>
          <p className="text-[10px] font-bold text-slate-300 mt-1">Registra el personal asignado a cada proyecto</p>
          <Button className="mt-4 h-10 px-6 font-black uppercase text-[10px] tracking-widest rounded-xl" onClick={() => { resetForm(); setShowForm(true); }}>
            <UserPlus className="w-4 h-4 mr-2" />
            Registrar Personal
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {personalPorProyecto.map((grupo) => {
            const activos = grupo.workers.filter(w => w.activo);
            const costoTotalProyecto = activos.reduce((sum, w) => sum + calcularCostoTotal(w), 0);
            const isOpen = expanded.has(grupo.proyectoId);
            return (
            <Card key={grupo.proyectoId} className={cn("bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-slate-300", isOpen && "row-span-2")}>
              <button
                type="button"
                onClick={() => toggleProject(grupo.proyectoId)}
                className="w-full text-left transition-colors duration-150"
              >
              {/* Project identity bar */}
              <div className="px-3 pt-2.5 pb-1.5 flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className={cn("mt-0.5 p-1 rounded-md shrink-0 transition-all duration-200", isOpen ? "bg-primary shadow-md shadow-primary/20 text-white" : "bg-primary/10 text-primary")}>
                    <HardHat className="w-3 h-3" />
                  </div>
                  <div className="min-w-0 flex-1 pr-2">
                    {(() => {
                      const cleanName = grupo.proyectoNombre.replace(/^proyecto\s*:\s*(cot-\d{4}-\d{3})?/i, '').trim() || grupo.proyectoCodigo;
                      const combined = cleanName + (grupo.proyectoCodigo && grupo.proyectoCodigo !== grupo.proyectoNombre ? ` - ${grupo.proyectoCodigo}` : '');
                      return (
                        <h3 className={cn("font-black uppercase tracking-tight text-primary break-words whitespace-normal", combined.length > 42 ? "text-[11px] leading-snug" : "text-xs leading-snug")} title={`${grupo.proyectoNombre} - ${grupo.proyectoCodigo}`}>
                          {combined}
                        </h3>
                      );
                    })()}
                    {grupo.clienteNombre && (
                      <p className="font-bold text-[10px] text-slate-500 break-words whitespace-normal mt-0.5" title={grupo.clienteNombre}>
                        {grupo.clienteNombre}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 mt-1 text-[6px] font-bold text-slate-400 uppercase tracking-wide">
                      <span className="flex items-center gap-1">
                        <Users className="w-2.5 h-2.5" />
                        {grupo.totalActivos} activos
                      </span>
                      <span className="flex items-center gap-1">
                        <Zap className="w-2.5 h-2.5" />
                        {formatearMoneda(grupo.costoDiario)}/día
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200", isOpen ? "bg-primary/10 text-primary" : "text-slate-300")}>
                    {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </div>
                </div>
              </div>

              {/* Total amount highlight */}
              <div className="mx-3 mb-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-emerald-50 to-emerald-50/60 border border-emerald-100/80 flex items-center justify-between">
                <span className="text-[7px] font-bold text-emerald-700 uppercase tracking-wider">Total Proyecto</span>
                <span className="text-xs font-black text-emerald-700 tracking-tight">{formatearMoneda(costoTotalProyecto)}</span>
              </div>
              </button>

              <div className={cn("transition-all duration-300 ease-in-out overflow-hidden", isOpen ? "max-h-[9999px] opacity-100" : "max-h-0 opacity-0")}>
              {/* Workers list */}
              <div className="border-t border-slate-100">
                {grupo.workers.length === 0 ? (
                  <div className="px-4 py-3 text-[8px] font-bold text-slate-400 text-center uppercase">Sin trabajadores en este proyecto</div>
                ) : (
                  grupo.workers.map((p, idx) => {
                    const proximoVencer = p.activo && p.fechaFin ? (() => {
                      const diff = new Date(p.fechaFin).getTime() - new Date().getTime();
                      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                      return { activo: days >= 0 && days <= 7, dias: days };
                    })() : { activo: false, dias: 0 };
                    return (                      <div
                      key={p.id}
                      className={`px-3 py-2 transition-colors hover:bg-slate-50/80 ${idx < grupo.workers.length - 1 ? 'border-b border-slate-300 border-dashed' : ''}`}
                    >
                      {/* Línea 1: Nombre + acciones */}
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-black text-[11px] uppercase tracking-wide truncate ${!p.activo ? 'text-slate-400' : 'text-slate-800'}`}>
                          {p.nombre}
                        </span>
                        <div className="flex gap-1 shrink-0 ml-2">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(p)} className="h-5 w-5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded">
                            <Edit3 className="w-2.5 h-2.5" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(p.id)} className="h-5 w-5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded">
                            <Trash2 className="w-2.5 h-2.5" />
                          </Button>
                        </div>
                      </div>
                      {/* Línea 2: Badges + costos */}
                      <div className="flex items-center flex-wrap gap-x-2.5 gap-y-0.5 mb-1">
                        <Badge className={`${roleColor(p.rol)} text-[8px] font-black tracking-widest px-1.5 py-0`} variant="outline">{p.rol}</Badge>
                        <Badge className={`${contractBadge(p.tipoContrato)} text-[8px] font-black tracking-widest px-1.5 py-0`} variant="outline">{p.tipoContrato}</Badge>
                        <span className="text-[11px] font-bold text-slate-500">{formatearMoneda(Number(p.montoDiario))}/día</span>
                        <span className="text-[11px] font-bold text-slate-300">·</span>
                        <span className="text-[11px] font-bold text-slate-500">{calcularDuracion(p)}d</span>
                        <span className="text-[11px] font-bold text-slate-300">·</span>
                        <span className="text-[11px] font-black text-slate-700">Total: {formatearMoneda(calcularCostoTotal(p))}</span>
                      </div>
                      {/* Línea 3: Fechas + alertas */}
                      <div className="flex items-center flex-wrap gap-x-2.5 gap-y-0.5">
                        {p.fechaFin && (
                          <span className="text-[9px] font-bold text-slate-400 truncate">
                            <Calendar className="w-3 h-3 inline mr-0.5" />
                            {new Date(p.fechaInicio).toLocaleDateString()}→{new Date(p.fechaFin).toLocaleDateString()}
                          </span>
                        )}
                        {!p.activo && (
                          <Badge className="bg-red-50 text-red-700 border-red-200 text-[7px] font-black tracking-widest px-1.5 py-0" variant="outline">
                            <EyeOff className="w-2 h-2 mr-0.5" /> Inactivo
                          </Badge>
                        )}
                        {proximoVencer.activo && (
                          <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[7px] font-black tracking-widest px-1.5 py-0" variant="outline">
                            <AlertTriangle className="w-2 h-2 mr-0.5" />
                            {proximoVencer.dias === 0 ? 'Vence hoy' : `Vence ${proximoVencer.dias}d`}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )})
                )}
              </div>
              </div>
            </Card>
          )})}
        </div>
      )}

      {/* Pagination */}
      {personalTotalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 pt-2 pb-1">
          <Button
            variant="outline"
            size="sm"
            disabled={personalPage <= 1}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            className="h-8 px-2.5 text-[10px] font-bold rounded-lg"
          >
            ← Anterior
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(personalTotalPages, 7) }, (_, i) => {
              let pageNum: number;
              if (personalTotalPages <= 7) {
                pageNum = i + 1;
              } else if (personalPage <= 4) {
                pageNum = i + 1;
              } else if (personalPage >= personalTotalPages - 3) {
                pageNum = personalTotalPages - 6 + i;
              } else {
                pageNum = personalPage - 3 + i;
              }
              return (
                <Button
                  key={pageNum}
                  variant={personalPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPage(pageNum)}
                  className={`h-8 min-w-[2rem] px-1 text-[10px] font-black rounded-lg ${personalPage === pageNum ? '' : ''}`}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={personalPage >= personalTotalPages}
            onClick={() => setPage((prev) => prev + 1)}
            className="h-8 px-2.5 text-[10px] font-bold rounded-lg"
          >
            Siguiente →
          </Button>
          <span className="text-[9px] font-bold text-slate-400 ml-1">
            {totalPersonal} registros
          </span>
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) { setShowForm(false); resetForm(); } }}>
        <DialogContent className="w-full sm:max-w-lg bg-white p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-lg font-bold text-slate-900">
              {editingId ? "Editar Personal" : "Registrar Personal"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {editingId
                ? "Actualiza los datos del trabajador asignado al proyecto."
                : "Registra un nuevo trabajador asignado a un proyecto."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-[11px] font-bold uppercase text-slate-700 block">Nombre completo <span className="text-red-500">*</span></label>
                <Input value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} placeholder="Ej: Juan Pérez" className="h-10" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase text-slate-700 block">Documento (DNI/CE)</label>
                <Input value={formData.documento} onChange={(e) => setFormData({ ...formData, documento: e.target.value })} placeholder="Ej: 12345678" className="h-10" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase text-slate-700 block">Rol</label>
                <Select value={formData.rol} onValueChange={(v) => v && setFormData({ ...formData, rol: v })}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white">
                    {ROLES.map((r) => (<SelectItem key={r} value={r}>{r}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-[11px] font-bold uppercase text-slate-700 block">Proyecto <span className="text-red-500">*</span></label>
                <Combobox
                  options={proyectosDisponibles}
                  value={formData.proyectoId}
                  onChange={(value) => {
                    const proyecto = proyectos.find((p) => p.id === value);
                    setFormData({
                      ...formData,
                      proyectoId: value,
                      proyectoCodigo: proyecto?.codigo || '',
                      proyectoNombre: proyecto?.nombre || '',
                    });
                  }}
                  placeholder="Seleccionar proyecto..."
                  searchPlaceholder="Buscar proyecto por código o nombre..."
                  emptyMessage="No hay proyectos disponibles"
                />
                {formData.proyectoNombre && (
                  <p className="text-[11px] font-medium text-slate-500 mt-1">{formData.proyectoCodigo} - {formData.proyectoNombre}</p>
                )}
              </div>

              <Separator className="sm:col-span-2 my-1" />

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase text-slate-700 block">Tipo de Contrato</label>
                <Select value={formData.tipoContrato} onValueChange={(v) => v && setFormData({ ...formData, tipoContrato: v })}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white">
                    {TIPOS_CONTRATO.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase text-slate-700 block">Monto Diario (S/.) <span className="text-red-500">*</span></label>
                <Input type="number" min="0" step="0.01" value={formData.montoDiario} onChange={(e) => setFormData({ ...formData, montoDiario: Number(e.target.value) })} className="h-10 font-bold" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase text-slate-700 block">Fecha de Inicio <span className="text-red-500">*</span></label>
                <Input type="date" value={formData.fechaInicio} onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })} className="h-10" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase text-slate-700 block">Fecha de Fin (opcional)</label>
                <Input type="date" value={formData.fechaFin} onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })} className="h-10" />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-[11px] font-bold uppercase text-slate-700 block">Observaciones</label>
                <Input value={formData.observaciones} onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })} placeholder="Notas adicionales..." className="h-10" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 mt-2">
            <Button variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>Cancelar</Button>
            <Button onClick={handleSubmit} className="bg-primary hover:bg-primary/90 text-white font-bold">{editingId ? "Guardar Cambios" : "Registrar Personal"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Costos Resumen */}
      {costosPersonal && (
        <div className="bg-white p-5 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
              <PiggyBank className="w-4 h-4 text-slate-400" />
              Resumen Financiero — {costosPersonal.trabajadoresActivos} activos
            </h3>
            <span className="text-[9px] font-black uppercase text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">
              Diario: {formatearMoneda(Number(costosPersonal.costoDiarioTotal))}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-amber-600 tracking-wider mb-2">
                <Clock className="w-3 h-3" />
                Comprometido
              </div>
              <p className="text-xl font-black tracking-tight text-slate-800">{formatearMoneda(Number(costosPersonal.costoTotalComprometido))}</p>
              <div className="mt-2 h-0.5 rounded-full bg-amber-100 overflow-hidden">
                <div className="h-full rounded-full bg-amber-400 w-3/4" />
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-emerald-600 tracking-wider mb-2">
                <CheckCircle2 className="w-3 h-3" />
                Pagado
              </div>
              <p className="text-xl font-black tracking-tight text-slate-800">{formatearMoneda(Number(costosPersonal.costoTotalPagado))}</p>
              <div className="mt-2 h-0.5 rounded-full bg-emerald-100 overflow-hidden">
                <div className="h-full rounded-full bg-emerald-400" style={{ width: `${Number(costosPersonal.costoTotalPagado) > 0 && Number(costosPersonal.costoTotalComprometido) > 0 ? Math.round((Number(costosPersonal.costoTotalPagado) / Number(costosPersonal.costoTotalComprometido)) * 100) : 0}%` }} />
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-blue-600 tracking-wider mb-2">
                <Banknote className="w-3 h-3" />
                Acumulado
              </div>
              <p className="text-xl font-black tracking-tight text-slate-800">{formatearMoneda(Number(costosPersonal.costoTotalAcumulado))}</p>
              <div className="mt-2 h-0.5 rounded-full bg-blue-100 overflow-hidden">
                <div className="h-full rounded-full bg-blue-400 w-full" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Panel Unificado: MO + Materiales del Proyecto */}
      {projectProfitability && (
        <div className="bg-white p-5 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-slate-400" />
              Costos del Proyecto: {projectProfitability.codigo} — {projectProfitability.nombre}
            </h3>
            <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg ${projectProfitability.presupuestoExcedido ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
              {projectProfitability.presupuestoExcedido ? 'Presupuesto excedido' : 'Dentro del presupuesto'}
            </span>
          </div>

          {/* Barras de costos */}
          <div className="space-y-3 mb-4">
            <div>
              <div className="flex justify-between text-[10px] font-black uppercase tracking-wider mb-1">
                <span className="text-amber-600">Mano de Obra</span>
                <span className="text-amber-600">{formatearMoneda(projectProfitability.egresos.manoObra)}</span>
              </div>
              <div className="h-1 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${projectProfitability.montoCotizado > 0 ? Math.min(100, (projectProfitability.egresos.manoObra / projectProfitability.montoCotizado) * 100) : 0}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[10px] font-black uppercase tracking-wider mb-1">
                <span className="text-blue-600">Materiales</span>
                <span className="text-blue-600">{formatearMoneda(projectProfitability.egresos.materiales)}</span>
              </div>
              <div className="h-1 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full bg-blue-400 transition-all" style={{ width: `${projectProfitability.montoCotizado > 0 ? Math.min(100, (projectProfitability.egresos.materiales / projectProfitability.montoCotizado) * 100) : 0}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[10px] font-black uppercase tracking-wider mb-1">
                <span className="text-slate-500">Otros Gastos</span>
                <span className="text-slate-500">{formatearMoneda(projectProfitability.egresos.gastosDirectos)}</span>
              </div>
              <div className="h-1 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full bg-slate-400 transition-all" style={{ width: `${projectProfitability.montoCotizado > 0 ? Math.min(100, (projectProfitability.egresos.gastosDirectos / projectProfitability.montoCotizado) * 100) : 0}%` }} />
              </div>
            </div>
          </div>

          {/* Resumen vs Presupuesto */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">Presupuesto</p>
              <p className="text-sm font-black tracking-tight text-slate-800">{formatearMoneda(projectProfitability.montoCotizado)}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">Ejecutado</p>
              <p className="text-sm font-black tracking-tight text-slate-800">{formatearMoneda(projectProfitability.egresos.costoTotal)}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">Disponible</p>
              <p className={`text-sm font-black tracking-tight ${projectProfitability.montoCotizado - projectProfitability.egresos.costoTotal >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatearMoneda(Math.max(0, projectProfitability.montoCotizado - projectProfitability.egresos.costoTotal))}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">% Ejecutado</p>
              <p className={`text-sm font-black tracking-tight ${projectProfitability.montoCotizado > 0 && (projectProfitability.egresos.costoTotal / projectProfitability.montoCotizado) * 100 <= 100 ? 'text-emerald-600' : 'text-red-600'}`}>
                {projectProfitability.montoCotizado > 0 ? Math.round((projectProfitability.egresos.costoTotal / projectProfitability.montoCotizado) * 100) : 0}%
              </p>
            </div>
          </div>

          {/* Utilidad */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 text-[10px] font-bold text-slate-500">
            <span>Utilidad proyectada:</span>
            <span className={`font-black ${projectProfitability.indicadores.utilidadProyectada >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {formatearMoneda(projectProfitability.indicadores.utilidadProyectada)}
            </span>
            <span className="text-slate-400">({projectProfitability.indicadores.rentabilidadProyectada}%)</span>
          </div>
        </div>
      )}

      {/* Comprometer Proyecto Dialog */}
      <Dialog open={!!comprometerProyecto} onOpenChange={() => setComprometerProyecto(null)}>
        <DialogContent className="sm:max-w-[420px] bg-white p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
              <Banknote className="w-5 h-5 text-emerald-600" />
              Comprometer Mano de Obra
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Se generará un único gasto consolidado para todo el personal activo del proyecto.
            </DialogDescription>
          </DialogHeader>
          {comprometerProyecto && (
            <div className="space-y-4 my-2">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">
                  {comprometerProyecto.proyectoNombre}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-600">{comprometerProyecto.totalTrabajadores} trabajadores activos</span>
                  <span className="text-lg font-black text-emerald-600">{formatearMoneda(comprometerProyecto.costoTotal)}</span>
                </div>
              </div>
              <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                <p className="text-xs font-bold text-amber-700 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  Este gasto pasará a Finanzas para su aprobación como una sola solicitud.
                </p>
              </div>
            </div>
          )}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 mt-3">
            <Button variant="outline" onClick={() => setComprometerProyecto(null)} className="font-bold">
              Cancelar
            </Button>
            <Button
              onClick={handleComprometerProyecto}
              disabled={comprometerProyecto?.loading}
              className="bg-emerald-600 hover:bg-emerald-700 font-bold text-white"
            >
              {comprometerProyecto?.loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Generar Compromiso
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent className="sm:max-w-[400px] bg-white p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 text-base font-bold">
              <AlertCircle className="w-5 h-5" />
              Confirmar Eliminación
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 pt-1">
              ¿Estás seguro de eliminar este registro de personal? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 mt-4">
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={() => confirmDelete && handleDelete(confirmDelete)}>
              Eliminar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Form Horas Extras */}
      <Dialog open={showExtrasForm} onOpenChange={setShowExtrasForm}>
        <DialogContent className="sm:max-w-[480px] bg-white p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-base font-bold text-slate-900">Registrar Horas Extras</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Se enviará directo a Finanzas como un Gasto Operativo asociado al proyecto del trabajador.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase text-slate-700 block">Trabajador Activo <span className="text-red-500">*</span></label>
              <Combobox
                options={personal.filter((p) => p.activo).map((p) => ({
                  value: p.id,
                  label: p.nombre,
                  subLabel: p.proyectoCodigo || p.proyectoNombre || "Sin Proyecto",
                }))}
                value={extrasData.personalId}
                onChange={(value) => setExtrasData({ ...extrasData, personalId: value })}
                placeholder="Buscar trabajador..."
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase text-slate-700 block">Monto Extra a Pagar (S/.) <span className="text-red-500">*</span></label>
              <Input type="number" min="0" step="0.01" value={extrasData.montoTotal} onChange={(e) => setExtrasData({ ...extrasData, montoTotal: Number(e.target.value) })} className="h-10 font-bold" />
              <p className="text-[10px] text-slate-400 font-medium">Suma al costo del proyecto (Planilla)</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase text-slate-700 block">Fecha de Ejecución <span className="text-red-500">*</span></label>
              <Input type="date" value={extrasData.fecha} onChange={(e) => setExtrasData({ ...extrasData, fecha: e.target.value })} className="h-10" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase text-slate-700 block">Observaciones / Justificación</label>
              <Input value={extrasData.observaciones} onChange={(e) => setExtrasData({ ...extrasData, observaciones: e.target.value })} placeholder="Ej: Trabajo día sábado" className="h-10" />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 mt-2">
            <Button variant="outline" onClick={() => setShowExtrasForm(false)} disabled={isSubmittingExtras}>Cancelar</Button>
            <Button onClick={handleExtrasSubmit} disabled={isSubmittingExtras} className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
              {isSubmittingExtras ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Clock className="w-4 h-4 mr-2" />}
              Aprobar Monto
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
