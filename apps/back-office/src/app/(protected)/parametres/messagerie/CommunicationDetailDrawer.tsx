'use client';

/**
 * CommunicationDetailDrawer — Drawer latéral pour le détail d'une
 * communication unifiée (BO-MSG-018).
 *
 * Affiche aussi bien un mail entrant Gmail qu'un devis/facture/consultation
 * /demande infos sortants. HTML rendu en iframe sandboxed pour les inbound,
 * texte brut pour les sortants Resend.
 */

import { useCallback } from 'react';

import Link from 'next/link';

import {
  Badge,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@verone/ui';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ExternalLink,
  FileText,
  Paperclip,
  User,
} from 'lucide-react';

import type { Communication } from './types';

interface CommunicationDetailDrawerProps {
  communication: Communication | null;
  open: boolean;
  onClose: () => void;
  onToggleRead: (comm: Communication) => void;
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

function getKindLabel(kind: Communication['kind']): string {
  const labels: Record<Communication['kind'], string> = {
    inbound_email: 'Mail reçu',
    document_quote: 'Devis envoyé',
    document_invoice: 'Facture envoyée',
    document_proforma: 'Proforma envoyée',
    document_credit_note: 'Avoir envoyé',
    consultation: 'Consultation envoyée',
    info_request: 'Demande d’infos envoyée',
  };
  return labels[kind] ?? kind;
}

export function CommunicationDetailDrawer({
  communication,
  open,
  onClose,
  onToggleRead,
}: CommunicationDetailDrawerProps) {
  const handleToggleRead = useCallback(() => {
    if (communication) onToggleRead(communication);
  }, [communication, onToggleRead]);

  if (!communication) return null;

  const c = communication;
  const isReceived = c.direction === 'received';
  const counterparty =
    c.counterparty_name && c.counterparty_name.trim() !== ''
      ? c.counterparty_name
      : c.counterparty_email;

  return (
    <Sheet open={open} onOpenChange={open ? onClose : undefined}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl flex flex-col h-screen overflow-hidden p-0"
      >
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                {isReceived ? (
                  <ArrowDownLeft className="h-4 w-4 text-blue-600 flex-shrink-0" />
                ) : (
                  <ArrowUpRight className="h-4 w-4 text-green-600 flex-shrink-0" />
                )}
                <span className="text-xs text-gray-500 uppercase tracking-wide">
                  {getKindLabel(c.kind)}
                </span>
              </div>
              <SheetTitle className="text-base font-semibold leading-tight line-clamp-2">
                {c.subject ?? '(sans objet)'}
              </SheetTitle>
            </div>
            {c.brand && (
              <Badge
                variant={c.brand === 'verone' ? 'default' : 'info'}
                size="sm"
                className="flex-shrink-0"
              >
                {c.brand === 'verone' ? 'Vérone' : 'LinkMe'}
              </Badge>
            )}
          </div>
        </SheetHeader>

        {/* Méta */}
        <div className="px-6 py-3 border-b flex-shrink-0 space-y-1.5 text-sm">
          <div className="flex items-center gap-2 text-gray-700">
            <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="font-medium truncate">{counterparty}</span>
            {c.counterparty_name && (
              <span className="text-gray-500 text-xs truncate">
                &lt;{c.counterparty_email}&gt;
              </span>
            )}
          </div>
          {c.our_address && (
            <div className="flex items-center gap-2 text-gray-500">
              <span className="text-xs">
                {isReceived ? 'À :' : 'De :'} {c.our_address}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs text-gray-500">
              {formatDate(c.event_at)}
            </span>
            <div className="flex items-center gap-2">
              {c.has_attachments && (
                <Paperclip className="h-4 w-4 text-gray-400" />
              )}
              {c.sales_order_number && c.sales_order_id && (
                <Link
                  href={`/commandes/clients/${c.sales_order_id}`}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  {c.sales_order_number}
                </Link>
              )}
              {c.consultation_id && !c.sales_order_id && (
                <Link
                  href={`/consultations/${c.consultation_id}`}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  Consultation
                </Link>
              )}
              {c.document_number && (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <FileText className="h-3 w-3" />
                  {c.document_number}
                </span>
              )}
            </div>
          </div>
          {c.status && c.status !== 'sent' && c.status !== 'received' && (
            <div className="text-xs text-gray-500">
              Statut : <span className="font-medium">{c.status}</span>
            </div>
          )}
          {c.error_message && (
            <div className="text-xs text-red-600">
              Erreur : {c.error_message}
            </div>
          )}
        </div>

        {/* Corps */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {c.body_html ? (
            <iframe
              srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:sans-serif;font-size:14px;color:#111;line-height:1.6;margin:0;padding:0}a{color:#2563eb}img{max-width:100%;height:auto}</style></head><body>${c.body_html}</body></html>`}
              sandbox="allow-popups allow-popups-to-escape-sandbox"
              className="w-full min-h-[400px] border-0"
              title="Contenu de la communication"
            />
          ) : c.body_text ? (
            <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">
              {c.body_text}
            </pre>
          ) : c.preview ? (
            <p className="text-sm text-gray-600 italic">{c.preview}</p>
          ) : (
            <p className="text-sm text-gray-400">Aucun contenu disponible.</p>
          )}

          {/* Pièces jointes (sortants) */}
          {c.attachments &&
            Array.isArray(c.attachments) &&
            c.attachments.length > 0 && (
              <div className="mt-6 pt-4 border-t">
                <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-2">
                  Pièces jointes
                </h3>
                <ul className="space-y-1">
                  {c.attachments.map((att, idx) => (
                    <li
                      key={idx}
                      className="flex items-center gap-2 text-sm text-gray-700"
                    >
                      <Paperclip className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{att.filename}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex-shrink-0 flex items-center justify-between gap-2">
          {isReceived && (
            <button
              onClick={handleToggleRead}
              className="text-sm text-gray-600 hover:text-gray-900 underline"
            >
              Marquer comme {c.is_read ? 'non-lu' : 'lu'}
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
