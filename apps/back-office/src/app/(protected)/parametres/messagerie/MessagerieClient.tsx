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

import {
  ResponsiveDataView,
  ResponsiveToolbar,
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import { Inbox } from 'lucide-react';

import { useSupabase } from '@/components/providers/supabase-provider';

import { CommunicationDetailDrawer } from './CommunicationDetailDrawer';
import { MailsKpiBar } from './MailsKpiBar';
import { MessagerieCard, MessagerieTableRow } from './MessagerieRowHelpers';
import type { Communication, MessagerieFilters } from './types';

type KpiKey = 'unread' | 'replied_today' | 'linked_order' | null;

interface MessagerieClientProps {
  initialCommunications: Communication[];
  watchAddresses: string[];
  initialFilters?: MessagerieFilters;
}

const DEFAULT_FILTERS: MessagerieFilters = {
  direction: 'all',
  brand: 'all',
  kind: 'all',
  toAddress: '',
  status: 'all',
  search: '',
};

export function MessagerieClient({
  initialCommunications,
  watchAddresses,
  initialFilters,
}: MessagerieClientProps) {
  const supabase = useSupabase();
  const [communications, setCommunications] = useState<Communication[]>(
    initialCommunications
  );
  const [filters, setFilters] = useState<MessagerieFilters>({
    ...DEFAULT_FILTERS,
    ...(initialFilters ?? {}),
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
                <TableBody>
                  {items.map(c => (
                    <MessagerieTableRow key={c.id} c={c} onOpen={handleOpen} />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          renderCard={c => (
            <MessagerieCard key={c.id} c={c} onOpen={handleOpen} />
          )}
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
