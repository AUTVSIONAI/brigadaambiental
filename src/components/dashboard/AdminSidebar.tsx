'use client';

import { UserRole } from '@/types/auth';

interface AdminSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  role: UserRole;
}

export function AdminSidebar({ activeTab, setActiveTab, role }: AdminSidebarProps) {
  const menuItems = [
    { id: 'overview', name: 'Visão Geral', icon: '📊' },
    { id: 'users', name: 'Brigadistas', icon: '👥' },
    { id: 'brigades', name: 'Brigadas', icon: '🚒' },
    { id: 'tasks', name: 'Tarefas', icon: '📋' },
    { id: 'map', name: 'Mapa', icon: '🗺️' },
    { id: 'ai', name: 'Assistente IA', icon: '🤖' },
  ];
  const visibleItems =
    role === UserRole.ADMIN_BRIGADA ? menuItems : menuItems.filter((m) => m.id !== 'users' && m.id !== 'ai');

  return (
    <div className="w-64 bg-white shadow-lg shrink-0 relative z-50">
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-800">Administração</h1>
      </div>
      <nav className="mt-6">
        {visibleItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center px-6 py-3 text-left hover:bg-gray-100 transition-colors ${
              activeTab === item.id ? 'bg-green-50 text-green-700 border-r-4 border-green-700' : 'text-gray-700'
            }`}
          >
            <span className="mr-3 text-lg">{item.icon}</span>
            {item.name}
          </button>
        ))}
      </nav>
    </div>
  );
}
