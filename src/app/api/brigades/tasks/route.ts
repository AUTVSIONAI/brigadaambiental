import { NextResponse } from 'next/server';
import { isDatabaseUnavailableError, prisma } from '@/lib/prisma';
import { getBrigadeAccessForUser, requireAuth } from '@/lib/authServer';
import { UserRole } from '@/types/auth';
import { TaskPriority, TaskStatus, TaskType } from '@/types/brigada';

function toPublicTask(task: {
  id: string;
  type: string;
  description: string;
  latitude: number;
  longitude: number;
  brigadeId: string;
  userId: string | null;
  status: string;
  priority: string;
  dueDate: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: task.id,
    type: task.type,
    description: task.description,
    latitude: task.latitude,
    longitude: task.longitude,
    brigadeId: task.brigadeId,
    userId: task.userId ?? undefined,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate?.toISOString(),
    completedAt: task.completedAt?.toISOString(),
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
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
    const tasks = await prisma.task.findMany({
      where: isAdmin ? undefined : access && access.managedIds.length > 0 ? { brigadeId: { in: access.managedIds } } : { userId: auth.sub },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(tasks.map(toPublicTask));
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json({ error: 'Banco de dados indisponível' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Erro ao listar tarefas' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const body = (await req.json()) as {
      type?: unknown;
      description?: unknown;
      latitude?: unknown;
      longitude?: unknown;
      brigadeId?: unknown;
      userId?: unknown;
      status?: unknown;
      priority?: unknown;
      dueDate?: unknown;
    };

    const type = typeof body.type === 'string' ? body.type : null;
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    const latitude = typeof body.latitude === 'number' ? body.latitude : Number(body.latitude);
    const longitude = typeof body.longitude === 'number' ? body.longitude : Number(body.longitude);
    const brigadeId = typeof body.brigadeId === 'string' ? body.brigadeId.trim() : '';
    const userId = typeof body.userId === 'string' && body.userId.trim() ? body.userId.trim() : null;
    const status = typeof body.status === 'string' ? body.status : TaskStatus.PENDENTE;
    const priority = typeof body.priority === 'string' ? body.priority : TaskPriority.MEDIA;
    const dueDate = typeof body.dueDate === 'string' && body.dueDate ? new Date(body.dueDate) : null;

    if (!type || !Object.values(TaskType).includes(type as TaskType)) {
      return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });
    }
    if (!description) return NextResponse.json({ error: 'Descrição obrigatória' }, { status: 400 });
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return NextResponse.json({ error: 'Coordenadas inválidas' }, { status: 400 });
    }
    if (!brigadeId) return NextResponse.json({ error: 'Brigada obrigatória' }, { status: 400 });

    const isAdmin = auth.role === UserRole.ADMIN_BRIGADA;
    if (!isAdmin) {
      const current = await prisma.user.findUnique({ where: { id: auth.sub } });
      if (!current) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
      const access = await getBrigadeAccessForUser(auth.sub, current.brigadeId);
      if (!access.managedIds.includes(brigadeId)) {
        return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
      }
      if (userId) {
        const target = await prisma.user.findUnique({ where: { id: userId }, select: { brigadeId: true } });
        if (!target) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 400 });
        if (!target.brigadeId || !access.visibleIds.includes(target.brigadeId)) {
          return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
        }
      }
    }

    const created = await prisma.task.create({
      data: {
        type: type as any,
        description,
        latitude,
        longitude,
        brigadeId,
        userId,
        status: status as any,
        priority: priority as any,
        dueDate,
      },
    });

    return NextResponse.json(toPublicTask(created));
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json({ error: 'Banco de dados indisponível' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Erro ao criar tarefa' }, { status: 500 });
  }
}
