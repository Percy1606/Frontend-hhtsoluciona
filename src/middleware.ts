import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'software-hh-secret-key-2026';
const secret = new TextEncoder().encode(JWT_SECRET);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Proteger API routes (Problema 7.1)
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth')) {
    const authHeader = request.headers.get('authorization');
    let token = authHeader?.split(' ')[1];

    // SOPORTE PARA TOKEN POR URL (Para previsualización en nuevas pestañas)
    if (!token) {
      token = request.nextUrl.searchParams.get('token') || undefined;
    }

    if (!token) {
      return NextResponse.json(
        { message: 'Autenticación requerida' },
        { status: 401 }
      );
    }

    try {
      await jwtVerify(token, secret);
      return NextResponse.next();
    } catch (error) {
      console.error('[Middleware] JWT Verification failed:', error);
      return NextResponse.json(
        { message: 'Token inválido o expirado' },
        { status: 401 }
      );
    }
  }

  // 2. Proteger rutas de la aplicación (Legacy protection)
  // Nota: Dado que el frontend usa Zustand con localStorage, el middleware no tiene fácil acceso al token para redirecciones de página
  // Esta lógica se mantiene por si se decide migrar a cookies en el futuro.
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*', '/((?!api|_next/static|_next/image|favicon.ico|login).*)'],
};
