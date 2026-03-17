import { User, UserRole, LoginCredentials, AuthResponse } from '@/types/auth';
import { Action, Brigade, LocationPing, Task, TaskPriority, TaskStatus, TaskType } from '@/types/brigada';
import { AiConfig, ChatResponse } from '@/types/chat';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
const MOCK_AUTH_ENABLED = process.env.NEXT_PUBLIC_MOCK_AUTH === 'true';
const MOCK_STORAGE_PREFIX = 'brigada_mock_v1_';

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

class ApiService {
  private token: string | null = null;
  private tokenCookieName = 'token';

  private getMockKey(key: string) {
    return `${MOCK_STORAGE_PREFIX}${key}`;
  }

  private loadMock<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    const raw = localStorage.getItem(this.getMockKey(key));
    if (!raw) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  private saveMock<T>(key: string, value: T) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.getMockKey(key), JSON.stringify(value));
  }

  private ensureMockSeed() {
    if (!MOCK_AUTH_ENABLED) return;
    if (typeof window === 'undefined') return;
    const seeded = localStorage.getItem(this.getMockKey('seeded')) === 'true';
    if (seeded) return;

    const now = new Date().toISOString();

    const adminUser: User = {
      id: 'mock-admin-1',
      name: 'Admin Brigada',
      email: 'admin@brigada.local',
      role: UserRole.ADMIN_BRIGADA,
      createdAt: now,
      updatedAt: now,
    };

    const brigadistaUser: User = {
      id: 'mock-brigadista-1',
      name: 'Brigadista Demo',
      email: 'brigadista@brigada.local',
      role: UserRole.BRIGADISTA,
      brigadeId: 'mock-brigade-1',
      region: 'São Paulo (SP)',
      createdAt: now,
      updatedAt: now,
    };

    const users: User[] = [adminUser, brigadistaUser];

    const brigades: Brigade[] = [
      {
        id: 'mock-brigade-1',
        name: 'Brigada Serra do Mar',
        description: 'Equipe dedicada ao monitoramento e resposta rápida em áreas de risco.',
        region: 'São Paulo (SP)',
        leaderId: adminUser.id,
        members: [brigadistaUser],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'mock-brigade-2',
        name: 'Brigada Mata Atlântica',
        description: 'Ações preventivas, patrulha e educação ambiental em trilhas e parques.',
        region: 'Litoral (SP)',
        leaderId: adminUser.id,
        members: [],
        createdAt: now,
        updatedAt: now,
      },
    ];

    const tasks: Task[] = [
      {
        id: 'mock-task-1',
        type: TaskType.PATRULHA,
        description: 'Patrulhar área norte da reserva',
        latitude: -23.5505,
        longitude: -46.6333,
        brigadeId: brigades[0].id,
        userId: brigadistaUser.id,
        status: TaskStatus.PENDENTE,
        priority: TaskPriority.ALTA,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'mock-task-2',
        type: TaskType.MONITORAMENTO,
        description: 'Monitorar pontos de risco na serra',
        latitude: -23.5605,
        longitude: -46.6433,
        brigadeId: brigades[0].id,
        userId: brigadistaUser.id,
        status: TaskStatus.EM_ANDAMENTO,
        priority: TaskPriority.MEDIA,
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'mock-task-3',
        type: TaskType.PREVENCAO,
        description: 'Vistoria de aceiros e faixas de contenção',
        latitude: -23.5522,
        longitude: -46.6351,
        brigadeId: brigades[1].id,
        status: TaskStatus.PENDENTE,
        priority: TaskPriority.BAIXA,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: now,
        updatedAt: now,
      },
    ];

    const actions: Action[] = [
      {
        id: 'mock-action-1',
        taskId: tasks[1].id,
        userId: brigadistaUser.id,
        type: TaskType.MONITORAMENTO,
        description: 'Monitoramento realizado, nenhum foco de incêndio identificado.',
        photos: [],
        location: { latitude: tasks[1].latitude, longitude: tasks[1].longitude },
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'mock-action-2',
        taskId: tasks[0].id,
        userId: brigadistaUser.id,
        type: TaskType.PATRULHA,
        description: 'Patrulha iniciada; trilha principal liberada.',
        photos: [],
        location: { latitude: tasks[0].latitude, longitude: tasks[0].longitude },
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      },
    ];

    this.saveMock('users', users);
    this.saveMock('brigades', brigades);
    this.saveMock('tasks', tasks);
    this.saveMock('actions', actions);
    localStorage.setItem(this.getMockKey('seeded'), 'true');
  }

  setToken(token: string) {
    this.token = token;
    if (!MOCK_AUTH_ENABLED) return;
    if (typeof window === 'undefined') return;
    localStorage.setItem('token', token);
    document.cookie = `${this.tokenCookieName}=${encodeURIComponent(token)}; path=/; samesite=lax`;
  }

  private getTokenFromCookie(): string | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith(`${this.tokenCookieName}=`));
    if (!match) return null;
    const raw = match.slice(this.tokenCookieName.length + 1);
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }

  getToken(): string | null {
    if (!MOCK_AUTH_ENABLED) return this.token;
    if (!this.token) {
      if (typeof window === 'undefined') return null;
      this.token = localStorage.getItem('token') ?? this.getTokenFromCookie();
    }
    return this.token;
  }

  removeToken() {
    this.token = null;
    if (!MOCK_AUTH_ENABLED) return;
    if (typeof window === 'undefined') return;
    localStorage.removeItem('token');
    document.cookie = `${this.tokenCookieName}=; path=/; max-age=0; samesite=lax`;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = this.getToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      let errorBody: unknown = null;
      try {
        const contentType = response.headers.get('content-type') ?? '';
        if (contentType.includes('application/json')) {
          errorBody = await response.json();
        } else {
          errorBody = await response.text();
        }
      } catch {
        errorBody = null;
      }

      if (response.status === 401 && endpoint !== '/auth/login') {
        await this.logout();
        if (typeof window !== 'undefined') {
          const isProtectedPath = window.location.pathname.startsWith('/dashboard');
          const isAlreadyOnLogin = window.location.pathname === '/auth/login';
          if (isProtectedPath && !isAlreadyOnLogin) {
            window.location.href = '/auth/login';
          }
        }
      }
      throw new ApiError(response.status, `API Error: ${response.statusText}`, errorBody);
    }

    return response.json();
  }

  // Auth endpoints
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    if (MOCK_AUTH_ENABLED) {
      const adminEmail = 'admin@brigada.local';
      const brigadistaEmail = 'brigadista@brigada.local';
      const password = '123456';

      const now = new Date().toISOString();

      const adminUser: User = {
        id: 'mock-admin-1',
        name: 'Admin Brigada',
        email: adminEmail,
        role: UserRole.ADMIN_BRIGADA,
        createdAt: now,
        updatedAt: now,
      };

      const brigadistaUser: User = {
        id: 'mock-brigadista-1',
        name: 'Brigadista Demo',
        email: brigadistaEmail,
        role: UserRole.BRIGADISTA,
        createdAt: now,
        updatedAt: now,
      };

      const isAdmin = credentials.email === adminEmail && credentials.password === password;
      const isBrigadista = credentials.email === brigadistaEmail && credentials.password === password;

      if (!isAdmin && !isBrigadista) {
        throw new Error('Invalid credentials');
      }

      const user = isAdmin ? adminUser : brigadistaUser;
      const token = `mock.${user.role}.${user.id}`;

      this.setToken(token);

      return {
        user,
        token,
        refreshToken: 'mock-refresh',
      };
    }

    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async getCurrentUser(): Promise<User> {
    if (MOCK_AUTH_ENABLED) {
      this.ensureMockSeed();
      const token = this.getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const users = this.loadMock<User[]>('users', []);
      if (token.includes('.ADMIN_BRIGADA.')) {
        return users.find((u) => u.role === UserRole.ADMIN_BRIGADA) ?? users[0];
      }
      return users.find((u) => u.role === UserRole.BRIGADISTA) ?? users[0];
    }

    return this.request<User>('/auth/me');
  }

  async logout() {
    if (!MOCK_AUTH_ENABLED) {
      try {
        await fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST', credentials: 'include' });
      } catch {}
    }
    this.removeToken();
  }

  // Users endpoints
  async getUsers(): Promise<User[]> {
    if (MOCK_AUTH_ENABLED) {
      this.ensureMockSeed();
      return this.loadMock<User[]>('users', []);
    }

    return this.request<User[]>('/users');
  }

  async getUser(id: string): Promise<User> {
    if (MOCK_AUTH_ENABLED) {
      this.ensureMockSeed();
      const users = this.loadMock<User[]>('users', []);
      const user = users.find((u) => u.id === id);
      if (!user) throw new Error('User not found');
      return user;
    }
    return this.request<User>(`/users/${id}`);
  }

  async createUser(userData: Partial<User>): Promise<User> {
    if (MOCK_AUTH_ENABLED) {
      this.ensureMockSeed();
      const users = this.loadMock<User[]>('users', []);
      const brigades = this.loadMock<Brigade[]>('brigades', []);
      const now = new Date().toISOString();
      const newUser: User = {
        id: `mock-user-${Date.now()}`,
        name: userData.name ?? 'Novo Usuário',
        email: userData.email ?? `user${Date.now()}@brigada.local`,
        role: (userData.role as UserRole) ?? UserRole.BRIGADISTA,
        brigadeId: userData.brigadeId,
        region: userData.region,
        createdAt: now,
        updatedAt: now,
      };
      users.unshift(newUser);
      this.saveMock('users', users);

      if (newUser.brigadeId) {
        const updatedBrigades = brigades.map((brigade) => {
          if (brigade.id !== newUser.brigadeId) return brigade;
          const exists = brigade.members.some((m) => m.id === newUser.id);
          if (exists) return brigade;
          return { ...brigade, members: [...brigade.members, newUser], updatedAt: new Date().toISOString() };
        });
        this.saveMock('brigades', updatedBrigades);
      }

      return newUser;
    }
    return this.request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    if (MOCK_AUTH_ENABLED) {
      this.ensureMockSeed();
      const users = this.loadMock<User[]>('users', []);
      const brigades = this.loadMock<Brigade[]>('brigades', []);
      const index = users.findIndex((u) => u.id === id);
      if (index === -1) throw new Error('User not found');
      const previous = users[index];
      const updated: User = {
        ...users[index],
        ...userData,
        role: (userData.role as UserRole) ?? users[index].role,
        updatedAt: new Date().toISOString(),
      };
      users[index] = updated;
      this.saveMock('users', users);

      const updatedBrigades = brigades.map((brigade) => {
        const without = brigade.members.filter((m) => m.id !== updated.id);
        const shouldInclude = brigade.id === updated.brigadeId;
        const members = shouldInclude ? [...without, updated] : without;
        const changed = members.length !== brigade.members.length || previous.brigadeId !== updated.brigadeId;
        if (!changed) return brigade;
        return { ...brigade, members, updatedAt: new Date().toISOString() };
      });
      this.saveMock('brigades', updatedBrigades);

      return updated;
    }
    return this.request<User>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(userData),
    });
  }

  // Brigades endpoints
  async getBrigades(): Promise<Brigade[]> {
    if (MOCK_AUTH_ENABLED) {
      this.ensureMockSeed();
      return this.loadMock<Brigade[]>('brigades', []);
    }
    return this.request<Brigade[]>('/brigades');
  }

  async getBrigade(id: string): Promise<Brigade> {
    if (MOCK_AUTH_ENABLED) {
      this.ensureMockSeed();
      const brigades = this.loadMock<Brigade[]>('brigades', []);
      const brigade = brigades.find((b) => b.id === id);
      if (!brigade) throw new Error('Brigade not found');
      return brigade;
    }
    return this.request<Brigade>(`/brigades/${id}`);
  }

  async createBrigade(
    brigadeData: Pick<Brigade, 'name' | 'description' | 'region' | 'leaderId'> & { parentId?: string | null }
  ): Promise<Brigade> {
    if (MOCK_AUTH_ENABLED) {
      this.ensureMockSeed();
      const brigades = this.loadMock<Brigade[]>('brigades', []);
      const now = new Date().toISOString();

      const parentId = brigadeData.parentId ?? undefined;
      if (parentId) {
        const exists = brigades.some((b) => b.id === parentId);
        if (!exists) throw new Error('Parent brigade not found');
      }

      const created: Brigade = {
        id: `mock-brigade-${Date.now()}`,
        name: brigadeData.name,
        description: brigadeData.description,
        region: brigadeData.region,
        parentId: parentId || undefined,
        leaderId: brigadeData.leaderId,
        members: [],
        createdAt: now,
        updatedAt: now,
      };
      brigades.unshift(created);
      this.saveMock('brigades', brigades);
      return created;
    }
    return this.request<Brigade>('/brigades', {
      method: 'POST',
      body: JSON.stringify(brigadeData),
    });
  }

  async updateBrigade(
    id: string,
    brigadeData: Partial<Pick<Brigade, 'name' | 'description' | 'region' | 'leaderId'>> & {
      parentId?: string | null;
    }
  ): Promise<Brigade> {
    if (MOCK_AUTH_ENABLED) {
      this.ensureMockSeed();
      const brigades = this.loadMock<Brigade[]>('brigades', []);
      const index = brigades.findIndex((b) => b.id === id);
      if (index === -1) throw new Error('Brigade not found');

      const nextParentId =
        brigadeData.parentId === undefined ? brigades[index].parentId : brigadeData.parentId ?? undefined;
      if (nextParentId && nextParentId === id) throw new Error('Brigade cannot be its own parent');
      if (nextParentId) {
        const exists = brigades.some((b) => b.id === nextParentId);
        if (!exists) throw new Error('Parent brigade not found');
      }

      const updated: Brigade = {
        ...brigades[index],
        ...brigadeData,
        parentId: nextParentId || undefined,
        updatedAt: new Date().toISOString(),
      };
      brigades[index] = updated;
      this.saveMock('brigades', brigades);
      return updated;
    }
    return this.request<Brigade>(`/brigades/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(brigadeData),
    });
  }

  async deleteBrigade(id: string): Promise<{ ok: true }> {
    if (MOCK_AUTH_ENABLED) {
      this.ensureMockSeed();
      const brigades = this.loadMock<Brigade[]>('brigades', []);
      const brigade = brigades.find((b) => b.id === id);
      if (!brigade) throw new Error('Brigade not found');
      const hasChildren = brigades.some((b) => b.parentId === id);
      if (hasChildren) throw new Error('Brigade has children');
      if (brigade.members.length > 0) throw new Error('Brigade has members');
      const next = brigades.filter((b) => b.id !== id);
      this.saveMock('brigades', next);
      return { ok: true };
    }
    return this.request<{ ok: true }>(`/brigades/${id}`, { method: 'DELETE' });
  }

  // Tasks endpoints
  async getTasks(): Promise<Task[]> {
    if (MOCK_AUTH_ENABLED) {
      this.ensureMockSeed();
      return this.loadMock<Task[]>('tasks', []);
    }
    return this.request<Task[]>('/brigades/tasks');
  }

  async createTask(
    taskData: Pick<Task, 'type' | 'description' | 'latitude' | 'longitude' | 'brigadeId' | 'priority'> &
      Partial<Pick<Task, 'dueDate' | 'userId' | 'status'>>
  ): Promise<Task> {
    if (MOCK_AUTH_ENABLED) {
      this.ensureMockSeed();
      const tasks = this.loadMock<Task[]>('tasks', []);
      const now = new Date().toISOString();

      if (!taskData.type) throw new Error('Task type is required');
      if (!taskData.description) throw new Error('Task description is required');
      if (typeof taskData.latitude !== 'number' || Number.isNaN(taskData.latitude)) {
        throw new Error('Task latitude is required');
      }
      if (typeof taskData.longitude !== 'number' || Number.isNaN(taskData.longitude)) {
        throw new Error('Task longitude is required');
      }
      if (!taskData.brigadeId) throw new Error('Task brigadeId is required');
      if (!taskData.priority) throw new Error('Task priority is required');

      const created: Task = {
        id: `mock-task-${Date.now()}`,
        type: taskData.type,
        description: taskData.description,
        latitude: taskData.latitude,
        longitude: taskData.longitude,
        brigadeId: taskData.brigadeId,
        userId: taskData.userId || undefined,
        status: taskData.status ?? TaskStatus.PENDENTE,
        priority: taskData.priority,
        dueDate: taskData.dueDate,
        createdAt: now,
        updatedAt: now,
      };

      tasks.unshift(created);
      this.saveMock('tasks', tasks);
      return created;
    }
    return this.request<Task>('/brigades/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  }

  async updateTaskStatus(taskId: string, status: TaskStatus): Promise<Task> {
    if (MOCK_AUTH_ENABLED) {
      this.ensureMockSeed();
      const tasks = this.loadMock<Task[]>('tasks', []);
      const index = tasks.findIndex((t) => t.id === taskId);
      if (index === -1) throw new Error('Task not found');
      const updated: Task = { ...tasks[index], status, updatedAt: new Date().toISOString() };
      tasks[index] = updated;
      this.saveMock('tasks', tasks);
      return updated;
    }
    return this.request<Task>(`/brigades/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async updateTask(taskId: string, taskData: Partial<Omit<Task, 'id' | 'createdAt'>>): Promise<Task> {
    if (MOCK_AUTH_ENABLED) {
      this.ensureMockSeed();
      const tasks = this.loadMock<Task[]>('tasks', []);
      const index = tasks.findIndex((t) => t.id === taskId);
      if (index === -1) throw new Error('Task not found');

      const previous = tasks[index];
      const nextStatus = taskData.status ?? previous.status;
      const completedAt =
        nextStatus === TaskStatus.CONCLUIDA
          ? previous.completedAt ?? new Date().toISOString()
          : taskData.completedAt ?? undefined;

      const updated: Task = {
        ...previous,
        ...taskData,
        id: previous.id,
        createdAt: previous.createdAt,
        completedAt,
        updatedAt: new Date().toISOString(),
      };

      tasks[index] = updated;
      this.saveMock('tasks', tasks);
      return updated;
    }
    return this.request<Task>(`/brigades/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(taskData),
    });
  }

  // Actions endpoints
  async getActions(): Promise<Action[]> {
    if (MOCK_AUTH_ENABLED) {
      this.ensureMockSeed();
      const actions = this.loadMock<Action[]>('actions', []);
      return actions.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    return this.request<Action[]>('/brigades/actions');
  }

  async createAction(actionData: Omit<Action, 'id' | 'userId' | 'createdAt'>): Promise<Action> {
    if (MOCK_AUTH_ENABLED) {
      this.ensureMockSeed();
      const user = await this.getCurrentUser();
      const actions = this.loadMock<Action[]>('actions', []);
      const created: Action = {
        id: `mock-action-${Date.now()}`,
        userId: user.id,
        createdAt: new Date().toISOString(),
        ...actionData,
      };
      actions.unshift(created);
      this.saveMock('actions', actions);
      return created;
    }
    return this.request<Action>('/brigades/actions', {
      method: 'POST',
      body: JSON.stringify(actionData),
    });
  }

  // Locations endpoints
  async getLocationPings(params?: { since?: string }): Promise<LocationPing[]> {
    if (MOCK_AUTH_ENABLED) {
      this.ensureMockSeed();
      const pings = this.loadMock<LocationPing[]>('locationPings', []);
      const filtered = params?.since ? pings.filter((p) => p.createdAt >= params.since!) : pings;
      const byUser = new Map<string, LocationPing>();
      filtered
        .slice()
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .forEach((p) => {
          if (!byUser.has(p.userId)) byUser.set(p.userId, p);
        });
      return Array.from(byUser.values());
    }
    const qs = params?.since ? `?since=${encodeURIComponent(params.since)}` : '';
    return this.request<LocationPing[]>(`/locations${qs}`);
  }

  async createLocationPing(ping: Pick<LocationPing, 'latitude' | 'longitude'> & Partial<Pick<LocationPing, 'accuracy'>>): Promise<LocationPing> {
    if (MOCK_AUTH_ENABLED) {
      this.ensureMockSeed();
      const user = await this.getCurrentUser();
      const brigades = this.loadMock<Brigade[]>('brigades', []);
      const brigadeId = brigades.find((b) => b.members.some((m) => m.id === user.id))?.id;
      const pings = this.loadMock<LocationPing[]>('locationPings', []);
      const created: LocationPing = {
        id: `mock-ping-${Date.now()}`,
        userId: user.id,
        brigadeId,
        latitude: ping.latitude,
        longitude: ping.longitude,
        accuracy: ping.accuracy,
        createdAt: new Date().toISOString(),
      };
      pings.unshift(created);
      this.saveMock('locationPings', pings);
      return created;
    }
    return this.request<LocationPing>('/locations', {
      method: 'POST',
      body: JSON.stringify(ping),
    });
  }

  // AI endpoints
  async sendChatMessage(message: string, context?: any): Promise<ChatResponse> {
    return this.request<ChatResponse>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, context }),
    });
  }

  async getAiConfig(): Promise<AiConfig> {
    return this.request<AiConfig>('/ai/config');
  }

  async updateAiConfig(patch: Partial<Pick<AiConfig, 'systemPrompt' | 'model' | 'temperature'>>): Promise<AiConfig> {
    return this.request<AiConfig>('/ai/config', {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
  }
}

export const apiService = new ApiService();
