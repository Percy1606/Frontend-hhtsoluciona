// HH-FRONTEND/src/types/finanzas.ts

export type EstadoFactura = 'PENDIENTE' | 'PAGO_PARCIAL' | 'PAGADA' | 'ANULADA' | 'VENCIDA';

export type ClasificacionFinanciera = 'VENTA_SERVICIO' | 'PROYECTO' | 'ALQUILER_EQUIPOS';

export interface Factura {
  id: string;
  codigo: string;
  clienteId: string;
  cliente?: { empresa: string; ruc: string };
  proyectoId?: string | null;
  proyecto?: { nombre: string; codigo: string };
  cotizacionId?: string | null;
  clasificacion: ClasificacionFinanciera;
  montoSubtotal: number;
  montoIgv: number;
  montoTotal: number;
  saldoPendiente: number;
  fechaEmision: string;
  fechaVencimiento: string;
  fechaEstimadaCobro?: string | null;
  estado: EstadoFactura;
  observaciones?: string | null;
  archivoUrl?: string | null;
  esRecurrente?: boolean;
  frecuencia?: string | null;
  proximaFacturacion?: string | null;
  saldoAnterior?: number;
  totalAcumulado?: number;
  saldoTotalCliente?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type EstadoGasto = 'SOLICITADO' | 'APROBADO' | 'PENDIENTE' | 'PAGADO' | 'ANULADO';
export type TipoGasto = 
  | 'OPERATIVO' 
  | 'ADMINISTRATIVO' 
  | 'FINANCIERO' 
  | 'PROYECTO' 
  | 'PERSONAL'
  | 'PLANILLA'
  | 'IMPUESTOS'
  | 'PRESTAMO'
  | 'VIATICOS'
  | 'COMBUSTIBLE'
  | 'MANTENIMIENTO'
  | 'SERVICIOS';

export type PrioridadGasto = 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';

export interface Gasto {
  id: string;
  codigo?: string | null;
  proveedorId?: string | null;
  proveedor?: { razonSocial: string; ruc: string };
  proyectoId?: string | null;
  proyecto?: { nombre: string; codigo: string };
  ordenCompraId?: string | null;
  cajaId?: string | null;
  tipo: TipoGasto;
  prioridad?: PrioridadGasto;
  clasificacion: ClasificacionFinanciera;
  categoriaDistribucion?: string | null;
  concepto: string;
  justificacion?: string | null;
  area?: string | null;
  montoTotal: number;
  fechaEmision: string;
  fechaVencimiento?: string | null;
  fechaProgramadaPago?: string | null;
  fechaPago?: string | null;
  estado: EstadoGasto;
  comprobanteUrl?: string | null;
  solicitanteId?: string;
  nivelAprobacion?: 'PENDIENTE_FINANZAS' | 'PENDIENTE_GERENCIA' | 'APROBADO' | 'RECHAZADO';
  nivelActual?: number;
  aprobaciones?: any[];
  montoRendido?: number;
  estadoRendicion?: 'PENDIENTE' | 'COMPLETADA' | 'EXCEDIDA';
  registradoPorId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FacturaCritica {
  id: string;
  proyecto: string;
  cliente: string;
  codigo: string;
  saldo: number;
  diasVencidos: number;
}

export interface ProyeccionFinanciera {
  dias: number;
  fecha: string;
  cobros: number;
  pagos: number;
  saldoProyectado: number;
}

export interface FinanceStats {
  totalIngresos: number;
  totalEgresos: number;
  totalFacturado: number;
  totalCobrado: number;
  totalPendiente: number;
  totalGastos: number;
  totalGastosPagados: number;
  totalGastosPendientes: number;
  utilidadMes: number;
  utilidadNeta: number;
  margenNeto: number;
  crecimientoIngresos: number;
  crecimientoEgresos: number;
  utilidadProyectada: number;
  balance: number;
  facturasPendientes: number;
  facturasParciales: number;
  facturasVencidas: number;
  facturasCriticas: FacturaCritica[];
  desgloseGastos: { tipo: string; monto: number }[];
  proyeccion90Dias?: ProyeccionFinanciera[];
}
