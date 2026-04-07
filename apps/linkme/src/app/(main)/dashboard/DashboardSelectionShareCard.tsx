'use client';

import { useState } from 'react';

import Image from 'next/image';

import { Star, ExternalLink, Copy, Check } from 'lucide-react';

type SelectionShareCardProps = {
  selection: {
    id: string;
    name: string;
    slug: string;
    image_url: string | null;
    products_count: number;
  };
};

/**
 * Carte de sélection publiée avec liens de partage — dashboard collaborateur
 */
export function DashboardSelectionShareCard({
  selection,
}: SelectionShareCardProps): JSX.Element {
  const [copied, setCopied] = useState(false);

  const publicUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/s/${selection.slug}`;

  const handleCopyLink = (): void => {
    void navigator.clipboard
      .writeText(publicUrl)
      .then(() => {
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
        }, 2000);
      })
      .catch((error: unknown) => {
        console.error('[SelectionShareCard] Copy failed:', error);
      });
  };

  const handleOpen = (): void => {
    window.open(`/s/${selection.slug}`, '_blank');
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* Image */}
      <div className="h-32 bg-gray-100 relative">
        {selection.image_url ? (
          <Image
            src={selection.image_url}
            alt={selection.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Star className="h-8 w-8 text-gray-300" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-linkme-marine text-sm truncate">
          {selection.name}
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          {selection.products_count} produit
          {selection.products_count > 1 ? 's' : ''}
        </p>

        {/* Actions */}
        <div className="flex gap-2 mt-3">
          <button
            type="button"
            onClick={handleOpen}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-linkme-turquoise text-white rounded-lg text-xs font-medium hover:bg-linkme-turquoise/90 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Ouvrir
          </button>
          <button
            type="button"
            onClick={handleCopyLink}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 border rounded-lg text-xs font-medium transition-colors ${
              copied
                ? 'border-green-300 bg-green-50 text-green-600'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {copied ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
