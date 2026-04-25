/**
 * Pure helper functions (no React) for the SendShippingTrackingModal.
 * Extracted to keep the modal under 400 lines.
 */

import type { EmailContact } from '@verone/finance/components';

// ── Types ──────────────────────────────────────────────────────────────

/** Une expédition individuelle exposée au modal et ses helpers. */
export interface ShipmentForEmail {
  id: string;
  tracking_number: string | null;
  tracking_url: string | null;
  carrier_name: string | null;
  shipped_at: string | null;
}

export interface ShipmentPreviewOptions {
  customerName: string;
  orderNumber: string;
  shipments: ShipmentForEmail[];
  customMessage: string;
}

export interface OrderForContacts {
  responsable_contact?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  } | null;
  delivery_contact?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  } | null;
  billing_contact?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  } | null;
  organisations?: {
    id: string;
    email: string | null;
    trade_name: string | null;
  } | null;
  individual_customers?: {
    id: string;
    email: string | null;
    first_name: string | null;
    last_name: string | null;
  } | null;
}

// ── escapeHtml ─────────────────────────────────────────────────────────

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ── formatDateFr ───────────────────────────────────────────────────────

export function formatDateFr(date: string | null): string {
  if (!date) return 'date non définie';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// ── buildContactList ───────────────────────────────────────────────────

export function buildContactList(order: OrderForContacts): EmailContact[] {
  const candidates: (EmailContact | null)[] = [
    order.responsable_contact?.email
      ? {
          id: order.responsable_contact.id,
          name:
            `${order.responsable_contact.first_name ?? ''} ${order.responsable_contact.last_name ?? ''}`.trim() ||
            order.responsable_contact.email,
          email: order.responsable_contact.email,
          role: 'Responsable',
        }
      : null,
    order.delivery_contact?.email
      ? {
          id: order.delivery_contact.id,
          name:
            `${order.delivery_contact.first_name ?? ''} ${order.delivery_contact.last_name ?? ''}`.trim() ||
            order.delivery_contact.email,
          email: order.delivery_contact.email,
          role: 'Livraison',
        }
      : null,
    order.billing_contact?.email
      ? {
          id: order.billing_contact.id,
          name:
            `${order.billing_contact.first_name ?? ''} ${order.billing_contact.last_name ?? ''}`.trim() ||
            order.billing_contact.email,
          email: order.billing_contact.email,
          role: 'Facturation',
        }
      : null,
    order.organisations?.email
      ? {
          id: `org-${order.organisations.id}`,
          name: order.organisations.trade_name ?? 'Organisation',
          email: order.organisations.email,
          role: 'Organisation',
        }
      : null,
    order.individual_customers?.email
      ? {
          id: `ind-${order.individual_customers.id}`,
          name:
            `${order.individual_customers.first_name ?? ''} ${order.individual_customers.last_name ?? ''}`.trim() ||
            order.individual_customers.email,
          email: order.individual_customers.email,
          role: 'Particulier',
        }
      : null,
  ];

  const seen = new Set<string>();
  const unique: EmailContact[] = [];
  for (const c of candidates) {
    if (c && !seen.has(c.email.toLowerCase())) {
      seen.add(c.email.toLowerCase());
      unique.push(c);
    }
  }
  return unique;
}

// ── buildDefaultSubject ────────────────────────────────────────────────

export function buildDefaultSubject(
  orderNumber: string,
  shipmentCount = 1
): string {
  if (shipmentCount > 1) {
    return `Votre commande ${orderNumber} est en route (${shipmentCount} colis) !`;
  }
  return `Votre commande ${orderNumber} est en route !`;
}

// ── buildDefaultMessage ────────────────────────────────────────────────

export function buildDefaultMessage({
  orderNumber,
  shipments,
}: {
  orderNumber: string;
  shipments: ShipmentForEmail[];
}): string {
  const lines: string[] = [];
  if (shipments.length > 1) {
    lines.push(
      `Votre commande ${orderNumber} a été expédiée en ${shipments.length} colis :`
    );
  } else {
    const s = shipments[0];
    lines.push(
      `Votre commande ${orderNumber} a été expédiée le ${formatDateFr(s?.shipped_at ?? null)}.`
    );
  }
  lines.push('');
  for (const [idx, s] of shipments.entries()) {
    if (shipments.length > 1) {
      lines.push(`Colis ${idx + 1} — expédié le ${formatDateFr(s.shipped_at)}`);
    }
    if (s.carrier_name) {
      lines.push(`  Transporteur : ${s.carrier_name}`);
    }
    if (s.tracking_number) {
      lines.push(`  Numéro de suivi : ${s.tracking_number}`);
    }
    if (shipments.length > 1) {
      lines.push('');
    }
  }
  if (shipments.length === 1) {
    lines.push('');
  }
  lines.push(
    'Vous pouvez suivre votre livraison en cliquant sur le lien ci-dessous.'
  );
  lines.push('');
  lines.push(
    "N'hésitez pas à nous contacter si vous avez la moindre question."
  );
  return lines.join('\n');
}

// ── buildPreviewHtml ───────────────────────────────────────────────────
// ALL user-controlled fields are escaped via escapeHtml() to prevent XSS.

function buildShipmentBlock(
  s: ShipmentForEmail,
  orderNumber: string,
  index: number,
  total: number
): string {
  const safeCarrierName = s.carrier_name ? escapeHtml(s.carrier_name) : null;
  const safeTrackingNumber = s.tracking_number
    ? escapeHtml(s.tracking_number)
    : null;
  const safeShippedAt = escapeHtml(formatDateFr(s.shipped_at));

  const rows = [
    safeCarrierName
      ? `<tr><td style="padding:6px 0;color:#6b7280;font-size:14px;width:140px;">Transporteur</td><td style="padding:6px 0;font-size:14px;font-weight:600;">${safeCarrierName}</td></tr>`
      : '',
    safeTrackingNumber
      ? `<tr><td style="padding:6px 0;color:#6b7280;font-size:14px;width:140px;">N° de suivi</td><td style="padding:6px 0;font-size:14px;font-family:monospace;font-weight:600;">${safeTrackingNumber}</td></tr>`
      : '',
    `<tr><td style="padding:6px 0;color:#6b7280;font-size:14px;width:140px;">Date d'expédition</td><td style="padding:6px 0;font-size:14px;">${safeShippedAt}</td></tr>`,
  ]
    .filter(Boolean)
    .join('');

  const heading =
    total > 1
      ? `<p style="margin:16px 0 6px 0;font-size:13px;font-weight:600;color:#6b7280;letter-spacing:0.04em;text-transform:uppercase;">Colis ${index + 1} / ${total}</p>`
      : '';

  return `${heading}<div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:12px 16px;margin-bottom:12px;"><table style="border-collapse:collapse;width:100%;">${rows}</table></div>`;
}

export function buildPreviewHtml({
  orderNumber,
  shipments,
  customMessage,
}: ShipmentPreviewOptions): string {
  if (shipments.length === 0) {
    return "<p>Aucune expédition sélectionnée pour l'aperçu.</p>";
  }
  const total = shipments.length;
  const safeOrderNumber = escapeHtml(orderNumber);
  const safeMessage = escapeHtml(customMessage);

  const earliest = shipments
    .map(s => s.shipped_at)
    .filter((d): d is string => Boolean(d))
    .sort()[0];
  const safeEarliestDate = earliest
    ? escapeHtml(formatDateFr(earliest))
    : escapeHtml(formatDateFr(null));

  const intro =
    total > 1
      ? `<p style="margin:0 0 16px 0;">Votre commande <strong>${safeOrderNumber}</strong> a été expédiée en <strong>${total} colis</strong>${earliest ? ` à partir du ${safeEarliestDate}` : ''}.</p>`
      : `<p style="margin:0 0 16px 0;">Votre commande <strong>${safeOrderNumber}</strong> a été expédiée${earliest ? ` le ${safeEarliestDate}` : ''}.</p>`;

  const blocks = shipments
    .map((s, idx) => buildShipmentBlock(s, orderNumber, idx, total))
    .join('');

  // CTA pointe vers le 1er tracking_url s'il existe (ou la page tracking
  // Verone par défaut).
  const first = shipments[0];
  const ctaUrl =
    first.tracking_url ??
    (first.tracking_number
      ? `https://www.veronecollections.fr/tracking?order=${encodeURIComponent(orderNumber)}&tracking=${encodeURIComponent(first.tracking_number)}`
      : null);

  const ctaHtml = ctaUrl
    ? `<div style="text-align:center;margin:24px 0 16px 0;"><a href="${escapeHtml(ctaUrl)}" style="display:inline-block;background-color:#0d9488;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:bold;">${total > 1 ? 'Suivre le 1er colis' : 'Suivre ma commande'}</a></div>`
    : '';

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:sans-serif;line-height:1.6;color:#333;padding:20px;background:#f9fafb;">
    <div style="max-width:560px;margin:0 auto;">
      <div style="background:#f0fdfa;padding:24px;border-radius:8px;border-left:4px solid #5DBEBB;">
        <h2 style="color:#0f766e;margin:0 0 16px 0;">${total > 1 ? `Votre commande ${safeOrderNumber} est en route (${total} colis)` : `Votre commande ${safeOrderNumber} est en route`}</h2>
        <p style="margin:0 0 16px 0;">Bonjour,</p>
        ${intro}
        ${blocks}
        <div style="white-space:pre-line;font-size:14px;color:#374151;margin-bottom:16px;">${safeMessage}</div>
        ${ctaHtml}
      </div>
    </div>
  </body></html>`;
}
