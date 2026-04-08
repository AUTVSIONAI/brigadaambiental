'use client';

import { apiService } from '@/services/api';
import { TimeClockSession } from '@/types/brigada';
import { User } from '@/types/auth';
import { useCallback, useEffect, useMemo, useState } from 'react';

function hoursBetween(startIso: string, endIso?: string) {
  if (!endIso) return null;
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  return (end - start) / (1000 * 60 * 60);
}

export function PontoAdmin() {
  const [sessions, setSessions] = useState<TimeClockSession[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [flash, setFlash] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [from, setFrom] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [userId, setUserId] = useState<string>('');

  const userNameById = useMemo(() => {
    const map: Record<string, string> = {};
    users.forEach((u) => {
      map[u.id] = u.name;
    });
    return map;
  }, [users]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setFlash(null);
    try {
      const [items, usersData] = await Promise.all([
        apiService.getTimeClock({
          from: `${from}T00:00:00.000Z`,
          to: `${to}T23:59:59.999Z`,
          userId: userId || undefined,
        }),
        apiService.getUsers(),
      ]);
      setSessions(items);
      setUsers(usersData);
    } catch {
      setFlash({ type: 'error', message: 'Erro ao carregar ponto' });
    } finally {
      setLoading(false);
    }
  }, [from, to, userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const totalHours = useMemo(() => {
    const sum = sessions.reduce((acc, s) => {
      const h = hoursBetween(s.startedAt, s.endedAt);
      return acc + (h ?? 0);
    }, 0);
    return sum;
  }, [sessions]);

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Controle de Ponto</h3>
          <p className="text-sm text-gray-600">Visão administrativa dos horários.</p>
        </div>
        <button
          type="button"
          onClick={refresh}
          className="bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-black transition-colors disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Atualizando...' : 'Atualizar'}
        </button>
      </div>

      {flash && (
        <div
          className={`mb-4 px-4 py-3 rounded-md border ${
            flash.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {flash.message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">De</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Até</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            disabled={loading}
          />
        </div>
        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Brigadista</label>
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            disabled={loading}
          >
            <option value="">Todos</option>
            {users
              .filter((u) => u.role !== 'ADMIN_BRIGADA')
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
          </select>
        </div>
        <div className="lg:col-span-4 flex items-center gap-2">
          <button
            type="button"
            onClick={refresh}
            className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
            disabled={loading}
          >
            Aplicar filtro
          </button>
          <div className="text-sm text-gray-700">
            Total no período: <span className="font-medium">{totalHours.toFixed(2)}h</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brigadista</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entrada</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Saída</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Horas</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Obs.</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sessions.length === 0 ? (
              <tr>
                <td className="px-4 py-4 text-sm text-gray-600" colSpan={5}>
                  Nenhum registro no período.
                </td>
              </tr>
            ) : (
              sessions.map((s) => {
                const hrs = hoursBetween(s.startedAt, s.endedAt);
                return (
                  <tr key={s.id}>
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">
                      {userNameById[s.userId] ?? s.userId}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700">{new Date(s.startedAt).toLocaleString('pt-BR')}</td>
                    <td className="px-4 py-4 text-sm text-gray-700">
                      {s.endedAt ? new Date(s.endedAt).toLocaleString('pt-BR') : 'Em aberto'}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700">{hrs === null ? '-' : hrs.toFixed(2)}</td>
                    <td className="px-4 py-4 text-sm text-gray-600 truncate max-w-[240px]">{s.note ?? ''}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
