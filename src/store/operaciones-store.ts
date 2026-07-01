import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { format } from 'date-fns';
import { api } from '@/lib/api';
import { formatDate, getPeruDateString } from '@/lib/utils';
import { useAuthStore } from './auth-store';
import { useNotificationStore } from './notification-store';
import type {
  Area,
  Semaforo,
  Proyecto,
  Actividad,
  EstadoActividad,
  ValidacionRequerida,
  Responsable,
  Documento,
  Alerta,
  Evidencia,
  ReporteDiario,
  HistorialCambio,
  KPIPeriodo,
  FiltrosProyectos,
  EvaluacionTecnica,
  IngenieriaDiseno,
  ExpedienteTecnico,
  Suboperacion,
  Entregable,
  IndicadorAvance,
} from '@/lib/types';

// ============================================
// INTERFAZ DEL STORE
// ============================================

type AddProyectoData = Omit<Proyecto, 'id' | 'codigo' | 'avanceCalculado' | 'historialCambios' | 'semaforo'> & { cotizacionId?: string | null };

interface OperacionesState {
  proyectos: Proyecto[];
  totalProyectos: number;
  proyectoPage: number;
  proyectoLimit: number;
  proyectoTotalPages: number;
  
  responsables: Responsable[];
  
  fichasTecnicas: any[];
  totalFichas: number;
  fichaPage: number;
  fichaLimit: number;
  fichaTotalPages: number;
  fichaStats: { pending: number; completed: number };

  actividades: any[];
  totalActividades: number;
  actividadPage: number;
  actividadLimit: number;
  actividadTotalPages: number;

  alertas: Alerta[];
  kpis: KPIPeriodo[];
  loading: boolean;
  error: string | null;
  borradoresImpresion: Record<string, any>;
  borradoresConstancia: Record<string, any>;

  timelineEvents: any[];
  totalTimeline: number;
  timelinePage: number;
  timelineLimit: number;
  timelineTotalPages: number;

  fetchProyectos: (page?: number, limit?: number) => Promise<void>;
  fetchActividades: (page?: number, limit?: number, filters?: any) => Promise<void>;
  fetchTimeline: (page?: number, limit?: number, filters?: any) => Promise<void>;
  fetchResponsables: () => Promise<void>;
    fetchFichasTecnicas: (page?: number, limit?: number, tecnicoId?: string, search?: string, startDate?: string, endDate?: string) => Promise<void>;
  fetchActiveVisit: (clientId: string) => Promise<any | null>;
  submitFichaTecnica: (id: string, data: any) => Promise<void>;
  setBorradorImpresion: (fichaId: string, data: any) => void;
  setBorradorConstancia: (fichaId: string, data: any) => void;

  filtros: FiltrosProyectos;
  usuarioActual: string;
  areaActual: Area;

  setSearchQuery: (query: string) => void;
  setEstado: (estado: string) => void;
  setArea: (area: string) => void;
  setPrioridad: (prioridad: string) => void;
  setSemaforo: (semaforo: string) => void;
  setResponsable: (responsable: string) => void;
  setFechas: (inicio?: string, fin?: string) => void;
  resetFiltros: () => void;

  addProyecto: (proyecto: AddProyectoData) => Promise<string>;
  updateProyecto: (proyecto: Proyecto) => Promise<void>;
  deleteProyecto: (id: string) => Promise<void>;
  deleteProyectoSecure: (id: string, password: string) => Promise<void>;
  calcularAvanceProyecto: (proyectoId: string) => void;

  addEvaluacionTecnica: (proyectoId: string, evaluacion: Omit<EvaluacionTecnica, 'id' | 'proyectoId'>) => Promise<void>;
  addIngenieriaDiseno: (proyectoId: string, ingenieria: Omit<IngenieriaDiseno, 'id' | 'proyectoId'>) => Promise<void>;
  addExpedienteTecnico: (proyectoId: string, expediente: Omit<ExpedienteTecnico, 'id' | 'proyectoId'>) => Promise<void>;
  addSuboperacion: (proyectoId: string, suboperacion: Omit<Suboperacion, 'id' | 'proyectoId'>) => Promise<void>;
  addEntregable: (proyectoId: string, suboperacionId: string, entregable: Omit<Entregable, 'id' | 'suboperacionId'>) => Promise<void>;

  addActividad: (proyectoId: string, actividad: Omit<Actividad, 'id' | 'historialCambios'>) => Promise<void>;
  updateActividad: (proyectoId: string, actividad: Actividad) => Promise<void>;
  deleteActividad: (proyectoId: string, actividadId: string) => Promise<void>;
  toggleSubtarea: (proyectoId: string, actividadId: string, subtareaId: string) => Promise<void>;

  bloquearChecklist: (proyectoId: string, actividadId: string, motivo: string) => Promise<void>;
  desbloquearChecklist: (proyectoId: string, actividadId: string, motivo: string) => Promise<void>;

  aprobarValidacion: (proyectoId: string, actividadId: string, validacionId: string, observaciones?: string) => Promise<void>;
  rechazarValidacion: (proyectoId: string, actividadId: string, validacionId: string, observaciones: string) => Promise<void>;

  addComentario: (entidadId: string, entidadTipo: 'proyecto' | 'actividad' | 'tarea' | 'validacion', contenido: string, esInterno?: boolean) => Promise<void>;
  addEvidencia: (entidadId: string, entidadTipo: 'proyecto' | 'actividad' | 'tarea' | 'validacion', evidencia: Omit<Evidencia, 'id' | 'fecha'>) => Promise<void>;

  addReporteDiario: (proyectoId: string, reporte: Omit<ReporteDiario, 'id'>) => Promise<void>;
  addDocumento: (proyectoId: string, documento: Omit<Documento, 'id'>) => Promise<void>;
  updateDocumento: (proyectoId: string, documento: Documento) => Promise<void>;
  deleteDocumento: (proyectoId: string, documentoId: string) => Promise<void>;

  fetchProjectCosts: (proyectoId: string) => Promise<any>;
  fetchProjectProfitability: (proyectoId: string) => Promise<any>;

  addResponsable: (responsable: Omit<Responsable, 'id'>) => Promise<void>;
  updateResponsable: (responsable: Responsable) => Promise<void>;

  generarAlertas: () => void;
  marcarAlertaLeida: (alertaId: string) => void;
  alertasNoLeidas: () => number;

  calcularKPIs: (periodo: 'semanal' | 'mensual' | 'anual') => KPIPeriodo;

  getTimelineEvents: () => (HistorialCambio & { proyectoNombre?: string; proyectoCodigo?: string; actividadDescripcion?: string })[];
  getValidaciones: () => { proyecto: Proyecto; actividad: Actividad; validacion: ValidacionRequerida }[];
  getProyectosFiltrados: () => Proyecto[];
  getProyectosConActividadesVencidas: () => Proyecto[];
  getProyectosPorArea: (area: Area) => Proyecto[];
  getActividadesPorResponsable: (responsableId: string) => Actividad[];
  getEstadisticas: () => {
    total: number;
    activos: number;
    planification: number;
    finalizados: number;
    detenidos: number;
    verdes: number;
    amarillos: number;
    rojos: number;
  };
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

const calculateSemaforo = (proyecto: Partial<Proyecto>): Semaforo => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  if (proyecto.estado === 'Finalizado') return 'Verde';
  if (proyecto.estado === 'Detenido') return 'Rojo';
  const fechaFin = proyecto.fechaFinEstimada ? new Date(proyecto.fechaFinEstimada) : null;
  if (!fechaFin) return 'Amarillo';
  const diasRestantes = Math.ceil((fechaFin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  if (diasRestantes < 3) return 'Rojo';
  if (diasRestantes <= 7) return 'Amarillo';
  return 'Verde';
};

const calculateAvance = (actividades: Actividad[]): number => {
  if (!actividades || actividades.length === 0) return 0;
  const totalPeso = actividades.reduce((acc, a) => acc + (a.ponderacion || 1), 0);
  const pesosCompletados = actividades
    .filter(a => a.estado === 'Completada' || a.estado === 'Validada')
    .reduce((acc, a) => acc + (a.ponderacion || 1), 0);
  return totalPeso > 0 ? Math.round((pesosCompletados / totalPeso) * 100) : 0;
};

const calculateIndicadoresAvance = (proyecto: Proyecto, responsables: Responsable[]): IndicadorAvance[] => {
  const areas: Area[] = [
    'Logística y Recursos',
    'Ingeniería y Supervisión Técnica',
    'Gestión Documentaria y Expedientes Técnicos',
    'Operaciones de Campo y Control de Obra'
  ];
  const indicadores: IndicadorAvance[] = [];
  areas.forEach(area => {
    const actividadesArea = (proyecto.actividades || []).filter(a => {
      const responsable = responsables.find(r => r.id === a.responsablePrincipalId);
      return responsable?.area === area;
    });
    const completadas = actividadesArea.filter(a => a.estado === 'Completada' || a.estado === 'Validada').length;
    indicadores.push({
      area,
      porcentaje: actividadesArea.length > 0 ? Math.round((completadas / actividadesArea.length) * 100) : 0,
      actividadesTotal: actividadesArea.length,
      actividadesCompletadas: completadas,
      ultimaActualizacion: getPeruDateString(),
    });
  });
  return indicadores;
};

const recalculateProjectMetrics = (proyecto: Proyecto, responsables: Responsable[]): Proyecto => {
  const avanceCalculado = calculateAvance(proyecto.actividades);
  const semaforo = calculateSemaforo(proyecto);
  const indicadoresAvance = calculateIndicadoresAvance(proyecto, responsables);
  return {
    ...proyecto,
    avanceCalculado,
    avance: avanceCalculado,
    semaforo,
    indicadoresAvance,
    fechaActualizacion: getPeruDateString(),
  };
};

// ============================================
// ENUM MAPPING (Frontend Display <-> Backend Prisma)
// ============================================

const mapEstadoProyectoToBackend = (estado: string) => {
  const map: Record<string, string> = { 'Planificación': 'Planificacion', 'En Ejecución': 'EnEjecucion', 'Detenido': 'Detenido', 'Finalizado': 'Finalizado' };
  return map[estado] || estado;
};

const mapEstadoProyectoToFrontend = (estado: string) => {
  const map: Record<string, string> = { 'Planificacion': 'Planificación', 'EnEjecucion': 'En Ejecución', 'Detenido': 'Detenido', 'Finalizado': 'Finalizado' };
  return map[estado] || estado;
};

const mapPrioridadToBackend = (prioridad: string) => {
  const map: Record<string, string> = { 'Baja': 'Baja', 'Media': 'Media', 'Alta': 'Alta', 'Crítica': 'Critica' };
  return map[prioridad] || prioridad;
};

const mapPrioridadToFrontend = (prioridad: string) => {
  const map: Record<string, string> = { 'Baja': 'Baja', 'Media': 'Media', 'Alta': 'Alta', 'Critica': 'Crítica' };
  return map[prioridad] || prioridad;
};

const mapTipoActividadToFrontend = (tipo: string) => {
  const map: Record<string, string> = { 'Tecnica': 'Técnica', 'Administrativa': 'Administrativa', 'Logistica': 'Logística', 'Documental': 'Documental', 'Validacion': 'Validación' };
  return map[tipo] || tipo;
};

const mapEstadoActividadToFrontend = (estado: string) => {
  const map: Record<string, string> = { 'Pendiente': 'Pendiente', 'EnProgreso': 'En Progreso', 'Completada': 'Completada', 'Validada': 'Validada', 'Bloqueada': 'Bloqueada' };
  return map[estado] || estado;
};

const mapEstadoActividadToBackend = (estado: string) => {
  const map: Record<string, string> = { 'Pendiente': 'Pendiente', 'En Progreso': 'EnProgreso', 'Completada': 'Completada', 'Validada': 'Validada', 'Bloqueada': 'Bloqueada' };
  return map[estado] || estado;
};

const mapTipoActividadToBackend = (tipo: string) => {
  const map: Record<string, string> = { 'Técnica': 'Tecnica', 'Administrativa': 'Administrativa', 'Logística': 'Logistica', 'Documental': 'Documental', 'Validación': 'Validacion' };
  return map[tipo] || tipo;
};

const mapAreaToBackend = (area: string) => {
  const map: Record<string, string> = {
    'Logística y Recursos': 'LogisticaYRecursos',
    'Ingeniería y Supervisión Técnica': 'IngenieriaYSupervision',
    'Gestión Documentaria y Expedientes Técnicos': 'GestionDocumentaria',
    'Operaciones de Campo y Control de Obra': 'OperacionesDeCampo'
  };
  return map[area] || area;
};

const mapAreaToFrontend = (area: string) => {
  const map: Record<string, string> = {
    'LogisticaYRecursos': 'Logística y Recursos',
    'IngenieriaYSupervision': 'Ingeniería y Supervisión Técnica',
    'GestionDocumentaria': 'Gestión Documentaria y Expedientes Técnicos',
    'OperacionesDeCampo': 'Operaciones de Campo y Control de Obra'
  };
  return map[area] || area;
};

const mapTipoDocumentoToBackend = (tipo: string) => {
  const map: Record<string, string> = {
    'Técnico': 'Tecnico',
    'Administrativo': 'Administrativo',
    'Legal': 'Legal',
    'Financiero': 'Financiero',
    'Otro': 'Otro'
  };
  return map[tipo] || 'Otro';
};

const mapTipoDocumentoToFrontend = (tipo: string) => {
  const map: Record<string, string> = {
    'Tecnico': 'Técnico',
    'Administrativo': 'Administrativo',
    'Legal': 'Legal',
    'Financiero': 'Financiero',
    'Otro': 'Otro'
  };
  return map[tipo] || tipo;
};

const safeJsonParse = (str: any, fallback: any = []) => {
  if (typeof str !== 'string') return str || fallback;
  if (!str || str.trim() === '') return fallback;
  try {
    return JSON.parse(str);
  } catch {
    console.warn("[OperacionesStore] Error parsing JSON:", str);
    return fallback;
  }
};

const mapProyectoToFrontend = (p: any): Proyecto => ({
  ...p,
  estado: mapEstadoProyectoToFrontend(p.estado),
  prioridad: mapPrioridadToFrontend(p.prioridad),
  area: mapAreaToFrontend(p.area),
  cotizacion: p.cotizacionOrigen || p.cotizacion, // Mapear desde cotizacionOrigen del backend
  responsablesAdicionales: safeJsonParse(p.responsablesAdicionales),
  actividades: (p.actividades || []).map((a: any) => ({
    ...a,
    tipo: mapTipoActividadToFrontend(a.tipo),
    prioridad: mapPrioridadToFrontend(a.prioridad),
    estado: mapEstadoActividadToFrontend(a.estado),
    responsablesApoyo: safeJsonParse(a.responsablesApoyo),
    historialCambios: a.historialCambios || [],
  })),
  suboperaciones: (p.suboperaciones || []).map((s: any) => ({
    ...s,
    tipo: mapTipoActividadToFrontend(s.tipo),
    estado: mapEstadoActividadToFrontend(s.estado),
    responsablesApoyo: safeJsonParse(s.responsablesApoyo),
  })),
  documentos: (p.documentos || []).map((d: any) => ({
    ...d,
    tipo: mapTipoDocumentoToFrontend(d.tipo),
  })),
  historialCambios: p.historialCambios || [],
});

// ============================================
// IMPLEMENTACIÓN DEL STORE
// ============================================

export const useOperacionesStore = create<OperacionesState>()(
  persist(
    (set, get) => ({
      proyectos: [],
      totalProyectos: 0,
      proyectoPage: 1,
      proyectoLimit: 20,
      proyectoTotalPages: 0,

      responsables: [],

      fichasTecnicas: [],
      totalFichas: 0,
      fichaPage: 1,
      fichaLimit: 20,
      fichaTotalPages: 0,
      fichaStats: { pending: 0, completed: 0 },

      actividades: [],
      totalActividades: 0,
      actividadPage: 1,
      actividadLimit: 20,
      actividadTotalPages: 0,

      timelineEvents: [],
      totalTimeline: 0,
      timelinePage: 1,
      timelineLimit: 20,
      timelineTotalPages: 0,

      alertas: [],
      kpis: [],
      loading: false,
      error: null,
      borradoresImpresion: {},
      borradoresConstancia: {},

      filtros: { searchQuery: '', estado: '', area: '', prioridad: '', semaforo: '', responsable: '' },
      usuarioActual: 'Admin',
      areaActual: 'Operaciones de Campo y Control de Obra',

      fetchProyectos: async (page = 1, limit = 20) => {
        set({ loading: true, error: null });
        try {
          const { filtros } = get();
          const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
          });

          if (filtros.searchQuery) queryParams.append('search', filtros.searchQuery);
          if (filtros.estado) queryParams.append('estado', mapEstadoProyectoToBackend(filtros.estado));
          if (filtros.area) queryParams.append('area', mapAreaToBackend(filtros.area));
          if (filtros.prioridad) queryParams.append('prioridad', mapPrioridadToBackend(filtros.prioridad));
          if (filtros.responsable) queryParams.append('responsablePrincipalId', filtros.responsable);

          const response = await api.get(`/operaciones/proyectos?${queryParams.toString()}`);
          
          let rawData = [];
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

          set({ 
            proyectos: rawData.map(mapProyectoToFrontend), 
            totalProyectos: total,
            proyectoPage: page,
            proyectoLimit: limit,
            proyectoTotalPages: totalP,
            loading: false 
          });
          get().generarAlertas();
        } catch (error: any) {
          set({ error: error.message, loading: false });
        }
      },

      fetchActividades: async (page = 1, limit = 20, filters = {}) => {
        set({ loading: true });
        try {
          const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
          });
          if (filters.search) queryParams.append('search', filters.search);
          if (filters.estado && filters.estado !== 'all') queryParams.append('estado', mapEstadoActividadToBackend(filters.estado));
          if (filters.responsableId && filters.responsableId !== 'all') queryParams.append('responsableId', filters.responsableId);

          const response = await api.get(`/operaciones/actividades?${queryParams.toString()}`);
          console.log("[OperacionesStore] Respuesta fetchActividades:", response);
          
          let rawData = [];
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

          set({ 
            actividades: rawData.map((a: any) => ({
                ...a,
                tipo: mapTipoActividadToFrontend(a.tipo),
                prioridad: mapPrioridadToFrontend(a.prioridad),
                estado: mapEstadoActividadToFrontend(a.estado),
                proyectoCodigo: a.proyecto?.codigo || 'N/A',
                proyectoNombre: a.proyecto?.nombre || 'PROYECTO SIN NOMBRE'
            })), 
            totalActividades: total,
            actividadPage: page,
            actividadLimit: limit,
            actividadTotalPages: totalP,
            loading: false 
          });
        } catch (error: any) {
          set({ error: error.message, loading: false });
        }
      },

      fetchTimeline: async (page = 1, limit = 20, filters = {}) => {
        set({ loading: true });
        try {
          const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
          });
          if (filters.search) queryParams.append('search', filters.search);
          if (filters.proyectoId && filters.proyectoId !== 'all') queryParams.append('proyectoId', filters.proyectoId);
          if (filters.tipo && filters.tipo !== 'all') queryParams.append('tipo', filters.tipo);

          const response = await api.get(`/operaciones/timeline?${queryParams.toString()}`);
          
          let rawData = [];
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

          set({ 
            timelineEvents: rawData.map((h: any) => ({
              ...h,
              area: mapAreaToFrontend(h.area)
            })),
            totalTimeline: total,
            timelinePage: page,
            timelineLimit: limit,
            timelineTotalPages: totalP,
            loading: false 
          });
        } catch (error: any) {
          set({ error: error.message, loading: false });
        }
      },

      fetchResponsables: async () => {
        set({ loading: true, error: null });
        try {
          const data = await api.get('/operaciones/responsables');
          set({ responsables: data.map((r: any) => ({ ...r, area: mapAreaToFrontend(r.area) })), loading: false });
          get().generarAlertas();
        } catch (error: any) {
          set({ error: error.message, loading: false });
        }
      },

      fetchFichasTecnicas: async (page = 1, limit = 20, tecnicoId, search, startDate, endDate) => {
        set({ loading: true });
        try {
          const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
          });
          if (tecnicoId) queryParams.append('tecnicoId', tecnicoId);
          if (search) queryParams.append('search', search);
          if (startDate) queryParams.append('startDate', startDate);
          if (endDate) queryParams.append('endDate', endDate);

          const response = await api.get(`/operaciones/fichas-tecnicas?${queryParams.toString()}`);
          
          let rawData = [];
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

          set({ 
            fichasTecnicas: rawData, 
            totalFichas: total,
            fichaPage: page,
            fichaLimit: limit,
            fichaTotalPages: totalP,
            fichaStats: response.stats || { pending: 0, completed: 0 },
            loading: false 
          });
        } catch (error: any) {
          set({ error: error.message, loading: false });
        }
      },

      fetchActiveVisit: async (clientId: string) => {
        try {
          const response = await api.get(`/operaciones/fichas-tecnicas?clienteId=${clientId}`);
          const fichas = response.data || response || [];
          
          if (!Array.isArray(fichas)) return null;

          // Estados considerados como activos
          const activeStates = ['PENDIENTE', 'PROGRAMADA', 'EN_PROCESO'];
          
          return fichas.find((f: any) => activeStates.includes(f.estado)) || null;
        } catch (error) {
          console.error("Error checking active visits:", error);
          return null;
        }
      },

      submitFichaTecnica: async (id, data) => {
        set({ loading: true });
        try {
          // 1. Actualizar la ficha con el estado COMPLETADA y los datos técnicos
          // El backend se encargará de: 
          // - Notificar al asesor comercial
          // - Actualizar la etapa del cliente a "Inspección Realizada"
          // - Registrar la interacción en la bitácora
          await api.put(`/operaciones/fichas-tecnicas/${id}`, {
            ...data,
            estado: 'COMPLETADA'
          });

          // 2. Sincronizar actividad en CRM (Marcar como completada si existe una visita técnica pendiente)
          const ficha = get().fichasTecnicas.find(f => f.id === id);
          if (ficha) {
            const user = useAuthStore.getState().user;
            try {
              const actividades = await api.get(`/crm/actividades?clienteId=${ficha.clienteId}`);
              const actividadPendiente = Array.isArray(actividades) 
                ? actividades.find((a: any) => a.tipoActividad === 'VISITA_TECNICA' && a.estado === 'PENDIENTE')
                : null;

              if (actividadPendiente) {
                await api.put(`/crm/actividades/${actividadPendiente.id}`, {
                  estado: 'COMPLETADA',
                  descripcion: `Inspección técnica finalizada. Datos sincronizados.`
                });
              }

              // Registrar en la Bitácora de CRM
              await api.post('/crm/interacciones', {
                clientId: ficha.clienteId,
                fecha: new Date().toISOString(),
                tipo: 'Visita',
                accion: 'Visita Técnica Finalizada',
                observaciones: `Hallazgos: ${data.hallazgos || 'Sin hallazgos'}\nRecomendaciones: ${data.recomendaciones || 'Sin recomendaciones'}`,
                usuario: user?.nombre || 'Técnico'
              });

              // Refrescar notificaciones globales para ver la alerta de inspección finalizada
              const notifStore = useNotificationStore.getState();
              await Promise.all([
                notifStore.fetchNotifications(),
                notifStore.fetchUnreadCount()
              ]);
            } catch (crmError) {
              console.error("Error sincronizando actividad CRM:", crmError);
            }
          }

          await get().fetchFichasTecnicas();
          set({ loading: false });
        } catch (error: any) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      setBorradorImpresion: (fichaId, data) => set((state) => ({
        borradoresImpresion: {
          ...state.borradoresImpresion,
          [fichaId]: { ...state.borradoresImpresion[fichaId], ...data }
        }
      })),

      setBorradorConstancia: (fichaId, data) => set((state) => ({
        borradoresConstancia: {
          ...state.borradoresConstancia,
          [fichaId]: { ...state.borradoresConstancia[fichaId], ...data }
        }
      })),

      setSearchQuery: (query) => set((state) => ({ filtros: { ...state.filtros, searchQuery: query } })),
      setEstado: (estado) => set((state) => ({ filtros: { ...state.filtros, estado } })),
      setArea: (area) => set((state) => ({ filtros: { ...state.filtros, area } })),
      setPrioridad: (prioridad) => set((state) => ({ filtros: { ...state.filtros, prioridad } })),
      setSemaforo: (semaforo) => set((state) => ({ filtros: { ...state.filtros, semaforo } })),
      setResponsable: (responsable) => set((state) => ({ filtros: { ...state.filtros, responsable } })),
      setFechas: (inicio, fin) => set((state) => ({ filtros: { ...state.filtros, fechaInicio: inicio, fechaFin: fin } })),
      resetFiltros: () => set({ filtros: { searchQuery: '', estado: '', area: '', prioridad: '', semaforo: '', responsable: '' } }),

      addProyecto: async (proyectoData) => {
        set({ loading: true, error: null });
        try {
          const payload = {
            clientId: proyectoData.clientId,
            nombre: proyectoData.nombre,
            descripcion: proyectoData.descripcion,
            estado: mapEstadoProyectoToBackend(proyectoData.estado),
            prioridad: mapPrioridadToBackend(proyectoData.prioridad),
            fechaInicio: new Date(proyectoData.fechaInicio).toISOString(),
            fechaFinEstimada: new Date(proyectoData.fechaFinEstimada).toISOString(),
            responsablePrincipalId: proyectoData.responsablePrincipalId,
            responsablesAdicionales: proyectoData.responsablesAdicionales || [],
            area: mapAreaToBackend(proyectoData.area),
            cotizacionId: proyectoData.cotizacionId || null,
          };
          const nuevoProyecto = await api.post('/operaciones/proyectos', payload);
          set((state) => {
            const exists = state.proyectos.find(p => p.id === nuevoProyecto.id);
            if (exists) {
              return { 
                proyectos: state.proyectos.map(p => p.id === nuevoProyecto.id ? mapProyectoToFrontend(nuevoProyecto) : p),
                loading: false 
              };
            }
            return { proyectos: [mapProyectoToFrontend(nuevoProyecto), ...state.proyectos], loading: false };
          });
          return nuevoProyecto.id;
        } catch (error: any) {
          // Si el backend devuelve un error estructurado, lo guardamos tal cual
          const errorMsg = error.response?.data?.message || error.message;
          set({ error: errorMsg, loading: false });
          throw error;
        }
      },

      updateProyecto: async (proyectoActualizado) => {
        set({ loading: true, error: null });
        try {
          const payload = {
            clientId: proyectoActualizado.clientId,
            nombre: proyectoActualizado.nombre,
            descripcion: proyectoActualizado.descripcion,
            estado: mapEstadoProyectoToBackend(proyectoActualizado.estado),
            prioridad: mapPrioridadToBackend(proyectoActualizado.prioridad),
            fechaInicio: new Date(proyectoActualizado.fechaInicio).toISOString(),
            fechaFinEstimada: new Date(proyectoActualizado.fechaFinEstimada).toISOString(),
            fechaFinReal: proyectoActualizado.fechaFinReal ? new Date(proyectoActualizado.fechaFinReal).toISOString() : null,
            responsablePrincipalId: proyectoActualizado.responsablePrincipalId,
            responsablesAdicionales: proyectoActualizado.responsablesAdicionales || [],
            area: mapAreaToBackend(proyectoActualizado.area),
          };
          const updated = await api.put(`/operaciones/proyectos/${proyectoActualizado.id}`, payload);
          set((state) => ({
            proyectos: state.proyectos.map((p) => p.id === updated.id ? mapProyectoToFrontend(updated) : p),
            loading: false
          }));
        } catch (error: any) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      deleteProyecto: async (id) => {
        set({ loading: true, error: null });
        try {
          await api.delete(`/operaciones/proyectos/${id}`);
          set((state) => ({ proyectos: state.proyectos.filter((p) => p.id !== id), loading: false }));
        } catch (error: any) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      deleteProyectoSecure: async (id, password) => {
        set({ loading: true, error: null });
        try {
          await api.post(`/operaciones/proyectos/${id}/secure-delete`, { password });
          set((state) => ({ proyectos: state.proyectos.filter((p) => p.id !== id), loading: false }));
        } catch (error: any) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      calcularAvanceProyecto: (proyectoId) => set((state) => ({
        proyectos: state.proyectos.map((p) => {
          if (p.id !== proyectoId) return p;
          return recalculateProjectMetrics(p, state.responsables);
        })
      })),

      addEvaluacionTecnica: async (proyectoId, evaluacion) => {
        set({ loading: true });
        try {
          await api.post(`/operaciones/proyectos/${proyectoId}/evaluacion-tecnica`, evaluacion);
          await get().fetchProyectos();
          set({ loading: false });
        } catch (error: any) {
          set({ error: error.message, loading: false });
        }
      },

      addIngenieriaDiseno: async (proyectoId, ingenieria) => {
        set({ loading: true });
        try {
          await api.post(`/operaciones/proyectos/${proyectoId}/ingenieria-diseno`, ingenieria);
          await get().fetchProyectos();
          set({ loading: false });
        } catch (error: any) {
          set({ error: error.message, loading: false });
        }
      },

      addExpedienteTecnico: async (proyectoId, expediente) => {
        set({ loading: true });
        try {
          await api.post(`/operaciones/proyectos/${proyectoId}/expediente-tecnico`, expediente);
          await get().fetchProyectos();
          set({ loading: false });
        } catch (error: any) {
          set({ error: error.message, loading: false });
        }
      },

      addActividad: async (proyectoId, actividadData) => {
        set({ loading: true, error: null });
        try {
          const { 
            subtareas: _subtareas, 
            validacionesRequeridas: _validacionesRequeridas, 
            comentarios: _comentarios, 
            evidencias: _evidencias, 
            historialCambios: _historialCambios,
            proyectoCodigo: _proyectoCodigo,
            proyectoNombre: _proyectoNombre,
            desbloqueadoPor: _desbloqueadoPor,
            fechaDesbloqueoChecklist: _fechaDesbloqueoChecklist,
            padreId: _padreId,
            esSuboperacion: _esSuboperacion,
            ...cleanData 
          } = actividadData as any;

          const toISO = (dateStr?: string) => {
            if (!dateStr || dateStr.trim() === '') return undefined;
            try {
              // Si es solo YYYY-MM-DD, le añadimos mediodía para evitar saltos de zona horaria
              const normalizedDate = dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`;
              return new Date(normalizedDate).toISOString();
            } catch (e) {
              return undefined;
            }
          };

          const payload = {
            ...cleanData,
            proyectoId,
            tipo: mapTipoActividadToBackend(actividadData.tipo), 
            prioridad: mapPrioridadToBackend(actividadData.prioridad),
            estado: mapEstadoActividadToBackend(actividadData.estado), 
            fechaInicio: toISO(actividadData.fechaInicio),
            fechaFin: toISO(actividadData.fechaFin),
            fechaVencimiento: toISO(actividadData.fechaVencimiento),
          };
          await api.post('/operaciones/actividades', payload);
          await Promise.all([
            get().fetchProyectos(),
            get().fetchActividades()
          ]);
          set({ loading: false });
        } catch (error: any) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      updateActividad: async (proyectoId, actividadActualizada) => {
        set({ loading: true, error: null });
        try {
          const { 
            id,
            subtareas: _subtareas, 
            validacionesRequeridas: _validacionesRequeridas, 
            comentarios: _comentarios, 
            evidencias: _evidencias, 
            historialCambios: _historialCambios, 
            proyecto: _proyecto,
            responsablePrincipal: _responsablePrincipal,
            proyectoCodigo: _proyectoCodigo,
            proyectoNombre: _proyectoNombre,
            desbloqueadoPor: _desbloqueadoPor,
            fechaDesbloqueoChecklist: _fechaDesbloqueoChecklist,
            padreId: _padreId,
            esSuboperacion: _esSuboperacion,
            ...cleanData 
          } = actividadActualizada as any;

          const toISO = (dateStr?: string) => {
            if (!dateStr || dateStr.trim() === '') return undefined;
            try {
              // Si es solo YYYY-MM-DD, le añadimos mediodía para evitar saltos de zona horaria
              const normalizedDate = dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`;
              return new Date(normalizedDate).toISOString();
            } catch (e) {
              return undefined;
            }
          };

          const user = useAuthStore.getState().user;
          const userRole = user?.rol;
          const responsableId = user?.responsable?.id;

          const payload = {
            ...cleanData,
            userRole, // Enviar rol para validación
            responsableId, // Enviar ID para validación de Lider de Proyecto
            tipo: mapTipoActividadToBackend(actividadActualizada.tipo),
            prioridad: mapPrioridadToBackend(actividadActualizada.prioridad),
            estado: mapEstadoActividadToBackend(actividadActualizada.estado),
            progreso: cleanData.progreso ?? ((actividadActualizada.estado === 'Completada' || actividadActualizada.estado === 'Validada') ? 100 : (actividadActualizada.estado === 'En Progreso' ? 50 : 0)),
            fechaInicio: toISO(actividadActualizada.fechaInicio),
            fechaFin: toISO(actividadActualizada.fechaFin),
            fechaVencimiento: toISO(actividadActualizada.fechaVencimiento),
          };
          const responseActividad = await api.put(`/operaciones/actividades/${actividadActualizada.id}`, payload);
          
          const mappedActividad = {
            ...actividadActualizada,
            ...responseActividad,
            tipo: mapTipoActividadToFrontend(responseActividad.tipo),
            prioridad: mapPrioridadToFrontend(responseActividad.prioridad),
            estado: mapEstadoActividadToFrontend(responseActividad.estado),
            proyectoCodigo: responseActividad.proyecto?.codigo || (actividadActualizada as any).proyectoCodigo || 'N/A',
            proyectoNombre: responseActividad.proyecto?.nombre || (actividadActualizada as any).proyectoNombre || 'PROYECTO SIN NOMBRE',
          };

          // Actualizar localmente para feedback inmediato en la UI
          set((state) => ({
            actividades: (state.actividades || []).map(a => {
              if (a.id !== mappedActividad.id) return a;
              return mappedActividad;
            }),
            proyectos: state.proyectos.map(p => {
              if (p.id !== proyectoId) return p;
              const actividadesActualizadas = (p.actividades || []).map(a => {
                if (a.id !== mappedActividad.id) return a;
                return mappedActividad;
              });
              const nuevoAvance = calculateAvance(actividadesActualizadas);
              return {
                ...p,
                actividades: actividadesActualizadas,
                avanceCalculado: nuevoAvance,
                avance: nuevoAvance,
              };
            })
          }));
          await get().fetchProyectos();
          set({ loading: false });
        } catch (error: any) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      deleteActividad: async (proyectoId, actividadId) => {
        set({ loading: true, error: null });
        try {
          await api.delete(`/operaciones/actividades/${actividadId}`);
          set((state) => ({
            actividades: (state.actividades || []).filter(a => a.id !== actividadId),
            proyectos: state.proyectos.map(p => {
              if (p.id !== proyectoId) return p;
              const actividadesActualizadas = (p.actividades || []).filter(a => a.id !== actividadId);
              const nuevoAvance = calculateAvance(actividadesActualizadas);
              return {
                ...p,
                actividades: actividadesActualizadas,
                avanceCalculado: nuevoAvance,
                avance: nuevoAvance,
              };
            })
          }));
          await get().fetchProyectos();
          set({ loading: false });
        } catch (error: any) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      toggleSubtarea: async (proyectoId, actividadId, subtareaId) => {
        set({ loading: true });
        try {
          const proyecto = get().proyectos.find(p => p.id === proyectoId);
          const actividad = proyecto?.actividades.find(a => a.id === actividadId);
          const subtarea = actividad?.subtareas.find(s => s.id === subtareaId);
          
          if (!subtarea) return;

          await api.put(`/operaciones/subtareas/${subtareaId}`, {
            completada: !subtarea.completada,
            fechaCompletada: !subtarea.completada ? new Date().toISOString() : null
          });
          
          await get().fetchProyectos();
          set({ loading: false });
        } catch (error: any) {
          set({ error: error.message, loading: false });
        }
      },

      bloquearChecklist: async (proyectoId, actividadId, motivo) => {
        set({ loading: true });
        try {
          await api.put(`/operaciones/actividades/${actividadId}`, {
            checklistBloqueado: true,
            motivoBloqueoChecklist: motivo
          });
          await get().fetchProyectos();
          set({ loading: false });
        } catch (error: any) {
          set({ error: error.message, loading: false });
        }
      },

      desbloquearChecklist: async (proyectoId, actividadId, _motivo) => {
        set({ loading: true });
        try {
          await api.put(`/operaciones/actividades/${actividadId}`, {
            checklistBloqueado: false,
            motivoBloqueoChecklist: undefined
          });
          await get().fetchProyectos();
          set({ loading: false });
        } catch (error: any) {
          set({ error: error.message, loading: false });
        }
      },

      aprobarValidacion: async (proyectoId, actividadId, validacionId, observaciones) => {
        set({ loading: true });
        try {
          await api.put(`/operaciones/validaciones/${validacionId}`, {
            estado: 'Aprobada',
            observaciones,
            validadoPor: get().usuarioActual,
            fechaValidacion: new Date().toISOString()
          });
          await get().fetchProyectos();
          set({ loading: false });
        } catch (error: any) {
          set({ error: error.message, loading: false });
        }
      },

      rechazarValidacion: async (proyectoId, actividadId, validacionId, observaciones) => {
        set({ loading: true });
        try {
          await api.put(`/operaciones/validaciones/${validacionId}`, {
            estado: 'Rechazada',
            observaciones,
            validadoPor: get().usuarioActual,
            fechaValidacion: new Date().toISOString()
          });
          await get().fetchProyectos();
          set({ loading: false });
        } catch (error: any) {
          set({ error: error.message, loading: false });
        }
      },

      addComentario: async (entidadId, entidadTipo, contenido, esInterno = false) => {
        set({ loading: true });
        try {
          const payload: any = {
            usuario: get().usuarioActual,
            usuarioArea: mapAreaToBackend(get().areaActual),
            contenido,
            esInterno
          };
          if (entidadTipo === 'proyecto') payload.proyectoId = entidadId;
          else if (entidadTipo === 'actividad') payload.actividadId = entidadId;
          
          await api.post('/operaciones/comentarios', payload);
          await get().fetchProyectos();
          set({ loading: false });
        } catch (error: any) {
          set({ error: error.message, loading: false });
        }
      },

      addEvidencia: async (entidadId, entidadTipo, evidenciaData) => {
        set({ loading: true });
        try {
          const payload: any = {
            ...evidenciaData,
            subidoPor: get().usuarioActual
          };
          if (entidadTipo === 'proyecto') payload.proyectoId = entidadId;
          else if (entidadTipo === 'actividad') payload.actividadId = entidadId;
          
          await api.post('/operaciones/evidencias', payload);
          await get().fetchProyectos();
          set({ loading: false });
        } catch (error: any) {
          set({ error: error.message, loading: false });
        }
      },

      addReporteDiario: async (proyectoId, reporteData) => {
        set({ loading: true });
        try {
          const payload = {
            ...reporteData,
            proyectoId,
            usuario: get().usuarioActual,
            usuarioArea: mapAreaToBackend(get().areaActual)
          };
          await api.post('/operaciones/reportes', payload);
          await get().fetchProyectos();
          set({ loading: false });
        } catch (error: any) {
          set({ error: error.message, loading: false });
        }
      },

      addDocumento: async (proyectoId, documentoData) => {
        set({ loading: true });
        try {
          const payload = {
            ...documentoData,
            proyectoId,
            tipo: mapTipoDocumentoToBackend(documentoData.tipo),
            estado: documentoData.estado || 'Borrador',
            subidoPor: get().usuarioActual || 'Admin',
            area: (documentoData as any).area || null
          };
          await api.post('/operaciones/documentos', payload);
          await get().fetchProyectos();
          set({ loading: false });
        } catch (error: any) {
          console.error("Store error saving document:", error);
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      updateDocumento: async (proyectoId, documentoActualizado) => {
        set({ loading: true });
        try {
          const { id, ...payload } = documentoActualizado;
          await api.put(`/operaciones/documentos/${id}`, payload);
          await get().fetchProyectos();
          set({ loading: false });
        } catch (error: any) {
          set({ error: error.message, loading: false });
        }
      },

      deleteDocumento: async (proyectoId, documentoId) => {
        set({ loading: true });
        try {
          await api.delete(`/operaciones/documentos/${documentoId}`);
          await get().fetchProyectos();
          set({ loading: false });
        } catch (error: any) {
          console.error("Store error deleting document:", error);
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      fetchProjectCosts: async (proyectoId) => {
        try {
          return await api.get(`/operaciones/proyectos/${proyectoId}/costos`);
        } catch (error: any) {
          console.error("Error fetching project costs:", error);
          throw error;
        }
      },

      fetchProjectProfitability: async (proyectoId) => {
        try {
          return await api.get(`/finanzas/proyectos/${proyectoId}/rentabilidad`);
        } catch (error: any) {
          console.error("Error fetching project profitability:", error);
          throw error;
        }
      },

      addSuboperacion: async (proyectoId, suboperacion) => {
        set({ loading: true });
        try {
          const payload = {
            ...suboperacion,
            proyectoId,
            tipo: mapTipoActividadToBackend(suboperacion.tipo),
            estado: mapEstadoActividadToBackend(suboperacion.estado)
          };
          await api.post('/operaciones/suboperaciones', payload);
          await get().fetchProyectos();
          set({ loading: false });
        } catch (error: any) {
          set({ error: error.message, loading: false });
        }
      },

      addEntregable: async (proyectoId, suboperacionId, entregable) => {
        set({ loading: true });
        try {
          const payload = {
            ...entregable,
            suboperacionId
          };
          await api.post('/operaciones/entregables', payload);
          await get().fetchProyectos();
          set({ loading: false });
        } catch (error: any) {
          set({ error: error.message, loading: false });
        }
      },

      addResponsable: async (responsableData) => {
        set({ loading: true });
        try {
          const payload = {
            ...responsableData,
            area: mapAreaToBackend(responsableData.area)
          };
          await api.post('/operaciones/responsables', payload);
          await get().fetchResponsables();
          set({ loading: false });
        } catch (error: any) {
          set({ error: error.message, loading: false });
        }
      },

      updateResponsable: async (responsableActualizado) => {
        set({ loading: true });
        try {
          const { id, ...responsableData } = responsableActualizado;
          const payload = {
            ...responsableData,
            area: mapAreaToBackend(responsableData.area)
          };
          await api.put(`/operaciones/responsables/${id}`, payload);
          await get().fetchResponsables();
          set({ loading: false });
        } catch (error: any) {
          set({ error: error.message, loading: false });
        }
      },

      generarAlertas: () => set((state) => {
        const nuevasAlertas: Alerta[] = [];
        const hoy = new Date();
        const mañana = new Date(hoy);
        mañana.setDate(hoy.getDate() + 1);
        const en48Horas = new Date(hoy);
        en48Horas.setDate(hoy.getDate() + 2);
        
        hoy.setHours(0, 0, 0, 0);

        state.proyectos.forEach(p => {
          // 1. ALERTAS DE PROYECTO
          if (p.estado === 'Detenido') {
            nuevasAlertas.push({
              id: `alert-det-${p.id}`,
              tipo: 'atraso',
              titulo: `Proyecto Detenido: ${p.codigo}`,
              descripcion: `El proyecto "${p.nombre}" está paralizado. Requiere revisión de logística o personal.`,
              prioridad: 'Alta',
              area: p.area,
              fechaCreacion: new Date().toISOString(),
              leida: false,
              entidadId: p.id,
              entidadTipo: 'proyecto'
            });
          }

          if (p.semaforo === 'Rojo' && p.estado !== 'Finalizado') {
             nuevasAlertas.push({
              id: `alert-sem-${p.id}`,
              tipo: 'atraso',
              titulo: `Riesgo Crítico: ${p.codigo}`,
              descripcion: `Semaforo Rojo. El proyecto "${p.nombre}" tiene alta probabilidad de incumplir fecha de entrega.`,
              prioridad: 'Crítica',
              area: p.area,
              fechaCreacion: new Date().toISOString(),
              leida: false,
              entidadId: p.id,
              entidadTipo: 'proyecto'
            });
          }

          // 2. ALERTA DE CUELLO DE BOTELLA (Muchas validaciones pendientes)
          const completadasSinValidar = (p.actividades || []).filter(a => a.estado === 'Completada').length;
          if (completadasSinValidar >= 3) {
            nuevasAlertas.push({
                id: `alert-bot-${p.id}`,
                tipo: 'validacion',
                titulo: `Cuello de Botella: ${p.codigo}`,
                descripcion: `Hay ${completadasSinValidar} actividades esperando validación. El progreso del proyecto está frenado administrativamente.`,
                prioridad: 'Alta',
                area: p.area,
                fechaCreacion: new Date().toISOString(),
                leida: false,
                entidadId: p.id,
                entidadTipo: 'proyecto'
              });
          }

          // 3. ALERTAS DE ACTIVIDADES
          (p.actividades || []).forEach(a => {
            const resp = state.responsables.find(r => r.id === a.responsablePrincipalId);
            
            // A. Vencimiento Crítico (Ya venció)
            if (a.estado !== 'Validada' && a.estado !== 'Completada' && a.fechaVencimiento) {
              const fv = new Date(a.fechaVencimiento);
              if (fv < hoy) {
                nuevasAlertas.push({
                  id: `alert-act-venc-${a.id}`,
                  tipo: 'vencimiento',
                  titulo: `ACTIVIDAD VENCIDA: ${p.codigo}`,
                  descripcion: `"${a.descripcion}" debió terminar el ${formatDate(a.fechaVencimiento)}. Resp: ${resp?.nombre || 'N/A'}`,
                  prioridad: 'Crítica',
                  area: resp?.area || p.area,
                  fechaCreacion: new Date().toISOString(),
                  leida: false,
                  entidadId: a.id,
                  entidadTipo: 'actividad'
                });
              } 
              // B. Vencimiento Inminente (Faltan < 48h y poco avance)
              else if (fv <= en48Horas && a.progreso < 50) {
                nuevasAlertas.push({
                    id: `alert-act-prox-${a.id}`,
                    tipo: 'atraso',
                    titulo: `Riesgo de Vencimiento: ${p.codigo}`,
                    descripcion: `"${a.descripcion}" vence en menos de 48h y solo tiene ${a.progreso}% de avance.`,
                    prioridad: 'Alta',
                    area: resp?.area || p.area,
                    fechaCreacion: new Date().toISOString(),
                    leida: false,
                    entidadId: a.id,
                    entidadTipo: 'actividad'
                  });
              }
            }

            // C. Inicio Tardío (Debió empezar hoy o antes y está al 0%)
            if (a.estado === 'Pendiente' && a.progreso === 0 && a.fechaInicio) {
                const fi = new Date(a.fechaInicio);
                if (fi <= hoy) {
                    nuevasAlertas.push({
                        id: `alert-act-start-${a.id}`,
                        tipo: 'atraso',
                        titulo: `Inicio Tardío: ${p.codigo}`,
                        descripcion: `La actividad "${a.descripcion}" debió iniciar el ${formatDate(a.fechaInicio)} pero sigue al 0%.`,
                        prioridad: 'Media',
                        area: resp?.area || p.area,
                        fechaCreacion: new Date().toISOString(),
                        leida: false,
                        entidadId: a.id,
                        entidadTipo: 'actividad'
                      });
                }
            }
          });
        });

        const alertasFinales = state.alertas.map(ea => {
            // Si la alerta vieja ya NO está en las nuevas, es porque se resolvió
            const sigueSiendoRiesgo = nuevasAlertas.some(na => na.id === ea.id);
            if (!sigueSiendoRiesgo) {
                return { ...ea, leida: true }; // Se resolvió -> va al historial
            }
            return ea;
        });

        // Añadir las que son totalmente nuevas
        nuevasAlertas.forEach(na => {
            if (!alertasFinales.some(ea => ea.id === na.id)) {
                alertasFinales.push(na);
            }
        });

        return { alertas: alertasFinales };
      }),
      marcarAlertaLeida: (alertaId) => set((state) => ({ alertas: state.alertas.map((a) => a.id === alertaId ? { ...a, leida: true } : a) })),
      alertasNoLeidas: () => get().alertas.filter((a) => !a.leida).length,
      calcularKPIs: (periodo) => {
        const state = get();
        const hoy = new Date();
        let fechaInicio = new Date();
        
        if (periodo === 'semanal') {
          fechaInicio.setDate(hoy.getDate() - 7);
        } else if (periodo === 'mensual') {
          fechaInicio.setMonth(hoy.getMonth() - 1);
        } else {
          fechaInicio.setFullYear(hoy.getFullYear() - 1);
        }

        const proyectosEnPeriodo = state.proyectos.filter(p => p.fechaCreacion && new Date(p.fechaCreacion) >= fechaInicio);
        const proyectosFinalizados = state.proyectos.filter(p => p.estado === 'Finalizado' && p.fechaFinReal && new Date(p.fechaFinReal) >= fechaInicio);
        
        let actividadesTotal = 0;
        let actividadesCompletadas = 0;
        let sumaAvance = 0;

        state.proyectos.forEach(p => {
          sumaAvance += p.avanceCalculado || 0;
          (p.actividades || []).forEach(a => {
            if (a.fechaCreacion && new Date(a.fechaCreacion) >= fechaInicio) {
              actividadesTotal++;
              if (a.estado === 'Completada' || a.estado === 'Validada') {
                actividadesCompletadas++;
              }
            }
          });
        });

        const alertasPeriodo = state.alertas.filter(a => new Date(a.fechaCreacion) >= fechaInicio);

        return {
          periodo,
          fechaInicio: fechaInicio.toISOString(),
          fechaFin: hoy.toISOString(),
          proyectosIniciados: proyectosEnPeriodo.length,
          proyectosFinalizados: proyectosFinalizados.length,
          proyectosActivos: state.proyectos.filter(p => p.estado === 'En Ejecución').length,
          actividadesCreadas: actividadesTotal,
          actividadesCompletadas: actividadesCompletadas,
          promedioAvance: state.proyectos.length > 0 ? Math.round(sumaAvance / state.proyectos.length) : 0,
          alertasTotales: alertasPeriodo.length,
          alertasResueltas: alertasPeriodo.filter(a => a.leida).length,
        };
      },

      getTimelineEvents: () => {
        const state = get();
        const events: any[] = [];
        state.proyectos.forEach((p) => {
          (p.historialCambios || []).forEach((h) => {
            const actividadId = h.entidadTipo === 'actividad' ? h.entidadId : undefined;
            const actividad = actividadId ? p.actividades.find(a => a.id === actividadId) : undefined;
            events.push({
              ...h,
              area: mapAreaToFrontend(h.area), // Mapear el área del backend a frontend
              proyectoNombre: p.nombre,
              proyectoCodigo: p.codigo,
              actividadDescripcion: actividad?.descripcion
            });
          });
        });
        return events.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      },

      getValidaciones: () => {
        const state = get();
        const list: any[] = [];
        state.proyectos.forEach((p) => { 
          (p.actividades || []).forEach((a) => { 
            // 1. Validaciones explícitas (puntos de control)
            (a.validacionesRequeridas || []).forEach((v) => list.push({ proyecto: p, actividad: a, validacion: v })); 
            
            // 2. Validación de Cierre Automática (si progreso es 100% y no está validada aún)
            if (a.progreso === 100 && a.estado === 'Completada') {
                // Verificar si ya existe una validación de tipo 'Cierre' para no duplicar en el UI
                const hasCierre = (a.validacionesRequeridas || []).some(v => v.tipo === 'Calidad' || v.tipo === 'Tecnica');
                if (!hasCierre) {
                    list.push({ 
                        proyecto: p, 
                        actividad: a, 
                        validacion: {
                            id: `cierre-${a.id}`,
                            actividadId: a.id,
                            tipo: 'Calidad', // Representa el cierre final
                            area: 'Operaciones de Campo y Control de Obra',
                            estado: 'Pendiente',
                            observaciones: 'Actividad finalizada por el técnico. Pendiente de validación de cierre.'
                        } 
                    });
                }
            }
          }); 
        });
        return list;
      },

      getProyectosFiltrados: () => {
        const state = get();
        const { filtros } = state;
        return state.proyectos.filter(p => {
          if (filtros.searchQuery && !p.nombre.toLowerCase().includes(filtros.searchQuery.toLowerCase()) && !p.codigo.toLowerCase().includes(filtros.searchQuery.toLowerCase())) return false;
          if (filtros.estado && p.estado !== filtros.estado) return false;
          if (filtros.area && p.area !== filtros.area) return false;
          if (filtros.prioridad && p.prioridad !== filtros.prioridad) return false;
          if (filtros.semaforo && p.semaforo !== filtros.semaforo) return false;
          if (filtros.responsable && p.responsablePrincipalId !== filtros.responsable) return false;
          if (filtros.fechaInicio && p.fechaInicio < filtros.fechaInicio) return false;
          if (filtros.fechaFin && p.fechaFinEstimada > filtros.fechaFin) return false;
          return true;
        });
      },

      getProyectosConActividadesVencidas: () => {
        const state = get();
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        return state.proyectos.filter((p) => (p.actividades || []).some((a) => { if (!a.fechaVencimiento || a.estado === 'Completada' || a.estado === 'Validada') return false; return new Date(a.fechaVencimiento) < hoy; }));
      },

      getProyectosPorArea: (area) => get().proyectos.filter((p) => p.area === area),

      getActividadesPorResponsable: (responsableId) => {
        const actividades: Actividad[] = [];
        get().proyectos.forEach((p) => { (p.actividades || []).forEach((a) => { if (a.responsablePrincipalId === responsableId || (a.responsablesApoyo || []).includes(responsableId)) { actividades.push(a); } }); });
        return actividades;
      },

      getEstadisticas: () => {
        const state = get();
        return {
          total: state.proyectos.length,
          activos: state.proyectos.filter(p => p.estado === 'En Ejecución').length,
          planification: state.proyectos.filter(p => p.estado === 'Planificación').length,
          finalizados: state.proyectos.filter(p => p.estado === 'Finalizado').length,
          detenidos: state.proyectos.filter(p => p.estado === 'Detenido').length,
          verdes: state.proyectos.filter(p => p.semaforo === 'Verde').length,
          amarillos: state.proyectos.filter(p => p.semaforo === 'Amarillo').length,
          rojos: state.proyectos.filter(p => p.semaforo === 'Rojo').length,
        };
      },
    }),
    { name: 'hht-operaciones-store' }
  )
);
