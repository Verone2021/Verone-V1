/**
 * Gmail Inbound — Client Gmail API
 *
 * Encapsule les appels gmail.users.history.list et gmail.users.messages.get.
 * Utilise le service account avec Domain-Wide Delegation.
 */

import { google } from 'googleapis';

import { createGmailJwtClient } from './auth';
import { parseGmailMessage } from './parser';
import type { ParsedEmail } from './parser';

export type { ParsedEmail };

/**
 * Payload décodé d'une notification Pub/Sub Gmail.
 */
export interface GmailPubSubPayload {
  emailAddress: string;
  historyId: string;
}

/**
 * Récupère les nouveaux messages ajoutés depuis un historyId donné.
 * Impersonne l'adresse cible via Domain-Wide Delegation.
 *
 * @param emailAddress Adresse surveillée (ex: contact@veronecollections.fr)
 * @param startHistoryId HistoryId reçu dans la notification Pub/Sub
 * @returns Liste des emails parsés
 */
export async function fetchNewMessages(
  emailAddress: string,
  startHistoryId: string
): Promise<ParsedEmail[]> {
  const auth = createGmailJwtClient(emailAddress);
  const gmail = google.gmail({ version: 'v1', auth });

  // Récupérer l'historique depuis le dernier historyId connu
  const historyResp = await gmail.users.history.list({
    userId: 'me',
    startHistoryId,
    historyTypes: ['messageAdded'],
  });

  const historyItems = historyResp.data.history ?? [];
  if (historyItems.length === 0) {
    return [];
  }

  // Collecter les IDs de messages uniques ajoutés
  const messageIds = new Set<string>();
  for (const item of historyItems) {
    for (const added of item.messagesAdded ?? []) {
      if (added.message?.id) {
        messageIds.add(added.message.id);
      }
    }
  }

  if (messageIds.size === 0) {
    return [];
  }

  // Récupérer chaque message en format complet
  const parsed: ParsedEmail[] = [];
  for (const messageId of messageIds) {
    const msgResp = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full',
    });

    if (msgResp.data) {
      parsed.push(parseGmailMessage(msgResp.data));
    }
  }

  return parsed;
}
