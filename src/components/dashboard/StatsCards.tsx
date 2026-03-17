'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiService } from '@/services/api';
import { TaskStatus } from '@/types/brigada';

export function StatsCards() {
  const [counts, setCounts] = useState<{
    users: number;
    activeTasks: number;
    brigades: number;
    actions: number;
  } | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [users, brigades, tasks, actions] = await Promise.all([
          apiService.getUsers(),
          apiService.getBrigades(),
          apiService.getTasks(),
          apiService.getActions(),
        ]);

        const activeTasks = tasks.filter(
          (t) => t.status === TaskStatus.PENDENTE || t.status === TaskStatus.EM_ANDAMENTO
        ).length;

        if (!mounted) return;
        setCounts({
          users: users.length,
          activeTasks,
          brigades: brigades.length,
          actions: actions.length,
        });
      } catch {
        if (!mounted) return;
        setCounts({ users: 0, activeTasks: 0, brigades: 0, actions: 0 });
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const value = (n: number | null) => (n === null ? '—' : n.toString());
    return [
      {
        title: 'Total de Brigadistas',
        value: value(counts?.users ?? null),
        change: ' ',
        changeType: 'neutral',
        icon: '👥',
      },
      {
        title: 'Tarefas Ativas',
        value: value(counts?.activeTasks ?? null),
        change: ' ',
        changeType: 'neutral',
        icon: '📋',
      },
      {
        title: 'Brigadas',
        value: value(counts?.brigades ?? null),
        change: ' ',
        changeType: 'neutral',
        icon: '🚒',
      },
      {
        title: 'Ações Realizadas',
        value: value(counts?.actions ?? null),
        change: ' ',
        changeType: 'neutral',
        icon: '✅',
      },
    ];
  }, [counts]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{stat.title}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
            <div className="text-3xl">{stat.icon}</div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-600">{stat.change}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
