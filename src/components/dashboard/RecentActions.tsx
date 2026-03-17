'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiService } from '@/services/api';
import { Action, TaskType } from '@/types/brigada';

export function RecentActions({ userId, limit = 6 }: { userId?: string; limit?: number }) {
  const [actions, setActions] = useState<Action[] | null>(null);
  const [userNameById, setUserNameById] = useState<Record<string, string>>({});

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [users, rawActions] = await Promise.all([apiService.getUsers(), apiService.getActions()]);
        const map: Record<string, string> = {};
        users.forEach((u) => {
          map[u.id] = u.name;
        });
        const filtered = userId ? rawActions.filter((a) => a.userId === userId) : rawActions;
        if (!mounted) return;
        setUserNameById(map);
        setActions(filtered.slice(0, limit));
      } catch {
        if (!mounted) return;
        setActions([]);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [userId, limit]);

  const getDotColor = (action: Action) => {
    const type = action.type as TaskType;
    if (type === TaskType.COMBATE) return 'bg-red-500';
    if (type === TaskType.RESCATE) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const formatRelativeTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const minutes = Math.max(0, Math.floor(diff / 60000));
    if (minutes < 60) return `${minutes} min atrás`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} h atrás`;
    const days = Math.floor(hours / 24);
    return `${days} d atrás`;
  };

  const items = useMemo(() => {
    if (!actions) return null;
    return actions.map((action) => {
      const user = userNameById[action.userId] ?? 'Usuário';
      const location = `${action.location.latitude.toFixed(4)}, ${action.location.longitude.toFixed(4)}`;
      return {
        id: action.id,
        user,
        description: action.description,
        location,
        time: formatRelativeTime(action.createdAt),
        dotColor: getDotColor(action),
      };
    });
  }, [actions, userNameById]);

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Recentes</h3>
      <div className="space-y-4">
        {!items && <p className="text-gray-600">Carregando ações...</p>}
        {items?.map((action) => (
          <div key={action.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
            <div className={`w-2 h-2 rounded-full ${action.dotColor}`}></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{action.user}</p>
              <p className="text-sm text-gray-600">{action.description}</p>
              <p className="text-xs text-gray-500">
                {action.location} • {action.time}
              </p>
            </div>
          </div>
        ))}
        {items?.length === 0 && <p className="text-gray-600">Nenhuma ação registrada ainda.</p>}
      </div>
    </div>
  );
}
