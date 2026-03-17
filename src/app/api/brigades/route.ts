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

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const current = await prisma.user.findUnique({ where: { id: auth.sub } });
    if (!current) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

    const isAdmin = auth.role === UserRole.ADMIN_BRIGADA;
    const access = isAdmin ? null : await getBrigadeAccessForUser(auth.sub, current.brigadeId);
    const brigades = await prisma.brigade.findMany({
      where: isAdmin ? undefined : { id: { in: access?.visibleIds ?? [] } },
      include: { members: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(brigades.map(toPublicBrigade));
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json({ error: 'Banco de dados indisponível' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Erro ao listar brigadas' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const body = (await req.json()) as {
      name?: unknown;
      description?: unknown;
      region?: unknown;
      leaderId?: unknown;
      parentId?: unknown;
    };

    const current = await prisma.user.findUnique({ where: { id: auth.sub } });
    if (!current) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    const region = typeof body.region === 'string' ? body.region.trim() : '';
    const leaderId = typeof body.leaderId === 'string' ? body.leaderId.trim() : '';
    const parentId =
      body.parentId === null
        ? null
        : typeof body.parentId === 'string' && body.parentId.trim()
          ? body.parentId.trim()
          : null;

    if (!name || !description || !region || !leaderId) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 });
    }

    const isAdmin = auth.role === UserRole.ADMIN_BRIGADA;
    if (!isAdmin) {
      if (!parentId) {
        return NextResponse.json({ error: 'Brigada pai é obrigatória' }, { status: 400 });
      }
      if (leaderId !== auth.sub) {
        return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
      }
      const access = await getBrigadeAccessForUser(auth.sub, current.brigadeId);
      if (!access.managedIds.includes(parentId)) {
        return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
      }
    }

    if (parentId) {
      const exists = await prisma.brigade.findUnique({ where: { id: parentId }, select: { id: true } });
      if (!exists) return NextResponse.json({ error: 'Brigada pai não encontrada' }, { status: 400 });
    }

    const brigade = await prisma.brigade.create({
      data: { name, description, region, leaderId, parentId },
      include: { members: true },
    });

    return NextResponse.json(toPublicBrigade(brigade));
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json({ error: 'Banco de dados indisponível' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Erro ao criar brigada' }, { status: 500 });
  }
}
