// Vercel Edge Middleware - Proteção de Rotas
// Este arquivo intercepta TODAS as requisições antes de chegarem ao site

const TOKEN_COOKIE_NAME = '_site_access_token';

// Rotas que NÃO precisam de proteção
const PUBLIC_PATHS = [
  '/bloqueado.html',
  '/verificacao.html',
  '/api/verificar-acesso',
  '/assets/',
  '/favicon.ico',
  '/_vercel'
];

// Rotas protegidas (TODAS as outras)
const PROTECTED_PATHS = [
  '/index.html',
  '/'
];

export default async function middleware(request) {
  const { pathname } = new URL(request.url);

  // Permitir assets e rotas públicas
  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    return Response.next();
  }

  // Verificar se é uma rota protegida (basicamente tudo)
  const isProtected = PROTECTED_PATHS.some(path =>
    pathname === path || pathname.startsWith(path)
  ) || pathname === '/';

  if (isProtected) {
    // Pegar cookie de acesso
    const cookies = request.headers.get('cookie') || '';
    const tokenMatch = cookies.match(new RegExp(`${TOKEN_COOKIE_NAME}=([^;]+)`));
    const token = tokenMatch ? tokenMatch[1] : null;

    // Validar token
    if (!token || !isValidToken(token)) {
      // Sem token válido - redirecionar para bloqueio
      const url = new URL('/bloqueado.html', request.url);
      return Response.redirect(url, 307);
    }
  }

  return Response.next();
}

function isValidToken(token) {
  try {
    // Decodificar token JWT (base64)
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    // Decodificar payload
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64').toString('utf-8')
    );

    // Verificar campos obrigatórios
    if (!payload.exp || !payload.fp || !payload.iat) {
      return false;
    }

    // Verificar expiração
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return false;
    }

    // Verificar idade máxima (24h)
    const tokenAge = now - payload.iat;
    if (tokenAge > 86400) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
