'use client';

import React from 'react';

import Link from 'next/link';

import { ButtonUnified, Input } from '@verone/ui';
import {
  Webhook,
  Plus,
  Search,
  Edit,
  Trash2,
  Power,
  Activity,
  CheckCircle2,
  XCircle,
  TestTube,
} from 'lucide-react';

import {
  useWebhookManagement,
  type WebhookConfig,
  type WebhookLog,
} from './use-webhook-management';

// ── Sub-components ────────────────────────────────────────────────

function WebhookCardActions({
  webhook,
  deleteConfirm,
  onTest,
  onToggle,
  onDeleteConfirm,
  onDeleteCancel,
  onDelete,
}: {
  webhook: WebhookConfig;
  deleteConfirm: string | null;
  onTest: () => void;
  onToggle: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-2 ml-4">
      <ButtonUnified variant="outline" size="sm" onClick={onTest}>
        <TestTube className="h-4 w-4" />
        Test
      </ButtonUnified>
      <ButtonUnified variant="outline" size="sm" onClick={onToggle}>
        <Power
          className={`h-4 w-4 ${webhook.active ? 'text-green-600' : 'text-gray-400'}`}
        />
      </ButtonUnified>
      <Link href={`/parametres/webhooks/${webhook.id}/edit`}>
        <ButtonUnified variant="default" size="sm">
          <Edit className="h-4 w-4" />
        </ButtonUnified>
      </Link>
      {deleteConfirm === webhook.id ? (
        <div className="flex gap-1">
          <ButtonUnified variant="danger" size="sm" onClick={onDelete}>
            Confirmer
          </ButtonUnified>
          <ButtonUnified variant="outline" size="sm" onClick={onDeleteCancel}>
            Annuler
          </ButtonUnified>
        </div>
      ) : (
        <ButtonUnified variant="danger" size="sm" onClick={onDeleteConfirm}>
          <Trash2 className="h-4 w-4" />
        </ButtonUnified>
      )}
    </div>
  );
}

function WebhookCardDetails({
  webhook,
  lastLog,
  recentLogs,
  successRate,
}: {
  webhook: WebhookConfig;
  lastLog: WebhookLog | undefined;
  recentLogs: WebhookLog[];
  successRate: number;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-600">
        URL:{' '}
        <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">
          {webhook.url}
        </code>
      </p>
      {webhook.events.length > 0 && (
        <div className="flex flex-wrap gap-1">
          <span className="text-xs text-gray-500 mr-2">Événements:</span>
          {webhook.events.map(event => (
            <span
              key={event}
              className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded"
            >
              {event}
            </span>
          ))}
        </div>
      )}
      {lastLog && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Activity className="h-3 w-3" />
          Dernier appel:{' '}
          {lastLog.created_at
            ? new Date(lastLog.created_at).toLocaleString('fr-FR')
            : 'N/A'}
          {lastLog.status_code && (
            <span
              className={`px-2 py-0.5 rounded ${lastLog.status_code < 400 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}
            >
              {lastLog.status_code}
            </span>
          )}
        </div>
      )}
      {recentLogs.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          Taux de succès (5 derniers):{' '}
          <span
            className={`font-medium ${successRate >= 80 ? 'text-green-600' : successRate >= 50 ? 'text-yellow-600' : 'text-red-600'}`}
          >
            {successRate.toFixed(0)}%
          </span>
        </div>
      )}
    </div>
  );
}

function WebhookCard({
  webhook,
  recentLogs,
  deleteConfirm,
  onTest,
  onToggle,
  onDeleteConfirm,
  onDeleteCancel,
  onDelete,
}: {
  webhook: WebhookConfig;
  recentLogs: WebhookLog[];
  deleteConfirm: string | null;
  onTest: () => void;
  onToggle: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
  onDelete: () => void;
}) {
  const lastLog = recentLogs[0];
  const successRate =
    recentLogs.length > 0
      ? (recentLogs.filter(l => l.status_code && l.status_code < 400).length /
          recentLogs.length) *
        100
      : 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-black">{webhook.name}</h3>
            {webhook.active ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-gray-400" />
            )}
          </div>
          {webhook.description && (
            <p className="text-sm text-gray-600 mb-2">{webhook.description}</p>
          )}
          <WebhookCardDetails
            webhook={webhook}
            lastLog={lastLog}
            recentLogs={recentLogs}
            successRate={successRate}
          />
        </div>
        <WebhookCardActions
          webhook={webhook}
          deleteConfirm={deleteConfirm}
          onTest={onTest}
          onToggle={onToggle}
          onDeleteConfirm={onDeleteConfirm}
          onDeleteCancel={onDeleteCancel}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}

function WebhookListContent({
  filteredWebhooks,
  logs,
  loading,
  searchQuery,
  deleteConfirm,
  setDeleteConfirm,
  toggleWebhook,
  deleteWebhook,
  testWebhook,
}: ReturnType<typeof useWebhookManagement>) {
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-black" />
        <p className="mt-4 text-gray-600">Chargement des webhooks...</p>
      </div>
    );
  }
  if (filteredWebhooks.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <Webhook className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 mb-4">
          {searchQuery ? 'Aucun webhook trouvé' : 'Aucun webhook configuré'}
        </p>
        {!searchQuery && (
          <Link href="/parametres/webhooks/new">
            <ButtonUnified variant="default">
              <Plus className="h-4 w-4" />
              Créer le premier webhook
            </ButtonUnified>
          </Link>
        )}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-4">
      {filteredWebhooks.map(wh => (
        <WebhookCard
          key={wh.id}
          webhook={wh}
          recentLogs={logs[wh.id] ?? []}
          deleteConfirm={deleteConfirm}
          onTest={() => {
            void testWebhook(wh).catch(e => {
              console.error('[WebhooksPage]', e);
            });
          }}
          onToggle={() => {
            void toggleWebhook(wh.id, wh.active ?? false).catch(e => {
              console.error('[WebhooksPage]', e);
            });
          }}
          onDeleteConfirm={() => setDeleteConfirm(wh.id)}
          onDeleteCancel={() => setDeleteConfirm(null)}
          onDelete={() => {
            void deleteWebhook(wh.id).catch(e => {
              console.error('[WebhooksPage]', e);
            });
          }}
        />
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────

export default function WebhooksPage() {
  const mgmt = useWebhookManagement();

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Webhook className="h-8 w-8 text-black" />
            <div>
              <h1 className="text-2xl font-bold text-black">
                Configuration Webhooks
              </h1>
              <p className="text-gray-600">
                Gérer les webhooks et intégrations externes
              </p>
            </div>
          </div>
          <Link href="/parametres/webhooks/new">
            <ButtonUnified variant="default">
              <Plus className="h-4 w-4" />
              Nouveau webhook
            </ButtonUnified>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Rechercher un webhook..."
            value={mgmt.searchQuery}
            onChange={e => mgmt.setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <p className="text-sm text-gray-600">
        {mgmt.filteredWebhooks.length} webhook
        {mgmt.filteredWebhooks.length > 1 ? 's' : ''} configuré
        {mgmt.filteredWebhooks.length > 1 ? 's' : ''}
      </p>

      <WebhookListContent {...mgmt} />
    </div>
  );
}
