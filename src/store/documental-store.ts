import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getPeruDateString } from "@/lib/utils";


export type Area = 'Steven' | 'Diego' | 'Guillermo' | 'Mario';

export type TipoDocumento = 'Técnico' | 'Administrativo' | 'Legal' | 'Financiero' | 'Otro';

export type EstadoDocumento = 'Borrador' | 'Pendiente Revisión' | 'Revisado' | 'Aprobado' | 'Obsoleto';

export type SubtipoDocumento =
  // Técnicos
  | 'Memoria Técnica'
  | 'Plano Eléctrico'
  | 'Diagrama Unifilar'
  | 'Especificación Técnica'
  | 'Informe Técnico'
  | 'Certificado de Qualidade'
  | 'Manual de Operaciones'
  | 'Plan de Mantenimiento'
  // Administrativos
  | 'Acta de Reunión'
  | 'Convenio'
  | 'Solicitud'
  | 'Carta'
  | 'Memorándum'
  // Legales
  | 'Contrato'
  | 'Adenda'
  | 'Garantía'
  | 'Póliza'
  | 'Licencia'
  // Financieros
  | 'Factura'
  | 'Boleta'
  | 'Recibo'
  | 'Orden de Compra'
  | 'Cotización'
  | 'Presupuesto';

// ============================================
// DOCUMENTO
// ============================================

export interface Documento {
  id: string;
  proyectoId?: string;
  clientId?: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipo: TipoDocumento;
  subtipo: SubtipoDocumento;
  numero?: string;
  version: string;
  url: string;
  urlPreview?: string;
  estado: EstadoDocumento;
  subidoPor: string;
  area: Area;
  fechaCreacion: string;
  fechaSubida: string;
  fechaVencimiento?: string;
  fechaAprobacion?: string;
  aprobadoPor?: string;
  validaciones: ValidacionDocumento[];
  observaciones?: string;
  etiquetas: string[];
  historial: HistorialDocumento[];
}

export interface ValidacionDocumento {
  id: string;
  tipo: 'Técnica' | 'Legal' | 'Administrativa' | 'Calidad';
  area: Area;
  estado: 'Pendiente' | 'Aprobado' | 'Rechazado';
  validadoPor?: string;
  fecha?: string;
  observaciones?: string;
}

export interface HistorialDocumento {
  id: string;
  accion: string;
  usuario: string;
  area: Area;
  fecha: string;
  detalles?: string;
}

// ============================================
// EXPEDIENTE TÉCNICO
// ============================================

export interface ExpedienteTecnico {
  id: string;
  proyectoId: string;
  codigo: string;
  nombre: string;
  estado: 'En Elaboración' | 'Completo' | 'Archivado';
  documentos: Documento[];
  fechaCreacion: string;
  fechaCierre?: string;
  responsable: string;
  area: Area;
  observaciones?: string;
}

// ============================================
// PLANTILLAS
// ============================================

export interface Plantilla {
  id: string;
  nombre: string;
  tipo: TipoDocumento;
  subtipo: SubtipoDocumento;
  contenido?: string;
  url?: string;
  area: Area;
}

// ============================================
// INTERFAZ DEL STORE
// ============================================

interface DocumentalState {
  documentos: Documento[];
  expedientes: ExpedienteTecnico[];
  plantillas: Plantilla[];

  // Filtros
  filtros: {
    searchQuery: string;
    tipo: string;
    subtipo: string;
    estado: string;
    area: string;
    proyectoId: string;
  };

  // Acciones de Documentos
  addDocumento: (documento: Omit<Documento, 'id' | 'codigo' | 'historial'>) => void;
  updateDocumento: (documento: Documento) => void;
  deleteDocumento: (id: string) => void;
  aprobarDocumento: (id: string, aprobadoPor: string) => void;
  rechazarDocumento: (id: string, observaciones: string) => void;
  agregarValidacion: (documentoId: string, validacion: Omit<ValidacionDocumento, 'id'>) => void;

  // Acciones de Expedientes
  createExpediente: (expediente: Omit<ExpedienteTecnico, 'id' | 'codigo' | 'documentos' | 'historial'>) => void;
  addDocumentoToExpediente: (expedienteId: string, documentoId: string) => void;
  closeExpediente: (expedienteId: string) => void;

  // Filtros
  setFiltro: (tipo: 'searchQuery' | 'tipo' | 'subtipo' | 'estado' | 'area' | 'proyectoId', valor: string) => void;
  resetFiltros: () => void;

  // Utilidades
  getDocumentosPorProyecto: (proyectoId: string) => Documento[];
  getDocumentosPorEstado: (estado: EstadoDocumento) => Documento[];
  getDocumentosVencidos: () => Documento[];
  getDocumentosPendientesRevision: () => Documento[];
}

// ============================================
// DATOS INICIALES
// ============================================

const DOCUMENTOS_DEFAULT: Documento[] = [
  {
    id: 'doc_1',
    proyectoId: 'HHT-OPE-00001-01',
    codigo: 'HHT-DOC-001',
    nombre: 'Memoria Técnica - Subestación RIO VERDE',
    descripcion: 'Memoria técnica de cálculo para mantenimiento de subestación MT',
    tipo: 'Técnico',
    subtipo: 'Memoria Técnica',
    numero: 'MT-001-2026',
    version: '1.0',
    url: '/docs/memoria-tecnica-rio-verde.pdf',
    estado: 'Aprobado',
    subidoPor: 'Diego',
    area: 'Diego',
    fechaCreacion: '2026-05-10',
    fechaSubida: '2026-05-12',
    fechaAprobacion: '2026-05-14',
    aprobadoPor: 'Ing. Carlos Mendoza',
    validaciones: [
      {
        id: 'val_1',
        tipo: 'Técnica',
        area: 'Diego',
        estado: 'Aprobado',
        validadoPor: 'Diego',
        fecha: '2026-05-14'
      }
    ],
    observaciones: 'Documento aprobado para ejecución',
    etiquetas: ['subestación', 'mt', 'mantenimiento'],
    historial: [
      {
        id: 'hist_1',
        accion: 'Creación',
        usuario: 'Diego',
        area: 'Diego',
        fecha: '2026-05-10'
      },
      {
        id: 'hist_2',
        accion: 'Subida de archivo',
        usuario: 'Diego',
        area: 'Diego',
        fecha: '2026-05-12'
      },
      {
        id: 'hist_3',
        accion: 'Aprobación',
        usuario: 'Ing. Carlos Mendoza',
        area: 'Diego',
        fecha: '2026-05-14'
      }
    ]
  },
  {
    id: 'doc_2',
    proyectoId: 'HHT-OPE-00001-01',
    codigo: 'HHT-DOC-002',
    nombre: 'Planos Unifilares - Subestación RIO VERDE',
    descripcion: 'Planos eléctricos unifilares de la subestación',
    tipo: 'Técnico',
    subtipo: 'Plano Eléctrico',
    numero: 'PL-001-2026',
    version: '2.0',
    url: '/docs/planos-rio-verde.pdf',
    estado: 'Pendiente Revisión',
    subidoPor: 'Guillermo',
    area: 'Guillermo',
    fechaCreacion: '2026-05-15',
    fechaSubida: '2026-05-16',
    validaciones: [],
    etiquetas: ['subestación', 'planos', 'unifilar'],
    historial: [
      {
        id: 'hist_4',
        accion: 'Creación',
        usuario: 'Guillermo',
        area: 'Guillermo',
        fecha: '2026-05-15'
      },
      {
        id: 'hist_5',
        accion: 'Subida de archivo',
        usuario: 'Guillermo',
        area: 'Guillermo',
        fecha: '2026-05-16'
      }
    ]
  },
  {
    id: 'doc_3',
    codigo: 'HHT-DOC-003',
    nombre: 'Contrato Marco de Servicios',
    descripcion: 'Contrato marco de servicios eléctricos con RIO VERDE',
    tipo: 'Legal',
    subtipo: 'Contrato',
    numero: 'CM-2026-001',
    version: '1.0',
    url: '/docs/contrato-marco-rio-verde.pdf',
    estado: 'Aprobado',
    subidoPor: 'Guillermo',
    area: 'Guillermo',
    fechaCreacion: '2026-01-15',
    fechaSubida: '2026-01-16',
    fechaAprobacion: '2026-01-18',
    aprobadoPor: 'Abg. Patricia Salas',
    validaciones: [
      {
        id: 'val_2',
        tipo: 'Legal',
        area: 'Guillermo',
        estado: 'Aprobado',
        validadoPor: 'Abg. Patricia Salas',
        fecha: '2026-01-18'
      }
    ],
    etiquetas: ['contrato', 'rio verde', 'servicios'],
    historial: []
  }
];

const PLANTILLAS_DEFAULT: Plantilla[] = [
  { id: 'pla_1', nombre: 'Memoria Técnica Estándar', tipo: 'Técnico', subtipo: 'Memoria Técnica', area: 'Diego' },
  { id: 'pla_2', nombre: 'Acta de Reunión', tipo: 'Administrativo', subtipo: 'Acta de Reunión', area: 'Guillermo' },
  { id: 'pla_3', nombre: 'Informe Técnico', tipo: 'Técnico', subtipo: 'Informe Técnico', area: 'Diego' },
  { id: 'pla_4', nombre: 'Carta de Presentación', tipo: 'Administrativo', subtipo: 'Carta', area: 'Steven' },
];

// ============================================
// IMPLEMENTACIÓN DEL STORE
// ============================================

const getNextDocumentCode = (documentos: Documento[]): string => {
  const count = documentos.length + 1;
  return `HHT-DOC-${count.toString().padStart(3, '0')}`;
};

export const useDocumentalStore = create<DocumentalState>()(
  persist(
    (set, get) => ({
      documentos: DOCUMENTOS_DEFAULT,
      expedientes: [],
      plantillas: PLANTILLAS_DEFAULT,

      filtros: {
        searchQuery: '',
        tipo: 'all',
        subtipo: 'all',
        estado: 'all',
        area: 'all',
        proyectoId: 'all',
      },

      addDocumento: (documentoData) => set((state) => {
        const codigo = getNextDocumentCode(state.documentos);
        const today = getPeruDateString();
        const nuevo: Documento = {
          ...documentoData,
          id: `doc_${Date.now()}`,
          codigo,
          historial: [
            {
              id: `hist_${Date.now()}`,
              accion: 'Creación',
              usuario: documentoData.subidoPor,
              area: documentoData.area,
              fecha: today
            }
          ]
        };
        return { documentos: [nuevo, ...state.documentos] };
      }),

      updateDocumento: (documentoActualizado) => set((state) => {
        const today = getPeruDateString();
        const historialActualizado: HistorialDocumento = {
          id: `hist_${Date.now()}`,
          accion: 'Actualización',
          usuario: 'Sistema',
          area: 'Steven',
          fecha: today
        };

        return {
          documentos: state.documentos.map((d) =>
            d.id === documentoActualizado.id
              ? { ...documentoActualizado, historial: [...d.historial, historialActualizado] }
              : d
          )
        };
      }),

      deleteDocumento: (id) => set((state) => ({
        documentos: state.documentos.filter((d) => d.id !== id)
      })),

      aprobarDocumento: (id, aprobadoPor) => set((state) => {
        const today = getPeruDateString();

        return {
          documentos: state.documentos.map((d) => {
            if (d.id !== id) return d;

            const historialNuevo: HistorialDocumento = {
              id: `hist_${Date.now()}`,
              accion: 'Aprobación',
              usuario: aprobadoPor,
              area: 'Diego',
              fecha: today
            };

            return {
              ...d,
              estado: 'Aprobado' as EstadoDocumento,
              fechaAprobacion: today,
              aprobadoPor,
              historial: [...d.historial, historialNuevo]
            };
          })
        };
      }),

      rechazarDocumento: (id, observaciones) => set((state) => {
        const today = getPeruDateString();

        return {
          documentos: state.documentos.map((d) => {
            if (d.id !== id) return d;

            const historialNuevo: HistorialDocumento = {
              id: `hist_${Date.now()}`,
              accion: 'Rechazo',
              usuario: 'Sistema',
              area: 'Diego',
              fecha: today,
              detalles: observaciones
            };

            return {
              ...d,
              estado: 'Borrador' as EstadoDocumento,
              observaciones,
              historial: [...d.historial, historialNuevo]
            };
          })
        };
      }),

      agregarValidacion: (documentoId, validacionData) => set((state) => {
        const validacion: ValidacionDocumento = {
          ...validacionData,
          id: `val_${Date.now()}`
        };

        return {
          documentos: state.documentos.map((d) =>
            d.id === documentoId
              ? { ...d, validaciones: [...d.validaciones, validacion] }
              : d
          )
        };
      }),

      createExpediente: (expedienteData) => set((state) => {
        const count = state.expedientes.length + 1;
        const codigo = `EXP-${new Date().getFullYear()}-${count.toString().padStart(3, '0')}`;
        const nuevo: ExpedienteTecnico = {
          ...expedienteData,
          id: `exp_${Date.now()}`,
          codigo,
          documentos: []
        };
        return { expedientes: [...state.expedientes, nuevo] };
      }),

      addDocumentoToExpediente: (expedienteId, documentoId) => set((state) => ({
        expedientes: state.expedientes.map((e) =>
          e.id === expedienteId
            ? { ...e, documentos: [...e.documentos, state.documentos.find(d => d.id === documentoId)!] }
            : e
        )
      })),

      closeExpediente: (expedienteId) => set((state) => {
        const today = getPeruDateString();

        return {
          expedientes: state.expedientes.map((e) =>
            e.id === expedienteId
              ? { ...e, estado: 'Archivado' as 'Archivado', fechaCierre: today }
              : e
          )
        };
      }),

      setFiltro: (tipo, valor) => set((state) => ({
        filtros: { ...state.filtros, [tipo]: valor }
      })),

      resetFiltros: () => set({
        filtros: {
          searchQuery: '',
          tipo: 'all',
          subtipo: 'all',
          estado: 'all',
          area: 'all',
          proyectoId: 'all',
        }
      }),

      getDocumentosPorProyecto: (proyectoId) => {
        return get().documentos.filter(d => d.proyectoId === proyectoId);
      },

      getDocumentosPorEstado: (estado) => {
        return get().documentos.filter(d => d.estado === estado);
      },

      getDocumentosVencidos: () => {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        return get().documentos.filter(d => {
          if (!d.fechaVencimiento) return false;
          return new Date(d.fechaVencimiento) < hoy;
        });
      },

      getDocumentosPendientesRevision: () => {
        return get().documentos.filter(d => d.estado === 'Pendiente Revisión');
      }
    }),
    {
      name: 'hht-documental-store',
      partialize: (state) => ({
        ...state,
        filtros: {
          searchQuery: '',
          tipo: 'all',
          subtipo: 'all',
          estado: 'all',
          area: 'all',
          proyectoId: 'all',
        }
      })
    }
  )
);