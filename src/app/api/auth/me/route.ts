import { NextResponse } from 'next/server';
import { isDatabaseUnavailableError, prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/authServer';

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: auth.sub } });
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar ?? undefined,
      brigadeId: user.brigadeId ?? undefined,
      region: user.region ?? undefined,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json({ error: 'Banco de dados indisponível' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Erro ao obter usuário' }, { status: 500 });
  }
}
