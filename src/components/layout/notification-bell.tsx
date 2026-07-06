"use client";

import { Bell, Check, RotateCcw, Trash2 } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useNotificationStore } from "@/store/notification-store";
import { useAuthStore } from "@/store/auth-store";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function NotificationBell() {
  const { 
    notifications, 
    unreadCount, 
    fetchNotifications, 
    fetchUnreadCount, 
    markAsRead, 
    markAsUnread,
    markAllAsRead,
    deleteNotification,
    setupSSE,
    sseConnected
  } = useNotificationStore();

  const { token } = useAuthStore();
  const router = useRouter();

  const getNotificationLink = (n: any) => {
    if (n.actividadComercialId) return `/clientes/pipeline`;
    
    const titulo = n.titulo.toLowerCase();
    if (titulo.includes('orden')) return '/logistica/ordenes';
    if (titulo.includes('almacén') || titulo.includes('stock')) return '/logistica/inventario';
    if (titulo.includes('factura') || titulo.includes('ingreso')) return '/finanzas/ingresos';
    if (titulo.includes('gasto') || titulo.includes('egreso')) return '/finanzas/egresos';
    if (titulo.includes('caja') || titulo.includes('transferencia')) return '/finanzas/cajas';
    if (titulo.includes('proyecto') || titulo.includes('adelanto')) return '/operaciones/proyectos';
    if (titulo.includes('cotización') || titulo.includes('cotizacion')) return '/operaciones/cotizaciones';
    if (titulo.includes('cliente')) return '/clientes';
    
    if (n.tipo === 'COTIZACION') return '/operaciones/cotizaciones';
    if (n.tipo === 'CLIENTE') return '/clientes';
    if (n.tipo === 'VISITA' || n.tipo === 'SEGUIMIENTO') return '/clientes/pipeline';
    
    return null;
  };

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
    
    // Polling as fallback (cada 60 segundos)
    const interval = setInterval(() => {
      fetchNotifications();
      fetchUnreadCount();
    }, 60000); 

    // Setup SSE
    let cleanupSSE = () => {};
    if (token) {
      cleanupSSE = setupSSE(token);
    }

    return () => {
      clearInterval(interval);
      cleanupSSE();
    };
  }, [fetchNotifications, fetchUnreadCount, setupSSE, token]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative p-2.5 text-muted-foreground hover:bg-muted rounded-full transition-colors outline-none group">
        <Bell className={cn(
          "w-6 h-6 group-hover:text-primary transition-colors",
          sseConnected ? "text-primary" : "text-muted-foreground"
        )} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-5 h-5 bg-error text-white text-[11px] font-black rounded-full border-2 border-white flex items-center justify-center animate-in zoom-in duration-300">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 p-0 bg-white border border-border shadow-2xl z-50">
        <div className="p-4 border-b border-border bg-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-black text-xs uppercase tracking-wider text-primary">Notificaciones</h3>
            {sseConnected && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-green-50 rounded-full">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[8px] font-black text-green-700 uppercase">En vivo</span>
              </div>
            )}
          </div>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={(e) => {
                e.stopPropagation();
                markAllAsRead();
              }}
              className="h-7 px-2 text-[10px] font-bold uppercase text-muted-foreground hover:text-primary"
            >
              <Check className="w-3 h-3 mr-1" />
              Marcar todo
            </Button>
          )}
        </div>
        <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
          {notifications.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground italic text-xs">
              No tienes notificaciones pendientes.
            </div>
          ) : (
            notifications.map((n) => (
                <div key={n.id} className="relative group">
                  <DropdownMenuItem 
                    className={cn(
                      "flex flex-col items-start gap-1.5 p-4 border-b border-border/50 last:border-none cursor-pointer outline-none transition-all",
                      !n.leida 
                        ? "bg-[#EFF6FF] focus:!bg-[#E0F2FE] data-[highlighted]:!bg-[#E0F2FE] border-l-4 border-primary" 
                        : "bg-[#F3F4F6] focus:!bg-[#E5E7EB] data-[highlighted]:!bg-[#E5E7EB] border-l-4 border-transparent"
                    )}
                    onClick={() => {
                      if (!n.leida) markAsRead(n.id);
                      const url = getNotificationLink(n);
                      if (url) router.push(url);
                    }}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className={cn(
                        "text-[8px] font-black uppercase px-2 py-0.5 rounded-md tracking-tighter shadow-sm",
                        n.tipo === 'SEGUIMIENTO' ? "bg-warning/20 text-warning-foreground border border-warning/20" :
                        n.tipo === 'VISITA' ? "bg-blue-500/20 text-blue-700 border border-blue-500/20" : 
                        n.tipo === 'COTIZACION' ? "bg-emerald-500/20 text-emerald-700 border border-emerald-500/20" :
                        n.tipo === 'CLIENTE' ? "bg-purple-500/20 text-purple-700 border border-purple-500/20" :
                        n.tipo === 'TECNICO' ? "bg-rose-500/20 text-rose-700 border border-rose-500/20" :
                        "bg-slate-500/20 text-slate-700 border border-slate-500/20"
                      )}>
                        {n.tipo}
                      </span>
                      <span className={cn(
                        "text-[9px] font-bold uppercase",
                        n.leida ? "text-slate-600" : "text-primary"
                      )}>
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: es })}
                      </span>
                    </div>
                    <div className="pr-6">
                        <p className={cn(
                            "text-[13px] font-black leading-tight mb-1 uppercase tracking-tight",
                            n.leida ? "text-slate-700" : "text-blue-900"
                        )}>
                            {n.titulo}
                        </p>
                        <p className={cn(
                            "text-[11px] font-medium leading-snug line-clamp-2",
                            n.leida ? "text-slate-500" : "text-slate-700"
                        )}>
                            {n.mensaje}
                        </p>
                    </div>
                    {!n.leida && (
                        <div className="w-2.5 h-2.5 bg-blue-600 rounded-full absolute right-3 top-1/2 -translate-y-1/2 shadow-[0_0_8px_rgba(37,99,235,0.5)] animate-pulse" />
                    )}
                  </DropdownMenuItem>

                  {/* Acciones de la notificación al hacer hover */}
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 flex flex-col gap-1 z-20">
                    {n.leida && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          markAsUnread(n.id);
                        }}
                        className="p-1.5 bg-white border border-border rounded-full shadow hover:text-primary hover:scale-110 transition-all"
                        title="Marcar como no leída"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        deleteNotification(n.id);
                      }}
                      className="p-1.5 bg-white border border-red-100 rounded-full shadow hover:text-red-500 hover:scale-110 transition-all"
                      title="Eliminar notificación"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
            ))
          )}
        </div>
        
        <div className="p-3 text-center border-t border-border bg-white">
          <Link href="/notificaciones/historial" className="w-full block">
              <button className="text-[10px] font-black uppercase text-primary hover:underline w-full py-1 tracking-widest">
                Ver historial completo
              </button>
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
