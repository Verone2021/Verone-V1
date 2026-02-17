/**
 * Shared email template for all LinkMe emails
 * Provides consistent branding with Verone logo, header, footer
 */

type AccentColor = 'green' | 'red' | 'orange' | 'blue';

interface EmailTemplateOptions {
  title: string;
  recipientName: string;
  accentColor: AccentColor;
  bodyHtml: string;
  ctaUrl?: string;
  ctaLabel?: string;
  footerNote?: string;
}

const COLOR_MAP: Record<
  AccentColor,
  {
    bg: string;
    border: string;
    titleColor: string;
    footerColor: string;
    hrColor: string;
    btnBg: string;
  }
> = {
  green: {
    bg: '#ecfdf5',
    border: '#10b981',
    titleColor: '#065f46',
    footerColor: '#065f46',
    hrColor: '#a7f3d0',
    btnBg: '#059669',
  },
  red: {
    bg: '#fef2f2',
    border: '#ef4444',
    titleColor: '#991b1b',
    footerColor: '#991b1b',
    hrColor: '#fecaca',
    btnBg: '#dc2626',
  },
  orange: {
    bg: '#fffbeb',
    border: '#f59e0b',
    titleColor: '#92400e',
    footerColor: '#92400e',
    hrColor: '#fcd34d',
    btnBg: '#d97706',
  },
  blue: {
    bg: '#eff6ff',
    border: '#3b82f6',
    titleColor: '#1e40af',
    footerColor: '#1e40af',
    hrColor: '#93c5fd',
    btnBg: '#2563eb',
  },
};

// Logo hosted on production site
const LOGO_URL = 'https://www.verone.fr/logo-verone.png';

export function buildEmailHtml(options: EmailTemplateOptions): string {
  const {
    title,
    recipientName,
    accentColor,
    bodyHtml,
    ctaUrl,
    ctaLabel,
    footerNote,
  } = options;

  const colors = COLOR_MAP[accentColor];

  const ctaHtml =
    ctaUrl && ctaLabel
      ? `
    <div style="text-align: center; margin: 30px 0 16px 0;">
      <a href="${ctaUrl}"
         style="display: inline-block; background-color: ${colors.btnBg}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: bold; line-height: 1.2;">
        ${ctaLabel}
      </a>
    </div>`
      : '';

  const footerNoteHtml = footerNote
    ? `<p style="color: ${colors.footerColor}; font-size: 13px; text-align: center; margin: 8px 0 0 0;">${footerNote}</p>`
    : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f9fafb;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <!-- Logo -->
    <div style="text-align: center; padding: 24px 0 16px 0;">
      <img src="${LOGO_URL}" alt="Verone" style="height: 40px; width: auto;" />
    </div>

    <!-- Main card -->
    <div style="background-color: ${colors.bg}; padding: 30px; border-radius: 8px; border-left: 4px solid ${colors.border};">
      <h1 style="color: ${colors.titleColor}; font-size: 22px; margin: 0 0 20px 0;">
        ${title}
      </h1>

      <p style="margin: 0 0 20px 0;">
        Bonjour ${recipientName},
      </p>

      ${bodyHtml}

      ${ctaHtml}

      ${footerNoteHtml}
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 24px 0;">
      <p style="color: #6b7280; font-size: 13px; margin: 0 0 4px 0;">
        Verone &mdash; D&eacute;coration et mobilier d&rsquo;int&eacute;rieur
      </p>
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
        <a href="mailto:commandes@verone.fr" style="color: #9ca3af; text-decoration: none;">commandes@verone.fr</a>
        &nbsp;&middot;&nbsp; &copy; 2026
      </p>
    </div>
  </div>
</body>
</html>`;
}
