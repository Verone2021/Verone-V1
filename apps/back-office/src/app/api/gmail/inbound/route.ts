/**
 * API Route: Gmail Inbound Pub/Sub Webhook
 * POST /api/gmail/inbound
 *
 * Reçoit les notifications push Google Pub/Sub quand un email arrive
 * sur l'une des 4 adresses surveillées (contact@ et commandes@ pour
 * Vérone et LinkMe). Décode la notification, récupère le message via
 * Gmail API (service account + Domain-Wide Delegation), et l'insère dans
 * la table email_messages pour consultation dans le back-office.
 *
 * Sécurité : vérification du Bearer token partagé (GMAIL_PUBSUB_VERIFICATION_TOKEN).
 */

import { NextResponse } from 'next/server';

import { z } from 'zod';

import type { ParsedEmail } from '@verone/integrations/gmail';
import {
  detectBrand,
  fetchNewMessages,
  getAcceptedAliases,
  ORDER_REGEX,
} from '@verone/integrations/gmail';

import { createAdminClient } from '@verone/utils/supabase/admin';

// ---------------------------------------------------------------------------
// Schémas Zod
// ---------------------------------------------------------------------------

/** Payload décodé du champ `message.data` Pub/Sub (base64 JSON).
 *  Gmail envoie historyId comme number, donc on coerce pour rester compatible
 *  avec une string côté Gmail API client. */
const PubSubDataSchema = z.object({
  emailAddress: z.string().email(),
  historyId: z.coerce.string(),
});

/** Corps brut d'une notification Pub/Sub */
const PubSubBodySchema = z.object({
  message: z.object({
    data: z.string(), // base64
    messageId: z.string().optional(),
    publishTime: z.string().optional(),
  }),
  subscription: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Helper — résolution de l'alias destinataire dans un message
// ---------------------------------------------------------------------------

/**
 * Extrait l'email pur d'une chaîne pouvant être au format "Nom <email>" ou "email".
 */
function extractEmail(raw: string): string {
  const match = raw.match(/<(.+?)>/);
  return (match?.[1] ?? raw).trim().toLowerCase();
}

/**
 * Cherche dans Delivered-To puis dans To si un des aliases acceptés
 * est destinataire du message. Retourne l'alias trouvé ou null.
 *
 * Pourquoi : on surveille une boîte centrale (ex: romeo@) qui reçoit aussi
 * des mails persos. Seuls les messages adressés aux aliases configurés
 * (contact@, commandes@, …) doivent atterrir dans le back-office.
 */
function findMatchingAlias(
  msg: ParsedEmail,
  acceptedAliases: string[]
): string | null {
  if (acceptedAliases.length === 0) return null;

  const candidates = new Set<string>();
  for (const dt of msg.deliveredTo) {
    candidates.add(extractEmail(dt));
  }
  if (msg.toAddress) {
    for (const part of msg.toAddress.split(/[,;]/)) {
      candidates.add(extractEmail(part));
    }
  }

  for (const c of candidates) {
    if (acceptedAliases.includes(c)) return c;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Helper — résolution commande liée
// ---------------------------------------------------------------------------

async function resolveLinkedOrder(
  orderNumber: string
): Promise<{ id: string | null; orderNumber: string | null }> {
  const supabase = createAdminClient();
  const { data: order } = await supabase
    .from('sales_orders')
    .select('id, order_number')
    .eq('order_number', orderNumber)
    .maybeSingle();

  if (!order) return { id: null, orderNumber: null };
  return { id: order.id, orderNumber: order.order_number };
}

// ---------------------------------------------------------------------------
// Helper — insertion d'un message en DB
// ---------------------------------------------------------------------------

async function insertEmailMessage(
  msg: ParsedEmail,
  brand: 'verone' | 'linkme',
  matchedAlias: string
): Promise<boolean> {
  const supabase = createAdminClient();

  // Détection numéro de commande dans subject puis body_text
  const orderMatch =
    msg.subject?.match(ORDER_REGEX) ?? msg.bodyText?.match(ORDER_REGEX) ?? null;
  const detectedOrderNumber = orderMatch?.[1]?.toUpperCase() ?? null;

  let linkedOrderId: string | null = null;
  let linkedOrderNumber: string | null = null;

  if (detectedOrderNumber) {
    const resolved = await resolveLinkedOrder(detectedOrderNumber);
    linkedOrderId = resolved.id;
    linkedOrderNumber = resolved.orderNumber;
  }

  const { error } = await supabase.from('email_messages').insert({
    gmail_message_id: msg.gmailMessageId,
    gmail_thread_id: msg.gmailThreadId,
    gmail_history_id: msg.gmailHistoryId,
    brand,
    to_address: matchedAlias,
    from_email: msg.fromEmail,
    from_name: msg.fromName,
    subject: msg.subject,
    snippet: msg.snippet,
    body_text: msg.bodyText,
    body_html: msg.bodyHtml,
    received_at: msg.receivedAt.toISOString(),
    has_attachments: msg.hasAttachments,
    raw_headers: msg.rawHeaders,
    linked_order_id: linkedOrderId,
    linked_order_number: linkedOrderNumber,
    is_read: false,
  });

  if (error) {
    // Code 23505 = violation de contrainte UNIQUE (doublon) → ON CONFLICT DO NOTHING
    if (error.code !== '23505') {
      console.error(
        `[Gmail Inbound] Erreur INSERT message ${msg.gmailMessageId}`,
        error
      );
    }
    return false;
  }

  return true;
}

// ---------------------------------------------------------------------------
// Handler POST
// ---------------------------------------------------------------------------

export async function POST(request: Request): Promise<NextResponse> {
  // 1. Vérification du token partagé (header Authorization OU query string ?token=)
  // Pub/Sub n'autorise pas les headers personnalisés sur les push subscriptions :
  // soit OIDC (JWT signé Google), soit token en URL. On accepte les deux formes
  // de Bearer pour rester compatibles avec les deux modes de configuration.
  const expectedToken = process.env.GMAIL_PUBSUB_VERIFICATION_TOKEN;

  if (!expectedToken) {
    console.error('[Gmail Inbound] GMAIL_PUBSUB_VERIFICATION_TOKEN manquant');
    return NextResponse.json(
      { error: 'Configuration serveur incomplète' },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get('authorization') ?? '';
  const headerToken = authHeader.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length)
    : '';
  const queryToken = new URL(request.url).searchParams.get('token') ?? '';
  const providedToken = headerToken || queryToken;

  if (providedToken !== expectedToken) {
    console.warn('[Gmail Inbound] Token invalide, requête rejetée');
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  // 2. Parsing du corps Pub/Sub
  const rawBody: unknown = await request.json().catch(() => null);
  const bodyParsed = PubSubBodySchema.safeParse(rawBody);

  if (!bodyParsed.success) {
    console.warn(
      '[Gmail Inbound] Corps Pub/Sub invalide',
      bodyParsed.error.flatten()
    );
    return NextResponse.json({ error: 'Corps invalide' }, { status: 400 });
  }

  // 3. Décodage du champ data (base64 → JSON)
  let pubSubData: z.infer<typeof PubSubDataSchema>;
  try {
    const decoded = Buffer.from(
      bodyParsed.data.message.data,
      'base64'
    ).toString('utf-8');
    const dataParsed = PubSubDataSchema.safeParse(JSON.parse(decoded));
    if (!dataParsed.success) {
      console.warn(
        '[Gmail Inbound] Payload data invalide',
        dataParsed.error.flatten()
      );
      return NextResponse.json(
        { error: 'Payload data invalide' },
        { status: 400 }
      );
    }
    pubSubData = dataParsed.data;
  } catch (err) {
    console.error('[Gmail Inbound] Erreur décodage base64', err);
    return NextResponse.json({ error: 'Erreur décodage' }, { status: 400 });
  }

  const { emailAddress, historyId } = pubSubData;

  // 4. Récupération des aliases acceptés (filtre sur Delivered-To)
  const acceptedAliases = getAcceptedAliases();
  if (acceptedAliases.length === 0) {
    console.error(
      '[Gmail Inbound] GMAIL_ACCEPTED_ALIASES vide — aucun filtre, tout serait inséré'
    );
    return NextResponse.json(
      { error: 'Configuration serveur incomplète (GMAIL_ACCEPTED_ALIASES)' },
      { status: 500 }
    );
  }

  // 5. Récupération du startHistoryId : on utilise le dernier historyId
  // connu pour cette boîte (gmail_watch_state) car users.history.list
  // traite startHistoryId comme EXCLUSIVE. Sans ça, on rate systématiquement
  // le message qui a déclenché la notification Pub/Sub courante.
  const supabaseAdmin = createAdminClient();
  const { data: watchState } = await supabaseAdmin
    .from('gmail_watch_state')
    .select('last_history_id')
    .eq('email_address', emailAddress.toLowerCase())
    .maybeSingle();

  const startHistoryId = watchState?.last_history_id ?? historyId;

  // 6. Récupération des nouveaux messages via Gmail API
  let messages: ParsedEmail[];
  try {
    messages = await fetchNewMessages(emailAddress, startHistoryId);
  } catch (err) {
    console.error('[Gmail Inbound] Erreur Gmail API', err);
    // On retourne 200 pour éviter la boucle de retries Pub/Sub infinie
    return NextResponse.json({ ok: true, gmailError: true });
  }

  // Avancer le pointeur startHistoryId même si pas de message (notif d'autre type)
  await supabaseAdmin.from('gmail_watch_state').upsert(
    {
      email_address: emailAddress.toLowerCase(),
      last_history_id: historyId,
    },
    { onConflict: 'email_address' }
  );

  if (messages.length === 0) {
    return NextResponse.json({ ok: true, inserted: 0 });
  }

  // 7. Filtrage par alias accepté + INSERT dans email_messages
  let insertedCount = 0;
  let skippedNoAlias = 0;
  let skippedUnknownBrand = 0;

  for (const msg of messages) {
    const matchedAlias = findMatchingAlias(msg, acceptedAliases);
    if (!matchedAlias) {
      // Mail perso (boîte surveillée) — pas d'alias acceptés dans Delivered-To/To
      skippedNoAlias++;
      continue;
    }
    const brand = detectBrand(matchedAlias);
    if (!brand) {
      skippedUnknownBrand++;
      continue;
    }
    const success = await insertEmailMessage(msg, brand, matchedAlias);
    if (success) insertedCount++;
  }

  console.warn(
    `[Gmail Inbound] boîte=${emailAddress} startId=${startHistoryId} ` +
      `nextId=${historyId} reçus=${String(messages.length)} ` +
      `insérés=${String(insertedCount)} skip_no_alias=${String(skippedNoAlias)} ` +
      `skip_unknown_brand=${String(skippedUnknownBrand)}`
  );
  return NextResponse.json({
    ok: true,
    received: messages.length,
    inserted: insertedCount,
    skippedNoAlias,
    skippedUnknownBrand,
  });
}
