import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { isDatabaseUnavailableError, prisma } from '@/lib/prisma';
import { getBrigadeAccessForUser, requireAuth, requireAdmin } from '@/lib/authServer';
import { UserRole } from '@/types/auth';

function toPublicUser(user: {
  id: string;
  name: string;
  email: string;
  role: UserRole | string;
  avatar: string | null;
  brigadeId: string | null;
  region: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar ?? undefined,
    brigadeId: user.brigadeId ?? undefined,
    region: user.region ?? undefined,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const current = await prisma.user.findUnique({ where: { id: auth.sub } });
    if (!current) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

    const isAdmin = auth.role === UserRole.ADMIN_BRIGADA;
    const access = isAdmin ? null : await getBrigadeAccessForUser(auth.sub, current.brigadeId);
    const users = await prisma.user.findMany({
      where: isAdmin ? undefined : { brigadeId: { in: access?.visibleIds ?? [] } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(users.map(toPublicUser));
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json({ error: 'Banco de dados indisponível' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Erro ao listar usuários' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

    const body = (await req.json()) as {
      name?: unknown;
      email?: unknown;
      role?: unknown;
      brigadeId?: unknown;
      region?: unknown;
      password?: unknown;
    };

    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const role = typeof body.role === 'string' ? body.role : UserRole.BRIGADISTA;
    const brigadeId = typeof body.brigadeId === 'string' && body.brigadeId.trim() ? body.brigadeId.trim() : null;
    const region = typeof body.region === 'string' && body.region.trim() ? body.region.trim() : null;
    const password = typeof body.password === 'string' && body.password ? body.password : '123456';

    if (!name || !email) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        role: role as any,
        brigadeId,
        region,
        passwordHash,
      },
    });

    return NextResponse.json(toPublicUser(user));
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json({ error: 'Banco de dados indisponível' }, { status: 503 });
    }
    const message = error instanceof Error ? error.message : 'Erro ao criar usuário';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
