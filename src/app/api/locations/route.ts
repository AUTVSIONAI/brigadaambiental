import { NextResponse } from 'next/server';
import { isDatabaseUnavailableError, prisma } from '@/lib/prisma';
import { getBrigadeAccessForUser, requireAuth } from '@/lib/authServer';
import { UserRole } from '@/types/auth';

function toPublicPing(ping: {
  id: string;
  userId: string;
  brigadeId: string | null;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  createdAt: Date;
}) {
  return {
    id: ping.id,
    userId: ping.userId,
    brigadeId: ping.brigadeId ?? undefined,
    latitude: ping.latitude,
    longitude: ping.longitude,
    accuracy: ping.accuracy ?? undefined,
    createdAt: ping.createdAt.toISOString(),
  };
}

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const isAdmin = auth.role === UserRole.ADMIN_BRIGADA;
    const current = isAdmin ? null : await prisma.user.findUnique({ where: { id: auth.sub } });
    if (!isAdmin && !current) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

    const access = isAdmin ? null : await getBrigadeAccessForUser(auth.sub, current!.brigadeId);
    const sinceParam = new URL(req.url).searchParams.get('since');
    const since = sinceParam ? new Date(sinceParam) : null;
    const sinceFilter = since && Number.isFinite(since.getTime()) ? since : null;

    const rows = await prisma.locationPing.findMany({
      where: {
        ...(sinceFilter ? { createdAt: { gte: sinceFilter } } : {}),
        ...(isAdmin ? {} : { brigadeId: { in: access?.visibleIds ?? [] } }),
      },
      orderBy: { createdAt: 'desc' },
      distinct: ['userId'],
      take: 500,
    });

    return NextResponse.json(rows.map(toPublicPing));
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json({ error: 'Banco de dados indisponível' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Erro ao listar localizações' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const body = (await req.json()) as {
      latitude?: unknown;
      longitude?: unknown;
      accuracy?: unknown;
    };

    const latitude = typeof body.latitude === 'number' ? body.latitude : Number(body.latitude);
    const longitude = typeof body.longitude === 'number' ? body.longitude : Number(body.longitude);
    const accuracy = body.accuracy === undefined ? null : typeof body.accuracy === 'number' ? body.accuracy : Number(body.accuracy);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return NextResponse.json({ error: 'Coordenadas inválidas' }, { status: 400 });
    }

    const current = await prisma.user.findUnique({ where: { id: auth.sub }, select: { brigadeId: true } });
    if (!current) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

    const created = await prisma.locationPing.create({
      data: {
        userId: auth.sub,
        brigadeId: current.brigadeId ?? null,
        latitude,
        longitude,
        accuracy: accuracy !== null && Number.isFinite(accuracy) ? accuracy : null,
      },
    });

    return NextResponse.json(toPublicPing(created));
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json({ error: 'Banco de dados indisponível' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Erro ao registrar localização' }, { status: 500 });
  }
}
