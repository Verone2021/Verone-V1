/**
 * 🚀 VÉRONE - Utilitaires Supabase Storage Optimisés
 *
 * Helpers pour upload robuste selon les meilleures pratiques Supabase
 * Gestion d'erreurs avancée et retry automatique
 */

import { createClient } from '@verone/utils/supabase/client';

import type { BucketType, UserProfile } from './validation';

// Types d'erreurs Supabase spécifiques
export type SupabaseErrorType =
  | 'BUCKET_NOT_FOUND'
  | 'POLICY_VIOLATION'
  | 'FILE_TOO_LARGE'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'QUOTA_EXCEEDED'
  | 'INVALID_CREDENTIALS'
  | 'UNKNOWN_ERROR';

export interface UploadError {
  type: SupabaseErrorType;
  message: string;
  originalError?: any;
  retryable: boolean;
}

export interface UploadProgress {
  uploaded: number;
  total: number;
  percentage: number;
  speed?: number; // bytes per second
}

export interface UploadResult {
  success: boolean;
  data?: {
    path: string;
    publicUrl: string;
    fullPath: string;
  };
  error?: UploadError;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

// Configuration retry par défaut
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
};

/**
 * 🔍 Analyse l'erreur Supabase et la catégorise
 */
export function categorizeSupabaseError(error: any): UploadError {
  const message = error?.message || error?.toString() || 'Erreur inconnue';
  const code = error?.code || error?.status;

  // Erreurs de bucket
  if (message.includes('Bucket not found') || code === 'bucket_not_found') {
    return {
      type: 'BUCKET_NOT_FOUND',
      message:
        "Configuration de stockage incorrecte. Contactez l'administrateur.",
      originalError: error,
      retryable: false,
    };
  }

  // Erreurs de politique RLS
  if (
    message.includes('policy') ||
    message.includes('permission') ||
    code === 42501
  ) {
    return {
      type: 'POLICY_VIOLATION',
      message: 'Permissions insuffisantes. Essayez de vous reconnecter.',
      originalError: error,
      retryable: false,
    };
  }

  // Erreurs de taille
  if (
    message.includes('size') ||
    message.includes('too large') ||
    code === 'file_size_limit_exceeded'
  ) {
    return {
      type: 'FILE_TOO_LARGE',
      message: 'Fichier trop volumineux pour ce type de contenu.',
      originalError: error,
      retryable: false,
    };
  }

  // Erreurs réseau (retryable)
  if (
    message.includes('network') ||
    message.includes('timeout') ||
    message.includes('fetch') ||
    code >= 500
  ) {
    return {
      type: 'NETWORK_ERROR',
      message: 'Problème de connexion. Nouvelle tentative en cours...',
      originalError: error,
      retryable: true,
    };
  }

  // Timeout (retryable)
  if (message.includes('timeout') || code === 'TIMEOUT') {
    return {
      type: 'TIMEOUT',
      message: 'Le serveur met trop de temps à répondre. Nouvelle tentative...',
      originalError: error,
      retryable: true,
    };
  }

  // Quota dépassé
  if (
    message.includes('quota') ||
    message.includes('limit') ||
    code === 'quota_exceeded'
  ) {
    return {
      type: 'QUOTA_EXCEEDED',
      message: 'Limite de stockage atteinte. Contactez votre administrateur.',
      originalError: error,
      retryable: false,
    };
  }

  // Credentials invalides
  if (
    message.includes('credentials') ||
    message.includes('unauthorized') ||
    code === 401
  ) {
    return {
      type: 'INVALID_CREDENTIALS',
      message: 'Session expirée. Veuillez vous reconnecter.',
      originalError: error,
      retryable: false,
    };
  }

  // Erreur générique
  return {
    type: 'UNKNOWN_ERROR',
    message: "Erreur lors de l'upload. Veuillez réessayer.",
    originalError: error,
    retryable: true,
  };
}

/**
 * ⏱️ Attendre avec délai (pour retry)
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 🔄 Calcule le délai de retry avec backoff exponentiel
 */
function calculateRetryDelay(attempt: number, config: RetryConfig): number {
  const delay =
    config.baseDelayMs * Math.pow(config.backoffMultiplier, attempt - 1);
  return Math.min(delay, config.maxDelayMs);
}

/**
 * 👤 Récupère le profil utilisateur actuel
 */
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const supabase = createClient();

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.warn('🔐 Utilisateur non connecté');
      return null;
    }

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_id, role, user_type')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      console.warn('👤 Profil utilisateur introuvable:', profileError?.message);
      return null;
    }

    return profile as UserProfile;
  } catch (error) {
    console.error('💥 Erreur récupération profil:', error);
    return null;
  }
}

/**
 * 📤 Upload avec retry automatique et gestion d'erreurs robuste
 */
export async function uploadWithRetry(
  file: File,
  bucket: BucketType,
  filePath: string,
  onProgress?: (progress: UploadProgress) => void,
  retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<UploadResult> {
  const supabase = createClient();
  let attempt = 0;
  let lastError: UploadError | null = null;

  while (attempt <= retryConfig.maxRetries) {
    attempt++;

    try {
      console.log(
        `🚀 Tentative upload ${attempt}/${retryConfig.maxRetries + 1}:`,
        filePath
      );

      // Simuler progress pour les petits fichiers
      onProgress?.({
        uploaded: 0,
        total: file.size,
        percentage: 0,
      });

      // Options d'upload optimisées selon les meilleures pratiques
      const uploadOptions = {
        cacheControl: '3600', // Cache 1 heure
        upsert: false, // Éviter les conflits
        contentType: file.type,
        // Metadata pour debugging et analytics
        metadata: {
          uploadAttempt: attempt.toString(),
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
        },
      };

      // Upload principal
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, uploadOptions);

      if (uploadError) {
        throw uploadError;
      }

      console.log('✅ Upload Storage réussi:', uploadData.path);

      // Progress à 50% après upload
      onProgress?.({
        uploaded: file.size * 0.5,
        total: file.size,
        percentage: 50,
      });

      // Obtenir URL publique
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        throw new Error("Impossible d'obtenir l'URL publique du fichier");
      }

      // Progress terminé
      onProgress?.({
        uploaded: file.size,
        total: file.size,
        percentage: 100,
      });

      console.log('🎉 Upload terminé avec succès:', urlData.publicUrl);

      return {
        success: true,
        data: {
          path: uploadData.path,
          publicUrl: urlData.publicUrl,
          fullPath: `${bucket}/${uploadData.path}`,
        },
      };
    } catch (error) {
      console.error(`❌ Tentative ${attempt} échouée:`, error);

      lastError = categorizeSupabaseError(error);

      // Si l'erreur n'est pas retryable, arrêter immédiatement
      if (!lastError.retryable) {
        console.log('🚫 Erreur non retryable, arrêt des tentatives');
        break;
      }

      // Si c'est la dernière tentative, ne pas attendre
      if (attempt > retryConfig.maxRetries) {
        break;
      }

      // Calculer et attendre le délai de retry
      const retryDelay = calculateRetryDelay(attempt, retryConfig);
      console.log(`⏳ Attente ${retryDelay}ms avant nouvelle tentative...`);

      await delay(retryDelay);
    }
  }

  // Toutes les tentatives ont échoué
  console.error("💥 Toutes les tentatives d'upload ont échoué");

  return {
    success: false,
    error: lastError || {
      type: 'UNKNOWN_ERROR',
      message: "Échec de l'upload après plusieurs tentatives",
      retryable: false,
    },
  };
}

/**
 * 🗑️ Supprime un fichier avec gestion d'erreurs
 */
export async function deleteFile(
  bucket: BucketType,
  filePath: string
): Promise<{ success: boolean; error?: UploadError }> {
  const supabase = createClient();

  try {
    const { error } = await supabase.storage.from(bucket).remove([filePath]);

    if (error) {
      throw error;
    }

    console.log('🗑️ Fichier supprimé:', filePath);
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur suppression fichier:', error);
    return {
      success: false,
      error: categorizeSupabaseError(error),
    };
  }
}

/**
 * 📋 Liste les fichiers d'un bucket avec pagination
 */
export async function listFiles(
  bucket: BucketType,
  folder?: string,
  limit: number = 100
) {
  const supabase = createClient();

  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folder || '', {
        limit,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (error) {
      throw error;
    }

    return { success: true, files: data };
  } catch (error) {
    console.error('❌ Erreur listing fichiers:', error);
    return {
      success: false,
      error: categorizeSupabaseError(error),
    };
  }
}

/**
 * 📊 Vérifie l'état du bucket et les quotas
 */
export async function checkBucketStatus(bucket: BucketType) {
  const supabase = createClient();

  try {
    // Test simple : lister les fichiers
    const { error } = await supabase.storage
      .from(bucket)
      .list('', { limit: 1 });

    if (error) {
      throw error;
    }

    return {
      success: true,
      accessible: true,
      message: `Bucket ${bucket} accessible`,
    };
  } catch (error) {
    console.error('❌ Bucket inaccessible:', bucket, error);
    return {
      success: false,
      accessible: false,
      error: categorizeSupabaseError(error),
    };
  }
}
