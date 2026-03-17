import { jwtVerify, SignJWT } from 'jose';
import { UserRole } from '@/types/auth';
import { prisma } from '@/lib/prisma';

type TokenPayload = {
  sub: string;
  role: UserRole;
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET ?? 'dev-secret-change-me';
  return new TextEncoder().encode(secret);
}

export async function signAuthToken(payload: TokenPayload) {
  return await new SignJWT({ role: payload.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getJwtSecret());
}

export async function verifyAuthToken(token: string): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, getJwtSecret());
  const sub = typeof payload.sub === 'string' ? payload.sub : null;
  const role = typeof payload.role === 'string' ? (payload.role as UserRole) : null;
  if (!sub || !role) {
    throw new Error('Invalid token payload');
  }
  return { sub, role };
}

function parseCookieHeader(cookieHeader: string | null) {
  const map = new Map<string, string>();
  if (!cookieHeader) return map;
  cookieHeader.split(';').forEach((part) => {
    const [k, ...rest] = part.trim().split('=');
    if (!k) return;
    map.set(k, rest.join('='));
  });
  return map;
}

export function getTokenFromRequest(req: Request) {
  const auth = req.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) return auth.slice('Bearer '.length);
  const cookies = parseCookieHeader(req.headers.get('cookie'));
  const raw = cookies.get('token');
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export async function requireAuth(req: Request) {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  return await verifyAuthToken(token);
}

export async function requireAdmin(req: Request) {
  const auth = await requireAuth(req);
  if (!auth) return null;
  if (auth.role !== UserRole.ADMIN_BRIGADA) return null;
  return auth;
}

function collectDescendants(
  brigades: Array<{ id: string; parentId: string | null }>,
  rootIds: string[]
): Set<string> {
  const childrenByParent = new Map<string, string[]>();
  brigades.forEach((b) => {
    const key = b.parentId ?? '';
    const list = childrenByParent.get(key) ?? [];
    list.push(b.id);
    childrenByParent.set(key, list);
  });

  const seen = new Set<string>();
  const stack = [...rootIds];
  while (stack.length) {
    const current = stack.pop();
    if (!current || seen.has(current)) continue;
    seen.add(current);
    const children = childrenByParent.get(current) ?? [];
    children.forEach((id) => stack.push(id));
  }
  return seen;
}

export async function getBrigadeAccessForUser(userId: string, memberBrigadeId: string | null) {
  const brigades = await prisma.brigade.findMany({
    select: { id: true, parentId: true, leaderId: true },
  });

  const managedRoots = brigades.filter((b) => b.leaderId === userId).map((b) => b.id);
  const managed = collectDescendants(
    brigades.map((b) => ({ id: b.id, parentId: b.parentId })),
    managedRoots
  );

  const visible = new Set<string>(managed);
  if (memberBrigadeId) visible.add(memberBrigadeId);

  return {
    managedIds: Array.from(managed),
    visibleIds: Array.from(visible),
  };
}
