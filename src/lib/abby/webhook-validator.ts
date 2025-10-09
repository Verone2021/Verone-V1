// =====================================================================
// Abby Webhook Signature Validation
// Date: 2025-10-11
// Description: Validation HMAC-SHA256 signatures webhooks Abby
// =====================================================================

import crypto from 'crypto';

// =====================================================================
// TYPES
// =====================================================================

export interface WebhookValidationResult {
  valid: boolean;
  error?: string;
}

// =====================================================================
// VALIDATE WEBHOOK SIGNATURE
// =====================================================================

/**
 * Valide signature HMAC-SHA256 d'un webhook Abby
 *
 * @param payload - Corps brut du webhook (string JSON)
 * @param signature - Header X-Abby-Signature du webhook
 * @param secret - ABBY_WEBHOOK_SECRET (depuis env)
 * @returns Résultat validation avec erreur si invalide
 *
 * @example
 * const result = validateWebhookSignature(
 *   JSON.stringify(body),
 *   request.headers.get('X-Abby-Signature'),
 *   process.env.ABBY_WEBHOOK_SECRET
 * );
 *
 * if (!result.valid) {
 *   return NextResponse.json({ error: result.error }, { status: 401 });
 * }
 */
export function validateWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string | undefined
): WebhookValidationResult {
  // 1. Vérifier que secret est configuré
  if (!secret) {
    return {
      valid: false,
      error: 'Webhook secret not configured (ABBY_WEBHOOK_SECRET missing)',
    };
  }

  // 2. Vérifier que signature est fournie
  if (!signature) {
    return {
      valid: false,
      error: 'Missing webhook signature (X-Abby-Signature header)',
    };
  }

  // 3. Calculer HMAC-SHA256 du payload
  const computedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  // 4. Comparer signatures (timing-safe comparison)
  const expectedSignature = signature.toLowerCase();
  const isValid = crypto.timingSafeEqual(
    Buffer.from(computedSignature),
    Buffer.from(expectedSignature)
  );

  if (!isValid) {
    return {
      valid: false,
      error: 'Invalid webhook signature',
    };
  }

  // 5. Signature valide
  return { valid: true };
}

// =====================================================================
// EXTRACT RAW BODY (HELPER NEXT.JS)
// =====================================================================

/**
 * Extraire corps brut d'une requête Next.js (nécessaire pour signature)
 *
 * @param request - NextRequest
 * @returns Corps brut en string
 *
 * @example
 * const rawBody = await extractRawBody(request);
 * const result = validateWebhookSignature(
 *   rawBody,
 *   request.headers.get('X-Abby-Signature'),
 *   process.env.ABBY_WEBHOOK_SECRET
 * );
 */
export async function extractRawBody(request: Request): Promise<string> {
  const text = await request.text();
  return text;
}

// =====================================================================
// PARSE AND VALIDATE WEBHOOK (ALL-IN-ONE)
// =====================================================================

/**
 * Parse et valide webhook en une seule opération
 *
 * @param request - NextRequest
 * @param secret - ABBY_WEBHOOK_SECRET (depuis env)
 * @returns Payload parsé si valide, sinon erreur
 *
 * @example
 * const result = await parseAndValidateWebhook(
 *   request,
 *   process.env.ABBY_WEBHOOK_SECRET
 * );
 *
 * if (!result.valid) {
 *   return NextResponse.json({ error: result.error }, { status: 401 });
 * }
 *
 * const payload = result.payload; // Type-safe parsed payload
 */
export async function parseAndValidateWebhook<T = unknown>(
  request: Request,
  secret: string | undefined
): Promise<
  | { valid: true; payload: T }
  | { valid: false; error: string; payload?: never }
> {
  try {
    // 1. Extraire corps brut (nécessaire pour signature)
    const rawBody = await extractRawBody(request);

    // 2. Récupérer signature header
    const signature = request.headers.get('X-Abby-Signature');

    // 3. Valider signature
    const validationResult = validateWebhookSignature(
      rawBody,
      signature,
      secret
    );

    if (!validationResult.valid) {
      return {
        valid: false,
        error: validationResult.error || 'Webhook validation failed',
      };
    }

    // 4. Parser payload JSON
    let payload: T;
    try {
      payload = JSON.parse(rawBody) as T;
    } catch (parseError) {
      return {
        valid: false,
        error: 'Invalid JSON payload',
      };
    }

    // 5. Success
    return {
      valid: true,
      payload,
    };
  } catch (error) {
    return {
      valid: false,
      error:
        error instanceof Error
          ? error.message
          : 'Unexpected webhook validation error',
    };
  }
}

// =====================================================================
// GENERATE TEST SIGNATURE (POUR TESTS E2E)
// =====================================================================

/**
 * Génère signature HMAC-SHA256 pour tests E2E
 *
 * @param payload - Corps webhook (object ou string)
 * @param secret - ABBY_WEBHOOK_SECRET
 * @returns Signature HMAC-SHA256 hex
 *
 * @example
 * const payload = { id: 'evt_123', type: 'invoice.paid', data: { ... } };
 * const signature = generateTestSignature(payload, 'test-secret-key');
 *
 * // Utiliser dans test E2E
 * await fetch('/api/webhooks/abby', {
 *   method: 'POST',
 *   headers: {
 *     'Content-Type': 'application/json',
 *     'X-Abby-Signature': signature,
 *   },
 *   body: JSON.stringify(payload),
 * });
 */
export function generateTestSignature(
  payload: unknown,
  secret: string
): string {
  const payloadString =
    typeof payload === 'string' ? payload : JSON.stringify(payload);

  return crypto.createHmac('sha256', secret).update(payloadString).digest('hex');
}
