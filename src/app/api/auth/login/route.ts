import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { isDatabaseUnavailableError, prisma } from '@/lib/prisma';
import { signAuthToken } from '@/lib/authServer';

export async function POST(req: Request) {
  try {
    let body: { email?: unknown; password?: unknown } = {};
    try {
      body = (await req.json()) as { email?: unknown; password?: unknown };
    } catch {
      return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 });
    }
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email || !password) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user?.passwordHash) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    const token = await signAuthToken({ sub: user.id, role: user.role as any });

    const res = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar ?? undefined,
        brigadeId: user.brigadeId ?? undefined,
        region: user.region ?? undefined,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
      token,
      refreshToken: 'not-implemented',
    });

    res.cookies.set('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });

    return res;
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json({ error: 'Banco de dados indisponível' }, { status: 503 });
    }
    console.error(error);
    return NextResponse.json({ error: 'Erro ao autenticar' }, { status: 500 });
  }
}
