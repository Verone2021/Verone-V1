'use client';

import React, { useEffect, useState } from 'react';

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

import { useSupabase } from '@/components/providers/supabase-provider';

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

interface WebhookLog {
  id: string;
  webhook_id: string | null;
  event: string;
  status_code: number | null;
  error_message: string | null;
  created_at: string | null;
}

export default function WebhooksPage() {
  const supabase = useSupabase();
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [logs, setLogs] = useState<Record<string, WebhookLog[]>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    void loadWebhooks().catch(error => {
      console.error('[WebhooksPage] loadWebhooks failed:', error);
    });
  }, []);

  async function loadWebhooks() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('webhook_configs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      const webhooks = (data || []).map(item => ({
        ...item,
        events: Array.isArray(item.events) ? item.events : [],
      }));
      setWebhooks(webhooks as WebhookConfig[]);

      // Load recent logs for each webhook
      if (data && data.length > 0) {
        for (const webhook of data) {
          await loadRecentLogs(webhook.id);
        }
      }
    } catch (error) {
      console.error('Error loading webhooks:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadRecentLogs(webhookId: string) {
    try {
      const { data, error } = await supabase
        .from('webhook_logs')
        .select('*')
        .eq('webhook_id', webhookId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setLogs(prev => ({ ...prev, [webhookId]: data || [] }));
    } catch (error) {
      console.error('Error loading logs:', error);
    }
  }

  async function toggleWebhook(id: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from('webhook_configs')
        .update({ active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      await loadWebhooks();
    } catch (error) {
      console.error('Error toggling webhook:', error);
    }
  }

  async function deleteWebhook(id: string) {
    try {
      const { error } = await supabase
        .from('webhook_configs')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setDeleteConfirm(null);
      await loadWebhooks();
    } catch (error) {
      console.error('Error deleting webhook:', error);
    }
  }

  async function testWebhook(webhook: WebhookConfig) {
    try {
      const testPayload = {
        event: 'TEST_EVENT',
        timestamp: new Date().toISOString(),
        data: {
          message: 'This is a test webhook from Verone Back Office',
        },
      };

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': 'test-signature',
        },
        body: JSON.stringify(testPayload),
      });

      // Log the test
      await supabase.from('webhook_logs').insert({
        webhook_id: webhook.id,
        event: 'TEST_EVENT',
        payload: testPayload,
        status_code: response.status,
        response_body: await response.text(),
      });

      alert(`Test envoyé! Status: ${response.status} ${response.statusText}`);
      await loadRecentLogs(webhook.id);
    } catch (error) {
      console.error('Error testing webhook:', error);
      alert('Erreur lors du test du webhook');
    }
  }

  const filteredWebhooks = webhooks.filter(
    webhook =>
      webhook.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      webhook.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page header */}
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

      {/* Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Rechercher un webhook..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Webhooks count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {filteredWebhooks.length} webhook
          {filteredWebhooks.length > 1 ? 's' : ''} configuré
          {filteredWebhooks.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Webhooks list */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-black" />
          <p className="mt-4 text-gray-600">Chargement des webhooks...</p>
        </div>
      ) : filteredWebhooks.length === 0 ? (
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
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredWebhooks.map(webhook => {
            const recentLogs = logs[webhook.id] || [];
            const lastLog = recentLogs[0];
            const successRate =
              recentLogs.length > 0
                ? (recentLogs.filter(
                    log => log.status_code && log.status_code < 400
                  ).length /
                    recentLogs.length) *
                  100
                : 0;

            return (
              <div
                key={webhook.id}
                className="bg-white rounded-lg border border-gray-200 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-black">
                        {webhook.name}
                      </h3>
                      {webhook.active ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-gray-400" />
                      )}
                    </div>

                    {webhook.description && (
                      <p className="text-sm text-gray-600 mb-2">
                        {webhook.description}
                      </p>
                    )}

                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        URL:{' '}
                        <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                          {webhook.url}
                        </code>
                      </p>

                      {webhook.events.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          <span className="text-xs text-gray-500 mr-2">
                            Événements:
                          </span>
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
                            ? new Date(lastLog.created_at).toLocaleString(
                                'fr-FR'
                              )
                            : 'N/A'}
                          {lastLog.status_code && (
                            <span
                              className={`px-2 py-0.5 rounded ${
                                lastLog.status_code < 400
                                  ? 'bg-green-50 text-green-700'
                                  : 'bg-red-50 text-red-700'
                              }`}
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
                            className={`font-medium ${
                              successRate >= 80
                                ? 'text-green-600'
                                : successRate >= 50
                                  ? 'text-yellow-600'
                                  : 'text-red-600'
                            }`}
                          >
                            {successRate.toFixed(0)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <ButtonUnified
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        void testWebhook(webhook).catch(error => {
                          console.error(
                            '[WebhooksPage] testWebhook failed:',
                            error
                          );
                        });
                      }}
                    >
                      <TestTube className="h-4 w-4" />
                      Test
                    </ButtonUnified>

                    <ButtonUnified
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        void toggleWebhook(
                          webhook.id,
                          webhook.active ?? false
                        ).catch(error => {
                          console.error(
                            '[WebhooksPage] toggleWebhook failed:',
                            error
                          );
                        });
                      }}
                    >
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
                        <ButtonUnified
                          variant="danger"
                          size="sm"
                          onClick={() => {
                            void deleteWebhook(webhook.id).catch(error => {
                              console.error(
                                '[WebhooksPage] deleteWebhook failed:',
                                error
                              );
                            });
                          }}
                        >
                          Confirmer
                        </ButtonUnified>
                        <ButtonUnified
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteConfirm(null)}
                        >
                          Annuler
                        </ButtonUnified>
                      </div>
                    ) : (
                      <ButtonUnified
                        variant="danger"
                        size="sm"
                        onClick={() => setDeleteConfirm(webhook.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </ButtonUnified>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
