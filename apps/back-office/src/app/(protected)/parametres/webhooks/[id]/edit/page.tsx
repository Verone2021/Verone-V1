'use client';

import React, { useCallback, useEffect, useState } from 'react';

import { useParams, useRouter } from 'next/navigation';

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

interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret: string;
  active: boolean | null;
  description: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export default function EditWebhookPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = useSupabase();
  const webhookId = params.id as string;

  const [webhook, setWebhook] = useState<WebhookConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [secret, setSecret] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [active, setActive] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const loadWebhook = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('webhook_configs')
        .select('*')
        .eq('id', webhookId)
        .single();

      if (error) throw error;

      const webhookData = {
        ...data,
        events: Array.isArray(data.events) ? data.events : [],
      };

      setWebhook(webhookData as WebhookConfig);
      setName(data.name);
      setUrl(data.url);
      setDescription(data.description ?? '');
      setSecret(data.secret);
      setSelectedEvents(Array.isArray(data.events) ? data.events : []);
      setActive(data.active ?? true);
    } catch (error) {
      console.error('Error loading webhook:', error);
      setError('Impossible de charger le webhook');
    } finally {
      setLoading(false);
    }
  }, [webhookId]);

  useEffect(() => {
    void loadWebhook().catch(error => {
      console.error('[WebhookEditPage] loadWebhook failed:', error);
    });
  }, [loadWebhook]);

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
      setSuccess(false);

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

      const { error: updateError } = await supabase
        .from('webhook_configs')
        .update({
          name,
          url,
          description: description.trim() ?? null,
          secret,
          events: selectedEvents,
          active,
        })
        .eq('id', webhookId);

      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

      await loadWebhook();
    } catch (error) {
      console.error('Error saving webhook:', error);
      setError(
        error instanceof Error ? error.message : 'Erreur lors de la sauvegarde'
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-black" />
        <p className="mt-4 text-gray-600">Chargement du webhook...</p>
      </div>
    );
  }

  if (!webhook) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600">Webhook introuvable</p>
        <ButtonUnified
          variant="outline"
          className="mt-4"
          onClick={() => router.push('/parametres/webhooks')}
        >
          Retour à la liste
        </ButtonUnified>
      </div>
    );
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
              <h1 className="text-2xl font-bold text-black">Éditer Webhook</h1>
              <p className="text-gray-600">{webhook.name}</p>
            </div>
          </div>

          <ButtonUnified
            variant="success"
            onClick={() => {
              void handleSave().catch(error => {
                console.error('[WebhookEditPage] handleSave failed:', error);
              });
            }}
            disabled={saving}
          >
            <Save className="h-4 w-4" />
            {saving ? 'Sauvegarde...' : 'Enregistrer'}
          </ButtonUnified>
        </div>
      </div>

      {/* Success message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <p className="text-green-800 font-medium">
            Webhook enregistré avec succès
          </p>
        </div>
      )}

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

          {/* Metadata */}
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-black mb-3">Métadonnées</h3>
            <div className="space-y-2 text-xs text-gray-600">
              <div>
                <span className="font-medium">ID:</span>
                <code className="ml-2 bg-white px-2 py-0.5 rounded">
                  {webhook.id}
                </code>
              </div>
              <div>
                <span className="font-medium">Créé le:</span>
                <span className="ml-2">
                  {webhook.created_at
                    ? new Date(webhook.created_at).toLocaleString('fr-FR')
                    : 'N/A'}
                </span>
              </div>
              <div>
                <span className="font-medium">Modifié le:</span>
                <span className="ml-2">
                  {webhook.updated_at
                    ? new Date(webhook.updated_at).toLocaleString('fr-FR')
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
