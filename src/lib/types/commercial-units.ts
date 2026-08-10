export type UnidadComercialType = 'UNIDAD_1' | 'UNIDAD_2' | 'TODAS';

export type EstadoTareaEstricto = 'PENDIENTE' | 'EN_PROCESO' | 'FINALIZADA' | 'RETRASADA';

export interface CommercialAdvisor {
  name: string;
  unit: 'UNIDAD_1' | 'UNIDAD_2';
  role: string;
  color: string;
  hideFromTable?: boolean;
}

export const COMMERCIAL_UNITS = {
  UNIDAD_1: {
    id: 'UNIDAD_1' as const,
    name: 'Unidad Comercial 1 – Desarrollo de Nuevos Negocios',
    shortName: 'Unidad 1 (Nuevos Negocios)',
    objective: 'Captar nuevos clientes generados desde el 03/08/2026 y convertirlos en contratos.',
    members: ['Ariana', 'Brenda', 'Valentina'],
    color: 'emerald'
  },
  UNIDAD_2: {
    id: 'UNIDAD_2' as const,
    name: 'Unidad Comercial 2 – Desarrollo y Recuperación Estratégica',
    shortName: 'Unidad 2 (Clientes Estratégicos)',
    objective: 'Fidelizar, recuperar y vender sobre la cartera histórica registrada hasta el 31/07/2026.',
    members: ['Javier', 'Angi', 'Mellani', 'Steven'],
    color: 'blue'
  }
};

export const ALL_ADVISORS: Record<string, CommercialAdvisor> = {
  Ariana: { name: 'Ariana', unit: 'UNIDAD_1', role: 'Prospección Nuevos Negocios', color: 'bg-emerald-600' },
  Brenda: { name: 'Brenda', unit: 'UNIDAD_1', role: 'Prospección Exclusiva', color: 'bg-teal-600' },
  Valentina: { name: 'Valentina', unit: 'UNIDAD_1', role: 'Seguimiento & Cierre Nuevos', color: 'bg-indigo-600' },
  Javier: { name: 'Javier', unit: 'UNIDAD_2', role: 'Desarrollo Estratégico', color: 'bg-blue-600' },
  Angi: { name: 'Angi', unit: 'UNIDAD_2', role: 'Recuperación & Fidelización', color: 'bg-sky-600' },
  Mellani: { name: 'Mellani', unit: 'UNIDAD_2', role: 'Desarrollo Estratégico', color: 'bg-purple-600' },
  Steven: { name: 'Steven', unit: 'UNIDAD_2', role: 'Desarrollo Estratégico', color: 'bg-amber-600' }
};

export const UNIT_1_CUTOFF_DATE = new Date('2026-08-03T00:00:00.000Z');

export function getClientUnit(clientDateStr?: string | Date, assignedTo?: string): 'UNIDAD_1' | 'UNIDAD_2' {
  if (clientDateStr) {
    const d = new Date(clientDateStr);
    if (!isNaN(d.getTime())) {
      return d >= UNIT_1_CUTOFF_DATE ? 'UNIDAD_1' : 'UNIDAD_2';
    }
  }
  if (assignedTo && ['Ariana', 'Brenda', 'Valentina'].includes(assignedTo)) {
    return 'UNIDAD_1';
  }
  return 'UNIDAD_2';
}
