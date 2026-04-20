/**
 * @verone/utils/upload/smart-upload
 * Wrapper d'upload intelligent: Cloudflare Images si configuré, Supabase Storage sinon.
 *
 * Usage:
 *   const result = await smartUploadImage(file, { bucket: 'product-images', path: 'products/xxx/img.jpg' });
 *   if (result.cloudflareImageId) {
 *     // utiliser Cloudflare
 *   } else {
 *     // utiliser result.supabasePublicUrl
 *   }
 */

import {
  isCloudflareConfigured,
  uploadImageToCloudflare,
} from '../cloudflare/images';
import type { CloudflareUploadMetadata } from '../cloudflare/images';
import { createClient } from '../supabase/client';

// ============================================================================
// TYPES
// ============================================================================

export interface SmartUploadOptions {
  /** Bucket Supabase Storage (fallback si Cloudflare non configuré) */
  bucket: string;
  /** Path dans Supabase Storage (ex: "products/uuid/timestamp.jpg") */
  path: string;
  /** ID de l'entité propriétaire (pour les métadonnées Cloudflare) */
  ownerId?: string;
  /** Type d'entité (pour les métadonnées Cloudflare) */
  ownerType?: CloudflareUploadMetadata['ownerType'];
}

export interface SmartUploadResult {
  /** Présent si uploadé vers Cloudflare Images */
  cloudflareImageId?: string;
  /** Présent si uploadé vers Supabase Storage */
  supabasePublicUrl?: string;
  /** Path dans Supabase Storage (présent si Supabase utilisé) */
  storagePath?: string;
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Upload une image vers Cloudflare Images si configuré, sinon vers Supabase Storage.
 *
 * Comportement:
 * - Si `isCloudflareConfigured()` → upload vers Cloudflare → retourne `{ cloudflareImageId }`
 * - Sinon → upload vers Supabase Storage → retourne `{ supabasePublicUrl, storagePath }`
 *
 * Les deux chemins sont mutuellement exclusifs dans le résultat.
 * Le composant consommateur doit persister les deux champs en DB pour backward compat.
 */
export async function smartUploadImage(
  file: File,
  options: SmartUploadOptions
): Promise<SmartUploadResult> {
  if (isCloudflareConfigured()) {
    return uploadViaCloudflare(file, options);
  }
  return uploadViaSupabase(file, options);
}

// ============================================================================
// IMPLEMENTATIONS
// ============================================================================

async function uploadViaCloudflare(
  file: File,
  options: SmartUploadOptions
): Promise<SmartUploadResult> {
  const result = await uploadImageToCloudflare(file, {
    ownerId: options.ownerId,
    ownerType: options.ownerType,
  });

  return { cloudflareImageId: result.id };
}

async function uploadViaSupabase(
  file: File,
  options: SmartUploadOptions
): Promise<SmartUploadResult> {
  const supabase = createClient();

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(options.bucket)
    .upload(options.path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Supabase Storage upload échoué: ${uploadError.message}`);
  }

  const { data: urlData } = supabase.storage
    .from(options.bucket)
    .getPublicUrl(options.path);

  return {
    supabasePublicUrl: urlData.publicUrl,
    storagePath: uploadData.path,
  };
}
