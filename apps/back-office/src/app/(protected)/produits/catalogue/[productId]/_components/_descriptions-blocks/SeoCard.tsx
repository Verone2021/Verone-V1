'use client';

/**
 * SeoCard — Card 3 de l'onglet Descriptions.
 * Slug readonly + meta titre/description éditables + SERP preview + compteurs.
 */

import { useState, useCallback } from 'react';

import { Copy, Save, Globe } from 'lucide-react';

import { cn } from '@verone/utils';

import type { Product, ProductRow } from '../types';

interface SeoCardProps {
  product: Product;
  onProductUpdate: (updates: Partial<ProductRow>) => Promise<void>;
}

const META_TITLE_MAX = 70;
const META_TITLE_WARN = 60;
const META_DESC_MAX = 160;

function CharCounter({
  current,
  max,
  warn,
}: {
  current: number;
  max: number;
  warn?: number;
}) {
  const isOver = current > max;
  const isWarn = warn != null && current > warn && current <= max;
  const isOk = current > 0 && current <= (warn ?? max);

  return (
    <span
      className={cn(
        'text-[10px] font-mono tabular-nums',
        isOver && 'text-red-600',
        isWarn && 'text-orange-500',
        isOk && !isWarn && 'text-emerald-600',
        current === 0 && 'text-gray-400'
      )}
    >
      {current}/{max}
    </span>
  );
}

function SerpPreviewBox({
  title,
  description,
  slug,
}: {
  title: string;
  description: string;
  slug: string | null;
}) {
  const displayUrl = `veronecollections.fr/produits/${slug ?? 'produit'}`;
  const displayTitle = title || 'Titre de la page';
  const displayDesc =
    description ||
    'Ajoutez une meta description pour optimiser votre référencement Google…';

  return (
    <div className="bg-blue-50 border border-blue-100 rounded-md p-4">
      <div className="flex items-center gap-1.5 mb-2">
        <Globe className="h-3.5 w-3.5 text-gray-400" />
        <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
          Aperçu Google
        </span>
      </div>
      <div className="space-y-0.5 max-w-xl">
        <div className="text-xs text-green-700 truncate">{displayUrl}</div>
        <div className="text-[#1a0dab] text-base font-normal leading-snug line-clamp-1">
          {displayTitle.substring(0, META_TITLE_MAX)}
          {displayTitle.length > META_TITLE_MAX && '…'}
        </div>
        <div className="text-sm text-gray-600 line-clamp-2 leading-snug">
          {displayDesc.substring(0, META_DESC_MAX)}
          {displayDesc.length > META_DESC_MAX && '…'}
        </div>
      </div>
    </div>
  );
}

export function SeoCard({ product, onProductUpdate }: SeoCardProps) {
  const [metaTitle, setMetaTitle] = useState(product.meta_title ?? '');
  const [metaDescription, setMetaDescription] = useState(
    product.meta_description ?? ''
  );
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const hasChanges =
    metaTitle !== (product.meta_title ?? '') ||
    metaDescription !== (product.meta_description ?? '');

  const handleCopySlug = useCallback(() => {
    if (!product.slug) return;
    void navigator.clipboard.writeText(product.slug).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [product.slug]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await onProductUpdate({
        meta_title: metaTitle.trim() || null,
        meta_description: metaDescription.trim() || null,
      });
      setSavedAt(Date.now());
      setTimeout(() => setSavedAt(null), 2000);
    } catch (err) {
      console.error('[SeoCard] save failed:', err);
    } finally {
      setSaving(false);
    }
  }, [metaTitle, metaDescription, onProductUpdate]);

  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">
          SEO & Référencement
        </h3>
        <button
          type="button"
          onClick={() => {
            void handleSave().catch(err => console.error('[SeoCard]:', err));
          }}
          disabled={!hasChanges || saving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors h-11 md:h-8"
        >
          <Save className="h-3.5 w-3.5" />
          {saving
            ? 'Enregistrement...'
            : savedAt
              ? 'Enregistré !'
              : 'Enregistrer SEO'}
        </button>
      </div>

      <div className="space-y-4">
        {/* Slug readonly */}
        <div>
          <label className="text-xs text-gray-500 font-medium block mb-1.5">
            Slug URL
          </label>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'flex-1 px-3 py-2 rounded-md border border-neutral-200 bg-neutral-50 text-sm font-mono truncate',
                product.slug ? 'text-neutral-700' : 'text-neutral-400 italic'
              )}
            >
              {product.slug ?? 'Non défini'}
            </span>
            {product.slug && (
              <button
                type="button"
                onClick={handleCopySlug}
                className="flex items-center justify-center h-11 w-11 md:h-9 md:w-9 rounded-md border border-neutral-200 hover:bg-neutral-50 transition-colors text-neutral-500"
                title="Copier le slug"
                aria-label="Copier le slug"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {copied && (
            <p className="text-[10px] text-emerald-600 mt-1">Slug copié !</p>
          )}
        </div>

        {/* Meta titre */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs text-gray-500 font-medium">
              Meta titre
            </label>
            <CharCounter
              current={metaTitle.length}
              max={META_TITLE_MAX}
              warn={META_TITLE_WARN}
            />
          </div>
          <input
            type="text"
            value={metaTitle}
            onChange={e => setMetaTitle(e.target.value)}
            maxLength={META_TITLE_MAX + 10}
            placeholder={product.name}
            className="w-full border border-neutral-200 rounded-md text-sm p-3 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 h-11 md:h-10"
          />
          <p className="text-[10px] text-gray-400 mt-1">
            Idéal : {'<'} {META_TITLE_WARN} car. Laissez vide pour utiliser le
            nom du produit.
          </p>
        </div>

        {/* Meta description */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs text-gray-500 font-medium">
              Meta description
            </label>
            <CharCounter current={metaDescription.length} max={META_DESC_MAX} />
          </div>
          <textarea
            value={metaDescription}
            onChange={e => setMetaDescription(e.target.value)}
            rows={3}
            maxLength={META_DESC_MAX + 20}
            placeholder="Description optimisée pour Google (160 caractères max)..."
            className="w-full border border-neutral-200 rounded-md text-sm p-3 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
          />
        </div>

        {/* SERP Preview */}
        <SerpPreviewBox
          title={metaTitle}
          description={metaDescription}
          slug={product.slug ?? null}
        />
      </div>
    </div>
  );
}
