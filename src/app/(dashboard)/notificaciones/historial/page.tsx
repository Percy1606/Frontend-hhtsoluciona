"use client";

import { useState, useEffect } from "react";
import { useNotificationStore, Notification } from "@/store/notification-store";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Check, Clock, FilterX, ChevronLeft, ChevronRight } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function HistorialNotificacionesPage() {
  const { 
    notifications, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead, 
    loading,
    totalNotifications,
    page,
    totalPages
  } = useNotificationStore();

  useEffect(() => {
    fetchNotifications(1, 50);
  }, [fetchNotifications]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Bell className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-black text-primary tracking-tight uppercase">Historial de Notificaciones</h1>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 font-bold uppercase tracking-wide">
            Registro completo de alertas y avisos del sistema.
          </p>
        </div>
        <div className="flex gap-2">
            <Button 
                variant="outline" 
                onClick={() => fetchNotifications(1, 50)}
                className="font-black text-[10px] uppercase h-10 px-6 border-slate-200"
            >
                Actualizar
            </Button>
            <Button 
                onClick={markAllAsRead}
                disabled={notifications.every(n => n.leida)}
                className="bg-primary hover:bg-primary/90 text-white font-black text-[10px] uppercase h-10 px-6 shadow-lg shadow-primary/20"
            >
                Marcar todo como leído
            </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-black text-primary text-[10px] uppercase py-4 pl-6 w-[150px]">Fecha</TableHead>
              <TableHead className="font-black text-primary text-[10px] uppercase w-[120px]">Categoría</TableHead>
              <TableHead className="font-black text-primary text-[10px] uppercase">Asunto / Mensaje</TableHead>
              <TableHead className="font-black text-primary text-[10px] uppercase text-center w-[100px]">Estado</TableHead>
              <TableHead className="font-black text-primary text-[10px] uppercase text-right pr-6 w-[100px]">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-20 text-center animate-pulse font-black text-slate-400 uppercase text-xs">
                    Sincronizando historial...
                </TableCell>
              </TableRow>
            ) : notifications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-20 text-center text-slate-400 font-bold uppercase text-xs">
                    No tienes notificaciones registradas.
                </TableCell>
              </TableRow>
            ) : (
              notifications.map((n) => (
                <TableRow key={n.id} className={cn(
                    "hover:bg-slate-50/50 transition-colors border-slate-100",
                    !n.leida && "bg-primary/[0.02]"
                )}>
                  <TableCell className="py-4 pl-6">
                    <div className="flex flex-col gap-1 text-slate-500">
                        <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            <span className="text-[10px] font-bold uppercase whitespace-nowrap">
                                {format(new Date(n.createdAt), "dd/MM/yyyy HH:mm")}
                            </span>
                        </div>
                        <span className="text-[9px] font-medium text-slate-400 uppercase italic pl-5">
                            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: es })}
                        </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn(
                        "font-black text-[8px] uppercase px-2 h-4.5 shadow-none border-none",
                        n.tipo === 'SEGUIMIENTO' ? "bg-warning/20 text-warning-foreground" :
                        n.tipo === 'VISITA' ? "bg-accent/20 text-accent-foreground" : 
                        n.tipo === 'COTIZACION' ? "bg-secondary/20 text-secondary-foreground" :
                        n.tipo === 'TECNICO' ? "bg-emerald-500/20 text-emerald-700" :
                        "bg-primary/20 text-primary"
                    )}>
                        {n.tipo}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                        <p className={cn(
                            "font-black text-xs uppercase leading-tight",
                            n.leida ? "text-slate-500" : "text-primary"
                        )}>
                            {n.titulo}
                        </p>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5 line-clamp-1">{n.mensaje}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {!n.leida ? (
                        <div className="flex justify-center">
                            <div className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                        </div>
                    ) : (
                        <span className="text-[9px] font-black text-slate-300 uppercase">Leído</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    {!n.leida && (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => markAsRead(n.id)}
                            className="h-7 text-primary hover:bg-primary/10 font-black text-[9px] uppercase px-3"
                        >
                            Marcar leído
                        </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-[10px] font-black uppercase text-slate-400">
                Página {page} de {totalPages} — Total: {totalNotifications} alertas
            </p>
            <div className="flex gap-2">
                <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={page <= 1}
                    onClick={() => fetchNotifications(page - 1)}
                    className="h-8 text-[10px] font-black uppercase border-slate-200 bg-white px-4"
                >
                    Anterior
                </Button>
                <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={page >= totalPages}
                    onClick={() => fetchNotifications(page + 1)}
                    className="h-8 text-[10px] font-black uppercase border-slate-200 bg-white px-4"
                >
                    Siguiente
                </Button>
            </div>
        </div>
      )}
    </div>
  );
}
