import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * Proxy para Operaciones
 * Redirige las peticiones al backend real para evitar datos mockeados.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const authHeader = request.headers.get('authorization');

  try {
    const response = await fetch(`${API_BASE_URL}/operaciones/proyectos?${searchParams.toString()}`, {
      headers: authHeader ? { 'Authorization': authHeader } : {},
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Error al conectar con el backend' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const authHeader = request.headers.get('authorization');

  try {
    const response = await fetch(`${API_BASE_URL}/operaciones/proyectos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { 'Authorization': authHeader } : {}),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Error al conectar con el backend' }, { status: 500 });
  }
}
