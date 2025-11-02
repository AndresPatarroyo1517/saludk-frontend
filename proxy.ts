// proxy.ts (en la raíz del proyecto)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  // Verificar cookies con los nombres correctos
  const accessToken = request.cookies.get('accessToken')?.value ?? '';
  const refreshToken = request.cookies.get('refreshToken')?.value ?? '';
  
  const isAuthenticated = accessToken || refreshToken;
  
  const isAuthPage = request.nextUrl.pathname === '/login' || 
                     request.nextUrl.pathname === '/register';
  
  // Si está autenticado y está en página de auth, redirigir al dashboard
  if (isAuthenticated && isAuthPage) {
    // Intentar leer el rol del usuario desde localStorage en el cliente
    // Como el proxy no puede leer localStorage, redirigimos a dashboard por defecto
    // El componente de dashboard se encargará de redirigir al lugar correcto
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // Si NO está autenticado y trata de acceder a rutas protegidas
  const protectedRoutes = ['/dashboard', '/director', '/pacientes', '/citas', '/perfil'];
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  );
  
  if (!isAuthenticated && isProtectedRoute) {
    const loginUrl = new URL('/login', request.url);
    // Guardar la URL a la que intentaba acceder
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/login',
    '/register',
    '/dashboard/:path*',
    '/director/:path*',
    '/pacientes/:path*',
    '/citas/:path*',
    '/perfil/:path*',
  ],
};