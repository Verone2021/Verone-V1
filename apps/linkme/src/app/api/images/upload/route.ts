/**
 * API Route: POST /api/images/upload
 *
 * Depot d'une image depuis un ecran LinkMe vers Cloudflare Images.
 *
 * Meme raison d'etre que la route jumelle du back-office : le jeton
 * `CLOUDFLARE_IMAGES_API_TOKEN` est une cle SERVEUR, jamais exposee au
 * navigateur, alors que `smartUploadImage` est appele depuis des composants
 * client. Depuis le 8 mai 2026 (`BO-IMG-CF-002`), tout depot d'image lance
 * depuis un ecran echouait donc avec « Cloudflare Images non configure ».
 * Constate et corrige le 17/09/2026.
 *
 * Securite : affilie LinkMe authentifie avec un role LinkMe actif.
 *
 * @module api/images/upload
 * @since 2026-09-17
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { uploadImageToCloudflare } from '@verone/utils/cloudflare/images';
import { createServerClient } from '@verone/utils/supabase/server';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/avif',
] as const;

/** 5 Mo : plafond du seau `affiliate-products`. */
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

const MetadataSchema = z.object({
  ownerId: z.string().min(1).optional(),
  ownerType: z
    .enum(['product', 'category', 'collection', 'family', 'organisation'])
    .optional(),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
  }

  const { data: userRole } = await supabase
    .from('user_app_roles')
    .select('id')
    .eq('user_id', user.id)
    .eq('app', 'linkme')
    .eq('is_active', true)
    .maybeSingle();

  if (!userRole) {
    return NextResponse.json({ error: 'Acces refuse' }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: 'Requete invalide : un envoi de fichier est attendu' },
      { status: 400 }
    );
  }

  const file = formData.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: 'Aucun fichier recu sous la cle « file »' },
      { status: 400 }
    );
  }

  if (
    !ALLOWED_MIME_TYPES.includes(
      file.type as (typeof ALLOWED_MIME_TYPES)[number]
    )
  ) {
    return NextResponse.json(
      {
        error: `Format non accepte (${file.type || 'inconnu'}). Formats acceptes : JPG, PNG, WEBP, AVIF.`,
      },
      { status: 415 }
    );
  }

  if (file.size === 0) {
    return NextResponse.json({ error: 'Fichier vide' }, { status: 400 });
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: 'Fichier trop lourd. Maximum 5 Mo.' },
      { status: 413 }
    );
  }

  const rawMetadata = formData.get('metadata');
  let metadata: z.infer<typeof MetadataSchema> = {};

  if (typeof rawMetadata === 'string' && rawMetadata.length > 0) {
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawMetadata);
    } catch {
      return NextResponse.json(
        { error: 'Metadonnees illisibles' },
        { status: 400 }
      );
    }
    const parsed = MetadataSchema.safeParse(parsedJson);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Metadonnees invalides' },
        { status: 400 }
      );
    }
    metadata = parsed.data;
  }

  try {
    const result = await uploadImageToCloudflare(file, metadata);
    return NextResponse.json({ id: result.id });
  } catch (error) {
    console.error('[API images/upload] Echec Cloudflare:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Echec du depot de l'image",
      },
      { status: 502 }
    );
  }
}
