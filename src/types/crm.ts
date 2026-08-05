export type Interaction = {
  id: string;
  fecha: string;
  tipo: "Llamada" | "Visita" | "Reunión" | "Cotización" | "Nota" | "Correo" | "WhatsApp";
  accion: string;
  observaciones: string;
  usuario: string;
};

export type AttachedFile = {
  id: string;
  nombre: string;
  tipo: string;
  fecha: string;
  url: string;
  tamano: string;
};

export type Client = {
  id: string;
  codigo: string;
  empresa: string;
  ruc: string;
  direccion: string;
  tarifa: string;
  contacto: string;
  telefono?: string;
  cargo?: string;
  correo?: string;
  linkedin?: string;
  cartera?: string;
  asignadoA: string;
  creadoPor?: string;
  diaTrabajo?: string;
  estado: string; // Keep for Excel compatibility
  prioridad: "Baja" | "Media" | "Alta" | "Crítica";
  accion: string;
  ultimoContacto: string;
  proximoSeguimiento: string;
  observaciones: string;
  zona: string;
  semaforo: "Verde" | "Amarillo" | "Rojo";
  temperatura: "Frío" | "Tibio" | "Caliente" | "Muy Caliente";
  montoEstimado: number;
  probabilidad: number;
  ventaProyectada: number;
  tipoCliente?: "PROSPECTO" | "CLIENTE" | "CLIENTE_INACTIVO";
  clasificacion?: "MUY_RENTABLE" | "RENTABLE" | "POCO_RENTABLE";
  esClienteReal?: boolean;
  etapaComercial: "Prospecto" | "Contacto Inicial" | "Visita Comercial" | "Visita Técnica" | "Seguimiento" | "Cotización" | "Negociación" | "Orden de Servicio" | "Servicio Ejecutado" | "Facturación" | "Postventa" | "Ganado / Fidelizado" | "Perdido";
  historialInteracciones?: Interaction[];
  archivosAdjuntos?: AttachedFile[];
  // Technical Report Fields
  hallazgosTecnicos?: string[];
  solucionesPropuestas?: string[];
  propuestaTecnicaUrl?: string;
  fechaCreacion: string;
  deletedAt?: string;
  _count?: {
    cotizaciones: number;
  };
};
