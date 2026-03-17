'use client';

import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { MapMarker } from '@/types/map';
import { apiService } from '@/services/api';
import { Action, Brigade, LocationPing, Task, TaskStatus } from '@/types/brigada';
import type { User } from '@/types/auth';
import 'leaflet/dist/leaflet.css';

const MapContainer = dynamic(() => import('react-leaflet').then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((m) => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then((m) => m.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then((m) => m.Popup), { ssr: false });

export default function MapaPage() {
  const searchParams = useSearchParams();
  const embed = searchParams.get('embed') === '1';
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [leaflet, setLeaflet] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    const loadLeaflet = async () => {
      const mod = await import('leaflet');
      const L = (mod as any).default ?? mod;
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: '/leaflet/marker-icon-2x.png',
        iconUrl: '/leaflet/marker-icon.png',
        shadowUrl: '/leaflet/marker-shadow.png',
      });
      if (!mounted) return;
      setLeaflet(L);
    };
    loadLeaflet();
    return () => {
      mounted = false;
    };
  }, []);

  const createCustomIcon = useMemo(() => {
    if (!leaflet) return null;
    return (type: 'brigadista' | 'equipe' | 'ocorrencia') => {
      const colors = {
        brigadista: '#10b981',
        equipe: '#3b82f6',
        ocorrencia: '#ef4444',
      };

      return leaflet.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color: ${colors[type]}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });
    };
  }, [leaflet]);

  useEffect(() => {
    let mounted = true;

    const isOpenTask = (task: Task) => task.status !== TaskStatus.CONCLUIDA && task.status !== TaskStatus.CANCELADA;

    const load = async () => {
      setLoading(true);
      try {
        const [brigades, tasks, actions, users, pings] = await Promise.all([
          apiService.getBrigades(),
          apiService.getTasks(),
          apiService.getActions(),
          apiService.getUsers().catch(() => [] as User[]),
          apiService.getLocationPings().catch(() => [] as LocationPing[]),
        ]);

        const userNameById = new Map<string, string>();
        users.forEach((u) => userNameById.set(u.id, u.name));
        brigades.forEach((b) => b.members.forEach((m) => userNameById.set(m.id, m.name)));

        const brigadeNameById = new Map<string, string>();
        brigades.forEach((b) => brigadeNameById.set(b.id, b.name));

        const tasksById = new Map<string, Task>();
        tasks.forEach((t) => tasksById.set(t.id, t));

        const openTasks = tasks.filter(isOpenTask);
        const openTasksByBrigade = new Map<string, Task[]>();
        openTasks.forEach((t) => {
          const list = openTasksByBrigade.get(t.brigadeId) ?? [];
          list.push(t);
          openTasksByBrigade.set(t.brigadeId, list);
        });

        const lastActionByBrigade = new Map<string, Action>();
        actions
          .slice()
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .forEach((a) => {
            const task = tasksById.get(a.taskId);
            if (!task) return;
            if (!lastActionByBrigade.has(task.brigadeId)) lastActionByBrigade.set(task.brigadeId, a);
          });

        const pingByUserId = new Map<string, LocationPing>();
        pings.forEach((p) => pingByUserId.set(p.userId, p));

        const now = Date.now();
        const isFreshPing = (ping: LocationPing) => now - new Date(ping.createdAt).getTime() <= 2 * 60 * 1000;

        const freshPingsByBrigade = new Map<string, LocationPing[]>();
        pings.forEach((ping) => {
          if (!ping.brigadeId) return;
          if (!isFreshPing(ping)) return;
          const list = freshPingsByBrigade.get(ping.brigadeId) ?? [];
          list.push(ping);
          freshPingsByBrigade.set(ping.brigadeId, list);
        });

        const brigadeMarkers: MapMarker[] = brigades
          .map((brigade: Brigade): MapMarker | null => {
            const brigadeTasks = openTasksByBrigade.get(brigade.id) ?? [];
            const inProgress = brigadeTasks.filter((t) => t.status === TaskStatus.EM_ANDAMENTO);
            const status = inProgress.length > 0 ? 'Em operação' : brigadeTasks.length > 0 ? 'Com pendências' : 'Sem missões';

            const members = brigade.members.map((m) => ({ id: m.id, name: m.name, role: m.role }));
            const leaderName =
              userNameById.get(brigade.leaderId) ?? members.find((m) => m.id === brigade.leaderId)?.name ?? '—';

            const leaderPing = pingByUserId.get(brigade.leaderId);
            const brigadeFreshPings = freshPingsByBrigade.get(brigade.id) ?? [];
            const onlineCount = brigadeFreshPings.length;

            const fromLeader =
              leaderPing && isFreshPing(leaderPing) ? { lat: leaderPing.latitude, lng: leaderPing.longitude } : null;

            const fromTeam =
              !fromLeader && brigadeFreshPings.length > 0
                ? {
                    lat: brigadeFreshPings.reduce((s, p) => s + p.latitude, 0) / brigadeFreshPings.length,
                    lng: brigadeFreshPings.reduce((s, p) => s + p.longitude, 0) / brigadeFreshPings.length,
                  }
                : null;

            const lastAction = lastActionByBrigade.get(brigade.id);
            const fallbackTask = brigadeTasks
              .slice()
              .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
              .at(0);
            const fromOps =
              lastAction ? { lat: lastAction.location.latitude, lng: lastAction.location.longitude } : fallbackTask
                ? { lat: fallbackTask.latitude, lng: fallbackTask.longitude }
                : null;

            const position = fromLeader ?? fromTeam ?? fromOps;
            if (!position) return null;

            return {
              id: `brigade-${brigade.id}`,
              type: 'equipe',
              name: brigade.name,
              position,
              details: {
                description: `${onlineCount}/${members.length} online • ${inProgress.length} em andamento • ${brigadeTasks.length} abertas`,
                quantity: members.length,
                status,
                brigadeId: brigade.id,
                leaderName,
                members,
              },
            };
          })
          .filter((m): m is MapMarker => !!m);

        const taskMarkers: MapMarker[] = openTasks.map((task) => {
          const brigadeName = brigadeNameById.get(task.brigadeId) ?? task.brigadeId;
          const name = task.description.length > 42 ? `${task.description.slice(0, 42)}…` : task.description;
          return {
            id: `task-${task.id}`,
            type: 'ocorrencia',
            name,
            position: { lat: task.latitude, lng: task.longitude },
            details: {
              description: `${brigadeName} • ${task.type}`,
              status: task.status,
              priority: task.priority,
              taskId: task.id,
              brigadeId: task.brigadeId,
              userId: task.userId,
            },
          };
        });

        const brigadistaMarkers: MapMarker[] = pings
          .filter((p) => isFreshPing(p))
          .map((p) => {
            const userName = userNameById.get(p.userId) ?? 'Brigadista';
            const brigadeName = p.brigadeId ? brigadeNameById.get(p.brigadeId) ?? p.brigadeId : 'Sem brigada';
            return {
              id: `brigadista-${p.userId}`,
              type: 'brigadista',
              name: userName,
              position: { lat: p.latitude, lng: p.longitude },
              details: {
                description: brigadeName,
                status: 'Online',
                userId: p.userId,
                brigadeId: p.brigadeId,
              },
            };
          });

        const allMarkers = [...brigadeMarkers, ...taskMarkers, ...brigadistaMarkers];

        if (!mounted) return;
        setMarkers(allMarkers);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };

    load();
    const intervalId = window.setInterval(load, 30000);
    return () => {
      mounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  if (loading || !createCustomIcon) {
    return (
      <div className={`${embed ? 'h-[650px]' : 'min-h-screen'} bg-gray-100 flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando mapa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${embed ? 'h-[650px]' : 'min-h-screen'} bg-gray-100`}>
      {!embed && (
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Mapa da Brigada</h1>
                <p className="text-sm text-gray-600">Visualização em tempo real</p>
              </div>
              <div className="flex space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Brigadistas (online)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Brigadas/Equipes</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Tarefas abertas</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1">
        <MapContainer
          center={[-23.5505, -46.6333]}
          zoom={13}
          style={{ height: embed ? '650px' : 'calc(100vh - 120px)', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {markers.map((marker) => (
            <Marker
              key={marker.id}
              position={[marker.position.lat, marker.position.lng]}
              icon={createCustomIcon(marker.type)}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-semibold text-gray-900">{marker.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{marker.details.description}</p>
                  {marker.type === 'equipe' && marker.details.leaderName && (
                    <p className="text-sm text-gray-600 mt-1">Líder: {marker.details.leaderName}</p>
                  )}
                  {marker.details.quantity && (
                    <p className="text-sm text-gray-600">Quantidade: {marker.details.quantity}</p>
                  )}
                  {marker.details.priority && (
                    <p className="text-sm text-gray-600">Prioridade: {marker.details.priority}</p>
                  )}
                  <p className="text-sm text-gray-600">Status: {marker.details.status}</p>
                  {marker.type === 'equipe' && marker.details.members && marker.details.members.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-900">Brigadistas</p>
                      <div className="mt-1 max-h-40 overflow-auto pr-1 space-y-0.5">
                        {marker.details.members.map((m) => (
                          <div key={m.id} className="text-sm text-gray-600">
                            {m.name} • {m.role}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="mt-2 text-xs text-gray-500">
                    Lat: {marker.position.lat.toFixed(4)}, Lng: {marker.position.lng.toFixed(4)}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
