/**
 * Gmail Inbound — Authentification Service Account avec Domain-Wide Delegation
 *
 * Utilise `google-auth-library` (déjà dépendance du package).
 * Le service account doit avoir la délégation domaine activée avec le scope
 * https://www.googleapis.com/auth/gmail.readonly
 */

import { JWT } from 'google-auth-library';

import { GMAIL_SCOPES, GMAIL_SEND_SCOPES, validateGmailEnv } from './config';

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

/**
 * Crée un client JWT séparé pour l'envoi de mails (scope gmail.send).
 *
 * Important : ce scope doit être autorisé côté Workspace admin dans la
 * Domain-Wide Delegation, en ajoutant le client_id existant avec le scope
 * https://www.googleapis.com/auth/gmail.send. Sans cette autorisation, tout
 * appel à users.messages.send retournera unauthorized_client.
 *
 * Les fonctions d'inbound continuent d'utiliser createGmailJwtClient (scope
 * gmail.readonly) — l'envoi est isolé pour ne pas mélanger les scopes.
 */
export function createGmailSendJwtClient(emailAddress: string): JWT {
  const { clientEmail, privateKey } = loadServiceAccountKey();
  return new JWT({
    email: clientEmail,
    key: privateKey,
    scopes: [...GMAIL_SEND_SCOPES],
    subject: emailAddress,
  });
}
