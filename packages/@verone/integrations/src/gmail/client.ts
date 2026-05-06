/**
 * Gmail Inbound — Client Gmail API
 *
 * Encapsule les appels gmail.users.history.list et gmail.users.messages.get.
 * Utilise le service account avec Domain-Wide Delegation.
 */

import { google } from 'googleapis';

import { createGmailJwtClient, createGmailSendJwtClient } from './auth';
import { getWatchAddresses } from './config';
import { parseGmailMessage } from './parser';
import type { ParsedEmail } from './parser';

export type { ParsedEmail };

/**
 * Encode une string UTF-8 en RFC 2047 (Q-encoding) pour les headers MIME.
 * Format : =?UTF-8?B?<base64>?=
 */
function encodeMimeHeader(value: string): string {
  // Si tout en ASCII printable hors caractères MIME spéciaux, retour tel quel
  if (/^[\x20-\x7e]+$/.test(value) && !/[<>=?]/.test(value)) {
    return value;
  }
  const b64 = Buffer.from(value, 'utf-8').toString('base64');
  return `=?UTF-8?B?${b64}?=`;
}

/**
 * Encode une chaîne en base64url (sans padding, alphabet sûr URL).
 * Requis par gmail.users.messages.send pour le champ raw.
 */
function toBase64Url(input: string): string {
  return Buffer.from(input, 'utf-8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Construit un MIME multipart/alternative (text + html) prêt pour envoi
 * via gmail.users.messages.send.
 */
function buildMimeMessage(args: {
  fromName?: string;
  fromAddress: string;
  to: string;
  cc?: string;
  subject: string;
  bodyText: string;
  bodyHtml: string;
  inReplyTo?: string;
  references?: string;
}): string {
  const boundary = `verone-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
  const fromHeader = args.fromName
    ? `${encodeMimeHeader(args.fromName)} <${args.fromAddress}>`
    : args.fromAddress;
  const lines: string[] = [`From: ${fromHeader}`, `To: ${args.to}`];
  if (args.cc && args.cc.trim() !== '') {
    lines.push(`Cc: ${args.cc}`);
  }
  lines.push(`Subject: ${encodeMimeHeader(args.subject)}`);
  if (args.inReplyTo) {
    lines.push(`In-Reply-To: ${args.inReplyTo}`);
  }
  if (args.references) {
    lines.push(`References: ${args.references}`);
  }
  lines.push('MIME-Version: 1.0');
  lines.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
  lines.push('');
  lines.push(`--${boundary}`);
  lines.push('Content-Type: text/plain; charset="UTF-8"');
  lines.push('Content-Transfer-Encoding: base64');
  lines.push('');
  lines.push(Buffer.from(args.bodyText, 'utf-8').toString('base64'));
  lines.push(`--${boundary}`);
  lines.push('Content-Type: text/html; charset="UTF-8"');
  lines.push('Content-Transfer-Encoding: base64');
  lines.push('');
  lines.push(Buffer.from(args.bodyHtml, 'utf-8').toString('base64'));
  lines.push(`--${boundary}--`);
  return lines.join('\r\n');
}

export interface SendMessageOptions {
  /** Adresse expéditrice (alias surveillé), ex: contact@veronecollections.fr. */
  fromAddress: string;
  /** Nom affiché de l'expéditeur (optionnel). */
  fromName?: string;
  /** Destinataire(s) — peut contenir plusieurs adresses séparées par virgule. */
  to: string;
  cc?: string;
  subject: string;
  bodyHtml: string;
  /** Version texte fallback (générée depuis le HTML si non fournie). */
  bodyText?: string;
  /** Si réponse : Gmail thread id pour rester dans le même fil. */
  threadId?: string;
  /** Si réponse : Message-ID RFC 822 du mail parent (header In-Reply-To). */
  inReplyToMessageId?: string;
}

export interface SendMessageResult {
  gmailMessageId: string;
  gmailThreadId: string;
  rfc822MessageId: string | null;
}

/** Strip basique des balises HTML pour générer un fallback texte. */
function stripHtml(html: string): string {
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

/**
 * Envoie un mail via gmail.users.messages.send (BO-MSG-010B).
 * Impersonne l'adresse fromAddress via Domain-Wide Delegation (scope
 * gmail.send doit être autorisé côté Workspace admin).
 *
 * Si threadId fourni, le message reste dans le même fil de discussion.
 */
export async function sendMessage(
  options: SendMessageOptions
): Promise<SendMessageResult> {
  const auth = createGmailSendJwtClient(options.fromAddress);
  const gmail = google.gmail({ version: 'v1', auth });

  const bodyText = options.bodyText ?? stripHtml(options.bodyHtml);
  const mime = buildMimeMessage({
    fromName: options.fromName,
    fromAddress: options.fromAddress,
    to: options.to,
    cc: options.cc,
    subject: options.subject,
    bodyText,
    bodyHtml: options.bodyHtml,
    inReplyTo: options.inReplyToMessageId,
    references: options.inReplyToMessageId,
  });

  const resp = await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: toBase64Url(mime),
      threadId: options.threadId,
    },
  });

  return {
    gmailMessageId: String(resp.data.id ?? ''),
    gmailThreadId: String(resp.data.threadId ?? ''),
    rfc822MessageId: null,
  };
}

/**
 * Payload décodé d'une notification Pub/Sub Gmail.
 */
export interface GmailPubSubPayload {
  emailAddress: string;
  historyId: string;
}

/**
 * Résultat d'un appel users.watch().
 */
export interface GmailWatchResult {
  emailAddress: string;
  historyId: string;
  expirationMs: number;
  expirationDate: string;
}

/**
 * Active la surveillance Gmail pour une adresse via Pub/Sub.
 * Doit être renouvelée avant 7 jours (sinon la surveillance s'arrête).
 *
 * @param emailAddress Adresse à surveiller (impersonnée via DWD)
 * @param topicName Nom complet du topic Pub/Sub (projects/.../topics/...)
 */
export async function startWatch(
  emailAddress: string,
  topicName: string
): Promise<GmailWatchResult> {
  const auth = createGmailJwtClient(emailAddress);
  const gmail = google.gmail({ version: 'v1', auth });

  const resp = await gmail.users.watch({
    userId: 'me',
    requestBody: {
      topicName,
      labelIds: ['INBOX'],
      labelFilterBehavior: 'INCLUDE',
    },
  });

  const expirationMs = Number(resp.data.expiration ?? 0);
  return {
    emailAddress,
    historyId: String(resp.data.historyId ?? ''),
    expirationMs,
    expirationDate: expirationMs
      ? new Date(expirationMs).toISOString()
      : 'unknown',
  };
}

/**
 * Active la surveillance pour toutes les adresses listées dans
 * GMAIL_WATCH_ADDRESSES. Les erreurs par adresse sont collectées sans
 * interrompre le batch.
 */
export async function startWatchAll(topicName: string): Promise<{
  successes: GmailWatchResult[];
  failures: Array<{ emailAddress: string; error: string }>;
}> {
  const addresses = getWatchAddresses();
  const successes: GmailWatchResult[] = [];
  const failures: Array<{ emailAddress: string; error: string }> = [];

  for (const addr of addresses) {
    try {
      successes.push(await startWatch(addr, topicName));
    } catch (e) {
      failures.push({
        emailAddress: addr,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return { successes, failures };
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
