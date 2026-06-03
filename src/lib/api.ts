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

async function handleResponse(response: Response) {
  if (response.status === 401) {
    // Auto-logout on 401
    if (typeof window !== 'undefined') {
        useAuthStore.getState().logout();
        window.location.href = '/login';
    }
  }
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || response.statusText);
  }
  if (response.status === 204) return null;
  return response.json();
}

export const api = {
  get: async (endpoint: string) => {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, { headers });
    return handleResponse(response);
  },
  post: async (endpoint: string, data: any) => {
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
      return handleResponse(response);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
  put: async (endpoint: string, data: any) => {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
  patch: async (endpoint: string, data: any) => {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
  delete: async (endpoint: string) => {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers,
    });
    return handleResponse(response);
  },
};
