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

export async function PATCH(req: Request, ctx: { params: { taskId: string } }) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const task = await prisma.task.findUnique({ where: { id: ctx.params.taskId } });
    if (!task) return NextResponse.json({ error: 'Tarefa não encontrada' }, { status: 404 });

    const isAdmin = auth.role === UserRole.ADMIN_BRIGADA;
    const current = isAdmin ? null : await prisma.user.findUnique({ where: { id: auth.sub } });
    if (!isAdmin && !current) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

    const access = isAdmin ? null : await getBrigadeAccessForUser(auth.sub, current!.brigadeId);
    const canManageTask = isAdmin || (access?.managedIds.includes(task.brigadeId) ?? false);
    if (!canManageTask && task.userId !== auth.sub) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    const body = (await req.json()) as Partial<{
      type: unknown;
      description: unknown;
      latitude: unknown;
      longitude: unknown;
      brigadeId: unknown;
      userId: unknown;
      status: unknown;
      priority: unknown;
      dueDate: unknown;
      completedAt: unknown;
    }>;

    const data: Record<string, any> = {};

    const nextStatus = typeof body.status === 'string' ? body.status : undefined;
    if (nextStatus && Object.values(TaskStatus).includes(nextStatus as TaskStatus)) {
      data.status = nextStatus;
      if (nextStatus === TaskStatus.CONCLUIDA) {
        data.completedAt = task.completedAt ?? new Date();
      } else if (nextStatus !== TaskStatus.CONCLUIDA) {
        data.completedAt = null;
      }
    }

    if (isAdmin) {
      if (typeof body.type === 'string' && Object.values(TaskType).includes(body.type as TaskType)) data.type = body.type;
      if (typeof body.description === 'string') data.description = body.description.trim();
      if (typeof body.latitude === 'number' || typeof body.latitude === 'string') {
        const v = typeof body.latitude === 'number' ? body.latitude : Number(body.latitude);
        if (Number.isFinite(v)) data.latitude = v;
      }
      if (typeof body.longitude === 'number' || typeof body.longitude === 'string') {
        const v = typeof body.longitude === 'number' ? body.longitude : Number(body.longitude);
        if (Number.isFinite(v)) data.longitude = v;
      }
      if (typeof body.brigadeId === 'string' && body.brigadeId.trim()) data.brigadeId = body.brigadeId.trim();
      if (typeof body.userId === 'string') data.userId = body.userId.trim() || null;
      if (typeof body.priority === 'string' && Object.values(TaskPriority).includes(body.priority as TaskPriority)) {
        data.priority = body.priority;
      }
      if (typeof body.dueDate === 'string') data.dueDate = body.dueDate ? new Date(body.dueDate) : null;
      if (typeof body.completedAt === 'string') data.completedAt = body.completedAt ? new Date(body.completedAt) : null;
    } else if (canManageTask) {
      if (typeof body.userId === 'string') {
        const nextUserId = body.userId.trim() || null;
        if (nextUserId) {
          const target = await prisma.user.findUnique({ where: { id: nextUserId }, select: { brigadeId: true } });
          if (!target) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 400 });
          if (!target.brigadeId || !(access?.visibleIds.includes(target.brigadeId) ?? false)) {
            return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
          }
        }
        data.userId = nextUserId;
      }
      if (typeof body.priority === 'string' && Object.values(TaskPriority).includes(body.priority as TaskPriority)) {
        data.priority = body.priority;
      }
      if (typeof body.dueDate === 'string') data.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    }

    const updated = await prisma.task.update({
      where: { id: ctx.params.taskId },
      data,
    });

    return NextResponse.json(toPublicTask(updated));
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json({ error: 'Banco de dados indisponível' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Erro ao atualizar tarefa' }, { status: 500 });
  }
}

export async function DELETE(req: Request, ctx: { params: { taskId: string } }) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const task = await prisma.task.findUnique({ where: { id: ctx.params.taskId } });
    if (!task) return NextResponse.json({ error: 'Tarefa não encontrada' }, { status: 404 });

    const isAdmin = auth.role === UserRole.ADMIN_BRIGADA;
    if (!isAdmin) {
      const current = await prisma.user.findUnique({ where: { id: auth.sub } });
      if (!current) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
      const access = await getBrigadeAccessForUser(auth.sub, current.brigadeId);
      if (!access.managedIds.includes(task.brigadeId)) {
        return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
      }
    }

    await prisma.$transaction([
      prisma.action.deleteMany({ where: { taskId: ctx.params.taskId } }),
      prisma.task.delete({ where: { id: ctx.params.taskId } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json({ error: 'Banco de dados indisponível' }, { status: 503 });
    }
    const code = (error as any)?.code;
    if (code === 'P2025') {
      return NextResponse.json({ error: 'Tarefa não encontrada' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Erro ao remover tarefa' }, { status: 500 });
  }
}
