'use client';

import { Card, CardContent } from '@verone/ui';
import {
  Mail,
  MailX,
  FileText,
  CheckCircle,
  Archive,
  Plus,
  Clock,
  MessageCircleReply,
} from 'lucide-react';

import type {
  HistoryEvent,
  HistoryEventType,
} from '../hooks/use-consultation-history';

// ── Config ───────────────────────────────────────────────────────────

const EVENT_CONFIG: Record<
  HistoryEventType,
  {
    icon: typeof Mail;
    iconColor: string;
    dotColor: string;
  }
> = {
  created: {
    icon: Plus,
    iconColor: 'text-blue-600',
    dotColor: 'bg-blue-600',
  },
  responded: {
    icon: MessageCircleReply,
    iconColor: 'text-purple-600',
    dotColor: 'bg-purple-600',
  },
  validated: {
    icon: CheckCircle,
    iconColor: 'text-green-600',
    dotColor: 'bg-green-600',
  },
  archived: {
    icon: Archive,
    iconColor: 'text-gray-500',
    dotColor: 'bg-gray-500',
  },
  email_sent: {
    icon: Mail,
    iconColor: 'text-indigo-600',
    dotColor: 'bg-indigo-600',
  },
  email_failed: {
    icon: MailX,
    iconColor: 'text-red-600',
    dotColor: 'bg-red-600',
  },
  quote_created: {
    icon: FileText,
    iconColor: 'text-amber-600',
    dotColor: 'bg-amber-600',
  },
};

function formatEventDate(dateStr: string): string {
  const date = new Date(dateStr);
  return (
    date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: undefined,
    }) +
    ' ' +
    date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  );
}

// ── Component ────────────────────────────────────────────────────────

interface ConsultationTimelineProps {
  events: HistoryEvent[];
  loading: boolean;
}

export function ConsultationTimeline({
  events,
  loading,
}: ConsultationTimelineProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-semibold">Historique</span>
          </div>
          <div className="flex items-center justify-center py-6">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-semibold">Historique</span>
          </div>
          <p className="text-sm text-gray-500 text-center py-4">
            Aucun evenement
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-semibold">Historique</span>
          <span className="text-xs text-gray-400">({events.length})</span>
        </div>

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gray-200" />

          <div className="space-y-4">
            {events.map(event => {
              const config = EVENT_CONFIG[event.type];
              const Icon = config.icon;

              return (
                <div key={event.id} className="relative flex items-start gap-3">
                  {/* Dot */}
                  <div
                    className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white ring-2 ring-gray-100`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${config.iconColor}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {event.title}
                      </span>
                      <span className="text-xs text-gray-400 shrink-0">
                        {formatEventDate(event.date)}
                      </span>
                    </div>
                    {event.description && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {event.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
