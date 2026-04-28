'use client';

/**
 * SourcingBlock — affichage des champs sourcing d'un produit.
 *
 * Rendu uniquement si consultation_id est non-null.
 * Pas d'édition dans ce sprint — lecture seule.
 *
 * Sprint : BO-UI-PROD-DETAIL-001
 */

import Link from 'next/link';

import { Badge } from '@verone/ui';
import { formatPrice } from '@verone/utils';
import { Compass } from 'lucide-react';

import type { ProductRow } from '../types';

interface SourcingBlockProps {
  product: Pick<
    ProductRow,
    | 'consultation_id'
    | 'sourcing_channel'
    | 'sourcing_status'
    | 'sourcing_priority'
    | 'target_price'
    | 'sourcing_tags'
    | 'sourcing_notes'
  >;
}

type SourcingStatus =
  | 'need_identified'
  | 'in_progress'
  | 'validated'
  | 'archived';
type SourcingPriority = 'low' | 'medium' | 'high' | 'urgent';

const STATUS_LABELS: Record<SourcingStatus, string> = {
  need_identified: 'Besoin identifié',
  in_progress: 'En cours',
  validated: 'Validé',
  archived: 'Archivé',
};

const STATUS_CLASSES: Record<SourcingStatus, string> = {
  need_identified: 'bg-neutral-100 text-neutral-600 border-neutral-200',
  in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
  validated: 'bg-green-50 text-green-700 border-green-200',
  archived: 'bg-zinc-100 text-zinc-500 border-zinc-200',
};

const PRIORITY_LABELS: Record<SourcingPriority, string> = {
  low: 'Basse',
  medium: 'Moyenne',
  high: 'Haute',
  urgent: 'Urgente',
};

const PRIORITY_CLASSES: Record<SourcingPriority, string> = {
  low: 'bg-neutral-100 text-neutral-500 border-neutral-200',
  medium: 'bg-blue-50 text-blue-600 border-blue-200',
  high: 'bg-orange-50 text-orange-600 border-orange-200',
  urgent: 'bg-red-50 text-red-600 border-red-200',
};

function isSourcingStatus(value: string | null): value is SourcingStatus {
  return (
    value === 'need_identified' ||
    value === 'in_progress' ||
    value === 'validated' ||
    value === 'archived'
  );
}

function isSourcingPriority(value: string | null): value is SourcingPriority {
  return (
    value === 'low' ||
    value === 'medium' ||
    value === 'high' ||
    value === 'urgent'
  );
}

export function SourcingBlock({ product }: SourcingBlockProps) {
  if (!product.consultation_id) return null;

  const status = isSourcingStatus(product.sourcing_status)
    ? product.sourcing_status
    : null;

  const priority = isSourcingPriority(product.sourcing_priority)
    ? product.sourcing_priority
    : null;

  const tags = Array.isArray(product.sourcing_tags)
    ? product.sourcing_tags
    : [];

  return (
    <section className="bg-white rounded-lg border border-neutral-200 p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Compass className="h-4 w-4 text-neutral-500 shrink-0" />
        <h3 className="text-sm font-semibold text-neutral-900">Sourcing</h3>
      </div>

      {/* Grille 2 colonnes md: */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
        {/* Consultation source */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-neutral-500 text-xs shrink-0">
            Consultation source
          </span>
          <Link
            href={`/consultations/${product.consultation_id}`}
            className="text-xs text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1 truncate max-w-[140px]"
            title="Voir la consultation"
          >
            <Compass className="h-3 w-3 flex-shrink-0" />
            Voir la consultation
          </Link>
        </div>

        {/* Canal sourcing */}
        {product.sourcing_channel && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-neutral-500 text-xs shrink-0">
              Canal sourcing
            </span>
            <Badge variant="outline" className="text-[10px] capitalize">
              {product.sourcing_channel}
            </Badge>
          </div>
        )}

        {/* Statut sourcing */}
        {status && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-neutral-500 text-xs shrink-0">
              Statut sourcing
            </span>
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${STATUS_CLASSES[status]}`}
            >
              {STATUS_LABELS[status]}
            </span>
          </div>
        )}

        {/* Priorité */}
        {priority && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-neutral-500 text-xs shrink-0">Priorité</span>
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${PRIORITY_CLASSES[priority]}`}
            >
              {PRIORITY_LABELS[priority]}
            </span>
          </div>
        )}

        {/* Prix cible */}
        {product.target_price != null && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-neutral-500 text-xs shrink-0">
              Prix cible
            </span>
            <span className="text-xs text-neutral-900 font-semibold tabular-nums">
              {formatPrice(Number(product.target_price))}
            </span>
          </div>
        )}
      </div>

      {/* Tags sourcing */}
      {tags.length > 0 && (
        <div className="mt-3 pt-3 border-t border-neutral-100">
          <span className="text-neutral-500 text-xs block mb-1.5">
            Tags sourcing
          </span>
          <div className="flex flex-wrap gap-1">
            {tags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] text-neutral-600 border border-neutral-200"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Notes sourcing */}
      {product.sourcing_notes && (
        <div className="mt-3 pt-3 border-t border-neutral-100">
          <span className="text-neutral-500 text-xs block mb-1">
            Notes sourcing
          </span>
          <p className="text-xs text-neutral-700 whitespace-pre-line leading-relaxed">
            {product.sourcing_notes}
          </p>
        </div>
      )}

      {/* Footer — lien consultation */}
      <div className="mt-3 pt-3 border-t border-neutral-100">
        <Link
          href={`/consultations/${product.consultation_id}`}
          className="text-xs text-neutral-600 underline hover:text-neutral-900 inline-flex items-center gap-1"
        >
          <Compass className="h-3 w-3" />
          Voir la consultation complète
        </Link>
      </div>
    </section>
  );
}
