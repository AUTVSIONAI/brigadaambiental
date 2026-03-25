import { PublicShell } from '@/components/site/PublicShell';
import { PageHeader } from '@/components/site/PageHeader';
import { Container } from '@/components/site/Container';

export default function ContatoPage() {
  return (
    <PublicShell>
      <PageHeader
        eyebrow="CONTATO"
        title="Canal institucional"
        description="Envie uma mensagem para parcerias, informações e solicitações institucionais."
      />
      <section className="py-14">
        <Container>
          <div className="grid gap-10 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-8">
              <div className="text-sm font-semibold text-slate-900">Envie uma mensagem</div>
              <form className="mt-6 space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-800">
                    Nome
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    placeholder="Seu nome"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-800">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    placeholder="seu@email.com"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-slate-800">
                    Mensagem
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    placeholder="Escreva sua mensagem..."
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center rounded-md bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800 transition-colors"
                >
                  Enviar
                </button>
              </form>
              <div className="mt-4 text-xs text-slate-500">
                Este formulário é institucional. Para acesso operacional, utilize a Área do Brigadista.
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8">
                <div className="text-sm font-semibold text-slate-900">Informações de contato</div>
                <div className="mt-4 space-y-3 text-sm text-slate-700">
                  <div>
                    <div className="text-xs font-semibold text-slate-600">Email</div>
                    <div>contato@brigadaambiental.org</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-600">Telefone</div>
                    <div>(11) 1234-5678</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-600">Endereço</div>
                    <div>São Paulo, SP — Brasil</div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-8">
                <div className="text-sm font-semibold text-slate-900">Área do Brigadista</div>
                <div className="mt-2 text-sm text-slate-700">
                  Acesso autenticado para brigadistas, líderes e equipes autorizadas.
                </div>
                <div className="mt-5">
                  <a
                    href="/login"
                    className="inline-flex items-center justify-center rounded-md bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
                  >
                    Entrar
                  </a>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </PublicShell>
  );
}

