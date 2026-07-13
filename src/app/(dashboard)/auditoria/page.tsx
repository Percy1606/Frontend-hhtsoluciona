"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Search, ShieldAlert, Eye, Info, ChevronLeft, ChevronRight, Trash2, Filter } from "lucide-react";

const MODULOS = ["CRM", "OPERACIONES", "FINANZAS", "LOGISTICA", "DOCUMENTAL", "AUTH", "CONFIG"];

export default function AuditoriaPage() {
  const { user } = useAuthStore();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [moduloFilter, setModuloFilter] = useState("TODOS");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [purgando, setPurgando] = useState(false);
  const [purgeResult, setPurgeResult] = useState<{ eliminados: number; fechaLimite: string } | null>(null);
  const [confirmarPurga, setConfirmarPurga] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);

  const fetchLogs = useCallback(async (pageToFetch: number = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(pageToFetch),
        limit: String(limit),
      });
      if (search) params.set("search", search);
      if (moduloFilter && moduloFilter !== "TODOS") params.set("modulo", moduloFilter);
      if (fechaDesde) params.set("fechaDesde", fechaDesde);
      if (fechaHasta) params.set("fechaHasta", fechaHasta);

      const data = await api.get(`/auditoria?${params.toString()}`);
      setLogs(data.data || []);
      setTotalPages(data.totalPages || 1);
      setTotalLogs(data.total || 0);
      setPage(data.page || 1);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    } finally {
      setLoading(false);
    }
  }, [search, moduloFilter, fechaDesde, fechaHasta, limit]);

  useEffect(() => {
    if (user?.rol === 'ADMIN') {
      fetchLogs(1);
    }
  }, [user, fetchLogs]);

  const handlePurgar = async () => {
    try {
      setPurgando(true);
      const result = await api.delete("/auditoria/purgar");
      setPurgeResult(result);
      fetchLogs(1);
    } catch (error) {
      console.error("Error al purgar logs:", error);
    } finally {
      setPurgando(false);
    }
  };

  const limpiarFiltros = () => {
    setSearch("");
    setModuloFilter("TODOS");
    setFechaDesde("");
    setFechaHasta("");
  };

  const renderDetalles = (detalles: any, accion: string): React.ReactNode => {
    if (!detalles) return <p className="text-slate-400 italic text-xs">Sin detalles adicionales.</p>;

    // Etiquetas legibles para campos técnicos
    const ETIQUETAS: Record<string, string> = {
      empresa: "Empresa / Cliente",
      nombre: "Nombre",
      ruc: "RUC",
      zona: "Zona",
      cargo: "Cargo",
      accion: "Próxima Acción",
      codigo: "Código",
      correo: "Correo",
      estado: "Estado",
      tarifa: "Tarifa",
      cartera: "Cartera",
      contacto: "Contacto",
      semaforo: "Semáforo",
      telefono: "Teléfono",
      asignadoA: "Asignado a",
      direccion: "Dirección",
      prioridad: "Prioridad",
      diaTrabajo: "Día de Trabajo",
      temperatura: "Temperatura",
      tipoCliente: "Tipo de Cliente",
      probabilidad: "Probabilidad (%)",
      clasificacion: "Clasificación",
      esClienteReal: "Es Cliente Real",
      montoEstimado: "Monto Estimado",
      observaciones: "Observaciones",
      etapaComercial: "Etapa Comercial",
      ultimoContacto: "Último Contacto",
      ventaProyectada: "Venta Proyectada",
      proximoSeguimiento: "Próximo Seguimiento",
      descripcion: "Descripción",
      proyecto: "Proyecto",
      cliente: "Cliente",
    };

    const formatValor = (key: string, val: any): string => {
      if (val === null || val === undefined || val === "") return "—";
      if (typeof val === "boolean") return val ? "Sí" : "No";
      if (typeof val === "number") {
        if (key.toLowerCase().includes("monto") || key.toLowerCase().includes("venta"))
          return `S/ ${val.toLocaleString("es-PE")}`;
        if (key === "probabilidad") return `${val}%`;
        return String(val);
      }
      // Fechas ISO
      if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}T/.test(val)) {
        return new Date(val).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
      }
      return String(val);
    };

    // Entidad principal afectada
    const entidad = detalles.empresa || detalles.nombre || detalles.cliente || null;
    const cambios = detalles.cambios as Record<string, any> | undefined;

    // Campos que NO son cambios ni entidad (metadatos de contexto)
    const SKIP_KEYS = new Set(["empresa", "nombre", "cliente", "cambios", "proyectoId", "clienteId", "actividadId", "fichaId"]);
    const extraFields = Object.entries(detalles).filter(([k]) => !SKIP_KEYS.has(k));

    // Acción humanizada
    const esCreacion = accion?.startsWith("CREAR");
    const esEliminacion = accion?.startsWith("ELIMINAR");
    const esActualizacion = accion?.startsWith("ACTUALIZAR");

    return (
      <div className="space-y-4">
        {/* Entidad afectada */}
        {entidad && (
          <div className={`flex items-start gap-3 p-3 rounded-xl border ${
            esEliminacion ? "bg-red-50 border-red-100" :
            esCreacion ? "bg-emerald-50 border-emerald-100" :
            "bg-blue-50 border-blue-100"
          }`}>
            <span className={`text-lg ${
              esEliminacion ? "text-red-500" :
              esCreacion ? "text-emerald-500" :
              "text-blue-500"
            }`}>
              {esEliminacion ? "🗑️" : esCreacion ? "✅" : "✏️"}
            </span>
            <div>
              <p className={`text-[10px] font-black uppercase tracking-wider ${
                esEliminacion ? "text-red-400" : esCreacion ? "text-emerald-500" : "text-blue-400"
              }`}>
                {esEliminacion ? "Registro eliminado" : esCreacion ? "Registro creado" : "Registro modificado"}
              </p>
              <p className="font-bold text-slate-800 text-sm leading-tight">{entidad}</p>
            </div>
          </div>
        )}

        {/* Campos extra de contexto */}
        {extraFields.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {extraFields.map(([key, val]) => (
              <div key={key} className="bg-slate-50 rounded-lg px-3 py-2">
                <p className="text-[9px] font-black uppercase text-slate-400">{ETIQUETAS[key] || key}</p>
                <p className="text-xs font-bold text-slate-700 truncate">{formatValor(key, val)}</p>
              </div>
            ))}
          </div>
        )}

        {/* Cambios detallados */}
        {cambios && (
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-wider">Campos modificados</p>
            <div className="grid grid-cols-1 gap-1 max-h-64 overflow-y-auto pr-1">
              {Object.entries(cambios)
                .filter(([, val]) => val !== null && val !== undefined && val !== "")
                .map(([key, val]) => (
                  <div key={key} className="flex items-center justify-between bg-slate-50 hover:bg-slate-100 rounded-lg px-3 py-2 transition-colors">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                      {ETIQUETAS[key] || key}
                    </span>
                    <span className="text-xs font-bold text-slate-800 text-right max-w-[55%] truncate" title={formatValor(key, val)}>
                      {formatValor(key, val)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (user?.rol !== 'ADMIN') {
    return (
      <div className="p-20 text-center">
        <ShieldAlert className="w-16 h-16 mx-auto text-[#E30613] mb-4" />
        <h1 className="text-2xl font-black">Acceso Denegado</h1>
        <p className="text-muted-foreground">Solo administradores pueden acceder a esta vista.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Encabezado */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-[#001F3F]">Auditoría</h1>
          <p className="text-muted-foreground font-medium text-sm">
            Historial de acciones del sistema — se conservan 90 días (eliminaciones: permanentes).
          </p>
        </div>
        <Button
          variant="outline"
          className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 gap-2 font-bold text-xs uppercase h-10 rounded-xl"
          onClick={() => setConfirmarPurga(true)}
        >
          <Trash2 className="w-4 h-4" />
          Purgar ahora
        </Button>
      </div>

      {/* Resultado de purga */}
      {purgeResult && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center justify-between">
          <p className="text-sm font-bold text-emerald-700">
            ✅ Purga completada: <strong>{purgeResult.eliminados}</strong> logs eliminados (anteriores al {purgeResult.fechaLimite}).
            Las acciones de eliminación se conservaron.
          </p>
          <button onClick={() => setPurgeResult(null)} className="text-emerald-400 hover:text-emerald-600 text-lg font-bold ml-4">×</button>
        </div>
      )}

      {/* Barra de Filtros */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3 items-end">
          {/* Búsqueda */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por acción, módulo o usuario..."
              className="pl-10 font-bold h-10 border-slate-200 bg-slate-50 focus:bg-white rounded-xl text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchLogs(1)}
            />
          </div>

          {/* Filtro Módulo */}
          <div className="w-full md:w-44">
            <Select value={moduloFilter} onValueChange={(v) => setModuloFilter(v || "TODOS")}>
              <SelectTrigger className="h-10 text-xs font-bold border-slate-200 bg-slate-50 rounded-xl">
                <Filter className="w-3 h-3 mr-1 text-slate-400" />
                <SelectValue placeholder="Módulo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos los módulos</SelectItem>
                {MODULOS.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Fecha Desde */}
          <div className="w-full md:w-36">
            <input
              type="date"
              className="h-10 w-full px-3 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#001F3F]/20 text-slate-700"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              title="Fecha desde"
            />
          </div>

          {/* Fecha Hasta */}
          <div className="w-full md:w-36">
            <input
              type="date"
              className="h-10 w-full px-3 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#001F3F]/20 text-slate-700"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              title="Fecha hasta"
            />
          </div>

          {/* Aplicar / Limpiar */}
          <Button
            onClick={() => fetchLogs(1)}
            className="h-10 px-5 bg-[#001F3F] hover:bg-[#001F3F]/90 text-white font-bold text-xs uppercase rounded-xl"
          >
            Aplicar
          </Button>
          {(search || moduloFilter !== "TODOS" || fechaDesde || fechaHasta) && (
            <Button
              variant="ghost"
              onClick={limpiarFiltros}
              className="h-10 px-4 text-slate-500 font-bold text-xs uppercase rounded-xl hover:bg-slate-100"
            >
              Limpiar
            </Button>
          )}
        </div>
      </div>

      {/* VISTA MÓVIL (Tarjetas) */}
      <div className="block md:hidden space-y-4">
        {loading ? (
          <div className="text-center py-10 flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-4 border-[#001F3F] border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Cargando...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground font-bold italic">No hay registros para mostrar.</div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-3 relative">
              <div className="absolute top-4 right-4 flex items-center bg-white/80 rounded-lg p-1 backdrop-blur-sm z-10">
                <Button variant="ghost" size="icon" className="h-7 w-7 text-[#001F3F]" onClick={() => setSelectedLog(log)}><Eye className="w-4 h-4" /></Button>
              </div>
              <div className="flex flex-col gap-1 pr-12">
                <span className="text-[10px] font-bold text-slate-500 uppercase">{format(new Date(log.fechaCreacion), "dd/MM/yyyy HH:mm", { locale: es })}</span>
                <span className="font-black text-sm text-[#001F3F] uppercase leading-tight">{log.usuario?.nombre || log.usuarioId}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-1 pt-2 border-t border-slate-50">
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-black uppercase text-slate-500">Módulo</span>
                  <Badge variant="secondary" className="text-[9px] font-black uppercase px-2 py-0.5 bg-[#f1f5f9] text-[#64748b] border-none w-fit">{log.modulo}</Badge>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[9px] font-black uppercase text-slate-500">Acción</span>
                  <span className="text-[11px] font-bold text-[#001F3F] text-right">{log.accion}</span>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Paginación Móvil */}
        {totalPages > 1 && (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center justify-between gap-3 mt-4">
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest text-center">
              Página {page} de {totalPages} — Total: {totalLogs} eventos
            </p>
            <div className="flex justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => fetchLogs(page - 1)} className="h-7 px-4 font-black text-[9px] uppercase border-slate-200 bg-white">
                Anterior
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages || loading} onClick={() => fetchLogs(page + 1)} className="h-7 px-4 font-black text-[9px] uppercase border-slate-200 bg-white">
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* VISTA PC */}
      <Card className="hidden md:block border-none shadow-2xl bg-[#ffffffcc] backdrop-blur-sm overflow-hidden rounded-2xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-[#f8fafc80]">
              <TableRow className="hover:bg-transparent border-b border-[#f1f5f9]">
                <TableHead className="font-black text-[10px] uppercase text-slate-500 py-4 px-6">Fecha y Hora</TableHead>
                <TableHead className="font-black text-[10px] uppercase text-slate-500 py-4">Usuario</TableHead>
                <TableHead className="font-black text-[10px] uppercase text-slate-500 py-4">Módulo</TableHead>
                <TableHead className="font-black text-[10px] uppercase text-slate-500 py-4">Acción</TableHead>
                <TableHead className="font-black text-[10px] uppercase text-slate-500 py-4 text-center">Detalles</TableHead>
                <TableHead className="font-black text-[10px] uppercase text-slate-500 py-4 px-6 text-right">IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-4 border-[#001F3F] border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Cargando...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20 text-muted-foreground font-bold italic">
                    No hay registros para mostrar.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-[#f8fafccc] transition-colors border-b border-[#f8fafc] last:border-0 group">
                    <TableCell className="py-3 px-6 text-[11px] font-bold text-slate-500 whitespace-nowrap">
                      {format(new Date(log.fechaCreacion), "dd/MM/yyyy HH:mm", { locale: es })}
                    </TableCell>
                    <TableCell className="py-3 font-black text-xs uppercase tracking-tight text-[#001F3F]">
                      {log.usuario?.nombre || log.usuarioId}
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge variant="secondary" className="text-[9px] font-black uppercase px-2 py-0 bg-[#f1f5f9] text-[#64748b] border-none">
                        {log.modulo}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 font-bold text-xs text-[#001F3F]">
                      {log.accion}
                    </TableCell>
                    <TableCell className="py-3 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-[#001F3F1A] hover:text-[#001F3F] transition-all rounded-full"
                        onClick={() => setSelectedLog(log)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                    <TableCell className="py-3 px-6 text-right text-[10px] font-mono text-slate-400 group-hover:text-slate-600 transition-colors">
                      {log.ip || '---'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Paginación */}
          <div className="p-3 bg-slate-50 border-t border-border flex items-center justify-between">
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-2">
              Página {page} de {totalPages} — Total: {totalLogs} eventos
            </p>
            <div className="flex gap-2 mr-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => fetchLogs(page - 1)}
                className="h-7 px-4 font-black text-[9px] uppercase border-slate-200 bg-white gap-1"
              >
                <ChevronLeft className="w-3 h-3" /> Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || loading}
                onClick={() => fetchLogs(page + 1)}
                className="h-7 px-4 font-black text-[9px] uppercase border-slate-200 bg-white gap-1"
              >
                Siguiente <ChevronRight className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Diálogo de confirmación de purga */}
      <Dialog open={confirmarPurga} onOpenChange={setConfirmarPurga}>
        <DialogContent className="max-w-md border-none shadow-2xl rounded-3xl bg-white">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-red-50 rounded-xl text-red-600">
                <Trash2 className="w-5 h-5" />
              </div>
              <DialogTitle className="text-lg font-black uppercase text-[#001F3F]">
                ¿Purgar logs antiguos?
              </DialogTitle>
            </div>
          </DialogHeader>
          <p className="text-sm text-slate-600 mt-1">
            Se eliminarán todos los logs de <strong>más de 90 días</strong> excepto las acciones de tipo{" "}
            <strong className="text-red-600">ELIMINAR_*</strong>, que se conservan permanentemente.
            Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-3 mt-4 justify-end">
            <Button
              variant="outline"
              className="rounded-xl font-bold"
              onClick={() => setConfirmarPurga(false)}
            >
              Cancelar
            </Button>
            <Button
              disabled={purgando}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold"
              onClick={async () => { setConfirmarPurga(false); await handlePurgar(); }}
            >
              {purgando ? "Purgando..." : "Sí, purgar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Detalle */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-2xl border-none shadow-2xl rounded-3xl bg-white">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-[#001F3F1A] rounded-xl text-[#001F3F]">
                <Info className="w-5 h-5" />
              </div>
              <DialogTitle className="text-xl font-black tracking-tight uppercase text-[#001F3F]">
                Detalles del Evento
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase text-slate-400">Usuario</p>
              <p className="text-sm font-bold text-[#001F3F]">{selectedLog?.usuario?.nombre || selectedLog?.usuarioId}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase text-slate-400">Módulo / Acción</p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[9px] font-black border-[#001F3F33] text-[#001F3F]">{selectedLog?.modulo}</Badge>
                <span className="text-sm font-bold text-[#001F3F]">{selectedLog?.accion}</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase text-slate-400">Fecha y Hora</p>
              <p className="text-sm font-bold text-[#001F3F]">
                {selectedLog && format(new Date(selectedLog.fechaCreacion), "PPPP 'a las' HH:mm:ss", { locale: es })}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase text-slate-400">Dirección IP</p>
              <p className="text-sm font-mono text-[#001F3F]">{selectedLog?.ip || 'Desconocida'}</p>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <p className="text-[10px] font-black uppercase text-slate-400">Información Adicional</p>
            {renderDetalles(selectedLog?.detalles, selectedLog?.accion)}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
