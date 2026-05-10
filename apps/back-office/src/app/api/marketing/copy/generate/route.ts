/**
 * POST /api/marketing/copy/generate
 *
 * Génère un trio description courte / description longue / caption Instagram
 * pour un produit, via Gemini. Utilisé dans le MarketingStudio pour
 * accélérer la création de contenu post.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import {
  generateGeminiText,
  type GenerateGeminiTextResult,
} from '@verone/integrations/gemini/client';
import { createServerClient } from '@verone/utils/supabase/server';

import { logAiGeneration } from '@/lib/ai-logging';

const RequestSchema = z.object({
  productId: z.string().uuid(),
  targetChannel: z.enum([
    'instagram',
    'facebook',
    'pinterest',
    'tiktok',
    'linkedin',
    'site_internet',
    'newsletter',
  ]),
  brand: z.enum(['verone', 'boemia', 'solar', 'flos']).default('verone'),
  tone: z
    .enum(['premium', 'fun', 'minimal', 'storytelling'])
    .default('premium'),
});

interface CopyResponse {
  short: string;
  long: string;
  caption: string;
  modelUsed: string;
}

interface ParsedCopy {
  short: string;
  long: string;
  caption: string;
}

function parseCopyOutput(text: string): ParsedCopy | null {
  // Cherche les marqueurs SHORT: / LONG: / CAPTION:
  const shortMatch = text.match(
    /SHORT\s*:\s*([^\n]+(?:\n(?!LONG:|CAPTION:)[^\n]+)*)/i
  );
  const longMatch = text.match(
    /LONG\s*:\s*([^\n]+(?:\n(?!SHORT:|CAPTION:)[^\n]+)*)/i
  );
  const captionMatch = text.match(
    /CAPTION\s*:\s*([^\n]+(?:\n(?!SHORT:|LONG:)[^\n]+)*)/i
  );

  if (!shortMatch?.[1] || !longMatch?.[1] || !captionMatch?.[1]) return null;

  return {
    short: shortMatch[1].trim(),
    long: longMatch[1].trim(),
    caption: captionMatch[1].trim(),
  };
}

const BRAND_BRIEFS: Record<string, string> = {
  verone:
    'Vérone : concept store déco premium français, sourcing créatif, ton minimaliste et raffiné.',
  boemia: 'Boemia : marque déco bohème, matières naturelles, esprit voyage.',
  solar: 'Solar : marque déco chaleureuse, tons dorés, esprit méditerranéen.',
  flos: 'Flos : marque mobilier design contemporain, épuré et fonctionnel.',
};

export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let bodyJson: unknown;
  try {
    bodyJson = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(bodyJson);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { data: product } = await supabase
    .from('products')
    .select('name, description, meta_description')
    .eq('id', parsed.data.productId)
    .maybeSingle();

  if (!product) {
    return NextResponse.json({ error: 'Produit introuvable' }, { status: 404 });
  }

  const brandBrief = BRAND_BRIEFS[parsed.data.brand] ?? BRAND_BRIEFS.verone;

  const prompt = `Tu es copywriter pour ${parsed.data.brand}.
${brandBrief}

Produit : "${product.name}"
Description existante : "${product.description ?? '(vide)'}"
Meta description SEO existante : "${product.meta_description ?? '(vide)'}"
Canal cible : ${parsed.data.targetChannel}
Tonalite : ${parsed.data.tone}

Genere 3 textes en francais, dans ce format STRICT (respecte les marqueurs SHORT/LONG/CAPTION) :

SHORT: une phrase de 80-120 caracteres maximum, accroche commerciale claire.
LONG: 2 a 3 phrases, 200-400 caracteres, fait ressentir l ambiance + benefices, pas trop technique.
CAPTION: caption ${parsed.data.targetChannel} de 100-200 caracteres, friendly, peut inclure 1 emoji discret. PAS de hashtags (geres separement).

Pas d autre texte, juste les 3 lignes avec les marqueurs.`;

  let result: GenerateGeminiTextResult;
  const startTime = Date.now();
  try {
    result = await generateGeminiText({
      prompt,
      temperature: 0.7,
      maxOutputTokens: 600,
    });
  } catch (err) {
    void logAiGeneration({
      endpoint: 'marketing/copy',
      model: 'gemini-2.5-flash',
      latencyMs: Date.now() - startTime,
      errorCode: err instanceof Error ? err.message.slice(0, 64) : 'unknown',
      metadata: {
        targetChannel: parsed.data.targetChannel,
        brand: parsed.data.brand,
        productId: parsed.data.productId,
      },
    });
    return NextResponse.json(
      {
        error: 'Gemini error',
        message: err instanceof Error ? err.message : 'unknown',
      },
      { status: 502 }
    );
  }
  void logAiGeneration({
    endpoint: 'marketing/copy',
    model: result.modelUsed,
    latencyMs: Date.now() - startTime,
    tokensOutput: Math.ceil(result.text.length / 4),
    metadata: {
      targetChannel: parsed.data.targetChannel,
      brand: parsed.data.brand,
      productId: parsed.data.productId,
    },
  });

  const parsedCopy = parseCopyOutput(result.text);
  if (!parsedCopy) {
    return NextResponse.json(
      { error: 'Format Gemini inattendu', raw: result.text },
      { status: 502 }
    );
  }

  const payload: CopyResponse = {
    ...parsedCopy,
    modelUsed: result.modelUsed,
  };

  return NextResponse.json(payload);
}
