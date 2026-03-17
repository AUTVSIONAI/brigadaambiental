import { NextResponse } from 'next/server';
import { isDatabaseUnavailableError, prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/authServer';

type ChatBody = {
  message?: unknown;
  context?: unknown;
};

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

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OPENROUTER_API_KEY não configurada' }, { status: 500 });
    }

    const body = (await req.json()) as ChatBody;
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    if (!message) return NextResponse.json({ error: 'Mensagem inválida' }, { status: 400 });

    const cfg = await getAiConfig();

    const ctx = body.context as any;
    const ctxLines: string[] = [];
    if (ctx?.taskId) ctxLines.push(`taskId: ${String(ctx.taskId)}`);
    if (ctx?.brigadeId) ctxLines.push(`brigadeId: ${String(ctx.brigadeId)}`);
    if (ctx?.location?.latitude && ctx?.location?.longitude) {
      ctxLines.push(`localização: ${Number(ctx.location.latitude)}, ${Number(ctx.location.longitude)}`);
    }

    const userContent = ctxLines.length ? `${message}\n\nContexto:\n${ctxLines.join('\n')}` : message;

    const openRouterUrl = 'https://openrouter.ai/api/v1/chat/completions';
    const response = await fetch(openRouterUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.OPENROUTER_REFERER ?? 'http://localhost',
        'X-Title': process.env.OPENROUTER_TITLE ?? 'Brigada Ambiental',
      },
      body: JSON.stringify({
        model: cfg.model,
        temperature: cfg.temperature,
        messages: [
          { role: 'system', content: cfg.systemPrompt },
          { role: 'user', content: userContent },
        ],
        max_tokens: 600,
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      return NextResponse.json(
        { error: 'Erro no provedor de IA', providerStatus: response.status, providerBody: text || undefined },
        { status: 502 }
      );
    }

    const data = (await response.json()) as any;
    const assistantMessage = String(data?.choices?.[0]?.message?.content ?? '').trim();
    if (!assistantMessage) {
      return NextResponse.json({ error: 'Resposta vazia do provedor de IA' }, { status: 502 });
    }

    return NextResponse.json({ message: assistantMessage });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json({ error: 'Banco de dados indisponível' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Erro ao processar chat' }, { status: 500 });
  }
}
