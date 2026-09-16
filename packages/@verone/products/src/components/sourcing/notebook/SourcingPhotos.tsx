'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@verone/ui/components/ui/card';
import { cn } from '@verone/utils';
import { Camera } from 'lucide-react';

import type { SourcingPhoto } from '../../../hooks/sourcing/use-sourcing-notebook';

/** Libellés des types de photo utilisés par `sourcing_photos`. */
const PHOTO_TYPE_LABELS: Record<string, string> = {
  supplier_catalog: 'Catalogue fournisseur',
  sample_received: 'Échantillon reçu',
  sample_defect: 'Défaut constaté',
  reference: 'Référence',
};

export interface SourcingPhotosProps {
  photos: SourcingPhoto[];
  className?: string;
}

/**
 * Photos du sourcing — [BO-SOURCING-ETAPES-003]
 *
 * `sourcing_photos` était chargée par le carnet depuis avril, mais **jamais
 * affichée** : les photos du catalogue fournisseur et celles de l'échantillon
 * reçu restaient invisibles. Ce sont pourtant les pièces qui permettent de
 * juger à la Recherche et à l'Évaluation.
 */
export function SourcingPhotos({ photos, className }: SourcingPhotosProps) {
  if (photos.length === 0) return null;

  const parType = new Map<string, SourcingPhoto[]>();
  for (const photo of [...photos].sort((a, b) => a.sort_order - b.sort_order)) {
    const liste = parType.get(photo.photo_type) ?? [];
    liste.push(photo);
    parType.set(photo.photo_type, liste);
  }

  return (
    <Card className={cn('border-gray-200', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Camera className="h-4 w-4" />
          Photos du sourcing ({photos.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {[...parType.entries()].map(([type, liste]) => (
          <div key={type}>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
              {PHOTO_TYPE_LABELS[type] ?? type}
            </p>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {liste.map(photo => (
                <li key={photo.id}>
                  <figure className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                    <span className="block aspect-square w-full">
                      {photo.public_url !== null ? (
                        // Image distante non optimisée : les photos de sourcing
                        // viennent de sources variées, hors domaine configuré.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={photo.public_url}
                          alt={photo.caption ?? 'Photo de sourcing'}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center">
                          <Camera className="h-5 w-5 text-gray-300" />
                        </span>
                      )}
                    </span>
                    {photo.caption !== null && photo.caption !== '' && (
                      <figcaption
                        className="truncate px-2 py-1 text-xs text-gray-600"
                        title={photo.caption}
                      >
                        {photo.caption}
                      </figcaption>
                    )}
                  </figure>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
