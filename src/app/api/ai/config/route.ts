import { NextResponse } from 'next/server';
import { isDatabaseUnavailableError, prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/authServer';

function defaultSystemPrompt() {
  return [
    'Você é o Assistente de IA da Brigada Ambiental.',
    'Seja objetivo e prático.',
    'Priorize segurança operacional e protocolos.',
    'Quando faltar informação, faça perguntas curtas.',
  ].join('\n');
}

async function getAiConfig() {
  return await prisma.aiConfig.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      systemPrompt: defaultSystemPrompt(),
      model: 'openai/gpt-4o-mini',
      temperature: 0.3,
    },
  });
}

function toPublic(cfg: {
  id: string;
  systemPrompt: string;
  model: string;
  temperature: number;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: cfg.id,
    systemPrompt: cfg.systemPrompt,
    model: cfg.model,
    temperature: cfg.temperature,
    createdAt: cfg.createdAt.toISOString(),
    updatedAt: cfg.updatedAt.toISOString(),
  };
}

export async function GET(req: Request) {
  try {
    const auth = await requireAdmin(req);
    if (!auth) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

    const cfg = await getAiConfig();
    return NextResponse.json(toPublic(cfg));
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json({ error: 'Banco de dados indisponível' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Erro ao obter configuração de IA' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = await requireAdmin(req);
    if (!auth) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

    const body = (await req.json()) as {
      systemPrompt?: unknown;
      model?: unknown;
      temperature?: unknown;
    };

    const systemPrompt = typeof body.systemPrompt === 'string' ? body.systemPrompt : undefined;
    const model = typeof body.model === 'string' ? body.model : undefined;
    const temperatureRaw = body.temperature;
    const temperature = temperatureRaw === undefined ? undefined : typeof temperatureRaw === 'number' ? temperatureRaw : Number(temperatureRaw);

    const update: Record<string, unknown> = {};
    if (systemPrompt !== undefined) update.systemPrompt = systemPrompt;
    if (model !== undefined) update.model = model;
    if (temperature !== undefined && Number.isFinite(temperature)) update.temperature = temperature;

    await getAiConfig();
    const cfg = await prisma.aiConfig.update({
      where: { id: 'default' },
      data: update,
    });

    return NextResponse.json(toPublic(cfg));
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json({ error: 'Banco de dados indisponível' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Erro ao salvar configuração de IA' }, { status: 500 });
  }
}
