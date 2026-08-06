import { NextRequest, NextResponse } from 'next/server';

// ============================================
// TIPOS
// ============================================

type Area = 'Steven' | 'Diego' | 'Guillermo' | 'Mario';
type TipoDocumento = 'Técnico' | 'Administrativo' | 'Legal' | 'Financiero' | 'Otro';
type EstadoDocumento = 'Borrador' | 'Pendiente Revisión' | 'Revisado' | 'Aprobado' | 'Obsoleto';
type SubtipoDocumento =
  | 'Memoria Técnica'
  | 'Plano Eléctrico'
  | 'Diagrama Unifilar'
  | 'Especificación Técnica'
  | 'Informe Técnico'
  | 'Certificado de Calidad'
  | 'Manual de Operaciones'
  | 'Plan de Mantenimiento'
  | 'Acta de Reunión'
  | 'Convenio'
  | 'Solicitud'
  | 'Carta'
  | 'Memorándum'
  | 'Contrato'
  | 'Adenda'
  | 'Garantía'
  | 'Factura'
  | 'Boleta'
  | 'Orden de Compra'
  | 'Cotización'
  | 'Otro';

interface ValidacionDocumento {
  id: string;
  tipo: 'Técnica' | 'Legal' | 'Administrativa' | 'Calidad';
  area: Area;
  estado: 'Pendiente' | 'Aprobado' | 'Rechazado';
  validadoPor?: string;
  fecha?: string;
  observaciones?: string;
}

interface HistorialDocumento {
  id: string;
  accion: string;
  usuario: string;
  area: Area;
  fecha: string;
  detalles?: string;
}

interface Documento {
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

// Base de datos en memoria
let documentos: Documento[] = [
  {
    id: 'doc_001',
    proyectoId: 'proj_001',
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
        id: 'val_001',
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
      { id: 'hist_001', accion: 'Creación', usuario: 'Diego', area: 'Diego', fecha: '2026-05-10' },
      { id: 'hist_002', accion: 'Subida de archivo', usuario: 'Diego', area: 'Diego', fecha: '2026-05-12' },
      { id: 'hist_003', accion: 'Aprobación', usuario: 'Ing. Carlos Mendoza', area: 'Diego', fecha: '2026-05-14' }
    ]
  },
  {
    id: 'doc_002',
    proyectoId: 'proj_001',
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
      { id: 'hist_004', accion: 'Creación', usuario: 'Guillermo', area: 'Guillermo', fecha: '2026-05-15' },
      { id: 'hist_005', accion: 'Subida de archivo', usuario: 'Guillermo', area: 'Guillermo', fecha: '2026-05-16' }
    ]
  },
  {
    id: 'doc_003',
    codigo: 'HHT-DOC-003',
    nombre: 'Contrato Marco de Servicios',
    descripcion: 'Contrato marco de servicios eléctricos',
    tipo: 'Legal',
    subtipo: 'Contrato',
    numero: 'CM-2026-001',
    version: '1.0',
    url: '/docs/contrato-marco.pdf',
    estado: 'Aprobado',
    subidoPor: 'Guillermo',
    area: 'Guillermo',
    fechaCreacion: '2026-01-15',
    fechaSubida: '2026-01-16',
    fechaAprobacion: '2026-01-18',
    validaciones: [
      {
        id: 'val_002',
        tipo: 'Legal',
        area: 'Guillermo',
        estado: 'Aprobado',
        validadoPor: 'Abg. Patricia Salas',
        fecha: '2026-01-18'
      }
    ],
    etiquetas: ['contrato', 'servicios'],
    historial: []
  }
];

// ============================================
// RUTAS API
// ============================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tipo = searchParams.get('tipo');
  const subtipo = searchParams.get('subtipo');
  const estado = searchParams.get('estado');
  const area = searchParams.get('area');
  const proyectoId = searchParams.get('proyectoId');
  const search = searchParams.get('search') || '';

  let filtered = [...documentos];

  if (tipo && tipo !== 'all') filtered = filtered.filter(d => d.tipo === tipo);
  if (subtipo && subtipo !== 'all') filtered = filtered.filter(d => d.subtipo === subtipo);
  if (estado && estado !== 'all') filtered = filtered.filter(d => d.estado === estado);
  if (area && area !== 'all') filtered = filtered.filter(d => d.area === area);
  if (proyectoId && proyectoId !== 'all') filtered = filtered.filter(d => d.proyectoId === proyectoId);
  if (search) {
    const query = search.toLowerCase();
    filtered = filtered.filter(d =>
      d.nombre.toLowerCase().includes(query) ||
      d.codigo.toLowerCase().includes(query) ||
      d.numero?.toLowerCase().includes(query)
    );
  }

  return NextResponse.json({
    documentos: filtered,
    estadisticas: {
      total: documentos.length,
      borradores: documentos.filter(d => d.estado === 'Borrador').length,
      pendientes: documentos.filter(d => d.estado === 'Pendiente Revisión').length,
      aprobados: documentos.filter(d => d.estado === 'Aprobado').length,
      porTipo: {
        técnico: documentos.filter(d => d.tipo === 'Técnico').length,
        administrativo: documentos.filter(d => d.tipo === 'Administrativo').length,
        legal: documentos.filter(d => d.tipo === 'Legal').length,
        financiero: documentos.filter(d => d.tipo === 'Financiero').length
      }
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const today = new Date().toISOString().split('T')[0];

    const newDoc: Documento = {
      ...body,
      id: `doc_${Date.now()}`,
      codigo: `HHT-DOC-${(documentos.length + 1).toString().padStart(3, '0')}`,
      version: body.version || '1.0',
      fechaCreacion: today,
      fechaSubida: today,
      validaciones: [],
      etiquetas: body.etiquetas || [],
      historial: [
        {
          id: `hist_${Date.now()}`,
          accion: 'Creación',
          usuario: body.subidoPor,
          area: body.area,
          fecha: today
        }
      ]
    };

    documentos.unshift(newDoc);

    return NextResponse.json({
      success: true,
      documento: newDoc
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error al crear documento' },
      { status: 400 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    const docIndex = documentos.findIndex(d => d.id === id);
    if (docIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Documento no encontrado' },
        { status: 404 }
      );
    }

    const historialEntry: HistorialDocumento = {
      id: `hist_${Date.now()}`,
      accion: 'Actualización',
      usuario: 'Sistema',
      area: 'Steven',
      fecha: new Date().toISOString().split('T')[0]
    };

    const docActualizado = {
      ...documentos[docIndex],
      ...updates,
      historial: [...documentos[docIndex].historial, historialEntry]
    };

    documentos[docIndex] = docActualizado;

    return NextResponse.json({
      success: true,
      documento: docActualizado
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error al actualizar documento' },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { success: false, error: 'ID requerido' },
      { status: 400 }
    );
  }

  const docIndex = documentos.findIndex(d => d.id === id);
  if (docIndex === -1) {
    return NextResponse.json(
      { success: false, error: 'Documento no encontrado' },
      { status: 404 }
    );
  }

  documentos.splice(docIndex, 1);

  return NextResponse.json({
    success: true
  });
}
