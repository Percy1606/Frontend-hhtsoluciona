import { create } from 'zustand';
import { api } from '@/lib/api';

interface GlobalKPIs {
  totalClientes: number;
  proyectosActivos: number;
  montoEstimado: number;
  ventaProyectada: number;
  totalFacturado: number;
  totalCobrado: number;
  porcentajeCobranza: number;
  cotizacionesTotal: number;
}

interface FinanzasState {
  globalKPIs: GlobalKPIs | null;
  loading: boolean;
  fetchGlobalKPIs: () => Promise<void>;
}

export const useFinanzasStore = create<FinanzasState>((set) => ({
  globalKPIs: null,
  loading: false,

  fetchGlobalKPIs: async () => {
    set({ loading: true });
    try {
      const data = await api.get('/finanzas/global-stats');
      set({ globalKPIs: data });
    } catch (error) {
      console.error('Error fetching global KPIs:', error);
    } finally {
      set({ loading: false });
    }
  },
}));
