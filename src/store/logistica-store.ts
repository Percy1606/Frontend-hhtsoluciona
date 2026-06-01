import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================
// TIPOS PRINCIPALES
// ============================================

export type Area = 'Steven' | 'Diego' | 'Guillermo' | 'Mario';

export type TipoItem = 'Equipo' | 'Material' | 'Herramienta' | 'Consumible';

export type EstadoItem = 'Disponible' | 'Asignado' | 'En Uso' | 'Mantenimiento' | 'Dañado' | 'Reservado';

export type EstadoAsignacion = 'Pendiente' | 'Aprobada' | 'Rechazada' | 'Devuelto';

// ============================================
// MATERIALES / EQUIPOS
// ============================================

export interface Material {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipo: TipoItem;
  cantidad: number;
  cantidadMinima: number;
  unidad: string;
  estado: EstadoItem;
  ubicacion?: string;
  proveedor?: string;
  costoUnitario?: number;
  imagen?: string;
  seriales?: string[]; // Para equipos con serial
  fechaAdquisicion?: string;
  vidaUtil?: number; // en meses
  mantenimientoProximo?: string;
}

// ============================================
// ASIGNACIONES
// ============================================

export interface Asignacion {
  id: string;
  materialId: string;
  proyectoId?: string;
  usuarioId?: string;
  cantidad: number;
  fechaSolicitud: string;
  fechaAprobacion?: string;
  fechaAsignacion?: string;
  fechaDevolucion?: string;
  estado: EstadoAsignacion;
  solicitadoPor: string;
  aprobadoPor?: string;
  area: Area;
  observaciones?: string;
  motivoRechazo?: string;
}

// ============================================
// SOLICITUDES DE MATERIALES
// ============================================

export interface SolicitudMaterial {
  id: string;
  proyectoId: string;
  solicitante: string;
  area: Area;
  fechaSolicitud: string;
  items: {
    materialId: string;
    cantidad: number;
    observaciones?: string;
  }[];
  estado: 'Pendiente' | 'Aprobada' | 'Rechazada' | 'Parcial';
  fechaAprobacion?: string;
  aprobadoPor?: string;
  observaciones?: string;
}

// ============================================
// ORDENES DE COMPRA
// ============================================

export interface OrdenCompra {
  id: string;
  numero: string;
  proveedor: string;
  ruc: string;
  fechaOrden: string;
  fechaEntregaEstimada?: string;
  items: {
    materialId: string;
    nombre: string;
    cantidad: number;
    precioUnitario: number;
    total: number;
  }[];
  total: number;
  estado: 'Pendiente' | 'Aprobada' | 'Enviada' | 'Recibida' | 'Cancelada';
  observaciones?: string;
}

// ============================================
// INTERFAZ DEL STORE
// ============================================

interface LogisticaState {
  materiales: Material[];
  asignaciones: Asignacion[];
  solicitudes: SolicitudMaterial[];
  ordenesCompra: OrdenCompra[];

  // Filtros
  filtrosMateriales: {
    searchQuery: string;
    tipo: string;
    estado: string;
    ubicacion: string;
  };

  // Acciones de Materiales
  addMaterial: (material: Omit<Material, 'id' | 'codigo'>) => void;
  updateMaterial: (material: Material) => void;
  deleteMaterial: (id: string) => void;
  updateCantidad: (id: string, cantidad: number) => void;

  // Acciones de Asignaciones
  addAsignacion: (asignacion: Omit<Asignacion, 'id'>) => void;
  approveAsignacion: (id: string, aprobadoPor: string) => void;
  rejectAsignacion: (id: string, motivo: string) => void;
  devolverMaterial: (id: string) => void;

  // Acciones de Solicitudes
  addSolicitud: (solicitud: Omit<SolicitudMaterial, 'id'>) => void;
  approveSolicitud: (id: string, aprobadoPor: string) => void;
  rejectSolicitud: (id: string, observaciones: string) => void;

  // Acciones de Órdenes de Compra
  addOrdenCompra: (orden: Omit<OrdenCompra, 'id' | 'numero'>) => void;
  updateOrdenCompra: (orden: OrdenCompra) => void;

  // Filtros
  setFiltroMateriales: (tipo: 'searchQuery' | 'tipo' | 'estado' | 'ubicacion', valor: string) => void;
  resetFiltrosMateriales: () => void;

  // Utilidades
  getMaterialesPorEstado: (estado: EstadoItem) => Material[];
  getMaterialesStockBajo: () => Material[];
  getAsignacionesActivas: () => Asignacion[];
  getSolicitudesPendientes: () => SolicitudMaterial[];
}

// ============================================
// DATOS INICIALES
// ============================================

const MATERIALES_DEFAULT: Material[] = [
  {
    id: 'mat_1',
    codigo: 'EQ-001',
    nombre: 'Megómetro Digital 5000V',
    descripcion: 'Equipo para medición de resistencia de aislamiento',
    tipo: 'Equipo',
    cantidad: 2,
    cantidadMinima: 1,
    unidad: 'und',
    estado: 'Disponible',
    ubicacion: 'Almacén Principal',
    proveedor: 'Instruments Peru',
    costoUnitario: 2500,
    seriales: ['MEG-2024-001', 'MEG-2024-002']
  },
  {
    id: 'mat_2',
    codigo: 'EQ-002',
    nombre: 'Analizador de Calidad de Energía',
    descripcion: 'Equipo para análisis de armónicos y factor de potencia',
    tipo: 'Equipo',
    cantidad: 1,
    cantidadMinima: 1,
    unidad: 'und',
    estado: 'En Uso',
    ubicacion: 'En campo - Proyecto RIO VERDE',
    proveedor: 'Fluke Peru',
    costoUnitario: 8500,
    seriales: ['FLK-2023-015']
  },
  {
    id: 'mat_3',
    codigo: 'MAT-001',
    nombre: 'Cable NYY 2x4mm',
    descripcion: 'Cable conductor 2x4mm negro',
    tipo: 'Material',
    cantidad: 500,
    cantidadMinima: 100,
    unidad: 'ml',
    estado: 'Disponible',
    ubicacion: 'Almacén Principal',
    costoUnitario: 2.5
  },
  {
    id: 'mat_4',
    codigo: 'HER-001',
    nombre: 'Juego de Llaves Francesas',
    descripcion: 'Juego de llaves ajustable 10"',
    tipo: 'Herramienta',
    cantidad: 5,
    cantidadMinima: 2,
    unidad: 'und',
    estado: 'Disponible',
    ubicacion: 'Almacén Principal'
  },
  {
    id: 'mat_5',
    codigo: 'CON-001',
    nombre: 'Cinta Aislante 3M',
    descripcion: 'Cinta aislante de caucho negra 3M',
    tipo: 'Consumible',
    cantidad: 20,
    cantidadMinima: 10,
    unidad: 'und',
    estado: 'Disponible',
    ubicacion: 'Almacén Secundario',
    costoUnitario: 8
  },
  {
    id: 'mat_6',
    codigo: 'EQ-003',
    nombre: 'Cámara Termográfica',
    descripcion: 'Cámara para detección de puntos calientes',
    tipo: 'Equipo',
    cantidad: 1,
    cantidadMinima: 1,
    unidad: 'und',
    estado: 'Mantenimiento',
    ubicacion: 'Taller',
    proveedor: 'Fluke Peru',
    costoUnitario: 12000,
    mantenimientoProximo: '2026-06-15'
  }
];

// ============================================
// IMPLEMENTACIÓN DEL STORE
// ============================================

const getNextMaterialCode = (materiales: Material[], tipo: TipoItem): string => {
  const prefix = tipo === 'Equipo' ? 'EQ' : tipo === 'Herramienta' ? 'HER' : tipo === 'Consumible' ? 'CON' : 'MAT';
  const count = materiales.filter(m => m.tipo === tipo).length + 1;
  return `${prefix}-${count.toString().padStart(3, '0')}`;
};

const getNextOrdenNumber = (ordenes: OrdenCompra[]): string => {
  const year = new Date().getFullYear();
  const count = ordenes.length + 1;
  return `OC-${year.toString().slice(-2)}${count.toString().padStart(4, '0')}`;
};

export const useLogisticaStore = create<LogisticaState>()(
  persist(
    (set, get) => ({
      materiales: MATERIALES_DEFAULT,
      asignaciones: [],
      solicitudes: [],
      ordenesCompra: [],

      filtrosMateriales: {
        searchQuery: '',
        tipo: 'all',
        estado: 'all',
        ubicacion: 'all',
      },

      addMaterial: (materialData) => set((state) => {
        const codigo = getNextMaterialCode(state.materiales, materialData.tipo);
        const nuevo: Material = {
          ...materialData,
          id: `mat_${Date.now()}`,
          codigo
        };
        return { materiales: [...state.materiales, nuevo] };
      }),

      updateMaterial: (materialActualizado) => set((state) => ({
        materiales: state.materiales.map((m) =>
          m.id === materialActualizado.id ? materialActualizado : m
        )
      })),

      deleteMaterial: (id) => set((state) => ({
        materiales: state.materiales.filter((m) => m.id !== id)
      })),

      updateCantidad: (id, cantidad) => set((state) => ({
        materiales: state.materiales.map((m) =>
          m.id === id ? { ...m, cantidad } : m
        )
      })),

      addAsignacion: (asignacionData) => set((state) => {
        const nueva: Asignacion = {
          ...asignacionData,
          id: `asig_${Date.now()}`
        };

        // Actualizar estado del material
        const materiales = state.materiales.map((m) => {
          if (m.id === asignacionData.materialId) {
            return { ...m, estado: 'Asignado' as EstadoItem };
          }
          return m;
        });

        return {
          asignaciones: [...state.asignaciones, nueva],
          materiales
        };
      }),

      approveAsignacion: (id, aprobadoPor) => set((state) => {
        const today = new Date().toISOString().split('T')[0];

        return {
          asignaciones: state.asignaciones.map((a) =>
            a.id === id
              ? { ...a, estado: 'Aprobada' as EstadoAsignacion, aprobadoPor, fechaAprobacion: today }
              : a
          )
        };
      }),

      rejectAsignacion: (id, motivo) => set((state) => ({
        asignaciones: state.asignaciones.map((a) =>
          a.id === id
            ? { ...a, estado: 'Rechazada' as EstadoAsignacion, motivoRechazo: motivo }
            : a
        )
      })),

      devolverMaterial: (id) => set((state) => {
        const today = new Date().toISOString().split('T')[0];
        const asignacion = state.asignaciones.find(a => a.id === id);

        if (!asignacion) return state;

        // Actualizar estado del material a disponible
        const materiales = state.materiales.map((m) => {
          if (m.id === asignacion.materialId) {
            return { ...m, estado: 'Disponible' as EstadoItem };
          }
          return m;
        });

        return {
          asignaciones: state.asignaciones.map((a) =>
            a.id === id
              ? { ...a, estado: 'Devuelto' as EstadoAsignacion, fechaDevolucion: today }
              : a
          ),
          materiales
        };
      }),

      addSolicitud: (solicitudData) => set((state) => {
        const nueva: SolicitudMaterial = {
          ...solicitudData,
          id: `sol_${Date.now()}`
        };
        return { solicitudes: [...state.solicitudes, nueva] };
      }),

      approveSolicitud: (id, aprobadoPor) => set((state) => {
        const today = new Date().toISOString().split('T')[0];

        return {
          solicitudes: state.solicitudes.map((s) =>
            s.id === id
              ? { ...s, estado: 'Aprobada' as 'Aprobada', aprobadoPor, fechaAprobacion: today }
              : s
          )
        };
      }),

      rejectSolicitud: (id, observaciones) => set((state) => ({
        solicitudes: state.solicitudes.map((s) =>
          s.id === id
            ? { ...s, estado: 'Rechazada' as 'Rechazada', observaciones }
            : s
        )
      })),

      addOrdenCompra: (ordenData) => set((state) => {
        const numero = getNextOrdenNumber(state.ordenesCompra);
        const nueva: OrdenCompra = {
          ...ordenData,
          id: `oc_${Date.now()}`,
          numero
        };
        return { ordenesCompra: [...state.ordenesCompra, nueva] };
      }),

      updateOrdenCompra: (ordenActualizada) => set((state) => ({
        ordenesCompra: state.ordenesCompra.map((o) =>
          o.id === ordenActualizada.id ? ordenActualizada : o
        )
      })),

      setFiltroMateriales: (tipo, valor) => set((state) => ({
        filtrosMateriales: { ...state.filtrosMateriales, [tipo]: valor }
      })),

      resetFiltrosMateriales: () => set({
        filtrosMateriales: {
          searchQuery: '',
          tipo: 'all',
          estado: 'all',
          ubicacion: 'all',
        }
      }),

      getMaterialesPorEstado: (estado) => {
        return get().materiales.filter(m => m.estado === estado);
      },

      getMaterialesStockBajo: () => {
        return get().materiales.filter(m => m.cantidad <= m.cantidadMinima);
      },

      getAsignacionesActivas: () => {
        return get().asignaciones.filter(a => a.estado === 'Aprobada' && !a.fechaDevolucion);
      },

      getSolicitudesPendientes: () => {
        return get().solicitudes.filter(s => s.estado === 'Pendiente');
      }
    }),
    {
      name: 'hht-logistica-store',
    }
  )
);