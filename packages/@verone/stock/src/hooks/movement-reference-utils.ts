/**
 * Utilitaires pour formatter les références de mouvements de stock
 * en labels lisibles (numéros de commande + noms de client/fournisseur).
 *
 * Sprint : BO-UI-PROD-STOCK-002
 */

import type { StockReasonCode } from './stock-movements-types';

// ─── Types publics ────────────────────────────────────────────────────────────

export interface MovementReferenceLabel {
  /** Texte principal, ex. "SO-2026-00117" */
  label: string;
  /** Texte secondaire, ex. "Julie Martin · Vente client" */
  sublabel?: string;
  type:
    | 'sale'
    | 'purchase'
    | 'adjustment'
    | 'reconciliation'
    | 'aggregate'
    | 'unknown';
}

export interface MovementReferenceEnrichment {
  salesOrder?: {
    order_number: string;
    customer_name: string | null;
  } | null;
  purchaseOrder?: {
    po_number: string;
    supplier_name: string | null;
  } | null;
}

// ─── Helpers internes ─────────────────────────────────────────────────────────

/**
 * Extrait le numéro SO depuis la note (fallback).
 * Ex. "Expédition commande client SO #SO-2026-00117" → "SO-2026-00117"
 */
function extractSoFromNote(note: string | undefined): string | null {
  if (!note) return null;
  const match = /SO #(\S+)/.exec(note);
  return match ? (match[1] ?? null) : null;
}

/**
 * Extrait le numéro PO depuis la note (fallback).
 * Ex. "Réception commande fournisseur PO #20135179" → "20135179"
 */
function extractPoFromNote(note: string | undefined): string | null {
  if (!note) return null;
  const match = /PO #(\S+)/.exec(note);
  return match ? (match[1] ?? null) : null;
}

/**
 * Compte les commandes agrégées dans une note sales_aggregate.
 * Ex. "LINK-XXX(50)+F-25-039(30)+..." → 3
 */
function countAggregateOrders(note: string | undefined): number {
  if (!note) return 0;
  // Chaque commande est séparée par "+"
  return note.split('+').filter(s => s.trim().length > 0).length;
}

/**
 * Extrait la date CSV depuis une note inventory_reconciliation.
 * Ex. "Import CSV 2025-12-15" → "2025-12-15"
 */
function extractCsvDate(note: string | undefined): string | null {
  if (!note) return null;
  const match = /Import CSV (\S+)/.exec(note);
  return match ? (match[1] ?? null) : null;
}

// ─── Fonction principale ──────────────────────────────────────────────────────

export function formatMovementReference(
  movement: {
    reference_type?: string;
    reference_id?: string;
    notes?: string;
    reason_code?: StockReasonCode;
  },
  enrichment?: MovementReferenceEnrichment
): MovementReferenceLabel {
  const { reference_type, notes, reason_code } = movement;

  switch (reference_type) {
    case 'shipment': {
      const orderNumber =
        enrichment?.salesOrder?.order_number ?? extractSoFromNote(notes);
      const customerName = enrichment?.salesOrder?.customer_name ?? null;

      if (!orderNumber) {
        return {
          label: 'Expédition client',
          sublabel: customerName ?? undefined,
          type: 'sale',
        };
      }

      return {
        label: orderNumber,
        sublabel: customerName ?? undefined,
        type: 'sale',
      };
    }

    case 'sales_order_forecast': {
      const orderNumber =
        enrichment?.salesOrder?.order_number ?? extractSoFromNote(notes);
      const customerName = enrichment?.salesOrder?.customer_name ?? null;

      if (!orderNumber) {
        return {
          label: 'Commande prévisionnelle',
          sublabel: customerName ?? undefined,
          type: 'sale',
        };
      }

      return {
        label: orderNumber,
        sublabel:
          customerName != null
            ? `${customerName} · Prévisionnel`
            : 'Prévisionnel',
        type: 'sale',
      };
    }

    case 'sale': {
      const orderNumber =
        enrichment?.salesOrder?.order_number ?? extractSoFromNote(notes);
      const customerName = enrichment?.salesOrder?.customer_name ?? null;

      if (!orderNumber) {
        return {
          label: 'Vente client',
          sublabel: customerName ?? undefined,
          type: 'sale',
        };
      }

      return {
        label: orderNumber,
        sublabel: customerName ?? undefined,
        type: 'sale',
      };
    }

    case 'reception': {
      const poNumber =
        enrichment?.purchaseOrder?.po_number ?? extractPoFromNote(notes);
      const supplierName = enrichment?.purchaseOrder?.supplier_name ?? null;

      if (!poNumber) {
        return {
          label: 'Réception fournisseur',
          sublabel: supplierName ?? undefined,
          type: 'purchase',
        };
      }

      return {
        label: poNumber,
        sublabel: supplierName ?? undefined,
        type: 'purchase',
      };
    }

    case 'sales_aggregate': {
      const count = countAggregateOrders(notes);
      return {
        label: 'Ventes agrégées',
        sublabel:
          count > 0 ? `${count} commande${count > 1 ? 's' : ''}` : undefined,
        type: 'aggregate',
      };
    }

    case 'manual_adjustment': {
      if (reason_code === 'inventory_correction') {
        return {
          label: 'Correction inventaire',
          type: 'adjustment',
        };
      }
      return {
        label: 'Ajustement manuel',
        type: 'adjustment',
      };
    }

    case 'inventory_reconciliation': {
      const csvDate = extractCsvDate(notes);
      return {
        label: csvDate != null ? `Inventaire ${csvDate}` : 'Inventaire',
        sublabel: 'correction CSV',
        type: 'reconciliation',
      };
    }

    default: {
      if (!reference_type) {
        return { label: '—', type: 'unknown' };
      }
      // Capitalise le reference_type brut comme fallback lisible
      const capitalized =
        reference_type.charAt(0).toUpperCase() +
        reference_type.slice(1).replace(/_/g, ' ');
      return { label: capitalized, type: 'unknown' };
    }
  }
}
