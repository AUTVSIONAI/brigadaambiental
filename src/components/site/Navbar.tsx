'use client';

import Link from 'next/link';
import { useState } from 'react';

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-green-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/site" className="text-xl font-bold">
              Brigada Ambiental
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <Link href="#home" className="hover:text-green-200 transition-colors">
              Início
            </Link>
            <Link href="#about" className="hover:text-green-200 transition-colors">
              Sobre
            </Link>
            <Link href="#projects" className="hover:text-green-200 transition-colors">
              Projetos
            </Link>
            <Link href="#contact" className="hover:text-green-200 transition-colors">
              Contato
            </Link>
            <Link 
              href="/auth/login" 
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md transition-colors"
            >
              Login
            </Link>
          </div>

          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white hover:text-green-200"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-green-700">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link href="#home" className="block px-3 py-2 hover:bg-green-600 rounded-md">
              Início
            </Link>
            <Link href="#about" className="block px-3 py-2 hover:bg-green-600 rounded-md">
              Sobre
            </Link>
            <Link href="#projects" className="block px-3 py-2 hover:bg-green-600 rounded-md">
              Projetos
            </Link>
            <Link href="#contact" className="block px-3 py-2 hover:bg-green-600 rounded-md">
              Contato
            </Link>
            <Link href="/auth/login" className="block px-3 py-2 hover:bg-green-600 rounded-md">
              Login
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
