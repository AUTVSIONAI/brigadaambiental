import { NextResponse } from 'next/server';
import { isDatabaseUnavailableError, prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/authServer';

function toPublicSession(s: {
  id: string;
  userId: string;
  brigadeId: string | null;
  startedAt: Date;
  endedAt: Date | null;
  startLatitude: number | null;
  startLongitude: number | null;
  endLatitude: number | null;
  endLongitude: number | null;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: s.id,
    userId: s.userId,
    brigadeId: s.brigadeId ?? undefined,
    startedAt: s.startedAt.toISOString(),
    endedAt: s.endedAt ? s.endedAt.toISOString() : undefined,
    startLatitude: s.startLatitude ?? undefined,
    startLongitude: s.startLongitude ?? undefined,
    endLatitude: s.endLatitude ?? undefined,
    endLongitude: s.endLongitude ?? undefined,
    note: s.note ?? undefined,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const url = new URL(req.url);
    const fromRaw = url.searchParams.get('from');
    const toRaw = url.searchParams.get('to');

    const to = toRaw ? new Date(toRaw) : new Date();
    const from = fromRaw ? new Date(fromRaw) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      return NextResponse.json({ error: 'Intervalo inválido' }, { status: 400 });
    }

    const open = await prisma.timeClockSession.findFirst({
      where: { userId: auth.sub, endedAt: null },
      orderBy: { startedAt: 'desc' },
    });

    const sessions = await prisma.timeClockSession.findMany({
      where: { userId: auth.sub, startedAt: { gte: from, lte: to } },
      orderBy: { startedAt: 'desc' },
      take: 200,
    });

    return NextResponse.json({
      openSession: open ? toPublicSession(open) : null,
      sessions: sessions.map(toPublicSession),
    });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json({ error: 'Banco de dados indisponível' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Erro ao listar ponto' }, { status: 500 });
  }
}

