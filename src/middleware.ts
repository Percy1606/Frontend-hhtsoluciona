import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-storage'); // Zustand with persist uses localStorage by default, which isn't accessible in middleware easily.
  
  // For now, let's keep it simple. If we want server-side protection, we need to store token in cookies.
  // Since Zustand is being used with localStorage, client-side protection is more straightforward.
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|login).*)'],
};
