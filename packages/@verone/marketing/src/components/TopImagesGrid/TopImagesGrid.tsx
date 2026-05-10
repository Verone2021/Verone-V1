'use client';

import Image from 'next/image';
import Link from 'next/link';

import { Eye, ImageIcon, MousePointerClick, ShoppingCart } from 'lucide-react';

import { cn } from '@verone/utils';

import type { TopImageRow } from '../../hooks/use-top-images';

interface TopImagesGridProps {
  images: TopImageRow[];
  loading: boolean;
  className?: string;
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n);
}

export function TopImagesGrid({
  images,
  loading,
  className,
}: TopImagesGridProps) {
  if (loading) {
    return (
      <div
        className={cn(
          'rounded-lg border border-gray-200 bg-white p-8 text-center',
          className
        )}
      >
        <p className="text-sm text-gray-400">Chargement…</p>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div
        className={cn(
          'rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center',
          className
        )}
      >
        <ImageIcon className="mx-auto h-12 w-12 text-gray-300" />
        <h3 className="mt-3 text-sm font-medium text-gray-900">
          Pas encore de données pour les images
        </h3>
        <p className="mt-2 text-xs text-gray-500">
          Les performances par image apparaîtront ici une fois la
          synchronisation Meta Insights activée (Edge Function
          <code className="mx-1 rounded bg-gray-100 px-1 py-0.5 text-[10px]">
            sync-meta-image-insights
          </code>
          ).
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
        className
      )}
    >
      {images.map((img, i) => (
        <div
          key={img.asset_id}
          className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white"
        >
          <div className="absolute left-2 top-2 z-10 rounded-md bg-black/70 px-2 py-0.5 text-xs font-semibold text-white">
            #{i + 1}
          </div>
          {img.product_id ? (
            <Link
              href={`/produits/catalogue/detail/${img.product_id}`}
              className="block aspect-square w-full"
            >
              <Image
                src={img.public_url}
                alt={img.alt_text ?? img.filename}
                width={300}
                height={300}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
            </Link>
          ) : (
            <div className="block aspect-square w-full">
              <Image
                src={img.public_url}
                alt={img.alt_text ?? img.filename}
                width={300}
                height={300}
                className="h-full w-full object-cover"
              />
            </div>
          )}

          <div className="space-y-1 p-2 text-xs">
            <div className="flex items-center justify-between text-gray-600">
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {formatNumber(img.total_impressions)}
              </span>
              <span className="flex items-center gap-1">
                <MousePointerClick className="h-3 w-3" />
                {formatNumber(img.total_clicks)}
              </span>
              <span className="flex items-center gap-1">
                <ShoppingCart className="h-3 w-3" />
                {formatNumber(img.total_conversions)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-400">CTR {img.ctr}%</span>
              {img.total_saves > 0 && (
                <span className="text-[10px] text-rose-600">
                  {formatNumber(img.total_saves)} saves
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
