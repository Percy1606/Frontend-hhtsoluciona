"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ProyectoPendienteLogistica {
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
    alcance: any;
    entregables: string;
    ordenesDeServicio: { id: string; codigo: string; estado: string }[];
  };
  adelantos: { monto: number; saldoDisponible: number }[];
}

export default function BandejaLogistica() {
  const [proyectos, setProyectos] = useState<ProyectoPendienteLogistica[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Pagination States
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchProyectos = async () => {
    try {
      const data = await api.get("/logistica/bandeja-proyectos");
      setProyectos(data);
    } catch (error) {
      toast.error("No se pudo cargar la bandeja de logística.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProyectos();
  }, []);

  const handleUpdateEstado = async (id: string, nuevoEstado: string | null) => {
    try {
      await api.patch(`/logistica/bandeja-proyectos/${id}`, { estadoLogistica: nuevoEstado });
      toast.success("Estado de logística actualizado.");
      fetchProyectos();
    } catch (error) {
      toast.error("No se pudo actualizar el estado.");
    }
  };

  if (loading) return <div>Cargando...</div>;

  if (proyectos.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-lg border">
        <p className="text-gray-500">No hay proyectos pendientes de revisión logística (con compras autorizadas).</p>
      </div>
    );
  }

  // Filter & Pagination logic
  const filteredProyectos = proyectos.filter((p) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      p.codigo.toLowerCase().includes(searchLower) ||
      p.nombre.toLowerCase().includes(searchLower) ||
      p.cliente.empresa.toLowerCase().includes(searchLower)
    );
  });

  const totalPages = Math.ceil(filteredProyectos.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProyectos = filteredProyectos.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="p-4 border-b border-slate-200">
        <input
          type="text"
          placeholder="Buscar por código, proyecto o cliente..."
          className="w-full md:w-1/3 text-sm p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1); // Reset page on search
          }}
        />
      </div>
      <Table className="min-w-full border-separate border-spacing-0">
        <TableHeader className="bg-slate-50">
          <TableRow className="border-b border-border/80">
            <TableHead className="w-[30px] font-black text-primary text-[9px] uppercase text-center p-2">N°</TableHead>
            <TableHead className="font-black text-primary text-[9px] uppercase p-2">Proyecto</TableHead>
            <TableHead className="font-black text-primary text-[9px] uppercase p-2">Cliente</TableHead>
            <TableHead className="font-black text-primary text-[9px] uppercase p-2">OS / Financiero</TableHead>
            <TableHead className="font-black text-primary text-[9px] uppercase p-2">Ppto. Egresos</TableHead>
            <TableHead className="font-black text-primary text-[9px] uppercase p-2">Estado Logística</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedProyectos.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-32 text-center text-slate-400 font-bold italic text-xs">
                No hay proyectos que coincidan con la búsqueda.
              </TableCell>
            </TableRow>
          ) : (
            paginatedProyectos.map((p, index) => {
              const saldoDisponible = Number(p.costoPresupuestado) || 0;
              
              return (
                <TableRow key={p.id} className="hover:bg-primary/5 transition-colors group">
                  <TableCell className="text-center font-bold text-[10px] text-slate-400 border-b border-slate-300 border-dashed p-2">
                    {startIndex + index + 1}
                  </TableCell>
                  <TableCell className="border-b border-slate-300 border-dashed p-2">
                    <div className="font-black text-[11px] text-primary uppercase leading-tight">{p.codigo}</div>
                    <div className="text-[9px] font-bold text-slate-500 mt-0.5 max-w-[200px] uppercase truncate" title={p.nombre}>
                      {p.nombre?.replace(/^proyecto:\s*/i, '')}
                    </div>
                    <div className="text-[8px] font-black text-slate-400 mt-1 uppercase">
                      Creado: {format(new Date(p.fechaCreacion), "dd MMM yyyy", { locale: es })}
                    </div>
                  </TableCell>
                  <TableCell className="border-b border-slate-300 border-dashed p-2">
                    <div className="text-[11px] font-black text-slate-700 uppercase leading-tight">{p.cliente.empresa}</div>
                    <div className="text-[9px] font-bold text-slate-400 mt-0.5">Cotización: {p.cotizacionOrigen?.codigo}</div>
                  </TableCell>
                  <TableCell className="border-b border-slate-300 border-dashed p-2">
                    <div className="flex flex-col gap-1">
                      {p.cotizacionOrigen?.ordenesDeServicio?.map(os => (
                        <Badge key={os.id} variant="outline" className="w-fit text-[8px] font-black uppercase px-1 py-0 h-4 border-slate-200 bg-slate-50/50">
                          {os.codigo}
                        </Badge>
                      ))}
                      <div className="flex items-center gap-1 mt-1 text-[9px] text-green-600 font-black uppercase">
                        <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" /> Compras Autorizadas
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="border-b border-slate-300 border-dashed p-2">
                    <div className="text-[11px] font-black text-slate-700 font-mono">
                      S/ {saldoDisponible.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                    </div>
                  </TableCell>
                  <TableCell className="border-b border-slate-300 border-dashed p-2">
                    <Select
                      value={p.estadoLogistica || ""}
                      onValueChange={(val) => handleUpdateEstado(p.id, val)}
                    >
                      <SelectTrigger className={cn(
                        "h-8 text-[9px] font-black uppercase rounded-lg shadow-sm border-slate-200 w-[145px]",
                        (!p.estadoLogistica || p.estadoLogistica === 'PendienteRevision') ? 'text-amber-600 bg-amber-50 border-amber-100' :
                        p.estadoLogistica === 'EnRevision' ? 'text-blue-600 bg-blue-50 border-blue-100' :
                        p.estadoLogistica === 'Observado' ? 'text-red-600 bg-red-50 border-red-100' :
                        'text-green-600 bg-green-50 border-green-100'
                      )}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200">
                        <SelectItem value="PendienteRevision" className="font-black text-[9px] uppercase text-amber-600">Pendiente</SelectItem>
                        <SelectItem value="EnRevision" className="font-black text-[9px] uppercase text-blue-600">En Revisión</SelectItem>
                        <SelectItem value="Observado" className="font-black text-[9px] uppercase text-red-600">Observado</SelectItem>
                        <SelectItem value="Aprobado" className="font-black text-[9px] uppercase text-green-600">Aprobado</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-slate-200 flex justify-between items-center">
          <p className="text-xs text-slate-500 font-medium">
            Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredProyectos.length)} de {filteredProyectos.length} proyectos
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-8 h-8 rounded-md text-xs font-bold ${
                    currentPage === i + 1 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
