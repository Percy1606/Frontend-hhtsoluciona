import { useAuthStore } from "@/store/auth-store";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function getHeaders() {
  const token = useAuthStore.getState().token;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse(response: Response, endpoint: string) {
  if (response.status === 401) {
    console.error(`[API] 401 Unauthorized en ${endpoint} - Token inválido o expirado.`);
    // SOLO deslogueamos si es un error de autenticación real (401)
    if (typeof window !== 'undefined') {
        useAuthStore.getState().logout();
        window.location.href = '/login';
    }
  }
  if (response.status === 403) {
    console.warn(`[API] 403 Forbidden en ${endpoint} - No tienes permisos o la acción fue denegada.`);
  }
  if (!response.ok) {
    let errorBody = { message: 'Error desconocido' };
    let rawText = '';
    try {
      rawText = await response.text();
      if (rawText && rawText.trim() !== '') {
        errorBody = JSON.parse(rawText);
      }
    } catch (e) {
      errorBody = { message: rawText || `Error HTTP ${response.status}: ${response.statusText}` };
    }
    
    console.error(`\n================= API ERROR =================`);
    console.error(`Endpoint: ${endpoint}`);
    console.error(`Status:   ${response.status} ${response.statusText}`);
    console.error(`Response:`, JSON.stringify(errorBody, null, 2));
    console.error(`=============================================\n`);
    
    throw new Error(errorBody.message || `Error HTTP ${response.status}: ${response.statusText}`);
  }
  if (response.status === 204) return null;

  // Intentamos obtener el texto de la respuesta primero
  const text = await response.text();
  
  // Si no hay contenido, retornamos null o un objeto vacío según convenga
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch (e) {
    console.error(`[API] Error parseando JSON en ${endpoint}:`, e);
    return text; // Si no es JSON pero hay texto, devolvemos el texto plano
  }
}

export const api = {
  get: async <T = any>(endpoint: string): Promise<T> => {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, { headers });
    return handleResponse(response, endpoint);
  },
  post: async <T = any>(endpoint: string, data: any): Promise<T> => {
    const headers = await getHeaders();
    
    // Si es FormData, dejamos que el navegador maneje el Content-Type (boundary)
    const isFormData = data instanceof FormData;
    if (isFormData) {
      const { 'Content-Type': _, ...restHeaders } = headers as any;
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: restHeaders,
        body: data,
      });
      return handleResponse(response, endpoint);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    return handleResponse(response, endpoint);
  },
  put: async <T = any>(endpoint: string, data: any): Promise<T> => {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
    return handleResponse(response, endpoint);
  },
  patch: async <T = any>(endpoint: string, data: any): Promise<T> => {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    });
    return handleResponse(response, endpoint);
  },
  delete: async <T = any>(endpoint: string): Promise<T> => {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers,
    });
    return handleResponse(response, endpoint);
  },
  getFileUrl: (url: string) => {
    if (!url) return '';
    const token = useAuthStore.getState().token;
    const base = url.startsWith('http') ? url : `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
    if (!token) return base;
    return `${base}${base.includes('?') ? '&' : '?'}token=${token}`;
  },
};
