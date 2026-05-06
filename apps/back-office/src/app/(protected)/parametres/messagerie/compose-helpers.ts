/**
 * Helpers utilises par ComposeMailModal (BO-MSG-010).
 * Extrait dans un fichier separe pour respecter la limite max-lines.
 */

/**
 * Remplace {{variable}} par la valeur correspondante dans le mapping.
 * Les variables non fournies sont laissees telles quelles, l'utilisateur les
 * complete a la main dans le textarea.
 */
export function fillTemplate(
  template: string,
  values: Record<string, string | undefined>
): string {
  return template.replace(
    /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g,
    (match, varName) => {
      const v = values[varName as string];
      return v ?? match;
    }
  );
}

/**
 * Construit l'URL Gmail Compose pre-remplie.
 * Format : https://mail.google.com/mail/?view=cm&fs=1&to=...&cc=...&su=...&body=...
 *
 * Limite : le body est en text/plain (pas html). Si le template est HTML,
 * on genere une version texte basique via stripHtml. Pour preserver la mise
 * en forme HTML, l'utilisateur doit utiliser le bouton "Copier".
 */
export function buildGmailComposeUrl(args: {
  to: string;
  cc?: string;
  subject: string;
  bodyText: string;
}): string {
  const params = new URLSearchParams({
    view: 'cm',
    fs: '1',
    to: args.to,
    su: args.subject,
    body: args.bodyText,
  });
  if (args.cc && args.cc.trim() !== '') {
    params.set('cc', args.cc);
  }
  return `https://mail.google.com/mail/?${params.toString()}`;
}

/** Strip basique des balises HTML pour generer un fallback texte. */
export function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
