export function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-10 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="text-sm font-semibold tracking-wide text-white">Brigada Ambiental International</div>
            <p className="mt-3 text-sm text-slate-300 max-w-xl">
              Atuação operacional em prevenção, monitoramento e resposta a ocorrências ambientais. Sistemas digitais de
              controle e apoio às operações desenvolvidos em parceria com a SementeToken.
            </p>
          </div>

          <div>
            <div className="text-sm font-semibold text-white">Institucional</div>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              <li><a className="hover:text-white" href="/site/sobre">Sobre</a></li>
              <li><a className="hover:text-white" href="/site/atuacao">Atuação</a></li>
              <li><a className="hover:text-white" href="/site/tecnologia">Tecnologia</a></li>
              <li><a className="hover:text-white" href="/site/parceiros">Parceiros</a></li>
            </ul>
          </div>

          <div>
            <div className="text-sm font-semibold text-white">Acesso</div>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              <li><a className="hover:text-white" href="/site/centro-de-operacoes">Centro de Operações</a></li>
              <li><a className="hover:text-white" href="/site/area-do-brigadista">Área do Brigadista</a></li>
              <li><a className="hover:text-white" href="/site/contato">Contato</a></li>
              <li><a className="hover:text-white" href="/login">Login</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-slate-800 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-slate-400">© {new Date().getFullYear()} Brigada Ambiental International.</div>
          <div className="text-xs text-slate-400">contato@brigadaambiental.org • (11) 1234-5678</div>
        </div>
      </div>
    </footer>
  );
}
