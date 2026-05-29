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
  tarifa: "MT3" | "MT4";
  contacto: string;
  telefono?: string;
  cargo?: string;
  correo?: string;
  asignadoA: string;
  diaTrabajo: string;
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
  tipoCliente?: string; // e.g. Nuevo, Recurrente, Reactivado
  etapaComercial: "Prospecto" | "Contactado" | "Llamada Realizada" | "Visita Agendada" | "Inspección Realizada" | "Cotización Enviada" | "Seguimiento" | "Negociación" | "Orden de Servicio" | "Ganado" | "Perdido";
  historialInteracciones?: Interaction[];
  archivosAdjuntos?: AttachedFile[];
  // Technical Report Fields
  hallazgosTecnicos?: string[];
  solucionesPropuestas?: string[];
  propuestaTecnicaUrl?: string;
};

export type Project = {
  id: string; // e.g., HHT-OPE-00001-01
  clientId: string;
  nombre: string;
  avance: number;
  estado: "Planificación" | "En Ejecución" | "Detenido" | "Finalizado";
  semaforo: "Verde" | "Amarillo" | "Rojo";
  fechaInicio: string;
  fechaFinEstimada: string;
  responsable: string;
  actividades: {
    id: string;
    descripcion: string;
    completada: boolean;
    fecha: string;
  }[];
};

export type Invoice = {
  id: string;
  proyectoId: string;
  numero: string;
  monto: number;
  fechaEmision: string;
  fechaVencimiento: string;
  estado: "Pagado" | "Parcial" | "Pendiente" | "Vencido";
  saldo: number;
  utilidadEstimada: number;
};

export const CRM_DATA: Client[] = [
  {
    id: "1",
    codigo: "HHT-CRM-001",
    empresa: "RIO VERDE",
    ruc: "20123456789",
    direccion: "Carretera Piura - Sullana Km 10",
    tarifa: "MT3",
    contacto: "Juan Perez",
    telefono: "968574123",
    cargo: "Jefe de Operaciones",
    correo: "jperez@rioverde.com",
    asignadoA: "Angi",
    diaTrabajo: "Lunes",
    estado: "Activo",
    prioridad: "Alta",
    accion: "Llamada de seguimiento",
    ultimoContacto: "2026-05-20",
    proximoSeguimiento: "2026-05-27",
    observaciones: "Interesado en mantenimiento preventivo de subestación.",
    zona: "Bajo Piura",
    semaforo: "Verde",
    temperatura: "Caliente",
    montoEstimado: 15000,
    probabilidad: 0.8,
    ventaProyectada: 12000,
    tipoCliente: "Recurrente",
    etapaComercial: "Seguimiento",
    historialInteracciones: [
      {
        id: "int_1",
        fecha: "2026-05-20",
        tipo: "Llamada",
        accion: "Llamada de seguimiento",
        observaciones: "Se conversó sobre el presupuesto enviado. Están revisándolo internamente.",
        usuario: "Angi"
      },
      {
        id: "int_2",
        fecha: "2026-05-15",
        tipo: "Visita",
        accion: "Visita Técnica",
        observaciones: "Inspección rápida de transformadores. Se observaron fugas leves de aceite.",
        usuario: "Ing. Pedro S."
      }
    ],
    archivosAdjuntos: [
      {
        id: "file_1",
        nombre: "informe_tecnico_rio_verde.pdf",
        tipo: "application/pdf",
        fecha: "2026-05-15",
        url: "/docs/propuesta-rio-verde.pdf",
        tamano: "2.4 MB"
      }
    ],
    hallazgosTecnicos: [
      "Sulfatación excesiva en terminales de media tensión.",
      "Nivel de aceite de transformador por debajo del límite operativo.",
      "Celdas de protección con fallas en el mecanismo de disparo."
    ],
    solucionesPropuestas: [
      "Mantenimiento integral de subestación MT.",
      "Cambio y regeneración de aceite dieléctrico.",
      "Pruebas de inyección de corriente a relés de protección."
    ],
    propuestaTecnicaUrl: "/docs/propuesta-rio-verde.pdf"
  },
  {
    id: "2",
    codigo: "HHT-CRM-002",
    empresa: "TALLANES PACKERS",
    ruc: "20987654321",
    direccion: "Parque Industrial Piura",
    tarifa: "MT4",
    contacto: "Maria Garcia",
    telefono: "987456321",
    cargo: "Gerente General",
    correo: "mgarcia@tallanes.pe",
    asignadoA: "Valentina",
    diaTrabajo: "Martes",
    estado: "Activo",
    prioridad: "Media",
    accion: "Enviar cotización ajustada",
    ultimoContacto: "2026-05-22",
    proximoSeguimiento: "2026-05-26",
    observaciones: "Requiere estudio de máxima demanda para ampliación.",
    zona: "Piura",
    semaforo: "Amarillo",
    temperatura: "Tibio",
    montoEstimado: 25000,
    probabilidad: 0.5,
    ventaProyectada: 12500,
    tipoCliente: "Nuevo",
    etapaComercial: "Cotización Enviada",
    historialInteracciones: [
      {
        id: "int_3",
        fecha: "2026-05-22",
        tipo: "Nota",
        accion: "Registro de requerimiento",
        observaciones: "Cliente solicita ajustar el precio un 5% para poder aprobarlo esta semana.",
        usuario: "Valentina"
      }
    ],
    archivosAdjuntos: [],
    hallazgosTecnicos: [
      "Sobrecarga constante en el alimentador principal.",
      "Factor de potencia bajo (0.82) generando penalidades."
    ],
    solucionesPropuestas: [
      "Instalación de banco de condensadores automático.",
      "Ampliación de potencia contratada y refuerzo de cables."
    ]
  },
  {
    id: "3",
    codigo: "HHT-CRM-003",
    empresa: "LOS PEROLES",
    ruc: "20555444333",
    direccion: "Av. Grau 1234",
    tarifa: "MT3",
    contacto: "Carlos Ruiz",
    telefono: "945123654",
    cargo: "Administrador",
    correo: "cruiz@losperoles.com",
    asignadoA: "Ariana",
    diaTrabajo: "Miércoles",
    estado: "Activo",
    prioridad: "Baja",
    accion: "Reporte de avance",
    ultimoContacto: "2026-05-15",
    proximoSeguimiento: "2026-06-15",
    observaciones: "Proyecto de iluminación LED en almacenes.",
    zona: "Castilla",
    semaforo: "Verde",
    temperatura: "Frío",
    montoEstimado: 5000,
    probabilidad: 1,
    ventaProyectada: 5000,
    tipoCliente: "Recurrente",
    etapaComercial: "Ganado",
    historialInteracciones: [],
    archivosAdjuntos: []
  },
  {
    id: "4",
    codigo: "HHT-CRM-004",
    empresa: "RESTAURANT EL ARCOIRIS",
    ruc: "10123123123",
    direccion: "Calle Libertad 567",
    tarifa: "MT4",
    contacto: "Elena Torres",
    telefono: "999888777",
    cargo: "Propietaria",
    correo: "contacto@elarcoiris.pe",
    asignadoA: "Nicol",
    diaTrabajo: "Jueves",
    estado: "Activo",
    prioridad: "Crítica",
    accion: "Visita técnica urgente",
    ultimoContacto: "2026-05-24",
    proximoSeguimiento: "2026-05-25",
    observaciones: "Fallas recurrentes en tablero de transferencia.",
    zona: "Veintiséis de Octubre",
    semaforo: "Rojo",
    temperatura: "Muy Caliente",
    montoEstimado: 45000,
    probabilidad: 0.9,
    ventaProyectada: 40500,
    tipoCliente: "Nuevo",
    etapaComercial: "Negociación",
    historialInteracciones: [
      {
        id: "int_4",
        fecha: "2026-05-24",
        tipo: "Llamada",
        accion: "Llamada de urgencia",
        observaciones: "Reportó que la llave térmica saltó 3 veces. Se coordinó visita de emergencia.",
        usuario: "Nicol"
      }
    ],
    archivosAdjuntos: [],
    hallazgosTecnicos: [
      "Contactores quemados por arcos eléctricos.",
      "Cableado de control sin identificación y deteriorado."
    ],
    solucionesPropuestas: [
      "Reemplazo total de componentes de fuerza del tablero.",
      "Implementación de sistema de monitoreo remoto."
    ]
  },
];

export const PROJECTS_DATA: Project[] = [
  {
    id: "HHT-OPE-00001-01",
    clientId: "1",
    nombre: "Mantenimiento Preventivo Subestación RIO VERDE",
    avance: 85,
    estado: "En Ejecución",
    semaforo: "Verde",
    fechaInicio: "2026-05-10",
    fechaFinEstimada: "2026-05-28",
    responsable: "Ing. Pedro Sullón",
    actividades: [
      { id: "a1", descripcion: "Limpieza de aisladores", completada: true, fecha: "2026-05-10" },
      { id: "a2", descripcion: "Pruebas dieléctricas", completada: true, fecha: "2026-05-15" },
      { id: "a3", descripcion: "Regeneración de aceite", completada: false, fecha: "2026-05-25" },
    ]
  },
  {
    id: "HHT-OPE-00002-01",
    clientId: "3",
    nombre: "Iluminación Almacenes LOS PEROLES",
    avance: 100,
    estado: "Finalizado",
    semaforo: "Verde",
    fechaInicio: "2026-05-01",
    fechaFinEstimada: "2026-05-15",
    responsable: "Técnico Luis Chunga",
    actividades: [
      { id: "b1", descripcion: "Desmontaje luminarias antiguas", completada: true, fecha: "2026-05-01" },
      { id: "b2", descripcion: "Instalación proyectores LED 200W", completada: true, fecha: "2026-05-10" },
    ]
  }
];

export const FINANCIAL_DATA: Invoice[] = [
  {
    id: "f1",
    proyectoId: "HHT-OPE-00001-01",
    numero: "F001-000456",
    monto: 15000,
    fechaEmision: "2026-05-11",
    fechaVencimiento: "2026-06-11",
    estado: "Parcial",
    saldo: 7500,
    utilidadEstimada: 4500
  },
  {
    id: "f2",
    proyectoId: "HHT-OPE-00002-01",
    numero: "F001-000450",
    monto: 5000,
    fechaEmision: "2026-05-01",
    fechaVencimiento: "2026-05-31",
    estado: "Pagado",
    saldo: 0,
    utilidadEstimada: 1200
  }
];

export const KPI_DATA = {
  totalClientes: 245,
  prospectos: 58,
  cotizacionesEnviadas: 34,
  proyectosActivos: 12,
  montoEstimado: 1250000,
  ventaProyectada: 850000,
  porcentajeCobranza: 78,
};

export const PIPELINE_DATA = [
  { name: 'Prospecto', value: 25 },
  { name: 'En Proceso', value: 18 },
  { name: 'Negociación', value: 12 },
  { name: 'Cerrado Ganado', value: 45 },
];

export const PROJECTS_ADVANCE = [
  { name: 'RIO VERDE - Subestación', progress: 85, color: '#00B050' },
  { name: 'TALLANES - Mantenimiento', progress: 40, color: '#FFC000' },
  { name: 'EL ARCOIRIS - Tablero', progress: 10, color: '#E30613' },
  { name: 'LOS PEROLES - Cableado', progress: 100, color: '#00B050' },
];

export const MONTHLY_SALES = [
  { month: 'Ene', sales: 120000 },
  { month: 'Feb', sales: 150000 },
  { month: 'Mar', sales: 180000 },
  { month: 'Abr', sales: 140000 },
  { month: 'May', sales: 210000 },
];
