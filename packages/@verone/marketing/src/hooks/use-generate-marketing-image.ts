'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import type {
  GenerateMarketingImageRequest,
  GenerateMarketingImagePreviewResponse,
  GenerateMarketingImageSavedResponse,
} from '../types';

// =====================================================================
// TYPES
// =====================================================================

type PreviewInput = Omit<GenerateMarketingImageRequest, 'saveImmediately'>;
type SaveInput = Omit<GenerateMarketingImageRequest, 'saveImmediately'>;

async function callGenerateApi(
  input: GenerateMarketingImageRequest
): Promise<
  GenerateMarketingImagePreviewResponse | GenerateMarketingImageSavedResponse
> {
  const response = await fetch('/api/marketing/images/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    let errorMessage =
      'Une erreur est survenue lors de la génération. Veuillez réessayer.';
    try {
      const data = (await response.json()) as { error?: string };
      if (data.error) errorMessage = data.error;
    } catch {
      // garder le message par défaut
    }
    throw new Error(errorMessage);
  }

  return response.json() as Promise<
    GenerateMarketingImagePreviewResponse | GenerateMarketingImageSavedResponse
  >;
}

// =====================================================================
// HOOK
// =====================================================================

export function useGenerateMarketingImage() {
  const queryClient = useQueryClient();

  // Mutation 1 : preview (pas de save en DB)
  const {
    mutate: _generatePreviewMutate,
    mutateAsync: generatePreviewAsync,
    isPending: isGenerating,
    error: generateError,
    data: previewData,
    reset: resetPreview,
  } = useMutation({
    mutationFn: (input: PreviewInput) =>
      callGenerateApi({ ...input, saveImmediately: false }),
    onError: (err: Error) => {
      toast.error('Génération échouée', {
        description: err.message,
      });
    },
  });

  // Mutation 2 : save (crée l'asset en DB + Cloudflare)
  const {
    mutate: _savePreviewMutate,
    mutateAsync: savePreviewAsync,
    isPending: isSaving,
    error: saveError,
    data: savedAsset,
  } = useMutation({
    mutationFn: (input: SaveInput) =>
      callGenerateApi({ ...input, saveImmediately: true }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['media_assets'] });
      await queryClient.invalidateQueries({ queryKey: ['publication_counts'] });
      toast.success('Image sauvegardée', {
        description: "L'image a été ajoutée à la bibliothèque marketing.",
      });
    },
    onError: (err: Error) => {
      toast.error('Sauvegarde échouée', {
        description: err.message,
      });
    },
  });

  // Wrappers avec void + .catch() pour event handlers
  const generatePreview = (input: PreviewInput) => {
    void generatePreviewAsync(input).catch(() => {
      // L'erreur est déjà gérée via onError
    });
  };

  const savePreview = (input: SaveInput) => {
    void savePreviewAsync(input).catch(() => {
      // L'erreur est déjà gérée via onError
    });
  };

  const error = generateError ?? saveError;

  // Extraire les données typées
  const previewResult = previewData?.mode === 'preview' ? previewData : null;

  const savedAssetResult =
    savedAsset?.mode === 'saved' ? savedAsset.asset : null;

  return {
    generatePreview,
    savePreview,
    generatePreviewAsync,
    savePreviewAsync,
    isGenerating,
    isSaving,
    error,
    previewData: previewResult,
    savedAsset: savedAssetResult,
    resetPreview,
  };
}
