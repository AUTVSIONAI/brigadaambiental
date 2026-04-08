import { NextResponse } from 'next/server';
import { isDatabaseUnavailableError, prisma } from '@/lib/prisma';
import { getBrigadeAccessForUser, requireAuth } from '@/lib/authServer';
import { UserRole } from '@/types/auth';

function isManageRole(role: UserRole) {
  return role === UserRole.ADMIN_BRIGADA || role === UserRole.COMANDANTE || role === UserRole.SUPERVISOR;
}

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s1 = Math.sin(dLat / 2);
  const s2 = Math.sin(dLng / 2);
  const q = s1 * s1 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * s2 * s2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(q)));
}

function toPublicReport(report: {
  id: string;
  type: string;
  description: string;
  photos: string[];
  latitude: number;
  longitude: number;
  reporterUserId: string | null;
  reporterName: string | null;
  reporterContact: string | null;
  brigadeId: string | null;
  status: string;
  assignedToId: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: report.id,
    type: report.type,
    description: report.description,
    photos: report.photos ?? [],
    latitude: report.latitude,
    longitude: report.longitude,
    reporterUserId: report.reporterUserId ?? undefined,
    reporterName: report.reporterName ?? undefined,
    reporterContact: report.reporterContact ?? undefined,
    brigadeId: report.brigadeId ?? undefined,
    status: report.status,
    assignedToId: report.assignedToId ?? undefined,
    reviewedAt: report.reviewedAt ? report.reviewedAt.toISOString() : undefined,
    createdAt: report.createdAt.toISOString(),
    updatedAt: report.updatedAt.toISOString(),
  };
}

export async function GET(req: Request, ctx: { params: { id: string } }) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    if (!isManageRole(auth.role)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

    const id = ctx.params.id;
    const report = await prisma.report.findUnique({ where: { id } });
    if (!report) return NextResponse.json({ error: 'Denúncia não encontrada' }, { status: 404 });

    const isAdmin = auth.role === UserRole.ADMIN_BRIGADA;
    if (!isAdmin) {
      const current = await prisma.user.findUnique({ where: { id: auth.sub } });
      if (!current) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
      const access = await getBrigadeAccessForUser(auth.sub, current.brigadeId);
      const ok = report.brigadeId ? access.visibleIds.includes(report.brigadeId) : false;
      if (!ok) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const pings = await prisma.locationPing.findMany({
      where: report.brigadeId ? { brigadeId: report.brigadeId, createdAt: { gte: since } } : { createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
      distinct: ['userId'],
      take: 50,
      select: {
        userId: true,
        latitude: true,
        longitude: true,
        createdAt: true,
        user: { select: { name: true } },
      },
    });

    const nearest = pings
      .map((p) => ({
        userId: p.userId,
        name: p.user.name,
        latitude: p.latitude,
        longitude: p.longitude,
        createdAt: p.createdAt.toISOString(),
        distanceKm: haversineKm({ lat: report.latitude, lng: report.longitude }, { lat: p.latitude, lng: p.longitude }),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 5);

    return NextResponse.json({ ...toPublicReport(report), nearestBrigadistas: nearest });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json({ error: 'Banco de dados indisponível' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Erro ao carregar denúncia' }, { status: 500 });
  }
}

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    if (!isManageRole(auth.role)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

    const id = ctx.params.id;
    const body = (await req.json()) as { status?: unknown; assignedToId?: unknown };
    const status = typeof body.status === 'string' ? body.status.trim() : '';
    const assignedToId = typeof body.assignedToId === 'string' ? body.assignedToId.trim() : '';

    if (!status && !assignedToId) {
      return NextResponse.json({ error: 'Nada para atualizar' }, { status: 400 });
    }

    const current = await prisma.report.findUnique({ where: { id } });
    if (!current) return NextResponse.json({ error: 'Denúncia não encontrada' }, { status: 404 });

    const isAdmin = auth.role === UserRole.ADMIN_BRIGADA;
    if (!isAdmin) {
      const u = await prisma.user.findUnique({ where: { id: auth.sub } });
      if (!u) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
      const access = await getBrigadeAccessForUser(auth.sub, u.brigadeId);
      const ok = current.brigadeId ? access.visibleIds.includes(current.brigadeId) : false;
      if (!ok) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    if (assignedToId) {
      const exists = await prisma.user.findUnique({ where: { id: assignedToId }, select: { id: true } });
      if (!exists) return NextResponse.json({ error: 'Brigadista não encontrado' }, { status: 404 });
    }

    const updated = await prisma.report.update({
      where: { id },
      data: {
        ...(status ? { status: status as any, reviewedAt: new Date() } : undefined),
        ...(assignedToId ? { assignedToId } : undefined),
      },
    });

    return NextResponse.json(toPublicReport(updated));
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json({ error: 'Banco de dados indisponível' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Erro ao atualizar denúncia' }, { status: 500 });
  }
}

