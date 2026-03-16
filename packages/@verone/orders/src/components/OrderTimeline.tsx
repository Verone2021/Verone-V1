'use client';

import {
  Card,
  CardContent,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@verone/ui';
import {
  Mail,
  MailX,
  FileText,
  CheckCircle,
  XCircle,
  Plus,
  Clock,
  MessageSquare,
  MessageCircleReply,
  Truck,
  Package,
  CreditCard,
  ClipboardCheck,
  Check,
  Receipt,
  MoreHorizontal,
} from 'lucide-react';

import type {
  OrderHistoryEventType,
  OrderHistoryEvent,
} from '../hooks/linkme/use-order-history';

// ── Config ───────────────────────────────────────────────────────────

const EVENT_CONFIG: Record<
  OrderHistoryEventType,
  {
    icon: typeof Mail;
    iconColor: string;
  }
> = {
  created: { icon: Plus, iconColor: 'text-blue-600' },
  email_sent: { icon: Mail, iconColor: 'text-indigo-600' },
  email_failed: { icon: MailX, iconColor: 'text-red-600' },
  approved: { icon: CheckCircle, iconColor: 'text-green-600' },
  rejected: { icon: XCircle, iconColor: 'text-red-600' },
  info_requested: { icon: MessageSquare, iconColor: 'text-amber-600' },
  info_completed: { icon: MessageCircleReply, iconColor: 'text-purple-600' },
  info_cancelled: { icon: XCircle, iconColor: 'text-gray-500' },
  validated: { icon: Check, iconColor: 'text-green-600' },
  shipped: { icon: Truck, iconColor: 'text-blue-600' },
  delivered: { icon: Package, iconColor: 'text-green-600' },
  cancelled: { icon: XCircle, iconColor: 'text-red-600' },
  paid: { icon: CreditCard, iconColor: 'text-green-600' },
  invoiced: { icon: FileText, iconColor: 'text-amber-600' },
  quote_created: { icon: FileText, iconColor: 'text-blue-600' },
  invoice_created: { icon: Receipt, iconColor: 'text-emerald-600' },
  step4_completed: { icon: ClipboardCheck, iconColor: 'text-teal-600' },
};

function formatEventDate(dateStr: string): string {
  const date = new Date(dateStr);
  return (
    date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
    }) +
    ' ' +
    date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  );
}

// ── Detail rows for the popover ─────────────────────────────────────

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 text-xs">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className="text-gray-900 text-right truncate">{value}</span>
    </div>
  );
}

function EventDetails({ event }: { event: OrderHistoryEvent }) {
  const meta = event.metadata ?? {};
  const rows: { label: string; value: string }[] = [];

  // Recipient email (emails events, info requests)
  if (meta.recipient_email) {
    rows.push({ label: 'Destinataire', value: meta.recipient_email as string });
  }

  // Status transition
  if (meta.old_status && meta.new_status) {
    rows.push({
      label: 'Transition',
      value: `${meta.old_status as string} → ${meta.new_status as string}`,
    });
  }

  // Requested fields (info requests)
  if (meta.requested_fields) {
    const fields = meta.requested_fields as Array<{ label: string }>;
    if (fields.length > 0) {
      rows.push({
        label: 'Champs demandes',
        value: fields.map(f => f.label).join(', '),
      });
    }
  }

  // Recipient name (info requests)
  if (meta.recipient_name) {
    rows.push({ label: 'Contact', value: meta.recipient_name as string });
  }

  // Financial document details
  if (meta.documentType) {
    const docType =
      meta.documentType === 'customer_quote' ? 'Devis' : 'Facture';
    rows.push({ label: 'Type', value: docType });
  }
  if (meta.amount) {
    rows.push({ label: 'Montant HT', value: meta.amount as string });
  }
  if (meta.quoteStatus) {
    rows.push({ label: 'Statut', value: meta.quoteStatus as string });
  }

  if (rows.length === 0) return null;

  return (
    <div className="space-y-1.5">
      {rows.map((row, i) => (
        <DetailRow key={i} label={row.label} value={row.value} />
      ))}
    </div>
  );
}

function hasDetails(event: OrderHistoryEvent): boolean {
  const meta = event.metadata ?? {};
  return !!(
    meta.recipient_email ||
    (meta.old_status && meta.new_status) ||
    meta.requested_fields ||
    meta.recipient_name ||
    meta.documentType ||
    meta.amount
  );
}

// ── Component ────────────────────────────────────────────────────────

interface OrderTimelineProps {
  events: OrderHistoryEvent[];
  loading: boolean;
}

export function OrderTimeline({ events, loading }: OrderTimelineProps) {
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
              const showDetails = hasDetails(event);

              return (
                <div key={event.id} className="relative flex items-start gap-3">
                  {/* Dot */}
                  <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white ring-2 ring-gray-100">
                    <Icon className={`h-3.5 w-3.5 ${config.iconColor}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {event.title}
                      </span>

                      {showDetails && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex items-center justify-center h-5 w-5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors shrink-0"
                              aria-label="Voir les details"
                            >
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent
                            side="right"
                            align="start"
                            className="w-64 p-3"
                          >
                            <p className="text-xs font-semibold text-gray-700 mb-2">
                              {event.title}
                            </p>
                            <EventDetails event={event} />
                          </PopoverContent>
                        </Popover>
                      )}

                      <span className="text-xs text-gray-400 shrink-0 ml-auto">
                        {formatEventDate(event.date)}
                      </span>
                    </div>
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
