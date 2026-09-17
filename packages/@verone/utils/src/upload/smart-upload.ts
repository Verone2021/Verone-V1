/**
 * @verone/utils/upload/smart-upload
 * Upload Cloudflare Images uniquement (BO-IMG-CF-002, 2026-05-08).
 *
 * Décision : plus de fallback Supabase Storage. Toutes les images Verone
 * vivent désormais sur Cloudflare Images.
 *
 * 2026-09-17 — Correction d'une panne restée invisible 4 mois.
 * `isCloudflareConfigured()` exige `CLOUDFLARE_IMAGES_API_TOKEN`, qui est une
 * clé SERVEUR : Next.js ne l'expose jamais au navigateur. Or tous les écrans de
 * dépôt d'image sont des composants client. Résultat : depuis le 8 mai 2026,
 * `smartUploadImage` levait systématiquement « Cloudflare Images non
 * configuré » dès qu'un utilisateur déposait une photo — consultations, fiches
 * produit, logos, collections, LinkMe. Seul l'import du plugin navigateur
 * fonctionnait, parce qu'il tourne côté serveur.
 *
 * La clé ne doit évidemment pas être publiée côté client. On route donc le
 * dépôt du navigateur vers une route serveur (`/api/images/upload`), qui refait
 * l'appel Cloudflare derrière la garde admin back-office. Côté serveur, l'appel
 * direct est conservé : c'est le chemin qu'emprunte déjà `/api/sourcing/import`.
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
  /**
   * Route serveur qui relaie le dépôt quand on tourne dans le navigateur.
   * Chaque app expose la sienne ; la valeur par défaut convient au back-office
   * et à LinkMe.
   */
  uploadEndpoint?: string;
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

/** Route serveur par défaut, présente dans le back-office et dans LinkMe. */
export const DEFAULT_IMAGE_UPLOAD_ENDPOINT = '/api/images/upload';

// ============================================================================
// HELPERS
// ============================================================================

/** Vrai quand le code s'exécute dans un navigateur (pas de clé serveur). */
function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

const UploadResponseShape = (value: unknown): value is { id: string } =>
  typeof value === 'object' &&
  value !== null &&
  'id' in value &&
  typeof (value as { id: unknown }).id === 'string';

/**
 * Dépôt depuis le navigateur : le fichier transite par la route serveur, qui
 * détient seule le jeton Cloudflare.
 */
async function uploadViaServerRoute(
  file: File,
  options: SmartUploadOptions
): Promise<string> {
  const formData = new FormData();
  formData.append('file', file, file.name);

  if (options.ownerId ?? options.ownerType) {
    formData.append(
      'metadata',
      JSON.stringify({
        ownerId: options.ownerId,
        ownerType: options.ownerType,
      })
    );
  }

  const endpoint = options.uploadEndpoint ?? DEFAULT_IMAGE_UPLOAD_ENDPOINT;
  const response = await fetch(endpoint, { method: 'POST', body: formData });

  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null);
    const message =
      payload !== null &&
      typeof payload === 'object' &&
      'error' in payload &&
      typeof (payload as { error: unknown }).error === 'string'
        ? (payload as { error: string }).error
        : `Échec du dépôt de l'image (erreur ${response.status})`;
    throw new Error(message);
  }

  const payload: unknown = await response.json();

  if (!UploadResponseShape(payload)) {
    throw new Error("Réponse inattendue de la route de dépôt d'image");
  }

  return payload.id;
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Upload une image vers Cloudflare Images.
 *
 * Dans le navigateur, passe par la route serveur `/api/images/upload`.
 * Côté serveur, appelle Cloudflare directement et échoue avec une erreur
 * explicite si la configuration est absente.
 */
export async function smartUploadImage(
  file: File,
  options: SmartUploadOptions
): Promise<SmartUploadResult> {
  if (isBrowser()) {
    const cloudflareImageId = await uploadViaServerRoute(file, options);
    return { cloudflareImageId };
  }

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
