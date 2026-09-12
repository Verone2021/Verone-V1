'use client';

import { X } from 'lucide-react';

// ── Helpers locaux ─────────────────────────────────────────────────
const fmt = (p: number | null) => (p === null ? 'À fixer' : `${p.toFixed(2)}€`);

interface ConsultationSampleCellProps {
  itemId: string;
  isSample: boolean;
  isFree: boolean;
  unitPrice: number | null;
  onSampleChange: (itemId: string, priceStr: string) => void;
}

/**
 * Cellule « Échantillon » du tableau consultation.
 * Affiche l'état échantillon + badge prix, ou le bouton de création.
 *
 * Bouton explicite (prompt) pour éviter toute bascule accidentelle.
 * Avant : input vide confondu avec un prix de vente, un clic + tape "0" ou
 * chiffre par erreur basculait l'item en sample/free et l'excluait du devis
 * (incident 2026-04-27).
 */
export function ConsultationSampleCell({
  itemId,
  isSample,
  isFree,
  unitPrice,
  onSampleChange,
}: ConsultationSampleCellProps) {
  return (
    <td className="px-3 py-0 h-10">
      {isSample && isFree ? (
        <div className="flex items-center gap-1">
          <span className="px-1.5 py-0.5 bg-emerald-500 text-white text-[9px] font-bold uppercase tracking-wider rounded shadow-sm">
            Gratuit
          </span>
          <button
            type="button"
            onClick={() => onSampleChange(itemId, '')}
            className="h-4 w-4 flex items-center justify-center rounded text-zinc-300 hover:text-zinc-600 hover:bg-zinc-100"
            aria-label="Retirer échantillon"
            title="Retirer l'échantillon"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </div>
      ) : isSample ? (
        <div className="flex items-center gap-1">
          <span className="px-1.5 py-0.5 bg-amber-500 text-white text-[9px] font-bold uppercase tracking-wider rounded shadow-sm">
            {fmt(unitPrice)}
          </span>
          <button
            type="button"
            onClick={() => onSampleChange(itemId, '')}
            className="h-4 w-4 flex items-center justify-center rounded text-zinc-300 hover:text-zinc-600 hover:bg-zinc-100"
            aria-label="Retirer échantillon"
            title="Retirer l'échantillon"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            const value = window.prompt(
              "Prix de l'échantillon en € (0 = gratuit, laisser vide = annuler) :",
              ''
            );
            if (value === null) return;
            const trimmed = value.trim();
            if (trimmed === '') return;
            const parsed = parseFloat(trimmed);
            if (Number.isNaN(parsed) || parsed < 0) return;
            onSampleChange(itemId, String(parsed));
          }}
          className="px-2 h-5 flex items-center rounded border border-dashed border-zinc-300 hover:border-emerald-500 hover:bg-emerald-50 text-[9px] font-bold uppercase tracking-wider text-zinc-400 hover:text-emerald-600"
          aria-label="Marquer comme échantillon"
          title="Marquer comme échantillon (saisie explicite)"
        >
          + Échantillon
        </button>
      )}
    </td>
  );
}
