'use client';

import { useState } from 'react';
import { Input, Textarea, Label } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { cn } from '@verone/ui';
import { Globe, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { createClient } from '@verone/utils/supabase/client';

interface SerpPreviewProps {
  productId: string;
  productName: string;
  initialMetaTitle?: string | null;
  initialMetaDescription?: string | null;
  slug?: string | null;
  onUpdate?: () => void;
}

const META_TITLE_MAX = 60;
const META_DESC_MAX = 160;
const META_TITLE_MIN = 30;
const META_DESC_MIN = 70;

function CharCounter({
  current,
  min,
  max,
}: {
  current: number;
  min: number;
  max: number;
}) {
  const isGood = current >= min && current <= max;
  const isTooLong = current > max;
  const isTooShort = current > 0 && current < min;

  return (
    <span
      className={cn(
        'text-[10px] font-mono',
        isGood && 'text-green-600',
        isTooLong && 'text-red-600',
        isTooShort && 'text-orange-500',
        current === 0 && 'text-gray-400'
      )}
    >
      {current}/{max}
      {isTooLong && ' (trop long)'}
      {isTooShort && ' (trop court)'}
      {isGood && ' (ok)'}
    </span>
  );
}

export function SerpPreview({
  productId,
  productName,
  initialMetaTitle,
  initialMetaDescription,
  slug,
  onUpdate,
}: SerpPreviewProps) {
  const [metaTitle, setMetaTitle] = useState(initialMetaTitle ?? '');
  const [metaDescription, setMetaDescription] = useState(
    initialMetaDescription ?? ''
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const displayTitle = metaTitle || productName;
  const displayDescription =
    metaDescription ||
    'Ajoutez une meta description pour optimiser votre referencement Google...';
  const displayUrl = `veronecollections.fr/produits/${slug ?? 'produit'}`;

  const handleSave = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('products')
        .update({
          meta_title: metaTitle.trim() || null,
          meta_description: metaDescription.trim() || null,
        })
        .eq('id', productId);
      if (error) throw error;
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onUpdate?.();
    } finally {
      setSaving(false);
    }
  };

  const hasChanges =
    metaTitle !== (initialMetaTitle ?? '') ||
    metaDescription !== (initialMetaDescription ?? '');

  return (
    <div className="space-y-4">
      {/* Google Preview */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Globe className="h-4 w-4 text-gray-400" />
          <span className="text-xs font-medium text-gray-600">
            Apercu Google
          </span>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 max-w-[600px]">
          <div className="text-xs text-green-700 mb-0.5 truncate">
            {displayUrl}
          </div>
          <div className="text-[#1a0dab] text-lg leading-snug mb-1 line-clamp-1 hover:underline cursor-default">
            {displayTitle.substring(0, META_TITLE_MAX)}
            {displayTitle.length > META_TITLE_MAX && '...'}
          </div>
          <div className="text-sm text-gray-600 line-clamp-2">
            {displayDescription.substring(0, META_DESC_MAX)}
            {displayDescription.length > META_DESC_MAX && '...'}
          </div>
        </div>
      </div>

      {/* Edit fields */}
      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <Label className="text-xs">Meta Title</Label>
            <CharCounter
              current={metaTitle.length}
              min={META_TITLE_MIN}
              max={META_TITLE_MAX}
            />
          </div>
          <Input
            value={metaTitle}
            onChange={e => setMetaTitle(e.target.value)}
            placeholder={productName}
            className="text-sm"
            maxLength={80}
          />
          <p className="text-[10px] text-gray-400 mt-0.5">
            Ideal: {META_TITLE_MIN}-{META_TITLE_MAX} caracteres. Laissez vide
            pour utiliser le nom du produit.
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <Label className="text-xs">Meta Description</Label>
            <CharCounter
              current={metaDescription.length}
              min={META_DESC_MIN}
              max={META_DESC_MAX}
            />
          </div>
          <Textarea
            value={metaDescription}
            onChange={e => setMetaDescription(e.target.value)}
            placeholder="Description optimisee pour Google (160 caracteres max)..."
            className="text-sm resize-none"
            rows={3}
            maxLength={200}
          />
          <p className="text-[10px] text-gray-400 mt-0.5">
            Ideal: {META_DESC_MIN}-{META_DESC_MAX} caracteres. Inclure les
            mots-cles importants.
          </p>
        </div>

        {/* Score SEO rapide */}
        <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
          <p className="text-xs font-medium text-gray-700 mb-2">Score SEO</p>
          <div className="space-y-1">
            <ScoreItem
              label="Meta title"
              ok={
                metaTitle.length >= META_TITLE_MIN &&
                metaTitle.length <= META_TITLE_MAX
              }
              empty={metaTitle.length === 0}
            />
            <ScoreItem
              label="Meta description"
              ok={
                metaDescription.length >= META_DESC_MIN &&
                metaDescription.length <= META_DESC_MAX
              }
              empty={metaDescription.length === 0}
            />
            <ScoreItem label="Slug URL" ok={Boolean(slug)} empty={!slug} />
          </div>
        </div>

        {hasChanges && (
          <ButtonV2
            variant="primary"
            size="sm"
            icon={saved ? CheckCircle : Save}
            onClick={() => {
              void handleSave();
            }}
            disabled={saving}
            className="w-full"
          >
            {saving
              ? 'Enregistrement...'
              : saved
                ? 'Enregistre !'
                : 'Enregistrer les meta SEO'}
          </ButtonV2>
        )}
      </div>
    </div>
  );
}

function ScoreItem({
  label,
  ok,
  empty,
}: {
  label: string;
  ok: boolean;
  empty: boolean;
}) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {ok ? (
        <CheckCircle className="h-3 w-3 text-green-500" />
      ) : empty ? (
        <AlertCircle className="h-3 w-3 text-gray-300" />
      ) : (
        <AlertCircle className="h-3 w-3 text-orange-500" />
      )}
      <span
        className={cn(
          ok ? 'text-green-700' : empty ? 'text-gray-400' : 'text-orange-600'
        )}
      >
        {label}
      </span>
    </div>
  );
}
