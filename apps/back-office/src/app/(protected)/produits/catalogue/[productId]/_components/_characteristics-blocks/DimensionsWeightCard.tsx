'use client';

/**
 * DimensionsWeightCard — Bloc 2 du dashboard Caractéristiques.
 * SVG wireframe cube + 4 mini-cards inline-éditables (L/H/P/Poids).
 * Chip "Hérité du groupe" si dimensions viennent du variant_group.
 */

import { useState, useCallback, useMemo } from 'react';

import { useInlineEdit } from '@verone/common/hooks';
import { extractDimensions } from '@verone/products/components/images';
import { Input } from '@verone/ui';
import { cn } from '@verone/utils';
import { Lock, Pencil, Check, X, ExternalLink } from 'lucide-react';

import type { Product, ProductRow } from '../types';

interface DimensionsWeightCardProps {
  product: Product;
  onProductUpdate: (updates: Partial<ProductRow>) => Promise<void>;
}

/** SVG wireframe cube (isométrique simplifié) */
function CubeWireframe({
  length,
  width,
  height,
}: {
  length: number | null;
  width: number | null;
  height: number | null;
}) {
  return (
    <svg
      viewBox="0 0 80 70"
      className="w-20 h-16 text-neutral-300"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {/* Front face */}
      <polygon points="20,40 60,40 60,65 20,65" />
      {/* Top face */}
      <polygon points="20,40 40,25 80,25 60,40" />
      {/* Side face */}
      <polygon points="60,40 80,25 80,50 60,65" />
      {/* Dimension labels */}
      {length != null && (
        <text x="38" y="72" fontSize="7" fill="#94a3b8" stroke="none">
          L {length}
        </text>
      )}
      {width != null && (
        <text x="63" y="43" fontSize="7" fill="#94a3b8" stroke="none">
          l {width}
        </text>
      )}
      {height != null && (
        <text x="2" y="55" fontSize="7" fill="#94a3b8" stroke="none">
          H {height}
        </text>
      )}
    </svg>
  );
}

interface InlineDimFieldProps {
  label: string;
  value: number | null;
  unit: string;
  readOnly: boolean;
  onChange: (v: number | null) => void;
}

function InlineDimField({
  label,
  value,
  unit,
  readOnly,
  onChange,
}: InlineDimFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value?.toString() ?? '');

  const handleSave = useCallback(() => {
    const num = parseFloat(draft);
    onChange(isNaN(num) ? null : num);
    setEditing(false);
  }, [draft, onChange]);

  return (
    <div className="bg-neutral-50 rounded border border-neutral-200 p-2 flex flex-col gap-1">
      <span className="text-[9px] uppercase tracking-wide text-neutral-400 font-medium">
        {label}
      </span>
      {readOnly ? (
        <span className="text-sm font-semibold tabular-nums text-neutral-700">
          {value != null ? `${value} ${unit}` : '—'}
        </span>
      ) : editing ? (
        <div className="flex items-center gap-1">
          <Input
            autoFocus
            type="number"
            step="0.1"
            min="0"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') {
                setDraft(value?.toString() ?? '');
                setEditing(false);
              }
            }}
            className="h-6 text-xs px-1 w-16"
          />
          <span className="text-[9px] text-neutral-400">{unit}</span>
          <button
            onClick={handleSave}
            className="h-11 w-11 md:h-7 md:w-7 flex items-center justify-center rounded text-green-600 hover:bg-green-50"
            aria-label="Valider"
          >
            <Check className="h-3 w-3" />
          </button>
          <button
            onClick={() => {
              setDraft(value?.toString() ?? '');
              setEditing(false);
            }}
            className="h-11 w-11 md:h-7 md:w-7 flex items-center justify-center rounded text-neutral-400 hover:bg-neutral-100"
            aria-label="Annuler"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="group flex items-center gap-1 text-left"
        >
          <span className="text-sm font-semibold tabular-nums text-neutral-700">
            {value != null ? `${value} ${unit}` : '—'}
          </span>
          <Pencil className="h-2.5 w-2.5 text-neutral-300 group-hover:text-neutral-500 transition-colors" />
        </button>
      )}
    </div>
  );
}

/** Convertit une dimension vers cm selon l'unité source */
function toCm(value: number, unit: string): number {
  if (unit === 'm') return value * 100;
  if (unit === 'mm') return value / 10;
  return value; // cm par défaut
}

/** Formate un volume m³ avec 3-5 décimales significatives */
function formatVolume(m3: number): string {
  if (m3 === 0) return '0 m³';
  // Trouver le bon nombre de décimales significatives
  const decimals = m3 < 0.001 ? 6 : m3 < 0.01 ? 5 : m3 < 0.1 ? 4 : 3;
  return `${m3.toFixed(decimals)} m³`;
}

interface VolumeDisplayProps {
  length: number | null;
  width: number | null;
  height: number | null;
  unit: string;
}

function VolumeDisplay({ length, width, height, unit }: VolumeDisplayProps) {
  if (length == null || width == null || height == null) {
    return (
      <div className="mt-3 flex items-center gap-2 px-2 py-1.5 bg-neutral-50 rounded border border-neutral-100">
        <span className="text-sm">📦</span>
        <span className="text-[10px] uppercase tracking-wide text-neutral-400 font-medium w-20 flex-shrink-0">
          Volume
        </span>
        <span className="text-xs text-neutral-400 italic tabular-nums">
          — (L × l × H requis)
        </span>
      </div>
    );
  }

  const lcm = toCm(length, unit);
  const wcm = toCm(width, unit);
  const hcm = toCm(height, unit);
  const volumeM3 = (lcm * wcm * hcm) / 1_000_000;

  return (
    <div className="mt-3 flex items-center gap-2 px-2 py-1.5 bg-neutral-50 rounded border border-neutral-100">
      <span className="text-sm">📦</span>
      <span className="text-[10px] uppercase tracking-wide text-neutral-400 font-medium w-20 flex-shrink-0">
        Volume
      </span>
      <span className="text-sm font-semibold tabular-nums text-neutral-700">
        {formatVolume(volumeM3)}
      </span>
      <span className="text-[10px] text-neutral-400 italic ml-auto">
        entreposage
      </span>
    </div>
  );
}

export function DimensionsWeightCard({
  product,
  onProductUpdate,
}: DimensionsWeightCardProps) {
  const dims = extractDimensions(
    product as Parameters<typeof extractDimensions>[0]
  );
  const isInherited = dims?.fromGroup ?? false;

  const { startEdit, updateEditedData, saveChanges, cancelEdit } =
    useInlineEdit({
      productId: product.id,
      onUpdate: data => {
        void onProductUpdate(data as Partial<ProductRow>).catch(err => {
          console.error('[DimensionsWeightCard] update failed:', err);
        });
      },
    });

  const currentDims = useMemo(
    () => (product.dimensions as Record<string, number> | null) ?? {},
    [product.dimensions]
  );

  const handleDimChange = useCallback(
    (key: string, value: number | null) => {
      const updated = { ...currentDims };
      if (value != null) {
        updated[key] = value;
      } else {
        delete updated[key];
      }
      startEdit('characteristics_dimensions', { dimensions: updated });
      updateEditedData('characteristics_dimensions', { dimensions: updated });
      void saveChanges('characteristics_dimensions').then(ok => {
        if (!ok) cancelEdit('characteristics_dimensions');
      });
    },
    [currentDims, startEdit, updateEditedData, saveChanges, cancelEdit]
  );

  const handleWeightChange = useCallback(
    (value: number | null) => {
      startEdit('characteristics_dimensions', { weight: value });
      updateEditedData('characteristics_dimensions', { weight: value });
      void saveChanges('characteristics_dimensions').then(ok => {
        if (!ok) cancelEdit('characteristics_dimensions');
      });
    },
    [startEdit, updateEditedData, saveChanges, cancelEdit]
  );

  const displayLength =
    dims?.length ?? currentDims['length_cm'] ?? currentDims['length'] ?? null;
  const displayWidth =
    dims?.width ?? currentDims['width_cm'] ?? currentDims['width'] ?? null;
  const displayHeight =
    dims?.height ?? currentDims['height_cm'] ?? currentDims['height'] ?? null;
  const displayWeight = product.variant_group?.common_weight ?? product.weight;
  const weightIsInherited =
    product.variant_group?.has_common_weight === true &&
    product.variant_group?.common_weight != null;

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[10px] uppercase tracking-wide text-neutral-500 font-medium">
          Dimensions & Poids
        </h3>
        {isInherited && product.variant_group_id && (
          <a
            href={`/produits/catalogue/variantes/${product.variant_group_id}`}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-blue-200 bg-blue-50 text-[10px] text-blue-700 hover:bg-blue-100 transition-colors"
          >
            <Lock className="h-2.5 w-2.5" />
            Hérité du groupe
          </a>
        )}
      </div>

      {/* Layout : wireframe + 4 mini-cards */}
      <div className="flex items-start gap-4">
        {/* Cube wireframe */}
        <div className="flex-shrink-0">
          <CubeWireframe
            length={displayLength ?? null}
            width={displayWidth ?? null}
            height={displayHeight ?? null}
          />
        </div>

        {/* 4 mini-cards */}
        <div className="grid grid-cols-2 gap-2 flex-1 min-w-0">
          <InlineDimField
            label="Longueur (L)"
            value={displayLength ?? null}
            unit={dims?.unit ?? 'cm'}
            readOnly={isInherited}
            onChange={v => handleDimChange('length_cm', v)}
          />
          <InlineDimField
            label="Hauteur (H)"
            value={displayHeight ?? null}
            unit={dims?.unit ?? 'cm'}
            readOnly={isInherited}
            onChange={v => handleDimChange('height_cm', v)}
          />
          <InlineDimField
            label={dims?.diameter != null ? 'Diamètre (⌀)' : 'Largeur (l)'}
            value={dims?.diameter ?? displayWidth ?? null}
            unit={dims?.unit ?? 'cm'}
            readOnly={isInherited}
            onChange={v =>
              dims?.diameter != null
                ? handleDimChange('diameter_cm', v)
                : handleDimChange('width_cm', v)
            }
          />
          <InlineDimField
            label="Poids"
            value={typeof displayWeight === 'number' ? displayWeight : null}
            unit="kg"
            readOnly={weightIsInherited}
            onChange={handleWeightChange}
          />
        </div>
      </div>

      {/* Volume calculé automatiquement */}
      <VolumeDisplay
        length={displayLength ?? null}
        width={displayWidth ?? null}
        height={displayHeight ?? null}
        unit={dims?.unit ?? 'cm'}
      />

      {/* Info héritage */}
      {isInherited && product.variant_group_id && (
        <div
          className={cn(
            'mt-3 flex items-center gap-1.5 text-[10px] text-blue-600',
            'p-2 bg-blue-50 rounded border border-blue-100'
          )}
        >
          <Lock className="h-3 w-3 flex-shrink-0" />
          <span>Dimensions communes à toutes les variantes du groupe</span>
          <a
            href={`/produits/catalogue/variantes/${product.variant_group_id}`}
            className="ml-auto flex items-center gap-0.5 underline hover:text-blue-800"
          >
            Modifier dans le groupe
            <ExternalLink className="h-2.5 w-2.5" />
          </a>
        </div>
      )}
    </div>
  );
}
