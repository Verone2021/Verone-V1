/**
 * Hook: useDocumentUpload
 * Upload de documents vers Supabase Storage (KBis, formulaires accès, etc.)
 * ================================================================
 * Utilise le bucket `linkme-delivery-forms` avec sous-dossiers :
 * - kbis/{orderId}/{filename}
 * - access-forms/{orderId}/{filename}
 *
 * @module use-document-upload
 * @since 2026-02-14
 */

'use client';

import { useState } from 'react';

import { createClient } from '@verone/utils/supabase/client';

// ============================================
// TYPES
// ============================================

export type DocumentCategory = 'kbis' | 'access-forms';

interface UploadState {
  uploading: boolean;
  error: string | null;
  fileUrl: string | null;
}

interface UseDocumentUploadOptions {
  category: DocumentCategory;
  /** ID de la commande (utilisé pour organiser les fichiers) */
  orderId: string;
  /** Taille max en bytes (défaut: 10MB) */
  maxSizeBytes?: number;
  /** Types MIME autorisés */
  allowedTypes?: string[];
  onSuccess?: (url: string) => void;
  onError?: (error: string) => void;
}

const BUCKET = 'linkme-delivery-forms';

const DEFAULT_ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB

// ============================================
// HOOK
// ============================================

export function useDocumentUpload(options: UseDocumentUploadOptions) {
  const {
    category,
    orderId,
    maxSizeBytes = DEFAULT_MAX_SIZE,
    allowedTypes = DEFAULT_ALLOWED_TYPES,
    onSuccess,
    onError,
  } = options;

  const [state, setState] = useState<UploadState>({
    uploading: false,
    error: null,
    fileUrl: null,
  });

  const uploadFile = async (file: File): Promise<string | null> => {
    if (!file) {
      const error = 'Aucun fichier sélectionné';
      setState(prev => ({ ...prev, error }));
      onError?.(error);
      return null;
    }

    if (file.size > maxSizeBytes) {
      const error = `Le fichier ne doit pas dépasser ${Math.round(maxSizeBytes / 1024 / 1024)}MB`;
      setState(prev => ({ ...prev, error }));
      onError?.(error);
      return null;
    }

    if (!allowedTypes.includes(file.type)) {
      const error = 'Format non supporté. Utilisez PDF, JPG, PNG ou WEBP.';
      setState(prev => ({ ...prev, error }));
      onError?.(error);
      return null;
    }

    setState({ uploading: true, error: null, fileUrl: null });

    try {
      const supabase = createClient();

      // Nom unique : category/orderId/timestamp-random.ext
      const fileExt = file.name.split('.').pop() ?? 'pdf';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const filePath = `${category}/${orderId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Erreur upload: ${uploadError.message}`);
      }

      // URL publique
      const {
        data: { publicUrl },
      } = supabase.storage.from(BUCKET).getPublicUrl(filePath);

      setState({ uploading: false, error: null, fileUrl: publicUrl });
      onSuccess?.(publicUrl);
      return publicUrl;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erreur inconnue lors de l'upload";
      setState({ uploading: false, error: errorMessage, fileUrl: null });
      onError?.(errorMessage);
      return null;
    }
  };

  const reset = () => {
    setState({ uploading: false, error: null, fileUrl: null });
  };

  return {
    ...state,
    uploadFile,
    reset,
  };
}
