'use client';

import { useMemo, useState } from 'react';

import Image from 'next/image';

import { Calendar, Clock, Trash2, X } from 'lucide-react';

import {
  useScheduledPublications,
  useCancelScheduledPublication,
  type ScheduledPublicationRow,
  type ScheduledPublicationStatus,
} from '@verone/marketing';
import { cn } from '@verone/utils';

const STATUS_BADGES: Record<
  ScheduledPublicationStatus,
  { label: string; className: string }
> = {
  pending: { label: 'Programmée', className: 'bg-blue-100 text-blue-800' },
  publishing: {
    label: 'Publication en cours',
    className: 'bg-violet-100 text-violet-800',
  },
  published: { label: 'Publiée', className: 'bg-emerald-100 text-emerald-800' },
  failed: { label: 'Échec', className: 'bg-red-100 text-red-800' },
  cancelled: { label: 'Annulée', className: 'bg-gray-100 text-gray-600' },
};

const CHANNEL_LABELS: Record<string, string> = {
  meta: 'Meta',
  instagram: 'Instagram',
  facebook: 'Facebook',
  pinterest: 'Pinterest',
  tiktok: 'TikTok',
  linkedin: 'LinkedIn',
  site_internet: 'Site Internet',
  newsletter: 'Newsletter',
};

function isoDateTime(d: Date): string {
  return d.toISOString();
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface PublicationRowProps {
  pub: ScheduledPublicationRow;
  onCancel: (id: string) => void;
}

function PublicationRow({ pub, onCancel }: PublicationRowProps) {
  const badge = STATUS_BADGES[pub.status];
  const channelLabel = CHANNEL_LABELS[pub.channel_code] ?? pub.channel_code;

  return (
    <div className="flex items-start gap-4 rounded-lg border border-gray-200 bg-white p-3">
      <Image
        src={pub.asset_public_url}
        alt={pub.asset_alt_text ?? pub.asset_filename}
        width={64}
        height={64}
        className="h-16 w-16 shrink-0 rounded object-cover"
      />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
              badge.className
            )}
          >
            {badge.label}
          </span>
          <span className="text-xs text-gray-500">{channelLabel}</span>
        </div>
        <p className="flex items-center gap-1 text-xs text-gray-600">
          <Clock className="h-3 w-3" />
          {formatDateTime(pub.scheduled_at)}
        </p>
        {pub.caption && (
          <p className="line-clamp-2 text-xs text-gray-700">{pub.caption}</p>
        )}
        {pub.error_message && (
          <p className="text-xs text-red-600">Erreur : {pub.error_message}</p>
        )}
      </div>
      {pub.status === 'pending' && (
        <button
          type="button"
          onClick={() => onCancel(pub.id)}
          className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
          aria-label="Annuler"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export default function MarketingCalendarPage() {
  const [view, setView] = useState<'upcoming' | 'all'>('upcoming');

  const range = useMemo(() => {
    const now = new Date();
    if (view === 'upcoming') {
      const inOneMonth = new Date(now);
      inOneMonth.setMonth(now.getMonth() + 1);
      return {
        startDate: isoDateTime(now),
        endDate: isoDateTime(inOneMonth),
      };
    }
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(now.getMonth() - 1);
    const oneMonthAhead = new Date(now);
    oneMonthAhead.setMonth(now.getMonth() + 1);
    return {
      startDate: isoDateTime(oneMonthAgo),
      endDate: isoDateTime(oneMonthAhead),
    };
  }, [view]);

  const { data, isLoading } = useScheduledPublications(range);
  const cancel = useCancelScheduledPublication();

  const handleCancel = (id: string) => {
    cancel.mutate(id, {
      onError: err => alert(`Erreur : ${err.message}`),
    });
  };

  const groups = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, ScheduledPublicationRow[]>();
    for (const pub of data) {
      const day = pub.scheduled_at.slice(0, 10);
      const list = map.get(day) ?? [];
      list.push(pub);
      map.set(day, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [data]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Calendrier de publication
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Programmation des publications à venir sur tous les canaux.
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-md border border-gray-200 bg-white p-1">
          <button
            type="button"
            onClick={() => setView('upcoming')}
            className={cn(
              'rounded px-3 py-1 text-xs font-medium',
              view === 'upcoming'
                ? 'bg-gray-900 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            )}
          >
            À venir (30j)
          </button>
          <button
            type="button"
            onClick={() => setView('all')}
            className={cn(
              'rounded px-3 py-1 text-xs font-medium',
              view === 'all'
                ? 'bg-gray-900 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            )}
          >
            Tout (±30j)
          </button>
        </div>
      </div>

      {isLoading ? (
        <p className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-400">
          Chargement…
        </p>
      ) : groups.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
          <Calendar className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-3 text-sm font-medium text-gray-900">
            Aucune publication programmée
          </h3>
          <p className="mt-2 text-xs text-gray-500">
            Programme une publication depuis la bibliothèque images via le
            bouton « Publier ».
          </p>
          <p className="mt-2 text-xs text-gray-400">
            Note : la publication automatique nécessite l&apos;Edge Function{' '}
            <code className="mx-1 rounded bg-gray-100 px-1 py-0.5 text-[10px]">
              run-scheduled-publications
            </code>{' '}
            (squelette en place, logique par canal à finaliser).
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(([day, pubs]) => (
            <div key={day}>
              <h3 className="mb-2 text-sm font-semibold text-gray-700">
                {new Date(day).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </h3>
              <div className="space-y-2">
                {pubs.map(pub => (
                  <PublicationRow
                    key={pub.id}
                    pub={pub}
                    onCancel={handleCancel}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {cancel.isPending && (
        <div className="fixed bottom-4 right-4 rounded-md bg-gray-900 px-3 py-2 text-xs text-white">
          Annulation en cours…
        </div>
      )}
      {cancel.isError && (
        <div className="fixed bottom-4 right-4 flex items-center gap-2 rounded-md bg-red-600 px-3 py-2 text-xs text-white">
          <X className="h-3 w-3" />
          {cancel.error?.message}
        </div>
      )}
    </div>
  );
}
