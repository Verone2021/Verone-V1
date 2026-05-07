/* eslint-disable max-lines -- fichier refondu BO-MSG-018, héritage pré-existant 511 lignes */
'use client';

/**
 * MessagerieClient — HUB messagerie unifié (BO-MSG-018).
 *
 * Affiche dans une seule vue les mails entrants Gmail + sortants
 * (devis, factures, consultations, demandes infos LinkMe), avec
 * filtres direction / marque / type / lu-non-lu / recherche.
 *
 * Source : vue SQL `client_communications_unified`.
 * Reçoit les 100 dernières communications depuis le Server Component.
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
import {
  ArrowDownLeft,
  ArrowUpRight,
  ExternalLink,
  FileText,
  Inbox,
  MessageCircle,
  Paperclip,
  Receipt,
  HelpCircle,
} from 'lucide-react';

import { useSupabase } from '@/components/providers/supabase-provider';

import { CommunicationDetailDrawer } from './CommunicationDetailDrawer';
import { MailsKpiBar } from './MailsKpiBar';
import type { Communication, MessagerieFilters } from './types';

type KpiKey = 'unread' | 'replied_today' | 'linked_order' | null;

interface MessagerieClientProps {
  initialCommunications: Communication[];
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

function BrandBadge({ brand }: { brand: Communication['brand'] }) {
  if (!brand) return null;
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

function DirectionIcon({
  direction,
}: {
  direction: Communication['direction'];
}) {
  if (direction === 'received') {
    return (
      <ArrowDownLeft
        className="h-4 w-4 text-blue-600 flex-shrink-0"
        aria-label="Reçu"
      />
    );
  }
  return (
    <ArrowUpRight
      className="h-4 w-4 text-green-600 flex-shrink-0"
      aria-label="Envoyé"
    />
  );
}

function KindLabel({ kind }: { kind: Communication['kind'] }) {
  const config: Record<
    Communication['kind'],
    { label: string; icon: typeof FileText }
  > = {
    inbound_email: { label: 'Mail reçu', icon: Inbox },
    document_quote: { label: 'Devis', icon: FileText },
    document_invoice: { label: 'Facture', icon: Receipt },
    document_proforma: { label: 'Proforma', icon: Receipt },
    document_credit_note: { label: 'Avoir', icon: Receipt },
    consultation: { label: 'Consultation', icon: MessageCircle },
    info_request: { label: 'Demande infos', icon: HelpCircle },
  };
  const { label, icon: Icon } = config[kind] ?? {
    label: kind,
    icon: FileText,
  };
  return (
    <span className="inline-flex items-center gap-1 text-xs text-gray-600">
      <Icon className="h-3.5 w-3.5 flex-shrink-0" />
      <span className="truncate">{label}</span>
    </span>
  );
}

function getCounterpartyDisplay(comm: Communication): string {
  if (comm.counterparty_name && comm.counterparty_name.trim() !== '') {
    return comm.counterparty_name;
  }
  return comm.counterparty_email;
}

export function MessagerieClient({
  initialCommunications,
  watchAddresses,
}: MessagerieClientProps) {
  const supabase = useSupabase();
  const [communications, setCommunications] = useState<Communication[]>(
    initialCommunications
  );
  const [filters, setFilters] = useState<MessagerieFilters>({
    direction: 'all',
    brand: 'all',
    kind: 'all',
    toAddress: '',
    status: 'all',
    search: '',
  });
  const [selected, setSelected] = useState<Communication | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeKpi, setActiveKpi] = useState<KpiKey>(null);

  // Filtrage local
  const filtered = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    return communications.filter(c => {
      if (filters.direction !== 'all' && c.direction !== filters.direction)
        return false;
      if (filters.brand !== 'all' && c.brand !== filters.brand) return false;
      if (filters.kind !== 'all') {
        if (filters.kind === 'document' && !c.kind.startsWith('document_'))
          return false;
        if (filters.kind !== 'document' && c.kind !== filters.kind)
          return false;
      }
      if (
        filters.toAddress &&
        c.our_address !== filters.toAddress &&
        c.direction === 'received'
      ) {
        return false;
      }
      if (filters.status === 'read' && !c.is_read) return false;
      if (filters.status === 'unread' && c.is_read) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const inSubject = c.subject?.toLowerCase().includes(q) ?? false;
        const inFrom =
          c.counterparty_email.toLowerCase().includes(q) ||
          (c.counterparty_name?.toLowerCase().includes(q) ?? false);
        const inPreview = c.preview?.toLowerCase().includes(q) ?? false;
        if (!inSubject && !inFrom && !inPreview) return false;
      }
      // Filtre KPI
      if (activeKpi === 'unread' && c.is_read) return false;
      if (activeKpi === 'linked_order' && !c.sales_order_id) return false;
      if (activeKpi === 'replied_today') {
        if (!c.replied_at) return false;
        if (new Date(c.replied_at) < startOfToday) return false;
      }
      return true;
    });
  }, [communications, filters, activeKpi]);

  const handleOpen = useCallback(
    (comm: Communication) => {
      setSelected(comm);
      setDrawerOpen(true);

      // Marquer email entrant comme lu (sortants déjà is_read=true)
      if (comm.direction === 'received' && !comm.is_read) {
        void supabase
          .from('email_messages')
          .update({ is_read: true })
          .eq('id', comm.id)
          .then(({ error }) => {
            if (!error) {
              setCommunications(prev =>
                prev.map(c => (c.id === comm.id ? { ...c, is_read: true } : c))
              );
            } else {
              console.error('[Messagerie] markAsRead error', error);
            }
          });
      }
    },
    [supabase]
  );

  const handleToggleRead = useCallback(
    (comm: Communication) => {
      if (comm.direction !== 'received') return;
      const newValue = !comm.is_read;
      void supabase
        .from('email_messages')
        .update({ is_read: newValue })
        .eq('id', comm.id)
        .then(({ error }) => {
          if (!error) {
            setCommunications(prev =>
              prev.map(c =>
                c.id === comm.id ? { ...c, is_read: newValue } : c
              )
            );
            setSelected(prev =>
              prev?.id === comm.id ? { ...prev, is_read: newValue } : prev
            );
          }
        });
    },
    [supabase]
  );

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  // Rendu d'une ligne (desktop)
  const renderTableRow = (c: Communication) => {
    const counterparty = getCounterpartyDisplay(c);
    const isUnread = c.direction === 'received' && !c.is_read;
    return (
      <TableRow
        key={c.id}
        className={cn(
          'cursor-pointer hover:bg-gray-50 transition-colors',
          isUnread && 'bg-blue-50/50 font-semibold'
        )}
        onClick={() => handleOpen(c)}
      >
        <TableCell className="w-[60px]">
          <DirectionIcon direction={c.direction} />
        </TableCell>
        <TableCell className="w-[90px]">
          <BrandBadge brand={c.brand} />
        </TableCell>
        <TableCell className="min-w-[160px]">
          <div className="flex flex-col gap-0.5">
            <span
              className="text-sm truncate max-w-[200px]"
              title={c.counterparty_email}
            >
              {counterparty}
            </span>
            {c.counterparty_name && (
              <span className="text-xs text-gray-500 truncate max-w-[200px]">
                {c.counterparty_email}
              </span>
            )}
          </div>
        </TableCell>
        <TableCell className="hidden md:table-cell w-[140px]">
          <KindLabel kind={c.kind} />
        </TableCell>
        <TableCell className="min-w-[200px]">
          <div className="flex items-center gap-1.5">
            {isUnread && (
              <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
            )}
            {c.has_attachments && (
              <Paperclip className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
            )}
            <span
              className="text-sm truncate max-w-[300px]"
              title={c.subject ?? ''}
            >
              {c.subject ?? '(sans objet)'}
            </span>
          </div>
        </TableCell>
        <TableCell className="hidden lg:table-cell w-[140px] text-xs text-gray-500 whitespace-nowrap">
          {formatDate(c.event_at)}
        </TableCell>
        <TableCell className="hidden xl:table-cell w-[130px]">
          {c.sales_order_number && c.sales_order_id ? (
            <Link
              href={`/commandes/clients/${c.sales_order_id}`}
              className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
              onClick={e => e.stopPropagation()}
            >
              <ExternalLink className="h-3 w-3 flex-shrink-0" />
              {c.sales_order_number}
            </Link>
          ) : c.consultation_id ? (
            <Link
              href={`/consultations/${c.consultation_id}`}
              className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
              onClick={e => e.stopPropagation()}
            >
              <ExternalLink className="h-3 w-3 flex-shrink-0" />
              Consultation
            </Link>
          ) : (
            <span className="text-xs text-gray-400">—</span>
          )}
        </TableCell>
      </TableRow>
    );
  };

  // Rendu d'une carte (mobile)
  const renderCard = (c: Communication) => {
    const counterparty = getCounterpartyDisplay(c);
    const isUnread = c.direction === 'received' && !c.is_read;
    return (
      <div
        key={c.id}
        className={cn(
          'bg-white rounded-lg border border-gray-200 p-4 cursor-pointer hover:shadow-sm transition-shadow',
          isUnread && 'border-l-4 border-l-blue-500'
        )}
        onClick={() => handleOpen(c)}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <DirectionIcon direction={c.direction} />
            <BrandBadge brand={c.brand} />
          </div>
          <span className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
            {formatDate(c.event_at)}
          </span>
        </div>
        <p
          className={cn(
            'text-sm mb-1 truncate',
            isUnread ? 'font-semibold text-gray-900' : 'text-gray-700'
          )}
        >
          {counterparty}
        </p>
        <div className="mb-1">
          <KindLabel kind={c.kind} />
        </div>
        <p className="text-sm text-gray-600 truncate mb-1">
          {c.subject ?? '(sans objet)'}
        </p>
        {c.preview && (
          <p className="text-xs text-gray-400 truncate">{c.preview}</p>
        )}
        {c.sales_order_number && c.sales_order_id && (
          <div className="mt-2">
            <Link
              href={`/commandes/clients/${c.sales_order_id}`}
              className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
              onClick={e => e.stopPropagation()}
            >
              <ExternalLink className="h-3 w-3" />
              Commande {c.sales_order_number}
            </Link>
          </div>
        )}
      </div>
    );
  };

  const unreadCount = communications.filter(
    c => c.direction === 'received' && !c.is_read
  ).length;

  return (
    <>
      <div className="space-y-4 px-4 sm:px-6 py-6">
        <MailsKpiBar
          communications={communications}
          activeKpi={activeKpi}
          onKpiClick={setActiveKpi}
        />

        <ResponsiveToolbar
          title="Messagerie"
          subtitle={
            unreadCount > 0
              ? `${unreadCount} non-lu${unreadCount > 1 ? 's' : ''}`
              : `${communications.length} communication${communications.length > 1 ? 's' : ''}`
          }
          search={
            <input
              type="text"
              placeholder="Rechercher (sujet, contact, contenu…)"
              value={filters.search}
              onChange={e =>
                setFilters(f => ({ ...f, search: e.target.value }))
              }
              className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
            />
          }
          filters={
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={filters.direction}
                onChange={e =>
                  setFilters(f => ({
                    ...f,
                    direction: e.target.value as MessagerieFilters['direction'],
                  }))
                }
                className="h-9 px-3 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="all">Tout</option>
                <option value="received">Reçus</option>
                <option value="sent">Envoyés</option>
              </select>

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

              <select
                value={filters.kind}
                onChange={e =>
                  setFilters(f => ({
                    ...f,
                    kind: e.target.value as MessagerieFilters['kind'],
                  }))
                }
                className="h-9 px-3 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="all">Tous les types</option>
                <option value="inbound_email">Mails reçus</option>
                <option value="document">Devis / Factures</option>
                <option value="consultation">Consultations</option>
                <option value="info_request">Demandes infos</option>
              </select>

              {watchAddresses.length > 0 && (
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
              )}

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

        <ResponsiveDataView<Communication>
          data={filtered}
          loading={false}
          emptyMessage={
            <div className="text-center py-12">
              <Inbox className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p className="text-gray-500 text-sm">
                {filters.search ||
                filters.direction !== 'all' ||
                filters.brand !== 'all' ||
                filters.kind !== 'all' ||
                filters.status !== 'all' ||
                filters.toAddress
                  ? 'Aucune communication avec ces filtres'
                  : 'Aucune communication pour le moment'}
              </p>
            </div>
          }
          renderTable={items => (
            <div className="w-full overflow-x-auto">
              <Table className="w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">Sens</TableHead>
                    <TableHead className="w-[90px]">Marque</TableHead>
                    <TableHead className="min-w-[160px]">Contact</TableHead>
                    <TableHead className="hidden md:table-cell w-[140px]">
                      Type
                    </TableHead>
                    <TableHead className="min-w-[200px]">Sujet</TableHead>
                    <TableHead className="hidden lg:table-cell w-[140px]">
                      Date
                    </TableHead>
                    <TableHead className="hidden xl:table-cell w-[130px]">
                      Lien
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>{items.map(c => renderTableRow(c))}</TableBody>
              </Table>
            </div>
          )}
          renderCard={c => renderCard(c)}
        />
      </div>

      <CommunicationDetailDrawer
        communication={selected}
        open={drawerOpen}
        onClose={handleCloseDrawer}
        onToggleRead={handleToggleRead}
      />
    </>
  );
}
