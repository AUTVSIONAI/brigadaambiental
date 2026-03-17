'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiService } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { Task, TaskStatus } from '@/types/brigada';
import { UserRole } from '@/types/auth';

export function ActionForm() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    taskId: '',
    type: '',
    description: '',
    photos: [] as File[],
    latitude: '',
    longitude: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setTasksLoading(true);
      try {
        const allTasks = await apiService.getTasks();
        const isAdmin = user?.role === UserRole.ADMIN_BRIGADA;
        const isManager = isAdmin || user?.role === UserRole.SUPERVISOR || user?.role === UserRole.COMANDANTE;
        const visible = isManager ? allTasks : allTasks.filter((t) => t.userId === user?.id);
        if (!mounted) return;
        setTasks(visible);
      } catch {
        if (!mounted) return;
        setTasks([]);
      } finally {
        if (!mounted) return;
        setTasksLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [user?.id, user?.role]);

  const selectableTasks = useMemo(() => {
    return tasks.filter((t) => t.status !== TaskStatus.CANCELADA);
  }, [tasks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      const actionData = {
        taskId: formData.taskId,
        type: formData.type,
        description: formData.description,
        photos: formData.photos.map((file) => URL.createObjectURL(file)),
        location: {
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
        },
      };

      await apiService.createAction(actionData);
      
      // Limpar formulário
      setFormData({
        taskId: '',
        type: '',
        description: '',
        photos: [],
        latitude: '',
        longitude: '',
      });
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    } catch (error) {
      console.error('Erro ao registrar ação:', error);
      alert('Erro ao registrar ação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTask = (taskId: string) => {
    const task = selectableTasks.find((t) => t.id === taskId);
    if (!task) {
      setFormData((current) => ({ ...current, taskId }));
      return;
    }

    setFormData((current) => ({
      ...current,
      taskId: task.id,
      type: current.type || task.type,
      latitude: current.latitude || task.latitude.toString(),
      longitude: current.longitude || task.longitude.toString(),
    }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData({
        ...formData,
        photos: Array.from(e.target.files),
      });
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString(),
          });
        },
        (error) => {
          console.error('Erro ao obter localização:', error);
          alert('Não foi possível obter sua localização.');
        }
      );
    } else {
      alert('Geolocalização não é suportada por este navegador.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Registrar Ação</h3>

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-md">
            Ação registrada com sucesso!
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="taskSelect" className="block text-sm font-medium text-gray-700 mb-1">
              Tarefa
            </label>
            {selectableTasks.length > 0 || tasksLoading ? (
              <select
                id="taskSelect"
                value={formData.taskId}
                onChange={(e) => handleSelectTask(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
                disabled={tasksLoading}
              >
                <option value="">{tasksLoading ? 'Carregando tarefas...' : 'Selecione uma tarefa'}</option>
                {selectableTasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.description} ({task.type})
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={formData.taskId}
                onChange={(e) => setFormData({ ...formData, taskId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Digite o ID da tarefa"
                required
              />
            )}
            {formData.taskId && (
              <p className="text-xs text-gray-500 mt-2">
                ID: {formData.taskId}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Ação
            </label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            >
              <option value="">Selecione o tipo</option>
              <option value="PATRULHA">Patrulha</option>
              <option value="MONITORAMENTO">Monitoramento</option>
              <option value="COMBATE">Combate</option>
              <option value="PREVENCAO">Prevenção</option>
              <option value="RESCATE">Resgate</option>
              <option value="LIMPEZA">Limpeza</option>
            </select>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Descrição da Ação
            </label>
            <textarea
              id="description"
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Descreva a ação realizada..."
              required
            />
          </div>

          <div>
            <label htmlFor="photos" className="block text-sm font-medium text-gray-700 mb-1">
              Fotos
            </label>
            <input
              type="file"
              id="photos"
              multiple
              accept="image/*"
              onChange={handlePhotoChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <p className="text-sm text-gray-500 mt-1">
              Você pode selecionar várias fotos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 mb-1">
                Latitude
              </label>
              <input
                type="number"
                step="any"
                id="latitude"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="-23.5505"
                required
              />
            </div>
            <div>
              <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 mb-1">
                Longitude
              </label>
              <input
                type="number"
                step="any"
                id="longitude"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="-46.6333"
                required
              />
            </div>
          </div>

          <button
            type="button"
            onClick={getCurrentLocation}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Obter Localização Atual
          </button>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Registrando...' : 'Registrar Ação'}
          </button>
        </form>
      </div>
    </div>
  );
}
