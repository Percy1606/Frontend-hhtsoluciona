"use client";

import { useState, useEffect } from "react";
import { useOperacionesStore } from "@/store/operaciones-store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  Clock, 
  User, 
  Briefcase, 
  Activity, 
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  FilterX
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function TimelinePage() {
  const { 
    proyectos, 
    timelineEvents,
    totalTimeline,
    timelinePage,
    timelineTotalPages,
    fetchTimeline,
    fetchProyectos,
    loading 
  } = useOperacionesStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProyectoId, setSelectedProyectoId] = useState("all");
  const [selectedTipo, setSelectedTipo] = useState("all");

  // Cargar datos iniciales
  useEffect(() => {
    fetchProyectos();
    fetchTimeline(1, 20);
  }, []);

  // Función para recargar con filtros
  const handleFetch = (page = 1) => {
    fetchTimeline(page, 20, {
      search: searchQuery,
      proyectoId: selectedProyectoId,
      tipo: selectedTipo
    });
  };

  // Debounce para búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      handleFetch(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedProyectoId, selectedTipo]);

  const getEventIcon = (campo: string) => {
    if (campo.includes("PROYECTO")) return <Briefcase className="w-4 h-4" />;
    if (campo.includes("ACTIVIDAD")) return <Activity className="w-4 h-4" />;
    if (campo.includes("VALIDACION")) return <CheckCircle2 className="w-4 h-4" />;
    return <Clock className="w-4 h-4" />;
  };

  const getEventColor = (campo: string) => {
    if (campo.includes("PROYECTO")) return "bg-blue-500";
    if (campo.includes("ACTIVIDAD")) return "bg-emerald-500";
    if (campo.includes("VALIDACION")) return "bg-amber-500";
    return "bg-slate-500";
  };

  const formatFecha = (fechaStr: string) => {
    try {
      const fecha = new Date(fechaStr);
      return {
        dia: format(fecha, "dd MMM", { locale: es }),
        hora: format(fecha, "HH:mm:ss", { locale: es }),
        full: format(fecha, "PPPP", { locale: es })
      };
    } catch (e) {
      return { dia: "---", hora: "--:--", full: "Fecha inválida" };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-xl font-black text-primary tracking-tight uppercase">Timeline Operativo</h1>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 font-bold uppercase tracking-wide">Registro cronológico de auditoría y operaciones de campo.</p>
        </div>

        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-lg"
            onClick={() => handleFetch(timelinePage - 1)}
            disabled={timelinePage <= 1 || loading}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="px-3 py-1 bg-slate-50 rounded-lg border border-slate-100 min-w-[80px] text-center">
            <span className="text-[10px] font-black text-primary uppercase">PAG {timelinePage} / {timelineTotalPages || 1}</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-lg"
            onClick={() => handleFetch(timelinePage + 1)}
            disabled={timelinePage >= timelineTotalPages || loading}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-center gap-6">
        <div className="relative flex-1 w-full max-w-sm">
          <span className="text-[9px] font-black uppercase text-primary tracking-widest ml-1 mb-1 block">Buscador de Auditoría</span>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Buscar por campo, usuario o valor..." 
              className="pl-10 h-10 border-slate-200 bg-slate-50/30 focus:bg-white transition-all shadow-none font-bold text-[12px] rounded-xl" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          <div className="flex flex-col gap-2 min-w-[200px]">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Filtrar por Proyecto</span>
            <Select value={selectedProyectoId} onValueChange={(val) => setSelectedProyectoId(val ?? "all")}>
              <SelectTrigger className="h-14 border-slate-200 bg-white text-base font-medium shadow-none rounded-xl">
                <SelectValue placeholder="Proyecto">
                  {selectedProyectoId !== "all" ? 
                    <span className="text-sm font-medium uppercase">{proyectos.find(p => p.id === selectedProyectoId)?.codigo}</span> : 
                    <span className="text-[11px] text-slate-400 uppercase tracking-tighter italic">TODOS LOS PROYECTOS</span>
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200">
                <SelectItem value="all" className="text-[11px] text-slate-400 uppercase tracking-tighter italic">TODOS LOS PROYECTOS</SelectItem>
                {proyectos.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="uppercase text-sm font-medium">{p.codigo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2 min-w-[200px]">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Tipo de Evento</span>
            <Select value={selectedTipo} onValueChange={(val) => setSelectedTipo(val ?? "all")}>
              <SelectTrigger className="h-14 border-slate-200 bg-white text-base font-medium shadow-none rounded-xl">
                <SelectValue placeholder="Tipo de Evento">
                  {selectedTipo !== "all" ? 
                    <span className="text-sm font-medium uppercase">{selectedTipo}</span> : 
                    <span className="text-[11px] text-slate-400 uppercase tracking-tighter italic">TODOS LOS EVENTOS</span>
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200">
                <SelectItem value="all" className="text-[11px] text-slate-400 uppercase tracking-tighter italic">TODOS LOS EVENTOS</SelectItem>
                <SelectItem value="proyectos" className="uppercase text-sm font-medium">Flujo Proyecto</SelectItem>
                <SelectItem value="actividades" className="uppercase text-sm font-medium">Flujo Actividad</SelectItem>
                <SelectItem value="validaciones" className="uppercase text-sm font-medium">Validaciones</SelectItem>
                <SelectItem value="checklist" className="uppercase text-sm font-medium">Checks & Bloqueos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end self-end h-14">
            <Button 
              variant="ghost" 
              onClick={() => {
                setSearchQuery("");
                setSelectedProyectoId("all");
                setSelectedTipo("all");
              }} 
              className="h-14 w-14 text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-100 hover:border-red-200 transition-all rounded-xl shadow-none"
              title="Limpiar filtros"
            >
              <FilterX className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>

      {/* Lista de Eventos */}
      <div className="relative">
        <div className="absolute left-12 top-0 bottom-0 w-px bg-slate-200 hidden md:block" />
        
        {loading && timelineEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
            <RefreshCw className="w-12 h-12 text-primary animate-spin mb-4" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Cargando bitácora de operaciones...</p>
          </div>
        ) : timelineEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
            <AlertCircle className="w-12 h-12 text-slate-300 mb-4" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No se encontraron eventos para los filtros seleccionados.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {timelineEvents.map((event) => {
              const timeData = formatFecha(event.fecha);
              return (
                <div key={event.id} className="relative flex flex-col md:flex-row gap-6 group">
                  {/* Marcador de tiempo (Desktop) */}
                  <div className="hidden md:flex flex-col items-end w-24 pt-2 shrink-0">
                    <span className="text-[11px] font-black text-primary uppercase">{timeData.dia}</span>
                    <span className="text-[10px] font-bold text-slate-400">{timeData.hora}</span>
                  </div>

                  {/* Icono de estado */}
                  <div className={cn(
                    "absolute left-[41px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-4 border-white z-10 hidden md:block shadow-sm transition-transform group-hover:scale-125",
                    getEventColor(event.campo)
                  )} />

                  {/* Tarjeta de evento */}
                  <Card className="flex-1 overflow-hidden hover:shadow-md transition-all border-slate-200 bg-white rounded-2xl group-hover:border-primary/20">
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="text-[9px] font-black border-slate-200 text-slate-500 bg-slate-50 uppercase tracking-tighter py-0">
                              {event.proyectoCodigo || "HHT"}
                            </Badge>
                            <Badge className={cn("text-[9px] font-black uppercase tracking-tighter py-0", getEventColor(event.campo))}>
                              {event.campo.replace("_", " ")}
                            </Badge>
                            <span className="md:hidden text-[10px] font-bold text-slate-400 ml-auto">
                              {timeData.dia} - {timeData.hora}
                            </span>
                          </div>
                          
                          <h3 className="text-sm font-bold text-slate-700 leading-tight">
                            {event.proyectoNombre}
                            {event.actividadDescripcion && (
                              <span className="text-slate-400 font-medium italic ml-2">
                                — {event.actividadDescripcion}
                              </span>
                            )}
                          </h3>

                          <div className="flex flex-col gap-1.5 mt-2">
                            {/* Comparación de Valores o Descripción del Cambio */}
                            <div className="flex items-center gap-2 text-xs py-1.5 px-3 bg-slate-50 rounded-lg w-fit">
                              {event.campo === "ACTIVIDAD_CREADA" || event.campo === "PROYECTO_CREADO" ? (
                                <div className="flex items-center gap-2 text-primary">
                                  <User className="w-3 h-3" />
                                  <span className="font-bold italic uppercase">Asignado a: {event.responsableNombre || "---"}</span>
                                </div>
                              ) : (
                                <>
                                  <span className={cn(
                                    "text-slate-400 truncate max-w-[150px]",
                                    event.valorAnterior && "line-through"
                                  )}>
                                    {event.valorAnterior || "---"}
                                  </span>
                                  <ChevronRight className="w-3 h-3 text-primary shrink-0" />
                                  <span className="font-black text-primary truncate max-w-[200px]">{event.valorNuevo}</span>
                                </>
                              )}
                            </div>

                            {/* Encargado de la actividad (Solo mostrar si no es un evento de creación para evitar duplicidad) */}
                            {event.responsableNombre && event.campo !== "ACTIVIDAD_CREADA" && event.campo !== "PROYECTO_CREADO" && (
                              <div className="flex items-center gap-1.5 ml-1">
                                <Badge variant="outline" className="text-[9px] font-bold border-emerald-100 text-emerald-600 bg-emerald-50/50 py-0 px-1.5 uppercase">
                                  ENCARGADO: {event.responsableNombre}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-xl">
                            <User className="w-3.5 h-3.5 text-slate-500" />
                            <span className="text-[11px] font-black text-slate-600 uppercase">{event.usuario}</span>
                          </div>
                          <Badge variant="ghost" className="text-[9px] font-bold text-slate-400 uppercase tracking-widest p-0">
                            {event.area}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Paginación */}
      {timelineTotalPages > 1 && (
        <div className="flex justify-center pt-8">
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            <Button 
              variant="ghost" 
              className="h-9 px-4 rounded-lg font-bold text-xs uppercase text-slate-500 hover:text-primary"
              onClick={() => handleFetch(timelinePage - 1)}
              disabled={timelinePage <= 1 || loading}
            >
              Anterior
            </Button>
            
            {Array.from({ length: Math.min(5, timelineTotalPages) }, (_, i) => {
              let pageNum = i + 1;
              if (timelinePage > 3) pageNum = timelinePage - 2 + i;
              if (pageNum > timelineTotalPages) return null;
              if (pageNum <= 0) return null;

              return (
                <Button
                  key={pageNum}
                  variant={timelinePage === pageNum ? "default" : "ghost"}
                  size="icon"
                  className={cn(
                    "h-9 w-9 rounded-lg font-bold text-xs",
                    timelinePage === pageNum ? "shadow-md" : "text-slate-400"
                  )}
                  onClick={() => handleFetch(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}

            <Button 
              variant="ghost" 
              className="h-9 px-4 rounded-lg font-bold text-xs uppercase text-slate-500 hover:text-primary"
              onClick={() => handleFetch(timelinePage + 1)}
              disabled={timelinePage >= timelineTotalPages || loading}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}