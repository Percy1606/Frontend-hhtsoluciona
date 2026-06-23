"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import DetalleCobrosDialog from "./detalle-cobros-dialog";
import PresupuestoDialog from "./presupuesto-dialog";

interface ProyectoPendiente {
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
    ordenesDeServicio: { id: string; codigo: string; estado: string }[];
  };
  adelantos: { monto: number; fechaRecibido: string }[];
}

export default function BandejaFinanzas() {
  const [proyectos, setProyectos] = useState<ProyectoPendiente[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCobros, setOpenCobros] = useState(false);
  const [openPresupuesto, setOpenPresupuesto] = useState(false);
  const [selectedProyecto, setSelectedProyecto] = useState<ProyectoPendiente | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Search & Pagination States
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchProyectos = async () => {
    try {
      const data = await api.get("/finanzas/bandeja-proyectos");
      setProyectos(data);
    } catch (error) {
      toast.error("No se pudo cargar la bandeja de proyectos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProyectos();
  }, []);

  const handleUpdate = async (id: string, updateData: Partial<ProyectoPendiente>) => {
    try {
      await api.patch(`/finanzas/bandeja-proyectos/${id}`, updateData);
      toast.success("Actualizado correctamente.");
      fetchProyectos();
    } catch (error) {
      toast.error("No se pudo actualizar.");
    }
  };

  if (loading) return <div>Cargando...</div>;

  // Filtrado y Paginación
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
            <TableHead className="font-black text-primary text-[9px] uppercase p-2">Cotización / OS</TableHead>
            <TableHead className="font-black text-primary text-[9px] uppercase p-2">Adelantos / Total</TableHead>
            <TableHead className="font-black text-primary text-[9px] uppercase p-2">Ppto. Egresos</TableHead>
            <TableHead className="font-black text-primary text-[9px] uppercase p-2">Autoriza Compras</TableHead>
            <TableHead className="font-black text-primary text-[9px] uppercase p-2">Estado Financiero</TableHead>
            <TableHead className="font-black text-primary text-[9px] uppercase text-right p-2">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedProyectos.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="h-32 text-center text-slate-400 font-bold italic text-xs">
                No hay proyectos que coincidan con la búsqueda.
              </TableCell>
            </TableRow>
          ) : (
            paginatedProyectos.map((p, index) => {
              const totalAdelantos = p.adelantos.reduce((sum, a) => sum + Number(a.monto), 0);
              
              return (
                <TableRow key={p.id} className="hover:bg-primary/5 transition-colors group">
                  <TableCell className="text-center font-bold text-[10px] text-slate-400 border-b border-slate-50 p-2">
                    {startIndex + index + 1}
                  </TableCell>
                  <TableCell className="border-b border-slate-50 p-2">
                    <div className="font-black text-[11px] text-primary uppercase leading-tight">{p.codigo}</div>
                    <div className="text-[9px] font-bold text-slate-500 mt-0.5 max-w-[200px] uppercase truncate" title={p.nombre}>
                      {p.nombre?.replace(/^proyecto:\s*/i, '')}
                    </div>
                    <div className="text-[8px] font-black text-slate-400 mt-1 uppercase">
                      Creado: {format(new Date(p.fechaCreacion), "dd MMM yyyy", { locale: es })}
                    </div>
                  </TableCell>
                  <TableCell className="border-b border-slate-50 p-2">
                    <div className="text-[11px] font-black text-slate-700 uppercase leading-tight">{p.cliente.empresa}</div>
                    <div className="text-[9px] font-bold text-slate-400 mt-0.5">RUC: {p.cliente.ruc}</div>
                  </TableCell>
                  <TableCell className="border-b border-slate-50 p-2">
                    <div className="text-[11px] font-black text-slate-700 uppercase leading-tight">{p.cotizacionOrigen?.codigo}</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {p.cotizacionOrigen?.ordenesDeServicio?.map(os => (
                        <Badge key={os.id} variant="outline" className="text-[8px] font-black uppercase px-1 py-0 h-4 border-slate-200 bg-slate-50/50">
                          {os.codigo}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="border-b border-slate-50 p-2">
                    <div className="text-[11px] font-black text-emerald-600 font-mono">
                      S/ {totalAdelantos.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[9px] font-bold text-slate-500 mt-0.5">
                      de S/ {Number(p.ventaContratada).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[8px] font-black text-slate-400 uppercase mt-1">
                      {p.cotizacionOrigen?.formaPago}
                    </div>
                  </TableCell>
                  <TableCell className="border-b border-slate-50 p-2">
                    <div className="flex items-center">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 font-black text-[9px] uppercase transition-all rounded-lg"
                        onClick={() => {
                          setSelectedProyecto(p);
                          setOpenPresupuesto(true);
                        }}
                      >
                        S/ {(p.costoPresupuestado || 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="border-b border-slate-50 p-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={p.autorizaCompras}
                        onCheckedChange={(val) => handleUpdate(p.id, { autorizaCompras: val })}
                      />
                      <span className="text-[9px] font-black uppercase text-slate-600">
                        {p.autorizaCompras ? 'Sí' : 'No'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="border-b border-slate-50 p-2">
                    <Select
                      value={p.estadoFinanciero || 'SinPago'}
                      onValueChange={(val) => handleUpdate(p.id, { estadoFinanciero: val })}
                    >
                      <SelectTrigger className={cn(
                        "h-8 text-[9px] font-black uppercase rounded-lg shadow-sm border-slate-200 w-[125px]",
                        (!p.estadoFinanciero || p.estadoFinanciero === 'SinPago') ? 'text-red-600 bg-red-50 border-red-100' :
                        p.estadoFinanciero === 'AdelantoRecibido' ? 'text-yellow-600 bg-yellow-50 border-yellow-100' :
                        p.estadoFinanciero === 'Observado' ? 'text-blue-600 bg-blue-50 border-blue-100' :
                        'text-green-600 bg-green-50 border-green-100'
                      )}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200">
                        <SelectItem value="SinPago" className="text-red-600 font-black text-[9px] uppercase">Sin Pago</SelectItem>
                        <SelectItem value="AdelantoRecibido" className="text-yellow-600 font-black text-[9px] uppercase">Adelanto Rec.</SelectItem>
                        <SelectItem value="Observado" className="text-blue-600 font-black text-[9px] uppercase">Observado</SelectItem>
                        <SelectItem value="Aprobado" className="text-green-600 font-black text-[9px] uppercase">100% Pagado</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right border-b border-slate-50 p-2">
                    <Button 
                      size="sm" 
                      onClick={() => {
                        setSelectedProyecto(p);
                        setOpenCobros(true);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-black text-[9px] uppercase h-8 px-3 rounded-lg shadow-sm transition-all"
                    >
                      Gestionar Cobros
                    </Button>
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

      {selectedProyecto && (
        <DetalleCobrosDialog
          open={openCobros}
          onClose={() => setOpenCobros(false)}
          proyectoId={selectedProyecto.id}
          onUpdate={fetchProyectos}
        />
      )}
      {selectedProyecto && (
        <PresupuestoDialog
          open={openPresupuesto}
          onOpenChange={setOpenPresupuesto}
          proyectoId={selectedProyecto.id}
          codigoProyecto={selectedProyecto.codigo}
          ventaContratada={selectedProyecto.ventaContratada || 0}
          onSuccess={fetchProyectos}
        />
      )}
    </div>
  );
}
