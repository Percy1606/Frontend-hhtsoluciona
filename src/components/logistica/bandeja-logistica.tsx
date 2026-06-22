"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
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
import { CheckCircle2, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";

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

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Proyecto</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>OS / Financiero</TableHead>
            <TableHead>Adelantos Disponibles</TableHead>
            <TableHead>Estado Logística</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {proyectos.map((p) => {
            const saldoDisponible = Number(p.costoPresupuestado) || 0;
            
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
                  <div className="text-xs text-gray-500">Cotización: {p.cotizacionOrigen?.codigo}</div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    {p.cotizacionOrigen?.ordenesDeServicio?.map(os => (
                      <Badge key={os.id} variant="outline" className="w-fit text-xs">
                        {os.codigo}
                      </Badge>
                    ))}
                    <div className="flex items-center gap-1 mt-1 text-xs text-green-600 font-medium">
                      <CheckCircle2 className="w-3 h-3" /> Compras Autorizadas
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm font-semibold">
                    S/ {saldoDisponible.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                  </div>
                </TableCell>
                <TableCell>
                  <Select
                    value={p.estadoLogistica || ""}
                    onValueChange={(val) => handleUpdateEstado(p.id, val)}
                  >
                    <SelectTrigger className="w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PendienteRevision">Pendiente</SelectItem>
                      <SelectItem value="EnRevision">En Revisión</SelectItem>
                      <SelectItem value="Observado">Observado</SelectItem>
                      <SelectItem value="Aprobado">Aprobado</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
