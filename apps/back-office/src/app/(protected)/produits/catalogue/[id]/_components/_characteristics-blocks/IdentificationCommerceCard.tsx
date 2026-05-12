'use client';

/**
 * IdentificationCommerceCard — Bloc 3 du dashboard Caractéristiques.
 * Grid 4 cols : Marque / GTIN / État (condition) / Style décoratif.
 * Row full-width : Pièces compatibles (chips multi) + Vidéo URL.
 */

import { useCallback } from 'react';

import { useInlineEdit } from '@verone/common/hooks';
import { formatStyle } from '@verone/products/components/images';
import { COLLECTION_STYLE_OPTIONS } from '@verone/types';
import { cn } from '@verone/utils';
import { Lock } from 'lucide-react';

import type { Database } from '@verone/types';

import type { Product, ProductRow } from '../types';
import { CompatibleRoomsEditor } from './identification/CompatibleRoomsEditor';
import { InlineTextField } from './identification/InlineTextField';
import { VideoUrlField } from './identification/VideoUrlField';

type RoomType = Database['public']['Enums']['room_type'];

const CONDITION_OPTIONS = [
  { value: 'new', label: 'Neuf' },
  { value: 'used', label: 'Occasion' },
  { value: 'refurbished', label: 'Reconditionné' },
] as const;

interface IdentificationCommerceCardProps {
  product: Product;
  onProductUpdate: (updates: Partial<ProductRow>) => Promise<void>;
}

export function IdentificationCommerceCard({
  product,
  onProductUpdate,
}: IdentificationCommerceCardProps) {
  const { startEdit, updateEditedData, saveChanges, cancelEdit } =
    useInlineEdit({
      productId: product.id,
      onUpdate: data => {
        void onProductUpdate(data as Partial<ProductRow>).catch(err => {
          console.error('[IdentificationCommerceCard] update failed:', err);
        });
      },
    });

  const handleSave = useCallback(
    (field: string, value: string | string[] | null) => {
      startEdit('characteristics_identification', { [field]: value });
      updateEditedData('characteristics_identification', { [field]: value });
      void saveChanges('characteristics_identification').then(ok => {
        if (!ok) cancelEdit('characteristics_identification');
      });
    },
    [startEdit, updateEditedData, saveChanges, cancelEdit]
  );

  // Style : hérité du groupe si variant_group.style existe
  const styleValue = product.variant_group?.style ?? product.style ?? null;
  const styleIsInherited =
    product.variant_group_id != null && product.variant_group?.style != null;
  const styleLabel = styleValue ? formatStyle(styleValue) : null;

  // Pièces compatibles : héritage variant_group.suitable_rooms
  const roomsIsInherited =
    product.variant_group?.suitable_rooms != null &&
    (product.variant_group.suitable_rooms as RoomType[]).length > 0;
  const rooms: RoomType[] = roomsIsInherited
    ? (product.variant_group!.suitable_rooms as RoomType[])
    : (product.suitable_rooms ?? []);

  // Condition actuelle
  const conditionValue = product.condition ?? null;

  const handleRoomsSave = useCallback(
    (updated: RoomType[]) => {
      handleSave('suitable_rooms', updated);
    },
    [handleSave]
  );

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-4">
      {/* Header */}
      <h3 className="text-[10px] uppercase tracking-wide text-neutral-500 font-medium mb-3">
        Identification & Commerce
      </h3>

      {/* Grid 4 cols */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
        <InlineTextField
          label="Fabricant"
          value={product.manufacturer ?? ''}
          placeholder="ex: Cassina"
          onSave={v => handleSave('manufacturer', v || null)}
        />
        <InlineTextField
          label="GTIN / EAN"
          value={product.gtin ?? ''}
          placeholder="0000000000000"
          mono
          onSave={v => handleSave('gtin', v || null)}
        />

        {/* Condition (segmented) */}
        <div className="bg-neutral-50 rounded border border-neutral-200 p-2 flex flex-col gap-1">
          <span className="text-[9px] uppercase tracking-wide text-neutral-400 font-medium">
            État
          </span>
          <div className="flex gap-1 flex-wrap">
            {CONDITION_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() =>
                  handleSave(
                    'condition',
                    conditionValue === opt.value ? null : opt.value
                  )
                }
                className={cn(
                  'px-1.5 py-0.5 text-[10px] rounded border transition-colors',
                  conditionValue === opt.value
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'border-neutral-200 text-neutral-600 hover:border-neutral-400'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Style (readonly si hérité) */}
        <div className="bg-neutral-50 rounded border border-neutral-200 p-2 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-wide text-neutral-400 font-medium">
              Style décoratif
            </span>
            {styleIsInherited && (
              <Lock className="h-2.5 w-2.5 text-blue-400 flex-shrink-0" />
            )}
          </div>
          {styleIsInherited ? (
            <span className="text-xs text-neutral-700">
              {styleLabel ?? '—'}
            </span>
          ) : (
            <div className="flex flex-wrap gap-1">
              {COLLECTION_STYLE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() =>
                    handleSave(
                      'style',
                      styleValue === opt.value ? null : opt.value
                    )
                  }
                  className={cn(
                    'px-1.5 py-0.5 text-[10px] rounded border transition-colors',
                    styleValue === opt.value
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'border-neutral-200 text-neutral-600 hover:border-neutral-400'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
          {styleIsInherited && product.variant_group_id && (
            <a
              href={`/produits/catalogue/variantes/${product.variant_group_id}`}
              className="text-[9px] text-blue-600 hover:underline flex items-center gap-0.5"
            >
              <Lock className="h-2 w-2" />
              Hérité du groupe
            </a>
          )}
        </div>
      </div>

      {/* Pièces compatibles */}
      <CompatibleRoomsEditor
        rooms={rooms}
        isInherited={roomsIsInherited}
        initialRooms={product.suitable_rooms ?? []}
        onSave={handleRoomsSave}
      />

      {/* Vidéo URL */}
      <VideoUrlField
        videoUrl={product.video_url ?? null}
        onSave={v => handleSave('video_url', v)}
      />
    </div>
  );
}
