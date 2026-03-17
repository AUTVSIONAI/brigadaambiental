import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { isDatabaseUnavailableError, prisma } from '@/lib/prisma';
import { requireAdmin, requireAuth } from '@/lib/authServer';
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

export async function GET(_req: Request, ctx: { params: { id: string } }) {
  try {
    const auth = await requireAuth(_req);
    if (!auth) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: ctx.params.id } });
    if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    return NextResponse.json(toPublicUser(user));
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json({ error: 'Banco de dados indisponível' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Erro ao buscar usuário' }, { status: 500 });
  }
}

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
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

    const data: Record<string, any> = {};
    if (typeof body.name === 'string') data.name = body.name.trim();
    if (typeof body.email === 'string') data.email = body.email.trim().toLowerCase();
    if (typeof body.role === 'string') data.role = body.role;
    if (typeof body.brigadeId === 'string') data.brigadeId = body.brigadeId.trim() || null;
    if (typeof body.region === 'string') data.region = body.region.trim() || null;
    if (typeof body.password === 'string' && body.password) data.passwordHash = await bcrypt.hash(body.password, 10);

    const user = await prisma.user.update({
      where: { id: ctx.params.id },
      data,
    });

    return NextResponse.json(toPublicUser(user));
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json({ error: 'Banco de dados indisponível' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Erro ao atualizar usuário' }, { status: 500 });
  }
}
