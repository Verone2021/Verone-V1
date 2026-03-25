'use client';

import { useCallback, useEffect, useState } from 'react';

import { useSupabase } from '@/components/providers/supabase-provider';

export interface WebhookConfig {
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

export interface WebhookLog {
  id: string;
  webhook_id: string | null;
  event: string;
  status_code: number | null;
  error_message: string | null;
  created_at: string | null;
}

type SupabaseClient = ReturnType<typeof useSupabase>;

async function fetchLogs(
  supabase: SupabaseClient,
  webhookId: string
): Promise<WebhookLog[]> {
  const { data, error } = await supabase
    .from('webhook_logs')
    .select('id, webhook_id, status_code, created_at')
    .eq('webhook_id', webhookId)
    .order('created_at', { ascending: false })
    .limit(5);
  if (error) throw error;
  return (data ?? []) as WebhookLog[];
}

async function fetchWebhooks(
  supabase: SupabaseClient
): Promise<WebhookConfig[]> {
  const { data, error } = await supabase
    .from('webhook_configs')
    .select(
      'id, name, url, events, secret, active, description, created_at, updated_at'
    )
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(item => ({
    ...item,
    events: Array.isArray(item.events) ? item.events : [],
  })) as WebhookConfig[];
}

async function toggleWebhookStatus(
  supabase: SupabaseClient,
  id: string,
  currentStatus: boolean
) {
  const { error } = await supabase
    .from('webhook_configs')
    .update({ active: !currentStatus })
    .eq('id', id);
  if (error) throw error;
}

async function removeWebhook(supabase: SupabaseClient, id: string) {
  const { error } = await supabase
    .from('webhook_configs')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

async function sendTestWebhook(
  supabase: SupabaseClient,
  webhook: WebhookConfig
) {
  const testPayload = {
    event: 'TEST_EVENT',
    timestamp: new Date().toISOString(),
    data: { message: 'This is a test webhook from Verone Back Office' },
  };
  const response = await fetch(webhook.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Signature': 'test-signature',
    },
    body: JSON.stringify(testPayload),
  });
  await supabase.from('webhook_logs').insert({
    webhook_id: webhook.id,
    event: 'TEST_EVENT',
    payload: testPayload,
    status_code: response.status,
    response_body: await response.text(),
  });
  alert(`Test envoyé! Status: ${response.status} ${response.statusText}`);
}

export function useWebhookManagement() {
  const supabase = useSupabase();
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [logs, setLogs] = useState<Record<string, WebhookLog[]>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const loadRecentLogs = useCallback(
    async (webhookId: string) => {
      try {
        const data = await fetchLogs(supabase, webhookId);
        setLogs(prev => ({ ...prev, [webhookId]: data }));
      } catch (error) {
        console.error('Error loading logs:', error);
      }
    },
    [supabase]
  );

  const loadWebhooks = useCallback(async () => {
    try {
      setLoading(true);
      const items = await fetchWebhooks(supabase);
      setWebhooks(items);
      for (const wh of items) {
        await loadRecentLogs(wh.id);
      }
    } catch (error) {
      console.error('Error loading webhooks:', error);
    } finally {
      setLoading(false);
    }
  }, [loadRecentLogs, supabase]);

  useEffect(() => {
    void loadWebhooks().catch(e => console.error('[WebhooksPage]', e));
  }, [loadWebhooks]);

  return {
    filteredWebhooks: webhooks.filter(
      w =>
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.url.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    logs,
    loading,
    searchQuery,
    setSearchQuery,
    deleteConfirm,
    setDeleteConfirm,
    toggleWebhook: async (id: string, cur: boolean) => {
      try {
        await toggleWebhookStatus(supabase, id, cur);
        await loadWebhooks();
      } catch (e) {
        console.error('toggle:', e);
      }
    },
    deleteWebhook: async (id: string) => {
      try {
        await removeWebhook(supabase, id);
        setDeleteConfirm(null);
        await loadWebhooks();
      } catch (e) {
        console.error('delete:', e);
      }
    },
    testWebhook: async (wh: WebhookConfig) => {
      try {
        await sendTestWebhook(supabase, wh);
        await loadRecentLogs(wh.id);
      } catch (e) {
        console.error('test:', e);
        alert('Erreur');
      }
    },
  };
}
