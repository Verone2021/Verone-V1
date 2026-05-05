/**
 * Gmail Inbound — Parsing des messages Gmail API (format 'full')
 *
 * Gère les payloads MIME multi-parts pour extraire text/plain et text/html.
 */

import type { gmail_v1 } from 'googleapis';

export interface ParsedEmail {
  gmailMessageId: string;
  gmailThreadId: string;
  fromEmail: string;
  fromName: string | null;
  toAddress: string;
  subject: string | null;
  snippet: string | null;
  bodyText: string | null;
  bodyHtml: string | null;
  receivedAt: Date;
  hasAttachments: boolean;
  rawHeaders: Record<string, string>;
  gmailHistoryId: string | null;
}

/**
 * Extrait la valeur d'un header Gmail par nom (case-insensitive).
 */
function getHeader(
  headers: gmail_v1.Schema$MessagePartHeader[],
  name: string
): string | null {
  return (
    headers.find(h => h.name?.toLowerCase() === name.toLowerCase())?.value ??
    null
  );
}

/**
 * Décode un contenu base64url Gmail.
 */
function decodeBase64Url(data: string): string {
  // Gmail utilise base64url (remplace - par + et _ par /)
  const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(base64, 'base64').toString('utf-8');
}

/**
 * Extrait le texte d'une partie MIME et de ses enfants récursivement.
 */
function extractFromPart(
  part: gmail_v1.Schema$MessagePart,
  mimeType: string
): string | null {
  if (part.mimeType === mimeType && part.body?.data) {
    return decodeBase64Url(part.body.data);
  }
  if (part.parts) {
    for (const sub of part.parts) {
      const result = extractFromPart(sub, mimeType);
      if (result) return result;
    }
  }
  return null;
}

/**
 * Vérifie si le message contient des pièces jointes.
 */
function hasAttachmentsParts(part: gmail_v1.Schema$MessagePart): boolean {
  if (part.filename && part.filename.length > 0 && part.body?.attachmentId) {
    return true;
  }
  if (part.parts) {
    return part.parts.some(p => hasAttachmentsParts(p));
  }
  return false;
}

/**
 * Parse un header "From" au format "Nom Prénom <email@example.com>" ou "email@example.com".
 */
function parseFromHeader(from: string): { email: string; name: string | null } {
  const match = from.match(/^(.*?)\s*<(.+?)>\s*$/);
  if (match) {
    const name = match[1].trim().replace(/^["']|["']$/g, '');
    return { email: match[2].trim(), name: name || null };
  }
  return { email: from.trim(), name: null };
}

/**
 * Parse un message Gmail complet (format 'full') en objet structuré.
 */
export function parseGmailMessage(
  message: gmail_v1.Schema$Message
): ParsedEmail {
  const payload = message.payload;
  const headers: gmail_v1.Schema$MessagePartHeader[] = payload?.headers ?? [];

  // Headers essentiels
  const fromRaw = getHeader(headers, 'From') ?? '';
  const { email: fromEmail, name: fromName } = parseFromHeader(fromRaw);
  const toAddress = getHeader(headers, 'To') ?? '';
  const subject = getHeader(headers, 'Subject');
  const dateStr = getHeader(headers, 'Date');

  // Date de réception
  let receivedAt: Date;
  if (message.internalDate) {
    receivedAt = new Date(parseInt(message.internalDate, 10));
  } else if (dateStr) {
    receivedAt = new Date(dateStr);
  } else {
    receivedAt = new Date();
  }

  // Corps du message (text/plain et text/html)
  let bodyText: string | null = null;
  let bodyHtml: string | null = null;

  if (payload) {
    // Cas message simple (pas multipart)
    if (payload.mimeType === 'text/plain' && payload.body?.data) {
      bodyText = decodeBase64Url(payload.body.data);
    } else if (payload.mimeType === 'text/html' && payload.body?.data) {
      bodyHtml = decodeBase64Url(payload.body.data);
    } else if (payload.parts) {
      // Cas multipart : chercher récursivement
      bodyText = extractFromPart(payload, 'text/plain');
      bodyHtml = extractFromPart(payload, 'text/html');
    }
  }

  // Pièces jointes
  const hasAttachments = payload ? hasAttachmentsParts(payload) : false;

  // Snapshot des headers utiles
  const rawHeaders: Record<string, string> = {};
  for (const h of headers) {
    if (h.name && h.value) {
      rawHeaders[h.name] = h.value;
    }
  }

  return {
    gmailMessageId: message.id ?? '',
    gmailThreadId: message.threadId ?? '',
    fromEmail,
    fromName,
    toAddress,
    subject,
    snippet: message.snippet ?? null,
    bodyText,
    bodyHtml,
    receivedAt,
    hasAttachments,
    rawHeaders,
    gmailHistoryId: message.historyId ?? null,
  };
}
