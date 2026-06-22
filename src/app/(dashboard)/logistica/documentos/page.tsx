"use client";

import { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Download,
  FileText,
  FolderKanban,
  FolderOpen,
  Loader2,
  Search,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Clock,
} from "lucide-react";
import { formatDate, getSecureUrl, cn } from "@/lib/utils";

const tipoLabel: Record<string, string> = {
  Tecnica: "Técnico",
  Administrativa: "Administrativo",
  Legal: "Legal",
  Financiero: "Financiero",
  Otro: "Otro",
};

const estadoLabel: Record<string, string> = {
  Planificacion: "Planificación",
  EnEjecucion: "En Ejecución",
  Detenido: "Detenido",
  Finalizado: "Finalizado",
};

const areaLabel: Record<string, string> = {
  LogisticaYRecursos: "Logística y Recursos",
  IngenieriaYSupervision: "Ingeniería y Supervisión Técnica",
  GestionDocumentaria: "Gestión Documentaria",
  OperacionesDeCampo: "Operaciones de Campo",
};

const semaforoColor: Record<string, string> = {
  Verde: "bg-emerald-500",
  Amarillo: "bg-amber-400",
  Rojo: "bg-red-500",
};

const estadoBadge: Record<string, string> = {
  Planificacion: "bg-blue-50 text-blue-700 border-blue-200",
  EnEjecucion: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Detenido: "bg-red-50 text-red-700 border-red-200",
  Finalizado: "bg-slate-50 text-slate-600 border-slate-200",
};

export default function DocumentacionLogisticaPage() {
  const [proyectos, setProyectos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchProyectosConDocumentos();
  }, []);

  const fetchProyectosConDocumentos = async () => {
    setLoading(true);
    try {
      const response = await api.get("/operaciones/proyectos?limit=200");
      const lista = response.data || response;
      if (Array.isArray(lista)) {
        setProyectos(lista.filter((p: any) => p.documentos?.length > 0));
      } else {
        setProyectos([]);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      setProyectos([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleProject = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const q = search.toLowerCase().trim();

  const proyectosFiltrados = useMemo(() => {
    if (!q) return proyectos;
    return proyectos.filter((p) => {
      if (p.nombre?.toLowerCase().includes(q)) return true;
      if (p.codigo?.toLowerCase().includes(q)) return true;
      return p.documentos?.some((d: any) => d.nombre?.toLowerCase().includes(q));
    });
  }, [proyectos, q]);

  const totalDocs = useMemo(
    () => proyectosFiltrados.reduce((sum, p) => sum + p.documentos.length, 0),
    [proyectosFiltrados]
  );

  return (
    <div className="p-6 space-y-6">
      {/* ── HEADER ── */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-800">
              Documentación Logística
            </h1>
            {!loading && (
              <p className="text-sm text-slate-400 mt-1.5 font-medium">
                {proyectos.length} proyecto{proyectos.length !== 1 ? "s" : ""}{" "}
                <span className="text-slate-300 mx-1.5">&middot;</span>{" "}
                {totalDocs} documento{totalDocs !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          <Button
            onClick={fetchProyectosConDocumentos}
            variant="outline"
            size="sm"
            className="text-[11px] font-bold uppercase gap-2 h-9 border-slate-200"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Actualizar
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Buscar por proyecto, código o nombre de documento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 pl-10 text-sm border-slate-200 bg-white rounded-2xl shadow-sm focus-visible:ring-2 focus-visible:ring-primary/20 w-full"
          />
        </div>
      </div>

      {/* ── CONTENT ── */}
      {loading ? (
        <div className="py-24 flex justify-center">
          <Loader2 className="animate-spin w-7 h-7 text-primary/40" />
        </div>
      ) : proyectosFiltrados.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <FolderOpen className="w-14 h-14 text-slate-200 mx-auto mb-4" />
          <p className="text-sm font-bold text-slate-400">
            {q
              ? "No se encontraron documentos con ese filtro"
              : "No hay documentos vinculados a proyectos"}
          </p>
          {q && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearch("")}
              className="mt-4 text-[11px] font-bold uppercase text-primary"
            >
              Limpiar búsqueda
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {proyectosFiltrados.map((proyecto) => {
            const isOpen = expanded.has(proyecto.id);
            const semaforo = (semaforoColor[proyecto.semaforo] || "bg-slate-300");
            const estadoNombre = estadoLabel[proyecto.estado] || proyecto.estado;
            const areaNombre = areaLabel[proyecto.area] || proyecto.area || "—";
            const ultimaActualizacion =
              proyecto.fechaActualizacion || proyecto.fechaCreacion;

            return (
              <div
                key={proyecto.id}
                className={cn(
                  "bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-200",
                  "hover:shadow-lg hover:border-slate-300",
                  isOpen && "row-span-2"
                )}
              >
                {/* ══════════════════════════════════════════════════════
                    PROJECT CARD HEADER
                    ══════════════════════════════════════════════════════ */}
                <button
                  type="button"
                  onClick={() => toggleProject(proyecto.id)}
                  className="w-full text-left transition-colors duration-150"
                >
                  <div className="p-4">
                    {/* ── TOP ROW: ICON + INFO + CHEVRON ── */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200",
                            isOpen
                              ? "bg-primary shadow-md shadow-primary/20"
                              : "bg-primary/5"
                          )}
                        >
                          <FolderKanban
                            className={cn(
                              "w-5 h-5 transition-colors duration-200",
                              isOpen ? "text-white" : "text-primary"
                            )}
                          />
                        </div>
                        <div className="min-w-0">
                          <h2 className="text-sm font-black uppercase tracking-tight text-slate-800 truncate max-w-[180px]">
                            {proyecto.nombre}
                          </h2>
                          <p className="text-[10px] font-semibold text-slate-400 mt-0.5 font-mono">
                            {proyecto.codigo}
                          </p>
                        </div>
                      </div>
                      <div
                        className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200",
                          isOpen
                            ? "bg-primary/10 text-primary"
                            : "text-slate-300"
                        )}
                      >
                        {isOpen ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                      </div>
                    </div>

                    {/* ── BADGES ROW ── */}
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <span className={cn("w-2 h-2 rounded-full shrink-0", semaforo)} />
                      <span
                        className={cn(
                          "text-[9px] font-bold px-2 py-0.5 rounded-full border",
                          estadoBadge[proyecto.estado] ||
                            "bg-slate-50 text-slate-600 border-slate-200"
                        )}
                      >
                        {estadoNombre}
                      </span>
                      <span className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-full px-2 py-0.5">
                        <FileText className="w-3 h-3 text-slate-400" />
                        <span className="text-[9px] font-bold text-slate-600">
                          {proyecto.documentos.length}
                        </span>
                      </span>
                    </div>

                    {/* ── BOTTOM ROW: AREA + LAST UPDATE ── */}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-[9px] font-semibold text-slate-400 bg-slate-50 border border-slate-200 rounded-full px-2 py-0.5 truncate max-w-[140px]">
                        {areaNombre}
                      </span>
                      <span className="text-[9px] text-slate-400 flex items-center gap-1 font-medium">
                        <Clock className="w-2.5 h-2.5" />
                        {ultimaActualizacion
                          ? formatDate(ultimaActualizacion)
                          : "—"}
                      </span>
                    </div>
                  </div>
                </button>

                {/* ── COLLAPSIBLE DOCUMENTS TABLE ── */}
                <div
                  className={cn(
                    "transition-all duration-300 ease-in-out overflow-hidden",
                    isOpen
                      ? "max-h-[9999px] opacity-100"
                      : "max-h-0 opacity-0"
                  )}
                >
                  <div className="border-t border-slate-100">
                    {proyecto.documentos.length === 0 ? (
                      <div className="text-center py-6">
                        <FileText className="w-6 h-6 text-slate-200 mx-auto mb-1" />
                        <p className="text-[10px] font-bold text-slate-400">
                          Sin documentos
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-50">
                        {proyecto.documentos.map((doc: any) => (
                          <div
                            key={doc.id}
                            className="flex items-center gap-2 px-4 py-2.5 hover:bg-slate-50/50 transition-colors"
                          >
                            <div className="w-6 h-6 rounded-md bg-red-50 flex items-center justify-center shrink-0">
                              <FileText className="w-3 h-3 text-red-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-semibold text-slate-700 truncate">
                                {doc.nombre}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[8px] font-bold text-slate-400 uppercase">
                                  {tipoLabel[doc.tipo] || doc.tipo}
                                </span>
                                <span className="text-[8px] text-slate-300">&middot;</span>
                                <span className="text-[8px] text-slate-400">
                                  {formatDate(doc.fechaSubida)}
                                </span>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-primary hover:bg-primary/5 shrink-0"
                              onClick={() =>
                                window.open(getSecureUrl(doc.url), "_blank")
                              }
                              title="Ver documento"
                            >
                              <Download className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
