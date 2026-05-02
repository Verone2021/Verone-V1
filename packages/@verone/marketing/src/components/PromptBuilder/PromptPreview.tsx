'use client';

import { useState } from 'react';

import { Badge } from '@verone/ui/components/ui/badge';
import { Button } from '@verone/ui/components/ui/button';
import { Card, CardContent, CardHeader } from '@verone/ui/components/ui/card';
import { Check, Copy, ExternalLink } from 'lucide-react';

import type { ComposedPrompt } from '../../types';

export interface PromptPreviewProps {
  prompt: ComposedPrompt;
  onCopySuccess?: () => void;
  onCopyError?: (error: Error) => void;
}

const NANO_BANANA_URL = 'https://gemini.google.com/app';

export function PromptPreview({
  prompt,
  onCopySuccess,
  onCopyError,
}: PromptPreviewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      onCopyError?.(new Error('Clipboard API non disponible'));
      return;
    }
    void navigator.clipboard
      .writeText(prompt.text)
      .then(() => {
        setCopied(true);
        onCopySuccess?.();
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err: unknown) => {
        const error = err instanceof Error ? err : new Error(String(err));
        onCopyError?.(error);
      });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{prompt.preset.id}</Badge>
          <span className="text-sm font-semibold">{prompt.preset.name}</span>
          <Badge variant="outline">{prompt.preset.format}</Badge>
          <Badge variant="outline">{prompt.brand.name}</Badge>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2 md:flex-row">
          <Button
            type="button"
            size="sm"
            variant={copied ? 'secondary' : 'default'}
            onClick={handleCopy}
            disabled={prompt.hasPlaceholder}
            aria-label="Copier le prompt"
          >
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4" /> Copié
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" /> Copier le prompt
              </>
            )}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            asChild
            aria-label="Ouvrir Gemini Nano Banana"
          >
            <a href={NANO_BANANA_URL} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" /> Ouvrir Gemini
            </a>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {prompt.hasPlaceholder && (
          <p className="rounded-md border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Renseigne la description du produit pour finaliser le prompt avant
            de copier.
          </p>
        )}
        <pre className="whitespace-pre-wrap break-words rounded-md bg-muted p-4 text-sm leading-relaxed">
          {prompt.text}
        </pre>
        <div className="grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
          <p>
            <strong className="font-medium text-foreground">Identité :</strong>{' '}
            {prompt.brand.visualIdentity}
          </p>
          <p>
            <strong className="font-medium text-foreground">Palette :</strong>{' '}
            {prompt.brand.palette}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
