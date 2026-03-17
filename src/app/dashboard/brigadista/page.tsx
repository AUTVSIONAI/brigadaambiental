'use client';

import { useAuth } from '@/hooks/useAuth';
import { BrigadistaSidebar } from '@/components/dashboard/BrigadistaSidebar';
import { BrigadistaHeader } from '@/components/dashboard/BrigadistaHeader';
import { TaskList } from '@/components/tasks/TaskList';
import { ActionForm } from '@/components/tasks/ActionForm';
import { ChatIA } from '@/components/chat/ChatIA';
import { RecentActions } from '@/components/dashboard/RecentActions';
import { UserRole } from '@/types/auth';
import { useEffect, useState } from 'react';

export default function DashboardBrigadistaPage() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('tasks');

  useEffect(() => {
    document.querySelectorAll('dialog[open]').forEach((el) => {
      try {
        (el as HTMLDialogElement).close();
      } catch {}
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role === UserRole.ADMIN_BRIGADA) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h1>
          <p className="text-gray-600">Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex relative">
      <BrigadistaSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 flex flex-col">
        <BrigadistaHeader user={user} />
        <main className="flex-1 p-6">
          {activeTab === 'tasks' && <TaskList />}
          {activeTab === 'actions' && <ActionForm />}
          {activeTab === 'history' && <RecentActions userId={user.id} />}
          {activeTab === 'chat' && <ChatIA />}
          {activeTab === 'map' && (
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <iframe title="Mapa" src="/mapa?embed=1" className="w-full h-[650px]" />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
