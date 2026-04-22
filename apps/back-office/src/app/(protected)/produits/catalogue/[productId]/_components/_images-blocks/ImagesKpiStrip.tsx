'use client';

/**
 * ImagesKpiStrip — 4 tuiles KPI pour l'onglet Images.
 * Tuile 1 : NOMBRE D'IMAGES (hero indigo)
 * Tuile 2 : TAILLE TOTALE
 * Tuile 3 : FORMATS dominants
 * Tuile 4 : OPTIMISATION
 *
 * Sprint : BO-UI-PROD-IMG-001
 */

import type { Database } from '@verone/types';
import { cn } from '@verone/utils';

import { formatFileSize } from './utils';

type ProductImage = Database['public']['Tables']['product_images']['Row'];

interface ImagesKpiStripProps {
  images: ProductImage[];
}

function groupByFormat(images: ProductImage[]): Record<string, number> {
  const groups: Record<string, number> = {};
  for (const img of images) {
    const fmt = (img.format ?? 'inconnu').toUpperCase();
    groups[fmt] = (groups[fmt] ?? 0) + 1;
  }
  return groups;
}

function formatGroupLabel(groups: Record<string, number>): string {
  const entries = Object.entries(groups).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return '—';
  return entries.map(([fmt, count]) => `${count} ${fmt}`).join(' / ');
}

export function ImagesKpiStrip({ images }: ImagesKpiStripProps) {
  const primaryCount = images.filter(i => i.is_primary).length;
  const galleryCount = images.filter(i => !i.is_primary).length;

  const totalFileSize = images.reduce((sum, i) => sum + (i.file_size ?? 0), 0);
  const avgFileSize =
    images.length > 0 ? Math.round(totalFileSize / images.length) : 0;

  const formatGroups = groupByFormat(images);
  const formatLabel = formatGroupLabel(formatGroups);
  const dominantFormat =
    Object.entries(formatGroups).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';

  const optimizationOk =
    images.length > 0 &&
    images.every(
      i =>
        (i.file_size ?? 0) < 500_000 &&
        (i.width ?? 0) >= 800 &&
        (i.height ?? 0) >= 800
    );

  const hasImages = images.length > 0;

  return (
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Tuile 1 — NOMBRE D'IMAGES (hero indigo) */}
      <div className="rounded-lg border-2 border-indigo-500 bg-indigo-50/30 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
          NOMBRE D&apos;IMAGES
        </p>
        <p className="text-3xl font-bold tabular-nums text-indigo-700 mt-1">
          {images.length}
        </p>
        <p className="text-[11px] text-neutral-500 mt-1">
          {primaryCount} principale&nbsp;·&nbsp;{galleryCount} galerie
        </p>
        <div className="mt-2">
          {hasImages ? (
            <span className="rounded px-1.5 py-0.5 text-[10px] border bg-green-50 text-green-700 border-green-200 font-medium">
              OK
            </span>
          ) : (
            <span className="rounded px-1.5 py-0.5 text-[10px] border bg-red-50 text-red-700 border-red-200 font-medium">
              Aucune image
            </span>
          )}
        </div>
      </div>

      {/* Tuile 2 — TAILLE TOTALE */}
      <div className="bg-white rounded-lg border border-neutral-200 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
          TAILLE TOTALE
        </p>
        <p className="text-2xl font-semibold tabular-nums text-neutral-900 mt-1">
          {totalFileSize > 0 ? formatFileSize(totalFileSize) : '—'}
        </p>
        <p className="text-[11px] text-neutral-500 mt-1">
          {avgFileSize > 0
            ? `moyenne ${formatFileSize(avgFileSize)} par image`
            : 'Aucune donnée'}
        </p>
      </div>

      {/* Tuile 3 — FORMATS */}
      <div className="bg-white rounded-lg border border-neutral-200 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
          FORMATS
        </p>
        <p className="text-2xl font-semibold tabular-nums text-neutral-900 mt-1">
          {dominantFormat}
        </p>
        <p className="text-[11px] text-neutral-500 mt-1">
          {images.length > 0 ? formatLabel : 'Aucune image'}
        </p>
      </div>

      {/* Tuile 4 — OPTIMISATION */}
      <div className="bg-white rounded-lg border border-neutral-200 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
          OPTIMISATION
        </p>
        <p
          className={cn(
            'text-2xl font-semibold mt-1',
            images.length === 0
              ? 'text-neutral-400'
              : optimizationOk
                ? 'text-green-700'
                : 'text-amber-600'
          )}
        >
          {images.length === 0 ? '—' : optimizationOk ? 'OK' : 'À revoir'}
        </p>
        <p className="text-[11px] text-neutral-500 mt-1">
          {images.length === 0
            ? 'Aucune image à évaluer'
            : optimizationOk
              ? '< 500 KB et ≥ 800×800 px'
              : 'Certaines images dépassent 500 KB'}
        </p>
        <div className="mt-2">
          {images.length > 0 &&
            (optimizationOk ? (
              <span className="rounded px-1.5 py-0.5 text-[10px] border bg-green-50 text-green-700 border-green-200 font-medium">
                OK
              </span>
            ) : (
              <span className="rounded px-1.5 py-0.5 text-[10px] border bg-amber-50 text-amber-700 border-amber-200 font-medium">
                À optimiser
              </span>
            ))}
        </div>
      </div>
    </section>
  );
}
