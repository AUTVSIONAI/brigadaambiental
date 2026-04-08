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

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const body = (await req.json().catch(() => ({}))) as { latitude?: unknown; longitude?: unknown; note?: unknown };
    const latitude =
      typeof body.latitude === 'number' ? body.latitude : typeof body.latitude === 'string' ? Number(body.latitude) : null;
    const longitude =
      typeof body.longitude === 'number'
        ? body.longitude
        : typeof body.longitude === 'string'
          ? Number(body.longitude)
          : null;
    const note = typeof body.note === 'string' ? body.note.trim() : '';

    const open = await prisma.timeClockSession.findFirst({
      where: { userId: auth.sub, endedAt: null },
      orderBy: { startedAt: 'desc' },
    });
    if (!open) return NextResponse.json({ error: 'Nenhum ponto em aberto' }, { status: 409 });

    const updated = await prisma.timeClockSession.update({
      where: { id: open.id },
      data: {
        endedAt: new Date(),
        endLatitude: Number.isFinite(latitude as any) ? (latitude as number) : null,
        endLongitude: Number.isFinite(longitude as any) ? (longitude as number) : null,
        note: note ? [open.note, note].filter(Boolean).join(' | ') : open.note,
      },
    });

    return NextResponse.json(toPublicSession(updated));
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json({ error: 'Banco de dados indisponível' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Erro ao bater ponto (saída)' }, { status: 500 });
  }
}

