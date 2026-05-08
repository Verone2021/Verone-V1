/**
 * @verone/utils/upload/smart-upload
 * Upload Cloudflare Images uniquement (BO-IMG-CF-002, 2026-05-08).
 *
 * Décision : plus de fallback Supabase Storage. Toutes les images Verone
 * vivent désormais sur Cloudflare Images. Si la configuration Cloudflare
 * est manquante, on lève une erreur explicite (le runtime production en
 * a TOUJOURS besoin).
 */

import {
  isCloudflareConfigured,
  uploadImageToCloudflare,
} from '../cloudflare/images';
import type { CloudflareUploadMetadata } from '../cloudflare/images';

// ============================================================================
// TYPES
// ============================================================================

export interface SmartUploadOptions {
  /**
   * @deprecated conservé pour compat ascendante des appelants. Plus utilisé
   * en runtime depuis BO-IMG-CF-002. Tous les uploads vont sur Cloudflare.
   */
  bucket?: string;
  /**
   * @deprecated conservé pour compat ascendante des appelants. Plus utilisé
   * en runtime depuis BO-IMG-CF-002.
   */
  path?: string;
  /** ID de l'entité propriétaire (pour les métadonnées Cloudflare) */
  ownerId?: string;
  /** Type d'entité (pour les métadonnées Cloudflare) */
  ownerType?: CloudflareUploadMetadata['ownerType'];
}

export interface SmartUploadResult {
  /** Identifiant Cloudflare Images de l'image uploadée. Toujours présent. */
  cloudflareImageId: string;
  /**
   * @deprecated Toujours `undefined` depuis BO-IMG-CF-002. Conservé pour
   * compat ascendante des appelants existants. Les consommateurs doivent
   * utiliser `cloudflareImageId` et laisser le trigger DB générer l'URL.
   */
  supabasePublicUrl?: string;
  /**
   * @deprecated Toujours `undefined` depuis BO-IMG-CF-002. Conservé pour
   * compat ascendante des appelants existants.
   */
  storagePath?: string;
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Upload une image vers Cloudflare Images.
 *
 * Échoue avec une erreur explicite si la configuration Cloudflare est absente :
 * pas de fallback Supabase. Toute image Verone doit vivre sur Cloudflare.
 */
export async function smartUploadImage(
  file: File,
  options: SmartUploadOptions
): Promise<SmartUploadResult> {
  if (!isCloudflareConfigured()) {
    throw new Error(
      'Cloudflare Images non configuré : variables CLOUDFLARE_IMAGES_* manquantes. ' +
        "L'upload vers Supabase Storage n'est plus supporté (BO-IMG-CF-002)."
    );
  }

  const result = await uploadImageToCloudflare(file, {
    ownerId: options.ownerId,
    ownerType: options.ownerType,
  });

  return { cloudflareImageId: result.id };
}
