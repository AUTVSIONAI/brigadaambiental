'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiService } from '@/services/api';
import { Action, TaskType } from '@/types/brigada';
import Image from 'next/image';

export function RecentActions({ userId, limit = 6 }: { userId?: string; limit?: number }) {
  const [actions, setActions] = useState<Action[] | null>(null);
  const [userNameById, setUserNameById] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<Action | null>(null);

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
        raw: action,
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
          <button
            key={action.id}
            type="button"
            onClick={() => setSelected(action.raw)}
            className="w-full flex items-center space-x-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 text-left"
          >
            <div className={`w-2 h-2 rounded-full ${action.dotColor}`}></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{action.user}</p>
              <p className="text-sm text-gray-600">{action.description}</p>
              <p className="text-xs text-gray-500">
                {action.location} • {action.time}
              </p>
            </div>
          </button>
        ))}
        {items?.length === 0 && <p className="text-gray-600">Nenhuma ação registrada ainda.</p>}
      </div>
      {selected && (
        <dialog open className="w-full max-w-3xl p-0 bg-white rounded-lg shadow-xl">
          <div className="p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-gray-500">Ação</div>
                <div className="text-lg font-semibold text-gray-900">{selected.description}</div>
                <div className="text-xs text-gray-500">
                  {new Date(selected.createdAt).toLocaleString('pt-BR')} • {selected.location.latitude.toFixed(4)},{' '}
                  {selected.location.longitude.toFixed(4)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-gray-500 hover:text-gray-700 px-3 py-1 border rounded-md"
              >
                Fechar
              </button>
            </div>

            <div className="text-sm text-gray-700">
              Brigadista:{' '}
              <a
                href={`/dashboard/admin/usuario/${selected.userId}`}
                className="text-blue-600 hover:underline"
              >
                {userNameById[selected.userId] ?? selected.userId}
              </a>
            </div>

            {selected.photos && selected.photos.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selected.photos.slice(0, 4).map((src, idx) => (
                  <div key={idx} className="border rounded-md overflow-hidden">
                    <Image src={src} alt={`Foto ${idx + 1}`} width={1200} height={900} className="w-full object-contain bg-gray-50" unoptimized />
                  </div>
                ))}
              </div>
            )}
          </div>
        </dialog>
      )}
    </div>
  );
}
