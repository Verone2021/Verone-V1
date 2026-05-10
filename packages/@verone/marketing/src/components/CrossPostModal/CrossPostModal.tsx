'use client';

import { useState, useEffect } from 'react';

import { CheckCircle2, Send, X } from 'lucide-react';

import { cn } from '@verone/utils';

import {
  ALL_CROSS_POST_CHANNELS,
  CHANNEL_LIMITS,
  adaptCaptionForChannel,
  type CrossPostChannel,
} from '../../lib/channel-templates';
import { useCreateScheduledPublication } from '../../hooks/use-scheduled-publications';

interface CrossPostModalProps {
  open: boolean;
  onClose: () => void;
  assetId: string;
  initialCaption?: string;
  initialHashtags?: string[];
  onSuccess?: () => void;
}

interface ChannelDraft {
  channel: CrossPostChannel;
  enabled: boolean;
  caption: string;
  scheduledAt: string;
  status: 'idle' | 'sending' | 'done' | 'error';
  errorMessage?: string;
}

function nowPlusOneHourIso(): string {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  // datetime-local format: YYYY-MM-DDTHH:mm
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

export function CrossPostModal({
  open,
  onClose,
  assetId,
  initialCaption = '',
  initialHashtags = [],
  onSuccess,
}: CrossPostModalProps) {
  const [drafts, setDrafts] = useState<ChannelDraft[]>([]);
  const create = useCreateScheduledPublication();

  useEffect(() => {
    if (!open) return;
    const defaultTime = nowPlusOneHourIso();
    setDrafts(
      ALL_CROSS_POST_CHANNELS.map(channel => {
        const adapted = adaptCaptionForChannel(
          initialCaption,
          initialHashtags,
          channel
        );
        return {
          channel,
          enabled: channel === 'instagram' || channel === 'facebook',
          caption: adapted.caption,
          scheduledAt: defaultTime,
          status: 'idle' as const,
        };
      })
    );
  }, [open, initialCaption, initialHashtags]);

  if (!open) return null;

  const enabledCount = drafts.filter(d => d.enabled).length;

  const handleToggle = (channel: CrossPostChannel) => {
    setDrafts(ds =>
      ds.map(d => (d.channel === channel ? { ...d, enabled: !d.enabled } : d))
    );
  };

  const handleCaptionChange = (channel: CrossPostChannel, caption: string) => {
    setDrafts(ds =>
      ds.map(d => (d.channel === channel ? { ...d, caption } : d))
    );
  };

  const handleScheduledAtChange = (
    channel: CrossPostChannel,
    scheduledAt: string
  ) => {
    setDrafts(ds =>
      ds.map(d => (d.channel === channel ? { ...d, scheduledAt } : d))
    );
  };

  const handlePublish = async () => {
    const enabled = drafts.filter(d => d.enabled);
    for (const draft of enabled) {
      setDrafts(ds =>
        ds.map(d =>
          d.channel === draft.channel ? { ...d, status: 'sending' } : d
        )
      );
      try {
        await create.mutateAsync({
          assetId,
          channelCode: draft.channel,
          scheduledAt: new Date(draft.scheduledAt).toISOString(),
          caption: draft.caption,
          hashtags: initialHashtags.length > 0 ? initialHashtags : undefined,
        });
        setDrafts(ds =>
          ds.map(d =>
            d.channel === draft.channel ? { ...d, status: 'done' } : d
          )
        );
      } catch (err) {
        setDrafts(ds =>
          ds.map(d =>
            d.channel === draft.channel
              ? {
                  ...d,
                  status: 'error',
                  errorMessage:
                    err instanceof Error ? err.message : 'Erreur inconnue',
                }
              : d
          )
        );
      }
    }
    if (onSuccess) onSuccess();
  };

  const allDone =
    enabledCount > 0 &&
    drafts.filter(d => d.enabled).every(d => d.status === 'done');

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 md:items-center">
      <div className="w-full max-w-3xl rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Cross-posting multi-canal
            </h2>
            <p className="text-sm text-gray-500">
              {enabledCount} canal/canaux sélectionné(s) sur{' '}
              {ALL_CROSS_POST_CHANNELS.length}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[60vh] space-y-3 overflow-y-auto p-6">
          {drafts.map(draft => {
            const limits = CHANNEL_LIMITS[draft.channel];
            const overLimit = draft.caption.length > limits.maxChars;
            return (
              <div
                key={draft.channel}
                className={cn(
                  'rounded-lg border p-3',
                  draft.enabled
                    ? 'border-gray-300 bg-white'
                    : 'border-gray-100 bg-gray-50 opacity-60'
                )}
              >
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={draft.enabled}
                      onChange={() => handleToggle(draft.channel)}
                      className="h-4 w-4"
                    />
                    <span className="font-medium text-gray-900">
                      {limits.label}
                    </span>
                  </label>
                  <div className="flex items-center gap-3">
                    {draft.status === 'sending' && (
                      <span className="text-xs text-violet-600">Envoi…</span>
                    )}
                    {draft.status === 'done' && (
                      <span className="flex items-center gap-1 text-xs text-emerald-600">
                        <CheckCircle2 className="h-3 w-3" />
                        Programmée
                      </span>
                    )}
                    {draft.status === 'error' && (
                      <span className="text-xs text-red-600">
                        {draft.errorMessage}
                      </span>
                    )}
                    <input
                      type="datetime-local"
                      value={draft.scheduledAt}
                      onChange={e =>
                        handleScheduledAtChange(draft.channel, e.target.value)
                      }
                      disabled={!draft.enabled}
                      className="rounded-md border border-gray-200 px-2 py-1 text-xs"
                    />
                  </div>
                </div>
                {draft.enabled && (
                  <div className="mt-2 space-y-1">
                    <textarea
                      value={draft.caption}
                      onChange={e =>
                        handleCaptionChange(draft.channel, e.target.value)
                      }
                      rows={3}
                      className={cn(
                        'w-full resize-none rounded-md border px-3 py-2 text-sm',
                        overLimit
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-200'
                      )}
                    />
                    <p
                      className={cn(
                        'text-[10px]',
                        overLimit ? 'text-red-600' : 'text-gray-400'
                      )}
                    >
                      {draft.caption.length} / {limits.maxChars} caractères ·{' '}
                      {limits.maxHashtags > 0
                        ? `${limits.maxHashtags} hashtags max`
                        : 'pas de hashtags'}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-gray-200 px-6 py-4">
          <p className="text-xs text-gray-500">
            La publication automatique nécessite l&apos;activation de
            l&apos;Edge Function{' '}
            <code className="text-[10px]">run-scheduled-publications</code>.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm hover:bg-gray-50"
            >
              {allDone ? 'Fermer' : 'Annuler'}
            </button>
            {!allDone && (
              <button
                type="button"
                onClick={() => {
                  void handlePublish().catch(err =>
                    console.error('[CrossPostModal] publish failed:', err)
                  );
                }}
                disabled={enabledCount === 0 || create.isPending}
                className="flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                Programmer sur {enabledCount} canal/canaux
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
