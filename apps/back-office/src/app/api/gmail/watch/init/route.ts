/**
 * API Route ADMIN: Initialise la surveillance Gmail (users.watch)
 *
 * POST /api/gmail/watch/init
 *
 * Active la réception des notifications Pub/Sub pour les 4 adresses
 * listées dans GMAIL_WATCH_ADDRESSES. À appeler une fois après le déploiement
 * des variables d'environnement Gmail, puis tous les 7 jours pour renouveler
 * (un cron sera ajouté en sprint suivant).
 *
 * Réponse :
 *   { ok: true, summary: { watched, failed }, successes: [...], failures: [...] }
 *
 * Sécurité : authentification admin back-office requise.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { startWatchAll } from '@verone/integrations/gmail';

import { requireBackofficeAdmin } from '@/lib/guards';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const guardResult = await requireBackofficeAdmin(request);
  if (guardResult instanceof NextResponse) {
    return guardResult;
  }

  const topicName = process.env.GMAIL_PUBSUB_TOPIC;
  if (!topicName) {
    return NextResponse.json(
      {
        error:
          'GMAIL_PUBSUB_TOPIC manquant. Configurez la variable Vercel avant init.',
        code: 'MISSING_TOPIC',
      },
      { status: 500 }
    );
  }

  try {
    const result = await startWatchAll(topicName);

    return NextResponse.json({
      ok: result.failures.length === 0,
      topicName,
      summary: {
        watched: result.successes.length,
        failed: result.failures.length,
      },
      successes: result.successes,
      failures: result.failures,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Erreur inconnue';
    console.error('[Gmail Watch Init] erreur batch :', e);
    return NextResponse.json(
      { error: message, code: 'WATCH_BATCH_FAILED' },
      { status: 500 }
    );
  }
}
