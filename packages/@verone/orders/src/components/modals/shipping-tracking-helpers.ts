/**
 * Pure helper functions (no React) for the SendShippingTrackingModal.
 * Extracted to keep the modal under 400 lines.
 */

import type { EmailContact } from '@verone/finance/components';

// ── Types ──────────────────────────────────────────────────────────────

export interface ShipmentPreviewOptions {
  customerName: string;
  orderNumber: string;
  carrierName: string | null;
  trackingNumber: string | null;
  trackingUrl?: string | null;
  shippedAt: string | null;
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

export function buildDefaultSubject(orderNumber: string): string {
  return `Votre commande ${orderNumber} est en route !`;
}

// ── buildDefaultMessage ────────────────────────────────────────────────

export function buildDefaultMessage({
  orderNumber,
  carrierName,
  trackingNumber,
  shippedAt,
}: {
  orderNumber: string;
  carrierName: string | null;
  trackingNumber: string | null;
  shippedAt: string | null;
}): string {
  const lines: string[] = [];
  lines.push(
    `Votre commande ${orderNumber} a été expédiée le ${formatDateFr(shippedAt)}.`
  );
  lines.push('');
  if (carrierName) {
    lines.push(`Transporteur : ${carrierName}`);
  }
  if (trackingNumber) {
    lines.push(`Numéro de suivi : ${trackingNumber}`);
  }
  lines.push('');
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

export function buildPreviewHtml({
  orderNumber,
  carrierName,
  trackingNumber,
  trackingUrl,
  shippedAt,
  customMessage,
}: ShipmentPreviewOptions): string {
  const resolvedTrackingUrl =
    trackingUrl ??
    (trackingNumber
      ? `https://www.veronecollections.fr/tracking?order=${encodeURIComponent(orderNumber)}&tracking=${encodeURIComponent(trackingNumber)}`
      : null);

  const safeOrderNumber = escapeHtml(orderNumber);
  const safeCarrierName = carrierName ? escapeHtml(carrierName) : null;
  const safeTrackingNumber = trackingNumber ? escapeHtml(trackingNumber) : null;
  const safeShippedAt = escapeHtml(formatDateFr(shippedAt));
  const safeMessage = escapeHtml(customMessage);

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

  const ctaHtml = resolvedTrackingUrl
    ? `<div style="text-align:center;margin:24px 0 16px 0;"><a href="${escapeHtml(resolvedTrackingUrl)}" style="display:inline-block;background-color:#0d9488;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:bold;">Suivre ma commande</a></div>`
    : '';

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:sans-serif;line-height:1.6;color:#333;padding:20px;background:#f9fafb;">
    <div style="max-width:560px;margin:0 auto;">
      <div style="background:#f0fdfa;padding:24px;border-radius:8px;border-left:4px solid #5DBEBB;">
        <h2 style="color:#0f766e;margin:0 0 16px 0;">Votre commande ${safeOrderNumber} est en route</h2>
        <p style="margin:0 0 16px 0;">Bonjour,</p>
        <p style="margin:0 0 16px 0;">Votre commande <strong>${safeOrderNumber}</strong> a été expédiée le ${safeShippedAt}.</p>
        <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:12px 16px;margin-bottom:16px;">
          <table style="border-collapse:collapse;width:100%;">${rows}</table>
        </div>
        <div style="white-space:pre-line;font-size:14px;color:#374151;margin-bottom:16px;">${safeMessage}</div>
        ${ctaHtml}
      </div>
    </div>
  </body></html>`;
}
