/**
 * Gmail Inbound — Configuration
 *
 * Variables d'environnement requises (à ajouter dans .env.local et Vercel) :
 *   GMAIL_SERVICE_ACCOUNT_EMAIL   — email du service account Google Cloud
 *   GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY — clé PEM du service account (avec \n)
 *   GMAIL_PUBSUB_VERIFICATION_TOKEN — token partagé pour vérifier les appels Pub/Sub
 *   GMAIL_WATCH_ADDRESSES — CSV des adresses surveillées (4 groupes)
 */

export const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
] as const;

/** Adresses surveillées, déduites de GMAIL_WATCH_ADDRESSES */
export function getWatchAddresses(): string[] {
  const raw = process.env.GMAIL_WATCH_ADDRESSES ?? '';
  return raw
    .split(',')
    .map(a => a.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Détecte la marque à partir de l'adresse destinataire.
 * Retourne null si l'adresse n'est pas reconnue.
 */
export function detectBrand(toAddress: string): 'verone' | 'linkme' | null {
  const lower = toAddress.toLowerCase();
  if (lower.includes('veronecollections.fr')) return 'verone';
  if (lower.includes('linkme.network')) return 'linkme';
  return null;
}

/** Regex de détection de numéro de commande dans subject/body */
export const ORDER_REGEX = /(VC-\d{4}-\d{4,5}|SO-\d{4}-\d{5})/i;

export function validateGmailEnv(): void {
  const required = [
    'GMAIL_SERVICE_ACCOUNT_EMAIL',
    'GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY',
    'GMAIL_PUBSUB_VERIFICATION_TOKEN',
  ] as const;

  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(
        `[Gmail Integration] Variable d'environnement manquante : ${key}. ` +
          'Configurez-la dans .env.local et dans Vercel > Settings > Environment Variables.'
      );
    }
  }
}
