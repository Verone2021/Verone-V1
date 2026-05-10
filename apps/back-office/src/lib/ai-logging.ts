/**
 * AI generation logging helper (server-side).
 *
 * Insère un log dans `ai_generation_logs` après chaque appel Gemini.
 * Fire-and-forget : ne bloque jamais la requête utilisateur si l'INSERT
 * Supabase échoue (just logs côté server).
 *
 * Cost estimation (Gemini Pricing 2026, approximatif) :
 *   - Text input  : $0.075 per 1M tokens  ≈ 0.0075 cents per 1K tokens
 *   - Text output : $0.30 per 1M tokens   ≈ 0.03 cents per 1K tokens
 *   - Image gen   : $0.039 per image      ≈ 4 cents par image
 *
 * Le coût est estimé en cents (entier) pour faciliter l'agrégation SQL.
 */

import type { Json } from '@verone/types';
import { createServerClient } from '@verone/utils/supabase/server';

export interface AiLogEntry {
  endpoint: string;
  model: string;
  latencyMs: number;
  tokensInput?: number;
  tokensOutput?: number;
  errorCode?: string | null;
  /** Metadata libre (productId, brand, channel...) */
  metadata?: Record<string, Json | null | undefined>;
}

const COST_PER_1K_INPUT_CENTS = 0.0075;
const COST_PER_1K_OUTPUT_CENTS = 0.03;
const COST_PER_IMAGE_CENTS = 4;

function estimateCostCents(entry: AiLogEntry): number {
  if (entry.endpoint.includes('image')) {
    return COST_PER_IMAGE_CENTS;
  }
  const inputCost = ((entry.tokensInput ?? 0) / 1000) * COST_PER_1K_INPUT_CENTS;
  const outputCost =
    ((entry.tokensOutput ?? 0) / 1000) * COST_PER_1K_OUTPUT_CENTS;
  return Math.max(0, Math.round(inputCost + outputCost));
}

export async function logAiGeneration(entry: AiLogEntry): Promise<void> {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from('ai_generation_logs').insert({
      endpoint: entry.endpoint,
      model: entry.model,
      latency_ms: entry.latencyMs,
      tokens_input: entry.tokensInput ?? null,
      tokens_output: entry.tokensOutput ?? null,
      cost_cents_estimated: estimateCostCents(entry),
      error_code: entry.errorCode ?? null,
      user_id: user?.id ?? null,
      request_metadata: (entry.metadata ?? null) as Json | null,
    });

    if (error) {
      console.warn('[ai-logging] insert failed:', error.message);
    }
  } catch (err) {
    console.warn(
      '[ai-logging] unexpected error:',
      err instanceof Error ? err.message : err
    );
  }
}
