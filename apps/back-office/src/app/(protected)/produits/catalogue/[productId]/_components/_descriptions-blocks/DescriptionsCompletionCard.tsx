'use client';

/**
 * DescriptionsCompletionCard — jauge de complétude des champs descriptions.
 * Affiche un ring SVG X/5 champs remplis + status list + actions stub/lien.
 */

import Link from 'next/link';

import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

import type { Product } from '../types';

interface DescriptionsCompletionCardProps {
  product: Product;
}

interface FieldStatus {
  label: string;
  filled: boolean;
  warning?: boolean;
  detail: string;
}

function countWords(text: string | null | undefined): number {
  if (!text || text.trim() === '') return 0;
  return text.trim().split(/\s+/).length;
}

function buildFieldStatuses(product: Product): FieldStatus[] {
  const descWords = countWords(product.description);
  const techWords = countWords(product.technical_description);
  const spCount = (product.selling_points as string[] | null)?.length ?? 0;
  const metaTitleLen = product.meta_title?.length ?? 0;
  const metaDescLen = product.meta_description?.length ?? 0;

  return [
    {
      label: 'Description générale',
      filled: descWords > 0,
      detail: descWords > 0 ? `${descWords} mots` : 'Vide',
    },
    {
      label: 'Description technique',
      filled: techWords > 0,
      detail: techWords > 0 ? `${techWords} mots` : 'Vide',
    },
    {
      label: 'Points de vente',
      filled: spCount > 0,
      detail:
        spCount > 0 ? `${spCount} point${spCount > 1 ? 's' : ''}` : 'Vide',
    },
    {
      label: 'Meta titre SEO',
      filled: metaTitleLen > 0,
      warning: metaTitleLen === 0,
      detail: metaTitleLen > 0 ? `${metaTitleLen} car.` : 'Absent',
    },
    {
      label: 'Meta description SEO',
      filled: metaDescLen > 0,
      detail: metaDescLen > 0 ? `${metaDescLen} car.` : 'Vide',
    },
  ];
}

const TOTAL_FIELDS = 5;

export function DescriptionsCompletionCard({
  product,
}: DescriptionsCompletionCardProps) {
  const fields = buildFieldStatuses(product);
  const filledCount = fields.filter(f => f.filled).length;

  const radius = 15;
  const circumference = 2 * Math.PI * radius; // ≈ 94.25
  const strokeDash = (filledCount / TOTAL_FIELDS) * circumference;
  const isComplete = filledCount === TOTAL_FIELDS;
  const ringColor = isComplete
    ? '#16a34a'
    : filledCount >= 3
      ? '#f97316'
      : '#e11d48';

  const siteUrl = product.slug
    ? `https://veronecollections.fr/produits/${product.slug}`
    : null;

  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-5">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        {/* Ring SVG */}
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <div className="relative w-14 h-14">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle
                cx="18"
                cy="18"
                r={radius}
                fill="none"
                stroke="#E5E7EB"
                strokeWidth="3"
              />
              <circle
                cx="18"
                cy="18"
                r={radius}
                fill="none"
                stroke={ringColor}
                strokeWidth="3"
                strokeDasharray={`${strokeDash} ${circumference}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-sm font-bold tabular-nums leading-none">
                {filledCount}
              </span>
              <span className="text-[9px] text-neutral-400 leading-none">
                /{TOTAL_FIELDS}
              </span>
            </div>
          </div>
          <span className="text-[10px] text-neutral-500 font-medium uppercase tracking-wide">
            Complétude
          </span>
        </div>

        {/* Status list */}
        <ul className="flex-1 space-y-1.5 min-w-0">
          {fields.map(field => (
            <li key={field.label} className="flex items-center gap-2 text-xs">
              {field.filled ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
              ) : field.warning ? (
                <AlertCircle className="h-3.5 w-3.5 text-orange-400 flex-shrink-0" />
              ) : (
                <XCircle className="h-3.5 w-3.5 text-neutral-300 flex-shrink-0" />
              )}
              <span
                className={
                  field.filled ? 'text-neutral-700' : 'text-neutral-400'
                }
              >
                {field.label}
              </span>
              <span
                className={`ml-auto font-mono text-[10px] ${field.filled ? 'text-neutral-500' : 'text-neutral-300'}`}
              >
                {field.detail}
              </span>
            </li>
          ))}
        </ul>

        {/* Actions */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          <button
            type="button"
            disabled
            title="Bientôt disponible"
            className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-neutral-200 bg-neutral-50 text-xs text-neutral-400 cursor-not-allowed h-11 md:h-9"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Générer par IA
          </button>
          {siteUrl ? (
            <Link
              href={siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-neutral-200 bg-white text-xs text-neutral-600 hover:bg-neutral-50 transition-colors h-11 md:h-9"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Aperçu site
            </Link>
          ) : (
            <button
              type="button"
              disabled
              title="Slug produit manquant"
              className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-neutral-200 bg-neutral-50 text-xs text-neutral-400 cursor-not-allowed h-11 md:h-9"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Aperçu site
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
