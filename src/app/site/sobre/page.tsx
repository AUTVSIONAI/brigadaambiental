import Link from 'next/link';
import { PublicShell } from '@/components/site/PublicShell';
import { PageHeader } from '@/components/site/PageHeader';
import { Container } from '@/components/site/Container';

export default function SobrePage() {
  return (
    <PublicShell>
      <PageHeader
        eyebrow="SOBRE"
        title="Brigada Ambiental International"
        description="Organização dedicada à proteção do meio ambiente, formada por brigadistas, voluntários e especialistas em operações ambientais."
      />
      <section className="py-14">
        <Container>
          <div className="grid gap-10 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="prose prose-slate max-w-none">
                <p className="text-slate-700">
                  A Brigada Ambiental International é uma organização dedicada à proteção do meio ambiente, formada por
                  brigadistas, voluntários e especialistas em operações ambientais. Atua na prevenção de incêndios,
                  monitoramento de áreas naturais, reflorestamento e resposta a emergências ambientais.
                </p>
                <p className="text-slate-700">
                  Utiliza sistemas digitais para controle de operações, desenvolvidos em parceria com a SementeToken.
                </p>
              </div>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/site/atuacao"
                  className="inline-flex items-center justify-center rounded-md bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800 transition-colors"
                >
                  Conhecer atuação
                </Link>
                <Link
                  href="/site/tecnologia"
                  className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  Tecnologia e parceria
                </Link>
              </div>
            </div>

            <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <div className="text-sm font-semibold text-slate-900">Diretrizes</div>
              <ul className="mt-4 space-y-3 text-sm text-slate-700">
                <li>Atuação operacional e segurança em primeiro lugar</li>
                <li>Coordenação entre equipes, liderança e protocolos</li>
                <li>Registro e rastreabilidade das ações de campo</li>
                <li>Parceria tecnológica para suporte às operações</li>
              </ul>
              <div className="mt-6">
                <Link href="/site/contato" className="text-sm font-semibold text-emerald-800 hover:text-emerald-900">
                  Contato institucional →
                </Link>
              </div>
            </aside>
          </div>
        </Container>
      </section>
    </PublicShell>
  );
}

