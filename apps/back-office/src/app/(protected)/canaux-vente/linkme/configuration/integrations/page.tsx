'use client';

import { useState } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import {
  Webhook,
  Key,
  Plus,
  Copy,
  Eye,
  EyeOff,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  RefreshCw,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  lastTriggered: string | null;
  lastStatus: 'success' | 'failed' | null;
}

interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsed: string | null;
  isActive: boolean;
}

// ============================================================================
// Mock Data
// ============================================================================

const MOCK_WEBHOOKS: WebhookConfig[] = [
  {
    id: '1',
    name: 'Nouvelle commande',
    url: 'https://example.com/webhook/orders',
    events: ['order.created', 'order.paid'],
    isActive: true,
    lastTriggered: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    lastStatus: 'success',
  },
  {
    id: '2',
    name: 'Commission versée',
    url: 'https://example.com/webhook/commissions',
    events: ['commission.paid'],
    isActive: false,
    lastTriggered: null,
    lastStatus: null,
  },
];

const MOCK_API_KEYS: ApiKey[] = [
  {
    id: '1',
    name: 'Production API',
    key: 'lm_live_sk_1234567890abcdef',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    lastUsed: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    isActive: true,
  },
  {
    id: '2',
    name: 'Test API',
    key: 'lm_test_sk_abcdef1234567890',
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    lastUsed: null,
    isActive: true,
  },
];

// ============================================================================
// Helpers
// ============================================================================

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Jamais';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function maskApiKey(key: string): string {
  return key.substring(0, 12) + '••••••••••••';
}

// ============================================================================
// Webhook Row
// ============================================================================

interface WebhookRowProps {
  webhook: WebhookConfig;
}

function WebhookRow({ webhook }: WebhookRowProps) {
  return (
    <div className="flex items-center gap-4 py-4 border-b border-gray-100 last:border-0">
      <div
        className={`p-2 rounded-lg ${webhook.isActive ? 'bg-emerald-100' : 'bg-gray-100'}`}
      >
        <Webhook
          className={`h-4 w-4 ${webhook.isActive ? 'text-emerald-600' : 'text-gray-400'}`}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-900">{webhook.name}</h3>
          <span
            className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${
              webhook.isActive
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {webhook.isActive ? 'Actif' : 'Inactif'}
          </span>
        </div>
        <p className="text-xs text-gray-500 truncate mt-0.5">{webhook.url}</p>
        <div className="flex items-center gap-2 mt-1">
          {webhook.events.map(event => (
            <span
              key={event}
              className="px-1.5 py-0.5 text-[10px] bg-gray-100 text-gray-600 rounded"
            >
              {event}
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        {webhook.lastStatus && (
          <div className="flex items-center gap-1">
            {webhook.lastStatus === 'success' ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <XCircle className="h-3.5 w-3.5 text-red-500" />
            )}
            <span className="text-xs text-gray-500">
              {formatDate(webhook.lastTriggered)}
            </span>
          </div>
        )}
        <button
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="Supprimer"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// API Key Row
// ============================================================================

interface ApiKeyRowProps {
  apiKey: ApiKey;
}

function ApiKeyRow({ apiKey }: ApiKeyRowProps) {
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(apiKey.key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error('Erreur copie');
    }
  };

  return (
    <div className="flex items-center gap-4 py-4 border-b border-gray-100 last:border-0">
      <div className="p-2 rounded-lg bg-purple-100">
        <Key className="h-4 w-4 text-purple-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-900">{apiKey.name}</h3>
          <span
            className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${
              apiKey.isActive
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {apiKey.isActive ? 'Active' : 'Révoquée'}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <code className="text-xs text-gray-500 font-mono">
            {showKey ? apiKey.key : maskApiKey(apiKey.key)}
          </code>
          <button
            onClick={() => setShowKey(!showKey)}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showKey ? (
              <EyeOff className="h-3.5 w-3.5" />
            ) : (
              <Eye className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            onClick={() => {
              void handleCopy().catch(error => {
                console.error('[IntegrationsPage] handleCopy failed:', error);
              });
            }}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {copied ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        <div className="text-right">
          <p className="text-xs text-gray-500">Dernière utilisation</p>
          <p className="text-xs text-gray-400">{formatDate(apiKey.lastUsed)}</p>
        </div>
        <button
          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Révoquer"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Main Page
// ============================================================================

export default function IntegrationsPage() {
  const [webhooks] = useState<WebhookConfig[]>(MOCK_WEBHOOKS);
  const [apiKeys] = useState<ApiKey[]>(MOCK_API_KEYS);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Intégrations</h1>
        <p className="text-sm text-gray-500">
          Webhooks et clés API pour intégrer LinkMe à vos systèmes
        </p>
      </div>

      {/* Webhooks */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Webhook className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle>Webhooks</CardTitle>
                <CardDescription>
                  Recevez des notifications en temps réel
                </CardDescription>
              </div>
            </div>
            <ButtonV2 size="sm" variant="outline" disabled>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </ButtonV2>
          </div>
        </CardHeader>
        <CardContent>
          {webhooks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Webhook className="h-12 w-12 text-gray-300 mb-4" />
              <p className="text-gray-500">Aucun webhook configuré</p>
              <p className="text-sm text-gray-400">
                Ajoutez un webhook pour recevoir des notifications
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {webhooks.map(webhook => (
                <WebhookRow key={webhook.id} webhook={webhook} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Keys */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle>Clés API</CardTitle>
                <CardDescription>
                  Authentifiez vos requêtes à l&apos;API LinkMe
                </CardDescription>
              </div>
            </div>
            <ButtonV2 size="sm" variant="outline" disabled>
              <Plus className="h-4 w-4 mr-2" />
              Générer
            </ButtonV2>
          </div>
        </CardHeader>
        <CardContent>
          {apiKeys.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Key className="h-12 w-12 text-gray-300 mb-4" />
              <p className="text-gray-500">Aucune clé API</p>
              <p className="text-sm text-gray-400">
                Générez une clé pour utiliser l&apos;API
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {apiKeys.map(key => (
                <ApiKeyRow key={key.id} apiKey={key} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Events documentation */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>Événements disponibles</CardTitle>
              <CardDescription>
                Liste des événements que vous pouvez écouter
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {[
              { event: 'order.created', desc: 'Nouvelle commande créée' },
              { event: 'order.paid', desc: 'Commande payée' },
              { event: 'commission.calculated', desc: 'Commission calculée' },
              { event: 'commission.paid', desc: 'Commission versée' },
              { event: 'affiliate.registered', desc: 'Nouvel affilié inscrit' },
              { event: 'affiliate.approved', desc: 'Affilié validé' },
            ].map(({ event, desc }) => (
              <div
                key={event}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <RefreshCw className="h-4 w-4 text-gray-400" />
                <div>
                  <code className="text-xs font-mono text-gray-700">
                    {event}
                  </code>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Development notice */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <p className="font-medium">Fonctionnalité en développement</p>
          <p className="text-amber-700 mt-1">
            La gestion des webhooks et des clés API sera disponible dans une
            prochaine version. Les données affichées sont des exemples de
            prévisualisation.
          </p>
        </div>
      </div>
    </div>
  );
}
