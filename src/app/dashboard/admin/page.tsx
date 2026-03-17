'use client';

import { useAuth } from '@/hooks/useAuth';
import { AdminSidebar } from '@/components/dashboard/AdminSidebar';
import { AdminHeader } from '@/components/dashboard/AdminHeader';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { RecentActions } from '@/components/dashboard/RecentActions';
import { UserManagement } from '@/components/dashboard/UserManagement';
import { TaskList } from '@/components/tasks/TaskList';
import { apiService } from '@/services/api';
import { Brigade } from '@/types/brigada';
import { User, UserRole } from '@/types/auth';
import { AiConfig } from '@/types/chat';
import { useEffect, useMemo, useState } from 'react';

export default function DashboardAdminPage() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [brigades, setBrigades] = useState<Brigade[]>([]);
  const [brigadesLoading, setBrigadesLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [brigadeFlash, setBrigadeFlash] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [brigadeFormOpen, setBrigadeFormOpen] = useState(false);
  const [brigadeFormMode, setBrigadeFormMode] = useState<'create' | 'edit'>('create');
  const [editingBrigadeId, setEditingBrigadeId] = useState<string | null>(null);
  const [brigadeFormLoading, setBrigadeFormLoading] = useState(false);
  const [aiConfig, setAiConfig] = useState<AiConfig | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiFlash, setAiFlash] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [aiDraft, setAiDraft] = useState<{ systemPrompt: string; model: string; temperature: string }>({
    systemPrompt: '',
    model: '',
    temperature: '0.3',
  });
  const [brigadeForm, setBrigadeForm] = useState<{
    name: string;
    description: string;
    region: string;
    leaderId: string;
    parentId: string;
  }>({
    name: '',
    description: '',
    region: '',
    leaderId: '',
    parentId: '',
  });

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setBrigadesLoading(true);
      try {
        const [brigadesData, usersData] = await Promise.all([apiService.getBrigades(), apiService.getUsers()]);
        if (!mounted) return;
        setBrigades(brigadesData);
        setUsers(usersData);
      } catch {
        if (!mounted) return;
        setBrigades([]);
        setUsers([]);
      } finally {
        if (!mounted) return;
        setBrigadesLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const leaderNameById = useMemo(() => {
    const map: Record<string, string> = {};
    users.forEach((u) => {
      map[u.id] = u.name;
    });
    return map;
  }, [users]);

  const brigadeNameById = useMemo(() => {
    const map: Record<string, string> = {};
    brigades.forEach((b) => {
      map[b.id] = b.name;
    });
    return map;
  }, [brigades]);

  const brigadeRows = useMemo(() => {
    const childrenByParent: Record<string, Brigade[]> = {};
    brigades.forEach((b) => {
      const key = b.parentId ?? '';
      childrenByParent[key] = childrenByParent[key] ?? [];
      childrenByParent[key].push(b);
    });
    Object.values(childrenByParent).forEach((list) => list.sort((a, b) => a.name.localeCompare(b.name)));

    const rows: Array<{ brigade: Brigade; depth: number }> = [];
    const walk = (parentKey: string, depth: number) => {
      const children = childrenByParent[parentKey] ?? [];
      children.forEach((child) => {
        rows.push({ brigade: child, depth });
        walk(child.id, depth + 1);
      });
    };
    walk('', 0);
    return rows;
  }, [brigades]);

  const openCreateBrigade = () => {
    setBrigadeFlash(null);
    setBrigadeFormMode('create');
    setEditingBrigadeId(null);
    setBrigadeForm({
      name: '',
      description: '',
      region: '',
      leaderId: user?.id ?? '',
      parentId: '',
    });
    setBrigadeFormOpen(true);
  };

  const openEditBrigade = (brigade: Brigade) => {
    setBrigadeFlash(null);
    setBrigadeFormMode('edit');
    setEditingBrigadeId(brigade.id);
    setBrigadeForm({
      name: brigade.name,
      description: brigade.description,
      region: brigade.region,
      leaderId: brigade.leaderId,
      parentId: brigade.parentId ?? '',
    });
    setBrigadeFormOpen(true);
  };

  const refreshBrigades = async () => {
    setBrigadesLoading(true);
    try {
      const [brigadesData, usersData] = await Promise.all([apiService.getBrigades(), apiService.getUsers()]);
      setBrigades(brigadesData);
      setUsers(usersData);
    } finally {
      setBrigadesLoading(false);
    }
  };

  const submitBrigadeForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (brigadeFormLoading) return;
    setBrigadeFlash(null);
    setBrigadeFormLoading(true);
    try {
      const payload = {
        name: brigadeForm.name.trim(),
        description: brigadeForm.description.trim(),
        region: brigadeForm.region.trim(),
        leaderId: isAdmin ? brigadeForm.leaderId : user?.id ?? brigadeForm.leaderId,
        parentId: brigadeForm.parentId.trim() ? brigadeForm.parentId.trim() : null,
      };
      if (brigadeFormMode === 'create') {
        await apiService.createBrigade(payload);
        setBrigadeFlash({ type: 'success', message: 'Brigada/núcleo criado' });
      } else if (editingBrigadeId) {
        await apiService.updateBrigade(editingBrigadeId, payload);
        setBrigadeFlash({ type: 'success', message: 'Brigada/núcleo atualizado' });
      }
      await refreshBrigades();
      setBrigadeFormOpen(false);
    } catch {
      setBrigadeFlash({ type: 'error', message: 'Erro ao salvar brigada/núcleo' });
    } finally {
      setBrigadeFormLoading(false);
    }
  };

  const deleteBrigade = async (brigade: Brigade) => {
    if (!window.confirm(`Excluir "${brigade.name}"?`)) return;
    setBrigadeFlash(null);
    setBrigadesLoading(true);
    try {
      await apiService.deleteBrigade(brigade.id);
      setBrigadeFlash({ type: 'success', message: 'Brigada/núcleo excluído' });
      await refreshBrigades();
    } catch {
      setBrigadeFlash({ type: 'error', message: 'Não foi possível excluir (verifique filhos/membros/tarefas)' });
    } finally {
      setBrigadesLoading(false);
    }
  };

  useEffect(() => {
    document.querySelectorAll('dialog[open]').forEach((el) => {
      try {
        (el as HTMLDialogElement).close();
      } catch {}
    });
  }, []);

  const canManage = !!user && [UserRole.ADMIN_BRIGADA, UserRole.SUPERVISOR, UserRole.COMANDANTE].includes(user.role);
  const isAdmin = user?.role === UserRole.ADMIN_BRIGADA;

  useEffect(() => {
    let mounted = true;
    const loadAi = async () => {
      if (!isAdmin) return;
      if (activeTab !== 'ai') return;
      setAiLoading(true);
      setAiFlash(null);
      try {
        const cfg = await apiService.getAiConfig();
        if (!mounted) return;
        setAiConfig(cfg);
        setAiDraft({
          systemPrompt: cfg.systemPrompt,
          model: cfg.model,
          temperature: String(cfg.temperature),
        });
      } catch {
        if (!mounted) return;
        setAiConfig(null);
        setAiFlash({ type: 'error', message: 'Não foi possível carregar a configuração de IA' });
      } finally {
        if (!mounted) return;
        setAiLoading(false);
      }
    };
    void loadAi();
    return () => {
      mounted = false;
    };
  }, [activeTab, isAdmin]);

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

  if (!canManage) {
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
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} role={user.role} />
      <div className="flex-1 flex flex-col">
        <AdminHeader user={user} />
        <main className="flex-1 p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <StatsCards />
              <RecentActions />
            </div>
          )}
          {activeTab === 'users' && isAdmin && <UserManagement />}
          {activeTab === 'brigades' && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Brigadas e Núcleos</h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={refreshBrigades}
                    className="bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-black transition-colors disabled:opacity-50"
                    disabled={brigadesLoading}
                  >
                    {brigadesLoading ? 'Atualizando...' : 'Atualizar'}
                  </button>
                  <button
                    type="button"
                    onClick={openCreateBrigade}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                  >
                    {isAdmin ? 'Novo Núcleo' : 'Novo Subnúcleo'}
                  </button>
                </div>
              </div>

              {brigadeFlash && (
                <div
                  className={`mb-4 px-4 py-3 rounded-md border ${
                    brigadeFlash.type === 'success'
                      ? 'bg-green-50 border-green-200 text-green-800'
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}
                >
                  {brigadeFlash.message}
                </div>
              )}

              {brigadeFormOpen && (
                <form onSubmit={submitBrigadeForm} className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                      <input
                        type="text"
                        value={brigadeForm.name}
                        onChange={(e) => setBrigadeForm({ ...brigadeForm, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Região</label>
                      <input
                        type="text"
                        value={brigadeForm.region}
                        onChange={(e) => setBrigadeForm({ ...brigadeForm, region: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                      <input
                        type="text"
                        value={brigadeForm.description}
                        onChange={(e) => setBrigadeForm({ ...brigadeForm, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Responsável (Líder)</label>
                      <select
                        value={brigadeForm.leaderId}
                        onChange={(e) => setBrigadeForm({ ...brigadeForm, leaderId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                        disabled={!isAdmin}
                      >
                        {isAdmin
                          ? users.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.name} ({u.role})
                              </option>
                            ))
                          : user && (
                              <option value={user.id}>
                                {user.name} ({user.role})
                              </option>
                            )}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Brigada Pai (opcional)</label>
                      <select
                        value={brigadeForm.parentId}
                        onChange={(e) => setBrigadeForm({ ...brigadeForm, parentId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        required={!isAdmin}
                        disabled={!isAdmin && brigadeFormMode === 'edit'}
                      >
                        {isAdmin ? (
                          <option value="">Sem pai (raiz)</option>
                        ) : (
                          <option value="">Selecione...</option>
                        )}
                        {brigadeRows
                          .filter((r) => (brigadeFormMode === 'edit' ? r.brigade.id !== editingBrigadeId : true))
                          .map((r) => (
                            <option key={r.brigade.id} value={r.brigade.id}>
                              {'—'.repeat(r.depth)} {r.brigade.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={brigadeFormLoading}
                      className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {brigadeFormLoading ? 'Salvando...' : 'Salvar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setBrigadeFormOpen(false)}
                      className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}

              {brigadesLoading ? (
                <p className="text-gray-600">Carregando brigadas...</p>
              ) : brigades.length === 0 ? (
                <p className="text-gray-600">Nenhuma brigada cadastrada ainda.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nome
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pai
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Região
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Responsável
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Membros
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {brigadeRows.map(({ brigade, depth }) => (
                        <tr key={brigade.id}>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900" style={{ paddingLeft: depth * 16 }}>
                              {brigade.name}
                            </div>
                            <div className="text-sm text-gray-500">{brigade.description}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {brigade.parentId ? (brigadeNameById[brigade.parentId] ?? brigade.parentId) : '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">{brigade.region}</td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {leaderNameById[brigade.leaderId] ?? brigade.leaderId}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">{brigade.members.length}</td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => openEditBrigade(brigade)}
                                className="bg-white border border-gray-300 text-gray-700 px-3 py-1 rounded-md hover:bg-gray-50 transition-colors"
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteBrigade(brigade)}
                                className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 transition-colors"
                              >
                                Excluir
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          {activeTab === 'ai' && isAdmin && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Assistente de IA</h3>
                  <p className="text-sm text-gray-600">Configure prompt e modelo do chat do brigadista</p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    if (aiLoading) return;
                    setAiLoading(true);
                    setAiFlash(null);
                    try {
                      const updated = await apiService.updateAiConfig({
                        systemPrompt: aiDraft.systemPrompt,
                        model: aiDraft.model,
                        temperature: Number(aiDraft.temperature),
                      });
                      setAiConfig(updated);
                      setAiDraft({
                        systemPrompt: updated.systemPrompt,
                        model: updated.model,
                        temperature: String(updated.temperature),
                      });
                      setAiFlash({ type: 'success', message: 'Configuração de IA salva' });
                    } catch {
                      setAiFlash({ type: 'error', message: 'Erro ao salvar configuração de IA' });
                    } finally {
                      setAiLoading(false);
                    }
                  }}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                  disabled={aiLoading}
                >
                  {aiLoading ? 'Salvando...' : 'Salvar'}
                </button>
              </div>

              {aiFlash && (
                <div
                  className={`mb-4 px-4 py-3 rounded-md border ${
                    aiFlash.type === 'success'
                      ? 'bg-green-50 border-green-200 text-green-800'
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}
                >
                  {aiFlash.message}
                </div>
              )}

              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Modelo (OpenRouter)</label>
                  <input
                    value={aiDraft.model}
                    onChange={(e) => setAiDraft((p) => ({ ...p, model: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="ex: openai/gpt-4o-mini"
                    disabled={aiLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Temperatura</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    value={aiDraft.temperature}
                    onChange={(e) => setAiDraft((p) => ({ ...p, temperature: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    disabled={aiLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prompt base (system)</label>
                  <textarea
                    value={aiDraft.systemPrompt}
                    onChange={(e) => setAiDraft((p) => ({ ...p, systemPrompt: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                    rows={10}
                    disabled={aiLoading}
                  />
                </div>

                <div className="text-xs text-gray-500">
                  {aiConfig ? `Atualizado em ${new Date(aiConfig.updatedAt).toLocaleString('pt-BR')}` : ''}
                </div>
              </div>
            </div>
          )}
          {activeTab === 'tasks' && <TaskList />}
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
