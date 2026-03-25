import Link from 'next/link';
import { PublicShell } from '@/components/site/PublicShell';
import { PageHeader } from '@/components/site/PageHeader';
import { Container } from '@/components/site/Container';

const cards = [
  { title: 'Combate a incêndios', description: 'Resposta operacional com foco em segurança, contenção e coordenação de equipes.' },
  { title: 'Monitoramento ambiental', description: 'Patrulha e vigilância preventiva em áreas naturais e zonas de risco.' },
  { title: 'Reflorestamento', description: 'Ações de recuperação ambiental e apoio a iniciativas de restauração de ecossistemas.' },
  { title: 'Proteção de fauna', description: 'Apoio a operações de resgate, manejo e mitigação de impacto em vida silvestre.' },
  { title: 'Treinamento de brigadistas', description: 'Capacitação contínua com protocolos, simulações e boas práticas de campo.' },
  { title: 'Operações de campo', description: 'Execução de missões táticas com registro de ações, evidências e relatórios operacionais.' },
  { title: 'Resposta a emergências', description: 'Atuação integrada em eventos críticos, com organização, comunicação e priorização de riscos.' },
];

export default function AtuacaoPage() {
  return (
    <PublicShell>
      <PageHeader
        eyebrow="ATUAÇÃO"
        title="Linhas de atuação"
        description="Prevenção, monitoramento e resposta operacional para proteção de pessoas, áreas naturais e biodiversidade."
      />
      <section className="py-14">
        <Container>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((c) => (
              <div key={c.title} className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="text-sm font-semibold text-slate-900">{c.title}</div>
                <p className="mt-2 text-sm text-slate-700">{c.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-8">
            <div className="grid gap-6 lg:grid-cols-2 lg:items-center">
              <div>
                <div className="text-sm font-semibold text-slate-900">Coordenação e controle</div>
                <p className="mt-2 text-sm text-slate-700">
                  Para apoiar a tomada de decisão, a Brigada utiliza sistemas digitais de controle operacional
                  desenvolvidos em parceria com a SementeToken.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 lg:justify-end">
                <Link
                  href="/site/centro-de-operacoes"
                  className="inline-flex items-center justify-center rounded-md bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
                >
                  Centro de Operações
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  Área do Brigadista
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </PublicShell>
  );
}

