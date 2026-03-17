export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  brigadeId?: string;
  region?: string;
  createdAt: string;
  updatedAt: string;
}

export enum UserRole {
  ADMIN_BRIGADA = 'ADMIN_BRIGADA',
  COMANDANTE = 'COMANDANTE',
  SUPERVISOR = 'SUPERVISOR',
  BRIGADISTA = 'BRIGADISTA'
}

export function isAdminRole(role: UserRole) {
  return role === UserRole.ADMIN_BRIGADA;
}

export function isManagerRole(role: UserRole) {
  return role === UserRole.ADMIN_BRIGADA || role === UserRole.COMANDANTE || role === UserRole.SUPERVISOR;
}

export function dashboardPathForRole(role: UserRole) {
  return isManagerRole(role) ? '/dashboard/admin' : '/dashboard/brigadista';
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}
