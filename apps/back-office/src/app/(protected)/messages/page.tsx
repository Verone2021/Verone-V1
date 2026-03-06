'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import {
  useDatabaseNotifications,
  useFormSubmissionsCount,
  useLinkmeMissingInfoCount,
} from '@verone/notifications';
import {
  Badge,
  Button,
  Card,
  CardContent,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@verone/ui';
import { cn } from '@verone/utils';
import { createClient } from '@verone/utils/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  MessageSquare,
  Link2,
  Globe,
  Mail,
  Clock,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Filter,
  Inbox,
  FileText,
  Bell,
} from 'lucide-react';

import { SystemNotificationsTab } from './components/system-notifications-tab';

// ============================================================================
// Types
// ============================================================================

interface UnifiedMessage {
  id: string;
  type: 'info_request' | 'form_submission';
  channel: 'linkme' | 'site_internet' | 'other';
  status: string;
  statusLabel: string;
  title: string;
  subtitle: string;
  date: string;
  linkHref: string;
  metadata: Record<string, unknown>;
}

// ============================================================================
// Status helpers
// ============================================================================

const INFO_REQUEST_STATUS_MAP: Record<
  string,
  { label: string; color: string }
> = {
  pending: { label: 'En attente', color: 'bg-orange-100 text-orange-700' },
  completed: { label: 'Completee', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Annulee', color: 'bg-gray-100 text-gray-600' },
  expired: { label: 'Expiree', color: 'bg-red-100 text-red-600' },
};

const FORM_STATUS_MAP: Record<string, { label: string; color: string }> = {
  new: { label: 'Nouveau', color: 'bg-blue-100 text-blue-700' },
  open: { label: 'En cours', color: 'bg-orange-100 text-orange-700' },
  pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-700' },
  replied: { label: 'Repondu', color: 'bg-green-100 text-green-700' },
  closed: { label: 'Cloture', color: 'bg-gray-100 text-gray-600' },
  spam: { label: 'Spam', color: 'bg-red-100 text-red-600' },
};

function getInfoRequestStatus(row: Record<string, unknown>): string {
  if (row.cancelled_at) return 'cancelled';
  if (row.completed_at) return 'completed';
  const expiresAt = row.token_expires_at as string | null;
  if (expiresAt && new Date(expiresAt) < new Date()) return 'expired';
  return 'pending';
}

// ============================================================================
// Message Card component
// ============================================================================

function MessageCard({ message }: { message: UnifiedMessage }) {
  const timeAgo = formatDistanceToNow(new Date(message.date), {
    addSuffix: true,
    locale: fr,
  });

  const channelIcon =
    message.channel === 'linkme' ? (
      <Link2 className="h-3.5 w-3.5" />
    ) : message.channel === 'site_internet' ? (
      <Globe className="h-3.5 w-3.5" />
    ) : (
      <MessageSquare className="h-3.5 w-3.5" />
    );

  const channelLabel =
    message.channel === 'linkme'
      ? 'LinkMe'
      : message.channel === 'site_internet'
        ? 'Site Internet'
        : 'Autre';

  const typeIcon =
    message.type === 'info_request' ? (
      <Mail className="h-4 w-4" />
    ) : (
      <FileText className="h-4 w-4" />
    );

  const statusInfo =
    message.type === 'info_request'
      ? (INFO_REQUEST_STATUS_MAP[message.status] ?? {
          label: message.status,
          color: 'bg-gray-100 text-gray-600',
        })
      : (FORM_STATUS_MAP[message.status] ?? {
          label: message.status,
          color: 'bg-gray-100 text-gray-600',
        });

  return (
    <Link href={message.linkHref}>
      <Card
        className={cn(
          'group transition-all duration-150 hover:shadow-md hover:translate-x-0.5 cursor-pointer',
          message.status === 'pending' || message.status === 'new'
            ? 'border-l-4 border-l-orange-400'
            : 'border-l-4 border-l-transparent'
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div
              className={cn(
                'flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0',
                message.channel === 'linkme'
                  ? 'bg-purple-50 text-purple-600'
                  : 'bg-blue-50 text-blue-600'
              )}
            >
              {typeIcon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-medium text-sm truncate">
                  {message.title}
                </span>
                <Badge
                  className={cn(
                    'text-[10px] px-1.5 py-0 font-medium',
                    statusInfo.color
                  )}
                >
                  {statusInfo.label}
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground truncate">
                {message.subtitle}
              </p>

              <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  {channelIcon}
                  {channelLabel}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {timeAgo}
                </span>
              </div>
            </div>

            {/* Arrow */}
            <ArrowRight
              className={cn(
                'h-4 w-4 text-muted-foreground/30 transition-all duration-150 flex-shrink-0 mt-2',
                'group-hover:text-foreground group-hover:translate-x-0.5'
              )}
            />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// ============================================================================
// Empty state
// ============================================================================

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Inbox className="h-12 w-12 text-muted-foreground/30 mb-4" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

// ============================================================================
// Loading skeleton
// ============================================================================

function LoadingSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {[...Array(count)].map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-2/3 bg-muted rounded" />
                <div className="h-3 w-1/2 bg-muted rounded" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ============================================================================
// Main Page
// ============================================================================

export default function MessagesHubPage() {
  const searchParams = useSearchParams();
  const initialTab =
    searchParams.get('onglet') ?? searchParams.get('canal') ?? 'tous';

  const [messages, setMessages] = useState<UnifiedMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Hooks for badge counts (realtime)
  const { count: formSubmissionsCount } = useFormSubmissionsCount();
  const { count: linkmeMissingInfoCount } = useLinkmeMissingInfoCount();
  const { unreadCount: systemUnreadCount } = useDatabaseNotifications();

  const supabase = createClient();

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const results: UnifiedMessage[] = [];

      // 1. Fetch LinkMe info requests
      const { data: infoRequests, error: irError } = await supabase
        .from('linkme_info_requests')
        .select(
          `
          id,
          recipient_email,
          recipient_name,
          recipient_type,
          sent_at,
          completed_at,
          cancelled_at,
          token_expires_at,
          sales_order_id,
          created_at,
          sales_orders!inner(order_number)
        `
        )
        .not('sent_at', 'is', null)
        .order('created_at', { ascending: false })
        .limit(50);

      if (irError) {
        console.error('[MessagesHub] Info requests error:', irError);
      } else {
        for (const row of infoRequests ?? []) {
          const r = row as Record<string, unknown>;
          const salesOrder = r.sales_orders as Record<string, unknown> | null;
          const orderNumber =
            (salesOrder?.order_number as string | undefined) ?? 'N/A';
          const status = getInfoRequestStatus(r);

          results.push({
            id: r.id as string,
            type: 'info_request',
            channel: 'linkme',
            status,
            statusLabel: INFO_REQUEST_STATUS_MAP[status]?.label ?? status,
            title: `Demande d'infos — ${orderNumber}`,
            subtitle: `Envoyee a ${(r.recipient_name as string) || (r.recipient_email as string)}`,
            date: (r.sent_at as string) || (r.created_at as string),
            linkHref: `/canaux-vente/linkme/commandes/${r.sales_order_id as string}`,
            metadata: { orderNumber, status },
          });
        }
      }

      // 2. Fetch form submissions
      const { data: submissions, error: fsError } = await supabase
        .from('form_submissions')
        .select(
          'id, first_name, last_name, email, company_name, subject, message, status, priority, source, form_type, created_at'
        )
        .order('created_at', { ascending: false })
        .limit(50);

      if (fsError) {
        console.error('[MessagesHub] Form submissions error:', fsError);
      } else {
        for (const row of submissions ?? []) {
          const s = row as Record<string, unknown>;
          const source = s.source as string;
          const channel: UnifiedMessage['channel'] =
            source === 'linkme'
              ? 'linkme'
              : source === 'website'
                ? 'site_internet'
                : 'other';

          const fullName = [s.first_name, s.last_name]
            .filter(Boolean)
            .join(' ');
          const subject = (s.subject as string) || (s.message as string) || '';

          results.push({
            id: s.id as string,
            type: 'form_submission',
            channel,
            status: s.status as string,
            statusLabel:
              FORM_STATUS_MAP[s.status as string]?.label ??
              (s.status as string),
            title: fullName || (s.email as string),
            subtitle:
              subject.length > 80 ? `${subject.slice(0, 80)}...` : subject,
            date: s.created_at as string,
            linkHref: `/prises-contact/${s.id as string}`,
            metadata: {
              company: s.company_name,
              priority: s.priority,
              formType: s.form_type,
            },
          });
        }
      }

      // Sort all by date descending
      results.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setMessages(results);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(msg);
      console.error('[MessagesHub] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    void fetchMessages().catch(err => {
      console.error('[MessagesHub] Initial fetch error:', err);
    });
  }, [fetchMessages]);

  // Filtered messages
  const filteredMessages = useMemo(() => {
    return messages.filter(m => {
      if (statusFilter === 'new') {
        return m.status === 'new' || m.status === 'pending';
      }
      if (statusFilter === 'in_progress') {
        return m.status === 'open' || m.status === 'pending';
      }
      if (statusFilter === 'resolved') {
        return (
          m.status === 'completed' ||
          m.status === 'replied' ||
          m.status === 'closed'
        );
      }
      return true; // 'all'
    });
  }, [messages, statusFilter]);

  // Tab-specific messages
  const linkmeMessages = useMemo(
    () => filteredMessages.filter(m => m.channel === 'linkme'),
    [filteredMessages]
  );
  const formMessages = useMemo(
    () => filteredMessages.filter(m => m.type === 'form_submission'),
    [filteredMessages]
  );

  // Counts for tab badges (from local data for "tous" tab)
  const pendingLinkme = messages.filter(
    m =>
      m.channel === 'linkme' && (m.status === 'pending' || m.status === 'new')
  ).length;
  const pendingForms = messages.filter(
    m =>
      m.type === 'form_submission' &&
      (m.status === 'new' || m.status === 'open')
  ).length;
  const totalPending = pendingLinkme + pendingForms + systemUnreadCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-orange-500">
            <MessageSquare className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
            <p className="text-sm text-muted-foreground">
              Formulaires, demandes d&apos;informations et notifications — tous
              canaux
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            void fetchMessages().catch(err => {
              console.error('[MessagesHub] Refresh error:', err);
            });
          }}
          disabled={loading}
        >
          <RefreshCw
            className={cn('h-4 w-4 mr-2', loading && 'animate-spin')}
          />
          Actualiser
        </Button>
      </div>

      {/* Status filter chips */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        {[
          { key: 'all', label: 'Tous' },
          { key: 'new', label: 'Nouveaux', count: totalPending },
          { key: 'in_progress', label: 'En cours' },
          { key: 'resolved', label: 'Resolus' },
        ].map(f => (
          <Button
            key={f.key}
            variant={statusFilter === f.key ? 'default' : 'outline'}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setStatusFilter(f.key)}
          >
            {f.label}
            {f.count != null && f.count > 0 && (
              <Badge className="ml-1.5 bg-red-500 text-white text-[10px] px-1 py-0">
                {f.count}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue={initialTab} className="w-full">
        <TabsList>
          <TabsTrigger value="tous" className="gap-1.5">
            <Inbox className="h-4 w-4" />
            Tous
            {totalPending > 0 && (
              <Badge className="bg-red-500 text-white text-[10px] px-1 py-0">
                {totalPending}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="formulaires" className="gap-1.5">
            <FileText className="h-4 w-4" />
            Formulaires
            {formSubmissionsCount > 0 && (
              <Badge className="bg-blue-500 text-white text-[10px] px-1 py-0">
                {formSubmissionsCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="linkme" className="gap-1.5">
            <Link2 className="h-4 w-4" />
            LinkMe
            {linkmeMissingInfoCount > 0 && (
              <Badge className="bg-purple-500 text-white text-[10px] px-1 py-0">
                {linkmeMissingInfoCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="systeme" className="gap-1.5">
            <Bell className="h-4 w-4" />
            Systeme
            {systemUnreadCount > 0 && (
              <Badge className="bg-orange-500 text-white text-[10px] px-1 py-0">
                {systemUnreadCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ALL */}
        <TabsContent value="tous" className="mt-4">
          {loading ? (
            <LoadingSkeleton />
          ) : filteredMessages.length === 0 ? (
            <EmptyState message="Aucun message pour ces filtres" />
          ) : (
            <div className="space-y-2">
              {filteredMessages.map(m => (
                <MessageCard key={`${m.type}-${m.id}`} message={m} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* FORMULAIRES */}
        <TabsContent value="formulaires" className="mt-4">
          {loading ? (
            <LoadingSkeleton count={3} />
          ) : formMessages.length === 0 ? (
            <EmptyState message="Aucun formulaire de contact" />
          ) : (
            <div className="space-y-2">
              {formMessages.map(m => (
                <MessageCard key={`${m.type}-${m.id}`} message={m} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* LINKME */}
        <TabsContent value="linkme" className="mt-4">
          {loading ? (
            <LoadingSkeleton count={3} />
          ) : linkmeMessages.length === 0 ? (
            <EmptyState message="Aucune demande d'information LinkMe" />
          ) : (
            <div className="space-y-2">
              {linkmeMessages.map(m => (
                <MessageCard key={`${m.type}-${m.id}`} message={m} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* SYSTEME */}
        <TabsContent value="systeme" className="mt-4">
          <SystemNotificationsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
