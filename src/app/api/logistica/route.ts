import { NextRequest, NextResponse } from 'next/server';

// ============================================
// TIPOS
// ============================================

type Area = 'Steven' | 'Diego' | 'Guillermo' | 'Mario';
type TipoItem = 'Equipo' | 'Material' | 'Herramienta' | 'Consumible';
type EstadoItem = 'Disponible' | 'Asignado' | 'En Uso' | 'Mantenimiento' | 'Dañado' | 'Reservado';
type EstadoAsignacion = 'Pendiente' | 'Aprobada' | 'Rechazada' | 'Devuelto';

interface Material {
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
  seriales?: string[];
  fechaAdquisicion?: string;
  mantenimientoProximo?: string;
}

interface Asignacion {
  id: string;
  materialId: string;
  proyectoId?: string;
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

// Base de datos en memoria
let materiales: Material[] = [
  {
    id: 'mat_001',
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
    id: 'mat_002',
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
    id: 'mat_003',
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
    id: 'mat_004',
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
    id: 'mat_005',
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
    id: 'mat_006',
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

let asignaciones: Asignacion[] = [];

// ============================================
// RUTAS API
// ============================================

// GET - Obtener materiales
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tipo = searchParams.get('tipo');
  const estado = searchParams.get('estado');
  const search = searchParams.get('search') || '';

  let filtered = [...materiales];

  if (tipo && tipo !== 'all') filtered = filtered.filter(m => m.tipo === tipo);
  if (estado && estado !== 'all') filtered = filtered.filter(m => m.estado === estado);
  if (search) {
    const query = search.toLowerCase();
    filtered = filtered.filter(m =>
      m.nombre.toLowerCase().includes(query) ||
      m.codigo.toLowerCase().includes(query) ||
      m.descripcion?.toLowerCase().includes(query)
    );
  }

  // Obtener stock bajo
  const stockBajo = materiales.filter(m => m.cantidad <= m.cantidadMinima);

  // Obtener en mantenimiento
  const enMantenimiento = materiales.filter(m => m.estado === 'Mantenimiento');

  // Obtener asignaciones activas
  const asignacionesActivas = asignaciones.filter(a => a.estado === 'Aprobada' && !a.fechaDevolucion);

  return NextResponse.json({
    materiales: filtered,
    stockBajo,
    enMantenimiento,
    asignacionesActivas,
    totalInventario: materiales.reduce((acc, m) => acc + (m.costoUnitario || 0) * m.cantidad, 0),
    estadisticas: {
      total: materiales.length,
      disponibles: materiales.filter(m => m.estado === 'Disponible').length,
      enUso: materiales.filter(m => m.estado === 'En Uso').length,
      enMantenimiento: materiales.filter(m => m.estado === 'Mantenimiento').length,
      dañados: materiales.filter(m => m.estado === 'Dañado').length,
      porTipo: {
        equipos: materiales.filter(m => m.tipo === 'Equipo').length,
        materiales: materiales.filter(m => m.tipo === 'Material').length,
        herramientas: materiales.filter(m => m.tipo === 'Herramienta').length,
        consumibles: materiales.filter(m => m.tipo === 'Consumible').length
      }
    }
  });
}

// POST - Crear material
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const prefix = body.tipo === 'Equipo' ? 'EQ' : body.tipo === 'Herramienta' ? 'HER' : body.tipo === 'Consumible' ? 'CON' : 'MAT';
    const count = materiales.filter(m => m.tipo === body.tipo).length + 1;
    const codigo = `${prefix}-${count.toString().padStart(3, '0')}`;

    const newMaterial: Material = {
      ...body,
      id: `mat_${Date.now()}`,
      codigo
    };

    materiales.unshift(newMaterial);

    return NextResponse.json({
      success: true,
      material: newMaterial
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error al crear material' },
      { status: 400 }
    );
  }
}

// PUT - Actualizar material
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    const matIndex = materiales.findIndex(m => m.id === id);
    if (matIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Material no encontrado' },
        { status: 404 }
      );
    }

    materiales[matIndex] = {
      ...materiales[matIndex],
      ...updates
    };

    return NextResponse.json({
      success: true,
      material: materiales[matIndex]
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error al actualizar material' },
      { status: 400 }
    );
  }
}

// DELETE - Eliminar material
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { success: false, error: 'ID requerido' },
      { status: 400 }
    );
  }

  const matIndex = materiales.findIndex(m => m.id === id);
  if (matIndex === -1) {
    return NextResponse.json(
      { success: false, error: 'Material no encontrado' },
      { status: 404 }
    );
  }

  materiales.splice(matIndex, 1);

  return NextResponse.json({
    success: true
  });
}