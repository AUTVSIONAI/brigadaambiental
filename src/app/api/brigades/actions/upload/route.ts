import { NextResponse } from 'next/server';
import { isDatabaseUnavailableError, prisma } from '@/lib/prisma';
import { getBrigadeAccessForUser, requireAuth } from '@/lib/authServer';
import { UserRole } from '@/types/auth';
import path from 'path';
import { promises as fs } from 'fs';
import crypto from 'crypto';

export const runtime = 'nodejs';

function isManageOrSelf(role: UserRole) {
  return role === UserRole.ADMIN_BRIGADA || role === UserRole.COMANDANTE || role === UserRole.SUPERVISOR || role === UserRole.BRIGADISTA;
}

function toPublicAction(action: {
  id: string;
  taskId: string;
  userId: string;
  type: string;
  description: string;
  photos: string[];
  latitude: number;
  longitude: number;
  createdAt: Date;
}) {
  return {
    id: action.id,
    taskId: action.taskId,
    userId: action.userId,
    type: action.type,
    description: action.description,
    photos: action.photos ?? [],
    location: { latitude: action.latitude, longitude: action.longitude },
    createdAt: action.createdAt.toISOString(),
  };
}

async function savePhoto(file: File) {
  const contentType = file.type ?? '';
  const isJpeg = contentType === 'image/jpeg';
  const isPng = contentType === 'image/png';
  const isWebp = contentType === 'image/webp';
  if (!isJpeg && !isPng && !isWebp) return null;
  const maxBytes = 8 * 1024 * 1024;
  if (file.size > maxBytes) return null;
  const ext = isJpeg ? 'jpg' : isPng ? 'png' : 'webp';
  const bytes = Buffer.from(await file.arrayBuffer());
  const filename = `${crypto.randomUUID()}.${ext}`;
  const publicRel = `/uploads/actions/${filename}`;
  const absDir = path.join(process.cwd(), 'public', 'uploads', 'actions');
  await fs.mkdir(absDir, { recursive: true });
  await fs.writeFile(path.join(absDir, filename), bytes);
  return publicRel;
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth || !isManageOrSelf(auth.role)) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const form = await req.formData();
    const taskId = typeof form.get('taskId') === 'string' ? String(form.get('taskId')).trim() : '';
    const type = typeof form.get('type') === 'string' ? String(form.get('type')).trim() : '';
    const description = typeof form.get('description') === 'string' ? String(form.get('description')).trim() : '';
    const latRaw = typeof form.get('latitude') === 'string' ? String(form.get('latitude')).trim() : '';
    const lngRaw = typeof form.get('longitude') === 'string' ? String(form.get('longitude')).trim() : '';
    const latitude = Number(latRaw);
    const longitude = Number(lngRaw);

    const photosFiles = form.getAll('photos').filter((p) => p instanceof File) as File[];
    if (!taskId || !type || !description) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 });
    }
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return NextResponse.json({ error: 'Coordenadas inválidas' }, { status: 400 });
    }

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return NextResponse.json({ error: 'Tarefa não encontrada' }, { status: 404 });

    const isAdmin = auth.role === UserRole.ADMIN_BRIGADA;
    if (!isAdmin) {
      const current = await prisma.user.findUnique({ where: { id: auth.sub } });
      if (!current) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
      const access = await getBrigadeAccessForUser(auth.sub, current.brigadeId);
      const canManageTask = access.managedIds.includes(task.brigadeId);
      const isAssignee = task.userId === auth.sub;
      if (!canManageTask && !isAssignee) {
        return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
      }
    }

    const savedPhotos: string[] = [];
    for (const file of photosFiles) {
      const url = await savePhoto(file);
      if (url) savedPhotos.push(url);
    }

    const created = await prisma.action.create({
      data: {
        taskId,
        userId: auth.sub,
        type,
        description,
        photos: savedPhotos,
        latitude,
        longitude,
      },
    });

    return NextResponse.json(toPublicAction(created), { status: 201 });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json({ error: 'Banco de dados indisponível' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Erro ao criar ação' }, { status: 500 });
  }
}

