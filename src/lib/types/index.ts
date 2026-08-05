/**
 * ============================================
 * TIPOS CENTRALIZADOS - HH T SOLUCIONA
 * Sistema ERP/CRM
 * ============================================
 *
 * Esta biblioteca de tipos define la estructura completa del sistema.
 * Diseñado para escalabilidad futura y compatibilidad con backend robusto.
 */

// ============================================
// ÁREAS Y ENUMERACIONES
// ============================================

export type Area =
  | 'Logística y Recursos'
  | 'Ingeniería y Supervisión Técnica'
  | 'Gestión Documentaria y Expedientes Técnicos'
  | 'Operaciones de Campo y Control de Obra';

export type Prioridad = 'Baja' | 'Media' | 'Alta' | 'Crítica';

export type EstadoProyecto = 'Planificación' | 'En Ejecución' | 'Detenido' | 'Finalizado';

export type Semaforo = 'Verde' | 'Amarillo' | 'Rojo';

export type TipoActividad = 'Técnica' | 'Administrativa' | 'Logística' | 'Documental' | 'Validación' | 'Tecnica' | 'Logistica' | 'Validacion';

export type TipoValidacion = 'Técnica' | 'Campo' | 'Documental' | 'Calidad' | 'Tecnica';

export type EstadoActividad = 'Pendiente' | 'En Progreso' | 'Completada' | 'Validada' | 'Bloqueada' | 'EnProgreso';

export type TipoDocumento = 'Técnico' | 'Administrativo' | 'Legal' | 'Financiero' | 'Otro';

export type EstadoDocumento = 'Borrador' | 'Pendiente Revisión' | 'Aprobado' | 'Obsoleto';

export type TipoAlerta = 'vencimiento' | 'atraso' | 'validacion' | 'documento' | 'seguimiento';

export type TipoInteraccion = 'Llamada' | 'Visita' | 'Reunión' | 'Cotización' | 'Nota' | 'Correo' | 'WhatsApp';

export type EtapaComercial =
  | 'Prospecto'
  | 'Contacto Inicial'
  | 'Visita Comercial'
  | 'Visita Técnica'
  | 'Seguimiento'
  | 'Cotización'
  | 'Negociación'
  | 'Orden de Servicio'
  | 'Servicio Ejecutado'
  | 'Facturación'
  | 'Postventa'
  | 'Ganado / Fidelizado'
  | 'Perdido';

export type Temperatura = 'Frío' | 'Tibio' | 'Caliente' | 'Muy Caliente';

export type Tarifa = 'MT1' | 'MT2' | 'MT3' | 'MT4' | 'BT2' | 'BT3' | 'BT4' | 'BT5B' | 'BT5BR' | 'BT5A50' | string;

// ============================================
// RESPONSABLE Y PERSONAL
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
  esSubresponsable?: boolean;
  reportesA?: string; // ID del responsable principal
  activo?: boolean;
}

export interface PersonalApoyo {
  id: string;
  responsableId: string;
  nombre: string;
  rol: string;
  fechaAsignacion: string;
}

// ============================================
// ACTIVIDADES Y SUBTAREAS
// ============================================

export interface Subtarea {
  id: string;
  actividadId: string;
  descripcion: string;
  completada: boolean;
  responsableId?: string;
  fechaVencimiento?: string;
  fechaCompletada?: string;
  // Checklist bloqueado
  bloqueada?: boolean;
  motivoBloqueo?: string;
}

export interface ValidacionRequerida {
  id: string;
  tipo: TipoValidacion;
  area: Area;
  estado: 'Pendiente' | 'Aprobada' | 'Rechazada' | 'Observada';
  validadoPor?: string;
  fechaValidacion?: string;
  observaciones?: string;
  evidenciaUrl?: string;
}

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

  // Responsables
  responsablePrincipalId: string;
  responsablesApoyo: string[]; // IDs de responsables de apoyo

  // Validaciones
  validacionesRequeridas: ValidacionRequerida[];

  // Subtareas y checklist
  subtareas: Subtarea[];
  checklistBloqueado?: boolean;
  motivoBloqueoChecklist?: string;

  // Seguimiento
  comentarios: Comentario[];
  evidencias: Evidencia[];
  observaciones?: string;
  seguimientoOperativo?: string;

  // Progreso
  progreso: number;
  ponderacion?: number; // Peso de la actividad en el cálculo de avance
  orden: number;

  // Historial
  historialCambios: HistorialCambio[];

  // Parent para anidación
  padreId?: string;
  esSuboperacion?: boolean;
}

// ============================================
// COMENTARIOS Y EVIDENCIAS
// ============================================

export interface Comentario {
  id: string;
  entidadId: string;
  entidadTipo: 'proyecto' | 'actividad' | 'tarea' | 'validacion';
  usuario: string;
  usuarioArea: Area;
  contenido: string;
  fecha: string;
  esInterno: boolean;
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
// ALCANCE DE PROYECTO
// ============================================

export interface EvaluacionTecnica {
  id: string;
  proyectoId: string;
  fechaEvaluacion: string;
  evaluadoPor: string;
  hallazgos: string[];
  solucionesPropuestas: string[];
  recomendaciones: string;
  estado: 'Pendiente' | 'En Progreso' | 'Completada';
  documentoUrl?: string;
}

export interface IngenieriaDiseno {
  id: string;
  proyectoId: string;
  fechaInicio: string;
  fechaFinEstimada?: string;
  ingenieroResponsable: string;
  planos: PlanoDiseno[];
  especificaciones: string[];
  estado: 'Pendiente' | 'En Progreso' | 'Aprobado' | 'Obsoleto';
}

export interface PlanoDiseno {
  id: string;
  numero: string;
  titulo: string;
  descripcion?: string;
  url: string;
  version: string;
  fecha: string;
  estado: 'Borrador' | 'En Revisión' | 'Aprobado';
}

export interface ExpedienteTecnico {
  id: string;
  proyectoId: string;
  numeroExpediente: string;
  titulo: string;
  descripcion?: string;
  contenido: Documento[];
  estado: 'En Elaboración' | 'Completo' | 'Archivado';
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface Suboperacion {
  id: string;
  proyectoId: string;
  actividadPadreId?: string;
  titulo: string;
  descripcion: string;
  tipo: TipoActividad;
  responsablePrincipalId: string;
  responsablesApoyo: string[];
  fechaInicio: string;
  fechaFinEstimada: string;
  fechaFinReal?: string;
  progreso: number;
  estado: EstadoActividad;
  entregables: Entregable[];
  validaciones: ValidacionRequerida[];
}

export interface Entregable {
  id: string;
  suboperacionId: string;
  nombre: string;
  descripcion?: string;
  tipo: 'Documento' | 'Plano' | 'Informe' | 'Certificado' | 'Otro';
  url?: string;
  estado: 'Pendiente' | 'En Progreso' | 'Entregado' | 'Aprobado';
  fechaEntrega?: string;
  fechaAprobacion?: string;
  aprobadoPor?: string;
}

// ============================================
// PROYECTO COMPLETO
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

  // Fechas
  fechaInicio: string;
  fechaFinEstimada: string;
  fechaFinReal?: string;

  // Responsables
  responsablePrincipalId: string;
  responsablesAdicionales: string[];

  // Área
  area: Area;

  // Contenido
  actividades: Actividad[];
  reportesDiarios: ReporteDiario[];
  comentarios: Comentario[];
  evidencias: Evidencia[];
  documentos: Documento[];

  // Alcance técnico
  evaluacionTecnica?: EvaluacionTecnica;
  ingenieriaDiseno?: IngenieriaDiseno;
  expedienteTecnico?: ExpedienteTecnico;
  suboperaciones: Suboperacion[];

  // Métricas
  avance: number;
  avanceCalculado: number;
  costoPresupuestado?: number;
  costoReal?: number;

  // Historial
  historialCambios: HistorialCambio[];

  // Índices de avance por área
  indicadoresAvance?: IndicadorAvance[];

  // Vínculo comercial
  cotizacion?: {
    estado: string;
  };
  cotizacionOrigen?: any;
  montoCotizado?: number;

  // Auditoría
  creadoPor?: string;
  fechaCreacion?: string;
  actualizadoPor?: string;
  fechaActualizacion?: string;
}

export interface IndicadorAvance {
  area: Area;
  porcentaje: number;
  actividadesTotal: number;
  actividadesCompletadas: number;
  ultimaActualizacion: string;
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
// GESTIÓN DOCUMENTAL
// ============================================

export interface Documento {
  id: string;
  proyectoId: string;
  clientId?: string;
  nombre: string;
  tipo: TipoDocumento;
  subtype?: string;
  numero?: string;
  url: string;
  version?: string;
  estado: EstadoDocumento;
  subidoPor: string;
  fechaSubida: string;
  fechaVencimiento?: string;
  validaciones: ValidacionRequerida[];
  observaciones?: string;
  esEntregable?: boolean;
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
// ALERTAS Y NOTIFICACIONES
// ============================================

export interface Alerta {
  id: string;
  tipo: TipoAlerta;
  entidadId: string;
  entidadTipo: 'proyecto' | 'actividad' | 'documento' | 'validacion';
  titulo: string;
  descripcion: string;
  prioridad: Prioridad;
  area: Area;
  leida: boolean;
  fechaCreacion: string;
  fechaResolucion?: string;
  notificada?: boolean;
}

export interface Notificacion {
  id: string;
  usuarioId: string;
  tipo: 'alerta' | 'recordatorio' | 'aviso' | 'aprobacion';
  titulo: string;
  mensaje: string;
  leida: boolean;
  fechaCreacion: string;
  urlAccion?: string;
}

// ============================================
// HISTORIAL Y AUDITORÍA
// ============================================

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
  motivo?: string; // Requerido cuando un admin revierte un checklist
}

export interface RegistroAuditoria {
  id: string;
  entidadTipo: string;
  entidadId: string;
  accion: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW';
  usuario: string;
  area: Area;
  fecha: string;
  datosAnteriores?: Record<string, any>;
  datosNuevos?: Record<string, any>;
  ip?: string;
}

// ============================================
// KPIs Y MÉTRICAS
// ============================================

export interface KPIPeriodo {
  periodo: 'semanal' | 'mensual' | 'anual';
  fechaInicio: string;
  fechaFin: string;
  proyectosIniciados: number;
  proyectosFinalizados: number;
  proyectosActivos: number;
  actividadesCreadas: number;
  actividadesCompletadas: number;
  promedioAvance: number;
  alertasTotales: number;
  alertasResueltas: number;
  tiempoPromedioActividad?: number; // días
  costoTotalProyectos?: number;
  roi?: number;
}

export interface IndicadorKPIMensual {
  mes: string;
  anio: number;
  proyectos: number;
  actividades: number;
  avancePromedio: number;
  alertas: number;
}

// ============================================
// CRM - PREPARACIÓN FUTURA
// ============================================

export interface Cliente {
  id: string;
  codigo: string;
  empresa: string;
  ruc: string;
  direccion: string;
  tarifa: Tarifa;
  contacto: string;
  telefono?: string;
  cargo?: string;
  correo?: string;
  asignadoA: string;
  diaTrabajo: string;
  estado: string;
  prioridad: Prioridad;
  accion: string;
  ultimoContacto: string;
  proximoSeguimiento: string;
  observaciones: string;
  zona: string;
  semaforo: Semaforo;
  temperatura: Temperatura;
  montoEstimado: number;
  probabilidad: number;
  ventaProyectada: number;
  tipoCliente?: string;
  etapaComercial: EtapaComercial;
  historialInteracciones?: InteraccionCRM[];
  archivosAdjuntos?: ArchivoAdjunto[];
  hallazgosTecnicos?: string[];
  solucionesPropuestas?: string[];
  propuestaTecnicaUrl?: string;
}

export interface InteraccionCRM {
  id: string;
  fecha: string;
  tipo: TipoInteraccion;
  accion: string;
  observaciones: string;
  usuario: string;
}

export interface ArchivoAdjunto {
  id: string;
  nombre: string;
  tipo: string;
  fecha: string;
  url: string;
  tamano: string;
}

export interface Cotizacion {
  id: string;
  clientId: string;
  proyectoId?: string;
  empresa: string;
  contacto: string;
  monto: number;
  estado: 'Pendiente' | 'Enviado' | 'Aprobado' | 'Rechazado' | 'Vencida';
  fecha: string;
  validez?: string;
  observaciones?: string;
  versiones?: CotizacionVersion[];
}

export interface CotizacionVersion {
  id: string;
  numero: number;
  monto: number;
  fecha: string;
  observaciones?: string;
  url?: string;
}

export interface FichaTecnica {
  id: string;
  clienteId: string;
  cliente: Cliente;
  tecnicoId: string;
  tecnico: Responsable;
  fechaVisita: string;
  observaciones?: string;
  hallazgos?: string;
  recomendaciones?: string;
  estado: 'PENDIENTE' | 'COMPLETADA' | 'OBSERVADA';
  firmaTecnico?: string;
  datosTecnicos?: Record<string, any>;
  adjuntos: FichaTecnicaAdjunto[];
  createdAt: string;
  updatedAt: string;
}

export interface FichaTecnicaAdjunto {
  id: string;
  fichaTecnicaId: string;
  nombre: string;
  url: string;
  tipo: 'Imagen' | 'PDF' | 'Documento';
  createdAt: string;
}

// ============================================
// FILTROS Y PAGINACIÓN
// ============================================

export interface FiltrosProyectos {
  searchQuery: string;
  estado: string;
  area: string;
  prioridad: string;
  semaforo: string;
  responsable: string;
  fechaInicio?: string;
  fechaFin?: string;
}

export interface FiltrosActividades {
  searchQuery: string;
  estado: string;
  tipo: string;
  prioridad: string;
  proyectoId: string;
  responsableId: string;
}

export interface Paginacion {
  pagina: number;
  porPagina: number;
  total: number;
  totalPaginas: number;
}

// ============================================
// RESPUESTAS API
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  mensaje?: string;
}

export interface ListaResponse<T> {
  items: T[];
  paginacion: Paginacion;
}

export interface EstadisticasProyecto {
  total: number;
  activos: number;
  planification: number;
  finalizados: number;
  detenidos: number;
  verdes: number;
  amarillos: number;
  rojos: number;
  avancePromedio: number;
  costoTotal: number;
}

export interface EstadisticasActividad {
  total: number;
  pendientes: number;
  enProgreso: number;
  completadas: number;
  bloqueadas: number;
  promedioDiasCompletacion?: number;
}
