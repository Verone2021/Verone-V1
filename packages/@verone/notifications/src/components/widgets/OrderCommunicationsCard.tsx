'use client';

/**
 * OrderCommunicationsCard — Carte timeline des communications (mails entrants
 * + sortants) liées à une commande (BO-MSG-018).
 *
 * Composant additif à insérer dans la page commande détail. Aucune
 * modification du reste de la page. Utilise le hook `useCommunications`
 * avec filtre `salesOrderId`.
 *
 * Affiche :
 *   - Mails Gmail reçus liés à la commande (via linked_order_id)
 *   - Devis / factures envoyés (document_emails)
 *   - Demandes d'infos LinkMe (linkme_info_requests)
 *   - Consultations envoyées (consultation_emails) si rattachées
 */

import Link from 'next/link';

import {
  ArrowDownLeft,
  ArrowUpRight,
  ExternalLink,
  FileText,
  Inbox,
  Loader2,
  MessageCircle,
  Paperclip,
  Receipt,
  HelpCircle,
} from 'lucide-react';

import { useCommunications, type Communication } from '../../hooks';

interface OrderCommunicationsCardProps {
  salesOrderId: string;
  /** Optionnel : limite l'affichage (défaut 20). */
  limit?: number;
  /** Optionnel : URL du HUB messagerie pour le lien "Voir tout". */
  hubHref?: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getKindLabel(kind: Communication['kind']): {
  label: string;
  Icon: typeof FileText;
} {
  const config: Record<
    Communication['kind'],
    { label: string; Icon: typeof FileText }
  > = {
    inbound_email: { label: 'Mail reçu', Icon: Inbox },
    document_quote: { label: 'Devis envoyé', Icon: FileText },
    document_invoice: { label: 'Facture envoyée', Icon: Receipt },
    document_proforma: { label: 'Proforma envoyée', Icon: Receipt },
    document_credit_note: { label: 'Avoir envoyé', Icon: Receipt },
    consultation: { label: 'Consultation envoyée', Icon: MessageCircle },
    info_request: { label: "Demande d'infos envoyée", Icon: HelpCircle },
  };
  return config[kind] ?? { label: kind, Icon: FileText };
}

export function OrderCommunicationsCard({
  salesOrderId,
  limit = 20,
  hubHref,
}: OrderCommunicationsCardProps): JSX.Element {
  const { communications, loading, error } = useCommunications({
    salesOrderId,
    limit,
  });

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-900">
            Communications
          </h3>
          {communications.length > 0 && (
            <span className="text-xs text-gray-500">
              ({communications.length})
            </span>
          )}
        </div>
        {hubHref && (
          <Link
            href={hubHref}
            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
          >
            Voir tout
            <ExternalLink className="h-3 w-3" />
          </Link>
        )}
      </div>

      {/* Body */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          <span className="ml-2 text-xs text-gray-500">Chargement…</span>
        </div>
      ) : error ? (
        <div className="px-4 py-6 text-center">
          <p className="text-xs text-red-600">Erreur : {error}</p>
        </div>
      ) : communications.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <Inbox className="mx-auto h-8 w-8 text-gray-300 mb-2" />
          <p className="text-xs text-gray-500">
            Aucun mail lié à cette commande pour le moment
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {communications.map(c => {
            const { label, Icon } = getKindLabel(c.kind);
            const isReceived = c.direction === 'received';
            const counterparty =
              c.counterparty_name && c.counterparty_name.trim() !== ''
                ? c.counterparty_name
                : c.counterparty_email;
            return (
              <li
                key={c.id}
                className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-shrink-0 mt-0.5">
                  {isReceived ? (
                    <ArrowDownLeft className="h-4 w-4 text-blue-600" />
                  ) : (
                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Icon className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                    <span className="text-xs uppercase tracking-wide text-gray-500">
                      {label}
                    </span>
                    {c.has_attachments && (
                      <Paperclip className="h-3 w-3 text-gray-400" />
                    )}
                  </div>
                  <p
                    className="text-sm text-gray-900 truncate"
                    title={c.subject ?? ''}
                  >
                    {c.subject ?? '(sans objet)'}
                  </p>
                  <p
                    className="text-xs text-gray-500 truncate"
                    title={c.counterparty_email}
                  >
                    {isReceived ? 'De ' : 'À '}
                    {counterparty}
                  </p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-xs text-gray-500 whitespace-nowrap">
                    {formatDate(c.event_at)}
                  </p>
                  {c.status &&
                    c.status !== 'sent' &&
                    c.status !== 'received' && (
                      <p className="text-xs text-gray-400 mt-0.5">{c.status}</p>
                    )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
