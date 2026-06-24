"use client";

import { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Zap,
  Search,
  RefreshCw,
  Clock,
  Building,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { formatDate, cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProjectWorkflow {
  id: string;
  codigo: string;
  nombre: string;
  estado: string;
  estadoFinanciero: string | null;
  autorizaCompras: boolean;
  estadoLogistica: string | null;
  ventaContratada: number;
  costoPresupuestado: number | null;
  fechaCreacion: string;
  cliente: { id: string; empresa: string; ruc: string };
  cotizacionOrigen: {
    id: string;
    codigo: string;
    monto: number;
    formaPago: string;
  };
  adelantos: { monto: number; fechaRecibido: string }[];
}

export default function WorkflowPage() {
  const [proyectos, setProyectos] = useState<ProjectWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const loadData = async () => {
    setLoading(true);
    try {
      // Usamos el endpoint de finanzas ya que trae la cotización, hitos, facturas y adelantos
      const data = await api.get("/finanzas/bandeja-proyectos");
      setProyectos(data);
    } catch (e) {
      toast.error("Error al cargar la hoja de ruta de proyectos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Reiniciar página a 1 cuando cambie la búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return proyectos;
    return proyectos.filter(
      (p) =>
        p.codigo.toLowerCase().includes(q) ||
        p.nombre.toLowerCase().includes(q) ||
        p.cliente?.empresa.toLowerCase().includes(q)
    );
  }, [proyectos, search]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  
  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

  // Contadores para el Dashboard del Semáforo
  const kpis = useMemo(() => {
    let detenidoFinanzas = 0;
    let detenidoLogistica = 0;
    let enEjecucion = 0;

    proyectos.forEach((p) => {
      const totalAdelantos = p.adelantos?.reduce((sum, a) => sum + Number(a.monto), 0) || 0;
      const tienePagoInicial = totalAdelantos > 0 || p.estadoFinanciero === "AdelantoRecibido" || p.estadoFinanciero === "Aprobado";

      if (!tienePagoInicial) {
        detenidoFinanzas++;
      } else if (!p.autorizaCompras) {
        detenidoLogistica++;
      } else if (p.estado === "En Ejecución" || p.estado === "Planificacion") {
        enEjecucion++;
      }
    });

    return { detenidoFinanzas, detenidoLogistica, enEjecucion };
  }, [proyectos]);

  return (
    <TooltipProvider>
      <div className="p-6 space-y-8 pb-12">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="bg-[#001F3F] text-white p-2.5 rounded-xl shadow-lg shadow-[#001F3F]/10">
                <Zap className="w-5 h-5 text-amber-400 animate-pulse" />
              </div>
              <div>
                <h1 className="text-lg font-black text-primary tracking-tight">Hoja de Ruta Inter-Áreas</h1>
                <p className="text-muted-foreground font-medium text-[10px] mt-0.5">Control de flujo comercial ➡️ finanzas ➡️ logística ➡️ operaciones.</p>
              </div>
            </div>
          </div>
          <Button
            onClick={loadData}
            variant="outline"
            size="sm"
            className="text-[10px] font-bold uppercase gap-2 h-9 border-slate-200"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} /> Actualizar
          </Button>
        </div>

        {/* SEMÁFORO DE CONTROL RÁPIDO */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-red-50 border border-red-100/60 p-2.5 rounded-xl flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
            <div>
              <p className="text-[8px] font-black text-red-600 uppercase tracking-wider">En Espera de Pago (Finanzas)</p>
              <h3 className="text-xs font-black text-red-700">{kpis.detenidoFinanzas} proyectos</h3>
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-100/60 p-2.5 rounded-xl flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            <div>
              <p className="text-[8px] font-black text-amber-600 uppercase tracking-wider">En Espera de Recursos (Logística)</p>
              <h3 className="text-xs font-black text-amber-700">{kpis.detenidoLogistica} proyectos</h3>
            </div>
          </div>
          <div className="bg-emerald-50 border border-emerald-100/60 p-2.5 rounded-xl flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <div>
              <p className="text-[8px] font-black text-emerald-600 uppercase tracking-wider">En Operación Activa (Campo)</p>
              <h3 className="text-xs font-black text-emerald-700">{kpis.enEjecucion} proyectos</h3>
            </div>
          </div>
        </div>

        {/* BUSCADOR */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Buscar por código de proyecto, cliente o nombre de obra..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 pl-10 text-sm border-slate-200 bg-white rounded-xl shadow-sm w-full"
          />
        </div>

        {/* LISTADO DE PROYECTOS */}
        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="animate-spin w-8 h-8 text-primary/40" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <HelpCircle className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-sm font-bold text-slate-400">No se encontraron proyectos con ese filtro.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedProjects.map((p) => {
              const totalAdelantos = p.adelantos?.reduce((sum, a) => sum + Number(a.monto), 0) || 0;
              const porcentajeCobrado = p.ventaContratada > 0 ? (totalAdelantos / p.ventaContratada) * 100 : 0;

              // Calcular Estados de los Pasos
              // Paso 1: Comercial (Aprobado/Ganado) -> Siempre verde si el proyecto existe
              const step1 = { label: "1. Cotización", status: "completed", desc: `Aprobada (${p.cotizacionOrigen?.codigo || "Ref"})` };

              // Paso 2: Finanzas (Cobro 50% Adelanto)
              const tienePago = totalAdelantos > 0 || p.estadoFinanciero === "AdelantoRecibido" || p.estadoFinanciero === "Aprobado";
              const step2 = {
                label: "2. Cobro Adelanto",
                status: tienePago ? "completed" : "pending",
                desc: tienePago
                  ? `S/ ${totalAdelantos.toLocaleString("es-PE")} cobrados (${Math.round(porcentajeCobrado)}%)`
                  : "Esperando adelanto del cliente",
              };

              // Paso 3: Logística (Recursos y Compras)
              let status3 = "locked";
              if (tienePago) {
                status3 = p.autorizaCompras ? "completed" : "pending";
              }
              const step3 = {
                label: "3. Rec. Logística",
                status: status3,
                desc: p.autorizaCompras ? "Compras y personal autorizados" : "Esperando liberación de compras",
              };

              // Paso 4: Operaciones (Trabajo en Campo)
              let status4 = "locked";
              if (p.autorizaCompras) {
                status4 = p.estado === "Finalizado" ? "completed" : "pending";
              }
              const step4 = {
                label: "4. Obra Campo",
                status: status4,
                desc: p.estado === "Finalizado" ? "Ejecución 100% completada" : `Proyecto en estado: ${p.estado}`,
              };

              // Paso 5: Finanzas Cierre (Cobro Final)
              let status5 = "locked";
              if (p.estado === "Finalizado") {
                status5 = p.estadoFinanciero === "Aprobado" ? "completed" : "pending";
              }
              const step5 = {
                label: "5. Cobro Liquidación",
                status: status5,
                desc: p.estadoFinanciero === "Aprobado" ? "Proyecto 100% cobrado" : "Esperando cobro final de cierre",
              };

              const steps = [step1, step2, step3, step4, step5];

              return (
                <div key={p.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-4">
                  {/* Detalle Superior del Proyecto */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-primary/5 text-primary border-primary/10 font-mono text-[9px] uppercase px-2 h-5 rounded-md">
                          {p.codigo}
                        </Badge>
                        <h3 className="text-xs font-black uppercase text-slate-800 tracking-tight">
                          {p.nombre}
                        </h3>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 font-bold flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-slate-300" />
                        Cliente: <span className="text-slate-600 font-extrabold uppercase">{p.cliente?.empresa}</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Presupuesto / Venta</p>
                      <p className="text-xs font-mono font-black text-slate-700">
                        S/ {Number(p.ventaContratada).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>

                  {/* LÍNEA DE TIEMPO DEL FLUJO INTER-ÁREAS */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-2">
                    {steps.map((st, idx) => (
                      <div key={idx} className="relative flex flex-col items-center p-3 rounded-xl border bg-slate-50/50 border-slate-100 text-center">
                        {/* Conector lineal (solo en desktop) */}
                        {idx < 4 && (
                          <div className="hidden md:block absolute top-[28px] left-[70%] w-[60%] h-[2px] bg-slate-200 z-0" />
                        )}

                        <Tooltip>
                          <TooltipTrigger>
                            <div className="relative z-10 cursor-pointer">
                              {st.status === "completed" ? (
                                <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 border-2 border-white">
                                  <CheckCircle2 className="w-5 h-5" />
                                </div>
                              ) : st.status === "pending" ? (
                                <div className="w-9 h-9 rounded-full bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20 border-2 border-white animate-pulse">
                                  <AlertCircle className="w-5 h-5" />
                                </div>
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 border-2 border-white">
                                  <Clock className="w-4 h-4" />
                                </div>
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="bg-slate-800 text-white border-none rounded-lg p-2.5 max-w-[200px] text-center">
                            <p className="text-[10px] font-black uppercase text-amber-400 tracking-wider mb-0.5">{st.label}</p>
                            <p className="text-[10px] font-medium leading-snug">{st.desc}</p>
                          </TooltipContent>
                        </Tooltip>

                        <div className="mt-3">
                          <p className="text-[9px] font-black uppercase text-slate-700 tracking-tight leading-none">
                            {st.label}
                          </p>
                          <p className="text-[8px] font-bold text-slate-400 mt-1 max-w-[120px] truncate" title={st.desc}>
                            {st.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* CONTROLES DE PAGINACIÓN */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm mt-6">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Página {currentPage} de {totalPages} ({filtered.length} proyectos en total)
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    variant="outline"
                    size="sm"
                    className="text-[10px] font-black uppercase h-8 px-3 border-slate-200"
                  >
                    Anterior
                  </Button>
                  <Button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    variant="outline"
                    size="sm"
                    className="text-[10px] font-black uppercase h-8 px-3 border-slate-200"
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

interface Loader2Props {
  className?: string;
}

function Loader2({ className }: Loader2Props) {
  return (
    <svg
      className={cn("animate-spin text-primary", className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

function SummaryCard({ label, value, icon, color, isCount }: any) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center transition-all hover:shadow-md">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded-lg bg-slate-50 shrink-0">
          {icon}
        </div>
        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{label}</p>
      </div>
      <div>
        <p className={cn("text-lg font-black tracking-tighter pl-1", color)}>
          {isCount ? value : `S/ ${Number(value).toLocaleString("es-PE")}`}
        </p>
      </div>
    </div>
  );
}
