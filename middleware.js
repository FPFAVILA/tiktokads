// Vercel Edge Middleware - Cloaking Simples
export default function middleware(request) {
  const { pathname } = new URL(request.url);

  // Permitir assets sempre
  if (pathname.startsWith('/assets/') || pathname.includes('.')) {
    return Response.next();
  }

  // Verificar cookie de acesso
  const cookies = request.headers.get('cookie') || '';
  const hasAccess = cookies.includes('_access_ok=true');

  // /resgate - Requer cookie
  if (pathname === '/resgate' || pathname.startsWith('/resgate/')) {
    if (!hasAccess) {
      const url = new URL('/fora-do-ar.html', request.url);
      return Response.redirect(url, 307);
    }
    return Response.next();
  }

  // /acesso - Sempre acessível
  if (pathname === '/acesso' || pathname === '/acesso.html') {
    return Response.next();
  }

  // / - Sempre mostra "fora do ar"
  if (pathname === '/') {
    const url = new URL('/fora-do-ar.html', request.url);
    return Response.redirect(url, 307);
  }

  // Qualquer outra rota → fora do ar
  const url = new URL('/fora-do-ar.html', request.url);
  return Response.redirect(url, 307);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
