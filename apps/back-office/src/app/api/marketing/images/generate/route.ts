/**
 * POST /api/marketing/images/generate
 *
 * Pipeline de génération d'images marketing via Gemini :
 * 1. Auth check
 * 2. Validation Zod du body
 * 3. Chargement des media_assets sources
 * 4. Download base64 des images sources depuis Cloudflare
 * 5. Composition du prompt (brand + preset + sources + canal)
 * 6. Appel GeminiClient.generateImage()
 * 7. Mode preview : retourne le base64 sans écriture DB
 * 8. Mode save : upload Cloudflare + INSERT media_assets (rollback si fail)
 *
 * Helpers techniques (env, fetch, upload, hash) extraits dans route-helpers.ts
 * pour respecter la limite des 400 lignes par fichier.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { createServerClient } from '@verone/utils/supabase/server';
import { buildCloudflareImageUrl } from '@verone/utils/cloudflare/images';
import { getGeminiClient, isGeminiError } from '@verone/integrations/gemini';
import { getBrand, getPreset } from '@verone/marketing/data';
import { composePromptWithSources } from '@verone/marketing/lib';
import { GenerateMarketingImageRequestSchema } from '@verone/marketing/types';
import type {
  GenerateMarketingImagePreviewResponse,
  GenerateMarketingImageSavedResponse,
} from '@verone/marketing/types';

import {
  MAX_SOURCE_IMAGES,
  MAX_TOTAL_SIZE_BYTES,
  buildCustomId,
  buildFilenameFromCustomId,
  deleteFromCloudflare,
  fetchImageAsBase64,
  getBrandUuid,
  resolveCloudflareEnv,
  uploadToCloudflareWithCustomId,
} from './route-helpers';

// =====================================================================
// ROUTE HANDLER
// =====================================================================

export async function POST(
  request: NextRequest
): Promise<
  NextResponse<
    | GenerateMarketingImagePreviewResponse
    | GenerateMarketingImageSavedResponse
    | { error: string }
  >
> {
  // 1. Auth
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  // 2. Parse + validation Zod
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Corps de la requête invalide (JSON attendu)' },
      { status: 400 }
    );
  }

  const parsed = GenerateMarketingImageRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: `Paramètres invalides : ${parsed.error.issues.map(e => e.message).join(', ')}`,
      },
      { status: 400 }
    );
  }

  const {
    sourceImageIds,
    productIds,
    brandSlug,
    presetId,
    targetChannel,
    customPrompt,
    saveImmediately,
  } = parsed.data;

  // Validation taille
  if (sourceImageIds.length > MAX_SOURCE_IMAGES) {
    return NextResponse.json(
      { error: `Maximum ${MAX_SOURCE_IMAGES} images sources autorisées` },
      { status: 400 }
    );
  }

  // 3. Charger les media_assets sources
  const { data: sourceAssets, error: assetsError } = await supabase
    .from('media_assets')
    .select(
      'id, cloudflare_image_id, public_url, alt_text, brand_ids, product_id'
    )
    .in('id', sourceImageIds);

  if (assetsError) {
    console.error(
      '[/api/marketing/images/generate] Supabase error:',
      assetsError
    );
    return NextResponse.json(
      { error: 'Erreur lors du chargement des images sources' },
      { status: 500 }
    );
  }

  if (sourceAssets?.length !== sourceImageIds.length) {
    return NextResponse.json(
      { error: 'Certaines images sources sont introuvables' },
      { status: 422 }
    );
  }

  const missingCloudflare = sourceAssets.filter(a => !a.cloudflare_image_id);
  if (missingCloudflare.length > 0) {
    return NextResponse.json(
      {
        error:
          'Certaines images sources ne sont pas encore hébergées (cloudflare_image_id manquant)',
      },
      { status: 422 }
    );
  }

  // 4. Charger brand + preset
  const brand = getBrand(brandSlug);
  const preset = getPreset(presetId);

  if (!brand) {
    return NextResponse.json(
      { error: `Marque inconnue : ${brandSlug}` },
      { status: 422 }
    );
  }

  if (!preset) {
    return NextResponse.json(
      { error: `Preset inconnu : ${presetId}` },
      { status: 422 }
    );
  }

  // 5. Download base64 des images sources
  const sourceImagesBase64: Array<{ mimeType: string; data: string }> = [];
  let totalSize = 0;

  for (const asset of sourceAssets) {
    // cloudflare_image_id est garanti non-null après le check missingCloudflare ci-dessus
    const imageUrl = buildCloudflareImageUrl(
      asset.cloudflare_image_id!,
      'public'
    );
    try {
      const { data, mimeType, sizeBytes } = await fetchImageAsBase64(imageUrl);
      totalSize += sizeBytes;
      if (totalSize > MAX_TOTAL_SIZE_BYTES) {
        return NextResponse.json(
          {
            error:
              'Taille cumulée des images sources dépasse 20 Mo. Réduisez le nombre ou la taille des images.',
          },
          { status: 422 }
        );
      }
      sourceImagesBase64.push({ mimeType, data });
    } catch (err) {
      console.error('[/api/marketing/images/generate] Image fetch error:', err);
      return NextResponse.json(
        { error: `Impossible de charger l'image source ${asset.id}` },
        { status: 422 }
      );
    }
  }

  // 6. Composer le prompt
  const composed = composePromptWithSources({
    brand: brandSlug,
    presetId,
    productDescription: '',
    sourceImagesCount: sourceImagesBase64.length,
    targetChannel,
    customPrompt: customPrompt ?? undefined,
  });

  const promptUsed = composed?.text ?? customPrompt ?? preset.template;

  // 7. Appel Gemini
  let imageBase64: string;
  let mimeType: string;
  let modelUsed: string;

  try {
    const geminiClient = getGeminiClient();
    const result = await geminiClient.generateImage({
      sourceImagesBase64,
      prompt: promptUsed,
    });
    imageBase64 = result.imageBase64;
    mimeType = result.mimeType;
    modelUsed = result.modelUsed;
  } catch (err) {
    console.error('[/api/marketing/images/generate] Gemini error:', err);

    if (isGeminiError(err)) {
      const httpStatus =
        err.code === 'AUTH_ERROR'
          ? 401
          : err.code === 'RATE_LIMIT'
            ? 429
            : err.code === 'VALIDATION_ERROR'
              ? 400
              : err.code === 'SAFETY_BLOCK'
                ? 422
                : 500;

      return NextResponse.json(
        { error: err.getUserMessage() },
        { status: httpStatus }
      );
    }

    return NextResponse.json(
      { error: "Erreur lors de la génération d'image. Veuillez réessayer." },
      { status: 500 }
    );
  }

  // 8. Mode preview : retourner le base64 sans écriture DB
  if (!saveImmediately) {
    const previewResponse: GenerateMarketingImagePreviewResponse = {
      mode: 'preview',
      imageBase64,
      mimeType,
      modelUsed,
      promptUsed,
    };
    return NextResponse.json(previewResponse);
  }

  // 9. Mode save : upload Cloudflare + INSERT media_assets
  let cloudflareEnv: Awaited<ReturnType<typeof resolveCloudflareEnv>>;
  try {
    cloudflareEnv = await resolveCloudflareEnv();
  } catch (err) {
    console.error(
      '[/api/marketing/images/generate] Cloudflare env missing:',
      err
    );
    return NextResponse.json(
      {
        error:
          "Configuration Cloudflare Images manquante. Contactez l'administrateur.",
      },
      { status: 500 }
    );
  }

  const { accountId, apiToken, imagesHash } = cloudflareEnv;

  // Construire le custom ID Cloudflare structuré
  const customId = buildCustomId(
    brandSlug,
    targetChannel,
    presetId,
    promptUsed
  );

  let cfImageId: string;

  try {
    const cfResult = await uploadToCloudflareWithCustomId(
      imageBase64,
      mimeType,
      customId,
      accountId,
      apiToken
    );
    cfImageId = cfResult.id;
  } catch (err) {
    console.error(
      '[/api/marketing/images/generate] Cloudflare upload error:',
      err
    );
    return NextResponse.json(
      { error: 'Upload Cloudflare échoué. Veuillez réessayer.' },
      { status: 500 }
    );
  }

  // Construction de la public_url
  const publicUrl = `https://imagedelivery.net/${imagesHash}/${cfImageId}/public`;

  // Mapper brand slug → brand UUID
  const brandUuid = await getBrandUuid(supabase, brandSlug);

  // Collecter les cloudflare_image_ids des sources pour le champ source_image_ids
  const sourceCfIds = sourceAssets
    .map(a => a.cloudflare_image_id)
    .filter((id): id is string => Boolean(id));

  const primaryProductId =
    productIds && productIds.length > 0 ? productIds[0] : null;

  // INSERT media_assets
  const filename = buildFilenameFromCustomId(customId, mimeType);
  const extension = mimeType === 'image/png' ? 'png' : 'jpg';

  const { data: insertedAsset, error: insertError } = await supabase
    .from('media_assets')
    .insert({
      cloudflare_image_id: cfImageId,
      public_url: publicUrl,
      filename,
      format: extension,
      asset_type: 'lifestyle',
      source: 'ai_generated',
      brand_ids: brandUuid ? [brandUuid] : [],
      product_id: primaryProductId,
      source_product_image_id: null,
      ai_prompt_used: promptUsed,
      generation_model: modelUsed,
      generation_at: new Date().toISOString(),
      source_image_ids: sourceCfIds,
      mise_en_scene: presetId,
      target_channel: targetChannel,
      tags: ['ai-generated', brandSlug, targetChannel],
      created_by: user.id,
    })
    .select('id, cloudflare_image_id, public_url, alt_text')
    .single();

  if (insertError || !insertedAsset) {
    console.error(
      '[/api/marketing/images/generate] INSERT media_assets failed:',
      insertError
    );
    // Rollback : supprimer l'image Cloudflare pour éviter un orphelin
    await deleteFromCloudflare(cfImageId, accountId, apiToken).catch(e => {
      console.error(
        '[/api/marketing/images/generate] Cloudflare rollback DELETE failed:',
        e
      );
    });

    return NextResponse.json(
      {
        error:
          "Erreur lors de la sauvegarde. L'image générée n'a pas pu être enregistrée.",
      },
      { status: 500 }
    );
  }

  const savedResponse: GenerateMarketingImageSavedResponse = {
    mode: 'saved',
    asset: {
      id: insertedAsset.id,
      cloudflare_image_id: insertedAsset.cloudflare_image_id ?? cfImageId,
      public_url: insertedAsset.public_url ?? publicUrl,
      alt_text: insertedAsset.alt_text,
    },
  };

  return NextResponse.json(savedResponse);
}
