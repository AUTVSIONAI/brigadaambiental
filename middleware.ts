import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

function parseMockRole(token: string | undefined) {
  if (!token) return null;
  if (!token.startsWith('mock.')) return null;
  const parts = token.split('.');
  if (parts.length < 3) return null;
  return parts[1] ?? null;
}

async function parseJwtRole(token: string) {
  try {
    const secret = process.env.JWT_SECRET ?? 'dev-secret-change-me';
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    return typeof payload.role === 'string' ? payload.role : null;
  } catch {
    return null;
  }
}

async function parseRoleFromToken(token: string | undefined) {
  if (!token) return null;
  const mockRole = parseMockRole(token);
  if (mockRole) return mockRole;
  return await parseJwtRole(token);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith('/dashboard')) {
    return NextResponse.next();
  }

  const token = req.cookies.get('token')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  const role = await parseRoleFromToken(token);
  if (!role) {
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  if (pathname === '/dashboard') {
    const isManager = role === 'ADMIN_BRIGADA' || role === 'COMANDANTE' || role === 'SUPERVISOR';
    const target = isManager ? '/dashboard/admin' : '/dashboard/brigadista';
    return NextResponse.redirect(new URL(target, req.url));
  }

  if (pathname.startsWith('/dashboard/admin')) {
    const isManager = role === 'ADMIN_BRIGADA' || role === 'COMANDANTE' || role === 'SUPERVISOR';
    if (!isManager) {
      return NextResponse.redirect(new URL('/dashboard/brigadista', req.url));
    }
  }

  if (pathname.startsWith('/dashboard/brigadista')) {
    const isManager = role === 'ADMIN_BRIGADA' || role === 'COMANDANTE' || role === 'SUPERVISOR';
    if (isManager) {
      return NextResponse.redirect(new URL('/dashboard/admin', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
