import type { UserRole } from '@/types/auth';

export interface MapMarkerMember {
  id: string;
  name: string;
  role: UserRole | string;
}

export interface MapMarker {
  id: string;
  type: 'brigadista' | 'equipe' | 'ocorrencia';
  name: string;
  position: {
    lat: number;
    lng: number;
  };
  details: {
    description: string;
    quantity?: number;
    status?: string;
    priority?: string;
    brigadeId?: string;
    taskId?: string;
    userId?: string;
    leaderName?: string;
    members?: MapMarkerMember[];
  };
  icon?: string;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}
