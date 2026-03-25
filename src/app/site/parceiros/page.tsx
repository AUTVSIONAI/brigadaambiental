import { PublicShell } from '@/components/site/PublicShell';
import { PageHeader } from '@/components/site/PageHeader';
import { Container } from '@/components/site/Container';

export default function ParceirosPage() {
  return (
    <PublicShell>
      <PageHeader
        eyebrow="PARCEIROS"
        title="Parcerias institucionais e tecnológicas"
        description="Cooperação com organizações e plataformas que fortalecem a capacidade operacional e a atuação em campo."
      />
      <section className="py-14">
        <Container>
          <div className="grid gap-10 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-8">
              <div className="text-sm font-semibold text-slate-900">Parceiros Institucionais</div>
              <p className="mt-2 text-sm text-slate-700">
                Parcerias com instituições, organizações e iniciativas locais e internacionais para cooperação em ações
                ambientais, prevenção e resposta a emergências.
              </p>
              <div className="mt-6 grid gap-3">
                {['Organizações ambientais', 'Entidades de resposta a emergências', 'Redes de voluntariado', 'Apoio comunitário'].map(
                  (p) => (
                    <div key={p} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800">
                      {p}
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-8">
              <div className="text-sm font-semibold text-slate-900">Parceiros Tecnológicos</div>
              <p className="mt-2 text-sm text-slate-700">
                Soluções digitais para controle operacional e integração de dados, com foco em segurança e confiabilidade.
              </p>
              <div className="mt-6">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="text-sm font-semibold text-slate-900">SementeToken</div>
                  <div className="mt-1 text-sm text-slate-700">Plataforma tecnológica ambiental</div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </PublicShell>
  );
}

