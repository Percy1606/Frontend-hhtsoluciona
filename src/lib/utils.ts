import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parseISO } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatDate = (dateStr: string | null | undefined, includeTime = false) => {
  if (!dateStr) return "—";
  try {
    // Para fechas sin hora (YYYY-MM-DD), evitamos el desplazamiento de zona horaria
    if (!includeTime && dateStr.includes('T')) {
      const [datePart] = dateStr.split('T');
      const [year, month, day] = datePart.split('-');
      return `${day}/${month}/${year}`;
    }
    
    // Si no tiene 'T', es una fecha simple, la parseamos como local
    const date = dateStr.includes('T') ? parseISO(dateStr) : parseISO(`${dateStr}T00:00:00`);
    return format(date, includeTime ? "dd/MM/yyyy HH:mm" : "dd/MM/yyyy");
  } catch (e) {
    return dateStr;
  }
};
