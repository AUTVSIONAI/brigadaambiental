import type { User } from '@/types/auth';

export interface Brigade {
  id: string;
  name: string;
  description: string;
  region: string;
  parentId?: string;
  leaderId: string;
  members: User[];
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  type: TaskType;
  description: string;
  latitude: number;
  longitude: number;
  brigadeId: string;
  userId?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export enum TaskType {
  PATRULHA = 'PATRULHA',
  MONITORAMENTO = 'MONITORAMENTO',
  COMBATE = 'COMBATE',
  PREVENCAO = 'PREVENCAO',
  RESCATE = 'RESCATE',
  LIMPEZA = 'LIMPEZA'
}

export enum TaskStatus {
  PENDENTE = 'PENDENTE',
  EM_ANDAMENTO = 'EM_ANDAMENTO',
  CONCLUIDA = 'CONCLUIDA',
  CANCELADA = 'CANCELADA'
}

export enum TaskPriority {
  BAIXA = 'BAIXA',
  MEDIA = 'MEDIA',
  ALTA = 'ALTA',
  CRITICA = 'CRITICA'
}

export interface Action {
  id: string;
  taskId: string;
  userId: string;
  type: string;
  description: string;
  photos: string[];
  location: {
    latitude: number;
    longitude: number;
  };
  createdAt: string;
}

export interface LocationPing {
  id: string;
  userId: string;
  brigadeId?: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  createdAt: string;
}
