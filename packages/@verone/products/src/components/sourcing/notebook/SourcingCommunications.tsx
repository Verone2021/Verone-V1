'use client';

import { useState } from 'react';
import type { SourcingCommunication } from '../../../hooks/sourcing/use-sourcing-notebook';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { cn } from '@verone/ui';
import {
  MessageCircle,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle,
  Clock,
  X,
} from 'lucide-react';

const CHANNEL_CONFIG = {
  alibaba: { label: 'Alibaba', emoji: '🏭' },
  wechat: { label: 'WeChat', emoji: '💬' },
  whatsapp: { label: 'WhatsApp', emoji: '📱' },
  email: { label: 'Email', emoji: '📧' },
  phone: { label: 'Téléphone', emoji: '📞' },
  salon: { label: 'Salon', emoji: '🏢' },
  other: { label: 'Autre', emoji: '💼' },
} as const;

interface SourcingCommunicationsProps {
  communications: SourcingCommunication[];
  onAdd: (data: {
    channel: string;
    direction: 'inbound' | 'outbound';
    summary: string;
    contact_name?: string;
    next_action?: string;
    follow_up_date?: string;
  }) => Promise<void>;
  onResolve: (id: string) => Promise<void>;
}

export function SourcingCommunications({
  communications,
  onAdd,
  onResolve,
}: SourcingCommunicationsProps) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    channel: 'alibaba',
    direction: 'outbound' as 'inbound' | 'outbound',
    summary: '',
    contact_name: '',
    next_action: '',
    follow_up_date: '',
  });

  const handleSubmit = async () => {
    if (!form.summary.trim()) return;
    setSaving(true);
    try {
      await onAdd({
        channel: form.channel,
        direction: form.direction,
        summary: form.summary.trim(),
        contact_name: form.contact_name.trim() || undefined,
        next_action: form.next_action.trim() || undefined,
        follow_up_date: form.follow_up_date || undefined,
      });
      setForm({
        channel: 'alibaba',
        direction: 'outbound',
        summary: '',
        contact_name: '',
        next_action: '',
        follow_up_date: '',
      });
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  const pendingFollowUps = communications.filter(
    c => c.follow_up_date && !c.is_resolved
  );

  return (
    <Card className="border-gray-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Communications ({communications.length})
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
      <CardContent className="space-y-3">
        {/* Follow-up alerts */}
        {pendingFollowUps.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-2">
            <p className="text-xs font-medium text-yellow-800 mb-1">
              <Clock className="h-3 w-3 inline mr-1" />
              {pendingFollowUps.length} relance(s) en attente
            </p>
            {pendingFollowUps.map(c => (
              <div
                key={c.id}
                className="flex items-center justify-between text-xs text-yellow-700 mt-1"
              >
                <span>
                  {c.next_action} —{' '}
                  {new Date(c.follow_up_date!).toLocaleDateString('fr-FR')}
                </span>
                <button
                  onClick={() => {
                    void onResolve(c.id);
                  }}
                  className="text-green-600 hover:text-green-800"
                >
                  <CheckCircle className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add form */}
        {showForm && (
          <div className="bg-gray-50 border border-gray-200 rounded-md p-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <select
                value={form.channel}
                onChange={e =>
                  setForm(f => ({ ...f, channel: e.target.value }))
                }
                className="text-xs border border-gray-300 rounded px-2 py-1.5"
              >
                {Object.entries(CHANNEL_CONFIG).map(
                  ([key, { label, emoji }]) => (
                    <option key={key} value={key}>
                      {emoji} {label}
                    </option>
                  )
                )}
              </select>
              <select
                value={form.direction}
                onChange={e =>
                  setForm(f => ({
                    ...f,
                    direction: e.target.value as 'inbound' | 'outbound',
                  }))
                }
                className="text-xs border border-gray-300 rounded px-2 py-1.5"
              >
                <option value="outbound">Envoyé</option>
                <option value="inbound">Reçu</option>
              </select>
            </div>
            <input
              type="text"
              placeholder="Nom du contact (optionnel)"
              value={form.contact_name}
              onChange={e =>
                setForm(f => ({ ...f, contact_name: e.target.value }))
              }
              className="w-full text-xs border border-gray-300 rounded px-2 py-1.5"
            />
            <textarea
              placeholder="Résumé de l'échange..."
              value={form.summary}
              onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
              rows={3}
              className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 resize-none"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Prochaine action (optionnel)"
                value={form.next_action}
                onChange={e =>
                  setForm(f => ({ ...f, next_action: e.target.value }))
                }
                className="text-xs border border-gray-300 rounded px-2 py-1.5"
              />
              <input
                type="date"
                value={form.follow_up_date}
                onChange={e =>
                  setForm(f => ({ ...f, follow_up_date: e.target.value }))
                }
                className="text-xs border border-gray-300 rounded px-2 py-1.5"
              />
            </div>
            <ButtonV2
              variant="primary"
              size="sm"
              onClick={() => {
                void handleSubmit();
              }}
              disabled={!form.summary.trim() || saving}
              className="w-full"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </ButtonV2>
          </div>
        )}

        {/* Communications timeline */}
        {communications.length === 0 && !showForm ? (
          <p className="text-xs text-gray-400 text-center py-4">
            Aucune communication enregistrée
          </p>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {communications.map(comm => {
              const config =
                CHANNEL_CONFIG[comm.channel as keyof typeof CHANNEL_CONFIG] ??
                CHANNEL_CONFIG.other;
              return (
                <div
                  key={comm.id}
                  className={cn(
                    'p-2 rounded-md border text-xs',
                    comm.direction === 'outbound'
                      ? 'bg-blue-50 border-blue-200 ml-4'
                      : 'bg-white border-gray-200 mr-4'
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      {comm.direction === 'outbound' ? (
                        <ArrowUpRight className="h-3 w-3 text-blue-500" />
                      ) : (
                        <ArrowDownLeft className="h-3 w-3 text-green-500" />
                      )}
                      <span className="font-medium">
                        {config.emoji} {config.label}
                      </span>
                      {comm.contact_name && (
                        <span className="text-gray-500">
                          — {comm.contact_name}
                        </span>
                      )}
                    </div>
                    <span className="text-gray-400">
                      {new Date(comm.communicated_at).toLocaleDateString(
                        'fr-FR',
                        { day: '2-digit', month: 'short' }
                      )}
                    </span>
                  </div>
                  <p className="text-gray-700 whitespace-pre-line">
                    {comm.summary}
                  </p>
                  {comm.next_action && (
                    <div
                      className={cn(
                        'mt-1 flex items-center gap-1 text-[10px]',
                        comm.is_resolved ? 'text-green-600' : 'text-yellow-600'
                      )}
                    >
                      {comm.is_resolved ? (
                        <CheckCircle className="h-2.5 w-2.5" />
                      ) : (
                        <Clock className="h-2.5 w-2.5" />
                      )}
                      <span>{comm.next_action}</span>
                      {comm.follow_up_date && (
                        <span>
                          —{' '}
                          {new Date(comm.follow_up_date).toLocaleDateString(
                            'fr-FR'
                          )}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
