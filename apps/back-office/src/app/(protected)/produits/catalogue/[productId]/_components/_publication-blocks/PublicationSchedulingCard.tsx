'use client';

/**
 * PublicationSchedulingCard — section Planification dans l'onglet Publication.
 *
 * Champs : publication_date + unpublication_date (timestamps nullable).
 * Pas de logique métier (pas de cron). Juste lecture/écriture.
 * Validation : unpublication_date doit être > publication_date si les deux sont renseignées.
 */

import { useState, useCallback } from 'react';

import { Label } from '@verone/ui';
import { CalendarClock } from 'lucide-react';

import type { ProductRow } from '../types';

interface PublicationSchedulingCardProps {
  publicationDate: string | null;
  unpublicationDate: string | null;
  onProductUpdate: (updates: Partial<ProductRow>) => Promise<void>;
}

/**
 * Convertit un timestamp ISO en valeur compatible avec input[type=date] (YYYY-MM-DD).
 */
function isoToDateInput(iso: string | null): string {
  if (!iso) return '';
  // Prend les 10 premiers caractères : "2026-04-28"
  return iso.slice(0, 10);
}

/**
 * Convertit une valeur input date (YYYY-MM-DD) en timestamp ISO (fin de journée UTC).
 * Retourne null si vide.
 */
function dateInputToIso(value: string): string | null {
  if (!value) return null;
  // On stocke en début de journée UTC pour la cohérence
  return `${value}T00:00:00.000Z`;
}

export function PublicationSchedulingCard({
  publicationDate,
  unpublicationDate,
  onProductUpdate,
}: PublicationSchedulingCardProps) {
  const [pubError, setPubError] = useState<string | null>(null);

  const handlePublicationDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      const iso = dateInputToIso(value);

      // Validation : unpub > pub si les deux renseignés
      if (iso && unpublicationDate) {
        if (new Date(iso) >= new Date(unpublicationDate)) {
          setPubError(
            'La date de publication doit être antérieure à la date de dépublication.'
          );
          return;
        }
      }
      setPubError(null);

      void onProductUpdate({ publication_date: iso }).catch(err => {
        console.error('[PublicationSchedulingCard] save pub_date failed:', err);
      });
    },
    [onProductUpdate, unpublicationDate]
  );

  const handleUnpublicationDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      const iso = dateInputToIso(value);

      // Validation : unpub > pub si les deux renseignés
      if (iso && publicationDate) {
        if (new Date(iso) <= new Date(publicationDate)) {
          setPubError(
            'La date de dépublication doit être postérieure à la date de publication.'
          );
          return;
        }
      }
      setPubError(null);

      void onProductUpdate({ unpublication_date: iso }).catch(err => {
        console.error(
          '[PublicationSchedulingCard] save unpub_date failed:',
          err
        );
      });
    },
    [onProductUpdate, publicationDate]
  );

  return (
    <section className="bg-white rounded-lg border border-neutral-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <CalendarClock className="h-4 w-4 text-neutral-400" />
        <h3 className="text-sm font-semibold text-neutral-900">
          Planification
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Date de publication */}
        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor="publication-date"
            className="text-xs text-neutral-600 font-normal"
          >
            Date de publication
          </Label>
          <input
            id="publication-date"
            type="date"
            defaultValue={isoToDateInput(publicationDate)}
            onChange={handlePublicationDateChange}
            className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          />
        </div>

        {/* Date de dépublication */}
        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor="unpublication-date"
            className="text-xs text-neutral-600 font-normal"
          >
            Date de dépublication
          </Label>
          <input
            id="unpublication-date"
            type="date"
            defaultValue={isoToDateInput(unpublicationDate)}
            onChange={handleUnpublicationDateChange}
            className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          />
        </div>
      </div>

      {pubError && (
        <p className="mt-2 text-xs text-red-600" role="alert">
          {pubError}
        </p>
      )}

      <p className="mt-3 text-xs text-neutral-400">
        Dates indicatives uniquement — aucun changement automatique de statut.
      </p>
    </section>
  );
}
