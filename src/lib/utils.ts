import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parseISO } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatDate = (dateStr: string | null | undefined, includeTime = false) => {
  if (!dateStr) return "—";
  try {
    const date = dateStr.includes('T') ? parseISO(dateStr) : parseISO(`${dateStr}T00:00:00`);
    return format(date, includeTime ? "dd/MM/yyyy HH:mm" : "dd/MM/yyyy");
  } catch (e) {
    return dateStr;
  }
};
