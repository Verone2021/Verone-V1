// =====================================================================
// Qonto Webhook Handler
// Date: 2025-10-11
// Description: Réception webhooks Qonto temps réel + auto-matching
// STATUS: DÉSACTIVÉ Phase 1 (Finance module disabled)
// =====================================================================

import { NextRequest, NextResponse } from 'next/server';
// DÉSACTIVÉ PHASE 1
// import { createClient } from '@/lib/supabase/server';
// import type { QontoWebhookPayload } from '@/lib/qonto/types';
// import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// =====================================================================
// WEBHOOK SIGNATURE VALIDATION
// =====================================================================

function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  if (!secret) {
    console.warn('⚠️  QONTO_WEBHOOK_SECRET not configured - skipping signature validation');
    return true; // Allow in dev if no secret
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    // Timing-safe comparison pour éviter timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Webhook signature validation error:', error);
    return false;
  }
}

// =====================================================================
// WEBHOOK HANDLER
// =====================================================================

export async function POST(request: NextRequest) {
  // FEATURE FLAG: Finance module disabled for Phase 1
  return NextResponse.json(
    {
      success: false,
      disabled: true,
      message: 'Webhook Qonto désactivé pour déploiement Phase 1',
      phase: 'Phase 1 - Finance module en Phase 2',
    },
    { status: 503 }
  );

  // CODE ORIGINAL DISPONIBLE DANS L'HISTORIQUE GIT - RÉACTIVATION PHASE 2
}
