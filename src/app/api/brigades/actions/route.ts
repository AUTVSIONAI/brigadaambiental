import { NextResponse } from 'next/server';
import { isDatabaseUnavailableError, prisma } from '@/lib/prisma';
import { getBrigadeAccessForUser, requireAuth } from '@/lib/authServer';
import { UserRole } from '@/types/auth';

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
    photos: action.photos,
    location: {
      latitude: action.latitude,
      longitude: action.longitude,
    },
    createdAt: action.createdAt.toISOString(),
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
    const actions = await prisma.action.findMany({
      where:
        isAdmin
          ? undefined
          : access && access.managedIds.length > 0
            ? { task: { brigadeId: { in: access.managedIds } } }
            : { userId: auth.sub },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(actions.map(toPublicAction));
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json({ error: 'Banco de dados indisponível' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Erro ao listar ações' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const body = (await req.json()) as {
      taskId?: unknown;
      type?: unknown;
      description?: unknown;
      photos?: unknown;
      location?: unknown;
    };

    const taskId = typeof body.taskId === 'string' ? body.taskId.trim() : '';
    const type = typeof body.type === 'string' ? body.type.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    const photos = Array.isArray(body.photos) ? body.photos.filter((p) => typeof p === 'string') : [];
    const location = typeof body.location === 'object' && body.location !== null ? (body.location as any) : null;
    const latitude = location && (typeof location.latitude === 'number' ? location.latitude : Number(location.latitude));
    const longitude = location && (typeof location.longitude === 'number' ? location.longitude : Number(location.longitude));

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

    const created = await prisma.action.create({
      data: {
        taskId,
        userId: auth.sub,
        type,
        description,
        photos,
        latitude,
        longitude,
      },
    });

    return NextResponse.json(toPublicAction(created));
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json({ error: 'Banco de dados indisponível' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Erro ao criar ação' }, { status: 500 });
  }
}
