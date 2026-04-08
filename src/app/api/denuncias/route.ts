import { NextResponse } from 'next/server';
import { isDatabaseUnavailableError, prisma } from '@/lib/prisma';
import { getBrigadeAccessForUser, requireAuth } from '@/lib/authServer';
import { UserRole } from '@/types/auth';
import path from 'path';
import { promises as fs } from 'fs';
import crypto from 'crypto';

export const runtime = 'nodejs';

function isManageRole(role: UserRole) {
  return role === UserRole.ADMIN_BRIGADA || role === UserRole.COMANDANTE || role === UserRole.SUPERVISOR;
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

async function saveUploadedPhoto(file: File) {
  const contentType = file.type ?? '';
  const isJpeg = contentType === 'image/jpeg';
  const isPng = contentType === 'image/png';
  const isWebp = contentType === 'image/webp';
  if (!isJpeg && !isPng && !isWebp) {
    return { error: 'Formato inválido. Envie JPEG, PNG ou WEBP.' as const };
  }

  const maxBytes = 8 * 1024 * 1024;
  if (file.size > maxBytes) {
    return { error: 'Arquivo muito grande (máx. 8MB).' as const };
  }

  const ext = isJpeg ? 'jpg' : isPng ? 'png' : 'webp';
  const bytes = Buffer.from(await file.arrayBuffer());
  const filename = `${crypto.randomUUID()}.${ext}`;
  const publicRel = `/uploads/denuncias/${filename}`;
  const absDir = path.join(process.cwd(), 'public', 'uploads', 'denuncias');
  const absPath = path.join(absDir, filename);
  await fs.mkdir(absDir, { recursive: true });
  await fs.writeFile(absPath, bytes);
  return { path: publicRel };
}

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    if (!isManageRole(auth.role)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

    const url = new URL(req.url);
    const status = url.searchParams.get('status')?.trim() ?? '';
    const brigadeId = url.searchParams.get('brigadeId')?.trim() ?? '';

    const isAdmin = auth.role === UserRole.ADMIN_BRIGADA;
    const current = isAdmin ? null : await prisma.user.findUnique({ where: { id: auth.sub } });
    if (!isAdmin && !current) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    const access = isAdmin ? null : await getBrigadeAccessForUser(auth.sub, current!.brigadeId);

    const reports = await prisma.report.findMany({
      where: {
        ...(status ? { status: status as any } : undefined),
        ...(brigadeId ? { brigadeId } : undefined),
        ...(!isAdmin
          ? access && access.visibleIds.length > 0
            ? { brigadeId: { in: access.visibleIds } }
            : { brigadeId: current!.brigadeId ?? undefined }
          : undefined),
      } as any,
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    return NextResponse.json(reports.map(toPublicReport));
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json({ error: 'Banco de dados indisponível' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Erro ao listar denúncias' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req);
    const form = await req.formData();

    const type = typeof form.get('type') === 'string' ? String(form.get('type')).trim() : '';
    const description = typeof form.get('description') === 'string' ? String(form.get('description')).trim() : '';
    const latRaw = typeof form.get('latitude') === 'string' ? String(form.get('latitude')).trim() : '';
    const lngRaw = typeof form.get('longitude') === 'string' ? String(form.get('longitude')).trim() : '';
    const latitude = Number(latRaw);
    const longitude = Number(lngRaw);
    const reporterName = typeof form.get('reporterName') === 'string' ? String(form.get('reporterName')).trim() : '';
    const reporterContact =
      typeof form.get('reporterContact') === 'string' ? String(form.get('reporterContact')).trim() : '';
    const photo = form.get('photo');

    if (!type || !description) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 });
    }
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return NextResponse.json({ error: 'Coordenadas inválidas' }, { status: 400 });
    }
    if (!(photo instanceof File)) {
      return NextResponse.json({ error: 'Foto obrigatória' }, { status: 400 });
    }

    const saved = await saveUploadedPhoto(photo);
    if ('error' in saved) return NextResponse.json({ error: saved.error }, { status: 400 });

    const reporterUserId = auth?.sub ?? null;
    const brigadeId =
      reporterUserId
        ? (await prisma.user.findUnique({ where: { id: reporterUserId }, select: { brigadeId: true } }))?.brigadeId ??
          null
        : null;

    const created = await prisma.report.create({
      data: {
        type: type as any,
        description,
        photos: [saved.path],
        latitude,
        longitude,
        reporterUserId,
        reporterName: reporterName || null,
        reporterContact: reporterContact || null,
        brigadeId,
      },
    });

    return NextResponse.json(toPublicReport(created), { status: 201 });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json({ error: 'Banco de dados indisponível' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Erro ao criar denúncia' }, { status: 500 });
  }
}
