'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const nav = [
    { href: '/site', label: 'Home' },
    { href: '/site/sobre', label: 'Sobre' },
    { href: '/site/atuacao', label: 'Atuação' },
    { href: '/site/tecnologia', label: 'Tecnologia' },
    { href: '/site/parceiros', label: 'Parceiros' },
    { href: '/site/centro-de-operacoes', label: 'Centro de Operações' },
    { href: '/site/contato', label: 'Contato' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between">
          <Link href="/site" className="flex items-center gap-3">
            <Image src="/logo.jpeg" alt="Brigada Ambiental International" width={34} height={34} priority />
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-wide text-slate-900">Brigada Ambiental</div>
              <div className="text-xs text-slate-600">International</div>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-6">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 transition-colors"
            >
              Área do Brigadista
            </Link>
          </div>

          <button
            type="button"
            aria-label="Abrir menu"
            onClick={() => setIsMenuOpen((v) => !v)}
            className="lg:hidden inline-flex items-center justify-center rounded-md border border-slate-200 p-2 text-slate-700 hover:bg-slate-50"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col gap-2">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900"
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-2">
              <Link
                href="/login"
                onClick={() => setIsMenuOpen(false)}
                className="inline-flex w-full items-center justify-center rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 transition-colors"
              >
                Área do Brigadista
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
