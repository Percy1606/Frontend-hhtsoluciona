"use client";

import { useState } from "react";
import { useOperacionesStore } from "@/store/operaciones-store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Clock,
  Search,
  Briefcase,
  User,
  Plus,
  CheckCircle2,
  Lock,
  Unlock,
  AlertTriangle,
  FileCheck,
  RefreshCw,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, formatDate } from "@/lib/utils";

const areaColors: Record<string, string> = {
  "Logística y Recursos": "bg-blue-500 text-white",
  "Ingeniería y Supervisión Técnica": "bg-green-500 text-white",
  "Gestión Documentaria y Expedientes Técnicos": "bg-orange-500 text-white",
  "Operaciones de Campo y Control de Obra": "bg-purple-500 text-white",
};

const getEventIcon = (campo: string) => {
  const c = campo.toLowerCase();
  if (c.includes("creación") || c.includes("creado")) return <Plus className="w-4 h-4 text-green-600" />;
  if (c.includes("cierre") || c.includes("completad")) return <CheckCircle2 className="w-4 h-4 text-success" />;
  if (c.includes("bloqueado") || c.includes("bloqueo")) return <Lock className="w-4 h-4 text-error" />;
  if (c.includes("desbloque")) return <Unlock className="w-4 h-4 text-warning" />;
  if (c.includes("aprob")) return <FileCheck className="w-4 h-4 text-success" />;
  if (c.includes("rechaz") || c.includes("bloqueada")) return <AlertTriangle className="w-4 h-4 text-error" />;
  return <Clock className="w-4 h-4 text-primary" />;
};

export default function TimelinePage() {
  const { getTimelineEvents, proyectos } = useOperacionesStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProyectoId, setSelectedProyectoId] = useState("all");
  const [selectedTipo, setSelectedTipo] = useState("all");

  const events = getTimelineEvents();

  // Apply filters
  const filteredEvents = events.filter((e) => {
    // Search query matches description/valNuevo/usuario
    const matchesSearch =
      e.campo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.valorNuevo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.usuario.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesProject = selectedProyectoId === "all" || e.entidadId === selectedProyectoId || e.id.includes(selectedProyectoId);
    
    // Check if matching specific event types
    let matchesType = true;
    if (selectedTipo !== "all") {
      const fieldLower = e.campo.toLowerCase();
      if (selectedTipo === "proyectos") {
        matchesType = e.entidadTipo === "proyecto" && (fieldLower.includes("creación") || fieldLower.includes("estado") || fieldLower.includes("cierre"));
      } else if (selectedTipo === "actividades") {
        matchesType = e.entidadTipo === "actividad" || fieldLower.includes("actividad");
      } else if (selectedTipo === "validaciones") {
        matchesType = e.entidadTipo === "validacion" || fieldLower.includes("validación");
      } else if (selectedTipo === "checklist") {
        matchesType = fieldLower.includes("checklist");
      }
    }

    return matchesSearch && matchesProject && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 p-2 rounded-lg">
          <Clock className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-primary tracking-tight">Timeline Operativo</h1>
          <p className="text-muted-foreground mt-1 font-medium">Auditoría y registro cronológico de todas las operaciones.</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl border border-border shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full md:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por campo, usuario o valor..."
            className="pl-10 h-10 border-border"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <Select value={selectedProyectoId} onValueChange={(val) => setSelectedProyectoId(val ?? "")}>
            <SelectTrigger className="w-48 h-10">
              <SelectValue placeholder="Proyecto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los Proyectos</SelectItem>
              {proyectos.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.codigo}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedTipo} onValueChange={(val) => setSelectedTipo(val ?? "")}>
            <SelectTrigger className="w-44 h-10">
              <SelectValue placeholder="Tipo de Evento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los Eventos</SelectItem>
              <SelectItem value="proyectos">Flujo Proyecto</SelectItem>
              <SelectItem value="actividades">Flujo Actividad</SelectItem>
              <SelectItem value="validaciones">Validaciones</SelectItem>
              <SelectItem value="checklist">Checks & Bloqueos</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground" onClick={() => {
            setSearchQuery("");
            setSelectedProyectoId("all");
            setSelectedTipo("all");
          }} title="Resetear Filtros">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Timeline List */}
      <div className="relative border-l-2 border-primary/20 ml-4 md:ml-6 pl-6 space-y-6">
        {filteredEvents.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No hay eventos registrados que coincidan con los filtros.
          </div>
        ) : (
          filteredEvents.map((event) => (
            <div key={event.id} className="relative group">
              {/* Event Icon/Marker */}
              <div className="absolute -left-[35px] top-1 bg-white border-2 border-primary rounded-full p-1.5 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                {getEventIcon(event.campo)}
              </div>

              {/* Event Card */}
              <Card className="hover:border-primary/30 hover:shadow-md transition-all">
                <CardContent className="p-4 space-y-2">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge className="font-black text-[10px] uppercase bg-primary text-white">
                        {event.proyectoCodigo || "GLOBAL"}
                      </Badge>
                      <h4 className="font-black text-sm text-primary tracking-tight">
                        {event.campo}
                      </h4>
                    </div>
                    <span className="text-[10px] font-black text-muted-foreground uppercase flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatDate(event.fecha)}
                    </span>
                  </div>

                  {/* Context project details */}
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide truncate">
                    {event.proyectoNombre} {event.actividadDescripcion && `— Actividad: "${event.actividadDescripcion}"`}
                  </p>

                  {/* Changes detail */}
                  <div className="text-xs bg-muted/30 p-2 rounded border font-medium text-slate-700 space-y-1">
                    {event.valorAnterior && (
                      <p className="line-through text-muted-foreground">
                        Antes: {event.valorAnterior}
                      </p>
                    )}
                    <p>
                      {event.valorAnterior ? "Ahora: " : ""}<strong>{event.valorNuevo}</strong>
                    </p>
                  </div>

                  {/* Motivo auditing detail if any */}
                  {event.motivo && (
                    <div className="text-xs p-2 bg-yellow-50 text-yellow-800 rounded border border-yellow-200">
                      <strong>Motivo/Observación:</strong> {event.motivo}
                    </div>
                  )}

                  {/* User details */}
                  <div className="flex items-center justify-between pt-2 text-[10px] border-t border-dashed mt-2">
                    <span className="flex items-center gap-1 font-bold text-slate-600">
                      <User className="w-3 h-3 text-muted-foreground" /> {event.usuario}
                    </span>
                    <Badge className={cn("text-[9px] font-black uppercase border-none", areaColors[event.area] || "bg-gray-100")}>
                      {event.area}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
