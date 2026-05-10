'use client';

import { useMutation } from '@tanstack/react-query';

export interface GenerateHashtagsInput {
  productId?: string;
  productName?: string;
  productCategory?: string;
  targetChannel: 'instagram' | 'facebook' | 'pinterest' | 'tiktok' | 'linkedin';
  brand?: 'verone' | 'boemia' | 'solar' | 'flos';
  tone?: 'premium' | 'fun' | 'minimal';
}

export interface GenerateHashtagsOutput {
  hashtags: string[];
  modelUsed: string;
}

export function useGenerateHashtags() {
  return useMutation<GenerateHashtagsOutput, Error, GenerateHashtagsInput>({
    mutationFn: async input => {
      const res = await fetch('/api/marketing/hashtags/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = (await res.json()) as
        | GenerateHashtagsOutput
        | { error?: string; message?: string };
      if (!res.ok) {
        const errMessage =
          'error' in data
            ? `${data.error ?? 'Error'}${data.message ? `: ${data.message}` : ''}`
            : 'Erreur inconnue';
        throw new Error(errMessage);
      }
      return data as GenerateHashtagsOutput;
    },
  });
}
