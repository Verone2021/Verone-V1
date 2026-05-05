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
import { ExternalLink, Inbox, Paperclip } from 'lucide-react';

import { useSupabase } from '@/components/providers/supabase-provider';

import { EmailDetailDrawer } from './EmailDetailDrawer';
import type { EmailMessage, MessagerieFilters } from './types';

interface MessagerieClientProps {
  initialEmails: EmailMessage[];
  watchAddresses: string[];
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
  const [emails, setEmails] = useState<EmailMessage[]>(initialEmails);
  const [filters, setFilters] = useState<MessagerieFilters>({
    brand: 'all',
    toAddress: '',
    status: 'all',
    search: '',
  });
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Filtrage local
  const filteredEmails = useMemo(() => {
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
      return true;
    });
  }, [emails, filters]);

  const handleOpenEmail = useCallback(
    (email: EmailMessage) => {
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
    (email: EmailMessage) => {
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
  const renderTableRow = (email: EmailMessage) => (
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
  const renderEmailCard = (email: EmailMessage) => (
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
      <div className="space-y-4">
        {/* Toolbar */}
        <ResponsiveToolbar
          title="Messagerie"
          subtitle={
            unreadCount > 0
              ? `${unreadCount} non-lu${unreadCount > 1 ? 's' : ''}`
              : `${emails.length} email${emails.length > 1 ? 's' : ''}`
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
        <ResponsiveDataView<EmailMessage>
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
      />
    </>
  );
}
