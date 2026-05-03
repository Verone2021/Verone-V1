'use client';

import * as React from 'react';

import { Button } from '@verone/ui/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@verone/ui/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@verone/ui/components/ui/alert-dialog';
import { Input } from '@verone/ui/components/ui/input';
import { Label } from '@verone/ui/components/ui/label';
import { Textarea } from '@verone/ui/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui/components/ui/select';
import { Badge } from '@verone/ui/components/ui/badge';
import { CloudflareImage } from '@verone/ui/components/ui/cloudflare-image';
import { Archive, Copy, ExternalLink, Save, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import type { BrandInfo } from './MediaAssetCard';
import type { MediaAsset, MediaAssetType } from '@verone/products';

import { MediaAssetPublicationsSection } from './MediaAssetPublicationsSection';

// ============================================================================
// TYPES
// ============================================================================

interface MediaAssetDetailModalProps {
  asset: MediaAsset | null;
  brands: BrandInfo[];
  open: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<MediaAsset>) => Promise<MediaAsset>;
  onArchive: (id: string) => Promise<void>;
  onNavigateToProduct?: (productId: string) => void;
}

// ============================================================================
// HELPERS
// ============================================================================

const ASSET_TYPE_LABEL: Record<string, string> = {
  product: 'Produit',
  lifestyle: 'Lifestyle',
  packshot: 'Packshot',
  logo: 'Logo',
  ambiance: 'Ambiance',
  other: 'Autre',
};

// ============================================================================
// COMPONENT
// ============================================================================

export function MediaAssetDetailModal({
  asset,
  brands,
  open,
  onClose,
  onUpdate,
  onArchive,
  onNavigateToProduct,
}: MediaAssetDetailModalProps) {
  const [altText, setAltText] = React.useState('');
  const [assetType, setAssetType] = React.useState<MediaAssetType>('product');
  const [brandIds, setBrandIds] = React.useState<string[]>([]);
  const [tagsInput, setTagsInput] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [archiving, setArchiving] = React.useState(false);

  // Sync state quand l'asset change
  React.useEffect(() => {
    if (asset) {
      setAltText(asset.alt_text ?? '');
      setAssetType((asset.asset_type as MediaAssetType) ?? 'product');
      setBrandIds(asset.brand_ids ?? []);
      setTagsInput((asset.tags ?? []).join(', '));
      setNotes(asset.notes ?? '');
    }
  }, [asset]);

  const toggleBrand = React.useCallback((brandId: string) => {
    setBrandIds(prev =>
      prev.includes(brandId)
        ? prev.filter(id => id !== brandId)
        : [...prev, brandId]
    );
  }, []);

  const handleSave = React.useCallback(async () => {
    if (!asset) return;
    try {
      setSaving(true);
      const tags = tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      await onUpdate(asset.id, {
        alt_text: altText.trim() || null,
        asset_type: assetType,
        brand_ids: brandIds,
        tags,
        notes: notes.trim() || null,
      });

      toast.success('Modifications sauvegardées');
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  }, [asset, altText, assetType, brandIds, tagsInput, notes, onUpdate]);

  const handleArchive = React.useCallback(async () => {
    if (!asset) return;
    try {
      setArchiving(true);
      await onArchive(asset.id);
      toast.success('Photo archivée');
      onClose();
    } catch {
      toast.error("Erreur lors de l'archivage");
    } finally {
      setArchiving(false);
    }
  }, [asset, onArchive, onClose]);

  const handleNavigateToProduct = React.useCallback(() => {
    if (asset?.source_product_image_id && onNavigateToProduct) {
      onNavigateToProduct(asset.source_product_image_id);
      onClose();
    }
  }, [asset, onNavigateToProduct, onClose]);

  if (!asset) return null;

  const isLinkedToProduct = Boolean(asset.source_product_image_id);

  return (
    <Dialog
      open={open}
      onOpenChange={o => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="flex h-screen flex-col md:h-auto md:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Détail de la photo
            {isLinkedToProduct && (
              <Badge variant="secondary" className="text-xs font-normal">
                Lié à un produit
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto md:max-h-[70vh]">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Colonne image */}
            <div className="flex flex-col gap-3">
              <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted">
                <CloudflareImage
                  cloudflareId={asset.cloudflare_image_id}
                  fallbackSrc={asset.public_url}
                  alt={asset.alt_text ?? ''}
                  fill
                  className="object-contain"
                  variant="public"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>

              {/* Infos techniques */}
              <div className="space-y-1 text-xs text-muted-foreground">
                {asset.format && <p>Format : {asset.format.toUpperCase()}</p>}
                {asset.width && asset.height && (
                  <p>
                    Dimensions : {asset.width} × {asset.height} px
                  </p>
                )}
                {asset.file_size && (
                  <p>Taille : {(asset.file_size / 1024).toFixed(1)} Ko</p>
                )}
              </div>

              {/* Lien produit */}
              {isLinkedToProduct && onNavigateToProduct && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNavigateToProduct}
                  className="min-h-[44px] md:min-h-[36px]"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Voir le produit lié
                </Button>
              )}
            </div>

            {/* Colonne métadonnées */}
            <div className="flex flex-col gap-4">
              {/* Alt text */}
              <div className="space-y-1.5">
                <Label htmlFor="detail-alt-text" className="text-sm">
                  Description (alt text)
                </Label>
                <Textarea
                  id="detail-alt-text"
                  value={altText}
                  onChange={e => setAltText(e.target.value)}
                  placeholder="Description de l'image..."
                  rows={2}
                  className="resize-none"
                />
              </div>

              {/* Type */}
              <div className="space-y-1.5">
                <Label className="text-sm">Type</Label>
                <Select
                  value={assetType}
                  onValueChange={v => setAssetType(v as MediaAssetType)}
                >
                  <SelectTrigger className="min-h-[44px] md:min-h-[36px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ASSET_TYPE_LABEL).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Marques */}
              <div className="space-y-1.5">
                <Label className="text-sm">Marques</Label>
                <div className="flex flex-wrap gap-2">
                  {brands.map(brand => {
                    const selected = brandIds.includes(brand.id);
                    return (
                      <button
                        key={brand.id}
                        type="button"
                        onClick={() => toggleBrand(brand.id)}
                        className={`rounded px-2 py-1 text-xs font-medium transition-colors min-h-[44px] md:min-h-[28px] ${
                          selected
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {brand.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-1.5">
                <Label htmlFor="detail-tags" className="text-sm">
                  Tags (séparés par des virgules)
                </Label>
                <Input
                  id="detail-tags"
                  value={tagsInput}
                  onChange={e => setTagsInput(e.target.value)}
                  placeholder="printemps, collection 2026, ..."
                  className="min-h-[44px] md:min-h-[36px]"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label htmlFor="detail-notes" className="text-sm">
                  Notes internes
                </Label>
                <Textarea
                  id="detail-notes"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Notes internes, contexte, usage prévu..."
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>
          </div>

          {/* Prompt IA si la photo a été générée par Nano Banana / autre IA */}
          {asset.source === 'ai_generated' && asset.ai_prompt_used && (
            <div className="mt-6 space-y-2 rounded-lg border border-fuchsia-200 bg-fuchsia-50/40 p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-fuchsia-600" />
                  <Label className="text-sm font-medium">
                    Prompt IA utilisé
                  </Label>
                  <Badge
                    variant="secondary"
                    className="bg-fuchsia-100 text-[10px] text-fuchsia-700"
                  >
                    Nano Banana / IA
                  </Badge>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    void navigator.clipboard
                      .writeText(asset.ai_prompt_used ?? '')
                      .then(() => toast.success('Prompt copié'))
                      .catch(() => toast.error('Copie impossible'));
                  }}
                  className="h-8 text-xs"
                >
                  <Copy className="mr-1 h-3.5 w-3.5" />
                  Copier
                </Button>
              </div>
              <pre className="max-h-40 overflow-y-auto rounded-md border border-border bg-card p-2 text-[11px] leading-relaxed text-foreground">
                {asset.ai_prompt_used}
              </pre>
            </div>
          )}

          {/* Publications — historique des canaux où la photo a été postée */}
          <div className="mt-6">
            <MediaAssetPublicationsSection assetId={asset.id} />
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 md:flex-row">
          {/* Archiver */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full min-h-[44px] md:min-h-[36px] md:w-auto text-destructive hover:text-destructive"
                disabled={saving || archiving}
              >
                <Archive className="mr-2 h-4 w-4" />
                Archiver
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Archiver cette photo ?</AlertDialogTitle>
                <AlertDialogDescription>
                  La photo sera masquée de la bibliothèque. Elle ne sera pas
                  supprimée et pourra être restaurée ultérieurement.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    void handleArchive();
                  }}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  {archiving ? 'Archivage...' : 'Archiver'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button
            variant="outline"
            onClick={onClose}
            disabled={saving}
            className="w-full min-h-[44px] md:min-h-[36px] md:w-auto"
          >
            Fermer
          </Button>

          <Button
            onClick={() => {
              void handleSave();
            }}
            disabled={saving}
            className="w-full min-h-[44px] md:min-h-[36px] md:w-auto"
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
