'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import { User, UserRole } from '@/types/auth';
import { apiService } from '@/services/api';
import { Brigade } from '@/types/brigada';

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [brigades, setBrigades] = useState<Brigade[]>([]);
  const [brigadesLoading, setBrigadesLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [flash, setFlash] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const flashTimerRef = useRef<number | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    role: UserRole;
    brigadeId: string;
    region: string;
  }>({
    name: '',
    email: '',
    role: UserRole.BRIGADISTA,
    brigadeId: '',
    region: '',
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
      setBrigadesLoading(true);
      try {
        const [usersData, brigadesData] = await Promise.all([apiService.getUsers(), apiService.getBrigades()]);
        if (!mounted) return;
        setUsers(usersData);
        setBrigades(brigadesData);
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
        if (!mounted) return;
        setUsers([]);
        setBrigades([]);
      } finally {
        if (!mounted) return;
        setLoading(false);
        setBrigadesLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const brigadeNameById = useMemo(() => {
    const map: Record<string, string> = {};
    brigades.forEach((b) => {
      map[b.id] = b.name;
    });
    return map;
  }, [brigades]);

  const brigadeOptions = useMemo(() => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiService.createUser(formData);
      setFormData({ name: '', email: '', role: UserRole.BRIGADISTA, brigadeId: '', region: '' });
      setShowForm(false);
      const [usersData, brigadesData] = await Promise.all([apiService.getUsers(), apiService.getBrigades()]);
      setUsers(usersData);
      setBrigades(brigadesData);
      showFlash('success', 'Usuário criado');
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      showFlash('error', 'Erro ao criar usuário');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <p className="text-gray-600">Carregando usuários...</p>
      </div>
    );
  }

  return (
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
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Gerenciamento de Brigadistas</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={async () => {
              setLoading(true);
              setBrigadesLoading(true);
              try {
                const [usersData, brigadesData] = await Promise.all([apiService.getUsers(), apiService.getBrigades()]);
                setUsers(usersData);
                setBrigades(brigadesData);
                showFlash('success', 'Dados atualizados');
              } catch (error) {
                console.error('Erro ao atualizar dados:', error);
                showFlash('error', 'Erro ao atualizar dados');
              } finally {
                setLoading(false);
                setBrigadesLoading(false);
              }
            }}
            className="bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-black transition-colors disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Atualizando...' : 'Atualizar'}
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            {showForm ? 'Cancelar' : 'Adicionar Brigadista'}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Função</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="BRIGADISTA">Brigadista</option>
                <option value="SUPERVISOR">Supervisor</option>
                <option value="COMANDANTE">Comandante</option>
                <option value="ADMIN_BRIGADA">Administrador</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brigada</label>
              <select
                value={formData.brigadeId}
                onChange={(e) => setFormData({ ...formData, brigadeId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                disabled={brigadesLoading}
              >
                <option value="">{brigadesLoading ? 'Carregando...' : 'Sem brigada'}</option>
                {brigadeOptions.map((r) => (
                  <option key={r.brigade.id} value={r.brigade.id}>
                    {'—'.repeat(r.depth)} {r.brigade.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Região</label>
              <input
                type="text"
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Região de atuação"
              />
            </div>
          </div>
          <div className="mt-4">
            <button
              type="submit"
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors"
            >
              Salvar Brigadista
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nome
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Função
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Brigada
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Região
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {user.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.role}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.brigadeId ? (brigadeNameById[user.brigadeId] ?? user.brigadeId) : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.region || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Ativo
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
