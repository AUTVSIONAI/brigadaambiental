import Link from 'next/link';
import { PublicShell } from '@/components/site/PublicShell';
import { PageHeader } from '@/components/site/PageHeader';
import { Container } from '@/components/site/Container';

export default function AreaDoBrigadistaPage() {
  return (
    <PublicShell>
      <PageHeader
        eyebrow="ÁREA DO BRIGADISTA"
        title="Acesso operacional"
        description="Entrada para brigadistas, líderes e equipes autorizadas."
      />
      <section className="py-14">
        <Container>
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div className="rounded-2xl border border-slate-200 bg-white p-8">
              <div className="text-sm font-semibold text-slate-900">O que você encontra</div>
              <ul className="mt-4 space-y-3 text-sm text-slate-700">
                <li>Tarefas e missões atribuídas</li>
                <li>Registro de ações em campo</li>
                <li>Histórico operacional</li>
                <li>Assistente de IA para apoio a protocolos</li>
                <li>Mapa tático para coordenação</li>
              </ul>
              <div className="mt-7 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-md bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800 transition-colors"
                >
                  Entrar
                </Link>
                <Link
                  href="/site/contato"
                  className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  Solicitar acesso
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8">
              <div className="text-sm font-semibold text-slate-900">Uso seguro</div>
              <p className="mt-2 text-sm text-slate-700">
                A plataforma operacional é restrita e autenticada. O acesso e as permissões são definidos conforme as
                funções em campo.
              </p>
              <div className="mt-5 text-sm text-slate-700">
                Em caso de dúvidas institucionais ou solicitações de parceria, utilize o canal de contato.
              </div>
            </div>
          </div>
        </Container>
      </section>
    </PublicShell>
  );
}

