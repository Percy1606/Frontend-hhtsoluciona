import { NextRequest, NextResponse } from 'next/server';

// ============================================
// DASHBOARD API - CONSOLIDA INFORMACIÓN DE TODOS LOS MÓDULOS
// ============================================

// Simulación de datos de diferentes módulos
const datosProyectos = [
  {
    id: 'proj_001',
    codigo: 'HHT-OPE-26-001',
    nombre: 'Mantenimiento Preventivo Subestación RIO VERDE',
    area: 'Diego',
    estado: 'En Ejecución',
    semaforo: 'Verde',
    prioridad: 'Alta',
    avance: 85,
    fechaFinEstimada: '2026-05-28'
  },
  {
    id: 'proj_002',
    codigo: 'HHT-OPE-26-002',
    nombre: 'Iluminación LED Almacenes LOS PEROLES',
    area: 'Mario',
    estado: 'Finalizado',
    semaforo: 'Verde',
    prioridad: 'Media',
    avance: 100,
    fechaFinEstimada: '2026-05-15'
  }
];

const datosActividades = [
  {
    id: 'act_001',
    proyectoId: 'proj_001',
    descripcion: 'Limpieza de aisladores',
    estado: 'Completada',
    prioridad: 'Alta',
    responsables: ['Mario'],
    fechaVencimiento: '2026-05-12'
  },
  {
    id: 'act_002',
    proyectoId: 'proj_001',
    descripcion: 'Pruebas dieléctricas',
    estado: 'Completada',
    prioridad: 'Crítica',
    responsables: ['Diego'],
    fechaVencimiento: '2026-05-15'
  },
  {
    id: 'act_003',
    proyectoId: 'proj_001',
    descripcion: 'Regeneración de aceite',
    estado: 'En Progreso',
    prioridad: 'Alta',
    responsables: ['Mario', 'Steven'],
    fechaVencimiento: '2026-05-25'
  },
  {
    id: 'act_004',
    proyectoId: 'proj_001',
    descripcion: 'Pruebas de inyección a relés',
    estado: 'Pendiente',
    prioridad: 'Alta',
    responsables: ['Diego'],
    fechaVencimiento: '2026-05-28'
  }
];

const datosDocumentos = [
  {
    id: 'doc_001',
    nombre: 'Memoria Técnica - RIO VERDE',
    tipo: 'Técnico',
    estado: 'Aprobado',
    area: 'Diego',
    proyectoId: 'proj_001'
  },
  {
    id: 'doc_002',
    nombre: 'Planos Unifilares',
    tipo: 'Técnico',
    estado: 'Pendiente Revisión',
    area: 'Guillermo',
    proyectoId: 'proj_001'
  }
];

const datosAlertas = [
  {
    id: 'alert_001',
    tipo: 'vencimiento',
    titulo: 'Proyecto por Vencer: HHT-OPE-26-001',
    descripcion: 'El proyecto vence en 3 días',
    prioridad: 'Alta',
    area: 'Diego',
    entidadId: 'proj_001'
  },
  {
    id: 'alert_002',
    tipo: 'validacion',
    titulo: 'Validación Pendiente: Regeneración de aceite',
    descripcion: 'Esperando validación de Mario',
    prioridad: 'Media',
    area: 'Mario',
    entidadId: 'act_003'
  },
  {
    id: 'alert_003',
    tipo: 'documento',
    titulo: 'Documento Pendiente: Planos Unifilares',
    descripcion: 'Planos requieren revisión técnica',
    prioridad: 'Baja',
    area: 'Diego',
    entidadId: 'doc_002'
  }
];

// ============================================
// RUTAS API
// ============================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const modulo = searchParams.get('modulo'); // 'all', 'proyectos', 'actividades', 'documentos', 'alertas'

  const fechaActual = new Date();
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  // Calcular actividades vencidas
  const actividadesVencidas = datosActividades.filter(a => {
    if (!a.fechaVencimiento || a.estado === 'Completada') return false;
    return new Date(a.fechaVencimiento) < hoy;
  });

  // Calcular proyectos críticos (semáforo rojo o prioridad crítica)
  const proyectosCriticos = datosProyectos.filter(p =>
    p.semaforo === 'Rojo' || p.prioridad === 'Crítica'
  );

  // Calcular documentos pendientes
  const documentosPendientes = datosDocumentos.filter(d =>
    d.estado === 'Pendiente Revisión'
  );

  // Calcular alertas no leídas
  const alertasPendientes = datosAlertas.filter(a =>
    a.prioridad === 'Alta' || a.prioridad === 'Crítica'
  );

  // KPIs generales
  const kpis = {
    proyectos: {
      total: datosProyectos.length,
      activos: datosProyectos.filter(p => p.estado === 'En Ejecución').length,
      planejamento: datosProyectos.filter(p => p.estado === 'Planificación').length,
      finalizados: datosProyectos.filter(p => p.estado === 'Finalizado').length,
      criticos: proyectosCriticos.length,
      verdes: datosProyectos.filter(p => p.semaforo === 'Verde').length,
      amarillos: datosProyectos.filter(p => p.semaforo === 'Amarillo').length,
      rojos: datosProyectos.filter(p => p.semaforo === 'Rojo').length
    },
    actividades: {
      total: datosActividades.length,
      pendientes: datosActividades.filter(a => a.estado === 'Pendiente').length,
      enProgreso: datosActividades.filter(a => a.estado === 'En Progreso').length,
      completadas: datosActividades.filter(a => a.estado === 'Completada').length,
      vencidas: actividadesVencidas.length
    },
    documentos: {
      total: datosDocumentos.length,
      pendientes: documentosPendientes.length,
      aprobados: datosDocumentos.filter(d => d.estado === 'Aprobado').length,
      porArea: {
        Diego: datosDocumentos.filter(d => d.area === 'Diego').length,
        Guillermo: datosDocumentos.filter(d => d.area === 'Guillermo').length,
        Steven: datosDocumentos.filter(d => d.area === 'Steven').length,
        Mario: datosDocumentos.filter(d => d.area === 'Mario').length
      }
    },
    alertas: {
      total: datosAlertas.length,
      criticas: datosAlertas.filter(a => a.prioridad === 'Crítica').length,
      altas: datosAlertas.filter(a => a.prioridad === 'Alta').length,
      pendientes: alertasPendientes.length
    }
  };

  // Timeline operativo (próximas actividades)
  const timelineOperativo = datosActividades
    .filter(a => a.estado !== 'Completada')
    .sort((a, b) => new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime())
    .slice(0, 5)
    .map(a => ({
      ...a,
      proyecto: datosProyectos.find(p => p.id === a.proyectoId),
      diasRestantes: a.fechaVencimiento
        ? Math.ceil((new Date(a.fechaVencimiento).getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
        : null
    }));

  // Distribución por área
  const distribucionPorArea = {
    Steven: datosProyectos.filter(p => p.area === 'Steven').length,
    Diego: datosProyectos.filter(p => p.area === 'Diego').length,
    Guillermo: datosProyectos.filter(p => p.area === 'Guillermo').length,
    Mario: datosProyectos.filter(p => p.area === 'Mario').length
  };

  // Distribución por prioridad
  const distribucionPorPrioridad = {
    Baja: datosProyectos.filter(p => p.prioridad === 'Baja').length,
    Media: datosProyectos.filter(p => p.prioridad === 'Media').length,
    Alta: datosProyectos.filter(p => p.prioridad === 'Alta').length,
    Crítica: datosProyectos.filter(p => p.prioridad === 'Crítica').length
  };

  // Responder según el módulo solicitado
  const response: any = {
    fechaActual: fechaActual.toISOString().split('T')[0],
    kpis
  };

  if (!modulo || modulo === 'all') {
    response.proyectos = datosProyectos;
    response.actividades = datosActividades;
    response.documentos = datosDocumentos;
    response.alertas = datosAlertas;
    response.actividadesVencidas = actividadesVencidas;
    response.proyectosCriticos = proyectosCriticos;
    response.documentosPendientes = documentosPendientes;
    response.timelineOperativo = timelineOperativo;
    response.distribucionPorArea = distribucionPorArea;
    response.distribucionPorPrioridad = distribucionPorPrioridad;
  } else if (modulo === 'proyectos') {
    response.proyectos = datosProyectos;
    response.proyectosCriticos = proyectosCriticos;
    response.distribucionPorArea = distribucionPorArea;
    response.distribucionPorPrioridad = distribucionPorPrioridad;
  } else if (modulo === 'actividades') {
    response.actividades = datosActividades;
    response.actividadesVencidas = actividadesVencidas;
    response.timelineOperativo = timelineOperativo;
  } else if (modulo === 'documentos') {
    response.documentos = datosDocumentos;
    response.documentosPendientes = documentosPendientes;
  } else if (modulo === 'alertas') {
    response.alertas = datosAlertas;
    response.alertasPendientes = alertasPendientes;
  }

  return NextResponse.json(response);
}