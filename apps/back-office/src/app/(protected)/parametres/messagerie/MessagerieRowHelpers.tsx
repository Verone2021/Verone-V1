'use client';

/**
 * Helpers de rendu pour MessagerieClient (BO-MSG-018).
 * Extraits pour respecter la limite max-lines de 500 sans disable.
 */

import Link from 'next/link';

import { Badge, TableCell, TableRow } from '@verone/ui';
import { cn } from '@verone/utils';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ExternalLink,
  FileText,
  HelpCircle,
  Inbox,
  MessageCircle,
  Paperclip,
  Receipt,
} from 'lucide-react';

import type { Communication } from './types';

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function BrandBadge({
  brand,
}: {
  brand: Communication['brand'];
}): JSX.Element | null {
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

export function DirectionIcon({
  direction,
}: {
  direction: Communication['direction'];
}): JSX.Element {
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

export function KindLabel({
  kind,
}: {
  kind: Communication['kind'];
}): JSX.Element {
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

export function getCounterpartyDisplay(comm: Communication): string {
  if (comm.counterparty_name && comm.counterparty_name.trim() !== '') {
    return comm.counterparty_name;
  }
  return comm.counterparty_email;
}

interface MessagerieTableRowProps {
  c: Communication;
  onOpen: (c: Communication) => void;
}

export function MessagerieTableRow({
  c,
  onOpen,
}: MessagerieTableRowProps): JSX.Element {
  const counterparty = getCounterpartyDisplay(c);
  const isUnread = c.direction === 'received' && !c.is_read;
  return (
    <TableRow
      className={cn(
        'cursor-pointer hover:bg-gray-50 transition-colors',
        isUnread && 'bg-blue-50/50 font-semibold'
      )}
      onClick={() => onOpen(c)}
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
}

interface MessagerieCardProps {
  c: Communication;
  onOpen: (c: Communication) => void;
}

export function MessagerieCard({
  c,
  onOpen,
}: MessagerieCardProps): JSX.Element {
  const counterparty = getCounterpartyDisplay(c);
  const isUnread = c.direction === 'received' && !c.is_read;
  return (
    <div
      className={cn(
        'bg-white rounded-lg border border-gray-200 p-4 cursor-pointer hover:shadow-sm transition-shadow',
        isUnread && 'border-l-4 border-l-blue-500'
      )}
      onClick={() => onOpen(c)}
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
}
