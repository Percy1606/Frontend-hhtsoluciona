import { NextRequest, NextResponse } from 'next/server';

// ============================================
// DATOS DE OPERACIONES - SIMULANDO BASE DE DATOS
// ============================================

// Tipos
type Area = 'Steven' | 'Diego' | 'Guillermo' | 'Mario';
type Prioridad = 'Baja' | 'Media' | 'Alta' | 'Crítica';
type EstadoProyecto = 'Planificación' | 'En Ejecución' | 'Detenido' | 'Finalizado';
type Semaforo = 'Verde' | 'Amarillo' | 'Rojo';
type EstadoActividad = 'Pendiente' | 'En Progreso' | 'Completada' | 'Validada' | 'Bloqueada';

interface Responsable {
  id: string;
  nombre: string;
  area: Area;
  cargo: string;
  email?: string;
  telefono?: string;
  color: string;
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

interface Subtarea {
  id: string;
  descripcion: string;
  completada: boolean;
  responsableId?: string;
  fechaVencimiento?: string;
  fechaCompletada?: string;
}

interface Actividad {
  id: string;
  descripcion: string;
  tipo: 'Técnica' | 'Administrativa' | 'Logística' | 'Documental' | 'Validación';
  prioridad: Prioridad;
  estado: EstadoActividad;
  fechaCreacion: string;
  fechaInicio?: string;
  fechaFin?: string;
  fechaVencimiento?: string;
  responsables: string[];
  validacionesRequeridas: ValidacionRequerida[];
  subtareas: Subtarea[];
  progreso: number;
  ponderacion?: number;
  orden: number;
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

interface Proyecto {
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
  responsablePrincipal: string;
  responsables: string[];
  area: Area;
  actividades: Actividad[];
  avance: number;
  avanceCalculado: number;
  costoPresupuestado?: number;
  costoReal?: number;
}

// Base de datos en memoria
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
    responsablePrincipal: 'resp_diego',
    responsables: ['resp_diego', 'resp_mario'],
    area: 'Diego',
    avance: 85,
    avanceCalculado: 85,
    actividades: [
      {
        id: 'act_001',
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
        progreso: 100,
        orden: 1
      },
      {
        id: 'act_002',
        descripcion: 'Pruebas dieléctricas de transformador',
        tipo: 'Técnica',
        prioridad: 'Crítica',
        estado: 'Completada',
        fechaCreacion: '2026-05-12',
        fechaInicio: '2026-05-13',
        fechaFin: '2026-05-15',
        fechaVencimiento: '2026-05-15',
        responsables: ['resp_diego'],
        validacionesRequeridas: [
          {
            id: 'val_002',
            tipo: 'Técnica',
            area: 'Diego',
            estado: 'Aprobada',
            validadoPor: 'Diego',
            fechaValidacion: '2026-05-15'
          }
        ],
        subtareas: [
          { id: 'sub_003', descripcion: 'Prueba de resistencia de aislamiento', completada: true, responsableId: 'resp_diego' },
          { id: 'sub_004', descripcion: 'Prueba de rigidez dieléctrica', completada: true, responsableId: 'resp_diego' }
        ],
        progreso: 100,
        orden: 2
      },
      {
        id: 'act_003',
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
        progreso: 40,
        orden: 3
      },
      {
        id: 'act_004',
        descripcion: 'Pruebas de inyección de corriente a relés',
        tipo: 'Validación',
        prioridad: 'Alta',
        estado: 'Pendiente',
        fechaCreacion: '2026-05-20',
        fechaVencimiento: '2026-05-28',
        responsables: ['resp_diego'],
        validacionesRequeridas: [],
        subtareas: [],
        progreso: 0,
        orden: 4
      }
    ]
  },
  {
    id: 'proj_002',
    clientId: '3',
    codigo: 'HHT-OPE-26-002',
    nombre: 'Iluminación LED Almacenes LOS PEROLES',
    estado: 'Finalizado',
    semaforo: 'Verde',
    prioridad: 'Media',
    fechaInicio: '2026-05-01',
    fechaFinEstimada: '2026-05-15',
    fechaFinReal: '2026-05-14',
    responsablePrincipal: 'resp_mario',
    responsables: ['resp_mario'],
    area: 'Mario',
    avance: 100,
    avanceCalculado: 100,
    actividades: [
      {
        id: 'act_005',
        descripcion: 'Desmontaje de luminarias antiguas',
        tipo: 'Técnica',
        prioridad: 'Media',
        estado: 'Completada',
        fechaCreacion: '2026-05-01',
        fechaFin: '2026-05-05',
        responsables: ['resp_mario'],
        validacionesRequeridas: [],
        subtareas: [],
        progreso: 100,
        orden: 1
      },
      {
        id: 'act_006',
        descripcion: 'Instalación de proyectores LED 200W',
        tipo: 'Técnica',
        prioridad: 'Media',
        estado: 'Completada',
        fechaCreacion: '2026-05-05',
        fechaFin: '2026-05-14',
        responsables: ['resp_mario'],
        validacionesRequeridas: [],
        subtareas: [],
        progreso: 100,
        orden: 2
      }
    ]
  }
];

let responsables: Responsable[] = [
  { id: 'resp_steven', nombre: 'Steven', area: 'Steven', cargo: 'Coordinador Logístico', color: '#3B82F6', email: 'steven@hhtsoluciona.com' },
  { id: 'resp_diego', nombre: 'Diego', area: 'Diego', cargo: 'Ingeniero Supervisor', color: '#8B5CF6', email: 'diego@hhtsoluciona.com' },
  { id: 'resp_guillermo', nombre: 'Guillermo', area: 'Guillermo', cargo: 'Gestor Documental', color: '#10B981', email: 'guillermo@hhtsoluciona.com' },
  { id: 'resp_mario', nombre: 'Mario', area: 'Mario', cargo: 'Soporte de Campo', color: '#F59E0B', email: 'mario@hhtsoluciona.com' }
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

// ============================================
// RUTAS API
// ============================================

// GET - Obtener todos los proyectos
export async function GET(request: NextRequest) {
  console.log("GET /api/operaciones called");
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
    responsablePrincipalData: responsables.find(r => r.id === p.responsablePrincipal),
    responsablesData: p.responsables.map(rId => responsables.find(r => r.id === rId)).filter(Boolean)
  }));
  console.log("Returning JSON response from /api/operaciones");
  return NextResponse.json({
    proyectos: proyectosWithResponsables,
    responsables,
    estadisticas: {
      total: proyectos.length,
      activos: proyectos.filter(p => p.estado === 'En Ejecución').length,
      planejamento: proyectos.filter(p => p.estado === 'Planificación').length,
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
      actividades: body.actividades || []
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
      avanceCalculado: calculateAvance(updates.actividades || proyectos[proyectoIndex].actividades)
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