'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import { Brigade, Task, TaskStatus, TaskPriority, TaskType } from '@/types/brigada';
import { apiService } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { User, UserRole } from '@/types/auth';

export function TaskList() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [brigadeFilter, setBrigadeFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [users, setUsers] = useState<User[]>([]);
  const [brigades, setBrigades] = useState<Brigade[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [flash, setFlash] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const flashTimerRef = useRef<number | null>(null);
  const [createData, setCreateData] = useState<{
    description: string;
    type: TaskType;
    priority: TaskPriority;
    dueDate: string;
    latitude: string;
    longitude: string;
    brigadeId: string;
    userId: string;
  }>({
    description: '',
    type: TaskType.PATRULHA,
    priority: TaskPriority.MEDIA,
    dueDate: '',
    latitude: '',
    longitude: '',
    brigadeId: '',
    userId: '',
  });

  const showFlash = (type: 'success' | 'error', message: string) => {
    setFlash({ type, message });
    if (flashTimerRef.current) {
      window.clearTimeout(flashTimerRef.current);
    }
    flashTimerRef.current = window.setTimeout(() => {
      setFlash(null);
      flashTimerRef.current = null;
    }, 3500);
  };

  useEffect(() => {
    return () => {
      if (flashTimerRef.current) {
        window.clearTimeout(flashTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const isAdmin = user?.role === UserRole.ADMIN_BRIGADA;
        const isManager = isAdmin || user?.role === UserRole.SUPERVISOR || user?.role === UserRole.COMANDANTE;
        const [allTasks, usersData, brigadesData] = await Promise.all([
          apiService.getTasks(),
          isManager ? apiService.getUsers() : Promise.resolve([] as User[]),
          isManager ? apiService.getBrigades() : Promise.resolve([] as Brigade[]),
        ]);
        const visibleTasks = isManager ? allTasks : allTasks.filter((t) => t.userId === user?.id);
        if (!mounted) return;
        setTasks(visibleTasks);
        setUsers(usersData);
        setBrigades(brigadesData);
      } catch (error) {
        console.error('Erro ao buscar tarefas:', error);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [user?.id, user?.role]);

  const isAdmin = user?.role === UserRole.ADMIN_BRIGADA;
  const isManager = isAdmin || user?.role === UserRole.SUPERVISOR || user?.role === UserRole.COMANDANTE;

  const refresh = async () => {
    setLoading(true);
    try {
      const [allTasks, usersData, brigadesData] = await Promise.all([
        apiService.getTasks(),
        isManager ? apiService.getUsers() : Promise.resolve([] as User[]),
        isManager ? apiService.getBrigades() : Promise.resolve([] as Brigade[]),
      ]);
      const visibleTasks = isManager ? allTasks : allTasks.filter((t) => t.userId === user?.id);
      setTasks(visibleTasks);
      setUsers(usersData);
      setBrigades(brigadesData);
    } catch (error) {
      console.error('Erro ao atualizar tarefas:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskFields = async (taskId: string, patch: Partial<Omit<Task, 'id' | 'createdAt'>>) => {
    try {
      const updated = await apiService.updateTask(taskId, patch);
      setTasks((current) => current.map((task) => (task.id === taskId ? updated : task)));
      showFlash('success', 'Tarefa atualizada');
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
      showFlash('error', 'Erro ao atualizar tarefa');
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const updated = await apiService.updateTaskStatus(taskId, newStatus);
      setTasks((current) => current.map((task) => (task.id === taskId ? updated : task)));
      showFlash('success', 'Status atualizado');
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
      showFlash('error', 'Erro ao atualizar status');
    }
  };

  const updateTaskAssignee = async (taskId: string, userId: string) => {
    await updateTaskFields(taskId, { userId: userId || undefined });
  };

  const toDateInputValue = (iso: string | undefined) => {
    if (!iso) return '';
    const d = new Date(iso);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const toIsoFromDateInput = (value: string) => {
    if (!value) return undefined;
    return new Date(`${value}T12:00:00.000`).toISOString();
  };

  const userNameById = useMemo(() => {
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

  const filteredTasks = useMemo(() => {
    let list = tasks;

    if (filter !== 'all') {
      list = list.filter((t) => t.status === filter);
    }

    if (isManager) {
      if (brigadeFilter !== 'all') {
        list = list.filter((t) => t.brigadeId === brigadeFilter);
      }
      if (assigneeFilter !== 'all') {
        if (assigneeFilter === 'none') {
          list = list.filter((t) => !t.userId);
        } else {
          list = list.filter((t) => t.userId === assigneeFilter);
        }
      }
      if (priorityFilter !== 'all') {
        list = list.filter((t) => t.priority === priorityFilter);
      }
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        list = list.filter((t) => {
          return (
            t.description.toLowerCase().includes(q) ||
            t.type.toLowerCase().includes(q) ||
            (t.userId ? (userNameById[t.userId] ?? t.userId).toLowerCase().includes(q) : false) ||
            (brigadeNameById[t.brigadeId] ?? t.brigadeId).toLowerCase().includes(q)
          );
        });
      }
    }

    return list;
  }, [assigneeFilter, brigadeFilter, brigadeNameById, filter, isManager, priorityFilter, search, tasks, userNameById]);

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.CRITICA:
        return 'bg-red-100 text-red-800';
      case TaskPriority.ALTA:
        return 'bg-orange-100 text-orange-800';
      case TaskPriority.MEDIA:
        return 'bg-yellow-100 text-yellow-800';
      case TaskPriority.BAIXA:
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.CONCLUIDA:
        return 'bg-green-100 text-green-800';
      case TaskStatus.EM_ANDAMENTO:
        return 'bg-blue-100 text-blue-800';
      case TaskStatus.PENDENTE:
        return 'bg-yellow-100 text-yellow-800';
      case TaskStatus.CANCELADA:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <p className="text-gray-600">Carregando tarefas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        {flash && (
          <div
            className={`mb-4 px-4 py-3 rounded-md border ${
              flash.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {flash.message}
          </div>
        )}

        <div className="flex justify-between items-center mb-6 gap-3 flex-wrap">
          <h3 className="text-lg font-semibold text-gray-900">
            {isManager ? 'Tarefas' : 'Minhas Tarefas'}
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={refresh}
              className="bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-black transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Atualizando...' : 'Atualizar'}
            </button>
            {isManager && (
              <button
                onClick={() => {
                  setShowCreate((v) => !v);
                  setCreateError(null);
                }}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                {showCreate ? 'Cancelar' : 'Criar tarefa'}
              </button>
            )}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as TaskStatus | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">Todas</option>
              <option value={TaskStatus.PENDENTE}>Pendentes</option>
              <option value={TaskStatus.EM_ANDAMENTO}>Em Andamento</option>
              <option value={TaskStatus.CONCLUIDA}>Concluídas</option>
            </select>
          </div>
        </div>

        {isManager && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Buscar por tarefa, brigada, responsável..."
            />
            <select
              value={brigadeFilter}
              onChange={(e) => setBrigadeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">Todas as brigadas</option>
              {brigades.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">Todos responsáveis</option>
              <option value="none">Sem responsável</option>
              {users
                .filter((u) => u.role !== UserRole.ADMIN_BRIGADA)
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">Todas prioridades</option>
              {Object.values(TaskPriority).map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        )}

        {isManager && showCreate && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setCreateError(null);
              setCreateLoading(true);
              try {
                const latitude = Number(createData.latitude);
                const longitude = Number(createData.longitude);
                if (!createData.description.trim()) {
                  throw new Error('Descrição é obrigatória');
                }
                if (!createData.brigadeId) {
                  throw new Error('Selecione uma brigada');
                }
                if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
                  throw new Error('Latitude e longitude são obrigatórias');
                }

                await apiService.createTask({
                  description: createData.description.trim(),
                  type: createData.type,
                  priority: createData.priority,
                  brigadeId: createData.brigadeId,
                  userId: createData.userId || undefined,
                  dueDate: createData.dueDate ? new Date(createData.dueDate).toISOString() : undefined,
                  latitude,
                  longitude,
                });

                setCreateData({
                  description: '',
                  type: TaskType.PATRULHA,
                  priority: TaskPriority.MEDIA,
                  dueDate: '',
                  latitude: '',
                  longitude: '',
                  brigadeId: '',
                  userId: '',
                });
                setShowCreate(false);
                await refresh();
                showFlash('success', 'Tarefa criada');
              } catch (err) {
                const message = err instanceof Error ? err.message : 'Erro ao criar tarefa';
                setCreateError(message);
                showFlash('error', message);
              } finally {
                setCreateLoading(false);
              }
            }}
            className="border rounded-lg p-4 mb-6 bg-gray-50"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <input
                  type="text"
                  value={createData.description}
                  onChange={(e) => setCreateData((s) => ({ ...s, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Ex: Patrulhar área norte da reserva"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  value={createData.type}
                  onChange={(e) => setCreateData((s) => ({ ...s, type: e.target.value as TaskType }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {Object.values(TaskType).map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
                <select
                  value={createData.priority}
                  onChange={(e) => setCreateData((s) => ({ ...s, priority: e.target.value as TaskPriority }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {Object.values(TaskPriority).map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brigada</label>
                <select
                  value={createData.brigadeId}
                  onChange={(e) => setCreateData((s) => ({ ...s, brigadeId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Selecione...</option>
                  {brigades.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Responsável</label>
                <select
                  value={createData.userId}
                  onChange={(e) => setCreateData((s) => ({ ...s, userId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Sem responsável</option>
                  {users
                    .filter((u) => u.role !== UserRole.ADMIN_BRIGADA)
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                        {u.brigadeId ? ` (${brigadeNameById[u.brigadeId] ?? u.brigadeId})` : ''}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vencimento</label>
                <input
                  type="date"
                  value={createData.dueDate}
                  onChange={(e) => setCreateData((s) => ({ ...s, dueDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                <input
                  type="number"
                  value={createData.latitude}
                  onChange={(e) => setCreateData((s) => ({ ...s, latitude: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  step="any"
                  placeholder="-23.5505"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                <input
                  type="number"
                  value={createData.longitude}
                  onChange={(e) => setCreateData((s) => ({ ...s, longitude: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  step="any"
                  placeholder="-46.6333"
                />
              </div>
            </div>

            {createError && <p className="text-sm text-red-600 mt-3">{createError}</p>}

            <div className="mt-4 flex gap-2">
              <button
                type="submit"
                disabled={createLoading}
                className="bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {createLoading ? 'Criando...' : 'Criar'}
              </button>
            </div>
          </form>
        )}

        <div className="space-y-4">
          {filteredTasks.map((task) => (
            <div key={task.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900">{task.description}</h4>
                  <p className="text-sm text-gray-600">{task.type}</p>
                </div>
                <div className="flex space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                    {task.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                <div>
                  <p className="font-medium">Localização:</p>
                  <p>{task.latitude.toFixed(6)}, {task.longitude.toFixed(6)}</p>
                </div>
                <div>
                  <p className="font-medium">Vencimento:</p>
                  <p>{task.dueDate ? new Date(task.dueDate).toLocaleDateString('pt-BR') : '-'}</p>
                </div>
              </div>

              {isManager && (
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                  <div>
                    <p className="font-medium">Brigada:</p>
                    <p>{brigadeNameById[task.brigadeId] ?? task.brigadeId}</p>
                  </div>
                  <div>
                    <p className="font-medium">Responsável:</p>
                    <select
                      value={task.userId ?? ''}
                      onChange={(e) => updateTaskAssignee(task.id, e.target.value)}
                      className="mt-1 w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                    >
                      <option value="">Sem responsável</option>
                      {users
                        .filter((u) => u.role !== UserRole.ADMIN_BRIGADA)
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name}
                            {u.brigadeId ? ` (${brigadeNameById[u.brigadeId] ?? u.brigadeId})` : ''}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              )}

              {isManager && (
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                  <div>
                    <p className="font-medium">Prioridade:</p>
                    <select
                      value={task.priority}
                      onChange={(e) => updateTaskFields(task.id, { priority: e.target.value as TaskPriority })}
                      className="mt-1 w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                    >
                      {Object.values(TaskPriority).map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <p className="font-medium">Vencimento:</p>
                    <input
                      type="date"
                      value={toDateInputValue(task.dueDate)}
                      onChange={(e) => updateTaskFields(task.id, { dueDate: toIsoFromDateInput(e.target.value) })}
                      className="mt-1 w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                    />
                  </div>
                </div>
              )}

              <div className="flex space-x-2">
                {task.status === TaskStatus.PENDENTE && (
                  <button
                    onClick={() => updateTaskStatus(task.id, TaskStatus.EM_ANDAMENTO)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors"
                  >
                    Iniciar Tarefa
                  </button>
                )}
                {task.status === TaskStatus.EM_ANDAMENTO && (
                  <button
                    onClick={() => updateTaskStatus(task.id, TaskStatus.CONCLUIDA)}
                    className="bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700 transition-colors"
                  >
                    Concluir Tarefa
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredTasks.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">Nenhuma tarefa encontrada.</p>
          </div>
        )}
      </div>
    </div>
  );
}
