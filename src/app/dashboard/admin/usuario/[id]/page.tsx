'use client';

import { apiService } from '@/services/api';
import { Brigade, Task, TaskStatus } from '@/types/brigada';
import { User } from '@/types/auth';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { RecentActions } from '@/components/dashboard/RecentActions';

export default function AdminUsuarioProfilePage({ params }: { params: { id: string } }) {
  const userId = params.id;
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [brigades, setBrigades] = useState<Brigade[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const [users, allTasks, brigadesData] = await Promise.all([
          apiService.getUsers(),
          apiService.getTasks(),
          apiService.getBrigades(),
        ]);
        if (!mounted) return;
        setUser(users.find((u) => u.id === userId) ?? null);
        setTasks(allTasks.filter((t) => t.userId === userId));
        setBrigades(brigadesData);
      } catch {
        if (!mounted) return;
        setUser(null);
        setTasks([]);
        setBrigades([]);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, [userId]);

  const brigadeName = useMemo(() => {
    if (!user?.brigadeId) return '-';
    return brigades.find((b) => b.id === user.brigadeId)?.name ?? user.brigadeId;
  }, [user?.brigadeId, brigades]);

  const groupedTasks = useMemo(() => {
    const byStatus: Record<TaskStatus, Task[]> = {
      PENDENTE: [],
      EM_ANDAMENTO: [],
      CONCLUIDA: [],
      CANCELADA: [],
    };
    tasks.forEach((t) => {
      byStatus[t.status] = byStatus[t.status] ?? [];
      byStatus[t.status].push(t);
    });
    return byStatus;
  }, [tasks]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{loading ? 'Carregando...' : 'Usuário não encontrado'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-start gap-4">
            <Image src="/logo.png" alt="Avatar" width={56} height={56} className="rounded-full bg-gray-100" />
            <div className="flex-1">
              <div className="text-lg font-semibold text-gray-900">{user.name}</div>
              <div className="text-sm text-gray-600">{user.email}</div>
              <div className="text-sm text-gray-600">Papel: {user.role}</div>
              <div className="text-sm text-gray-600">Brigada: {brigadeName}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tarefas</h3>
            {tasks.length === 0 ? (
              <p className="text-gray-600">Nenhuma tarefa atribuída.</p>
            ) : (
              <div className="space-y-6">
                {(['EM_ANDAMENTO', 'PENDENTE', 'CONCLUIDA', 'CANCELADA'] as TaskStatus[]).map((st) => (
                  <div key={st}>
                    <div className="text-sm font-medium text-gray-800 mb-2">{st.replace('_', ' ')}</div>
                    <div className="space-y-2">
                      {groupedTasks[st].map((t) => (
                        <div key={t.id} className="p-3 bg-gray-50 rounded-md">
                          <div className="text-sm font-medium text-gray-900">{t.description}</div>
                          <div className="text-xs text-gray-600">
                            {t.type} • {t.latitude.toFixed(4)}, {t.longitude.toFixed(4)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <RecentActions userId={userId} limit={12} />
        </div>
      </div>
    </div>
  );
}

