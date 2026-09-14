/**
 * Lecture du journal sourcing pour l'écran (BO-SOURCING-P4-001).
 *
 * Les entrées « changement de statut » sont écrites par
 * apply_product_lifecycle_action avec des codes de statut et un résumé au
 * format fixe (« Refusé : motif », « Retiré : motif », « … — motif ») :
 * l'écran traduit les codes et isole le motif éventuel.
 *
 * Pure : testée par __tests__/sourcing-journal.test.ts.
 */

const STATUS_LABELS: Record<string, string> = {
  need_identified: 'Besoin identifié',
  supplier_search: 'Recherche',
  initial_contact: 'Contact',
  evaluation: 'Évaluation',
  negotiation: 'Négociation',
  sample_requested: 'Échantillon demandé',
  sample_received: 'Échantillon reçu',
  sample_approved: 'Échantillon validé',
  order_placed: 'Commande passée',
  received: 'Reçu',
  on_hold: 'En pause',
  refused: 'Refusé',
  cancelled: 'Annulé',
  archived: 'Archivé',
  validated: 'Validé au catalogue',
  withdrawn: 'Retiré',
  restored: 'Restauré',
};

export function sourcingStatusLabel(status: string | null | undefined): string {
  if (!status) return 'Aucun statut';
  return STATUS_LABELS[status] ?? status;
}

export interface JournalStatusChange {
  from_status: string | null;
  to_status: string | null;
  summary: string;
}

export function statusChangeTitle(entry: JournalStatusChange): string {
  switch (entry.to_status) {
    case 'withdrawn':
    case 'restored':
    case 'refused':
    case 'validated':
    case 'on_hold':
      return sourcingStatusLabel(entry.to_status);
    default:
      return `${sourcingStatusLabel(entry.from_status)} → ${sourcingStatusLabel(entry.to_status)}`;
  }
}

export function statusChangeReason(entry: JournalStatusChange): string | null {
  const separator =
    entry.to_status === 'refused' || entry.to_status === 'withdrawn'
      ? ' : '
      : ' — ';
  const index = entry.summary.indexOf(separator);
  if (index < 0) return null;
  const reason = entry.summary.slice(index + separator.length).trim();
  return reason.length > 0 ? reason : null;
}
