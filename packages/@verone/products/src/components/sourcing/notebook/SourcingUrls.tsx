'use client';

import { useState } from 'react';
import type { SourcingUrl } from '../../../hooks/sourcing/use-sourcing-notebook';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Globe, Plus, Trash2, ExternalLink, X } from 'lucide-react';

const PLATFORM_CONFIG = {
  alibaba: { label: 'Alibaba', color: 'bg-orange-100 text-orange-700' },
  global_sources: {
    label: 'Global Sources',
    color: 'bg-blue-100 text-blue-700',
  },
  '1688': { label: '1688', color: 'bg-red-100 text-red-700' },
  made_in_china: {
    label: 'Made-in-China',
    color: 'bg-green-100 text-green-700',
  },
  website: { label: 'Site web', color: 'bg-purple-100 text-purple-700' },
  instagram: { label: 'Instagram', color: 'bg-pink-100 text-pink-700' },
  pinterest: { label: 'Pinterest', color: 'bg-red-100 text-red-700' },
  other: { label: 'Autre', color: 'bg-gray-100 text-gray-700' },
} as Record<string, { label: string; color: string }>;

interface SourcingUrlsProps {
  urls: SourcingUrl[];
  onAdd: (data: {
    url: string;
    platform?: string;
    label?: string;
  }) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}

export function SourcingUrls({ urls, onAdd, onRemove }: SourcingUrlsProps) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ url: '', platform: 'alibaba', label: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.url.trim()) return;
    setSaving(true);
    try {
      await onAdd({
        url: form.url.trim(),
        platform: form.platform,
        label: form.label.trim() || undefined,
      });
      setForm({ url: '', platform: 'alibaba', label: '' });
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-gray-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Liens fournisseur ({urls.length})
          </CardTitle>
          <ButtonV2
            variant="outline"
            size="sm"
            icon={showForm ? X : Plus}
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Annuler' : 'Ajouter'}
          </ButtonV2>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {showForm && (
          <div className="bg-gray-50 border border-gray-200 rounded-md p-3 space-y-2">
            <input
              type="url"
              placeholder="https://..."
              value={form.url}
              onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
              className="w-full text-xs border border-gray-300 rounded px-2 py-1.5"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={form.platform}
                onChange={e =>
                  setForm(f => ({ ...f, platform: e.target.value }))
                }
                className="text-xs border border-gray-300 rounded px-2 py-1.5"
              >
                {Object.entries(PLATFORM_CONFIG).map(([key, { label }]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Libellé (optionnel)"
                value={form.label}
                onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                className="text-xs border border-gray-300 rounded px-2 py-1.5"
              />
            </div>
            <ButtonV2
              variant="primary"
              size="sm"
              onClick={() => {
                void handleSubmit();
              }}
              disabled={!form.url.trim() || saving}
              className="w-full"
            >
              {saving ? 'Ajout...' : 'Ajouter le lien'}
            </ButtonV2>
          </div>
        )}

        {urls.length === 0 && !showForm ? (
          <p className="text-xs text-gray-400 text-center py-4">
            Aucun lien fournisseur
          </p>
        ) : (
          urls.map(u => {
            const platform =
              PLATFORM_CONFIG[u.platform ?? 'other'] ?? PLATFORM_CONFIG.other;
            return (
              <div
                key={u.id}
                className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded-md group"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded ${platform.color}`}
                  >
                    {platform.label}
                  </span>
                  <a
                    href={u.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline truncate flex items-center gap-1"
                  >
                    {u.label ?? new URL(u.url).hostname}
                    <ExternalLink className="h-2.5 w-2.5 flex-shrink-0" />
                  </a>
                </div>
                <button
                  onClick={() => {
                    void onRemove(u.id);
                  }}
                  className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
