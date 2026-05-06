/**
 * API Route ADMIN: Envoi de mail depuis le back-office (BO-MSG-010B)
 *
 * POST /api/gmail/send
 *
 * Envoie un mail via gmail.users.messages.send en impersonnant l'alias choisi
 * (contact@ ou commandes@ pour Vérone ou LinkMe). Insère ensuite un
 * email_messages outbound (sent_by_user_id, replied_at, reply_message_id).
 *
 * Pré-requis : le scope https://www.googleapis.com/auth/gmail.send doit être
 * autorisé dans la Domain-Wide Delegation Workspace pour le service account
 * (admin.google.com → Sécurité → API controls → DWD → ajouter le scope au
 * client_id existant).
 *
 * Sécurité : authentification admin back-office requise.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { z } from 'zod';

import type { SendMessageResult } from '@verone/integrations/gmail';
import { sendMessage } from '@verone/integrations/gmail';

import { createAdminClient } from '@verone/utils/supabase/admin';

import { requireBackofficeAdmin } from '@/lib/guards';

const SendBodySchema = z.object({
  fromAddress: z.string().email(),
  fromName: z.string().optional(),
  to: z.string().min(3),
  cc: z.string().optional(),
  subject: z.string().min(1),
  bodyHtml: z.string().min(1),
  bodyText: z.string().optional(),
  threadId: z.string().optional(),
  inReplyToMessageId: z.string().optional(),
  /** Si réponse : id (uuid) du mail parent dans email_messages — pour update tracking. */
  parentEmailId: z.string().uuid().optional(),
  /** Brand inférée depuis l'alias (pour l'INSERT outbound). */
  brand: z.enum(['verone', 'linkme']),
  /** Template id utilisé (pour analytics futurs). */
  templateId: z.string().uuid().optional(),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const guardResult = await requireBackofficeAdmin(request);
  if (guardResult instanceof NextResponse) {
    return guardResult;
  }
  const userId = guardResult.user.id;

  const rawBody: unknown = await request.json().catch(() => null);
  const parsed = SendBodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Body invalide', issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const payload = parsed.data;

  // 1. Envoi via Gmail API
  let sendResult: SendMessageResult;
  try {
    sendResult = await sendMessage({
      fromAddress: payload.fromAddress,
      fromName: payload.fromName,
      to: payload.to,
      cc: payload.cc,
      subject: payload.subject,
      bodyHtml: payload.bodyHtml,
      bodyText: payload.bodyText,
      threadId: payload.threadId,
      inReplyToMessageId: payload.inReplyToMessageId,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Erreur inconnue';
    console.error('[Gmail Send] erreur API Gmail :', e);
    // Détection scope manquant (unauthorized_client) — message explicite
    if (message.toLowerCase().includes('unauthorized_client')) {
      return NextResponse.json(
        {
          error: message,
          code: 'GMAIL_SCOPE_NOT_AUTHORIZED',
          hint: 'Active le scope https://www.googleapis.com/auth/gmail.send dans Workspace admin (Sécurité > API controls > Domain-Wide Delegation > ajouter le scope au client_id existant).',
        },
        { status: 502 }
      );
    }
    return NextResponse.json(
      { error: message, code: 'GMAIL_SEND_FAILED' },
      { status: 502 }
    );
  }

  // 2. INSERT outbound dans email_messages (tracking côté BO)
  const supabase = createAdminClient();
  const nowIso = new Date().toISOString();
  const { error: insertError } = await supabase.from('email_messages').insert({
    gmail_message_id: sendResult.gmailMessageId,
    gmail_thread_id: sendResult.gmailThreadId,
    gmail_history_id: null,
    brand: payload.brand,
    to_address: payload.fromAddress, // côté BO : l'alias depuis lequel on envoie
    from_email: payload.to.split(',')[0]?.trim() ?? payload.to,
    from_name: null,
    subject: payload.subject,
    snippet: payload.bodyText?.slice(0, 200) ?? null,
    body_text: payload.bodyText ?? null,
    body_html: payload.bodyHtml,
    received_at: nowIso,
    is_read: true,
    has_attachments: false,
    raw_headers: null,
    sent_by_user_id: userId,
    replied_at: nowIso,
  });
  if (insertError) {
    console.error('[Gmail Send] insert outbound failed:', insertError);
    // On continue : le mail est parti, le tracking est juste perdu
  }

  // 3. Si reply : marquer le mail parent comme répondu
  if (payload.parentEmailId) {
    const { error: updateError } = await supabase
      .from('email_messages')
      .update({
        replied_at: nowIso,
        reply_message_id: sendResult.gmailMessageId,
        sent_by_user_id: userId,
      })
      .eq('id', payload.parentEmailId);
    if (updateError) {
      console.error('[Gmail Send] update parent failed:', updateError);
    }
  }

  return NextResponse.json({
    ok: true,
    gmailMessageId: sendResult.gmailMessageId,
    gmailThreadId: sendResult.gmailThreadId,
  });
}
