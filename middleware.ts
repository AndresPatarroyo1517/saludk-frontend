// middleware.ts

import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Rutas públicas que no requieren autenticación
  const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/terms', '/privacy'];
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route));
  
  // Obtener cookie de acceso
  const accessToken = request.cookies.get('accessToken');
  
  // Si no hay token y la ruta no es pública, redirigir a login
  if (!accessToken && !isPublicRoute && !pathname.startsWith('/_next') && !pathname.startsWith('/api')) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }
  
  // Si hay token y está intentando acceder a login/register, redirigir a dashboard
  if (accessToken && (pathname === '/login' || pathname === '/register')) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (handled by rewrites)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public files (images, etc)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};