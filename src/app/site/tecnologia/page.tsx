import Link from 'next/link';
import { PublicShell } from '@/components/site/PublicShell';
import { PageHeader } from '@/components/site/PageHeader';
import { Container } from '@/components/site/Container';

export default function TecnologiaPage() {
  return (
    <PublicShell>
      <PageHeader
        eyebrow="TECNOLOGIA"
        title="Sistemas digitais de apoio às operações"
        description="Monitoramento, registro de ocorrências e controle operacional para atuação em campo."
      />
      <section className="py-14">
        <Container>
          <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
            <div>
              <p className="text-slate-700">
                A Brigada Ambiental utiliza sistemas digitais para monitoramento de equipes, registro de ocorrências e
                controle de operações. A infraestrutura tecnológica é desenvolvida em parceria com a plataforma
                SementeToken, responsável pelos sistemas de inteligência e integração de dados.
              </p>
              <div className="mt-8 grid gap-4">
                {[
                  { title: 'Mapa operacional', text: 'Visualização de equipes, ocorrências e áreas de interesse para coordenação tática.' },
                  { title: 'Gestão de tarefas', text: 'Criação, atribuição e acompanhamento de missões com status e prioridades.' },
                  { title: 'Registro de ações', text: 'Rastreabilidade de atividades de campo com evidências e localização.' },
                  { title: 'Assistente de apoio', text: 'Orientação sobre protocolos e procedimentos, com foco em segurança operacional.' },
                ].map((item) => (
                  <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-6">
                    <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                    <p className="mt-2 text-sm text-slate-700">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8">
              <div className="text-sm font-semibold text-slate-900">Centro de Operações</div>
              <p className="mt-2 text-sm text-slate-700">
                O Centro de Operações integra mapa, monitoramento e registro para coordenação em tempo quase real.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/site/centro-de-operacoes"
                  className="inline-flex items-center justify-center rounded-md bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
                >
                  Ver Centro de Operações
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  Acessar área restrita
                </Link>
              </div>
              <div className="mt-6 text-xs text-slate-500">
                A plataforma operacional é de uso autenticado. A página pública descreve capacidades institucionais.
              </div>
            </div>
          </div>
        </Container>
      </section>
    </PublicShell>
  );
}

