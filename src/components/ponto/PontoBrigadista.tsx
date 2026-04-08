'use client';

import { apiService } from '@/services/api';
import { TimeClockSession } from '@/types/brigada';
import { useEffect, useMemo, useState } from 'react';

export function PontoBrigadista() {
  const [openSession, setOpenSession] = useState<TimeClockSession | null>(null);
  const [sessions, setSessions] = useState<TimeClockSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState('');
  const [flash, setFlash] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const refresh = async () => {
    setLoading(true);
    setFlash(null);
    try {
      const res = await apiService.getMyTimeClock();
      setOpenSession(res.openSession);
      setSessions(res.sessions);
    } catch {
      setFlash({ type: 'error', message: 'Erro ao carregar ponto' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const getLocation = async () => {
    if (!('geolocation' in navigator)) return null;
    return await new Promise<{ latitude: number; longitude: number } | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  };

  const clockIn = async () => {
    if (loading) return;
    setLoading(true);
    setFlash(null);
    try {
      const loc = await getLocation();
      const created = await apiService.clockIn({
        latitude: loc?.latitude,
        longitude: loc?.longitude,
        note: note.trim() || undefined,
      });
      setOpenSession(created);
      setNote('');
      await refresh();
      setFlash({ type: 'success', message: 'Entrada registrada' });
    } catch {
      setFlash({ type: 'error', message: 'Erro ao registrar entrada' });
    } finally {
      setLoading(false);
    }
  };

  const clockOut = async () => {
    if (loading) return;
    setLoading(true);
    setFlash(null);
    try {
      const loc = await getLocation();
      const updated = await apiService.clockOut({
        latitude: loc?.latitude,
        longitude: loc?.longitude,
        note: note.trim() || undefined,
      });
      setOpenSession(null);
      setNote('');
      setSessions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      await refresh();
      setFlash({ type: 'success', message: 'Saída registrada' });
    } catch {
      setFlash({ type: 'error', message: 'Erro ao registrar saída' });
    } finally {
      setLoading(false);
    }
  };

  const today = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return sessions.filter((s) => new Date(s.startedAt) >= start).slice(0, 10);
  }, [sessions]);

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Bater Ponto</h3>
          <p className="text-sm text-gray-600">Entrada/saída com controle de horários.</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border rounded-lg p-4">
          <div className="text-sm font-medium text-gray-900 mb-2">Status</div>
          <div className="text-sm text-gray-700">
            {openSession ? (
              <div className="space-y-1">
                <div>
                  Em serviço desde <span className="font-medium">{new Date(openSession.startedAt).toLocaleString('pt-BR')}</span>
                </div>
                <div className="text-xs text-gray-500">ID: {openSession.id}</div>
              </div>
            ) : (
              'Sem ponto em aberto.'
            )}
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Observação (opcional)</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="ex.: patrulha setor 3"
              disabled={loading}
            />
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={clockIn}
              disabled={loading || !!openSession}
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              Entrada
            </button>
            <button
              type="button"
              onClick={clockOut}
              disabled={loading || !openSession}
              className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              Saída
            </button>
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700">Hoje</div>
          <div className="max-h-[360px] overflow-auto divide-y">
            {today.length === 0 ? (
              <div className="p-4 text-gray-600">Nenhum registro hoje.</div>
            ) : (
              today.map((s) => (
                <div key={s.id} className="p-4 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-gray-900">{new Date(s.startedAt).toLocaleTimeString('pt-BR')}</div>
                    <div className="text-gray-600">
                      {s.endedAt ? new Date(s.endedAt).toLocaleTimeString('pt-BR') : '—'}
                    </div>
                  </div>
                  {s.note && <div className="mt-1 text-xs text-gray-500 truncate">{s.note}</div>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

