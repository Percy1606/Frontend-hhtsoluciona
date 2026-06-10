// HH-FRONTEND/src/types/finanzas.ts

export type EstadoFactura = 'PENDIENTE' | 'PAGADA_PARCIAL' | 'PAGADA' | 'ANULADA';

export interface Factura {
  id: string;
  codigo: string;
  clienteId: string;
  cliente?: { empresa: string; ruc: string };
  proyectoId?: string | null;
  proyecto?: { nombre: string; codigo: string };
  cotizacionId?: string | null;
  montoSubtotal: number;
  montoIgv: number;
  montoTotal: number;
  saldoPendiente: number;
  fechaEmision: string;
  fechaVencimiento: string;
  estado: EstadoFactura;
  observaciones?: string | null;
  archivoUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type EstadoGasto = 'PENDIENTE' | 'PAGADO' | 'ANULADO';
export type TipoGasto = 'OPERATIVO' | 'ADMINISTRATIVO' | 'FINANCIERO';

export interface Gasto {
  id: string;
  codigo?: string | null;
  proveedorId?: string | null;
  proveedor?: { razonSocial: string; ruc: string };
  proyectoId?: string | null;
  proyecto?: { nombre: string; codigo: string };
  ordenCompraId?: string | null;
  tipo: TipoGasto;
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
  totalGastos: number;
  utilidadProyectada: number;
  balance: number;
  facturasPendientes: number;
  gastosPendientes: number;
  facturasVencidas: number;
  facturasCriticas: FacturaCritica[];
}
