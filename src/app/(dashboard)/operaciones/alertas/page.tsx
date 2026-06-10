"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useOperacionesStore } from "@/store/operaciones-store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Bell,
  Search,
  Check,
  AlertTriangle,
  Clock,
  Unlock,
  Plus,
  RefreshCw,
  Eye,
  AlertCircle,
  Zap,
  Activity,
  History,
  ChevronRight,
  ChevronLeft,
  TrendingDown,
  CheckSquare,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, formatDate } from "@/lib/utils";

const priorityColors: Record<string, string> = {
  "Baja": "border-blue-200 bg-white text-blue-800",
  "Media": "border-yellow-200 bg-white text-yellow-800",
  "Alta": "border-orange-200 bg-white text-orange-800",
  "Crítica": "border-red-200 bg-red-50/30 text-red-800",
};

const badgePriorityColors: Record<string, string> = {
  "Baja": "bg-blue-100 text-blue-700",
  "Media": "bg-yellow-100 text-yellow-700",
  "Alta": "bg-orange-100 text-orange-700",
  "Crítica": "bg-red-600 text-white",
};

const typeIcons: Record<string, any> = {
  "atraso": AlertCircle,
  "vencimiento": Clock,
  "validacion": CheckSquare,
  "stagnation": TrendingDown,
};

const typeLabels: Record<string, string> = {
  "atraso": "Retraso de Inicio",
  "vencimiento": "Vencimiento",
  "validacion": "Cuello de Botella",
  "stagnation": "Estancamiento",
};

export default function AlertasPage() {
  const router = useRouter();
  const { alertas, generarAlertas, marcarAlertaLeida, proyectos } = useOperacionesStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPrioridad, setSelectedPrioridad] = useState("all");
  const [filterLeidas, setFilterLeidas] = useState("sin_leer"); // "sin_leer", "leidas", "todas"
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Automatically trigger alert compilation when mounting or updating
  useEffect(() => {
    generarAlertas();
  }, [proyectos, generarAlertas]);

  const handleResolve = (alerta: any) => {
    // Solo navegamos. La alerta se marcará como resuelta automáticamente 
    // cuando el estado de la actividad cambie a Completada/Validada.
    if (alerta.entidadTipo === 'actividad') {
        router.push(`/operaciones/actividades?edit=${alerta.entidadId}`);
    } else if (alerta.entidadTipo === 'proyecto') {
        router.push('/operaciones/proyectos');
    }
  };

  // Filter alerts
  const filteredAlertas = alertas.filter((a) => {
    const matchesSearch =
      a.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.descripcion.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPrioridad = selectedPrioridad === "all" || a.prioridad === selectedPrioridad;

    let matchesRead = true;
    if (filterLeidas === "sin_leer") matchesRead = !a.leida;
    else if (filterLeidas === "leidas") matchesRead = a.leida;

    return matchesSearch && matchesPrioridad && matchesRead;
  });

  // Sort by priority and date
  const sortedAlertas = [...filteredAlertas].sort((a, b) => {
    const prioMap: any = { 'Crítica': 3, 'Alta': 2, 'Media': 1, 'Baja': 0 };
    if (prioMap[a.prioridad] !== prioMap[b.prioridad]) return prioMap[b.prioridad] - prioMap[a.prioridad];
    return new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime();
  });

  // Pagination logic
  const totalItems = sortedAlertas.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedAlertas = sortedAlertas.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      {/* Header Estilo Monitor */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-red-600 p-3 rounded-2xl shadow-lg shadow-red-200">
            <Zap className="w-7 h-7 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight uppercase">Monitor de Riesgos</h1>
            <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest flex items-center gap-2">
              <Activity className="w-3 h-3 text-red-500" /> Detección Proactiva de Retrasos y Bloqueos
            </p>
          </div>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
            <Button 
                variant={filterLeidas === 'sin_leer' ? "secondary" : "ghost"}
                size="sm"
                onClick={() => { setFilterLeidas('sin_leer'); setCurrentPage(1); }}
                className={cn("h-8 font-bold uppercase text-[9px] tracking-widest rounded-lg px-4", filterLeidas === 'sin_leer' && "shadow-sm")}
            >
                Pendientes ({alertas.filter(a => !a.leida).length})
            </Button>
            <Button 
                variant={filterLeidas === 'leidas' ? "secondary" : "ghost"}
                size="sm"
                onClick={() => { setFilterLeidas('leidas'); setCurrentPage(1); }}
                className={cn("h-8 font-bold uppercase text-[9px] tracking-widest rounded-lg px-4", filterLeidas === 'leidas' && "shadow-sm")}
            >
                Historial
            </Button>
        </div>
      </div>

      {/* Grid de Resumen Crítico */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white border-none shadow-sm overflow-hidden relative group">
          <div className="absolute top-0 left-0 w-1 h-full bg-red-600" />
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Riesgos Críticos</p>
              <p className="text-2xl font-bold text-red-600">{alertas.filter(a => a.prioridad === 'Crítica' && !a.leida).length}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-100 group-hover:scale-110 transition-transform" />
          </CardContent>
        </Card>

        <Card className="bg-white border-none shadow-sm overflow-hidden relative group">
            <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />
            <CardContent className="p-4 flex items-center justify-between">
                <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Atención Requerida</p>
                <p className="text-2xl font-bold text-orange-500">{alertas.filter(a => a.prioridad === 'Alta' && !a.leida).length}</p>
                </div>
                <Clock className="w-8 h-8 text-orange-100 group-hover:scale-110 transition-transform" />
            </CardContent>
        </Card>

        <Card className="bg-white border-none shadow-sm overflow-hidden relative group">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
            <CardContent className="p-4 flex items-center justify-between">
                <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Cuellos de Botella</p>
                <p className="text-2xl font-bold text-primary">{alertas.filter(a => a.tipo === 'validacion' && !a.leida).length}</p>
                </div>
                <TrendingDown className="w-8 h-8 text-primary/10 group-hover:scale-110 transition-transform" />
            </CardContent>
        </Card>
      </div>

      {/* Filtros Compactos */}
      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="relative flex-1 w-full space-y-1">
          <Label className="text-[9px] font-bold uppercase text-primary tracking-widest ml-1">Buscador de Riesgos</Label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <Input
              placeholder="Filtrar por código de proyecto o descripción..."
              className="pl-10 h-10 border-none shadow-sm bg-white font-medium text-xs rounded-xl"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
          </div>
        </div>

        <div className="w-full md:w-48 space-y-1">
            <Label className="text-[9px] font-bold uppercase text-primary tracking-widest ml-1">Gravedad</Label>
            <Select value={selectedPrioridad} onValueChange={(val) => { setSelectedPrioridad(val ?? ""); setCurrentPage(1); }}>
                <SelectTrigger className="w-full h-10 border-none shadow-sm bg-white font-bold uppercase text-[9px] tracking-widest rounded-xl">
                    <SelectValue placeholder="PRIORIDAD" />
                </SelectTrigger>
                <SelectContent className="bg-white border-none shadow-2xl rounded-xl">
                    <SelectItem value="all">Todas las gravedades</SelectItem>
                    <SelectItem value="Crítica">Urgente / Crítica</SelectItem>
                    <SelectItem value="Alta">Riesgo Alto</SelectItem>
                    <SelectItem value="Media">Atención Media</SelectItem>
                </SelectContent>
            </Select>
        </div>
      </div>

      {/* Monitor de Alertas List */}
      <div className="space-y-2">
        {paginatedAlertas.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-200 text-center">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                <Check className="w-8 h-8 text-success" />
            </div>
            <h3 className="text-slate-800 font-bold uppercase text-xs">Todo bajo control</h3>
            <p className="text-slate-400 font-medium text-[11px] mt-1">No se han detectado riesgos operativos en este momento.</p>
          </div>
        ) : (
          paginatedAlertas.map((alerta) => {
            const Icon = typeIcons[alerta.tipo] || AlertTriangle;
            return (
              <Card
                key={alerta.id}
                className={cn(
                  "border-none shadow-sm transition-all hover:translate-x-1 group rounded-xl overflow-hidden",
                  alerta.leida ? "opacity-60" : "bg-white"
                )}
              >
                <CardContent className="p-0 flex items-stretch h-full min-h-[80px]">
                  <div className={cn(
                    "w-1.5 shrink-0",
                    alerta.prioridad === 'Crítica' ? "bg-red-600" : 
                    alerta.prioridad === 'Alta' ? "bg-orange-500" : "bg-primary"
                  )} />
                  
                  <div className="p-4 flex-1 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex gap-4 items-start min-w-0">
                        <div className={cn(
                            "p-2.5 rounded-lg shrink-0 mt-0.5",
                            alerta.prioridad === 'Crítica' ? "bg-red-50 text-red-600" : 
                            alerta.prioridad === 'Alta' ? "bg-orange-50 text-orange-500" : "bg-primary/5 text-primary"
                        )}>
                            <Icon className="w-5 h-5" />
                        </div>
                        
                        <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-2">
                                <Badge className={cn("text-[7px] font-bold uppercase border-none px-1.5 h-3.5", badgePriorityColors[alerta.prioridad])}>
                                    {alerta.prioridad}
                                </Badge>
                                <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">
                                    {typeLabels[alerta.tipo] || 'Alerta'} • {formatDate(alerta.fechaCreacion)}
                                </span>
                            </div>
                            <h4 className="font-bold text-sm text-slate-800 tracking-tight leading-tight group-hover:text-primary transition-colors truncate">
                                {alerta.titulo}
                            </h4>
                            <p className="text-[11px] text-slate-500 font-medium leading-relaxed max-w-2xl line-clamp-1">
                                {alerta.descripcion}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
                      {!alerta.leida ? (
                        <Button
                          size="sm"
                          onClick={() => handleResolve(alerta)}
                          className="h-8 px-4 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-[9px] font-bold uppercase tracking-widest gap-1.5 shadow-md"
                        >
                          Resolver <ChevronRight className="w-3 h-3" />
                        </Button>
                      ) : (
                        <div className="flex items-center gap-1.5 text-success font-bold uppercase text-[9px] tracking-widest bg-success/10 px-3 py-1.5 rounded-lg">
                          <Check className="w-3 h-3" /> Atendido
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* PAGINACIÓN CONTROLES */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white p-3 rounded-xl shadow-sm mt-2">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-2">
                Página {currentPage} de {totalPages} — Total: {totalItems} riesgos
            </p>
            <div className="flex gap-1.5 mr-1">
                <Button 
                    variant="outline" 
                    size="icon" 
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                    className="h-8 w-8 border-none bg-slate-50"
                >
                    <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                        <Button 
                            key={p}
                            variant={currentPage === p ? "default" : "ghost"}
                            size="sm"
                            onClick={() => handlePageChange(p)}
                            className={cn("h-8 w-8 p-0 font-bold rounded-lg", currentPage === p ? "bg-slate-800" : "text-slate-400")}
                        >
                            {p}
                        </Button>
                    ))}
                </div>
                <Button 
                    variant="outline" 
                    size="icon" 
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                    className="h-8 w-8 border-none bg-slate-50"
                >
                    <ChevronRight className="w-4 h-4" />
                </Button>
            </div>
        </div>
      )}
    </div>
  );
}
