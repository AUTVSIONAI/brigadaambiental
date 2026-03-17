'use client';

interface BrigadistaSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function BrigadistaSidebar({ activeTab, setActiveTab }: BrigadistaSidebarProps) {
  const menuItems = [
    { id: 'tasks', name: 'Minhas Tarefas', icon: '📋' },
    { id: 'actions', name: 'Registrar Ação', icon: '✅' },
    { id: 'history', name: 'Histórico', icon: '📈' },
    { id: 'chat', name: 'Chat IA', icon: '🤖' },
    { id: 'map', name: 'Mapa', icon: '🗺️' },
  ];

  return (
    <div className="w-64 bg-white shadow-lg shrink-0 relative z-50">
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-800">Brigadista</h1>
      </div>
      <nav className="mt-6">
        {menuItems.map((item) => (
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
