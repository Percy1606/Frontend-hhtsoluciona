"use client";

import { useEffect, useState } from "react";
import { useOperacionesStore } from "@/store/operaciones-store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  "Baja": "border-blue-300 bg-blue-50 text-blue-800",
  "Media": "border-yellow-300 bg-yellow-50 text-yellow-800",
  "Alta": "border-orange-300 bg-orange-50 text-orange-800",
  "Crítica": "border-red-300 bg-red-50 text-red-800",
};

const badgePriorityColors: Record<string, string> = {
  "Baja": "bg-blue-100 text-blue-700",
  "Media": "bg-yellow-100 text-yellow-700",
  "Alta": "bg-orange-100 text-orange-700",
  "Crítica": "bg-red-100 text-red-700",
};

const areaColors: Record<string, string> = {
  "Logística y Recursos": "bg-blue-500 text-white",
  "Ingeniería y Supervisión Técnica": "bg-green-500 text-white",
  "Gestión Documentaria y Expedientes Técnicos": "bg-orange-500 text-white",
  "Operaciones de Campo y Control de Obra": "bg-purple-500 text-white",
};

export default function AlertasPage() {
  const { alertas, generarAlertas, marcarAlertaLeida, proyectos } = useOperacionesStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPrioridad, setSelectedPrioridad] = useState("all");
  const [selectedArea, setSelectedArea] = useState("all");
  const [filterLeidas, setFilterLeidas] = useState("sin_leer"); // "sin_leer", "leidas", "todas"

  // Automatically trigger alert compilation when mounting or updating
  useEffect(() => {
    generarAlertas();
  }, [proyectos, generarAlertas]);

  // Filter alerts
  const filteredAlertas = alertas.filter((a) => {
    const matchesSearch =
      a.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.descripcion.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPrioridad = selectedPrioridad === "all" || a.prioridad === selectedPrioridad;
    const matchesArea = selectedArea === "all" || a.area === selectedArea;

    let matchesRead = true;
    if (filterLeidas === "sin_leer") matchesRead = !a.leida;
    else if (filterLeidas === "leidas") matchesRead = a.leida;

    return matchesSearch && matchesPrioridad && matchesArea && matchesRead;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 p-2 rounded-lg">
          <Bell className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-primary tracking-tight">Alertas del Sistema</h1>
          <p className="text-muted-foreground mt-1 font-medium">Notificaciones automáticas de retrasos, vencimientos y firmas pendientes.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-xl border border-border shadow-sm">
          <p className="text-xs font-black text-muted-foreground uppercase">Alertas Totales Generadas</p>
          <p className="text-3xl font-black text-primary">{alertas.length}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-border shadow-sm">
          <p className="text-xs font-black text-muted-foreground uppercase">Alertas sin Resolver</p>
          <p className="text-3xl font-black text-error">
            {alertas.filter((a) => !a.leida).length}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl border border-border shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full md:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar en el contenido de las alertas..."
            className="pl-10 h-10 border-border"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <Select value={selectedPrioridad} onValueChange={(val) => setSelectedPrioridad(val ?? "")}>
            <SelectTrigger className="w-36 h-10">
              <SelectValue placeholder="Prioridad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="Baja">Baja</SelectItem>
              <SelectItem value="Media">Media</SelectItem>
              <SelectItem value="Alta">Alta</SelectItem>
              <SelectItem value="Crítica">Crítica</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedArea} onValueChange={(val) => setSelectedArea(val ?? "")}>
            <SelectTrigger className="w-40 h-10">
              <SelectValue placeholder="Área" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las Áreas</SelectItem>
              <SelectItem value="Logística y Recursos">Logística y Recursos</SelectItem>
              <SelectItem value="Ingeniería y Supervisión Técnica">Ingeniería y Supervisión Técnica</SelectItem>
              <SelectItem value="Gestión Documentaria y Expedientes Técnicos">Gestión Documentaria</SelectItem>
              <SelectItem value="Operaciones de Campo y Control de Obra">Operaciones de Campo</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterLeidas} onValueChange={(val) => setFilterLeidas(val ?? "")}>
            <SelectTrigger className="w-40 h-10">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sin_leer">Sin resolver</SelectItem>
              <SelectItem value="leidas">Resueltas/Leídas</SelectItem>
              <SelectItem value="todas">Todas</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground" onClick={() => {
            setSearchQuery("");
            setSelectedPrioridad("all");
            setSelectedArea("all");
            setFilterLeidas("sin_leer");
          }} title="Resetear Filtros">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Alertas List */}
      <div className="space-y-3">
        {filteredAlertas.length === 0 ? (
          <div className="bg-white p-8 border rounded-xl text-center text-muted-foreground">
            No hay alertas que coincidan con los filtros aplicados.
          </div>
        ) : (
          filteredAlertas.map((alerta) => (
            <Card
              key={alerta.id}
              className={cn(
                "border-l-4 transition-shadow hover:shadow",
                priorityColors[alerta.prioridad] || "border-gray-200 bg-gray-50"
              )}
            >
              <CardContent className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={cn("text-[9px] font-black uppercase border-none", badgePriorityColors[alerta.prioridad])}>
                      {alerta.prioridad}
                    </Badge>
                    <Badge className={cn("text-[9px] font-black uppercase border-none", areaColors[alerta.area])}>
                      Área: {alerta.area}
                    </Badge>
                    <span className="text-[10px] font-black text-muted-foreground uppercase flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Creada: {formatDate(alerta.fechaCreacion)}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm tracking-tight leading-snug">
                    {alerta.titulo}
                  </h4>
                  <p className="text-xs text-slate-600 leading-normal">
                    {alerta.descripcion}
                  </p>
                </div>

                <div className="flex gap-2 shrink-0 w-full md:w-auto justify-end">
                  {!alerta.leida ? (
                    <Button
                      size="sm"
                      className="bg-primary hover:bg-primary/90 text-white text-xs font-bold gap-1"
                      onClick={() => marcarAlertaLeida(alerta.id)}
                    >
                      <Check className="w-3 h-3" /> Resolver
                    </Button>
                  ) : (
                    <span className="text-xs font-bold text-success flex items-center gap-1">
                      <Check className="w-4 h-4" /> Resuelta
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
