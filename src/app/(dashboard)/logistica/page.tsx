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
  Package,
  Truck,
  AlertTriangle,
  PackageCheck,
  Wrench,
  Settings,
  Eye,
  Download,
  Filter,
  PlusCircle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
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

interface Material {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipo: string;
  cantidad: number;
  cantidadMinima: number;
  unidad: string;
  estado: string;
  ubicacion?: string;
  proveedor?: string;
  costoUnitario?: number;
  seriales?: string[];
  mantenimientoProximo?: string;
}

// ============================================
// CONSTANTES
// ============================================

const estadoColors: Record<string, string> = {
  "Disponible": "bg-green-100 text-green-700",
  "Asignado": "bg-blue-100 text-blue-700",
  "En Uso": "bg-purple-100 text-purple-700",
  "Mantenimiento": "bg-yellow-100 text-yellow-700",
  "Dañado": "bg-red-100 text-red-700",
  "Reservado": "bg-orange-100 text-orange-700",
};

const tipoColors: Record<string, string> = {
  "Equipo": "bg-purple-100 text-purple-700",
  "Material": "bg-blue-100 text-blue-700",
  "Herramienta": "bg-yellow-100 text-yellow-700",
  "Consumible": "bg-green-100 text-green-700",
};

const tipoIcons: Record<string, React.ReactNode> = {
  "Equipo": <Wrench className="w-4 h-4" />,
  "Material": <Package className="w-4 h-4" />,
  "Herramienta": <Settings className="w-4 h-4" />,
  "Consumible": <PackageCheck className="w-4 h-4" />,
};

// ============================================
// PÁGINA PRINCIPAL
// ============================================

export default function LogisticaPage() {
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [stockBajo, setStockBajo] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [filtros, setFiltros] = useState({
    search: "",
    tipo: "all",
    estado: "all",
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

      const response = await fetch(`/api/logistica?${params}`);
      const data = await response.json();

      setMateriales(data.materiales || []);
      setStockBajo(data.stockBajo || []);
    } catch (error) {
      console.error("Error fetching materiales:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calcular estadísticas
  const stats = {
    total: materiales.length,
    disponibles: materiales.filter(m => m.estado === "Disponible").length,
    enUso: materiales.filter(m => m.estado === "En Uso").length,
    enMantenimiento: materiales.filter(m => m.estado === "Mantenimiento").length,
    stockBajo: stockBajo.length,
    totalInventario: materiales.reduce((acc, m) => acc + (m.costoUnitario || 0) * m.cantidad, 0),
    porTipo: {
      equipos: materiales.filter(m => m.tipo === "Equipo").length,
      materiales: materiales.filter(m => m.tipo === "Material").length,
      herramientas: materiales.filter(m => m.tipo === "Herramienta").length,
      consumibles: materiales.filter(m => m.tipo === "Consumible").length,
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Truck className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-black text-primary tracking-tight">Logística e Inventario</h1>
          </div>
          <p className="text-muted-foreground mt-1 font-medium">Control de materiales, equipos y herramientas.</p>
        </div>
        <Button className="gap-2 font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4" /> Nuevo Material
        </Button>
      </div>

      {/* Alerts de Stock Bajo */}
      {stockBajo.length > 0 && (
        <div className="bg-red-50 border border-error rounded-xl p-4">
          <div className="flex items-center gap-2 text-error mb-2">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-black uppercase">Stock Bajo - Requiere Reposición</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {stockBajo.map((item) => (
              <div key={item.id} className="bg-white px-3 py-1 rounded-lg border border-error/20">
                <span className="font-bold text-sm text-primary">{item.nombre}</span>
                <span className="text-xs text-error ml-2">
                  ({item.cantidad}/{item.cantidadMinima} {item.unidad})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatsCard
          label="Total Ítems"
          value={stats.total}
          icon={<Package className="w-5 h-5" />}
          color="text-primary"
          bgColor="bg-primary/5"
        />
        <StatsCard
          label="Disponibles"
          value={stats.disponibles}
          icon={<PackageCheck className="w-5 h-5" />}
          color="text-success"
          bgColor="bg-green-50"
        />
        <StatsCard
          label="En Uso"
          value={stats.enUso}
          icon={<Truck className="w-5 h-5" />}
          color="text-purple-600"
          bgColor="bg-purple-50"
        />
        <StatsCard
          label="Mantenimiento"
          value={stats.enMantenimiento}
          icon={<Wrench className="w-5 h-5" />}
          color="text-warning"
          bgColor="bg-yellow-50"
        />
        <StatsCard
          label="Stock Bajo"
          value={stats.stockBajo}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="text-error"
          bgColor="bg-red-50"
        />
      </div>

      {/* Valor del Inventario */}
      <div className="bg-gradient-to-r from-primary to-secondary rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/70 font-bold text-sm uppercase">Valor Total del Inventario</p>
            <p className="text-4xl font-black">
              {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(stats.totalInventario)}
            </p>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {Object.entries(stats.porTipo).map(([tipo, count]) => (
              <div key={tipo} className="text-center">
                <p className="text-white/70 text-xs uppercase">{tipo}</p>
                <p className="text-2xl font-black">{count as number}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl border border-border shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, código o descripción..."
              className="pl-10 h-10 border-border"
              value={filtros.search}
              onChange={(e) => setFiltros({ ...filtros, search: e.target.value })}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select
              value={filtros.tipo}
              onValueChange={(val) => setFiltros({ ...filtros, tipo: val })}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los Tipos</SelectItem>
                <SelectItem value="Equipo">Equipos</SelectItem>
                <SelectItem value="Material">Materiales</SelectItem>
                <SelectItem value="Herramienta">Herramientas</SelectItem>
                <SelectItem value="Consumible">Consumibles</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filtros.estado}
              onValueChange={(val) => setFiltros({ ...filtros, estado: val })}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los Estados</SelectItem>
                <SelectItem value="Disponible">Disponible</SelectItem>
                <SelectItem value="Asignado">Asignado</SelectItem>
                <SelectItem value="En Uso">En Uso</SelectItem>
                <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
                <SelectItem value="Dañado">Dañado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Tabla de Materiales */}
      <div className="rounded-xl border border-border bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-bold text-primary">CÓDIGO</TableHead>
              <TableHead className="font-bold text-primary">MATERIAL / EQUIPO</TableHead>
              <TableHead className="font-bold text-primary">TIPO</TableHead>
              <TableHead className="font-bold text-primary">CANTIDAD</TableHead>
              <TableHead className="font-bold text-primary">UBICACIÓN</TableHead>
              <TableHead className="font-bold text-primary">COSTO UNIT.</TableHead>
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
                    <span>Cargando inventario...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : materiales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No se encontraron materiales
                </TableCell>
              </TableRow>
            ) : (
              materiales.map((material) => (
                <TableRow key={material.id} className="hover:bg-muted/10 transition-colors group">
                  <TableCell className="font-black text-xs text-primary">
                    {material.codigo}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-bold text-sm text-primary group-hover:text-secondary transition-colors">
                        {material.nombre}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                        {material.descripcion || "Sin descripción"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={cn("p-1.5 rounded", tipoColors[material.tipo])}>
                        {tipoIcons[material.tipo]}
                      </div>
                      <span className="text-sm font-bold">{material.tipo}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "font-black text-lg",
                        material.cantidad <= material.cantidadMinima ? "text-error" : "text-primary"
                      )}>
                        {material.cantidad}
                      </span>
                      <span className="text-xs text-muted-foreground">{material.unidad}</span>
                      {material.cantidad <= material.cantidadMinima && (
                        <AlertTriangle className="w-4 h-4 text-error" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-medium text-slate-600">
                    {material.ubicacion || "-"}
                  </TableCell>
                  <TableCell className="text-sm font-bold text-slate-600">
                    {material.costoUnitario
                      ? new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(material.costoUnitario)
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("border-none font-black text-[9px] uppercase tracking-wider", estadoColors[material.estado])}>
                      {material.estado}
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
                      {material.estado === "Disponible" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 font-bold text-[10px] uppercase gap-1 border-primary text-primary hover:bg-primary hover:text-white"
                        >
                          <PlusCircle className="w-3 h-3" /> Asignar
                        </Button>
                      )}
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

function StatsCard({
  label,
  value,
  icon,
  color,
  bgColor,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="bg-white p-4 rounded-xl border border-border shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg", bgColor)}>
          <div className={cn("w-5 h-5", color)}>{icon}</div>
        </div>
        <div>
          <p className="text-[10px] font-black text-muted-foreground uppercase">{label}</p>
          <p className={cn("text-2xl font-black", color)}>{value}</p>
        </div>
      </div>
    </div>
  );
}