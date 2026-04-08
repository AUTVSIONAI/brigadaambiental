'use client';

import { apiService } from '@/services/api';
import { Report, ReportStatus } from '@/types/brigada';
import { User } from '@/types/auth';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';

const statusOptions: Array<{ value: ReportStatus; label: string }> = [
  { value: ReportStatus.RECEBIDA, label: 'Recebida' },
  { value: ReportStatus.TRIAGEM, label: 'Triagem' },
  { value: ReportStatus.EM_VERIFICACAO, label: 'Em verificação' },
  { value: ReportStatus.CONFIRMADA, label: 'Confirmada' },
  { value: ReportStatus.ENCERRADA, label: 'Encerrada' },
];

type ReportDetail = Report & {
  nearestBrigadistas?: Array<{
    userId: string;
    name: string;
    latitude: number;
    longitude: number;
    createdAt: string;
    distanceKm: number;
  }>;
};

export function AdminDenuncias() {
  const [reports, setReports] = useState<Report[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [flash, setFlash] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState<ReportStatus | ''>('');

  const selected = useMemo(() => reports.find((r) => r.id === selectedId) ?? null, [reports, selectedId]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setFlash(null);
    try {
      const [items, usersData] = await Promise.all([
        apiService.getReports(statusFilter ? { status: statusFilter } : undefined),
        apiService.getUsers(),
      ]);
      setReports(items);
      setUsers(usersData);
    } catch {
      setFlash({ type: 'error', message: 'Erro ao carregar denúncias' });
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const loadDetail = async () => {
      if (!selectedId) {
        setDetail(null);
        return;
      }
      setDetailLoading(true);
      try {
        const d = await apiService.getReport(selectedId);
        setDetail(d);
      } catch {
        setDetail(null);
      } finally {
        setDetailLoading(false);
      }
    };
    void loadDetail();
  }, [selectedId]);

  const updateDetail = async (patch: Partial<Pick<Report, 'status' | 'assignedToId'>>) => {
    if (!detail) return;
    setFlash(null);
    setDetailLoading(true);
    try {
      const updated = await apiService.updateReport(detail.id, patch);
      setDetail((prev) => (prev ? { ...prev, ...updated } : prev));
      setReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setFlash({ type: 'success', message: 'Denúncia atualizada' });
    } catch {
      setFlash({ type: 'error', message: 'Erro ao atualizar denúncia' });
    } finally {
      setDetailLoading(false);
    }
  };

  const assignedName = useMemo(() => {
    if (!detail?.assignedToId) return '';
    return users.find((u) => u.id === detail.assignedToId)?.name ?? detail.assignedToId;
  }, [detail?.assignedToId, users]);

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Denúncias</h3>
          <p className="text-sm text-gray-600">Triagem e direcionamento de ocorrências.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter((e.target.value as ReportStatus) || '')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Todos os status</option>
            {statusOptions.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={refresh}
            className="bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-black transition-colors disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>
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
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700">Lista</div>
          <div className="max-h-[520px] overflow-auto divide-y">
            {loading ? (
              <div className="p-4 text-gray-600">Carregando...</div>
            ) : reports.length === 0 ? (
              <div className="p-4 text-gray-600">Nenhuma denúncia encontrada.</div>
            ) : (
              reports.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedId(r.id)}
                  className={`w-full text-left p-4 hover:bg-gray-50 ${
                    selectedId === r.id ? 'bg-green-50 border-l-4 border-green-700' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-medium text-gray-900">{r.type}</div>
                    <div className="text-xs text-gray-600">{new Date(r.createdAt).toLocaleString('pt-BR')}</div>
                  </div>
                  <div className="mt-1 text-sm text-gray-700 truncate">{r.description}</div>
                  <div className="mt-1 text-xs text-gray-500">Status: {r.status}</div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700">Detalhes</div>
          <div className="p-4">
            {!selected ? (
              <div className="text-gray-600">Selecione uma denúncia.</div>
            ) : detailLoading || !detail ? (
              <div className="text-gray-600">{detailLoading ? 'Carregando...' : 'Não foi possível carregar.'}</div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm text-gray-500">ID</div>
                    <div className="text-sm font-medium text-gray-900 break-all">{detail.id}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Criada em</div>
                    <div className="text-sm font-medium text-gray-900">{new Date(detail.createdAt).toLocaleString('pt-BR')}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Tipo</div>
                    <div className="text-sm font-medium text-gray-900">{detail.type}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Status</div>
                    <select
                      value={detail.status}
                      onChange={(e) => updateDetail({ status: e.target.value as ReportStatus })}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      disabled={detailLoading}
                    >
                      {statusOptions.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-500">Descrição</div>
                  <div className="text-sm text-gray-900 whitespace-pre-wrap">{detail.description}</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Latitude</div>
                    <div className="text-sm font-medium text-gray-900">{detail.latitude}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Longitude</div>
                    <div className="text-sm font-medium text-gray-900">{detail.longitude}</div>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-500">Atribuída para</div>
                  <div className="mt-1 flex items-center gap-2">
                    <select
                      value={detail.assignedToId ?? ''}
                      onChange={(e) => updateDetail({ assignedToId: e.target.value || undefined })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      disabled={detailLoading}
                    >
                      <option value="">Não atribuída</option>
                      {users
                        .filter((u) => u.role !== 'ADMIN_BRIGADA')
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name}
                          </option>
                        ))}
                    </select>
                    <div className="text-xs text-gray-500 shrink-0">{assignedName ? `→ ${assignedName}` : ''}</div>
                  </div>
                </div>

                {detail.photos?.[0] && (
                  <div className="border rounded-md overflow-hidden">
                    <Image
                      src={detail.photos[0]}
                      alt="Foto da denúncia"
                      width={1200}
                      height={900}
                      className="w-full max-h-[360px] object-contain bg-gray-50"
                      unoptimized
                    />
                  </div>
                )}

                <div>
                  <div className="text-sm text-gray-500 mb-2">Brigadistas mais próximos (últimos 7 dias)</div>
                  {detail.nearestBrigadistas && detail.nearestBrigadistas.length > 0 ? (
                    <div className="space-y-2">
                      {detail.nearestBrigadistas.map((b) => (
                        <div key={b.userId} className="flex items-center justify-between text-sm border rounded-md px-3 py-2">
                          <div className="font-medium text-gray-900">{b.name}</div>
                          <div className="text-gray-600">{b.distanceKm.toFixed(1)} km</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600">Sem localização recente.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
