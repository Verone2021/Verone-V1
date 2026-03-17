'use client';

/**
 * 🎯 VÉRONE - Hook Upload Images Simple
 *
 * Hook simple pour upload d'images avec validation de base
 * Approche classique : Upload → Storage → URL directe dans table
 */

import { useState, useCallback, useRef, useEffect } from 'react';

import type { User } from '@supabase/supabase-js';

import { createClient } from '@verone/utils/supabase/client';
import {
  uploadWithRetry,
  getCurrentUserProfile,
  deleteFile,
  checkBucketStatus,
  type UploadResult,
  type UploadError,
  type UploadProgress,
} from '@verone/utils/upload/supabase-utils';
import type {
  BucketType,
  UserProfile,
  ValidationResult,
} from '@verone/utils/upload/validation';
import {
  validateUpload,
  generateSecureFileName,
  getBucketConfig,
} from '@verone/utils/upload/validation';

// États possibles de l'upload
export type UploadState =
  | 'idle' // Aucun upload en cours
  | 'validating' // Validation en cours
  | 'uploading' // Upload en cours
  | 'success' // Upload réussi
  | 'error' // Erreur
  | 'retrying'; // Nouvelle tentative en cours

export interface UploadMeta {
  bucket: BucketType;
  originalName: string;
  size: number;
  type: string;
}

export interface UseImageUploadProps {
  bucket: BucketType;
  autoUpload?: boolean;
  onUploadSuccess?: (result: UploadResult['data'], meta: UploadMeta) => void;
  onUploadError?: (error: UploadError, meta?: UploadMeta) => void;
  onProgress?: (progress: UploadProgress) => void;
}

export interface UseImageUploadReturn {
  // États
  state: UploadState;
  isUploading: boolean;
  progress: UploadProgress | null;
  error: UploadError | null;
  validationError: string | null;

  // Données
  uploadResult: UploadResult['data'] | null;
  userProfile: UserProfile | null;
  bucketConfig: ReturnType<typeof getBucketConfig>;

  // Actions
  uploadFile: (file: File) => Promise<boolean>;
  validateFile: (file: File) => ValidationResult;
  clearError: () => void;
  reset: () => void;
  deleteUploadedFile: () => Promise<boolean>;

  // Utilitaires
  canUpload: boolean;
  supportedTypes: string[];
  maxSizeMB: number;
}

export function useImageUpload({
  bucket,
  _autoUpload = true,
  onUploadSuccess,
  onUploadError,
  onProgress,
}: UseImageUploadProps): UseImageUploadReturn {
  // États principaux
  const [state, setState] = useState<UploadState>('idle');
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<UploadError | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult['data'] | null>(
    null
  );
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // État utilisateur
  const [user, setUser] = useState<User | null>(null);

  // Données statiques
  const bucketConfig = getBucketConfig(bucket);

  // Références pour cleanup
  const currentUploadRef = useRef<{
    filePath: string;
    meta: UploadMeta;
  } | null>(null);

  // États dérivés
  const isUploading = ['validating', 'uploading', 'retrying'].includes(state);
  const canUpload = user && userProfile && state === 'idle';

  /**
   * 🔄 Initialise ou recharge le profil utilisateur
   */
  const loadUserProfile = useCallback(async () => {
    if (!user) {
      setUserProfile(null);
      return;
    }

    try {
      const profile = await getCurrentUserProfile();
      setUserProfile(profile);
    } catch (error) {
      console.error('❌ Erreur chargement profil:', error);
      setUserProfile(null);
    }
  }, [user]);

  // Charger l'état d'authentification
  useEffect(() => {
    const supabase = createClient();

    // Obtenir la session courante
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };

    void getSession();

    // Écouter les changements d'authentification
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Charger le profil au montage et changement d'utilisateur
  useEffect(() => {
    void loadUserProfile();
  }, [loadUserProfile]);

  /**
   * 🛡️ Valide un fichier selon les règles métier
   */
  const validateFile = useCallback(
    (file: File): ValidationResult => {
      return validateUpload({
        user,
        userProfile,
        file,
        bucket,
      });
    },
    [user, userProfile, bucket]
  );

  /**
   * 🧹 Nettoie les erreurs
   */
  const clearError = useCallback(() => {
    setError(null);
    setValidationError(null);
  }, []);

  /**
   * 🔄 Remet à zéro tous les états
   */
  const reset = useCallback(() => {
    setState('idle');
    setProgress(null);
    setError(null);
    setValidationError(null);
    setUploadResult(null);
    currentUploadRef.current = null;
  }, []);

  /**
   * 📊 Gestionnaire de progress avec callback
   */
  const handleProgress = useCallback(
    (newProgress: UploadProgress) => {
      setProgress(newProgress);
      onProgress?.(newProgress);
    },
    [onProgress]
  );

  /**
   * 🗑️ Supprime le fichier uploadé
   */
  const deleteUploadedFile = useCallback(async (): Promise<boolean> => {
    if (!currentUploadRef.current) {
      console.warn('⚠️ Aucun fichier à supprimer');
      return false;
    }

    try {
      const { filePath } = currentUploadRef.current;
      const result = await deleteFile(bucket, filePath);

      if (result.success) {
        console.warn('🗑️ Fichier supprimé avec succès');
        reset();
        return true;
      } else {
        console.error('❌ Erreur suppression:', result.error);
        setError(result.error as UploadError);
        return false;
      }
    } catch (error) {
      console.error('💥 Erreur suppression fichier:', error);
      return false;
    }
  }, [bucket, reset]);

  /**
   * 📤 Upload principal avec toute la logique robuste
   */
  const uploadFile = useCallback(
    async (file: File): Promise<boolean> => {
      console.warn(
        '🚀 Début upload:',
        file.name,
        `(${Math.round(file.size / 1024)}KB)`
      );

      // Reset des états précédents
      clearError();
      setState('validating');

      // Définir meta ici pour accessibilité dans try/catch
      const meta: UploadMeta = {
        bucket,
        originalName: file.name,
        size: file.size,
        type: file.type,
      };

      try {
        // 1. Validation préalable
        console.warn('🛡️ Validation fichier...');
        const validation = validateFile(file);

        if (!validation.isValid) {
          setValidationError(validation.error ?? 'Fichier invalide');
          setState('error');
          return false;
        }

        // 2. Vérification du bucket
        console.warn('🪣 Vérification bucket...');
        const bucketStatus = await checkBucketStatus(bucket);
        if (!bucketStatus.success) {
          setError(bucketStatus.error!);
          setState('error');
          return false;
        }

        // 3. Génération du nom de fichier sécurisé
        const filePath = generateSecureFileName(file.name);

        // Stocker pour cleanup éventuel
        currentUploadRef.current = { filePath, meta };

        console.warn('📁 Chemin généré:', filePath);

        // 4. Upload avec retry automatique
        setState('uploading');

        const result = await uploadWithRetry(
          file,
          bucket,
          filePath,
          handleProgress,
          {
            maxRetries: 3,
            baseDelayMs: 1000,
            maxDelayMs: 8000,
            backoffMultiplier: 2,
          }
        );

        // 5. Traitement du résultat
        if (result.success && result.data) {
          console.warn('🎉 Upload réussi:', result.data.publicUrl);

          setUploadResult(result.data);
          setState('success');

          // Callback de succès
          onUploadSuccess?.(result.data, meta);
          return true;
        } else {
          console.error('❌ Upload échoué:', result.error);

          setError(result.error!);
          setState('error');

          // Callback d'erreur
          onUploadError?.(result.error!, meta);
          return false;
        }
      } catch (error) {
        console.error('💥 Erreur inattendue upload:', error);

        const uploadError: UploadError = {
          type: 'UNKNOWN_ERROR',
          message: "Erreur inattendue lors de l'upload",
          originalError: error,
          retryable: false,
        };

        setError(uploadError);
        setState('error');

        onUploadError?.(uploadError, meta);
        return false;
      }
    },
    [
      bucket,
      validateFile,
      clearError,
      handleProgress,
      onUploadSuccess,
      onUploadError,
    ]
  );

  return {
    // États
    state,
    isUploading,
    progress,
    error,
    validationError,

    // Données
    uploadResult,
    userProfile,
    bucketConfig,

    // Actions
    uploadFile,
    validateFile,
    clearError,
    reset,
    deleteUploadedFile,

    // Utilitaires
    canUpload: !!canUpload,
    supportedTypes: bucketConfig.allowedMimeTypes,
    maxSizeMB: bucketConfig.maxSizeMB,
  };
}
