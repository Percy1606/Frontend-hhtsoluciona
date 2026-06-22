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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Proyecto</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Cotización / OS</TableHead>
            <TableHead>Adelantos / Total</TableHead>
            <TableHead>Ppto. Egresos</TableHead>
            <TableHead>Autoriza Compras</TableHead>
            <TableHead>Estado Financiero</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedProyectos.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                No hay proyectos que coincidan con la búsqueda.
              </TableCell>
            </TableRow>
          ) : (
            paginatedProyectos.map((p) => {
              const totalAdelantos = p.adelantos.reduce((sum, a) => sum + Number(a.monto), 0);
              
              return (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="font-medium text-sm">{p.codigo}</div>
                    <div className="text-xs text-gray-500">{p.nombre}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      Creado: {format(new Date(p.fechaCreacion), "dd MMM yyyy", { locale: es })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{p.cliente.empresa}</div>
                    <div className="text-xs text-gray-500">RUC: {p.cliente.ruc}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{p.cotizacionOrigen?.codigo}</div>
                    {p.cotizacionOrigen?.ordenesDeServicio?.map(os => (
                      <Badge key={os.id} variant="outline" className="text-xs mt-1">
                        {os.codigo}
                      </Badge>
                    ))}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-semibold text-green-600">
                      S/ {totalAdelantos.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-gray-500">
                      de S/ {Number(p.ventaContratada).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {p.cotizacionOrigen?.formaPago}
                    </div>
                  </TableCell>
                  <TableCell>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 bg-slate-50 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 font-bold"
                          onClick={() => {
                            setSelectedProyecto(p);
                            setOpenPresupuesto(true);
                          }}
                        >
                          S/ {(p.costoPresupuestado || 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                        </Button>
                      </div>
                  </TableCell>
                  <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                        checked={p.autorizaCompras}
                        onCheckedChange={(val) => handleUpdate(p.id, { autorizaCompras: val })}
                      />
                      <span className="text-xs font-medium">
                        {p.autorizaCompras ? 'Sí' : 'No'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={p.estadoFinanciero || 'SinPago'}
                      onValueChange={(val) => handleUpdate(p.id, { estadoFinanciero: val })}
                    >
                      <SelectTrigger className={`w-[140px] font-bold ${
                        !p.estadoFinanciero || p.estadoFinanciero === 'SinPago' ? 'text-red-600' :
                        p.estadoFinanciero === 'AdelantoRecibido' ? 'text-yellow-600' :
                        p.estadoFinanciero === 'Observado' ? 'text-blue-600' :
                        'text-green-600'
                      }`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SinPago" className="text-red-600 font-bold">Sin Pago</SelectItem>
                        <SelectItem value="AdelantoRecibido" className="text-yellow-600 font-bold">Adelanto Rec.</SelectItem>
                        <SelectItem value="Observado" className="text-blue-600 font-bold">Observado</SelectItem>
                        <SelectItem value="Aprobado" className="text-green-600 font-bold">100% Pagado</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      size="sm" 
                      onClick={() => {
                        setSelectedProyecto(p);
                        setOpenCobros(true);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 font-bold uppercase text-[10px]"
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
