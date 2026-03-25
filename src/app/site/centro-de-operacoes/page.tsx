import Link from 'next/link';
import { PublicShell } from '@/components/site/PublicShell';
import { PageHeader } from '@/components/site/PageHeader';
import { Container } from '@/components/site/Container';

export default function CentroDeOperacoesPage() {
  return (
    <PublicShell>
      <PageHeader
        eyebrow="CENTRO DE OPERAÇÕES"
        title="Coordenação, monitoramento e registro"
        description="Ambiente operacional para tomada de decisão, acompanhamento de equipes e gestão de ocorrências."
      />
      <section className="py-14">
        <Container>
          <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
            <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-white">
              <div className="text-sm font-semibold">Visão tática</div>
              <p className="mt-2 text-sm text-slate-200">
                O Centro de Operações consolida informações operacionais em um painel seguro e autenticado.
              </p>
              <div className="mt-6 grid gap-3">
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
                  <div className="font-semibold">Mapa</div>
                  <div className="mt-1 text-slate-200">Visualização de equipes e ocorrências para coordenação.</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
                  <div className="font-semibold">Controle de equipes</div>
                  <div className="mt-1 text-slate-200">Organização por brigadas, núcleos e liderança.</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
                  <div className="font-semibold">Monitoramento</div>
                  <div className="mt-1 text-slate-200">Acompanhamento de status e indicadores operacionais.</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
                  <div className="font-semibold">Registro de ocorrências</div>
                  <div className="mt-1 text-slate-200">Tarefas, ações em campo e rastreabilidade de eventos.</div>
                </div>
              </div>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-md bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  Acessar Centro de Operações
                </Link>
                <Link
                  href="/site/tecnologia"
                  className="inline-flex items-center justify-center rounded-md border border-white/20 bg-transparent px-5 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                >
                  Tecnologia e parceria
                </Link>
              </div>
            </div>

            <div>
              <div className="rounded-2xl border border-slate-200 bg-white p-8">
                <div className="text-sm font-semibold text-slate-900">Plataforma operacional</div>
                <p className="mt-2 text-sm text-slate-700">
                  A Brigada é uma organização operacional. Os sistemas digitais de controle e apoio às operações são
                  desenvolvidos em parceria com a plataforma SementeToken, responsável pela infraestrutura tecnológica.
                </p>
                <div className="mt-6 grid gap-4">
                  {[
                    { title: 'Segurança', text: 'Acesso autenticado, controle de permissões e proteção de dados operacionais.' },
                    { title: 'Rastreabilidade', text: 'Registro de ações, histórico e evidências com foco em auditoria operacional.' },
                    { title: 'Padronização', text: 'Protocolos e fluxos de trabalho consistentes entre equipes e lideranças.' },
                  ].map((i) => (
                    <div key={i.title} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="text-sm font-semibold text-slate-900">{i.title}</div>
                      <div className="mt-1 text-sm text-slate-700">{i.text}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-8">
                <div className="text-sm font-semibold text-slate-900">Área do Brigadista</div>
                <p className="mt-2 text-sm text-slate-700">
                  Acesso para brigadistas e equipes operacionais (tarefas, registro de ações e apoio).
                </p>
                <div className="mt-5">
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center rounded-md bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800 transition-colors"
                  >
                    Área do Brigadista
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </PublicShell>
  );
}

