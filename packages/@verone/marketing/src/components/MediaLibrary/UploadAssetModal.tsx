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
import { Upload, X } from 'lucide-react';
import { toast } from 'sonner';

import type { BrandInfo } from './MediaAssetCard';
import type { MediaAssetType, UploadAssetInput } from '@verone/products';

// ============================================================================
// TYPES
// ============================================================================

interface FileEntry {
  file: File;
  preview: string;
  assetType: MediaAssetType;
  brandIds: string[];
  altText: string;
  tags: string;
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

  // Nettoyage des previews quand la modal ferme
  React.useEffect(() => {
    if (!open) {
      entries.forEach(e => URL.revokeObjectURL(e.preview));
      setEntries([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- entries deliberately excluded
  }, [open]);

  const handleFilesSelected = React.useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newEntries: FileEntry[] = Array.from(files).map(file => ({
      file,
      preview: URL.createObjectURL(file),
      assetType: 'product',
      brandIds: [],
      altText: file.name.replace(/\.[^/.]+$/, ''),
      tags: '',
    }));

    setEntries(prev => [...prev, ...newEntries]);
  }, []);

  const handleDropZoneChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFilesSelected(e.target.files);
      // Reset input pour permettre re-sélection même fichier
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
    () => entries.length > 0 && entries.every(e => e.brandIds.length > 0),
    [entries]
  );

  const handleSubmit = React.useCallback(async () => {
    if (!isValid) return;

    let successCount = 0;
    let errorCount = 0;

    for (const entry of entries) {
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

        <div className="flex-1 overflow-y-auto md:max-h-[60vh] space-y-4 pr-1">
          {/* Zone de drop */}
          <div
            className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border p-8 text-center transition-colors hover:border-primary hover:bg-muted/50 cursor-pointer min-h-[44px]"
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

          {/* Lignes de fichiers */}
          {entries.map((entry, index) => (
            <div
              key={`${entry.file.name}-${index}`}
              className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-start"
            >
              {/* Aperçu */}
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={entry.preview}
                  alt={entry.altText}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="flex flex-1 flex-col gap-2">
                {/* Type */}
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

                {/* Marques — OBLIGATOIRE */}
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">
                    Marques <span className="text-destructive">*</span>
                    {entry.brandIds.length === 0 && (
                      <span className="ml-1 text-destructive text-[10px]">
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

                {/* Alt text */}
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

                {/* Tags */}
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

              {/* Supprimer */}
              <button
                type="button"
                onClick={() => removeEntry(index)}
                className="self-start rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground min-h-[44px] min-w-[44px] md:min-h-[28px] md:min-w-[28px] flex items-center justify-center"
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
            className="w-full min-h-[44px] md:min-h-[36px] md:w-auto"
          >
            Annuler
          </Button>
          <Button
            onClick={() => {
              void handleSubmit();
            }}
            disabled={uploading || !isValid}
            className="w-full min-h-[44px] md:min-h-[36px] md:w-auto"
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
