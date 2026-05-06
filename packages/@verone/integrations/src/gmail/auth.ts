/**
 * Gmail Inbound — Authentification Service Account avec Domain-Wide Delegation
 *
 * Utilise `google-auth-library` (déjà dépendance du package).
 * Le service account doit avoir la délégation domaine activée avec le scope
 * https://www.googleapis.com/auth/gmail.readonly
 */

import { JWT } from 'google-auth-library';

import { GMAIL_SCOPES, validateGmailEnv } from './config';

function loadServiceAccountKey(): { clientEmail: string; privateKey: string } {
  validateGmailEnv();
  const clientEmail = process.env.GMAIL_SERVICE_ACCOUNT_EMAIL!;
  let privateKey = process.env.GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY!;
  if (privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }
  if (
    !privateKey.includes('BEGIN PRIVATE KEY') ||
    !privateKey.includes('END PRIVATE KEY')
  ) {
    throw new Error(
      '[Gmail Auth] GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY format invalide (PEM attendu).'
    );
  }
  return { clientEmail, privateKey };
}

/**
 * Crée un client JWT impersonant une adresse Gmail spécifique en lecture
 * (scope gmail.readonly). Utilisé par les fonctions d'inbound (watch,
 * history, messages.get).
 *
 * @param emailAddress Adresse Gmail à impersonner (ex: contact@veronecollections.fr)
 */
export function createGmailJwtClient(emailAddress: string): JWT {
  const { clientEmail, privateKey } = loadServiceAccountKey();
  return new JWT({
    email: clientEmail,
    key: privateKey,
    scopes: [...GMAIL_SCOPES],
    subject: emailAddress, // Domain-Wide Delegation : impersonation
  });
}
