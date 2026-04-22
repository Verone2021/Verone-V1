'use client';

/**
 * PrimaryImageCard — hero card affichant l'image principale du produit.
 * Layout 2 cols : image gauche (320×320) + panel métadonnées droite.
 * L'alt_text est éditable inline via updateImageMetadata du hook.
 *
 * Sprint : BO-UI-PROD-IMG-001
 */

import { useState, useCallback } from 'react';

import Image from 'next/image';

import { Star, Pencil, Check, X, FileImage } from 'lucide-react';

import type { Database } from '@verone/types';
import { cn } from '@verone/utils';

import { formatFileSize, formatDateFr } from './utils';

type ProductImage = Database['public']['Tables']['product_images']['Row'];

interface PrimaryImageCardProps {
  primaryImage: ProductImage | null;
  productName: string;
  onSetPrimary?: (imageId: string) => void;
  onUpdateAltText: (imageId: string, altText: string) => Promise<void>;
}

function MetaRow({
  kicker,
  children,
}: {
  kicker: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500 mb-0.5">
        {kicker}
      </p>
      <div className="text-sm text-neutral-900">{children}</div>
    </div>
  );
}

export function PrimaryImageCard({
  primaryImage,
  productName,
  onUpdateAltText,
}: PrimaryImageCardProps) {
  const [editingAlt, setEditingAlt] = useState(false);
  const [draftAlt, setDraftAlt] = useState('');
  const [savingAlt, setSavingAlt] = useState(false);

  const handleStartEditAlt = useCallback(() => {
    setDraftAlt(primaryImage?.alt_text ?? '');
    setEditingAlt(true);
  }, [primaryImage?.alt_text]);

  const handleCancelAlt = useCallback(() => {
    setEditingAlt(false);
  }, []);

  const handleSaveAlt = useCallback(async () => {
    if (!primaryImage) return;
    setSavingAlt(true);
    try {
      await onUpdateAltText(primaryImage.id, draftAlt);
      setEditingAlt(false);
    } catch (err) {
      console.error('[PrimaryImageCard] alt_text update failed:', err);
    } finally {
      setSavingAlt(false);
    }
  }, [primaryImage, draftAlt, onUpdateAltText]);

  // Empty state
  if (!primaryImage) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <p className="text-sm font-semibold text-neutral-900 mb-1">
          Image principale
        </p>
        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-neutral-300 rounded-lg bg-neutral-50">
          <FileImage className="h-12 w-12 text-neutral-300 mb-3" />
          <p className="text-sm text-neutral-500 font-medium">
            Aucune image principale définie
          </p>
          <p className="text-xs text-neutral-400 mt-1">
            Uploadez une image puis définissez-la comme principale
          </p>
        </div>
      </div>
    );
  }

  const formatChip = (primaryImage.format ?? 'JPEG').toUpperCase();
  const dimensionsLabel =
    primaryImage.width != null && primaryImage.height != null
      ? `${primaryImage.width} × ${primaryImage.height} px`
      : 'Non renseignées';

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Star className="h-4 w-4 text-amber-500 fill-amber-400" />
        <p className="text-sm font-semibold text-neutral-900">
          Image principale
        </p>
        <span className="rounded px-1.5 py-0.5 text-[10px] border bg-amber-50 text-amber-700 border-amber-200 font-medium">
          Principale
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Col gauche — image */}
        <div className="relative w-full aspect-square max-w-[320px] mx-auto lg:mx-0 rounded-lg overflow-hidden border border-neutral-200 bg-neutral-50">
          <Image
            src={primaryImage.public_url ?? ''}
            alt={primaryImage.alt_text ?? productName}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 320px"
          />
          <div className="absolute top-2 left-2 z-10">
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/70 text-white text-[10px] font-medium">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              Principale
            </span>
          </div>
        </div>

        {/* Col droite — métadonnées */}
        <div className="space-y-4">
          {/* ALT TEXT — éditable inline */}
          <div className="group">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                ALT TEXT (SEO)
              </p>
              {!editingAlt && (
                <button
                  type="button"
                  onClick={handleStartEditAlt}
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 flex items-center justify-center rounded hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700"
                  aria-label="Modifier le texte alternatif"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              )}
            </div>
            {editingAlt ? (
              <div className="flex items-start gap-1.5">
                <input
                  type="text"
                  value={draftAlt}
                  onChange={e => setDraftAlt(e.target.value)}
                  placeholder="Texte alternatif pour le SEO…"
                  className="flex-1 border border-neutral-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    void handleSaveAlt().catch(console.error);
                  }}
                  disabled={savingAlt}
                  className={cn(
                    'h-11 w-11 md:h-8 md:w-8 flex items-center justify-center rounded',
                    'bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50'
                  )}
                  aria-label="Valider"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleCancelAlt}
                  className="h-11 w-11 md:h-8 md:w-8 flex items-center justify-center rounded border border-neutral-300 text-neutral-600 hover:bg-neutral-50"
                  aria-label="Annuler"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <p className="text-sm text-neutral-700">
                {primaryImage.alt_text?.trim() ? (
                  primaryImage.alt_text
                ) : (
                  <span className="text-neutral-400 italic">
                    Non renseigné — important pour le SEO
                  </span>
                )}
              </p>
            )}
          </div>

          <MetaRow kicker="DIMENSIONS">
            <span className="font-mono text-xs text-neutral-700">
              {dimensionsLabel}
            </span>
          </MetaRow>

          <MetaRow kicker="FORMAT">
            <span className="inline-block px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 text-xs font-medium border border-neutral-200">
              {formatChip}
            </span>
          </MetaRow>

          <MetaRow kicker="POIDS">
            <span className="font-mono text-xs text-neutral-700">
              {primaryImage.file_size != null
                ? formatFileSize(primaryImage.file_size)
                : 'Non renseigné'}
            </span>
          </MetaRow>

          <MetaRow kicker="UPLOADÉ LE">
            <span className="text-xs text-neutral-700">
              {primaryImage.created_at
                ? formatDateFr(primaryImage.created_at)
                : '—'}
            </span>
          </MetaRow>

          <MetaRow kicker="ORDRE D'AFFICHAGE">
            <span className="inline-block px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-200">
              #{primaryImage.display_order ?? 0}
            </span>
          </MetaRow>
        </div>
      </div>
    </div>
  );
}
