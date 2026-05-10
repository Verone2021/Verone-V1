/**
 * Templates et règles d'adaptation de caption par canal.
 *
 * Chaque canal a ses propres normes :
 *   - Instagram/Facebook : long-form OK, hashtags fonctionnent (5 max)
 *   - Pinterest : axe SEO épingle, keywords plus que hashtags
 *   - TikTok : court, viral, hashtags trending
 *   - LinkedIn : professionnel, B2B
 *   - Site internet (descriptions catalogue) : long-form pur
 *   - Newsletter : accroche commerciale
 *
 * Permet le cross-posting 1-clic : 1 caption "source" se décline
 * automatiquement par canal selon les normes.
 */

export type CrossPostChannel =
  | 'instagram'
  | 'facebook'
  | 'pinterest'
  | 'tiktok'
  | 'linkedin'
  | 'site_internet'
  | 'newsletter';

export interface ChannelCaptionLimits {
  /** Caractères max pour le texte principal */
  maxChars: number;
  /** Hashtags max recommandés (0 si non recommandé) */
  maxHashtags: number;
  /** Inclure les hashtags dans la caption (true) ou en commentaire séparé (false) */
  inlineHashtags: boolean;
  /** Label affiché dans l'UI */
  label: string;
}

export const CHANNEL_LIMITS: Record<CrossPostChannel, ChannelCaptionLimits> = {
  instagram: {
    maxChars: 2200,
    maxHashtags: 5,
    inlineHashtags: false,
    label: 'Instagram',
  },
  facebook: {
    maxChars: 5000,
    maxHashtags: 3,
    inlineHashtags: true,
    label: 'Facebook',
  },
  pinterest: {
    maxChars: 500,
    maxHashtags: 0,
    inlineHashtags: false,
    label: 'Pinterest',
  },
  tiktok: {
    maxChars: 300,
    maxHashtags: 6,
    inlineHashtags: true,
    label: 'TikTok',
  },
  linkedin: {
    maxChars: 3000,
    maxHashtags: 5,
    inlineHashtags: true,
    label: 'LinkedIn',
  },
  site_internet: {
    maxChars: 5000,
    maxHashtags: 0,
    inlineHashtags: false,
    label: 'Site Internet',
  },
  newsletter: {
    maxChars: 800,
    maxHashtags: 0,
    inlineHashtags: false,
    label: 'Newsletter',
  },
};

/**
 * Adapte une caption source pour un canal donné selon les normes.
 * Tronque si trop long, retire les hashtags si canal sans support,
 * retourne soit caption inline soit caption + commentaire.
 */
export function adaptCaptionForChannel(
  sourceCaption: string,
  sourceHashtags: string[],
  channel: CrossPostChannel
): { caption: string; commentHashtags: string | null } {
  const limits = CHANNEL_LIMITS[channel];
  const trimmedHashtags = sourceHashtags.slice(0, limits.maxHashtags);

  let caption = sourceCaption;
  if (caption.length > limits.maxChars) {
    caption = caption.slice(0, limits.maxChars - 1).trimEnd() + '…';
  }

  if (limits.maxHashtags === 0 || trimmedHashtags.length === 0) {
    return { caption, commentHashtags: null };
  }

  if (limits.inlineHashtags) {
    const hashtagsString = trimmedHashtags.join(' ');
    const combined = `${caption}\n\n${hashtagsString}`;
    if (combined.length > limits.maxChars) {
      // Si l'ajout des hashtags inline dépasse la limite, on les met en commentaire
      return { caption, commentHashtags: hashtagsString };
    }
    return { caption: combined, commentHashtags: null };
  }

  return { caption, commentHashtags: trimmedHashtags.join(' ') };
}

export const ALL_CROSS_POST_CHANNELS: CrossPostChannel[] = [
  'instagram',
  'facebook',
  'pinterest',
  'tiktok',
  'linkedin',
  'site_internet',
  'newsletter',
];
