/**
 * HTML email template for shipping tracking notification.
 * Reuses buildEmailHtml from email-template.ts for consistent Verone branding.
 *
 * Supports both single and multi-shipments emails. When the customer has paid
 * 2+ shipments for the same order (typical Packlink flow when items are split
 * into multiple parcels), Romeo wants ONE email that lists all trackings side
 * by side rather than N separate emails.
 */

import { buildCarrierTrackingUrl } from '@verone/orders/components/modals';

import { buildEmailHtml } from './email-template';

export interface TrackingInfo {
  trackingNumber: string;
  trackingUrl?: string | null;
  carrierName?: string | null;
  shippedAt: string | null;
}

interface TrackingEmailOptions {
  customerName: string;
  orderNumber: string;
  trackings: TrackingInfo[];
  customMessage: string;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(isoDate: string | null): string {
  if (!isoDate) return 'date non définie';
  return new Date(isoDate).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function resolveTrackingUrl(
  trackingUrl: string | null | undefined,
  carrierName: string | null | undefined,
  orderNumber: string,
  trackingNumber: string
): string {
  if (trackingUrl) return trackingUrl;
  // Fallback : URL publique du transporteur (UPS, DPD, Chronopost, ...)
  // construite depuis le numéro de tracking si reconnu.
  const carrierUrl = buildCarrierTrackingUrl(carrierName, trackingNumber);
  if (carrierUrl) return carrierUrl;
  // Dernier recours : page de tracking interne Verone (placeholder).
  return `https://www.veronecollections.fr/tracking?order=${encodeURIComponent(orderNumber)}&tracking=${encodeURIComponent(trackingNumber)}`;
}

function buildShipmentBlock(
  t: TrackingInfo,
  orderNumber: string,
  index: number,
  total: number
): string {
  const formattedDate = formatDate(t.shippedAt);
  const ctaUrl = resolveTrackingUrl(
    t.trackingUrl,
    t.carrierName,
    orderNumber,
    t.trackingNumber
  );
  const heading =
    total > 1
      ? `<p style="margin: 16px 0 6px 0; font-size: 13px; font-weight: 600; color: #6b7280; letter-spacing: 0.04em; text-transform: uppercase;">Colis ${index + 1} / ${total}</p>`
      : '';

  const infoRows = [
    t.carrierName
      ? `<tr>
          <td style="padding: 6px 0; color: #6b7280; font-size: 14px; width: 140px;">Transporteur</td>
          <td style="padding: 6px 0; font-size: 14px; font-weight: 600;">${escapeHtml(t.carrierName)}</td>
        </tr>`
      : '',
    `<tr>
      <td style="padding: 6px 0; color: #6b7280; font-size: 14px; width: 140px;">N° de suivi</td>
      <td style="padding: 6px 0; font-size: 14px; font-family: 'SFMono-Regular', Consolas, monospace; font-weight: 600; letter-spacing: 0.05em;"><a href="${ctaUrl}" style="color: #0f766e; text-decoration: none;">${escapeHtml(t.trackingNumber)}</a></td>
    </tr>`,
    `<tr>
      <td style="padding: 6px 0; color: #6b7280; font-size: 14px; width: 140px;">Date d'expédition</td>
      <td style="padding: 6px 0; font-size: 14px;">${escapeHtml(formattedDate)}</td>
    </tr>`,
  ]
    .filter(Boolean)
    .join('');

  // Bouton CTA par colis (visible quand multi-shipments).
  const ctaButton =
    total > 1
      ? `<div style="text-align: center; margin: 12px 0 4px 0;">
          <a href="${ctaUrl}"
             style="display: inline-block; background-color: #0d9488; color: #ffffff; text-decoration: none; padding: 10px 24px; border-radius: 6px; font-size: 14px; font-weight: 600; line-height: 1.2;">
            Suivre le colis ${index + 1}
          </a>
        </div>`
      : '';

  return `
    ${heading}
    <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px 20px; margin-bottom: 12px;">
      <table style="border-collapse: collapse; width: 100%;">
        ${infoRows}
      </table>
      ${ctaButton}
    </div>
  `;
}

export function buildTrackingEmailHtml(options: TrackingEmailOptions): string {
  const { customerName, orderNumber, trackings, customMessage } = options;

  if (trackings.length === 0) {
    throw new Error('buildTrackingEmailHtml: at least one tracking required');
  }

  const total = trackings.length;
  const earliestShippedAt = trackings
    .map(t => t.shippedAt)
    .filter((d): d is string => Boolean(d))
    .sort()[0];
  const introDate = earliestShippedAt ? formatDate(earliestShippedAt) : '';

  const intro =
    total > 1
      ? `<p style="margin: 0 0 20px 0; font-size: 15px;">
          Votre commande <strong>${escapeHtml(orderNumber)}</strong> a été expédiée en <strong>${total} colis</strong>${introDate ? ` à partir du ${escapeHtml(introDate)}` : ''}. Voici les numéros de suivi :
        </p>`
      : `<p style="margin: 0 0 20px 0; font-size: 15px;">
          Votre commande <strong>${escapeHtml(orderNumber)}</strong> a été expédiée${introDate ? ` le ${escapeHtml(introDate)}` : ''}.
        </p>`;

  const blocks = trackings
    .map((t, idx) => buildShipmentBlock(t, orderNumber, idx, total))
    .join('');

  const bodyHtml = `
    ${intro}
    ${blocks}
    ${
      customMessage
        ? `<div style="margin: 16px 0 0 0; white-space: pre-line; font-size: 14px; color: #374151;">
        ${escapeHtml(customMessage)}
      </div>`
        : ''
    }
  `;

  // En multi-shipments, chaque colis a son propre bouton CTA dans son
  // bloc — pas de CTA principal en bas. En mono-shipment, un seul CTA
  // principal classique.
  const isMulti = total > 1;
  const primaryCta = isMulti
    ? undefined
    : resolveTrackingUrl(
        trackings[0].trackingUrl,
        trackings[0].carrierName,
        orderNumber,
        trackings[0].trackingNumber
      );

  return buildEmailHtml({
    title: isMulti
      ? `Votre commande ${orderNumber} est en route (${total} colis)`
      : `Votre commande ${orderNumber} est en route`,
    recipientName: customerName,
    accentColor: 'teal',
    bodyHtml,
    ctaUrl: primaryCta,
    ctaLabel: isMulti ? undefined : 'Suivre ma commande',
    footerNote: `Commande ${orderNumber}`,
  });
}
