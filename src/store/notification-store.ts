import { create } from 'zustand';
import { api } from '@/lib/api';
import { toast } from 'sonner';

// Prevents duplicate toasts in the same session and plays notification sound
const shownToastIds = new Set<string>();

const playNotificationSound = () => {
  if (typeof window !== 'undefined') {
    const audio = new Audio('/notification.mp3');
    audio.play().catch(err => console.warn("[Notification Sound] Error playing sound:", err));
  }
};

export type Notification = {
  id: string;
  usuarioId?: string;
  titulo: string;
  mensaje: string;
  tipo: 'SEGUIMIENTO' | 'VISITA' | 'COTIZACION' | 'CLIENTE' | 'SISTEMA' | 'TECNICO';
  leida: boolean;
  esGlobal: boolean;
  fechaProgramada?: string;
  actividadComercialId?: string;
  createdAt: string;
};

export type NotificationState = {
  notifications: Notification[];
  unreadCount: number;
  totalNotifications: number;
  page: number;
  limit: number;
  totalPages: number;
  loading: boolean;
  sseConnected: boolean;
  fetchNotifications: (page?: number, limit?: number) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAsUnread: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  setupSSE: (token: string) => () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  totalNotifications: 0,
  page: 1,
  limit: 50,
  totalPages: 0,
  loading: false,
  sseConnected: false,

  setupSSE: (token: string) => {
    if (typeof window === 'undefined') return () => {};
    if (!token) {
      console.warn("[SSE] No se puede iniciar conexión: Token ausente");
      return () => {};
    }
    
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const sseUrl = `${baseUrl}/notificaciones/stream?token=${token}`;
    console.log("[SSE] Intentando conectar a:", sseUrl);

    // EventSource nativo no soporta headers. Usaremos un query param para el token.
    const eventSource = new EventSource(sseUrl);

    eventSource.onopen = () => {
      set({ sseConnected: true });
      console.log("[SSE] Conectado exitosamente al servidor de notificaciones");
    };

    eventSource.onmessage = (event) => {
      if (!event.data) return;
      try {
        const payload = JSON.parse(event.data);
        
        // Ignorar heartbeats
        if (payload.type === 'heartbeat') return;

        const newNotif: Notification = payload;
        const { notifications, unreadCount } = get();
        
        // Evitar duplicados si el polling ya la trajo
        if (!notifications.some(n => n.id === newNotif.id)) {
          set({
            notifications: [newNotif, ...notifications].slice(0, 100),
            unreadCount: unreadCount + 1
          });

          // Disparar Toast si no se ha mostrado antes en la sesión
          if (!shownToastIds.has(newNotif.id)) {
            shownToastIds.add(newNotif.id);
            const toastFn = (newNotif.tipo === 'TECNICO' || newNotif.tipo === 'VISITA') ? toast.warning : toast.info;
            toastFn(newNotif.titulo, {
              description: newNotif.mensaje,
              duration: 8000,
            });
            playNotificationSound();
          }
        }
      } catch (err) {
        console.error("[SSE] Error procesando mensaje entrante:", err);
      }
    };

    eventSource.onerror = (err) => {
      set({ sseConnected: false });
      
      // Si el estado es CONNECTING (0), el navegador está reconectando automáticamente en segundo plano.
      if (eventSource.readyState === EventSource.CONNECTING) {
        return;
      }

      if (eventSource.readyState === EventSource.CLOSED) {
        eventSource.close();
      }
    };

    return () => {
      console.log("[SSE] Cerrando conexión de forma controlada");
      eventSource.close();
      set({ sseConnected: false });
    };
  },

  fetchNotifications: async (page = 1, limit = 50) => {
    const currentNotifications = get().notifications;
    set({ loading: true });
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      const response = await api.get(`/notificaciones?${queryParams.toString()}`);

      let rawData: Notification[] = [];
      let total = 0;
      let totalP = 1;

      if (response && response.data && Array.isArray(response.data)) {
        rawData = response.data;
        total = response.total || rawData.length;
        totalP = response.totalPages || 1;
      } else if (Array.isArray(response)) {
        rawData = response;
        total = rawData.length;
      }

      // DETECCIÓN DE NUEVAS NOTIFICACIONES PARA TOASTS (SOLO SI SSE NO ESTÁ ACTIVO PARA ESTA NOTIF)
      if (page === 1 && currentNotifications.length > 0 && rawData.length > 0) {
        const newOnes = rawData.filter(
          n => !n.leida && !currentNotifications.some(existing => existing.id === n.id)
        );
        
        newOnes.forEach(n => {
          if (!shownToastIds.has(n.id)) {
            shownToastIds.add(n.id);
            const toastFn = (n.tipo === 'TECNICO' || n.tipo === 'VISITA') ? toast.warning : toast.info;
            toastFn(n.titulo, {
              description: n.mensaje,
              duration: 8000,
            });
            playNotificationSound();
          }
        });
      }

      const newNotifications = rawData.map((n: any) => ({
        ...n,
        createdAt: n.createdAt || new Date().toISOString()
      }));

      // Calculamos el conteo de no leídas de la muestra actual como respaldo
      const localUnreadCount = newNotifications.filter((n: any) => !n.leida).length;

      set({ 
        notifications: newNotifications, 
        totalNotifications: total,
        unreadCount: response.unreadCount !== undefined ? response.unreadCount : localUnreadCount,
        page: page,
        limit: limit,
        totalPages: totalP,
        loading: false 
      });
    } catch (error) {
      console.warn('[NotificationStore] No se pudo sincronizar notificaciones (servidor reconectando o sin red):', error);
      set({ loading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const { count } = await api.get('/notificaciones/unread-count');
      set({ unreadCount: count });
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  },

  markAsRead: async (id) => {
    try {
      await api.put(`/notificaciones/${id}/read`, {});
      set((state) => {
        const notif = state.notifications.find(n => n.id === id);
        // Solo restamos si la notificación existe localmente y no estaba leída
        const shouldDecrement = notif && !notif.leida;
        return {
          notifications: state.notifications.map(n => n.id === id ? { ...n, leida: true } : n),
          unreadCount: shouldDecrement ? Math.max(0, state.unreadCount - 1) : state.unreadCount
        };
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  },

  markAsUnread: async (id) => {
    try {
      await api.put(`/notificaciones/${id}/unread`, {});
      set((state) => ({
        notifications: state.notifications.map(n => n.id === id ? { ...n, leida: false } : n),
        unreadCount: state.unreadCount + 1
      }));
    } catch (error) {
      console.error("Error marking notification as unread:", error);
    }
  },

  markAllAsRead: async () => {
    try {
      await api.put('/notificaciones/read-all', {});
      set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, leida: true })),
        unreadCount: 0
      }));
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  },

  deleteNotification: async (id) => {
    try {
      await api.delete(`/notificaciones/${id}`);
      set((state) => {
        const notif = state.notifications.find(n => n.id === id);
        const shouldDecrement = notif && !notif.leida;
        return {
          notifications: state.notifications.filter(n => n.id !== id),
          unreadCount: shouldDecrement ? Math.max(0, state.unreadCount - 1) : state.unreadCount
        };
      });
      toast.success("Notificación eliminada");
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Error al eliminar la notificación");
    }
  }
}));
