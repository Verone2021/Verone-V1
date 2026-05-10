'use client';

import { useMutation } from '@tanstack/react-query';

export interface GenerateCopyInput {
  productId: string;
  targetChannel:
    | 'instagram'
    | 'facebook'
    | 'pinterest'
    | 'tiktok'
    | 'linkedin'
    | 'site_internet'
    | 'newsletter';
  brand?: 'verone' | 'boemia' | 'solar' | 'flos';
  tone?: 'premium' | 'fun' | 'minimal' | 'storytelling';
}

export interface GenerateCopyOutput {
  short: string;
  long: string;
  caption: string;
  modelUsed: string;
}

export function useGenerateCopy() {
  return useMutation<GenerateCopyOutput, Error, GenerateCopyInput>({
    mutationFn: async input => {
      const res = await fetch('/api/marketing/copy/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = (await res.json()) as
        | GenerateCopyOutput
        | { error?: string; message?: string };
      if (!res.ok) {
        const errMessage =
          'error' in data
            ? `${data.error ?? 'Error'}${data.message ? `: ${data.message}` : ''}`
            : 'Erreur inconnue';
        throw new Error(errMessage);
      }
      return data as GenerateCopyOutput;
    },
  });
}
