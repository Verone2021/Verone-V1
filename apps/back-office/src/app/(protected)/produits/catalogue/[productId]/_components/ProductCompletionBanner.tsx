'use client';

/**
 * ProductCompletionBanner — banner conditionnel en tête de fiche produit.
 *
 * Logique d'affichage basée sur les valeurs réelles (audit DB 2026-04-28) :
 *   - completion_status = 'draft' → banner orange (brouillon)
 *   - completion_status = 'rejected' + rejection_reason → banner rouge
 *   - completion_status = 'active' ou null → pas de banner (état normal)
 *
 * Valeurs observées en DB : 'draft' (230 produits), 'active' (2 produits).
 * Pas d'édition depuis ce banner — affichage uniquement.
 */

import { AlertTriangle, XCircle } from 'lucide-react';

interface ProductCompletionBannerProps {
  completionStatus: string | null;
  rejectionReason: string | null;
}

export function ProductCompletionBanner({
  completionStatus,
  rejectionReason,
}: ProductCompletionBannerProps) {
  // États normaux — pas de banner
  if (
    completionStatus === null ||
    completionStatus === 'active' ||
    completionStatus === 'complete'
  ) {
    return null;
  }

  // Banner rouge — fiche rejetée
  if (completionStatus === 'rejected' && rejectionReason) {
    return (
      <div
        role="alert"
        className="flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 px-4 py-3 mx-4 mt-4"
      >
        <XCircle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-red-800">Fiche rejetée</p>
          <p className="mt-0.5 text-sm text-red-700 break-words">
            {rejectionReason}
          </p>
        </div>
      </div>
    );
  }

  // Banner orange — brouillon ou autre statut non-final
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-lg border border-orange-300 bg-orange-50 px-4 py-3 mx-4 mt-4"
    >
      <AlertTriangle className="h-5 w-5 shrink-0 text-orange-500 mt-0.5" />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-orange-800">
          Fiche en brouillon
        </p>
        <p className="mt-0.5 text-sm text-orange-700">
          Complétez la fiche produit pour la valider et l&apos;activer sur les
          canaux de vente.
        </p>
      </div>
    </div>
  );
}
