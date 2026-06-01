import { NextRequest, NextResponse } from 'next/server';
import type {
  Area,
  Prioridad,
  EstadoProyecto,
  Semaforo,
  Responsable,
  Proyecto,
  Actividad,
  EvaluacionTecnica,
  IngenieriaDiseno,
  Suboperacion,
} from '@/lib/types';

// ============================================
// TIPOS LOCALES (compatibles con lib/types)
// ============================================

type EstadoActividad = 'Pendiente' | 'En Progreso' | 'Completada' | 'Validada' | 'Bloqueada';

interface Subtarea {
  id: string;
  actividadId: string;
  descripcion: string;
  completada: boolean;
  responsableId?: string;
  fechaVencimiento?: string;
  fechaCompletada?: string;
}

interface ValidacionRequerida {
  id: string;
  tipo: 'Técnica' | 'Campo' | 'Documental' | 'Calidad';
  area: Area;
  estado: 'Pendiente' | 'Aprobada' | 'Rechazada' | 'Observada';
  validadoPor?: string;
  fechaValidacion?: string;
  observaciones?: string;
}

interface Comentario {
  id: string;
  entidadId: string;
  entidadTipo: 'proyecto' | 'actividad' | 'tarea' | 'validacion';
  usuario: string;
  usuarioArea: Area;
  contenido: string;
  fecha: string;
  esInterno: boolean;
}

interface Evidencia {
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

interface HistorialCambio {
  id: string;
  campo: string;
  valorAnterior: string;
  valorNuevo: string;
  usuario: string;
  area: Area;
  fecha: string;
}

interface IndicadorAvance {
  area: Area;
  porcentaje: number;
  actividadesTotal: number;
  actividadesCompletadas: number;
  ultimaActualizacion: string;
}

interface Documento {
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

interface ReporteDiario {
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

interface Entregable {
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
// BASE DE DATOS EN MEMORIA
// ============================================

let proyectos: Proyecto[] = [
  {
    id: 'proj_001',
    clientId: '1',
    codigo: 'HHT-OPE-26-001',
    nombre: 'Mantenimiento Preventivo Subestación RIO VERDE',
    descripcion: 'Mantenimiento integral de subestación de media tensión',
    estado: 'En Ejecución',
    semaforo: 'Verde',
    prioridad: 'Alta',
    fechaInicio: '2026-05-10',
    fechaFinEstimada: '2026-05-28',
    responsablePrincipalId: 'resp_diego',
    responsablesAdicionales: ['resp_mario'],
    area: 'Ingeniería y Supervisión Técnica',
    avance: 85,
    avanceCalculado: 85,
    indicadoresAvance: [
      { area: 'Ingeniería y Supervisión Técnica', porcentaje: 90, actividadesTotal: 4, actividadesCompletadas: 3, ultimaActualizacion: '2026-05-20' },
      { area: 'Operaciones de Campo y Control de Obra', porcentaje: 50, actividadesTotal: 2, actividadesCompletadas: 1, ultimaActualizacion: '2026-05-20' },
    ],
    actividades: [
      {
        id: 'act_001',
        proyectoId: 'proj_001',
        descripcion: 'Limpieza de aisladores y bushings',
        tipo: 'Técnica',
        prioridad: 'Alta',
        estado: 'Completada',
        fechaCreacion: '2026-05-10',
        fechaInicio: '2026-05-10',
        fechaFin: '2026-05-12',
        fechaVencimiento: '2026-05-12',
        responsablePrincipalId: 'resp_mario',
        responsablesApoyo: [],
        validacionesRequeridas: [
          {
            id: 'val_001',
            tipo: 'Técnica',
            area: 'Ingeniería y Supervisión Técnica',
            estado: 'Aprobada',
            validadoPor: 'Diego',
            fechaValidacion: '2026-05-12'
          }
        ],
        subtareas: [
          { id: 'sub_001', actividadId: 'act_001', descripcion: 'Limpieza de aisladores de porcelana', completada: true, responsableId: 'resp_mario' },
          { id: 'sub_002', actividadId: 'act_001', descripcion: 'Limpieza de bushings', completada: true, responsableId: 'resp_mario' }
        ],
        comentarios: [],
        evidencias: [],
        progreso: 100,
        ponderacion: 1,
        orden: 1,
        historialCambios: []
      },
      {
        id: 'act_002',
        proyectoId: 'proj_001',
        descripcion: 'Pruebas dieléctricas de transformador',
        tipo: 'Técnica',
        prioridad: 'Crítica',
        estado: 'Completada',
        fechaCreacion: '2026-05-12',
        fechaInicio: '2026-05-13',
        fechaFin: '2026-05-15',
        fechaVencimiento: '2026-05-15',
        responsablePrincipalId: 'resp_diego',
        responsablesApoyo: [],
        validacionesRequeridas: [
          {
            id: 'val_002',
            tipo: 'Técnica',
            area: 'Ingeniería y Supervisión Técnica',
            estado: 'Aprobada',
            validadoPor: 'Diego',
            fechaValidacion: '2026-05-15'
          }
        ],
        subtareas: [
          { id: 'sub_003', actividadId: 'act_002', descripcion: 'Prueba de resistencia de aislamiento', completada: true, responsableId: 'resp_diego' },
          { id: 'sub_004', actividadId: 'act_002', descripcion: 'Prueba de rigidez dieléctrica', completada: true, responsableId: 'resp_diego' }
        ],
        comentarios: [],
        evidencias: [],
        progreso: 100,
        ponderacion: 1,
        orden: 2,
        historialCambios: []
      },
      {
        id: 'act_003',
        proyectoId: 'proj_001',
        descripcion: 'Regeneración de aceite dieléctrico',
        tipo: 'Técnica',
        prioridad: 'Alta',
        estado: 'En Progreso',
        fechaCreacion: '2026-05-15',
        fechaInicio: '2026-05-20',
        fechaVencimiento: '2026-05-25',
        responsablePrincipalId: 'resp_mario',
        responsablesApoyo: ['resp_steven'],
        validacionesRequeridas: [
          {
            id: 'val_003',
            tipo: 'Campo',
            area: 'Operaciones de Campo y Control de Obra',
            estado: 'Pendiente'
          },
          {
            id: 'val_004',
            tipo: 'Técnica',
            area: 'Ingeniería y Supervisión Técnica',
            estado: 'Pendiente'
          }
        ],
        subtareas: [
          { id: 'sub_005', actividadId: 'act_003', descripcion: 'Drenado de aceite usado', completada: true, responsableId: 'resp_mario' },
          { id: 'sub_006', actividadId: 'act_003', descripcion: 'Filtrado de aceite', completada: false, responsableId: 'resp_mario' },
          { id: 'sub_007', actividadId: 'act_003', descripcion: 'Llenado de aceite nuevo', completada: false, responsableId: 'resp_mario' }
        ],
        comentarios: [],
        evidencias: [],
        progreso: 40,
        ponderacion: 1,
        orden: 3,
        historialCambios: []
      },
      {
        id: 'act_004',
        proyectoId: 'proj_001',
        descripcion: 'Pruebas de inyección de corriente a relés',
        tipo: 'Validación',
        prioridad: 'Alta',
        estado: 'Pendiente',
        fechaCreacion: '2026-05-20',
        fechaVencimiento: '2026-05-28',
        responsablePrincipalId: 'resp_diego',
        responsablesApoyo: [],
        validacionesRequeridas: [],
        subtareas: [],
        comentarios: [],
        evidencias: [],
        progreso: 0,
        ponderacion: 1,
        orden: 4,
        historialCambios: []
      }
    ],
    reportesDiarios: [],
    comentarios: [],
    evidencias: [],
    documentos: [],
    suboperaciones: [],
    historialCambios: []
  },
  {
    id: 'proj_002',
    clientId: '3',
    codigo: 'HHT-OPE-26-002',
    nombre: 'Iluminación LED Almacenes LOS PEROLES',
    descripcion: 'Proyecto de modernización de sistema de iluminación',
    estado: 'Finalizado',
    semaforo: 'Verde',
    prioridad: 'Media',
    fechaInicio: '2026-05-01',
    fechaFinEstimada: '2026-05-15',
    fechaFinReal: '2026-05-14',
    responsablePrincipalId: 'resp_mario',
    responsablesAdicionales: [],
    area: 'Operaciones de Campo y Control de Obra',
    avance: 100,
    avanceCalculado: 100,
    indicadoresAvance: [
      { area: 'Operaciones de Campo y Control de Obra', porcentaje: 100, actividadesTotal: 2, actividadesCompletadas: 2, ultimaActualizacion: '2026-05-14' },
    ],
    actividades: [
      {
        id: 'act_005',
        proyectoId: 'proj_002',
        descripcion: 'Desmontaje de luminarias antiguas',
        tipo: 'Técnica',
        prioridad: 'Media',
        estado: 'Completada',
        fechaCreacion: '2026-05-01',
        fechaFin: '2026-05-05',
        fechaVencimiento: '2026-05-05',
        responsablePrincipalId: 'resp_mario',
        responsablesApoyo: [],
        validacionesRequeridas: [],
        subtareas: [],
        comentarios: [],
        evidencias: [],
        progreso: 100,
        orden: 1,
        historialCambios: []
      },
      {
        id: 'act_006',
        proyectoId: 'proj_002',
        descripcion: 'Instalación de proyectores LED 200W',
        tipo: 'Técnica',
        prioridad: 'Media',
        estado: 'Completada',
        fechaCreacion: '2026-05-05',
        fechaFin: '2026-05-14',
        fechaVencimiento: '2026-05-14',
        responsablePrincipalId: 'resp_mario',
        responsablesApoyo: [],
        validacionesRequeridas: [],
        subtareas: [],
        comentarios: [],
        evidencias: [],
        progreso: 100,
        orden: 2,
        historialCambios: []
      }
    ],
    reportesDiarios: [],
    comentarios: [],
    evidencias: [],
    documentos: [],
    suboperaciones: [],
    historialCambios: []
  }
];

let responsables: Responsable[] = [
  { id: 'resp_steven', nombre: 'Steven', area: 'Logística y Recursos', cargo: 'Coordinador Logístico', color: '#3B82F6', email: 'steven@hhtsoluciona.com', telefono: '999888777', activo: true },
  { id: 'resp_diego', nombre: 'Diego', area: 'Ingeniería y Supervisión Técnica', cargo: 'Ingeniero Supervisor', color: '#8B5CF6', email: 'diego@hhtsoluciona.com', telefono: '999888776', activo: true },
  { id: 'resp_guillermo', nombre: 'Guillermo', area: 'Gestión Documentaria y Expedientes Técnicos', cargo: 'Gestor Documental', color: '#10B981', email: 'guillermo@hhtsoluciona.com', telefono: '999888775', activo: true },
  { id: 'resp_mario', nombre: 'Mario', area: 'Operaciones de Campo y Control de Obra', cargo: 'Soporte de Campo', color: '#F59E0B', email: 'mario@hhtsoluciona.com', telefono: '999888774', activo: true }
];

// ============================================
// FUNCIONES AUXILIARES
// ============================================

function calculateSemaforo(proyecto: Partial<Proyecto>): Semaforo {
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
}

function calculateAvance(actividades: Actividad[]): number {
  if (actividades.length === 0) return 0;
  const pesosCompletados = actividades
    .filter(a => a.estado === 'Completada' || a.estado === 'Validada')
    .reduce((acc, a) => acc + (a.ponderacion || 1), 0);
  return Math.round((pesosCompletados / actividades.length) * 100);
}

function calculateIndicadoresAvance(proyecto: Proyecto): IndicadorAvance[] {
  const areas: Area[] = [
    'Logística y Recursos',
    'Ingeniería y Supervisión Técnica',
    'Gestión Documentaria y Expedientes Técnicos',
    'Operaciones de Campo y Control de Obra'
  ];
  return areas.map(area => {
    const actividadesArea = proyecto.actividades.filter(a => {
      const responsable = responsables.find(r => r.id === a.responsablePrincipalId);
      return responsable?.area === area;
    });
    const completadas = actividadesArea.filter(a => a.estado === 'Completada' || a.estado === 'Validada').length;
    return {
      area,
      porcentaje: actividadesArea.length > 0 ? Math.round((completadas / actividadesArea.length) * 100) : 0,
      actividadesTotal: actividadesArea.length,
      actividadesCompletadas: completadas,
      ultimaActualizacion: new Date().toISOString().split('T')[0],
    };
  });
}

// ============================================
// RUTAS API
// ============================================

// GET - Obtener todos los proyectos
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const estado = searchParams.get('estado');
  const area = searchParams.get('area');
  const prioridad = searchParams.get('prioridad');
  const semaforo = searchParams.get('semaforo');
  const searchQuery = searchParams.get('search') || '';

  let filteredProyectos = [...proyectos];

  // Aplicar filtros
  if (estado && estado !== 'all') {
    filteredProyectos = filteredProyectos.filter(p => p.estado === estado);
  }
  if (area && area !== 'all') {
    filteredProyectos = filteredProyectos.filter(p => p.area === area);
  }
  if (prioridad && prioridad !== 'all') {
    filteredProyectos = filteredProyectos.filter(p => p.prioridad === prioridad);
  }
  if (semaforo && semaforo !== 'all') {
    filteredProyectos = filteredProyectos.filter(p => p.semaforo === semaforo);
  }
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredProyectos = filteredProyectos.filter(p =>
      p.nombre.toLowerCase().includes(query) ||
      p.codigo.toLowerCase().includes(query)
    );
  }

  // Agregar datos de responsables
  const proyectosWithResponsables = filteredProyectos.map(p => ({
    ...p,
    responsablePrincipalData: responsables.find(r => r.id === p.responsablePrincipalId),
    responsablesData: p.responsablesAdicionales.map(rId => responsables.find(r => r.id === rId)).filter(Boolean)
  }));

  return NextResponse.json({
    proyectos: proyectosWithResponsables,
    responsables,
    estadisticas: {
      total: proyectos.length,
      activos: proyectos.filter(p => p.estado === 'En Ejecución').length,
      planification: proyectos.filter(p => p.estado === 'Planificación').length,
      finalizados: proyectos.filter(p => p.estado === 'Finalizado').length,
      detenidos: proyectos.filter(p => p.estado === 'Detenido').length,
      verdes: proyectos.filter(p => p.semaforo === 'Verde').length,
      amarillos: proyectos.filter(p => p.semaforo === 'Amarillo').length,
      rojos: proyectos.filter(p => p.semaforo === 'Rojo').length
    }
  });
}

// POST - Crear nuevo proyecto
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const newId = `proj_${Date.now()}`;
    const year = new Date().getFullYear();
    const count = proyectos.length + 1;
    const codigo = `HHT-OPE-${year.toString().slice(-2)}${count.toString().padStart(3, '0')}`;

    const newProyecto: Proyecto = {
      ...body,
      id: newId,
      codigo,
      semaforo: calculateSemaforo(body),
      avanceCalculado: calculateAvance(body.actividades || []),
      indicadoresAvance: [],
      actividades: body.actividades || [],
      reportesDiarios: [],
      comentarios: [],
      evidencias: [],
      documentos: [],
      suboperaciones: [],
      historialCambios: [{
        id: `hist_${Date.now()}`,
        entidadId: newId,
        entidadTipo: 'proyecto',
        campo: 'Creación',
        valorAnterior: '',
        valorNuevo: codigo,
        usuario: body.creadoPor || 'Sistema',
        area: body.area,
        fecha: new Date().toISOString().split('T')[0]
      }]
    };

    proyectos.unshift(newProyecto);

    return NextResponse.json({
      success: true,
      proyecto: newProyecto
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error al crear proyecto' },
      { status: 400 }
    );
  }
}

// PUT - Actualizar proyecto
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    const proyectoIndex = proyectos.findIndex(p => p.id === id);
    if (proyectoIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Proyecto no encontrado' },
        { status: 404 }
      );
    }

    const proyectoActualizado = {
      ...proyectos[proyectoIndex],
      ...updates,
      semaforo: calculateSemaforo({ ...proyectos[proyectoIndex], ...updates }),
      avanceCalculado: calculateAvance(updates.actividades || proyectos[proyectoIndex].actividades),
      indicadoresAvance: calculateIndicadoresAvance({
        ...proyectos[proyectoIndex],
        ...updates,
        actividades: updates.actividades || proyectos[proyectoIndex].actividades
      }),
      fechaActualizacion: new Date().toISOString().split('T')[0]
    };

    proyectos[proyectoIndex] = proyectoActualizado;

    return NextResponse.json({
      success: true,
      proyecto: proyectoActualizado
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error al actualizar proyecto' },
      { status: 400 }
    );
  }
}

// DELETE - Eliminar proyecto
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { success: false, error: 'ID requerido' },
      { status: 400 }
    );
  }

  const proyectoIndex = proyectos.findIndex(p => p.id === id);
  if (proyectoIndex === -1) {
    return NextResponse.json(
      { success: false, error: 'Proyecto no encontrado' },
      { status: 404 }
    );
  }

  proyectos.splice(proyectoIndex, 1);

  return NextResponse.json({
    success: true
  });
}