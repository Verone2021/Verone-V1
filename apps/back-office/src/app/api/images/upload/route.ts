/**
 * API Route: POST /api/images/upload
 *
 * Depot d'une image depuis un ecran (navigateur) vers Cloudflare Images.
 *
 * POURQUOI CETTE ROUTE EXISTE
 * Depuis `BO-IMG-CF-002` (8 mai 2026), `smartUploadImage` n'envoie plus que
 * vers Cloudflare et exige `CLOUDFLARE_IMAGES_API_TOKEN`. Ce jeton est une cle
 * SERVEUR : Next.js ne l'expose pas au navigateur. Or les huit hooks de depot
 * (`use-product-images`, `use-consultation-images`, `use-collection-images`,
 * `use-logo-upload`, `use-simple-image-upload`, `use-media-asset-mutations`,
 * `use-sourcing-create-update`, et le hook LinkMe) tournent tous cote client :
 * `isCloudflareConfigured()` y renvoyait toujours `false` et le depot echouait
 * systematiquement avec « Cloudflare Images non configure ».
 *
 * Constat du 17/09/2026 : plus AUCUN ecran du back-office ne pouvait deposer
 * d'image depuis le 8 mai. Sur les 40 photos produit enregistrees depuis cette
 * date, 39 venaient de l'import du plugin navigateur, qui lui passe par le
 * serveur (`/api/sourcing/import`). Effet de bord : la validation d'un produit
 * source au catalogue, qui exige une photo, etait impossible.
 *
 * Le jeton ne doit evidemment JAMAIS etre publie cote client : c'est donc au
 * serveur de faire l'appel, derriere la garde admin back-office habituelle.
 *
 * 🔐 SECURITE: requiert une session admin back-office (owner/admin).
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { uploadImageToCloudflare } from '@verone/utils/cloudflare/images';

import { requireBackofficeAdmin } from '@/lib/guards';

/** Types acceptes, alignes sur les seaux images existants (validation.ts). */
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/avif',
] as const;

/** 10 Mo : meme plafond que le seau `product-images` et que le texte affiche. */
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

const MetadataSchema = z.object({
  ownerId: z.string().min(1).optional(),
  ownerType: z
    .enum(['product', 'category', 'collection', 'family', 'organisation'])
    .optional(),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const guardResult = await requireBackofficeAdmin(request);
  if (guardResult instanceof NextResponse) {
    return guardResult; // 401 ou 403
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
      {
        error: `Fichier trop lourd (${Math.round(file.size / 1024 / 1024)} Mo). Maximum 10 Mo.`,
      },
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
