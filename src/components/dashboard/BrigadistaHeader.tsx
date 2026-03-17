'use client';

import { useEffect, useRef, useState } from 'react';
import { User } from '@/types/auth';
import { useAuth } from '@/hooks/useAuth';
import { apiService } from '@/services/api';

interface BrigadistaHeaderProps {
  user: User;
}

export function BrigadistaHeader({ user }: BrigadistaHeaderProps) {
  const { logout } = useAuth();
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [trackingStatus, setTrackingStatus] = useState<'idle' | 'on' | 'error'>('idle');
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [lastPingAt, setLastPingAt] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastSentRef = useRef<{ at: number; lat: number; lng: number } | null>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('brigada.tracking.enabled');
      if (saved === '1') setTrackingEnabled(true);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem('brigada.tracking.enabled', trackingEnabled ? '1' : '0');
    } catch {}
  }, [trackingEnabled]);

  useEffect(() => {
    if (!trackingEnabled) {
      if (watchIdRef.current !== null && navigator.geolocation) {
        try {
          navigator.geolocation.clearWatch(watchIdRef.current);
        } catch {}
      }
      watchIdRef.current = null;
      lastSentRef.current = null;
      setTrackingStatus('idle');
      setTrackingError(null);
      return;
    }

    if (!navigator.geolocation) {
      setTrackingStatus('error');
      setTrackingError('Geolocalização não é suportada neste navegador.');
      return;
    }

    setTrackingStatus('on');
    setTrackingError(null);

    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const distanceMeters = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
      const R = 6371000;
      const dLat = toRad(b.lat - a.lat);
      const dLng = toRad(b.lng - a.lng);
      const s1 = Math.sin(dLat / 2);
      const s2 = Math.sin(dLng / 2);
      const aa = s1 * s1 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * s2 * s2;
      return 2 * R * Math.asin(Math.min(1, Math.sqrt(aa)));
    };

    const maybeSend = async (pos: GeolocationPosition) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const accuracy = Number.isFinite(pos.coords.accuracy) ? pos.coords.accuracy : undefined;

      const now = Date.now();
      const prev = lastSentRef.current;
      const elapsedOk = !prev || now - prev.at >= 10000;
      const movedOk = !prev || distanceMeters({ lat: prev.lat, lng: prev.lng }, { lat, lng }) >= 20;
      if (!elapsedOk && !movedOk) return;

      lastSentRef.current = { at: now, lat, lng };
      try {
        await apiService.createLocationPing({ latitude: lat, longitude: lng, accuracy });
        setLastPingAt(new Date().toISOString());
        setTrackingStatus('on');
        setTrackingError(null);
      } catch {
        setTrackingStatus('error');
        setTrackingError('Não foi possível enviar a localização.');
      }
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        void maybeSend(pos);
      },
      (err) => {
        setTrackingStatus('error');
        setTrackingError(err.message || 'Não foi possível obter a localização.');
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
    );

    return () => {
      if (watchIdRef.current !== null) {
        try {
          navigator.geolocation.clearWatch(watchIdRef.current);
        } catch {}
      }
      watchIdRef.current = null;
    };
  }, [trackingEnabled]);

  return (
    <header className="bg-white shadow-sm border-b relative z-40">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Painel do Brigadista</h1>
          <p className="text-sm text-gray-600">Bem-vindo, {user.name}</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex flex-col items-end">
            <button
              type="button"
              onClick={() => setTrackingEnabled((v) => !v)}
              className={`px-4 py-2 rounded-md text-sm transition-colors ${
                trackingEnabled ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-900 text-white hover:bg-black'
              }`}
            >
              {trackingEnabled ? 'Rastreamento: ON' : 'Rastreamento: OFF'}
            </button>
            <div className="mt-1 text-xs text-gray-500">
              {trackingStatus === 'on' && lastPingAt ? 'Localização enviada' : trackingStatus === 'on' ? 'Ativo' : ''}
              {trackingStatus === 'error' && trackingError ? trackingError : ''}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 font-medium text-sm">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">{user.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700 transition-colors"
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}
