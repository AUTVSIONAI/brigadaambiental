'use client';

import { apiService } from '@/services/api';
import { ReportType } from '@/types/brigada';
import { useMemo, useState } from 'react';
import Image from 'next/image';

const reportTypeOptions: Array<{ value: ReportType; label: string }> = [
  { value: ReportType.LIXO, label: 'Lixo irregular' },
  { value: ReportType.INCENDIO, label: 'Incêndio' },
  { value: ReportType.DESMATAMENTO, label: 'Desmatamento' },
  { value: ReportType.CACA, label: 'Caça' },
  { value: ReportType.POLUICAO, label: 'Poluição' },
  { value: ReportType.OUTRO, label: 'Outro' },
];

export function DenunciaForm() {
  const [type, setType] = useState<ReportType>(ReportType.LIXO);
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [reporterName, setReporterName] = useState('');
  const [reporterContact, setReporterContact] = useState('');
  const [loading, setLoading] = useState(false);
  const [flash, setFlash] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const previewUrl = useMemo(() => {
    if (!photo) return null;
    return URL.createObjectURL(photo);
  }, [photo]);

  const fillLocation = async () => {
    setFlash(null);
    if (!('geolocation' in navigator)) {
      setFlash({ type: 'error', message: 'Geolocalização indisponível neste dispositivo.' });
      return;
    }
    setLoading(true);
    await new Promise<void>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(String(pos.coords.latitude));
          setLongitude(String(pos.coords.longitude));
          resolve();
        },
        () => {
          setFlash({ type: 'error', message: 'Não foi possível obter sua localização.' });
          resolve();
        },
        { enableHighAccuracy: true, timeout: 12000 }
      );
    });
    setLoading(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setFlash(null);
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setFlash({ type: 'error', message: 'Informe latitude e longitude (ou clique em “Usar minha localização”).' });
      return;
    }
    if (!photo) {
      setFlash({ type: 'error', message: 'Envie uma foto.' });
      return;
    }
    setLoading(true);
    try {
      await apiService.createReport({
        type,
        description: description.trim(),
        latitude: lat,
        longitude: lng,
        photo,
        reporterName: reporterName.trim() || undefined,
        reporterContact: reporterContact.trim() || undefined,
      });
      setFlash({ type: 'success', message: 'Denúncia enviada para a administração.' });
      setDescription('');
      setPhoto(null);
      setReporterName('');
      setReporterContact('');
    } catch {
      setFlash({ type: 'error', message: 'Erro ao enviar denúncia.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Denúncia</h3>
          <p className="text-sm text-gray-600">Registre uma ocorrência com foto e localização.</p>
        </div>
        <button
          type="button"
          onClick={fillLocation}
          className="bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-black transition-colors disabled:opacity-50"
          disabled={loading}
        >
          Usar minha localização
        </button>
      </div>

      {flash && (
        <div
          className={`mb-4 px-4 py-3 rounded-md border ${
            flash.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {flash.message}
        </div>
      )}

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as ReportType)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {reportTypeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            rows={4}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
            <input
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="-23.55"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
            <input
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="-46.63"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Seu nome (opcional)</label>
            <input
              value={reporterName}
              onChange={(e) => setReporterName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contato (opcional)</label>
            <input
              value={reporterContact}
              onChange={(e) => setReporterContact(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Telefone ou e-mail"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Foto (JPEG/PNG/WEBP)</label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
            className="w-full"
            required
          />
          {previewUrl && (
            <div className="mt-3 border rounded-md overflow-hidden">
              <Image
                src={previewUrl}
                alt="Prévia"
                width={1200}
                height={900}
                className="w-full max-h-[360px] object-contain bg-gray-50"
                unoptimized
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Enviando...' : 'Enviar denúncia'}
          </button>
        </div>
      </form>
    </div>
  );
}
