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
import { Input } from '@verone/ui/components/ui/input';
import { Label } from '@verone/ui/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui/components/ui/select';
import { Sparkles, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

import { ProductOrVariantPicker, type PickedItem } from '@verone/products';
import type {
  MediaAssetType,
  MediaAssetSource,
  UploadAssetInput,
} from '@verone/products';
import { Textarea } from '@verone/ui/components/ui/textarea';

import {
  clearLastPrompt,
  formatPromptAge,
  readLastPrompt,
  type StoredPrompt,
} from '../../lib/last-prompt-storage';
import type { BrandInfo } from './MediaAssetCard';

// ============================================================================
// TYPES
// ============================================================================

interface FileEntry {
  file: File;
  preview: string;
  assetType: MediaAssetType;
  pickedItem: PickedItem | null;
  brandIds: string[]; // dérivés du pickedItem, mais ajustables si plusieurs marques
  altText: string;
  tags: string;
  source: MediaAssetSource;
  aiPromptUsed: string;
}

interface UploadAssetModalProps {
  open: boolean;
  brands: BrandInfo[];
  onClose: () => void;
  onUpload: (file: File, metadata: UploadAssetInput) => Promise<unknown>;
  uploading: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function UploadAssetModal({
  open,
  brands,
  onClose,
  onUpload,
  uploading,
}: UploadAssetModalProps) {
  const [entries, setEntries] = React.useState<FileEntry[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Pont Studio Marketing → DAM : on lit le dernier prompt copié (si < 24 h)
  // pour proposer un pré-remplissage 1-clic.
  const [lastPrompt, setLastPrompt] = React.useState<StoredPrompt | null>(null);
  const [promptApplied, setPromptApplied] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setLastPrompt(readLastPrompt());
      setPromptApplied(false);
    }
  }, [open]);

  React.useEffect(() => {
    if (!open) {
      entries.forEach(e => URL.revokeObjectURL(e.preview));
      setEntries([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- entries deliberately excluded
  }, [open]);

  const applyLastPromptToAllEntries = React.useCallback(() => {
    if (!lastPrompt) return;
    setEntries(prev =>
      prev.map(e => ({
        ...e,
        source: 'ai_generated',
        aiPromptUsed: lastPrompt.prompt,
      }))
    );
    setPromptApplied(true);
    toast.success('Prompt IA pré-rempli sur toutes les photos');
  }, [lastPrompt]);

  const dismissLastPrompt = React.useCallback(() => {
    clearLastPrompt();
    setLastPrompt(null);
  }, []);

  const handleFilesSelected = React.useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newEntries: FileEntry[] = Array.from(files).map(file => ({
      file,
      preview: URL.createObjectURL(file),
      assetType: 'product',
      pickedItem: null,
      brandIds: [],
      altText: file.name.replace(/\.[^/.]+$/, ''),
      tags: '',
      source: 'manual_upload',
      aiPromptUsed: '',
    }));

    setEntries(prev => [...prev, ...newEntries]);
  }, []);

  const handleDropZoneChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFilesSelected(e.target.files);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [handleFilesSelected]
  );

  const handleDrop = React.useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      handleFilesSelected(e.dataTransfer.files);
    },
    [handleFilesSelected]
  );

  const handleDragOver = React.useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
    },
    []
  );

  const removeEntry = React.useCallback((index: number) => {
    setEntries(prev => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const updateEntry = React.useCallback(
    <K extends keyof FileEntry>(
      index: number,
      field: K,
      value: FileEntry[K]
    ) => {
      setEntries(prev =>
        prev.map((e, i) => (i === index ? { ...e, [field]: value } : e))
      );
    },
    []
  );

  const setPickedItemForEntry = React.useCallback(
    (index: number, item: PickedItem | null) => {
      setEntries(prev =>
        prev.map((e, i) => {
          if (i !== index) return e;
          // Hérite des brandIds du produit/variante choisi
          return {
            ...e,
            pickedItem: item,
            brandIds: item ? item.brandIds : [],
          };
        })
      );
    },
    []
  );

  const toggleBrand = React.useCallback((index: number, brandId: string) => {
    setEntries(prev =>
      prev.map((e, i) => {
        if (i !== index) return e;
        const has = e.brandIds.includes(brandId);
        return {
          ...e,
          brandIds: has
            ? e.brandIds.filter(id => id !== brandId)
            : [...e.brandIds, brandId],
        };
      })
    );
  }, []);

  const isValid = React.useMemo(
    () =>
      entries.length > 0 &&
      entries.every(e => e.pickedItem !== null && e.brandIds.length > 0),
    [entries]
  );

  const handleSubmit = React.useCallback(async () => {
    if (!isValid) return;

    let successCount = 0;
    let errorCount = 0;

    for (const entry of entries) {
      if (!entry.pickedItem) continue;
      try {
        await onUpload(entry.file, {
          assetType: entry.assetType,
          brandIds: entry.brandIds,
          altText: entry.altText.trim() || entry.file.name,
          tags: entry.tags
            ? entry.tags
                .split(',')
                .map(t => t.trim())
                .filter(Boolean)
            : [],
          productId:
            entry.pickedItem.kind === 'product' ? entry.pickedItem.id : null,
          variantGroupId:
            entry.pickedItem.kind === 'variant_group'
              ? entry.pickedItem.id
              : null,
          source: entry.source,
          aiPromptUsed:
            entry.source === 'ai_generated'
              ? entry.aiPromptUsed.trim() || null
              : null,
        });
        successCount++;
      } catch {
        errorCount++;
      }
    }

    if (successCount > 0) {
      toast.success(
        `${successCount} photo${successCount > 1 ? 's' : ''} ajoutée${successCount > 1 ? 's' : ''}`
      );
    }
    if (errorCount > 0) {
      toast.error(
        `${errorCount} photo${errorCount > 1 ? 's' : ''} n'ont pas pu être uploadée${errorCount > 1 ? 's' : ''}`
      );
    }

    onClose();
  }, [entries, isValid, onUpload, onClose]);

  return (
    <Dialog
      open={open}
      onOpenChange={open_ => {
        if (!open_) onClose();
      }}
    >
      <DialogContent className="flex h-screen flex-col md:h-auto md:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ajouter des photos</DialogTitle>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto pr-1 md:max-h-[60vh]">
          {/* Pont Studio Marketing → DAM : encart si un prompt récent est mémorisé */}
          {lastPrompt && !promptApplied && (
            <div className="flex flex-col gap-2 rounded-lg border border-fuchsia-200 bg-fuchsia-50/60 p-3 text-xs sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-2">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-fuchsia-600" />
                <div>
                  <p className="font-medium text-fuchsia-900">
                    Tu as copié un prompt depuis Studio Marketing{' '}
                    {formatPromptAge(lastPrompt.copiedAt)}.
                  </p>
                  <p className="text-fuchsia-700">
                    {lastPrompt.productLabel
                      ? `« ${lastPrompt.productLabel} » · `
                      : ''}
                    Pré-remplir l'origine « Générée par IA » + le prompt pour{' '}
                    {entries.length > 0
                      ? `${entries.length} photo${entries.length > 1 ? 's' : ''}`
                      : 'les prochaines photos'}{' '}
                    ?
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={dismissLastPrompt}
                  className="h-8 text-xs"
                >
                  Ignorer
                </Button>
                <Button
                  size="sm"
                  onClick={applyLastPromptToAllEntries}
                  disabled={entries.length === 0}
                  className="h-8 text-xs"
                >
                  Pré-remplir
                </Button>
              </div>
            </div>
          )}

          <div
            className="flex min-h-[44px] cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border p-8 text-center transition-colors hover:border-primary hover:bg-muted/50"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
          >
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Glissez vos photos ici ou{' '}
              <span className="font-medium text-primary">
                cliquez pour sélectionner
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              JPEG, PNG, WebP — plusieurs fichiers autorisés
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleDropZoneChange}
            />
          </div>

          {entries.map((entry, index) => (
            <div
              key={`${entry.file.name}-${index}`}
              className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-start"
            >
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={entry.preview}
                  alt={entry.altText}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">
                    Produit ou variante{' '}
                    <span className="text-destructive">*</span>
                    {!entry.pickedItem && (
                      <span className="ml-1 text-[10px] text-destructive">
                        Obligatoire
                      </span>
                    )}
                  </Label>
                  <ProductOrVariantPicker
                    value={entry.pickedItem}
                    onChange={item => setPickedItemForEntry(index, item)}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Label className="w-16 shrink-0 text-xs">Type</Label>
                  <Select
                    value={entry.assetType}
                    onValueChange={v =>
                      updateEntry(index, 'assetType', v as MediaAssetType)
                    }
                  >
                    <SelectTrigger className="h-8 flex-1 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="product">Produit</SelectItem>
                      <SelectItem value="lifestyle">Lifestyle</SelectItem>
                      <SelectItem value="packshot">Packshot</SelectItem>
                      <SelectItem value="ambiance">Ambiance</SelectItem>
                      <SelectItem value="logo">Logo</SelectItem>
                      <SelectItem value="other">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Label className="w-16 shrink-0 text-xs">Origine</Label>
                  <Select
                    value={entry.source}
                    onValueChange={v =>
                      updateEntry(index, 'source', v as MediaAssetSource)
                    }
                  >
                    <SelectTrigger className="h-8 flex-1 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual_upload">
                        Upload manuel
                      </SelectItem>
                      <SelectItem value="supplier_provided">
                        Fournisseur
                      </SelectItem>
                      <SelectItem value="ai_generated">
                        Générée par IA (Nano Banana, Gemini…)
                      </SelectItem>
                      <SelectItem value="stock_photo">
                        Banque d'images
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {entry.source === 'ai_generated' && (
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">
                      Prompt utilisé{' '}
                      <span className="text-[10px] text-muted-foreground">
                        (conservé pour réutilisation / affinage)
                      </span>
                    </Label>
                    <Textarea
                      value={entry.aiPromptUsed}
                      onChange={e =>
                        updateEntry(index, 'aiPromptUsed', e.target.value)
                      }
                      placeholder="Colle ici le prompt complet qui a généré cette image…"
                      rows={3}
                      className="resize-none text-xs"
                    />
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <Label className="text-xs">
                    Marques <span className="text-destructive">*</span>
                    {entry.pickedItem &&
                      entry.pickedItem.brandIds.length > 0 &&
                      entry.brandIds.length ===
                        entry.pickedItem.brandIds.length && (
                        <span className="ml-1 text-[10px] text-muted-foreground">
                          (héritées du produit)
                        </span>
                      )}
                    {entry.brandIds.length === 0 && (
                      <span className="ml-1 text-[10px] text-destructive">
                        Sélectionner au moins 1
                      </span>
                    )}
                  </Label>
                  <div className="flex flex-wrap gap-1">
                    {brands.map(brand => {
                      const selected = entry.brandIds.includes(brand.id);
                      return (
                        <button
                          key={brand.id}
                          type="button"
                          onClick={() => toggleBrand(index, brand.id)}
                          className={`min-h-[44px] rounded px-2 py-1 text-xs font-medium transition-colors md:min-h-[28px] ${
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

                <div className="flex items-center gap-2">
                  <Label className="w-16 shrink-0 text-xs">Description</Label>
                  <Input
                    value={entry.altText}
                    onChange={e =>
                      updateEntry(index, 'altText', e.target.value)
                    }
                    placeholder="Texte alternatif..."
                    className="h-8 flex-1 text-xs"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Label className="w-16 shrink-0 text-xs">Tags</Label>
                  <Input
                    value={entry.tags}
                    onChange={e => updateEntry(index, 'tags', e.target.value)}
                    placeholder="tag1, tag2, ..."
                    className="h-8 flex-1 text-xs"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => removeEntry(index)}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center self-start rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground md:min-h-[28px] md:min-w-[28px]"
                aria-label="Retirer ce fichier"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <DialogFooter className="flex-col gap-2 md:flex-row">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={uploading}
            className="min-h-[44px] w-full md:min-h-[36px] md:w-auto"
          >
            Annuler
          </Button>
          <Button
            onClick={() => {
              void handleSubmit();
            }}
            disabled={uploading || !isValid}
            className="min-h-[44px] w-full md:min-h-[36px] md:w-auto"
          >
            {uploading
              ? 'Upload en cours...'
              : entries.length > 0
                ? `Uploader ${entries.length} photo${entries.length > 1 ? 's' : ''}`
                : 'Uploader'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
