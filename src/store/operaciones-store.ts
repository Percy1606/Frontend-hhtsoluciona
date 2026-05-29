import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================
// TIPOS PRINCIPALES - ESTRUCTURA INTEGRADA
// ============================================

export type Area = 'Steven' | 'Diego' | 'Guillermo' | 'Mario';

export type Prioridad = 'Baja' | 'Media' | 'Alta' | 'Crítica';

export type EstadoProyecto = 'Planificación' | 'En Ejecución' | 'Detenido' | 'Finalizado';

export type Semaforo = 'Verde' | 'Amarillo' | 'Rojo';

export type TipoActividad = 'Técnica' | 'Administrativa' | 'Logística' | 'Documental' | 'Validación';

export type TipoValidacion = 'Técnica' | 'Campo' | 'Documental' | 'Calidad';

export type EstadoActividad = 'Pendiente' | 'En Progreso' | 'Completada' | 'Validada' | 'Bloqueada';

// ============================================
// RESPONSABLE
// ============================================

export interface Responsable {
  id: string;
  nombre: string;
  area: Area;
  cargo: string;
  email?: string;
  telefono?: string;
  avatar?: string;
  color: string;
}

// ============================================
// ACTIVIDAD / SUBTAREA
// ============================================

export interface Actividad {
  id: string;
  proyectoId: string;
  descripcion: string;
  tipo: TipoActividad;
  prioridad: Prioridad;
  estado: EstadoActividad;
  fechaCreacion: string;
  fechaInicio?: string;
  fechaFin?: string;
  fechaVencimiento?: string;
  responsables: string[]; // IDs de responsables
  validacionesRequeridas: ValidacionRequerida[];
  subtareas: Subtarea[];
  comentarios: Comentario[];
  evidencias: Evidencia[];
  progreso: number;
  orden: number;
  padreId?: string; // Para subtareas anidadas
}

export interface Subtarea {
  id: string;
  actividadId: string;
  descripcion: string;
  completada: boolean;
  responsableId?: string;
  fechaVencimiento?: string;
  fechaCompletada?: string;
}

export interface ValidacionRequerida {
  id: string;
  tipo: TipoValidacion;
  area: Area;
  estado: 'Pendiente' | 'Aprobada' | 'Rechazada' | 'Observada';
  validadoPor?: string;
  fechaValidacion?: string;
  observaciones?: string;
}

// ============================================
// COMENTARIOS Y EVIDENCIAS
// ============================================

export interface Comentario {
  id: string;
  entidadId: string; // puede ser proyecto, actividad, etc.
  entidadTipo: 'proyecto' | 'actividad' | 'tarea' | 'validacion';
  usuario: string;
  usuarioArea: Area;
  contenido: string;
  fecha: string;
  esInterno: boolean; // true = solo visible internamente
}

export interface Evidencia {
  id: string;
  entidadId: string;
  entidadTipo: 'proyecto' | 'actividad' | 'tarea' | 'validacion';
  nombre: string;
  tipo: string;
  url: string;
  tamano: string;
  subidoPor: string;
  fecha: string;
  descripcion?: string;
}

// ============================================
// REPORTE DIARIO
// ============================================

export interface ReporteDiario {
  id: string;
  proyectoId: string;
  fecha: string;
  usuario: string;
  usuarioArea: Area;
  actividades: string;
  hallazgos: string;
  personal: string;
  proximosPasos: string;
  evidencias: Evidencia[];
  estado: 'Borrador' | 'Enviado' | 'Revisado';
}

// ============================================
// PROYECTO MEJORADO
// ============================================

export interface Proyecto {
  id: string;
  clientId: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  estado: EstadoProyecto;
  semaforo: Semaforo;
  prioridad: Prioridad;
  fechaInicio: string;
  fechaFinEstimada: string;
  fechaFinReal?: string;
  responsablePrincipal: string; // ID de responsable
  responsables: string[]; // IDs adicionales
  area: Area; // Área principal
  actividades: Actividad[];
  reportesDiarios: ReporteDiario[];
  comentarios: Comentario[];
  evidencias: Evidencia[];
  historialCambios: HistorialCambio[];
  avance: number;
  avanceCalculado: number; // Calculado automáticamente
  costoPresupuestado?: number;
  costoReal?: number;
  documentos: Documento[];
  // Fechas de validación
  validacionTecnica?: ValidacionRequerida;
  validacionCampo?: ValidacionRequerida;
}

export interface HistorialCambio {
  id: string;
  entidadId: string;
  entidadTipo: 'proyecto' | 'actividad' | 'tarea' | 'validacion';
  campo: string;
  valorAnterior: string;
  valorNuevo: string;
  usuario: string;
  area: Area;
  fecha: string;
}

// ============================================
// GESTIÓN DOCUMENTAL
// ============================================

export interface Documento {
  id: string;
  proyectoId: string;
  clientId?: string;
  nombre: string;
  tipo: 'Técnico' | 'Administrativo' | 'Legal' | 'Financiero' | 'Otro';
  subtype?: string;
  numero?: string;
  url: string;
  version?: string;
  estado: 'Borrador' | 'Pendiente Revisión' | 'Aprobado' | 'Obsoleto';
  subidoPor: string;
  fechaSubida: string;
  fechaVencimiento?: string;
  validaciones: ValidacionRequerida[];
  observaciones?: string;
}

// ============================================
// CONTROL LOGÍSTICO
// ============================================

export interface Material {
  id: string;
  proyectoId?: string;
  nombre: string;
  tipo: 'Equipo' | 'Material' | 'Herramienta' | 'Consumible';
  cantidad: number;
  unidad: string;
  estado: 'Disponible' | 'Asignado' | 'En Uso' | 'Mantenimiento' | 'Dañado';
  ubicacion?: string;
  proveedor?: string;
  costoUnitario?: number;
}

export interface AsignacionLogistica {
  id: string;
  proyectoId: string;
  materialId: string;
  cantidad: number;
  fechaAsignacion: string;
  fechaDevolucion?: string;
  estado: 'Asignado' | 'Devuelto' | 'Pendiente';
  asignadoA: string;
  observaciones?: string;
}

// ============================================
// ALERTAS Y MÉTRICAS
// ============================================

export interface Alerta {
  id: string;
  tipo: 'vencimiento' | 'atraso' | 'validacion' | 'documento' | 'seguimiento';
  entidadId: string;
  entidadTipo: 'proyecto' | 'actividad' | 'documento' | 'validacion';
  titulo: string;
  descripcion: string;
  prioridad: Prioridad;
  area: Area;
  leida: boolean;
  fechaCreacion: string;
  fechaResolucion?: string;
}

// ============================================
// INTERFAZ DEL STORE
// ============================================

interface OperacionesState {
  // Datos principales
  proyectos: Proyecto[];
  responsables: Responsable[];
  alertas: Alerta[];

  // Filtros
  filtros: {
    searchQuery: string;
    estado: string;
    area: string;
    prioridad: string;
    semaforo: string;
    responsable: string;
    fechaInicio?: string;
    fechaFin?: string;
  };

  // Acciones de filtros
  setSearchQuery: (query: string) => void;
  setEstado: (estado: string) => void;
  setArea: (area: string) => void;
  setPrioridad: (prioridad: string) => void;
  setSemaforo: (semaforo: string) => void;
  setResponsable: (responsable: string) => void;
  setFechas: (inicio?: string, fin?: string) => void;
  resetFiltros: () => void;

  // Acciones de Proyectos
  addProyecto: (proyecto: Omit<Proyecto, 'id' | 'codigo' | 'avanceCalculado' | 'historialCambios'>) => void;
  updateProyecto: (proyecto: Proyecto) => void;
  deleteProyecto: (id: string) => void;
  calcularAvanceProyecto: (proyectoId: string) => void;

  // Acciones de Actividades
  addActividad: (proyectoId: string, actividad: Omit<Actividad, 'id'>) => void;
  updateActividad: (proyectoId: string, actividad: Actividad) => void;
  deleteActividad: (proyectoId: string, actividadId: string) => void;
  toggleSubtarea: (proyectoId: string, actividadId: string, subtareaId: string) => void;

  // Validaciones
  aprobarValidacion: (proyectoId: string, actividadId: string, validacionId: string, observaciones?: string) => void;
  rechazarValidacion: (proyectoId: string, actividadId: string, validacionId: string, observaciones: string) => void;

  // Comentarios y Evidencias
  addComentario: (entidadId: string, entidadTipo: 'proyecto' | 'actividad' | 'tarea' | 'validacion', contenido: string, usuario: string, area: Area, esInterno?: boolean) => void;
  addEvidencia: (entidadId: string, entidadTipo: 'proyecto' | 'actividad' | 'tarea' | 'validacion', evidencia: Omit<Evidencia, 'id' | 'fecha'>) => void;

  // Reportes Diarios
  addReporteDiario: (proyectoId: string, reporte: Omit<ReporteDiario, 'id'>) => void;

  // Historial
  addHistorialCambio: (entidadId: string, entidadTipo: 'proyecto' | 'actividad' | 'tarea' | 'validacion', campo: string, valorAnterior: string, valorNuevo: string, usuario: string, area: Area) => void;

  // Documentos
  addDocumento: (proyectoId: string, documento: Omit<Documento, 'id'>) => void;
  updateDocumento: (proyectoId: string, documento: Documento) => void;

  // Responsables
  addResponsable: (responsable: Omit<Responsable, 'id'>) => void;
  updateResponsable: (responsable: Responsable) => void;

  // Alertas
  generarAlertas: () => void;
  marcarAlertaLeida: (alertaId: string) => void;
  alertasNoLeidas: () => number;

  // Utilidades
  getProyectosConActividadesVencidas: () => Proyecto[];
  getProyectosPorArea: (area: Area) => Proyecto[];
  getActividadesPorResponsable: (responsableId: string) => Actividad[];
}

// ============================================
// DATOS INICIALES - RESPONSABLES POR ÁREA
// ============================================

const RESPONSABLES_DEFAULT: Responsable[] = [
  { id: 'resp_steven', nombre: 'Steven', area: 'Steven', cargo: 'Coordinador Logístico', color: '#3B82F6', email: 'steven@hhtsoluciona.com', telefono: '999888777' },
  { id: 'resp_diego', nombre: 'Diego', area: 'Diego', cargo: 'Ingeniero Supervisor', color: '#8B5CF6', email: 'diego@hhtsoluciona.com', telefono: '999888776' },
  { id: 'resp_guillermo', nombre: 'Guillermo', area: 'Guillermo', cargo: 'Gestor Documental', color: '#10B981', email: 'guillermo@hhtsoluciona.com', telefono: '999888775' },
  { id: 'resp_mario', nombre: 'Mario', area: 'Mario', cargo: 'Soporte de Campo', color: '#F59E0B', email: 'mario@hhtsoluciona.com', telefono: '999888774' },
];

// ============================================
// IMPLEMENTACIÓN DEL STORE
// ============================================

const getNextProjectCode = (proyectos: Proyecto[]): string => {
  const year = new Date().getFullYear();
  const count = proyectos.length + 1;
  return `HHT-OPE-${year.toString().slice(-2)}${count.toString().padStart(3, '0')}`;
};

const calculateSemaforo = (proyecto: Partial<Proyecto>): Semaforo => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  if (proyecto.estado === 'Finalizado') return 'Verde';
  if (proyecto.estado === 'Detenido') return 'Rojo';

  const fechaFin = proyecto.fechaFinEstimada ? new Date(proyecto.fechaFinEstimada) : null;
  const diasRestantes = fechaFin ? Math.ceil((fechaFin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)) : 999;

  // Rojo: menos de 3 días o vencido
  if (diasRestantes < 3) return 'Rojo';
  // Amarillo: entre 3 y 7 días
  if (diasRestantes <= 7) return 'Amarillo';
  // Verde: más de 7 días
  return 'Verde';
};

const calculateAvance = (actividades: Actividad[]): number => {
  if (actividades.length === 0) return 0;
  const totalPeso = actividades.reduce((acc, a) => acc + (a.ponderacion || 1), 0);
  const pesosCompletados = actividades
    .filter(a => a.estado === 'Completada' || a.estado === 'Validada')
    .reduce((acc, a) => acc + (a.ponderacion || 1), 0);
  return totalPeso > 0 ? Math.round((pesosCompletados / totalPeso) * 100) : 0;
};

export const useOperacionesStore = create<OperacionesState>()(
  persist(
    (set, get) => ({
      proyectos: [],
      responsables: RESPONSABLES_DEFAULT,
      alertas: [],

      filtros: {
        searchQuery: '',
        estado: 'all',
        area: 'all',
        prioridad: 'all',
        semaforo: 'all',
        responsable: 'all',
      },

      setSearchQuery: (query) => set((state) => ({
        filtros: { ...state.filtros, searchQuery: query }
      })),

      setEstado: (estado) => set((state) => ({
        filtros: { ...state.filtros, estado }
      })),

      setArea: (area) => set((state) => ({
        filtros: { ...state.filtros, area }
      })),

      setPrioridad: (prioridad) => set((state) => ({
        filtros: { ...state.filtros, prioridad }
      })),

      setSemaforo: (semaforo) => set((state) => ({
        filtros: { ...state.filtros, semaforo }
      })),

      setResponsable: (responsable) => set((state) => ({
        filtros: { ...state.filtros, responsable }
      })),

      setFechas: (inicio, fin) => set((state) => ({
        filtros: { ...state.filtros, fechaInicio: inicio, fechaFin: fin }
      })),

      resetFiltros: () => set({
        filtros: {
          searchQuery: '',
          estado: 'all',
          area: 'all',
          prioridad: 'all',
          semaforo: 'all',
          responsable: 'all',
        }
      }),

      addProyecto: (proyectoData) => set((state) => {
        console.log("addProyecto: Incoming projectData", proyectoData);
        const codigo = getNextProjectCode(state.proyectos);
        const nuevoProyecto: Proyecto = {
          ...proyectoData,
          id: `proj_${Date.now()}`,
          codigo,
          avance: 0, // Ensure initial avance is 0
          avanceCalculado: 0, // Ensure initial avanceCalculado is 0
          actividades: [], // Ensure initial actividades is an empty array
          reportesDiarios: [],
          comentarios: [],
          evidencias: [],
          documentos: [],
          historialCambios: [{
            id: `hist_${Date.now()}`,
            entidadId: `proj_${Date.now()}`,
            entidadTipo: 'proyecto',
            campo: 'Creación',
            valorAnterior: '',
            valorNuevo: codigo,
            usuario: 'Sistema',
            area: proyectoData.area, // Use the area from proyectoData
            fecha: new Date().toISOString().split('T')[0]
          }]
        };

        // Calcular semáforo inicial
        nuevoProyecto.semaforo = calculateSemaforo(nuevoProyecto);

        const updatedProyectos = [nuevoProyecto, ...state.proyectos];
        console.log("addProyecto: New proyectos state", updatedProyectos);
        return { proyectos: updatedProyectos };
      }),

      updateProyecto: (proyectoActualizado) => set((state) => ({
        proyectos: state.proyectos.map((p) => {
          if (p.id !== proyectoActualizado.id) return p;

          // Calcular avance automático
          const avanceCalculado = calculateAvance(proyectoActualizado.actividades);
          const semaforo = calculateSemaforo(proyectoActualizado);

          return {
            ...proyectoActualizado,
            avanceCalculado,
            semaforo,
            avance: proyectoActualizado.avance // Mantener avance manual si existe
          };
        })
      })),

      deleteProyecto: (id) => set((state) => ({
        proyectos: state.proyectos.filter((p) => p.id !== id)
      })),

      calcularAvanceProyecto: (proyectoId) => set((state) => ({
        proyectos: state.proyectos.map((p) => {
          if (p.id !== proyectoId) return p;
          const avanceCalculado = calculateAvance(p.actividades);
          const semaforo = calculateSemaforo(p);
          return { ...p, avanceCalculado, semaforo };
        })
      })),

      addActividad: (proyectoId, actividadData) => set((state) => ({
        proyectos: state.proyectos.map((p) => {
          if (p.id !== proyectoId) return p;

          const nuevaActividad: Actividad = {
            ...actividadData,
            id: `act_${Date.now()}`,
            orden: p.actividades.length + 1
          };

          return {
            ...p,
            actividades: [...p.actividades, nuevaActividad]
          };
        })
      })),

      updateActividad: (proyectoId, actividadActualizada) => set((state) => ({
        proyectos: state.proyectos.map((p) => {
          if (p.id !== proyectoId) return p;

          return {
            ...p,
            actividades: p.actividades.map((a) =>
              a.id === actividadActualizada.id ? actividadActualizada : a
            )
          };
        })
      })),

      deleteActividad: (proyectoId, actividadId) => set((state) => ({
        proyectos: state.proyectos.map((p) => {
          if (p.id !== proyectoId) return p;

          return {
            ...p,
            actividades: p.actividades.filter((a) => a.id !== actividadId)
          };
        })
      })),

      toggleSubtarea: (proyectoId, actividadId, subtareaId) => set((state) => ({
        proyectos: state.proyectos.map((p) => {
          if (p.id !== proyectoId) return p;

          return {
            ...p,
            actividades: p.actividades.map((a) => {
              if (a.id !== actividadId) return a;

              const subtareas = a.subtareas.map((s) =>
                s.id === subtareaId
                  ? { ...s, completada: !s.completada, fechaCompletada: !s.completada ? new Date().toISOString().split('T')[0] : undefined }
                  : s
              );

              // Actualizar progreso de la actividad
              const completadas = subtareas.filter(s => s.completada).length;
              const progreso = subtareas.length > 0 ? Math.round((completadas / subtareas.length) * 100) : (a.estado === 'Completada' ? 100 : a.progreso);

              return {
                ...a,
                subtareas,
                progreso,
                estado: progreso === 100 ? 'Completada' : a.estado
              };
            })
          };
        })
      })),

      aprobarValidacion: (proyectoId, actividadId, validacionId, observaciones) => set((state) => {
        const today = new Date().toISOString().split('T')[0];
        const area = 'Diego'; // Por defecto, validaciones técnicas las hace Diego

        return {
          proyectos: state.proyectos.map((p) => {
            if (p.id !== proyectoId) return p;

            return {
              ...p,
              actividades: p.actividades.map((a) => {
                if (a.id !== actividadId) return a;

                return {
                  ...a,
                  validacionesRequeridas: a.validacionesRequeridas.map((v) =>
                    v.id === validacionId
                      ? { ...v, estado: 'Aprobada', validadoPor: area, fechaValidacion: today, observaciones }
                      : v
                  )
                };
              })
            };
          })
        };
      }),

      rechazarValidacion: (proyectoId, actividadId, validacionId, observaciones) => set((state) => {
        const today = new Date().toISOString().split('T')[0];

        return {
          proyectos: state.proyectos.map((p) => {
            if (p.id !== proyectoId) return p;

            return {
              ...p,
              actividades: p.actividades.map((a) => {
                if (a.id !== actividadId) return a;

                return {
                  ...a,
                  validacionesRequeridas: a.validacionesRequeridas.map((v) =>
                    v.id === validacionId
                      ? { ...v, estado: 'Rechazada', validadoPor: 'Diego', fechaValidacion: today, observaciones }
                      : v
                  ),
                  estado: 'Bloqueada'
                };
              })
            };
          })
        };
      }),

      addComentario: (entidadId, entidadTipo, contenido, usuario, area, esInterno = false) => set((state) => {
        const today = new Date().toISOString().split('T')[0];
        const nuevoComentario: Comentario = {
          id: `com_${Date.now()}`,
          entidadId,
          entidadTipo,
          usuario,
          usuarioArea: area,
          contenido,
          fecha: today,
          esInterno
        };

        return {
          proyectos: state.proyectos.map((p) => {
            // Agregar al proyecto
            if (entidadTipo === 'proyecto' && p.id === entidadId) {
              return { ...p, comentarios: [...p.comentarios, nuevoComentario] };
            }

            // Agregar a actividad
            return {
              ...p,
              actividades: p.actividades.map((a) => {
                if (entidadTipo === 'actividad' && a.id === entidadId) {
                  return { ...a, comentarios: [...a.comentarios, nuevoComentario] };
                }
                return a;
              })
            };
          })
        };
      }),

      addEvidencia: (entidadId, entidadTipo, evidenciaData) => set((state) => {
        const today = new Date().toISOString().split('T')[0];
        const nuevaEvidencia: Evidencia = {
          ...evidenciaData,
          id: `evid_${Date.now()}`,
          fecha: today
        };

        return {
          proyectos: state.proyectos.map((p) => {
            if (entidadTipo === 'proyecto' && p.id === entidadId) {
              return { ...p, evidencias: [...p.evidencias, nuevaEvidencia] };
            }

            return {
              ...p,
              actividades: p.actividades.map((a) => {
                if (entidadTipo === 'actividad' && a.id === entidadId) {
                  return { ...a, evidencias: [...a.evidencias, nuevaEvidencia] };
                }
                return a;
              })
            };
          })
        };
      }),

      addReporteDiario: (proyectoId, reporteData) => set((state) => {
        const nuevoReporte: ReporteDiario = {
          ...reporteData,
          id: `rep_${Date.now()}`
        };

        return {
          proyectos: state.proyectos.map((p) => {
            if (p.id !== proyectoId) return p;
            return { ...p, reportesDiarios: [...p.reportesDiarios, nuevoReporte] };
          })
        };
      }),

      addHistorialCambio: (entidadId, entidadTipo, campo, valorAnterior, valorNuevo, usuario, area) => set((state) => {
        const today = new Date().toISOString().split('T')[0];
        const cambio: HistorialCambio = {
          id: `hist_${Date.now()}`,
          entidadId,
          entidadTipo,
          campo,
          valorAnterior,
          valorNuevo,
          usuario,
          area,
          fecha: today
        };

        return {
          proyectos: state.proyectos.map((p) => {
            if (entidadTipo === 'proyecto' && p.id === entidadId) {
              return { ...p, historialCambios: [...p.historialCambios, cambio] };
            }

            return {
              ...p,
              actividades: p.actividades.map((a) => {
                if (entidadTipo === 'actividad' && a.id === entidadId) {
                  return { ...a, historialCambios: [...(a.historialCambios || []), cambio] };
                }
                return a;
              })
            };
          })
        };
      }),

      addDocumento: (proyectoId, documentoData) => set((state) => {
        const nuevoDocumento: Documento = {
          ...documentoData,
          id: `doc_${Date.now()}`
        };

        return {
          proyectos: state.proyectos.map((p) => {
            if (p.id !== proyectoId) return p;
            return { ...p, documentos: [...p.documentos, nuevoDocumento] };
          })
        };
      }),

      updateDocumento: (proyectoId, documentoActualizado) => set((state) => ({
        proyectos: state.proyectos.map((p) => {
          if (p.id !== proyectoId) return p;
          return {
            ...p,
            documentos: p.documentos.map((d) =>
              d.id === documentoActualizado.id ? documentoActualizado : d
            )
          };
        })
      })),

      addResponsable: (responsableData) => set((state) => {
        const nuevo: Responsable = {
          ...responsableData,
          id: `resp_${Date.now()}`
        };
        return { responsables: [...state.responsables, nuevo] };
      }),

      updateResponsable: (responsableActualizado) => set((state) => ({
        responsables: state.responsables.map((r) =>
          r.id === responsableActualizado.id ? responsableActualizado : r
        )
      })),

      generarAlertas: () => set((state) => {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const nuevasAlertas: Alerta[] = [];

        state.proyectos.forEach((proyecto) => {
          // Alertas de proyectos vencidos o por vencer
          const fechaFin = proyecto.fechaFinEstimada ? new Date(proyecto.fechaFinEstimada) : null;
          if (fechaFin) {
            const diasRestantes = Math.ceil((fechaFin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

            if (diasRestantes < 0) {
              nuevasAlertas.push({
                id: `alert_${proyecto.id}_vencido`,
                tipo: 'vencimiento',
                entidadId: proyecto.id,
                entidadTipo: 'proyecto',
                titulo: `Proyecto Vencido: ${proyecto.codigo}`,
                descripcion: `El proyecto ${proyecto.nombre} ha vencido.`,
                prioridad: 'Crítica',
                area: proyecto.area,
                leida: false,
                fechaCreacion: hoy.toISOString().split('T')[0]
              });
            } else if (diasRestantes <= 3) {
              nuevasAlertas.push({
                id: `alert_${proyecto.id}_por_vencer`,
                tipo: 'vencimiento',
                entidadId: proyecto.id,
                entidadTipo: 'proyecto',
                titulo: `Proyecto por Vencer: ${proyecto.codigo}`,
                descripcion: `El proyecto vence en ${diasRestantes} días.`,
                prioridad: 'Alta',
                area: proyecto.area,
                leida: false,
                fechaCreacion: hoy.toISOString().split('T')[0]
              });
            }
          }

          // Alertas de actividades vencidas
          proyecto.actividades.forEach((actividad) => {
            if (actividad.fechaVencimiento) {
              const fechaVenc = new Date(actividad.fechaVencimiento);
              if (fechaVenc < hoy && actividad.estado !== 'Completada' && actividad.estado !== 'Validada') {
                nuevasAlertas.push({
                  id: `alert_${actividad.id}_atrasada`,
                  tipo: 'atraso',
                  entidadId: actividad.id,
                  entidadTipo: 'actividad',
                  titulo: `Actividad Atrasada: ${actividad.descripcion.substring(0, 30)}...`,
                  descripcion: `La actividad está vencida desde ${actividad.fechaVencimiento}`,
                  prioridad: actividad.prioridad === 'Crítica' ? 'Crítica' : 'Alta',
                  area: proyecto.area,
                  leida: false,
                  fechaCreacion: hoy.toISOString().split('T')[0]
                });
              }
            }

            // Alertas de validaciones pendientes
            actividad.validacionesRequeridas.forEach((validacion) => {
              if (validacion.estado === 'Pendiente') {
                nuevasAlertas.push({
                  id: `alert_${validacion.id}_validacion`,
                  tipo: 'validacion',
                  entidadId: validacion.id,
                  entidadTipo: 'validacion',
                  titulo: `Validación Pendiente: ${validacion.tipo}`,
                  descripcion: `Esperando validación de ${validacion.area} para actividad: ${actividad.descripcion.substring(0, 30)}`,
                  prioridad: 'Media',
                  area: validacion.area,
                  leida: false,
                  fechaCreacion: hoy.toISOString().split('T')[0]
                });
              }
            });
          });

          // Alertas de documentos pendientes
          proyecto.documentos.forEach((doc) => {
            if (doc.estado === 'Pendiente Revisión') {
              nuevasAlertas.push({
                id: `alert_${doc.id}_documento`,
                tipo: 'documento',
                entidadId: doc.id,
                entidadTipo: 'documento',
                titulo: `Documento Pendiente: ${doc.nombre}`,
                descripcion: `Documento requiere revisión: ${doc.tipo}`,
                prioridad: 'Baja',
                area: 'Guillermo',
                leida: false,
                fechaCreacion: hoy.toISOString().split('T')[0]
              });
            }
          });
        });

        return { alertas: nuevasAlertas };
      }),

      marcarAlertaLeida: (alertaId) => set((state) => ({
        alertas: state.alertas.map((a) =>
          a.id === alertaId ? { ...a, leida: true } : a
        )
      })),

      alertasNoLeidas: () => {
        const state = get();
        return state.alertas.filter((a) => !a.leida).length;
      },

      getProyectosConActividadesVencidas: () => {
        const state = get();
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        return state.proyectos.filter((p) =>
          p.actividades.some((a) => {
            if (!a.fechaVencimiento || a.estado === 'Completada' || a.estado === 'Validada') return false;
            return new Date(a.fechaVencimiento) < hoy;
          })
        );
      },

      getProyectosPorArea: (area) => {
        const state = get();
        return state.proyectos.filter((p) => p.area === area);
      },

      getActividadesPorResponsable: (responsableId) => {
        const state = get();
        const actividades: Actividad[] = [];

        state.proyectos.forEach((p) => {
          p.actividades.forEach((a) => {
            if (a.responsables.includes(responsableId)) {
              actividades.push(a);
            }
          });
        });

        return actividades;
      }
    }),
    {
      name: 'hht-operaciones-store',
    }
  )
);