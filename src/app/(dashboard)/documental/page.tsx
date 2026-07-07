"use client";

import { useState, useEffect } from "react";
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
  FileCheck,
  FileText,
  Download,
  Eye,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Folder,
  Calendar
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn, formatDate } from "@/lib/utils";
import { StatsCard } from "@/components/ui/stats-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ============================================
// TIPOS
// ============================================

interface Documento {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipo: string;
  subtipo: string;
  numero?: string;
  version: string;
  url: string;
  estado: string;
  subidoPor: string;
  area: string;
  fechaCreacion: string;
  fechaSubida: string;
  fechaAprobacion?: string;
  etiquetas: string[];
  proyectoId?: string;
}

// ============================================
// CONSTANTES
// ============================================

const estadoColors: Record<string, string> = {
  "Borrador": "bg-gray-100 text-gray-700",
  "Pendiente Revisión": "bg-yellow-100 text-yellow-700",
  "Revisado": "bg-blue-100 text-blue-700",
  "Aprobado": "bg-green-100 text-green-700",
  "Obsoleto": "bg-red-100 text-red-700",
};

const tipoColors: Record<string, string> = {
  "Técnico": "bg-purple-100 text-purple-700",
  "Administrativo": "bg-blue-100 text-blue-700",
  "Legal": "bg-red-100 text-red-700",
  "Financiero": "bg-green-100 text-green-700",
  "Otro": "bg-gray-100 text-gray-700",
};

const areaColors: Record<string, string> = {
  "Steven": "text-blue-600",
  "Diego": "text-purple-600",
  "Guillermo": "text-green-600",
  "Mario": "text-yellow-600",
};

// ============================================
// PÁGINA PRINCIPAL
// ============================================

export default function DocumentalPage() {
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [filtros, setFiltros] = useState({
    search: "",
    tipo: "all",
    estado: "all",
    area: "all",
    proyectoId: "all",
  });

  // Cargar datos
  useEffect(() => {
    fetchData();
  }, [filtros]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filtros.search) params.append("search", filtros.search);
      if (filtros.tipo !== "all") params.append("tipo", filtros.tipo);
      if (filtros.estado !== "all") params.append("estado", filtros.estado);
      if (filtros.area !== "all") params.append("area", filtros.area);
      if (filtros.proyectoId !== "all") params.append("proyectoId", filtros.proyectoId);

      const response = await fetch(`/api/documentos?${params}`);
      const data = await response.json();

      setDocumentos(data.documentos || []);
    } catch (error) {
      console.error("Error fetching documentos:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calcular estadísticas
  const stats = {
    total: documentos.length,
    pendientes: documentos.filter(d => d.estado === "Pendiente Revisión").length,
    aprobados: documentos.filter(d => d.estado === "Aprobado").length,
    borradores: documentos.filter(d => d.estado === "Borrador").length,
    porTipo: {
      técnico: documentos.filter(d => d.tipo === "Técnico").length,
      administrativo: documentos.filter(d => d.tipo === "Administrativo").length,
      legal: documentos.filter(d => d.tipo === "Legal").length,
      financiero: documentos.filter(d => d.tipo === "Financiero").length,
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <FileCheck className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-black text-primary tracking-tight">Gestión Documental</h1>
          </div>
          <p className="text-muted-foreground mt-1 font-medium">Control de documentos técnicos, legales y administrativos.</p>
        </div>
        <Button className="w-full md:w-auto mt-2 md:mt-0 gap-2 font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4" /> Subir Documento
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatsCard
          label="Total Documentos"
          value={stats.total}
          icon={<FileText className="w-5 h-5" />}
          color="text-primary"
          bgColor="bg-primary/5"
        />
        <StatsCard
          label="Pendientes"
          value={stats.pendientes}
          icon={<Clock className="w-5 h-5" />}
          color="text-warning"
          bgColor="bg-yellow-50"
        />
        <StatsCard
          label="Aprobados"
          value={stats.aprobados}
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="text-success"
          bgColor="bg-green-50"
        />
        <StatsCard
          label="Borradores"
          value={stats.borradores}
          icon={<FileText className="w-5 h-5" />}
          color="text-gray-600"
          bgColor="bg-gray-50"
        />
        <StatsCard
          label="Técnicos"
          value={stats.porTipo.técnico}
          icon={<FileText className="w-5 h-5" />}
          color="text-purple-600"
          bgColor="bg-purple-50"
        />
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl border border-border shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, código o número..."
              className="pl-10 h-10 border-border"
              value={filtros.search}
              onChange={(e) => setFiltros({ ...filtros, search: e.target.value })}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select
              value={filtros.tipo}
              onValueChange={(val) => setFiltros({ ...filtros, tipo: val || "all" })}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los Tipos</SelectItem>
                <SelectItem value="Técnico">Técnico</SelectItem>
                <SelectItem value="Administrativo">Administrativo</SelectItem>
                <SelectItem value="Legal">Legal</SelectItem>
                <SelectItem value="Financiero">Financiero</SelectItem>
                <SelectItem value="Otro">Otro</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filtros.estado}
              onValueChange={(val) => setFiltros({ ...filtros, estado: val || "all" })}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los Estados</SelectItem>
                <SelectItem value="Borrador">Borrador</SelectItem>
                <SelectItem value="Pendiente Revisión">Pendiente Revisión</SelectItem>
                <SelectItem value="Revisado">Revisado</SelectItem>
                <SelectItem value="Aprobado">Aprobado</SelectItem>
                <SelectItem value="Obsoleto">Obsoleto</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filtros.area}
              onValueChange={(val) => setFiltros({ ...filtros, area: val || "all" })}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Área" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las Áreas</SelectItem>
                <SelectItem value="Steven">Steven</SelectItem>
                <SelectItem value="Diego">Diego</SelectItem>
                <SelectItem value="Guillermo">Guillermo</SelectItem>
                <SelectItem value="Mario">Mario</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* VISTA MÓVIL (Tarjetas) */}
      <div className="block md:hidden space-y-4">
        {loading ? (
            <div className="text-center py-8 flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-[10px] font-black uppercase text-slate-500">Cargando documentos...</span>
            </div>
        ) : documentos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-[10px] font-bold uppercase">No se encontraron documentos</div>
        ) : (
            documentos.map((doc) => (
                <div key={doc.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-3 relative">
                    <div className="absolute top-4 right-4 flex items-center gap-1 bg-white/80 rounded-lg p-1 backdrop-blur-sm z-10">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:bg-primary/10 rounded-full"><Eye className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:bg-primary/10 rounded-full"><Download className="w-4 h-4" /></Button>
                    </div>

                    <div className="pr-16 flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <span className="font-black text-xs text-primary">{doc.codigo}</span>
                            <Badge className={cn("text-[8px] font-black uppercase px-2 py-0 h-4 border-none shadow-none", tipoColors[doc.tipo])}>{doc.tipo}</Badge>
                        </div>
                        <span className="font-black text-sm text-primary uppercase leading-tight mt-1">{doc.nombre}</span>
                        {doc.numero && <span className="text-[10px] text-muted-foreground font-bold uppercase">Ref: {doc.numero}</span>}
                        <div className="flex flex-wrap gap-1 mt-1">
                            {doc.etiquetas?.slice(0, 2).map((et, idx) => (
                                <span key={idx} className="text-[9px] bg-muted px-1.5 py-0.5 rounded text-slate-500 font-bold">{et}</span>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-1 pt-2 border-t border-slate-50">
                        <div className="flex flex-col gap-1">
                            <span className="text-[9px] font-black uppercase text-slate-500">Área / Subtipo</span>
                            <span className={cn("font-bold text-[10px] uppercase", areaColors[doc.area])}>{doc.area}</span>
                            <span className="text-[9px] text-muted-foreground uppercase">{doc.subtipo}</span>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <span className="text-[10px] font-bold text-slate-600">v{doc.version}</span>
                            <Badge className={cn("border-none font-black text-[8px] uppercase tracking-wider px-2 h-4", estadoColors[doc.estado])}>{doc.estado}</Badge>
                            <span className="text-[8px] font-bold uppercase text-slate-400 mt-1"><Calendar className="w-2.5 h-2.5 inline"/> {formatDate(doc.fechaSubida)}</span>
                        </div>
                    </div>
                </div>
            ))
        )}
      </div>

      {/* VISTA PC */}
      <div className="hidden md:block rounded-xl border border-border bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-bold text-primary">CÓDIGO</TableHead>
              <TableHead className="font-bold text-primary">DOCUMENTO</TableHead>
              <TableHead className="font-bold text-primary">TIPO</TableHead>
              <TableHead className="font-bold text-primary">ÁREA</TableHead>
              <TableHead className="font-bold text-primary">VERSION</TableHead>
              <TableHead className="font-bold text-primary">FECHA</TableHead>
              <TableHead className="font-bold text-primary">ESTADO</TableHead>
              <TableHead className="font-bold text-primary text-right">ACCIONES</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span>Cargando documentos...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : documentos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No se encontraron documentos
                </TableCell>
              </TableRow>
            ) : (
              documentos.map((doc) => (
                <TableRow key={doc.id} className="hover:bg-muted/10 transition-colors group">
                  <TableCell className="font-black text-xs text-primary">
                    {doc.codigo}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-bold text-sm text-primary group-hover:text-secondary transition-colors">
                        {doc.nombre}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {doc.numero && (
                          <span className="text-[10px] text-muted-foreground">
                            Ref: {doc.numero}
                          </span>
                        )}
                        {doc.etiquetas?.slice(0, 2).map((et, idx) => (
                          <span key={idx} className="text-[9px] bg-muted px-1.5 py-0.5 rounded">
                            {et}
                          </span>
                        ))}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <Badge className={cn("text-[10px] font-bold uppercase", tipoColors[doc.tipo])}>
                        {doc.tipo}
                      </Badge>
                      <p className="text-[9px] text-muted-foreground mt-0.5">{doc.subtipo}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={cn("font-bold text-sm", areaColors[doc.area])}>
                      {doc.area}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm font-bold text-slate-600">
                    v{doc.version}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-[10px]">
                      <span className="text-muted-foreground">Subido: {formatDate(doc.fechaSubida)}</span>
                      {doc.fechaAprobacion && (
                        <span className="text-success">Aprobado: {formatDate(doc.fechaAprobacion)}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("border-none font-black text-[9px] uppercase tracking-wider", estadoColors[doc.estado])}>
                      {doc.estado}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 font-bold text-[10px] uppercase gap-1 border-primary text-primary hover:bg-primary hover:text-white"
                      >
                        <Eye className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 font-bold text-[10px] uppercase gap-1 border-primary text-primary hover:bg-primary hover:text-white"
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ============================================
// COMPONENTES AUXILIARES
// ============================================