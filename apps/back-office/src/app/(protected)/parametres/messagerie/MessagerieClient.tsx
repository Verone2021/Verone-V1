'use client';

/**
 * MessagerieClient — Composant client pour la page Messagerie.
 * Gère les filtres, la sélection d'email et le marquage lu/non-lu.
 * Reçoit les emails depuis le Server Component parent (50 derniers).
 */

import { useCallback, useMemo, useState } from 'react';

import Link from 'next/link';

import {
  Badge,
  Button,
  ResponsiveDataView,
  ResponsiveToolbar,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import { cn } from '@verone/utils';
import { ExternalLink, Inbox, Mail, Paperclip } from 'lucide-react';

import { MessagesTabsBar } from '@/components/messages-tabs-bar';
import { useSupabase } from '@/components/providers/supabase-provider';

import { ComposeMailModal } from './ComposeMailModal';
import { EmailDetailDrawer } from './EmailDetailDrawer';
import { MailsKpiBar } from './MailsKpiBar';
import type { EmailMessageEnriched, MessagerieFilters } from './types';

type KpiKey = 'unread' | 'replied_today' | 'linked_order' | null;

interface MessagerieClientProps {
  initialEmails: EmailMessageEnriched[];
  watchAddresses: string[];
}

/**
 * Format affichable du client identifié (organisation ou contact).
 * Retourne null si aucun croisement n'a été trouvé sur from_email.
 */
function getClientDisplay(email: EmailMessageEnriched): {
  label: string;
  href: string;
} | null {
  if (email.organisation) {
    const orgLabel =
      email.organisation.trade_name ?? email.organisation.legal_name ?? '';
    return {
      label: orgLabel || email.from_email,
      href: `/contacts-organisations/${email.organisation.id}`,
    };
  }
  if (email.contact) {
    const fullName = [email.contact.first_name, email.contact.last_name]
      .filter(Boolean)
      .join(' ')
      .trim();
    return {
      label: fullName || email.from_email,
      href: `/contacts-organisations/${email.contact.id}`,
    };
  }
  return null;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function BrandBadge({ brand }: { brand: 'verone' | 'linkme' }) {
  return (
    <Badge
      variant={brand === 'verone' ? 'default' : 'info'}
      size="sm"
      className="whitespace-nowrap"
    >
      {brand === 'verone' ? 'Vérone' : 'LinkMe'}
    </Badge>
  );
}

export function MessagerieClient({
  initialEmails,
  watchAddresses,
}: MessagerieClientProps) {
  const supabase = useSupabase();
  const [emails, setEmails] = useState<EmailMessageEnriched[]>(initialEmails);
  const [filters, setFilters] = useState<MessagerieFilters>({
    brand: 'all',
    toAddress: '',
    status: 'all',
    search: '',
  });
  const [selectedEmail, setSelectedEmail] =
    useState<EmailMessageEnriched | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeReplyTo, setComposeReplyTo] =
    useState<EmailMessageEnriched | null>(null);
  const [activeKpi, setActiveKpi] = useState<KpiKey>(null);

  const handleOpenCompose = useCallback(() => {
    setComposeReplyTo(null);
    setComposeOpen(true);
  }, []);

  const handleReply = useCallback((email: EmailMessageEnriched) => {
    setComposeReplyTo(email);
    setComposeOpen(true);
  }, []);

  const handleCloseCompose = useCallback(() => {
    setComposeOpen(false);
  }, []);

  // Filtrage local
  const filteredEmails = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    return emails.filter(email => {
      if (filters.brand !== 'all' && email.brand !== filters.brand)
        return false;
      if (filters.toAddress && email.to_address !== filters.toAddress)
        return false;
      if (filters.status === 'read' && !email.is_read) return false;
      if (filters.status === 'unread' && email.is_read) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const inSubject = email.subject?.toLowerCase().includes(q) ?? false;
        const inFrom =
          email.from_email.toLowerCase().includes(q) ||
          (email.from_name?.toLowerCase().includes(q) ?? false);
        const inSnippet = email.snippet?.toLowerCase().includes(q) ?? false;
        if (!inSubject && !inFrom && !inSnippet) return false;
      }
      // Filtre KPI
      if (activeKpi === 'unread' && email.is_read) return false;
      if (activeKpi === 'linked_order' && !email.linked_order_id) return false;
      if (activeKpi === 'replied_today') {
        if (!email.replied_at) return false;
        if (new Date(email.replied_at) < startOfToday) return false;
      }
      return true;
    });
  }, [emails, filters, activeKpi]);

  const handleOpenEmail = useCallback(
    (email: EmailMessageEnriched) => {
      setSelectedEmail(email);
      setDrawerOpen(true);

      // Marquer comme lu si non-lu
      if (!email.is_read) {
        void supabase
          .from('email_messages')
          .update({ is_read: true })
          .eq('id', email.id)
          .then(({ error }) => {
            if (!error) {
              setEmails(prev =>
                prev.map(e => (e.id === email.id ? { ...e, is_read: true } : e))
              );
            } else {
              console.error('[Messagerie] Erreur markAsRead', error);
            }
          });
      }
    },
    [supabase]
  );

  const handleToggleRead = useCallback(
    (email: EmailMessageEnriched) => {
      const newValue = !email.is_read;
      void supabase
        .from('email_messages')
        .update({ is_read: newValue })
        .eq('id', email.id)
        .then(({ error }) => {
          if (!error) {
            setEmails(prev =>
              prev.map(e =>
                e.id === email.id ? { ...e, is_read: newValue } : e
              )
            );
            setSelectedEmail(prev =>
              prev?.id === email.id ? { ...prev, is_read: newValue } : prev
            );
          } else {
            console.error('[Messagerie] Erreur toggleRead', error);
          }
        });
    },
    [supabase]
  );

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  // Rendu d'une ligne (desktop)
  const renderTableRow = (email: EmailMessageEnriched) => (
    <TableRow
      key={email.id}
      className={cn(
        'cursor-pointer hover:bg-gray-50 transition-colors',
        !email.is_read && 'bg-blue-50/50 font-semibold'
      )}
      onClick={() => handleOpenEmail(email)}
    >
      <TableCell className="w-[90px]">
        <BrandBadge brand={email.brand} />
      </TableCell>
      <TableCell className="min-w-[160px]">
        <div className="flex flex-col gap-0.5">
          <span
            className="text-sm truncate max-w-[200px]"
            title={email.from_email}
          >
            {email.from_name ?? email.from_email}
          </span>
          {email.from_name && (
            <span className="text-xs text-gray-500 truncate max-w-[200px]">
              {email.from_email}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell min-w-[140px]">
        {(() => {
          const client = getClientDisplay(email);
          if (!client) {
            return <span className="text-xs text-gray-400">—</span>;
          }
          return (
            <Link
              href={client.href}
              className="text-sm text-blue-600 hover:underline truncate max-w-[180px] inline-block"
              onClick={e => e.stopPropagation()}
              title={client.label}
            >
              {client.label}
            </Link>
          );
        })()}
      </TableCell>
      <TableCell className="min-w-[200px]">
        <div className="flex items-center gap-1.5">
          {!email.is_read && (
            <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
          )}
          {email.has_attachments && (
            <Paperclip className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
          )}
          <span
            className="text-sm truncate max-w-[300px]"
            title={email.subject ?? ''}
          >
            {email.subject ?? '(sans objet)'}
          </span>
        </div>
      </TableCell>
      <TableCell className="hidden lg:table-cell w-[140px] text-xs text-gray-500 whitespace-nowrap">
        {formatDate(email.received_at)}
      </TableCell>
      <TableCell className="hidden xl:table-cell w-[130px]">
        {email.linked_order_number && email.linked_order_id ? (
          <Link
            href={`/commandes/clients/${email.linked_order_id}`}
            className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
            onClick={e => e.stopPropagation()}
          >
            <ExternalLink className="h-3 w-3 flex-shrink-0" />
            {email.linked_order_number}
          </Link>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
      </TableCell>
    </TableRow>
  );

  // Rendu d'une carte (mobile)
  const renderEmailCard = (email: EmailMessageEnriched) => (
    <div
      key={email.id}
      className={cn(
        'bg-white rounded-lg border border-gray-200 p-4 cursor-pointer hover:shadow-sm transition-shadow',
        !email.is_read && 'border-l-4 border-l-blue-500'
      )}
      onClick={() => handleOpenEmail(email)}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <BrandBadge brand={email.brand} />
        <span className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
          {formatDate(email.received_at)}
        </span>
      </div>
      <p
        className={cn(
          'text-sm mb-1 truncate',
          !email.is_read ? 'font-semibold text-gray-900' : 'text-gray-700'
        )}
      >
        {email.from_name ?? email.from_email}
      </p>
      {(() => {
        const client = getClientDisplay(email);
        return client ? (
          <Link
            href={client.href}
            className="text-xs text-blue-600 hover:underline truncate inline-block mb-1"
            onClick={e => e.stopPropagation()}
            title={client.label}
          >
            {client.label}
          </Link>
        ) : null;
      })()}
      <p className="text-sm text-gray-600 truncate mb-1">
        {email.subject ?? '(sans objet)'}
      </p>
      {email.snippet && (
        <p className="text-xs text-gray-400 truncate">{email.snippet}</p>
      )}
      {email.linked_order_number && email.linked_order_id && (
        <div className="mt-2">
          <Link
            href={`/commandes/clients/${email.linked_order_id}`}
            className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
            onClick={e => e.stopPropagation()}
          >
            <ExternalLink className="h-3 w-3" />
            Commande {email.linked_order_number}
          </Link>
        </div>
      )}
    </div>
  );

  const unreadCount = emails.filter(e => !e.is_read).length;

  return (
    <>
      <MessagesTabsBar />
      <div className="space-y-4 px-4 sm:px-6 py-6">
        {/* Mini-dashboard KPIs */}
        <MailsKpiBar
          emails={emails}
          activeKpi={activeKpi}
          onKpiClick={setActiveKpi}
        />

        {/* Toolbar */}
        <ResponsiveToolbar
          title="Messagerie"
          subtitle={
            unreadCount > 0
              ? `${unreadCount} non-lu${unreadCount > 1 ? 's' : ''}`
              : `${emails.length} email${emails.length > 1 ? 's' : ''}`
          }
          primaryAction={
            <Button onClick={handleOpenCompose}>
              <Mail className="h-4 w-4 mr-2" />
              Composer
            </Button>
          }
          search={
            <input
              type="text"
              placeholder="Rechercher (expéditeur, sujet…)"
              value={filters.search}
              onChange={e =>
                setFilters(f => ({ ...f, search: e.target.value }))
              }
              className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
            />
          }
          filters={
            <div className="flex items-center gap-2 flex-wrap">
              {/* Filtre marque */}
              <select
                value={filters.brand}
                onChange={e =>
                  setFilters(f => ({
                    ...f,
                    brand: e.target.value as MessagerieFilters['brand'],
                  }))
                }
                className="h-9 px-3 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="all">Toutes les marques</option>
                <option value="verone">Vérone</option>
                <option value="linkme">LinkMe</option>
              </select>

              {/* Filtre adresse */}
              <select
                value={filters.toAddress}
                onChange={e =>
                  setFilters(f => ({ ...f, toAddress: e.target.value }))
                }
                className="h-9 px-3 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="">Toutes les adresses</option>
                {watchAddresses.map(addr => (
                  <option key={addr} value={addr}>
                    {addr}
                  </option>
                ))}
              </select>

              {/* Filtre statut */}
              <select
                value={filters.status}
                onChange={e =>
                  setFilters(f => ({
                    ...f,
                    status: e.target.value as MessagerieFilters['status'],
                  }))
                }
                className="h-9 px-3 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="all">Tous les statuts</option>
                <option value="unread">Non-lus</option>
                <option value="read">Lus</option>
              </select>
            </div>
          }
        />

        {/* Liste */}
        <ResponsiveDataView<EmailMessageEnriched>
          data={filteredEmails}
          loading={false}
          emptyMessage={
            <div className="text-center py-12">
              <Inbox className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p className="text-gray-500 text-sm">
                {filters.search ||
                filters.brand !== 'all' ||
                filters.status !== 'all' ||
                filters.toAddress
                  ? 'Aucun email avec ces filtres'
                  : "Aucun email reçu pour l'instant"}
              </p>
            </div>
          }
          renderTable={items => (
            <div className="w-full overflow-x-auto">
              <Table className="w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[90px]">Marque</TableHead>
                    <TableHead className="min-w-[160px]">De</TableHead>
                    <TableHead className="hidden md:table-cell min-w-[140px]">
                      Client
                    </TableHead>
                    <TableHead className="min-w-[200px]">Sujet</TableHead>
                    <TableHead className="hidden lg:table-cell w-[140px]">
                      Reçu le
                    </TableHead>
                    <TableHead className="hidden xl:table-cell w-[130px]">
                      Commande liée
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map(email => renderTableRow(email))}
                </TableBody>
              </Table>
            </div>
          )}
          renderCard={email => renderEmailCard(email)}
        />
      </div>

      {/* Drawer détail */}
      <EmailDetailDrawer
        email={selectedEmail}
        open={drawerOpen}
        onClose={handleCloseDrawer}
        onToggleRead={handleToggleRead}
        onReply={handleReply}
      />

      {/* Modal compose / reply */}
      <ComposeMailModal
        open={composeOpen}
        onClose={handleCloseCompose}
        replyTo={composeReplyTo}
      />
    </>
  );
}
