import { NextRequest, NextResponse } from 'next/server';

// ============================================
// TIPOS
// ============================================

type Area = 'Steven' | 'Diego' | 'Guillermo' | 'Mario';
type Prioridad = 'Baja' | 'Media' | 'Alta' | 'Crítica';
type EstadoActividad = 'Pendiente' | 'En Progreso' | 'Completada' | 'Validada' | 'Bloqueada';
type TipoActividad = 'Técnica' | 'Administrativa' | 'Logística' | 'Documental' | 'Validación';
type TipoValidacion = 'Técnica' | 'Campo' | 'Documental' | 'Calidad';

interface Subtarea {
  id: string;
  descripcion: string;
  completada: boolean;
  responsableId?: string;
  fechaVencimiento?: string;
  fechaCompletada?: string;
}

interface ValidacionRequerida {
  id: string;
  tipo: TipoValidacion;
  area: Area;
  estado: 'Pendiente' | 'Aprobada' | 'Rechazada' | 'Observada';
  validadoPor?: string;
  fechaValidacion?: string;
  observaciones?: string;
}

interface Comentario {
  id: string;
  usuario: string;
  usuarioArea: Area;
  contenido: string;
  fecha: string;
  esInterno: boolean;
}

interface Evidencia {
  id: string;
  nombre: string;
  tipo: string;
  url: string;
  tamano: string;
  subidoPor: string;
  fecha: string;
  descripcion?: string;
}

interface Actividad {
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
  responsables: string[];
  validacionesRequeridas: ValidacionRequerida[];
  subtareas: Subtarea[];
  comentarios: Comentario[];
  evidencias: Evidencia[];
  progreso: number;
  orden: number;
}

// Base de datos en memoria
let actividades: Actividad[] = [
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
    responsables: ['resp_mario'],
    validacionesRequeridas: [
      {
        id: 'val_001',
        tipo: 'Técnica',
        area: 'Diego',
        estado: 'Aprobada',
        validadoPor: 'Diego',
        fechaValidacion: '2026-05-12'
      }
    ],
    subtareas: [
      { id: 'sub_001', descripcion: 'Limpieza de aisladores de porcelana', completada: true, responsableId: 'resp_mario' },
      { id: 'sub_002', descripcion: 'Limpieza de bushings', completada: true, responsableId: 'resp_mario' }
    ],
    comentarios: [
      {
        id: 'com_001',
        usuario: 'Mario',
        usuarioArea: 'Mario',
        contenido: 'Se completaron los trabajos de limpieza según protocolo',
        fecha: '2026-05-12',
        esInterno: false
      }
    ],
    evidencias: [],
    progreso: 100,
    orden: 1
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
    responsables: ['resp_mario', 'resp_steven'],
    validacionesRequeridas: [
      {
        id: 'val_003',
        tipo: 'Campo',
        area: 'Mario',
        estado: 'Pendiente'
      },
      {
        id: 'val_004',
        tipo: 'Técnica',
        area: 'Diego',
        estado: 'Pendiente'
      }
    ],
    subtareas: [
      { id: 'sub_005', descripcion: 'Drenado de aceite usado', completada: true, responsableId: 'resp_mario' },
      { id: 'sub_006', descripcion: 'Filtrado de aceite', completada: false, responsableId: 'resp_mario' },
      { id: 'sub_007', descripcion: 'Llenado de aceite nuevo', completada: false, responsableId: 'resp_mario' }
    ],
    comentarios: [
      {
        id: 'com_002',
        usuario: 'Steven',
        usuarioArea: 'Steven',
        contenido: 'El proveedor de aceite confirmó entrega para mañana 8am',
        fecha: '2026-05-22',
        esInterno: true
      }
    ],
    evidencias: [],
    progreso: 40,
    orden: 3
  }
];

// ============================================
// FUNCIONES AUXILIARES
// ============================================

function calculateProgreso(subtareas: Subtarea[]): number {
  if (subtareas.length === 0) return 0;
  const completadas = subtareas.filter(s => s.completada).length;
  return Math.round((completadas / subtareas.length) * 100);
}

// ============================================
// RUTAS API
// ============================================

// GET - Obtener actividades
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const proyectoId = searchParams.get('proyectoId');
  const responsableId = searchParams.get('responsableId');
  const estado = searchParams.get('estado');
  const tipo = searchParams.get('tipo');

  let filteredActividades = [...actividades];

  if (proyectoId && proyectoId !== 'all') {
    filteredActividades = filteredActividades.filter(a => a.proyectoId === proyectoId);
  }

  if (responsableId && responsableId !== 'all') {
    filteredActividades = filteredActividades.filter(a => a.responsables.includes(responsableId));
  }

  if (estado && estado !== 'all') {
    filteredActividades = filteredActividades.filter(a => a.estado === estado);
  }

  if (tipo && tipo !== 'all') {
    filteredActividades = filteredActividades.filter(a => a.tipo === tipo);
  }

  // Calcular progreso automático basado en subtareas
  const actividadesWithProgreso = filteredActividades.map(a => ({
    ...a,
    progresoCalculado: calculateProgreso(a.subtareas)
  }));

  return NextResponse.json({
    actividades: actividadesWithProgreso,
    estadisticas: {
      total: actividades.length,
      pendientes: actividades.filter(a => a.estado === 'Pendiente').length,
      enProgreso: actividades.filter(a => a.estado === 'En Progreso').length,
      completadas: actividades.filter(a => a.estado === 'Completada').length,
      validadas: actividades.filter(a => a.estado === 'Validada').length,
      bloqueadas: actividades.filter(a => a.estado === 'Bloqueada').length
    }
  });
}

// POST - Crear nueva actividad
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const newActividad: Actividad = {
      ...body,
      id: `act_${Date.now()}`,
      fechaCreacion: new Date().toISOString().split('T')[0],
      comentarios: [],
      evidencias: [],
      progreso: 0,
      orden: actividades.filter(a => a.proyectoId === body.proyectoId).length + 1
    };

    actividades.unshift(newActividad);

    return NextResponse.json({
      success: true,
      actividad: newActividad
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error al crear actividad' },
      { status: 400 }
    );
  }
}

// PUT - Actualizar actividad
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    const actividadIndex = actividades.findIndex(a => a.id === id);
    if (actividadIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Actividad no encontrada' },
        { status: 404 }
      );
    }

    // Si hay subtareas, recalcular progreso
    let progreso = updates.progreso;
    if (updates.subtareas) {
      progreso = calculateProgreso(updates.subtareas);
    }

    const actividadActualizada = {
      ...actividades[actividadIndex],
      ...updates,
      progreso
    };

    actividades[actividadIndex] = actividadActualizada;

    return NextResponse.json({
      success: true,
      actividad: actividadActualizada
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error al actualizar actividad' },
      { status: 400 }
    );
  }
}

// DELETE - Eliminar actividad
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { success: false, error: 'ID requerido' },
      { status: 400 }
    );
  }

  const actividadIndex = actividades.findIndex(a => a.id === id);
  if (actividadIndex === -1) {
    return NextResponse.json(
      { success: false, error: 'Actividad no encontrada' },
      { status: 404 }
    );
  }

  actividades.splice(actividadIndex, 1);

  return NextResponse.json({
    success: true
  });
}