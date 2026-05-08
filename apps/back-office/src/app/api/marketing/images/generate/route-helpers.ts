/**
 * Helpers pour POST /api/marketing/images/generate
 *
 * Extrait depuis route.ts pour respecter la limite des 400 lignes par fichier
 * (CLAUDE.md / code-standards.md).
 */

import { createHash } from 'crypto';

import type { createServerClient } from '@verone/utils/supabase/server';

// =====================================================================
// CONSTANTES
// =====================================================================

export const MAX_SOURCE_IMAGES = 5;
export const MAX_TOTAL_SIZE_BYTES = 20 * 1024 * 1024; // 20 Mo

// Cache brand slug → UUID (évite une SELECT à chaque requête dans le même process)
const brandUuidCache = new Map<string, string>();

// =====================================================================
// HELPERS
// =====================================================================

export interface CloudflareEnv {
  accountId: string;
  apiToken: string;
  imagesHash: string;
}

export async function resolveCloudflareEnv(): Promise<CloudflareEnv> {
  const accountId =
    process.env['CLOUDFLARE_ACCOUNT_ID'] ??
    process.env['NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_ID'];
  const apiToken = process.env['CLOUDFLARE_IMAGES_API_TOKEN'];
  const imagesHash =
    process.env['CLOUDFLARE_IMAGES_HASH'] ??
    process.env['NEXT_PUBLIC_CLOUDFLARE_IMAGES_HASH'];

  if (!accountId || !apiToken || !imagesHash) {
    throw new Error(
      'Cloudflare Images not configured. Missing CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_IMAGES_API_TOKEN or CLOUDFLARE_IMAGES_HASH.'
    );
  }

  return { accountId, apiToken, imagesHash };
}

export function shortHash(input: string): string {
  return createHash('sha256').update(input).digest('hex').slice(0, 6);
}

export function yyyymmdd(): string {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
}

export async function fetchImageAsBase64(url: string): Promise<{
  data: string;
  mimeType: string;
  sizeBytes: number;
}> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image at ${url}: HTTP ${response.status}`);
  }
  const contentType = response.headers.get('content-type') ?? 'image/jpeg';
  const mimeType = contentType.split(';')[0]?.trim() ?? 'image/jpeg';
  const arrayBuffer = await response.arrayBuffer();
  const data = Buffer.from(arrayBuffer).toString('base64');
  return { data, mimeType, sizeBytes: arrayBuffer.byteLength };
}

export async function getBrandUuid(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  brandSlug: string
): Promise<string | null> {
  const cached = brandUuidCache.get(brandSlug);
  if (cached) return cached;

  const { data, error } = await supabase
    .from('brands')
    .select('id')
    .eq('slug', brandSlug)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  brandUuidCache.set(brandSlug, data.id);
  return data.id;
}

export async function uploadToCloudflareWithCustomId(
  base64Data: string,
  mimeType: string,
  customId: string,
  accountId: string,
  apiToken: string
): Promise<{ id: string }> {
  // Convertir base64 → Blob
  const binaryString = Buffer.from(base64Data, 'base64');
  const blob = new Blob([binaryString], { type: mimeType });

  const extension = mimeType === 'image/png' ? 'png' : 'jpg';
  const filename = `${customId.replace(/\//g, '-')}.${extension}`;

  const formData = new FormData();
  formData.append('file', blob, filename);
  formData.append('id', customId);
  formData.append('requireSignedURLs', 'false');

  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiToken}`,
    },
    body: formData,
  });

  const json = (await response.json()) as {
    success: boolean;
    result?: { id: string };
    errors?: Array<{ message: string }>;
  };

  if (!json.success || !json.result?.id) {
    const errorMsg =
      json.errors?.map(e => e.message).join(', ') ?? 'Unknown Cloudflare error';
    throw new Error(`Cloudflare upload failed: ${errorMsg}`);
  }

  return { id: json.result.id };
}

export async function deleteFromCloudflare(
  imageId: string,
  accountId: string,
  apiToken: string
): Promise<void> {
  await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1/${encodeURIComponent(imageId)}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${apiToken}` },
    }
  );
}

export function buildCustomId(
  brandSlug: string,
  targetChannel: string,
  presetId: string,
  promptForHash: string
): string {
  const hashSuffix = shortHash(`${promptForHash}${Date.now()}`);
  const dateStr = yyyymmdd();
  return `verone/marketing/${brandSlug}/${targetChannel}/${dateStr}-${presetId}-${hashSuffix}`;
}

export function buildFilenameFromCustomId(
  customId: string,
  mimeType: string
): string {
  const extension = mimeType === 'image/png' ? 'png' : 'jpg';
  return `${customId.replace(/\//g, '-')}.${extension}`;
}
