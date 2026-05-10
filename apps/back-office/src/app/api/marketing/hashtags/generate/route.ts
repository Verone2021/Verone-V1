/**
 * POST /api/marketing/hashtags/generate
 *
 * Génère 5 hashtags pertinents pour un produit + canal cible via Gemini.
 * Stratégie 2026 : 1-2 niche-specific (10K-100K reach) + 1-2 industry +
 * 1 broad. Privilégier la pertinence sur le volume (recherche Brandwatch
 * 2025-2026).
 */

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import {
  generateGeminiText,
  type GenerateGeminiTextResult,
} from '@verone/integrations/gemini/client';
import { createServerClient } from '@verone/utils/supabase/server';

import { logAiGeneration } from '@/lib/ai-logging';

const RequestSchema = z
  .object({
    productId: z.string().uuid().optional(),
    productName: z.string().min(1).max(200).optional(),
    productCategory: z.string().max(100).optional(),
    targetChannel: z.enum([
      'instagram',
      'facebook',
      'pinterest',
      'tiktok',
      'linkedin',
    ]),
    brand: z.enum(['verone', 'boemia', 'solar', 'flos']).default('verone'),
    tone: z.enum(['premium', 'fun', 'minimal']).default('premium'),
  })
  .refine(d => Boolean(d.productId) || Boolean(d.productName), {
    message: 'productId ou productName requis',
  });

interface HashtagsResponse {
  hashtags: string[];
  modelUsed: string;
}

const BRAND_BRIEFS: Record<string, string> = {
  verone:
    'Vérone : concept store français de décoration et mobilier d intérieur premium, sourcing créatif, esprit luxe minimaliste.',
  boemia:
    'Boemia : marque déco bohème, matières naturelles (rotin, lin, bois), inspiration voyage et artisanat.',
  solar:
    'Solar : marque déco lumineuse et chaleureuse, tons dorés et terre, esprit méditerranéen.',
  flos: 'Flos : marque mobilier design contemporain, lignes épurées, palette neutre.',
};

const CHANNEL_NORMS: Record<string, string> = {
  instagram:
    '5 hashtags max, mix #brand + #niche + #industry, #broad en dernier.',
  facebook:
    '3-5 hashtags max, peu utilisés sur FB mais utiles pour le matching.',
  pinterest: '5-10 keywords plus que hashtags, axe SEO épingle.',
  tiktok: '4-6 hashtags, dont 1 trending si pertinent, viraux courts.',
  linkedin: '3-5 hashtags professionnels, focus B2B.',
};

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Auth check
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

  let productName = parsed.data.productName;
  const productCategory = parsed.data.productCategory;

  if (parsed.data.productId && !productName) {
    const { data: product } = await supabase
      .from('products')
      .select('name, subcategory_id')
      .eq('id', parsed.data.productId)
      .maybeSingle();
    productName = product?.name ?? undefined;
  }

  if (!productName) {
    return NextResponse.json(
      { error: 'Produit introuvable ou productName manquant' },
      { status: 404 }
    );
  }

  const brandBrief = BRAND_BRIEFS[parsed.data.brand] ?? BRAND_BRIEFS.verone;
  const channelNorm =
    CHANNEL_NORMS[parsed.data.targetChannel] ?? CHANNEL_NORMS.instagram;

  const prompt = `Tu es un expert marketing reseaux sociaux pour la marque ${parsed.data.brand}.
${brandBrief}

Produit a promouvoir : "${productName}"${productCategory ? ` (categorie : ${productCategory})` : ''}
Canal cible : ${parsed.data.targetChannel}
Norme canal : ${channelNorm}
Tonalite : ${parsed.data.tone}

Genere EXACTEMENT 5 hashtags pertinents, en francais, classes du plus niche au plus large.
Pas d explication, JUSTE les 5 hashtags separes par des espaces, chacun commencant par #.
Pas de hashtags generiques type #love #insta. Privilegie la pertinence produit + brand.

Exemple de format de sortie :
#decointerieurfr #lampedesigner #ambiancecocooning #decoration #design`;

  let result: GenerateGeminiTextResult;
  const startTime = Date.now();
  try {
    result = await generateGeminiText({
      prompt,
      temperature: 0.6,
      maxOutputTokens: 200,
    });
  } catch (err) {
    void logAiGeneration({
      endpoint: 'marketing/hashtags',
      model: 'gemini-2.5-flash',
      latencyMs: Date.now() - startTime,
      errorCode: err instanceof Error ? err.message.slice(0, 64) : 'unknown',
      metadata: {
        targetChannel: parsed.data.targetChannel,
        brand: parsed.data.brand,
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
    endpoint: 'marketing/hashtags',
    model: result.modelUsed,
    latencyMs: Date.now() - startTime,
    tokensOutput: Math.ceil(result.text.length / 4),
    metadata: {
      targetChannel: parsed.data.targetChannel,
      brand: parsed.data.brand,
      productId: parsed.data.productId ?? null,
    },
  });

  const hashtags = result.text
    .split(/\s+/)
    .filter(t => t.startsWith('#'))
    .slice(0, 5);

  if (hashtags.length === 0) {
    return NextResponse.json(
      { error: 'No hashtags generated', raw: result.text },
      { status: 502 }
    );
  }

  const payload: HashtagsResponse = {
    hashtags,
    modelUsed: result.modelUsed,
  };

  return NextResponse.json(payload);
}
