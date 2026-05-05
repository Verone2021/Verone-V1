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
  ORDER_REGEX,
} from '@verone/integrations/gmail';

import { createAdminClient } from '@verone/utils/supabase/admin';

// ---------------------------------------------------------------------------
// Schémas Zod
// ---------------------------------------------------------------------------

/** Payload décodé du champ `message.data` Pub/Sub (base64 JSON) */
const PubSubDataSchema = z.object({
  emailAddress: z.string().email(),
  historyId: z.string(),
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
  brand: 'verone' | 'linkme'
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
    to_address: msg.toAddress,
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
  // 1. Vérification du token partagé (Bearer)
  const authHeader = request.headers.get('authorization') ?? '';
  const expectedToken = process.env.GMAIL_PUBSUB_VERIFICATION_TOKEN;

  if (!expectedToken) {
    console.error('[Gmail Inbound] GMAIL_PUBSUB_VERIFICATION_TOKEN manquant');
    return NextResponse.json(
      { error: 'Configuration serveur incomplète' },
      { status: 500 }
    );
  }

  const [, token] = authHeader.split(' ');
  if (token !== expectedToken) {
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

  // 4. Détection de la marque
  const brand = detectBrand(emailAddress);
  if (!brand) {
    // Adresse non gérée — on répond 200 pour éviter les retries Pub/Sub
    console.warn(`[Gmail Inbound] Adresse non gérée : ${emailAddress}`);
    return NextResponse.json({ ok: true, skipped: true });
  }

  // 5. Récupération des nouveaux messages via Gmail API
  let messages: ParsedEmail[];
  try {
    messages = await fetchNewMessages(emailAddress, historyId);
  } catch (err) {
    console.error('[Gmail Inbound] Erreur Gmail API', err);
    // On retourne 200 pour éviter la boucle de retries Pub/Sub infinie
    return NextResponse.json({ ok: true, gmailError: true });
  }

  if (messages.length === 0) {
    return NextResponse.json({ ok: true, inserted: 0 });
  }

  // 6. INSERT dans email_messages (Supabase Admin — bypass RLS)
  let insertedCount = 0;

  for (const msg of messages) {
    const success = await insertEmailMessage(msg, brand);
    if (success) insertedCount++;
  }

  console.warn(
    `[Gmail Inbound] ${String(insertedCount)} email(s) insérés pour ${emailAddress}`
  );
  return NextResponse.json({ ok: true, inserted: insertedCount });
}
