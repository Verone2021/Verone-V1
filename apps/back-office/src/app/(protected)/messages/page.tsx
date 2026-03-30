'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

import {
  useDatabaseNotifications,
  useFormSubmissionsCount,
  useLinkmeMissingInfoCount,
} from '@verone/notifications';
import {
  Badge,
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@verone/ui';
import { cn } from '@verone/utils';
import {
  MessageSquare,
  Link2,
  RefreshCw,
  Filter,
  Inbox,
  FileText,
  Bell,
  AlertCircle,
} from 'lucide-react';

import { MessageList } from './components/message-list';
import { SystemNotificationsTab } from './components/system-notifications-tab';
import { useMessages, useFilteredMessages } from './hooks/use-messages';

export default function MessagesHubPage() {
  const searchParams = useSearchParams();
  const initialTab =
    searchParams.get('onglet') ?? searchParams.get('canal') ?? 'tous';

  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { messages, loading, error, fetchMessages } = useMessages();
  const { filtered, linkmeMessages, formMessages } = useFilteredMessages(
    messages,
    statusFilter
  );

  const { count: formSubmissionsCount } = useFormSubmissionsCount();
  const { count: linkmeMissingInfoCount } = useLinkmeMissingInfoCount();
  const { unreadCount: systemUnreadCount } = useDatabaseNotifications();

  useEffect(() => {
    void fetchMessages().catch(err => {
      console.error('[MessagesHub] Initial fetch error:', err);
    });
  }, [fetchMessages]);

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

  const statusFilters = [
    { key: 'all', label: 'Tous' },
    { key: 'new', label: 'Nouveaux', count: totalPending },
    { key: 'in_progress', label: 'En cours' },
    { key: 'resolved', label: 'Resolus' },
  ] as const;

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
        {statusFilters.map(f => (
          <Button
            key={f.key}
            variant={statusFilter === f.key ? 'default' : 'outline'}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setStatusFilter(f.key)}
          >
            {f.label}
            {'count' in f && f.count != null && f.count > 0 && (
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

        <TabsContent value="tous" className="mt-4">
          <MessageList
            loading={loading}
            messages={filtered}
            emptyLabel="Aucun message pour ces filtres"
          />
        </TabsContent>

        <TabsContent value="formulaires" className="mt-4">
          <MessageList
            loading={loading}
            messages={formMessages}
            emptyLabel="Aucun formulaire de contact"
            skeletonCount={3}
          />
        </TabsContent>

        <TabsContent value="linkme" className="mt-4">
          <MessageList
            loading={loading}
            messages={linkmeMessages}
            emptyLabel="Aucune demande d'information LinkMe"
            skeletonCount={3}
          />
        </TabsContent>

        <TabsContent value="systeme" className="mt-4">
          <SystemNotificationsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
