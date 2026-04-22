/**
 * HTML email template for shipping tracking notification.
 * Reuses buildEmailHtml from email-template.ts for consistent Verone branding.
 */

import { buildEmailHtml } from './email-template';

interface TrackingEmailOptions {
  customerName: string;
  orderNumber: string;
  trackingNumber: string;
  trackingUrl?: string | null;
  carrierName?: string | null;
  shippedAt: string | null;
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
  orderNumber: string,
  trackingNumber: string
): string {
  if (trackingUrl) return trackingUrl;
  return `https://www.veronecollections.fr/tracking?order=${encodeURIComponent(orderNumber)}&tracking=${encodeURIComponent(trackingNumber)}`;
}

export function buildTrackingEmailHtml(options: TrackingEmailOptions): string {
  const {
    customerName,
    orderNumber,
    trackingNumber,
    trackingUrl,
    carrierName,
    shippedAt,
    customMessage,
  } = options;

  const ctaUrl = resolveTrackingUrl(trackingUrl, orderNumber, trackingNumber);
  const formattedDate = formatDate(shippedAt);

  const infoRows = [
    carrierName
      ? `<tr>
          <td style="padding: 6px 0; color: #6b7280; font-size: 14px; width: 140px;">Transporteur</td>
          <td style="padding: 6px 0; font-size: 14px; font-weight: 600;">${escapeHtml(carrierName)}</td>
        </tr>`
      : '',
    `<tr>
      <td style="padding: 6px 0; color: #6b7280; font-size: 14px; width: 140px;">N° de suivi</td>
      <td style="padding: 6px 0; font-size: 14px; font-family: 'SFMono-Regular', Consolas, monospace; font-weight: 600; letter-spacing: 0.05em;">${escapeHtml(trackingNumber)}</td>
    </tr>`,
    `<tr>
      <td style="padding: 6px 0; color: #6b7280; font-size: 14px; width: 140px;">Date d'expédition</td>
      <td style="padding: 6px 0; font-size: 14px;">${escapeHtml(formattedDate)}</td>
    </tr>`,
  ]
    .filter(Boolean)
    .join('');

  const bodyHtml = `
    <p style="margin: 0 0 20px 0; font-size: 15px;">
      Votre commande <strong>${escapeHtml(orderNumber)}</strong> a été expédiée le ${escapeHtml(formattedDate)}.
    </p>

    <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px 20px; margin-bottom: 20px;">
      <table style="border-collapse: collapse; width: 100%;">
        ${infoRows}
      </table>
    </div>

    ${
      customMessage
        ? `<div style="margin-bottom: 20px; white-space: pre-line; font-size: 14px; color: #374151;">
        ${escapeHtml(customMessage)}
      </div>`
        : ''
    }
  `;

  return buildEmailHtml({
    title: `Votre commande ${orderNumber} est en route`,
    recipientName: customerName,
    accentColor: 'teal',
    bodyHtml,
    ctaUrl,
    ctaLabel: 'Suivre ma commande',
    footerNote: `Commande ${orderNumber}`,
  });
}
