import { NextResponse } from 'next/server';
import { isDatabaseUnavailableError, prisma } from '@/lib/prisma';
import { getBrigadeAccessForUser, requireAuth } from '@/lib/authServer';
import { UserRole } from '@/types/auth';

function toPublicUser(user: {
  id: string;
  name: string;
  email: string;
  role: string;
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

function toPublicBrigade(brigade: {
  id: string;
  name: string;
  description: string;
  region: string;
  parentId: string | null;
  leaderId: string;
  members: any[];
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: brigade.id,
    name: brigade.name,
    description: brigade.description,
    region: brigade.region,
    parentId: brigade.parentId ?? undefined,
    leaderId: brigade.leaderId,
    members: brigade.members.map(toPublicUser),
    createdAt: brigade.createdAt.toISOString(),
    updatedAt: brigade.updatedAt.toISOString(),
  };
}

export async function GET(req: Request, ctx: { params: { id: string } }) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const current = await prisma.user.findUnique({ where: { id: auth.sub } });
    if (!current) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

    const isAdmin = auth.role === UserRole.ADMIN_BRIGADA;
    if (!isAdmin) {
      const access = await getBrigadeAccessForUser(auth.sub, current.brigadeId);
      if (!access.visibleIds.includes(ctx.params.id)) {
        return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
      }
    }

    const brigade = await prisma.brigade.findUnique({
      where: { id: ctx.params.id },
      include: { members: true },
    });
    if (!brigade) return NextResponse.json({ error: 'Brigada não encontrada' }, { status: 404 });

    return NextResponse.json(toPublicBrigade(brigade));
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json({ error: 'Banco de dados indisponível' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Erro ao buscar brigada' }, { status: 500 });
  }
}

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const current = await prisma.user.findUnique({ where: { id: auth.sub } });
    if (!current) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

    const isAdmin = auth.role === UserRole.ADMIN_BRIGADA;
    if (!isAdmin) {
      const access = await getBrigadeAccessForUser(auth.sub, current.brigadeId);
      if (!access.managedIds.includes(ctx.params.id)) {
        return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
      }
    }

    const body = (await req.json()) as {
      name?: unknown;
      description?: unknown;
      region?: unknown;
      leaderId?: unknown;
      parentId?: unknown;
    };

    const data: Record<string, any> = {};
    if (typeof body.name === 'string') data.name = body.name.trim();
    if (typeof body.description === 'string') data.description = body.description.trim();
    if (typeof body.region === 'string') data.region = body.region.trim();
    if (isAdmin) {
      if (typeof body.leaderId === 'string') data.leaderId = body.leaderId.trim();
      if (body.parentId === null) data.parentId = null;
      if (typeof body.parentId === 'string') data.parentId = body.parentId.trim() || null;
    }

    if (isAdmin) {
      if (data.parentId && data.parentId === ctx.params.id) {
        return NextResponse.json({ error: 'Brigada não pode ser pai dela mesma' }, { status: 400 });
      }

      if (data.parentId) {
        const exists = await prisma.brigade.findUnique({ where: { id: data.parentId }, select: { id: true } });
        if (!exists) return NextResponse.json({ error: 'Brigada pai não encontrada' }, { status: 400 });
      }
    }

    const brigade = await prisma.brigade.update({
      where: { id: ctx.params.id },
      data,
      include: { members: true },
    });

    return NextResponse.json(toPublicBrigade(brigade));
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json({ error: 'Banco de dados indisponível' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Erro ao atualizar brigada' }, { status: 500 });
  }
}

export async function DELETE(req: Request, ctx: { params: { id: string } }) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const current = await prisma.user.findUnique({ where: { id: auth.sub } });
    if (!current) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

    const isAdmin = auth.role === UserRole.ADMIN_BRIGADA;
    if (!isAdmin) {
      const access = await getBrigadeAccessForUser(auth.sub, current.brigadeId);
      if (!access.managedIds.includes(ctx.params.id)) {
        return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
      }
    }

    const [children, members, tasks] = await Promise.all([
      prisma.brigade.count({ where: { parentId: ctx.params.id } }),
      prisma.user.count({ where: { brigadeId: ctx.params.id } }),
      prisma.task.count({ where: { brigadeId: ctx.params.id } }),
    ]);

    if (children > 0) {
      return NextResponse.json({ error: 'Remova os núcleos filhos antes de excluir' }, { status: 400 });
    }
    if (members > 0) {
      return NextResponse.json({ error: 'Remova/realocar os membros antes de excluir' }, { status: 400 });
    }
    if (tasks > 0) {
      return NextResponse.json({ error: 'Remova as tarefas da brigada antes de excluir' }, { status: 400 });
    }

    await prisma.brigade.delete({ where: { id: ctx.params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json({ error: 'Banco de dados indisponível' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Erro ao excluir brigada' }, { status: 500 });
  }
}
