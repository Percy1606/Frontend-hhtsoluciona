const fs = require('fs');

const content = `"use client";

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
import { ChevronDown, ChevronRight, Building2, Wallet, FolderKanban } from "lucide-react";

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
  
  // Expanded Clients State
  const [expandedClients, setExpandedClients] = useState<Record<string, boolean>>({});

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
      await api.patch(\`/finanzas/bandeja-proyectos/\${id}\`, updateData);
      toast.success("Actualizado correctamente.");
      fetchProyectos();
    } catch (error) {
      toast.error("No se pudo actualizar.");
    }
  };

  const toggleClient = (clientId: string) => {
    setExpandedClients((prev) => ({ ...prev, [clientId]: !prev[clientId] }));
  };

  if (loading) return <div>Cargando...</div>;

  // Filtrado
  const filteredProyectos = proyectos.filter((p) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      p.codigo.toLowerCase().includes(searchLower) ||
      p.nombre.toLowerCase().includes(searchLower) ||
      p.cliente.empresa.toLowerCase().includes(searchLower)
    );
  });

  // Agrupar por Cliente
  const groupedProyectos = filteredProyectos.reduce((acc, p) => {
    if (!acc[p.cliente.id]) {
      acc[p.cliente.id] = {
        cliente: p.cliente,
        proyectos: [],
        totalVenta: 0,
        totalAdelantos: 0,
        totalPptoEgresos: 0
      };
    }
    acc[p.cliente.id].proyectos.push(p);
    acc[p.cliente.id].totalVenta += Number(p.ventaContratada || 0);
    acc[p.cliente.id].totalAdelantos += p.adelantos.reduce((sum, a) => sum + Number(a.monto), 0);
    acc[p.cliente.id].totalPptoEgresos += Number(p.costoPresupuestado || 0);
    return acc;
  }, {} as Record<string, { cliente: any; proyectos: ProyectoPendiente[]; totalVenta: number; totalAdelantos: number; totalPptoEgresos: number }>);

  const clientsList = Object.values(groupedProyectos).sort((a, b) => a.cliente.empresa.localeCompare(b.cliente.empresa));

  const totalPages = Math.ceil(clientsList.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedClients = clientsList.slice(startIndex, startIndex + itemsPerPage);

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
            setCurrentPage(1);
          }}
        />
      </div>

      <div className="flex flex-col">
        {paginatedClients.length === 0 ? (
          <div className="p-8 text-center text-slate-400 font-bold italic text-xs">
            No hay clientes o proyectos que coincidan con la búsqueda.
          </div>
        ) : (
          paginatedClients.map((clientData) => {
            const isExpanded = expandedClients[clientData.cliente.id];
            
            return (
              <div key={clientData.cliente.id} className="border-b border-slate-200 last:border-0">
                {/* Header del Cliente */}
                <div 
                  className={cn(
                    "flex items-center justify-between p-4 cursor-pointer transition-colors",
                    isExpanded ? "bg-slate-50" : "hover:bg-slate-50"
                  )}
                  onClick={() => toggleClient(clientData.cliente.id)}
                >
                  <div className="flex items-center gap-3 w-1/3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-blue-700">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-black text-xs text-slate-800 uppercase">{clientData.cliente.empresa}</div>
                      <div className="text-[10px] font-bold text-slate-500">RUC: {clientData.cliente.ruc}</div>
                    </div>
                  </div>

                  <div className="flex flex-1 justify-around items-center">
                    <div className="text-center">
                      <div className="text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center justify-center gap-1">
                        <FolderKanban className="w-3 h-3" /> Servicios
                      </div>
                      <div className="font-black text-xs text-slate-700">{clientData.proyectos.length}</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center justify-center gap-1">
                        <Wallet className="w-3 h-3" /> Egresos Ppto.
                      </div>
                      <div className="font-black text-xs text-orange-600">
                        S/ {clientData.totalPptoEgresos.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center justify-center gap-1">
                        <Wallet className="w-3 h-3" /> Ingresos Totales
                      </div>
                      <div className="font-black text-xs text-emerald-600">
                        S/ {clientData.totalVenta.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>

                  <div className="pl-4">
                    {isExpanded ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                  </div>
                </div>

                {/* Contenido del Cliente (Tabla de Proyectos) */}
                {isExpanded && (
                  <div className="bg-slate-50/50 p-4 pt-0 border-t border-slate-100 shadow-inner">
                    <Table className="min-w-full border-separate border-spacing-0 bg-white rounded-lg border border-slate-200 mt-3 overflow-hidden">
                      <TableHeader className="bg-slate-100/80">
                        <TableRow className="border-b border-border/80">
                          <TableHead className="font-black text-primary text-[9px] uppercase p-2">Orden / Proyecto</TableHead>
                          <TableHead className="font-black text-primary text-[9px] uppercase p-2">Cotización</TableHead>
                          <TableHead className="font-black text-primary text-[9px] uppercase p-2">Adelantos / Total</TableHead>
                          <TableHead className="font-black text-primary text-[9px] uppercase p-2">Ppto. Egresos</TableHead>
                          <TableHead className="font-black text-primary text-[9px] uppercase p-2">Autoriza Compras</TableHead>
                          <TableHead className="font-black text-primary text-[9px] uppercase p-2">Estado Facturación</TableHead>
                          <TableHead className="font-black text-primary text-[9px] uppercase text-right p-2">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {clientData.proyectos.map((p) => {
                          const totalAdelantos = p.adelantos.reduce((sum, a) => sum + Number(a.monto), 0);
                          const isCotizacion = !p.cotizacionOrigen?.ordenesDeServicio?.[0]?.codigo;
                          const hasOrder = !!p.cotizacionOrigen?.ordenesDeServicio?.[0]?.codigo;
                          
                          return (
                            <TableRow key={p.id} className={cn("transition-colors group", (!hasOrder && p.ventaContratada === 0) ? "bg-amber-50/20" : "")}>
                              <TableCell className="border-b border-slate-200 border-dashed p-2">
                                <div className="font-black text-[11px] text-primary uppercase leading-tight">
                                  {p.cotizacionOrigen?.ordenesDeServicio?.[0]?.codigo || p.codigo}
                                </div>
                                <div className="text-[9px] font-bold text-slate-500 mt-0.5 max-w-[200px] uppercase truncate" title={p.nombre}>
                                  {p.nombre?.replace(/^proyecto:\\s*/i, '')}
                                </div>
                                {(!hasOrder && p.ventaContratada === 0) && (
                                  <Badge variant="outline" className="text-[8px] bg-amber-100 text-amber-700 border-amber-200 mt-1 h-4 px-1 rounded-sm">
                                    SOLO COTIZACIÓN
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="border-b border-slate-200 border-dashed p-2">
                                <div className="text-[11px] font-black text-slate-700 uppercase leading-tight">{p.cotizacionOrigen?.codigo || '-'}</div>
                              </TableCell>
                              <TableCell className="border-b border-slate-200 border-dashed p-2">
                                <div className="text-[11px] font-black text-emerald-600 font-mono">
                                  S/ {totalAdelantos.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                                </div>
                                <div className="text-[9px] font-bold text-slate-500 mt-0.5">
                                  de S/ {Number(p.ventaContratada).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                                </div>
                              </TableCell>
                              <TableCell className="border-b border-slate-200 border-dashed p-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2 border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 hover:text-orange-800 font-black text-[9px] uppercase transition-all rounded-lg"
                                  onClick={() => {
                                    setSelectedProyecto(p);
                                    setOpenPresupuesto(true);
                                  }}
                                >
                                  S/ {(p.costoPresupuestado || 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                                </Button>
                              </TableCell>
                              <TableCell className="border-b border-slate-200 border-dashed p-2">
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
                              <TableCell className="border-b border-slate-200 border-dashed p-2">
                                <Select
                                  value={p.estadoFinanciero || 'SinPago'}
                                  onValueChange={(val) => handleUpdate(p.id, { estadoFinanciero: val })}
                                  disabled={!hasOrder && p.ventaContratada === 0}
                                >
                                  <SelectTrigger className={cn(
                                    "h-8 text-[9px] font-black uppercase rounded-lg shadow-sm border-slate-200 w-[125px]",
                                    (!hasOrder && p.ventaContratada === 0) ? 'text-slate-400 bg-slate-100 border-slate-200' :
                                    (!p.estadoFinanciero || p.estadoFinanciero === 'SinPago') ? 'text-red-600 bg-red-50 border-red-100' :
                                    p.estadoFinanciero === 'AdelantoRecibido' ? 'text-yellow-600 bg-yellow-50 border-yellow-100' :
                                    p.estadoFinanciero === 'Observado' ? 'text-blue-600 bg-blue-50 border-blue-100' :
                                    'text-green-600 bg-green-50 border-green-100'
                                  )}>
                                    <SelectValue placeholder={(!hasOrder && p.ventaContratada === 0) ? "NO FACTURABLE" : ""} />
                                  </SelectTrigger>
                                  <SelectContent className="bg-white border-slate-200">
                                    <SelectItem value="SinPago" className="text-red-600 font-black text-[9px] uppercase">Sin Pago</SelectItem>
                                    <SelectItem value="AdelantoRecibido" className="text-yellow-600 font-black text-[9px] uppercase">Adelanto Rec.</SelectItem>
                                    <SelectItem value="Observado" className="text-blue-600 font-black text-[9px] uppercase">Observado</SelectItem>
                                    <SelectItem value="Aprobado" className="text-green-600 font-black text-[9px] uppercase">100% Pagado</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell className="text-right border-b border-slate-200 border-dashed p-2">
                                <Button 
                                  size="sm" 
                                  onClick={() => {
                                    setSelectedProyecto(p);
                                    setOpenCobros(true);
                                  }}
                                  disabled={!hasOrder && p.ventaContratada === 0}
                                  className={cn("font-black text-[9px] uppercase h-8 px-3 rounded-lg shadow-sm transition-all", 
                                    (!hasOrder && p.ventaContratada === 0) ? "bg-slate-200 text-slate-500 hover:bg-slate-200" : "bg-blue-600 hover:bg-blue-700 text-white"
                                  )}
                                >
                                  Cobros
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-slate-200 flex justify-between items-center bg-slate-50 rounded-b-lg">
          <p className="text-xs text-slate-500 font-medium">
            Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, clientsList.length)} de {clientsList.length} clientes
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
                  className={\`w-8 h-8 rounded-md text-xs font-bold \${
                    currentPage === i + 1 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }\`}
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
`;

fs.writeFileSync('C:/Users/Percy/Documents/SOFTWARE HH/Frontend-hhtsoluciona/src/components/finanzas/bandeja-finanzas.tsx', content);
