import { NextRequest, NextResponse } from 'next/server';

// ============================================
// API DE KPIs - OPERACIONES
// ============================================

// Datos en memoria (simulando base de datos)
const proyectosData = [
  { id: 'proj_001', estado: 'En Ejecución', area: 'Diego', fechaInicio: '2026-05-10', avanceCalculado: 85 },
  { id: 'proj_002', estado: 'Finalizado', area: 'Mario', fechaInicio: '2026-05-01', avanceCalculado: 100 },
];

const alertasData = [
  { id: 'alert_001', tipo: 'vencimiento', leida: false, fechaCreacion: '2026-05-20' },
  { id: 'alert_002', tipo: 'atraso', leida: true, fechaCreacion: '2026-05-18' },
  { id: 'alert_003', tipo: 'validacion', leida: false, fechaCreacion: '2026-05-22' },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const periodo = searchParams.get('periodo') || 'mensual';

  const hoy = new Date();
  let fechaInicio: Date;

  switch (periodo) {
    case 'semanal':
      fechaInicio = new Date(hoy);
      fechaInicio.setDate(hoy.getDate() - 7);
      break;
    case 'mensual':
      fechaInicio = new Date(hoy);
      fechaInicio.setMonth(hoy.getMonth() - 1);
      break;
    case 'anual':
      fechaInicio = new Date(hoy);
      fechaInicio.setFullYear(hoy.getFullYear() - 1);
      break;
    default:
      fechaInicio = new Date(hoy);
      fechaInicio.setMonth(hoy.getMonth() - 1);
  }

  const fechaFin = hoy.toISOString().split('T')[0];
  const fechaInicioStr = fechaInicio.toISOString().split('T')[0];

  // Filtrar proyectos por período
  const proyectosPeriodo = proyectosData.filter(p => {
    const fecha = new Date(p.fechaInicio);
    return fecha >= fechaInicio && fecha <= hoy;
  });

  // Calcular KPIs
  const kpi = {
    periodo,
    fechaInicio: fechaInicioStr,
    fechaFin,
    proyectosIniciados: proyectosPeriodo.filter(p => p.estado !== 'Finalizado').length,
    proyectosFinalizados: proyectosPeriodo.filter(p => p.estado === 'Finalizado').length,
    proyectosActivos: proyectosData.filter(p => p.estado === 'En Ejecución').length,
    actividadesCreadas: 24, // Simulado
    actividadesCompletadas: 18, // Simulado
    promedioAvance: Math.round(
      proyectosPeriodo.reduce((acc, p) => acc + (p.avanceCalculado || 0), 0) / (proyectosPeriodo.length || 1)
    ),
    alertasTotales: alertasData.length,
    alertasResueltas: alertasData.filter(a => a.leida).length,
  };

  return NextResponse.json({
    success: true,
    kpi,
  });
}