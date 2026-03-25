import Link from 'next/link';
import { PublicShell } from '@/components/site/PublicShell';
import { Container } from '@/components/site/Container';

export default function SitePage() {
  return (
    <PublicShell>
      <div className="bg-gradient-to-b from-slate-50 to-white border-b border-slate-200">
        <Container>
          <div className="py-16 sm:py-20">
            <div className="max-w-3xl">
              <div className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-900">
                Operação • Prevenção • Resposta
              </div>
              <h1 className="mt-6 text-4xl sm:text-5xl font-semibold tracking-tight text-slate-900">
                Brigada Ambiental International
              </h1>
              <p className="mt-5 text-base sm:text-lg text-slate-700">
                A Brigada Ambiental International atua na prevenção, monitoramento e resposta a ocorrências ambientais,
                promovendo ações de proteção da natureza, combate a incêndios, reflorestamento e apoio a comunidades.
                A organização utiliza sistemas digitais para controle operacional, desenvolvidos em parceria com a
                plataforma SementeToken, responsável pela infraestrutura tecnológica.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/site/sobre"
                  className="inline-flex items-center justify-center rounded-md bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800 transition-colors"
                >
                  Conheça a Brigada
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  Área do Brigadista
                </Link>
                <Link
                  href="/site/centro-de-operacoes"
                  className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  Centro de Operações
                </Link>
                <Link
                  href="/site/parceiros"
                  className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  Parceiros
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </div>

      <section className="py-14">
        <Container>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="text-sm font-semibold text-slate-900">Prevenção e prontidão</div>
              <p className="mt-2 text-sm text-slate-700">
                Planejamento operacional, rotinas de patrulha e protocolos de segurança para reduzir riscos.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="text-sm font-semibold text-slate-900">Resposta em campo</div>
              <p className="mt-2 text-sm text-slate-700">
                Equipes treinadas para atuação coordenada em ocorrências, com registro de ações e monitoramento.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="text-sm font-semibold text-slate-900">Apoio a comunidades</div>
              <p className="mt-2 text-sm text-slate-700">
                Operações orientadas à proteção de pessoas, fauna e áreas naturais em situações críticas.
              </p>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-14 bg-slate-50 border-y border-slate-200">
        <Container>
          <div className="flex items-end justify-between gap-6 flex-col sm:flex-row">
            <div>
              <div className="text-xs font-semibold tracking-widest text-emerald-800">ATUAÇÃO</div>
              <h2 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
                Linhas de atuação operacional
              </h2>
              <p className="mt-3 text-slate-700 max-w-2xl">
                A Brigada atua em frentes complementares, integrando prevenção, monitoramento e resposta.
              </p>
            </div>
            <Link href="/site/atuacao" className="text-sm font-semibold text-emerald-800 hover:text-emerald-900">
              Ver atuação completa →
            </Link>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              'Combate a incêndios',
              'Monitoramento ambiental',
              'Reflorestamento',
              'Proteção de fauna',
              'Treinamento de brigadistas',
              'Resposta a emergências',
            ].map((title) => (
              <div key={title} className="rounded-xl border border-slate-200 bg-white p-6">
                <div className="text-sm font-semibold text-slate-900">{title}</div>
                <p className="mt-2 text-sm text-slate-700">
                  Procedimentos padronizados, segurança operacional e coordenação entre equipes e lideranças.
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-14">
        <Container>
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="text-xs font-semibold tracking-widest text-emerald-800">TECNOLOGIA</div>
              <h2 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
                Controle operacional com sistemas digitais
              </h2>
              <p className="mt-3 text-slate-700">
                A Brigada Ambiental utiliza sistemas digitais para monitoramento de equipes, registro de ocorrências e
                controle de operações. A infraestrutura tecnológica é desenvolvida em parceria com a plataforma
                SementeToken, responsável pelos sistemas de inteligência e integração de dados.
              </p>
              <div className="mt-6 flex gap-3">
                <Link
                  href="/site/tecnologia"
                  className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  Entenda a tecnologia
                </Link>
                <Link
                  href="/site/centro-de-operacoes"
                  className="inline-flex items-center justify-center rounded-md bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
                >
                  Centro de Operações
                </Link>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-white">
              <div className="text-sm font-semibold">Capacidades digitais</div>
              <ul className="mt-4 space-y-3 text-sm text-slate-200">
                <li>Mapa tático e acompanhamento operacional</li>
                <li>Gestão de tarefas, equipes e ocorrências</li>
                <li>Registro de ações em campo com evidências</li>
                <li>Assistente de IA para apoio a protocolos</li>
              </ul>
              <div className="mt-6">
                <Link href="/login" className="inline-flex items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100 transition-colors">
                  Acessar área restrita
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-14 bg-slate-50 border-t border-slate-200">
        <Container>
          <div className="rounded-2xl border border-slate-200 bg-white p-8 sm:p-10">
            <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
              <div>
                <div className="text-xs font-semibold tracking-widest text-emerald-800">CONTATO</div>
                <h2 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
                  Fale com a Brigada
                </h2>
                <p className="mt-3 text-slate-700">
                  Contato institucional, parcerias e informações sobre atuação e operações.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 lg:justify-end">
                <Link
                  href="/site/contato"
                  className="inline-flex items-center justify-center rounded-md bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800 transition-colors"
                >
                  Ir para contato
                </Link>
                <Link
                  href="/site/area-do-brigadista"
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
