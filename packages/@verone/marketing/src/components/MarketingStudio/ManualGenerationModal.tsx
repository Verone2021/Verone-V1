'use client';

import * as React from 'react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@verone/ui/components/ui/dialog';
import { Button } from '@verone/ui/components/ui/button';
import { Textarea } from '@verone/ui/components/ui/textarea';
import { CloudflareImage } from '@verone/ui/components/ui/cloudflare-image';
import { createClient } from '@verone/utils/supabase/client';
import { buildCloudflareImageUrl } from '@verone/utils/cloudflare/images';
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  ImageIcon,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

import { saveLastPrompt } from '../../lib/last-prompt-storage';
import type { BrandSlug, TargetChannel } from '../../types';

// =====================================================================
// TYPES
// =====================================================================

interface SourceAsset {
  id: string;
  cloudflare_image_id: string | null;
  alt_text: string | null;
}

interface ManualGenerationModalProps {
  open: boolean;
  onClose: () => void;
  prompt: string;
  brandSlug: BrandSlug;
  presetId: string;
  targetChannel: TargetChannel;
  productLabel: string | null;
  productId: string | null;
  variantGroupId: string | null;
  sourceImageIds: string[];
  /**
   * Si fourni, redirige vers ce chemin après import au lieu de fermer la modal.
   * Default : '/marketing/bibliotheque?import=manual_gen'.
   */
  importUrl?: string;
}

const GEMINI_URL = 'https://gemini.google.com/app';

// =====================================================================
// COMPONENT
// =====================================================================

export function ManualGenerationModal({
  open,
  onClose,
  prompt,
  brandSlug,
  presetId,
  targetChannel,
  productLabel,
  productId,
  variantGroupId,
  sourceImageIds,
  importUrl = '/marketing/bibliotheque?import=manual_gen',
}: ManualGenerationModalProps) {
  const [assets, setAssets] = React.useState<SourceAsset[]>([]);
  const [promptCopied, setPromptCopied] = React.useState(false);
  const [downloaded, setDownloaded] = React.useState<Set<string>>(new Set());

  // Reset l'état visuel à chaque ouverture
  React.useEffect(() => {
    if (open) {
      setPromptCopied(false);
      setDownloaded(new Set());
    }
  }, [open]);

  // Charger les vignettes des images sources
  React.useEffect(() => {
    if (!open || sourceImageIds.length === 0) {
      setAssets([]);
      return;
    }
    let cancelled = false;
    const supabase = createClient();
    void supabase
      .from('media_assets')
      .select('id, cloudflare_image_id, alt_text')
      .in('id', sourceImageIds)
      .then(({ data }) => {
        if (cancelled) return;
        setAssets((data ?? []) as SourceAsset[]);
      });
    return () => {
      cancelled = true;
    };
  }, [open, sourceImageIds]);

  const handleCopyPrompt = React.useCallback(() => {
    void navigator.clipboard
      .writeText(prompt)
      .then(() => {
        setPromptCopied(true);
        toast.success('Prompt copié — colle-le dans Gemini');
      })
      .catch(() => {
        toast.error('Impossible de copier le prompt');
      });
  }, [prompt]);

  const handleDownloadOne = React.useCallback(async (asset: SourceAsset) => {
    if (!asset.cloudflare_image_id) {
      toast.error('Image indisponible');
      return;
    }
    try {
      const url = buildCloudflareImageUrl(asset.cloudflare_image_id, 'public');
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `source-${asset.cloudflare_image_id.slice(0, 8)}.${blob.type.includes('png') ? 'png' : 'jpg'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      setDownloaded(prev => new Set(prev).add(asset.id));
    } catch (err) {
      console.error('[ManualGenerationModal] download failed:', err);
      toast.error('Téléchargement échoué');
    }
  }, []);

  const handleDownloadAll = React.useCallback(() => {
    void Promise.all(assets.map(a => handleDownloadOne(a))).then(() => {
      toast.success('Toutes les images téléchargées');
    });
  }, [assets, handleDownloadOne]);

  const handleOpenGemini = React.useCallback(() => {
    if (typeof window === 'undefined') return;
    window.open(GEMINI_URL, '_blank', 'noopener,noreferrer');
  }, []);

  const handleGoToImport = React.useCallback(() => {
    // Sauvegarde le contexte complet pour pré-remplir UploadAssetModal
    saveLastPrompt({
      prompt,
      brandSlug,
      presetId,
      productLabel,
      productId,
      variantGroupId,
      targetChannel,
      sourceImageIds,
    });
    if (typeof window !== 'undefined') {
      window.location.href = importUrl;
    }
  }, [
    prompt,
    brandSlug,
    presetId,
    productLabel,
    productId,
    variantGroupId,
    targetChannel,
    sourceImageIds,
    importUrl,
  ]);

  return (
    <Dialog
      open={open}
      onOpenChange={open => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="flex h-screen max-h-screen flex-col p-0 sm:h-auto sm:max-h-[90vh] sm:max-w-2xl">
        <DialogHeader className="border-b px-4 py-3 sm:px-6">
          <DialogTitle>Générer manuellement sur Gemini (gratuit)</DialogTitle>
          <DialogDescription>
            Suis les 4 étapes pour utiliser Gemini gratuitement, puis réimporte
            ton image dans la bibliothèque.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-6 overflow-y-auto px-4 py-4 sm:px-6">
          {/* Étape 1 : Copier le prompt */}
          <section className="space-y-2">
            <h3 className="flex items-center gap-2 text-sm font-medium">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                1
              </span>
              Copier le prompt
            </h3>
            <Textarea
              value={prompt}
              readOnly
              rows={5}
              className="resize-none text-xs font-mono"
            />
            <Button
              type="button"
              variant={promptCopied ? 'default' : 'outline'}
              onClick={handleCopyPrompt}
              className="w-full sm:w-auto"
            >
              {promptCopied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Prompt copié
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copier le prompt
                </>
              )}
            </Button>
          </section>

          {/* Étape 2 : Télécharger les images sources */}
          {sourceImageIds.length > 0 && (
            <section className="space-y-2">
              <h3 className="flex items-center gap-2 text-sm font-medium">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  2
                </span>
                Télécharger les images sources ({sourceImageIds.length})
              </h3>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {assets.map(asset => {
                  const isDone = downloaded.has(asset.id);
                  return (
                    <div
                      key={asset.id}
                      className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted"
                    >
                      {asset.cloudflare_image_id ? (
                        <CloudflareImage
                          cloudflareId={asset.cloudflare_image_id}
                          alt={asset.alt_text ?? ''}
                          fill
                          className="object-cover"
                          variant="public"
                          sizes="120px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          void handleDownloadOne(asset);
                        }}
                        className="absolute inset-0 flex items-center justify-center bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                        aria-label="Télécharger cette image"
                      >
                        {isDone ? (
                          <Check className="h-6 w-6" />
                        ) : (
                          <Download className="h-6 w-6" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleDownloadAll}
                className="w-full sm:w-auto"
              >
                <Download className="mr-2 h-4 w-4" />
                Tout télécharger
              </Button>
            </section>
          )}

          {/* Étape 3 : Ouvrir Gemini */}
          <section className="space-y-2">
            <h3 className="flex items-center gap-2 text-sm font-medium">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                {sourceImageIds.length > 0 ? 3 : 2}
              </span>
              Ouvrir Gemini et générer
            </h3>
            <p className="text-xs text-muted-foreground">
              Dans Gemini : colle le prompt (Ctrl+V), glisse-dépose les images
              téléchargées dans le champ, lance la génération, puis télécharge
              l&apos;image finale sur ton ordinateur.
            </p>
            <Button
              type="button"
              onClick={handleOpenGemini}
              className="w-full sm:w-auto"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Ouvrir Gemini
              <ExternalLink className="ml-2 h-3 w-3" />
            </Button>
          </section>

          {/* Étape 4 : Réimporter */}
          <section className="space-y-2">
            <h3 className="flex items-center gap-2 text-sm font-medium">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                {sourceImageIds.length > 0 ? 4 : 3}
              </span>
              Importer l&apos;image dans la bibliothèque
            </h3>
            <p className="text-xs text-muted-foreground">
              Une fois ton image générée et téléchargée depuis Gemini, ouvre la
              bibliothèque : le formulaire d&apos;import sera pré-rempli
              automatiquement ({productLabel ?? 'sans produit lié'}, marque{' '}
              {brandSlug}, prompt IA conservé). Tu glisses ton image, tu
              valides. Elle partira en <strong>« À valider »</strong> pour
              relecture.
            </p>
            <Button
              type="button"
              onClick={handleGoToImport}
              className="w-full sm:w-auto"
              variant="default"
            >
              Aller à la bibliothèque pour importer
            </Button>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
