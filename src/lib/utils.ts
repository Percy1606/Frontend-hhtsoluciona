import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parseISO } from "date-fns"
import { useAuthStore } from "@/store/auth-store"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getSecureUrl = (path: string | null | undefined) => {
  if (!path) return "";
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  const token = useAuthStore.getState().token;
  
  // Si la ruta ya es absoluta, la usamos, si no, la construimos
  let fullUrl = path.startsWith('http') ? path : `${API_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  
  // Si tenemos un token, lo añadimos como query parameter
  if (token) {
    const separator = fullUrl.includes('?') ? '&' : '?';
    fullUrl = `${fullUrl}${separator}token=${token}`;
  }
  
  return fullUrl;
};

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

export const formatCurrency = (amount: number, currency: 'PEN' | 'USD' = 'PEN', compact = false) => {
  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: compact ? 0 : 2,
    minimumFractionDigits: compact ? 0 : 2,
  };

  if (currency === 'PEN') {
    return new Intl.NumberFormat('es-PE', options).format(amount || 0).replace('PEN', 'S/');
  } else {
    return new Intl.NumberFormat('en-US', options).format(amount || 0);
  }
};

export const formatLargeCurrency = (amount: number, currency: 'PEN' | 'USD' = 'PEN') => {
  const symbol = currency === 'PEN' ? 'S/' : '$';
  const num = Number(amount) || 0;
  
  if (Math.abs(num) >= 1_000_000) {
    const formatted = (num / 1_000_000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${symbol} ${formatted} M`;
  }
  
  return `${symbol} ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};
