import { NextResponse } from 'next/server';
import { isDatabaseUnavailableError, prisma } from '@/lib/prisma';
import { getBrigadeAccessForUser, requireAuth } from '@/lib/authServer';
import { UserRole } from '@/types/auth';

function isManageRole(role: UserRole) {
  return role === UserRole.ADMIN_BRIGADA || role === UserRole.COMANDANTE || role === UserRole.SUPERVISOR;
}

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
    if (!isManageRole(auth.role)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

    const url = new URL(req.url);
    const fromRaw = url.searchParams.get('from');
    const toRaw = url.searchParams.get('to');
    const userId = url.searchParams.get('userId')?.trim() ?? '';
    const brigadeId = url.searchParams.get('brigadeId')?.trim() ?? '';

    const to = toRaw ? new Date(toRaw) : new Date();
    const from = fromRaw ? new Date(fromRaw) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      return NextResponse.json({ error: 'Intervalo inválido' }, { status: 400 });
    }

    const isAdmin = auth.role === UserRole.ADMIN_BRIGADA;
    const current = isAdmin ? null : await prisma.user.findUnique({ where: { id: auth.sub } });
    if (!isAdmin && !current) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    const access = isAdmin ? null : await getBrigadeAccessForUser(auth.sub, current!.brigadeId);

    const sessions = await prisma.timeClockSession.findMany({
      where: {
        startedAt: { gte: from, lte: to },
        ...(userId ? { userId } : undefined),
        ...(brigadeId ? { brigadeId } : undefined),
        ...(!isAdmin
          ? access && access.visibleIds.length > 0
            ? { brigadeId: { in: access.visibleIds } }
            : current!.brigadeId
              ? { brigadeId: current!.brigadeId }
              : undefined
          : undefined),
      } as any,
      orderBy: { startedAt: 'desc' },
      take: 500,
    });

    return NextResponse.json(sessions.map(toPublicSession));
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json({ error: 'Banco de dados indisponível' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Erro ao listar ponto' }, { status: 500 });
  }
}

