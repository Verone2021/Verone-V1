/**
 * Shared email template for Vérone site-internet
 * Branding: noir/blanc, Playfair Display, tons sobres
 */

type AccentColor = 'green' | 'black' | 'blue' | 'gold';

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
    btnBg: string;
  }
> = {
  black: {
    bg: '#fafafa',
    border: '#1a1a1a',
    titleColor: '#1a1a1a',
    btnBg: '#1a1a1a',
  },
  green: {
    bg: '#f0fdf4',
    border: '#16a34a',
    titleColor: '#14532d',
    btnBg: '#16a34a',
  },
  blue: {
    bg: '#eff6ff',
    border: '#2563eb',
    titleColor: '#1e3a8a',
    btnBg: '#2563eb',
  },
  gold: {
    bg: '#fffbeb',
    border: '#b8860b',
    titleColor: '#78350f',
    btnBg: '#b8860b',
  },
};

export function buildVeroneEmailHtml(options: EmailTemplateOptions): string {
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
         style="display: inline-block; background-color: ${colors.btnBg}; color: #ffffff; text-decoration: none; padding: 14px 36px; font-size: 14px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; line-height: 1.2;">
        ${ctaLabel}
      </a>
    </div>`
      : '';

  const footerNoteHtml = footerNote
    ? `<p style="color: #6b7280; font-size: 12px; text-align: center; margin: 12px 0 0 0;">${footerNote}</p>`
    : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Georgia', 'Times New Roman', serif; line-height: 1.7; color: #1a1a1a; margin: 0; padding: 0; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <!-- Logo -->
    <div style="text-align: center; padding: 32px 0 24px 0;">
      <img src="cid:verone-logo" alt="V&Eacute;RONE" width="180" height="60" style="display: inline-block; max-width: 180px; height: auto;" />
      <p style="font-size: 11px; color: #9ca3af; letter-spacing: 2px; margin: 4px 0 0 0; text-transform: uppercase;">Concept Store D&eacute;co</p>
    </div>

    <!-- Main card -->
    <div style="background-color: #ffffff; padding: 40px 36px; border-top: 3px solid ${colors.border};">
      <h1 style="color: ${colors.titleColor}; font-size: 22px; font-weight: 600; margin: 0 0 24px 0; font-family: 'Georgia', serif;">
        ${title}
      </h1>

      <p style="margin: 0 0 20px 0; font-size: 15px; color: #374151;">
        Bonjour ${recipientName},
      </p>

      ${bodyHtml}

      ${ctaHtml}

      ${footerNoteHtml}
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 28px 0;">
      <p style="color: #6b7280; font-size: 12px; margin: 0 0 4px 0;">
        V&eacute;rone &mdash; 229 rue Saint-Honor&eacute;, 75001 Paris
      </p>
      <p style="color: #9ca3af; font-size: 11px; margin: 0 0 4px 0;">
        Ceci est un message automatique.
      </p>
      <p style="color: #9ca3af; font-size: 11px; margin: 0;">
        <a href="mailto:contact@veronecollections.fr" style="color: #9ca3af; text-decoration: none;">contact@veronecollections.fr</a>
        &nbsp;&middot;&nbsp; &copy; 2026
      </p>
    </div>
  </div>
</body>
</html>`;
}
