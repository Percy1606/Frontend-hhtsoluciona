import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';
import { useAuthStore } from './auth-store';
import type {
  Area,
  Prioridad,
  EstadoProyecto,
  Semaforo,
  TipoActividad,
  EstadoActividad,
  Proyecto,
  Actividad,
  Subtarea,
  ValidacionRequerida,
  Responsable,
  Documento,
  Alerta,
  Comentario,
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

type AddProyectoData = Omit<Proyecto, 'id' | 'codigo' | 'avanceCalculado' | 'historialCambios' | 'semaforo'>;

interface OperacionesState {
  proyectos: Proyecto[];
  responsables: Responsable[];
  alertas: Alerta[];
  kpis: KPIPeriodo[];
  loading: boolean;
  error: string | null;

  fetchProyectos: () => Promise<void>;
  fetchResponsables: () => Promise<void>;

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
      ultimaActualizacion: new Date().toISOString().split('T')[0],
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
    fechaActualizacion: new Date().toISOString().split('T')[0],
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
    'Técnico': 'Tecnica',
    'Administrativo': 'Administrativa',
    'Legal': 'Legal',
    'Financiero': 'Financiero',
    'Otro': 'Otro'
  };
  return map[tipo] || 'Otro';
};

const mapTipoDocumentoToFrontend = (tipo: string) => {
  const map: Record<string, string> = {
    'Tecnica': 'Técnico',
    'Administrativa': 'Administrativo',
    'Legal': 'Legal',
    'Financiero': 'Financiero',
    'Otro': 'Otro'
  };
  return map[tipo] || tipo;
};

const safeJsonParse = (str: any, fallback: any = []) => {
  if (typeof str !== 'string') return str || fallback;
  try {
    return str ? JSON.parse(str) : fallback;
  } catch (e) {
    return fallback;
  }
};

const mapProyectoToFrontend = (p: any): Proyecto => ({
  ...p,
  estado: mapEstadoProyectoToFrontend(p.estado),
  prioridad: mapPrioridadToFrontend(p.prioridad),
  area: mapAreaToFrontend(p.area),
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
      responsables: [],
      alertas: [],
      kpis: [],
      loading: false,
      error: null,

      filtros: { searchQuery: '', estado: 'all', area: 'all', prioridad: 'all', semaforo: 'all', responsable: 'all' },
      usuarioActual: 'Admin',
      areaActual: 'Operaciones de Campo y Control de Obra',

      fetchProyectos: async () => {
        set({ loading: true, error: null });
        try {
          const data = await api.get('/operaciones/proyectos');
          set({ proyectos: data.map(mapProyectoToFrontend), loading: false });
          get().generarAlertas();
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

      setSearchQuery: (query) => set((state) => ({ filtros: { ...state.filtros, searchQuery: query } })),
      setEstado: (estado) => set((state) => ({ filtros: { ...state.filtros, estado } })),
      setArea: (area) => set((state) => ({ filtros: { ...state.filtros, area } })),
      setPrioridad: (prioridad) => set((state) => ({ filtros: { ...state.filtros, prioridad } })),
      setSemaforo: (semaforo) => set((state) => ({ filtros: { ...state.filtros, semaforo } })),
      setResponsable: (responsable) => set((state) => ({ filtros: { ...state.filtros, responsable } })),
      setFechas: (inicio, fin) => set((state) => ({ filtros: { ...state.filtros, fechaInicio: inicio, fechaFin: fin } })),
      resetFiltros: () => set({ filtros: { searchQuery: '', estado: 'all', area: 'all', prioridad: 'all', semaforo: 'all', responsable: 'all' } }),

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
          };
          const nuevoProyecto = await api.post('/operaciones/proyectos', payload);
          set((state) => ({ proyectos: [mapProyectoToFrontend(nuevoProyecto), ...state.proyectos], loading: false }));
          return nuevoProyecto.id;
        } catch (error: any) {
          set({ error: error.message, loading: false });
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
            subtareas, 
            validacionesRequeridas, 
            comentarios, 
            evidencias, 
            historialCambios,
            proyectoCodigo,
            proyectoNombre,
            desbloqueadoPor,
            fechaDesbloqueoChecklist,
            padreId,
            esSuboperacion,
            ...cleanData 
          } = actividadData as any;

          const toISO = (dateStr?: string) => {
            if (!dateStr || dateStr.trim() === '') return undefined;
            try {
              return new Date(dateStr).toISOString();
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
          await get().fetchProyectos();
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
            subtareas, 
            validacionesRequeridas, 
            comentarios, 
            evidencias, 
            historialCambios, 
            proyecto,
            responsablePrincipal,
            proyectoCodigo,
            proyectoNombre,
            desbloqueadoPor,
            fechaDesbloqueoChecklist,
            padreId,
            esSuboperacion,
            ...cleanData 
          } = actividadActualizada as any;

          const toISO = (dateStr?: string) => {
            if (!dateStr || dateStr.trim() === '') return undefined;
            try {
              return new Date(dateStr).toISOString();
            } catch (e) {
              return undefined;
            }
          };

          const userRole = useAuthStore.getState().user?.rol;

          const payload = {
            ...cleanData,
            userRole, // Enviar rol para validación
            tipo: mapTipoActividadToBackend(actividadActualizada.tipo),
            prioridad: mapPrioridadToBackend(actividadActualizada.prioridad),
            estado: mapEstadoActividadToBackend(actividadActualizada.estado),
            progreso: (actividadActualizada.estado === 'Completada' || actividadActualizada.estado === 'Validada') ? 100 : (actividadActualizada.estado === 'En Progreso' ? 50 : 0),
            fechaInicio: toISO(actividadActualizada.fechaInicio),
            fechaFin: toISO(actividadActualizada.fechaFin),
            fechaVencimiento: toISO(actividadActualizada.fechaVencimiento),
          };
          await api.put(`/operaciones/actividades/${actividadActualizada.id}`, payload);
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
          await get().fetchProyectos();
          set({ loading: false });
        } catch (error: any) {
          set({ error: error.message, loading: false });
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

      desbloquearChecklist: async (proyectoId, actividadId, motivo) => {
        set({ loading: true });
        try {
          await api.put(`/operaciones/actividades/${actividadId}`, {
            checklistBloqueado: false,
            motivoBloqueoChecklist: undefined,
            desbloqueadoPor: get().usuarioActual,
            fechaDesbloqueoChecklist: new Date().toISOString()
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
            subidoPor: get().usuarioActual || 'Admin'
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
        hoy.setHours(0, 0, 0, 0);

        state.proyectos.forEach(p => {
          // Alerta de proyecto detenido o en rojo
          if (p.estado === 'Detenido') {
            nuevasAlertas.push({
              id: `alert-det-${p.id}`,
              tipo: 'atraso',
              titulo: `Proyecto Detenido: ${p.codigo}`,
              descripcion: `El proyecto "${p.nombre}" se encuentra actualmente en estado detenido.`,
              prioridad: 'Alta',
              area: p.area,
              fechaCreacion: new Date().toISOString().split('T')[0],
              leida: false,
              entidadId: p.id,
              entidadTipo: 'proyecto'
            });
          }

          if (p.semaforo === 'Rojo' && p.estado !== 'Finalizado') {
             nuevasAlertas.push({
              id: `alert-sem-${p.id}`,
              tipo: 'atraso',
              titulo: `Semaforo Rojo: ${p.codigo}`,
              descripcion: `El proyecto "${p.nombre}" requiere atención inmediata por proximidad a fecha fin.`,
              prioridad: 'Crítica',
              area: p.area,
              fechaCreacion: new Date().toISOString().split('T')[0],
              leida: false,
              entidadId: p.id,
              entidadTipo: 'proyecto'
            });
          }

          // Alertas de actividades vencidas
          (p.actividades || []).forEach(a => {
            if (a.estado !== 'Validada' && a.estado !== 'Completada' && a.fechaVencimiento) {
              const fv = new Date(a.fechaVencimiento);
              if (fv < hoy) {
                const resp = state.responsables.find(r => r.id === a.responsablePrincipalId);
                nuevasAlertas.push({
                  id: `alert-act-${a.id}`,
                  tipo: 'vencimiento',
                  titulo: `Actividad Vencida: ${p.codigo}`,
                  descripcion: `La actividad "${a.descripcion}" venció el ${a.fechaVencimiento.split('T')[0]}.`,
                  prioridad: a.prioridad === 'Crítica' ? 'Crítica' : 'Alta',
                  area: resp?.area || p.area,
                  fechaCreacion: new Date().toISOString().split('T')[0],
                  leida: false,
                  entidadId: a.id,
                  entidadTipo: 'actividad'
                });
              }
            }

            // Alertas de validaciones pendientes
            (a.validacionesRequeridas || []).forEach(v => {
              if (v.estado === 'Pendiente') {
                nuevasAlertas.push({
                  id: `alert-val-${v.id}`,
                  tipo: 'validacion',
                  titulo: `Validación Pendiente: ${p.codigo}`,
                  descripcion: `Se requiere validación de tipo "${v.tipo}" para la actividad "${a.descripcion}".`,
                  prioridad: 'Media',
                  area: v.area as Area,
                  fechaCreacion: new Date().toISOString().split('T')[0],
                  leida: false,
                  entidadId: v.id,
                  entidadTipo: 'validacion'
                });
              }
            });
          });
        });

        const alertasFinales = nuevasAlertas.map(na => {
          const existe = state.alertas.find(ea => ea.id === na.id);
          return existe ? { ...na, leida: existe.leida } : na;
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
        state.proyectos.forEach((p) => { (p.actividades || []).forEach((a) => { (a.validacionesRequeridas || []).forEach((v) => list.push({ proyecto: p, actividad: a, validacion: v })); }); });
        return list;
      },

      getProyectosFiltrados: () => {
        const state = get();
        const { filtros } = state;
        return state.proyectos.filter(p => {
          if (filtros.searchQuery && !p.nombre.toLowerCase().includes(filtros.searchQuery.toLowerCase()) && !p.codigo.toLowerCase().includes(filtros.searchQuery.toLowerCase())) return false;
          if (filtros.estado !== 'all' && p.estado !== filtros.estado) return false;
          if (filtros.area !== 'all' && p.area !== filtros.area) return false;
          if (filtros.prioridad !== 'all' && p.prioridad !== filtros.prioridad) return false;
          if (filtros.semaforo !== 'all' && p.semaforo !== filtros.semaforo) return false;
          if (filtros.responsable !== 'all' && p.responsablePrincipalId !== filtros.responsable) return false;
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
