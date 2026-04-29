/**
 * @verone/utils/cloudflare/images
 * Helper pour l'API Cloudflare Images v1
 *
 * Documentation: https://developers.cloudflare.com/images/upload-images/
 */

import { z } from 'zod';

// ============================================================================
// TYPES
// ============================================================================

export interface CloudflareUploadMetadata {
  ownerId?: string;
  ownerType?: 'product' | 'category' | 'collection' | 'family' | 'organisation';
}

export interface CloudflareImageUploadResult {
  id: string;
  filename: string;
  uploaded: string;
  variants: string[];
  meta: Record<string, unknown>;
}

export type CloudflareImageVariant =
  | 'thumbnail'
  | 'medium'
  | 'large'
  | 'public';

// ============================================================================
// ERREUR CUSTOM
// ============================================================================

export class CloudflareNotConfiguredError extends Error {
  constructor() {
    super(
      'Cloudflare Images non configuré. Définir CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_IMAGES_API_TOKEN et CLOUDFLARE_IMAGES_HASH (ou NEXT_PUBLIC_CLOUDFLARE_IMAGES_HASH).'
    );
    this.name = 'CloudflareNotConfiguredError';
  }
}

// ============================================================================
// SCHEMAS ZOD
// ============================================================================

const CloudflareImageResultSchema = z.object({
  id: z.string(),
  filename: z.string(),
  uploaded: z.string(),
  variants: z.array(z.string()),
  meta: z.record(z.string(), z.unknown()).optional().default({}),
});

const CloudflareUploadResponseSchema = z.object({
  success: z.boolean(),
  errors: z
    .array(z.object({ message: z.string() }))
    .optional()
    .default([]),
  result: CloudflareImageResultSchema.optional(),
});

const CloudflareDeleteResponseSchema = z.object({
  success: z.boolean(),
  errors: z
    .array(z.object({ message: z.string() }))
    .optional()
    .default([]),
});

// ============================================================================
// HELPERS INTERNES
// ============================================================================

function getCloudflareConfig(): {
  accountId: string;
  apiToken: string;
  imagesHash: string;
} {
  const accountId =
    process.env['CLOUDFLARE_ACCOUNT_ID'] ??
    process.env['NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_ID'];
  const apiToken = process.env['CLOUDFLARE_IMAGES_API_TOKEN'];
  const imagesHash =
    process.env['CLOUDFLARE_IMAGES_HASH'] ??
    process.env['NEXT_PUBLIC_CLOUDFLARE_IMAGES_HASH'];

  if (!accountId || !apiToken || !imagesHash) {
    throw new CloudflareNotConfiguredError();
  }

  return { accountId, apiToken, imagesHash };
}

// ============================================================================
// API PUBLIQUE
// ============================================================================

/**
 * Vérifie si les variables d'environnement Cloudflare Images sont configurées.
 * Peut être appelé côté client (utilise NEXT_PUBLIC_*) et côté serveur.
 */
export function isCloudflareConfigured(): boolean {
  const accountId =
    process.env['CLOUDFLARE_ACCOUNT_ID'] ??
    process.env['NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_ID'];
  const apiToken = process.env['CLOUDFLARE_IMAGES_API_TOKEN'];
  const imagesHash =
    process.env['CLOUDFLARE_IMAGES_HASH'] ??
    process.env['NEXT_PUBLIC_CLOUDFLARE_IMAGES_HASH'];

  return Boolean(accountId && apiToken && imagesHash);
}

/**
 * Construit l'URL de delivery Cloudflare Images pour un imageId donné.
 *
 * Par défaut, utilise l'URL Cloudflare standard `imagedelivery.net/{hash}/{imageId}/{variant}`
 * qui fonctionne immédiatement pour toute Cloudflare Images Account.
 *
 * Pour activer le custom domain `images.veronecollections.fr`, définir l'env var
 * `NEXT_PUBLIC_CLOUDFLARE_USE_CUSTOM_DOMAIN=true` côté Vercel après que la zone
 * Cloudflare est active et le cert SSL Universal émis (1-24h après ajout du domaine).
 */
export function buildCloudflareImageUrl(
  imageId: string,
  variant: CloudflareImageVariant = 'public'
): string {
  const imagesHash =
    process.env['CLOUDFLARE_IMAGES_HASH'] ??
    process.env['NEXT_PUBLIC_CLOUDFLARE_IMAGES_HASH'];

  if (!imagesHash) {
    throw new CloudflareNotConfiguredError();
  }

  const useCustomDomain =
    process.env['NEXT_PUBLIC_CLOUDFLARE_USE_CUSTOM_DOMAIN'] === 'true';

  const baseUrl = useCustomDomain
    ? 'https://images.veronecollections.fr'
    : 'https://imagedelivery.net';

  return `${baseUrl}/${imagesHash}/${imageId}/${variant}`;
}

/**
 * Upload une image vers Cloudflare Images v1.
 * Accepte File, Blob ou Buffer (Node.js).
 *
 * @throws {CloudflareNotConfiguredError} si les env vars sont absentes
 * @throws {Error} si l'upload échoue côté Cloudflare
 */
export async function uploadImageToCloudflare(
  file: File | Blob | Uint8Array | ArrayBuffer,
  metadata?: CloudflareUploadMetadata
): Promise<CloudflareImageUploadResult> {
  const { accountId, apiToken } = getCloudflareConfig();

  const formData = new FormData();

  if (file instanceof Uint8Array || file instanceof ArrayBuffer) {
    // Node.js Buffer / Uint8Array / ArrayBuffer → Blob pour FormData
    // Copie en Uint8Array strict pour compatibilité BlobPart
    const uint8 =
      file instanceof Uint8Array ? new Uint8Array(file) : new Uint8Array(file);
    const blob = new Blob([uint8]);
    formData.append('file', blob, 'upload');
  } else if (file instanceof File) {
    formData.append('file', file, file.name);
  } else {
    // Blob générique
    formData.append('file', file, 'upload');
  }

  if (metadata) {
    formData.append('metadata', JSON.stringify(metadata));
  }

  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiToken}`,
    },
    body: formData,
  });

  const json: unknown = await response.json();
  const parsed = CloudflareUploadResponseSchema.safeParse(json);

  if (!parsed.success) {
    throw new Error(`Réponse Cloudflare invalide: ${parsed.error.message}`);
  }

  if (!parsed.data.success || !parsed.data.result) {
    const errorMessages =
      parsed.data.errors?.map(e => e.message).join(', ') ?? 'Erreur inconnue';
    throw new Error(`Cloudflare Images upload échoué: ${errorMessages}`);
  }

  return {
    id: parsed.data.result.id,
    filename: parsed.data.result.filename,
    uploaded: parsed.data.result.uploaded,
    variants: parsed.data.result.variants,
    meta: parsed.data.result.meta,
  };
}

/**
 * Supprime une image de Cloudflare Images.
 *
 * @throws {CloudflareNotConfiguredError} si les env vars sont absentes
 * @throws {Error} si la suppression échoue
 */
export async function deleteImageFromCloudflare(
  imageId: string
): Promise<void> {
  const { accountId, apiToken } = getCloudflareConfig();

  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1/${imageId}`;

  const response = await fetch(endpoint, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${apiToken}`,
    },
  });

  const json: unknown = await response.json();
  const parsed = CloudflareDeleteResponseSchema.safeParse(json);

  if (!parsed.success) {
    throw new Error(`Réponse Cloudflare invalide: ${parsed.error.message}`);
  }

  if (!parsed.data.success) {
    const errorMessages =
      parsed.data.errors?.map(e => e.message).join(', ') ?? 'Erreur inconnue';
    throw new Error(`Cloudflare Images delete échoué: ${errorMessages}`);
  }
}
