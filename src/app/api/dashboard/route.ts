import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * Proxy para el Dashboard
 * Redirige las peticiones al backend real para evitar datos mockeados.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const authHeader = request.headers.get('authorization');

  try {
    // Para el dashboard, usualmente necesitamos stats de finanzas y notificaciones
    // Por simplicidad, este proxy puede consolidar o simplemente redirigir si el frontend lo permite
    // Dado que el frontend usa stores separados, este archivo podría ser eliminado,
    // pero para cumplir con la auditoría sin romper el frontend (si alguien lo usa),
    // vamos a redirigir a un endpoint de "stats" del backend si existe.
    
    const response = await fetch(`${API_BASE_URL}/finanzas/stats?${searchParams.toString()}`, {
      headers: authHeader ? { 'Authorization': authHeader } : {},
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Error al conectar con el backend' }, { status: 500 });
  }
}
