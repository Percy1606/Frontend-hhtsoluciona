import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';

// ============================================
// TIPOS REALES (Sincronizados con Prisma)
// ============================================

export type EstadoCompra = 'PENDIENTE' | 'APROBADO' | 'RECIBIDO' | 'CANCELADO';
export type TipoMovimiento = 'ENTRADA' | 'SALIDA';

export interface Insumo {
  id: string;
  nombre: string;
  descripcion?: string;
  unidadMedida: string;
  stockActual: number;
  stockMinimo: number;
  precioReferencial: number;
  categoria?: string;
  createdAt: string;
  updatedAt: string;
  movimientos?: any[];
  _count?: { movimientos: number };
}

export interface Proveedor {
  id: string;
  ruc: string;
  razonSocial: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
}

export interface DetalleOrden {
  id: string;
  insumoId: string;
  insumo?: Insumo;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface OrdenCompra {
  id: string;
  codigo: string;
  proveedorId: string;
  proveedor?: Proveedor;
  fechaEmision: string;
  estado: EstadoCompra;
  montoTotal: number;
  observaciones?: string;
  items: DetalleOrden[];
  gasto?: any;
  createdAt: string;
}

export interface MovimientoAlmacen {
  id: string;
  insumoId: string;
  insumo?: Insumo;
  tipo: TipoMovimiento;
  cantidad: number;
  fecha: string;
  motivo?: string;
  proyectoId?: string;
  ordenCompraId?: string;
}

// ============================================
// PERSONAL DE OBRA
// ============================================

export interface PersonalProyecto {
  id: string;
  proyectoId: string;
  proyectoCodigo?: string;
  proyectoNombre?: string;
  nombre: string;
  documento?: string;
  rol: string;
  tipoContrato: string;
  montoDiario: number;
  fechaInicio: string;
  fechaFin?: string;
  activo: boolean;
  observaciones?: string;
  creadoPor?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// INTERFAZ DEL STORE
// ============================================

interface LogisticaState {
  personal: PersonalProyecto[];
  personalProyecto: PersonalProyecto[];
  totalPersonal: number;
  personalPage: number;
  personalTotalPages: number;

  insumos: Insumo[];
  currentInsumo: Insumo | null;
  proveedores: Proveedor[];
  ordenes: OrdenCompra[];
  movimientosProyecto: MovimientoAlmacen[];
  totalInsumos: number;
  insumoPage: number;
  insumoLimit: number;
  insumoTotalPages: number;

  // Global Stats
  inventoryStats: {
    totalInversion: number;
    lowStockCount: number;
    totalItems: number;
  };

  // Ordenes Paginación
  totalOrdenes: number;
  montoTotalOrdenes: number;
  ordenPage: number;
  ordenTotalPages: number;

  // Movimientos (Kardex) Paginación
  movimientos: MovimientoAlmacen[];
  totalMovimientos: number;
  movimientoPage: number;
  movimientoTotalPages: number;

  loading: boolean;
  error: string | null;

  // Acciones Insumos
  fetchInsumos: (page?: number, limit?: number, search?: string, categoria?: string, stockStatus?: string) => Promise<void>;
  fetchInsumoById: (id: string) => Promise<void>;
  addInsumo: (data: Partial<Insumo>) => Promise<void>;
  updateInsumo: (id: string, data: Partial<Insumo>) => Promise<void>;
  removeInsumo: (id: string) => Promise<void>;
  secureRemoveInsumo: (id: string, password: string) => Promise<void>;
  
  // Acciones Proveedores
  fetchProveedores: () => Promise<void>;
  addProveedor: (data: Partial<Proveedor>) => Promise<void>;

  // Acciones Personal de Obra
  fetchPersonal: (page?: number, limit?: number, proyectoId?: string, activo?: string, search?: string, dateFrom?: string, dateTo?: string) => Promise<void>;
  fetchPersonalByProyecto: (proyectoId: string) => Promise<void>;
  addPersonal: (data: any) => Promise<void>;
  updatePersonal: (id: string, data: any) => Promise<void>;
  removePersonal: (id: string) => Promise<void>;

  // Acciones Órdenes de Compra
  fetchOrdenes: (page?: number, limit?: number, search?: string, estado?: string, dateFrom?: string, dateTo?: string) => Promise<void>;
  createOrden: (data: any) => Promise<void>;
  updateOrden: (id: string, data: any) => Promise<void>;
  secureRemoveOrden: (id: string, password: string) => Promise<void>;
  updateEstadoOrden: (id: string, estado: EstadoCompra) => Promise<void>;

  // Acciones Almacén / Despacho / Kardex
  registrarDespacho: (data: { insumoId: string, cantidad: number, proyectoId: string, motivo?: string }) => Promise<void>;
  fetchMovimientosProyecto: (proyectoId: string) => Promise<void>;
  fetchMovimientos: (page?: number, limit?: number, search?: string, tipo?: string) => Promise<void>;

  // Acciones Compromiso Financiero Mano de Obra
  generarCompromisoPersonal: (id: string, diasTrabajo: number) => Promise<any>;
  generarCompromisoPersonalPorProyecto: (proyectoId: string) => Promise<any>;
  costosPersonal: any | null;
  fetchCostosPersonal: (proyectoId: string) => Promise<void>;
  projectProfitability: any | null;
  fetchProjectProfitability: (proyectoId: string) => Promise<void>;

  // Utilidades
  getInsumosStockBajo: () => Insumo[];
}

// ============================================
// IMPLEMENTACIÓN DEL STORE
// ============================================

export const useLogisticaStore = create<LogisticaState>()(
  persist(
    (set, get) => ({
      insumos: [],
      currentInsumo: null,
      proveedores: [],
      ordenes: [],
      movimientosProyecto: [],
      totalInsumos: 0,
      insumoPage: 1,
      insumoLimit: 20,
      insumoTotalPages: 0,

      inventoryStats: {
        totalInversion: 0,
        lowStockCount: 0,
        totalItems: 0,
      },

      totalOrdenes: 0,
      montoTotalOrdenes: 0,
      ordenPage: 1,
      ordenTotalPages: 0,

      personal: [],
      personalProyecto: [],
      totalPersonal: 0,
      personalPage: 1,
      personalTotalPages: 0,

      movimientos: [],
      totalMovimientos: 0,
      movimientoPage: 1,
      movimientoTotalPages: 0,

      loading: false,
      error: null,

      fetchInsumos: async (page = 1, limit = 20, search = "", categoria = "all", stockStatus = "all") => {
        set({ loading: true, error: null });
        try {
          const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
          });
          if (search) queryParams.append('search', search);
          if (categoria && categoria !== 'all') queryParams.append('categoria', categoria);
          if (stockStatus && stockStatus !== 'all') queryParams.append('stockStatus', stockStatus);

          const response = await api.get(`/logistica/insumos?${queryParams.toString()}`);
          
          let rawData = [];
          let total = 0;
          let totalP = 1;

          if (response && response.data && Array.isArray(response.data)) {
            rawData = response.data;
            total = response.total || rawData.length;
            totalP = response.totalPages || Math.ceil(total / limit) || 1;
          } else if (Array.isArray(response)) {
            rawData = response;
            total = rawData.length;
            totalP = Math.ceil(total / limit) || 1;
          }

          set({ 
            insumos: rawData, 
            totalInsumos: total,
            insumoPage: page,
            insumoLimit: limit,
            insumoTotalPages: totalP,
            inventoryStats: response.stats || get().inventoryStats,
            loading: false 
          });
        } catch (err: any) {
          console.error("Error fetching insumos:", err);
          set({ error: err.message, loading: false });
        }
      },

      fetchInsumoById: async (id) => {
        set({ loading: true, error: null });
        try {
          const data = await api.get(`/logistica/insumos/${id}`);
          set({ currentInsumo: data, loading: false });
        } catch (err: any) {
          set({ error: err.message, loading: false });
        }
      },

      addInsumo: async (data) => {
        set({ loading: true, error: null });
        try {
          await api.post('/logistica/insumos', data);
          await get().fetchInsumos();
        } catch (err: any) {
          set({ error: err.message, loading: false });
          throw err;
        }
      },

      updateInsumo: async (id, data) => {
        set({ loading: true, error: null });
        try {
          await api.put(`/logistica/insumos/${id}`, data);
          await get().fetchInsumos();
        } catch (err: any) {
          set({ error: err.message, loading: false });
          throw err;
        }
      },

      removeInsumo: async (id) => {
        set({ loading: true, error: null });
        try {
          await api.delete(`/logistica/insumos/${id}`);
          await get().fetchInsumos();
        } catch (err: any) {
          set({ error: err.message, loading: false });
          throw err;
        }
      },

      secureRemoveInsumo: async (id, password) => {
        set({ loading: true, error: null });
        try {
          await api.post(`/logistica/insumos/${id}/secure-delete`, { password });
          await get().fetchInsumos();
        } catch (err: any) {
          set({ error: err.message, loading: false });
          throw err;
        }
      },

      fetchProveedores: async () => {
        set({ loading: true, error: null });
        try {
          const data = await api.get('/logistica/proveedores');
          set({ proveedores: data, loading: false });
        } catch (err: any) {
          set({ error: err.message, loading: false });
        }
      },

      addProveedor: async (data) => {
        set({ loading: true, error: null });
        try {
          await api.post('/logistica/proveedores', data);
          await get().fetchProveedores();
        } catch (err: any) {
          set({ error: err.message, loading: false });
          throw err;
        }
      },

      fetchOrdenes: async (page = 1, limit = 20, search = "", estado?: string, dateFrom?: string, dateTo?: string) => {
        set({ loading: true, error: null });
        try {
          const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
          });
          if (search) queryParams.append('search', search);
          if (estado && estado !== "ALL" && estado !== "TODOS") queryParams.append('estado', estado);
          if (dateFrom) queryParams.append('dateFrom', dateFrom);
          if (dateTo) queryParams.append('dateTo', dateTo);

          const response = await api.get(`/logistica/ordenes?${queryParams.toString()}`);
          
          let rawData = [];
          let total = 0;
          let totalP = 1;
          let totalMonto = 0;

          if (response && response.data && Array.isArray(response.data)) {
            rawData = response.data;
            total = response.total || rawData.length;
            totalP = response.totalPages || Math.ceil(total / limit) || 1;
            totalMonto = response.totalMonto || 0;
          } else if (Array.isArray(response)) {
            rawData = response;
            total = rawData.length;
            totalP = Math.ceil(total / limit) || 1;
          }

          set({ 
            ordenes: rawData, 
            totalOrdenes: total,
            montoTotalOrdenes: totalMonto,
            ordenPage: page,
            ordenTotalPages: totalP,
            loading: false 
          });
        } catch (err: any) {
          set({ error: err.message, loading: false });
        }
      },

      createOrden: async (data) => {
        set({ loading: true, error: null });
        try {
          await api.post('/logistica/ordenes', data);
          await get().fetchOrdenes();
        } catch (err: any) {
          set({ error: err.message, loading: false });
          throw err;
        }
      },

      updateOrden: async (id, data) => {
        set({ loading: true, error: null });
        try {
          await api.patch(`/logistica/ordenes/${id}`, data);
          await get().fetchOrdenes();
        } catch (err: any) {
          set({ error: err.message, loading: false });
          throw err;
        }
      },

      secureRemoveOrden: async (id, password) => {
        set({ loading: true, error: null });
        try {
          await api.post(`/logistica/ordenes/${id}/secure-delete`, { password });
          await get().fetchOrdenes();
        } catch (err: any) {
          set({ error: err.message, loading: false });
          throw err;
        }
      },

      updateEstadoOrden: async (id, estado) => {
        set({ loading: true, error: null });
        try {
          await api.put(`/logistica/ordenes/${id}/estado`, { estado });
          await Promise.all([
            get().fetchOrdenes(),
            get().fetchInsumos()
          ]);
        } catch (err: any) {
          set({ error: err.message, loading: false });
          throw err;
        }
      },

      fetchPersonal: async (page = 1, limit = 50, proyectoId?: string, activo?: string, search?: string, dateFrom?: string, dateTo?: string) => {
        set({ loading: true, error: null });
        try {
          const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
          });
          if (proyectoId) queryParams.append('proyectoId', proyectoId);
          if (activo && activo !== 'all') queryParams.append('activo', activo);
          if (search) queryParams.append('search', search);
          if (dateFrom) queryParams.append('dateFrom', dateFrom);
          if (dateTo) queryParams.append('dateTo', dateTo);

          const response = await api.get(`/logistica/personal?${queryParams.toString()}`);
          
          let rawData = [];
          let total = 0;
          let totalP = 1;

          if (response && response.data && Array.isArray(response.data)) {
            rawData = response.data;
            total = response.total || rawData.length;
            totalP = response.totalPages || Math.ceil(total / limit) || 1;
          } else if (Array.isArray(response)) {
            rawData = response;
            total = rawData.length;
            totalP = Math.ceil(total / limit) || 1;
          }

          set({ 
            personal: rawData, 
            totalPersonal: total,
            personalPage: page,
            personalTotalPages: totalP,
            loading: false 
          });
        } catch (err: any) {
          set({ error: err.message, loading: false });
        }
      },

      fetchPersonalByProyecto: async (proyectoId) => {
        set({ loading: true, error: null });
        try {
          const data = await api.get(`/logistica/personal/proyecto/${proyectoId}`);
          set({ personalProyecto: data, loading: false });
        } catch (err: any) {
          set({ error: err.message, loading: false });
        }
      },

      addPersonal: async (data) => {
        set({ loading: true, error: null });
        try {
          await api.post('/logistica/personal', data);
          await get().fetchPersonal();
        } catch (err: any) {
          set({ error: err.message, loading: false });
          throw err;
        }
      },

      updatePersonal: async (id, data) => {
        set({ loading: true, error: null });
        try {
          await api.put(`/logistica/personal/${id}`, data);
          await get().fetchPersonal();
        } catch (err: any) {
          set({ error: err.message, loading: false });
          throw err;
        }
      },

      removePersonal: async (id) => {
        set({ loading: true, error: null });
        try {
          await api.delete(`/logistica/personal/${id}`);
          await get().fetchPersonal();
        } catch (err: any) {
          set({ error: err.message, loading: false });
          throw err;
        }
      },

      registrarDespacho: async (data) => {
        set({ loading: true, error: null });
        try {
          await api.post('/logistica/despacho', data);
          await get().fetchInsumos();
        } catch (err: any) {
          set({ error: err.message, loading: false });
          throw err;
        }
      },

      fetchMovimientosProyecto: async (proyectoId) => {
        set({ loading: true, error: null });
        try {
          const data = await api.get(`/logistica/proyecto/${proyectoId}/movimientos`);
          set({ movimientosProyecto: data, loading: false });
        } catch (err: any) {
          set({ error: err.message, loading: false });
        }
      },

      fetchMovimientos: async (page = 1, limit = 20, search = "", tipo = "all") => {
        set({ loading: true, error: null });
        try {
          const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
          });
          if (search) queryParams.append('search', search);
          if (tipo && tipo !== 'all') queryParams.append('tipo', tipo);

          const response = await api.get(`/logistica/movimientos?${queryParams.toString()}`);
          
          let rawData = [];
          let total = 0;
          let totalP = 1;

          if (response && response.data && Array.isArray(response.data)) {
            rawData = response.data;
            total = response.total || rawData.length;
            totalP = response.totalPages || Math.ceil(total / limit) || 1;
          } else if (Array.isArray(response)) {
            rawData = response;
            total = rawData.length;
            totalP = Math.ceil(total / limit) || 1;
          }

          set({ 
            movimientos: rawData, 
            totalMovimientos: total,
            movimientoPage: page,
            movimientoTotalPages: totalP,
            loading: false 
          });
        } catch (err: any) {
          set({ error: err.message, loading: false });
        }
      },

      // Compromiso Financiero Mano de Obra
      costosPersonal: null,
      projectProfitability: null,

      generarCompromisoPersonal: async (id, diasTrabajo) => {
        set({ loading: true, error: null });
        try {
          const result = await api.post(`/logistica/personal/${id}/comprometer`, { diasTrabajo });
          await get().fetchPersonal();
          set({ loading: false });
          return result;
        } catch (err: any) {
          set({ error: err.message, loading: false });
          throw err;
        }
      },

      generarCompromisoPersonalPorProyecto: async (proyectoId) => {
        set({ loading: true, error: null });
        try {
          const result = await api.post(`/logistica/personal/comprometer-proyecto/${proyectoId}`, {});
          await get().fetchPersonal();
          set({ loading: false });
          return result;
        } catch (err: any) {
          set({ error: err.message, loading: false });
          throw err;
        }
      },

      fetchCostosPersonal: async (proyectoId) => {
        set({ loading: true, error: null });
        try {
          const data = await api.get(`/logistica/personal/costos/${proyectoId}`);
          set({ costosPersonal: data, loading: false });
        } catch (err: any) {
          set({ error: err.message, loading: false });
        }
      },

      fetchProjectProfitability: async (proyectoId) => {
        try {
          const data = await api.get(`/finanzas/proyectos/${proyectoId}/profitability`);
          set({ projectProfitability: data });
        } catch (err: any) {
          console.error('Error al obtener rentabilidad del proyecto:', err);
        }
      },

      getInsumosStockBajo: () => {
        return get().insumos.filter(i => i.stockActual <= i.stockMinimo);
      }
    }),
    {
      name: 'hht-logistica-store-real',
    }
  )
);
