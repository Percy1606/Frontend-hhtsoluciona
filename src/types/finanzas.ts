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

export type EstadoGasto = 'PENDIENTE' | 'PAGADO' | 'ANULADO';
export type TipoGasto = 'OPERATIVO' | 'ADMINISTRATIVO' | 'FINANCIERO' | 'PROYECTO' | 'PERSONAL';

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
  clasificacion: ClasificacionFinanciera;
  categoriaDistribucion?: string | null;
  concepto: string;
  montoTotal: number;
  fechaEmision: string;
  fechaVencimiento?: string | null;
  fechaPago?: string | null;
  estado: EstadoGasto;
  comprobanteUrl?: string | null;
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

export interface FinanceStats {
  totalIngresos: number;
  totalEgresos: number;
  totalFacturado: number;
  totalCobrado: number;
  totalPendiente: number;
  totalGastos: number;
  totalGastosPagados: number;
  totalGastosPendientes: number;
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
}
