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
import { Search, ShieldAlert, Eye, Info, ChevronLeft, ChevronRight } from "lucide-react";

export default function AuditoriaPage() {
  const { user } = useAuthStore();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedLog, setSelectedLog] = useState<any>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);

  const fetchLogs = useCallback(async (pageToFetch: number = 1) => {
    try {
      setLoading(true);
      const data = await api.get(`/auditoria?search=${search}&page=${pageToFetch}&limit=${limit}`);
      setLogs(data.data || []);
      setTotalPages(data.totalPages || 1);
      setTotalLogs(data.total || 0);
      setPage(data.page || 1);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    } finally {
      setLoading(false);
    }
  }, [search, limit]);

  useEffect(() => {
    if (user?.rol === 'ADMIN') {
        fetchLogs(1);
    }
  }, [user, fetchLogs]);

  const renderDetallesJson = (detalles: any): React.ReactNode => {
    if (!detalles) return <span className="text-muted-foreground italic text-xs">Sin detalles adicionales.</span>;
    
    return (
      <div className="bg-[#f8fafc] p-4 rounded-lg border border-[#f1f5f9] max-h-[60vh] overflow-auto">
        <pre className="text-[11px] font-mono text-slate-700 leading-relaxed">
          {JSON.stringify(detalles, null, 2)}
        </pre>
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
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-[#001F3F]">Auditoría</h1>
          <p className="text-muted-foreground font-medium text-sm">Historial de acciones y eventos del sistema.</p>
        </div>
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar acción o mensaje..." 
            className="pl-10 font-bold h-11 border-none shadow-sm bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchLogs(1)}
          />
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

          {/* Paginación Estandarizada */}
          {totalPages > 1 && (
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
                          className="h-7 px-4 font-black text-[9px] uppercase border-slate-200 bg-white"
                      >
                          Anterior
                      </Button>
                      <Button 
                          variant="outline" 
                          size="sm" 
                          disabled={page >= totalPages || loading}
                          onClick={() => fetchLogs(page + 1)}
                          className="h-7 px-4 font-black text-[9px] uppercase border-slate-200 bg-white"
                      >
                          Siguiente
                      </Button>
                  </div>
              </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-2xl border-none shadow-2xl rounded-3xl">
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
            {renderDetallesJson(selectedLog?.detalles)}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
