'use client';

import React, { useState } from 'react';

import { useRouter } from 'next/navigation';

import { ButtonUnified, Input } from '@verone/ui';
import {
  Webhook,
  Save,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  X,
} from 'lucide-react';

import { useSupabase } from '@/components/providers/supabase-provider';

const AVAILABLE_EVENTS = [
  'ORDER_COMPLETED',
  'ORDER_CANCELLED',
  'ORDER_UPDATED',
  'PAYMENT_RECEIVED',
  'PAYMENT_FAILED',
  'PRODUCT_CREATED',
  'PRODUCT_UPDATED',
  'ORGANISATION_CREATED',
  'USER_REGISTERED',
];

export default function NewWebhookPage() {
  const router = useRouter();
  const supabase = useSupabase();

  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [secret, setSecret] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [active, setActive] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function generateSecret() {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setSecret(secret);
  }

  function toggleEvent(event: string) {
    setSelectedEvents(prev =>
      prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event]
    );
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError(null);

      // Validation
      if (!name.trim()) {
        setError('Le nom est requis');
        return;
      }

      if (!url.trim()) {
        setError("L'URL est requise");
        return;
      }

      if (!secret.trim()) {
        setError('Le secret est requis');
        return;
      }

      try {
        new URL(url);
      } catch {
        setError('URL invalide');
        return;
      }

      const { error: insertError } = await supabase
        .from('webhook_configs')
        .insert({
          name,
          url,
          description: description.trim() || null,
          secret,
          events: selectedEvents,
          active,
        });

      if (insertError) throw insertError;

      router.push('/parametres/webhooks');
    } catch (error) {
      console.error('Error saving webhook:', error);
      setError(
        error instanceof Error ? error.message : 'Erreur lors de la sauvegarde'
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ButtonUnified
              variant="outline"
              size="sm"
              onClick={() => router.push('/parametres/webhooks')}
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </ButtonUnified>
            <Webhook className="h-8 w-8 text-black" />
            <div>
              <h1 className="text-2xl font-bold text-black">Nouveau Webhook</h1>
              <p className="text-gray-600">
                Configurer une nouvelle intégration webhook
              </p>
            </div>
          </div>

          <ButtonUnified
            variant="success"
            onClick={handleSave}
            disabled={saving}
          >
            <Save className="h-4 w-4" />
            {saving ? 'Sauvegarde...' : 'Créer le webhook'}
          </ButtonUnified>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Name */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <label className="text-sm font-medium text-black mb-2 block">
              Nom du webhook *
            </label>
            <Input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Revolut Orders Webhook"
            />
          </div>

          {/* URL */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <label className="text-sm font-medium text-black mb-2 block">
              URL du webhook *
            </label>
            <Input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://exemple.com/api/webhook"
            />
            <p className="text-xs text-gray-500 mt-2">
              L'URL qui recevra les événements POST
            </p>
          </div>

          {/* Description */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <label className="text-sm font-medium text-black mb-2 block">
              Description (optionnelle)
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full min-h-[100px] p-3 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
              placeholder="Description du webhook et de son utilisation..."
            />
          </div>

          {/* Events */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <label className="text-sm font-medium text-black mb-3 block">
              Événements à écouter
            </label>
            <div className="space-y-2">
              {AVAILABLE_EVENTS.map(event => (
                <div
                  key={event}
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
                  onClick={() => toggleEvent(event)}
                >
                  <div
                    className={`h-5 w-5 rounded border-2 flex items-center justify-center ${
                      selectedEvents.includes(event)
                        ? 'bg-black border-black'
                        : 'border-gray-300'
                    }`}
                  >
                    {selectedEvents.includes(event) && (
                      <CheckCircle2 className="h-3 w-3 text-white" />
                    )}
                  </div>
                  <span className="text-sm font-mono text-gray-700">
                    {event}
                  </span>
                </div>
              ))}
            </div>
            {selectedEvents.length === 0 && (
              <p className="text-xs text-amber-600 mt-3">
                Aucun événement sélectionné - le webhook ne recevra aucun appel
              </p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Active status */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <label className="text-sm font-medium text-black mb-3 block">
              Statut
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActive(!active)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 ${
                  active ? 'bg-green-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    active ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="text-sm text-gray-600">
                {active ? 'Actif' : 'Inactif'}
              </span>
            </div>
          </div>

          {/* Secret */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-black">
                Secret partagé *
              </label>
              <ButtonUnified
                variant="outline"
                size="sm"
                onClick={generateSecret}
              >
                Générer
              </ButtonUnified>
            </div>
            <Input
              type="text"
              value={secret}
              onChange={e => setSecret(e.target.value)}
              placeholder="Secret HMAC"
              className="font-mono text-xs"
            />
            <p className="text-xs text-gray-500 mt-2">
              Utilisé pour la validation HMAC des requêtes
            </p>
          </div>

          {/* Selected events summary */}
          {selectedEvents.length > 0 && (
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
              <h3 className="text-sm font-medium text-blue-900 mb-3">
                {selectedEvents.length} événement
                {selectedEvents.length > 1 ? 's' : ''} sélectionné
                {selectedEvents.length > 1 ? 's' : ''}
              </h3>
              <div className="flex flex-wrap gap-1">
                {selectedEvents.map(event => (
                  <span
                    key={event}
                    className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded flex items-center gap-1"
                  >
                    {event}
                    <button
                      onClick={() => toggleEvent(event)}
                      className="hover:text-blue-900"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Info box */}
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-black mb-2">
              À propos des webhooks
            </h3>
            <p className="text-xs text-gray-600">
              Les webhooks sont des callbacks HTTP automatiques envoyés lorsque
              certains événements se produisent dans l'application. Le secret
              partagé est utilisé pour vérifier l'authenticité des requêtes via
              HMAC.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
