'use client';

import * as React from 'react';

import { Button } from '@verone/ui/components/ui/button';
import { Card, CardContent } from '@verone/ui/components/ui/card';
import { Skeleton } from '@verone/ui/components/ui/skeleton';
import { RefreshCw, Save } from 'lucide-react';

// ============================================================================
// PROPS
// ============================================================================

interface GenerationResultCardProps {
  isGenerating: boolean;
  isSaving: boolean;
  imageBase64: string | null;
  mimeType: string | null;
  modelUsed: string | null;
  onRegenerate: () => void;
  onSave: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function GenerationResultCard({
  isGenerating,
  isSaving,
  imageBase64,
  mimeType,
  modelUsed,
  onRegenerate,
  onSave,
}: GenerationResultCardProps) {
  if (!isGenerating && !imageBase64) return null;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Image preview */}
        <div className="relative aspect-square w-full bg-muted md:aspect-auto md:min-h-[400px]">
          {isGenerating ? (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-3 p-6 md:min-h-[400px]">
              <Skeleton className="h-48 w-48 rounded-lg md:h-64 md:w-64" />
              <p className="text-center text-sm text-muted-foreground">
                La génération peut prendre 10 à 30 secondes...
              </p>
            </div>
          ) : imageBase64 ? (
            // eslint-disable-next-line @next/next/no-img-element -- base64 data URI cannot use next/image
            <img
              src={`data:${mimeType ?? 'image/png'};base64,${imageBase64}`}
              alt="Image générée par IA"
              className="h-full w-full object-contain"
            />
          ) : null}
        </div>

        {/* Footer : modèle + actions */}
        {imageBase64 && !isGenerating && (
          <div className="flex flex-col gap-3 border-t p-4 md:flex-row md:items-center md:justify-between">
            {/* Modèle utilisé */}
            {modelUsed && (
              <p className="text-xs text-muted-foreground">
                Généré avec <span className="font-medium">{modelUsed}</span>
              </p>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-2 md:ml-auto">
              <Button
                variant="outline"
                onClick={onRegenerate}
                disabled={isSaving}
                className="h-11 w-full sm:w-auto md:h-9"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Régénérer
              </Button>
              <Button
                onClick={onSave}
                disabled={isSaving}
                className="h-11 w-full sm:w-auto md:h-9"
              >
                <Save className="mr-2 h-4 w-4" />
                {isSaving
                  ? 'Sauvegarde...'
                  : 'Sauvegarder dans la bibliothèque'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
