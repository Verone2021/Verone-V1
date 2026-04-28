'use client';

/**
 * SupplierPoCompactCard — col 2 du dashboard. Affiche le fournisseur unique
 * du produit + la dernière PO reçue (ref, date, montant, statut).
 */

import Link from 'next/link';

import { Badge } from '@verone/ui';
import { formatPrice } from '@verone/utils';
import { Building2, ExternalLink, Info } from 'lucide-react';

interface LastPo {
  id: string;
  reference: string | null;
  purchasedAt: string | null;
  total: number | null;
  status: string | null;
}

interface SupplierPoCompactCardProps {
  supplierId: string | null;
  supplierName: string | null;
  supplierSiret: string | null;
  lastPo: LastPo | null;
}

export function SupplierPoCompactCard({
  supplierId,
  supplierName,
  supplierSiret,
  lastPo,
}: SupplierPoCompactCardProps) {
  return (
    <section className="bg-white rounded-lg border border-neutral-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-neutral-900">
          Fournisseur · Dernière PO
        </h3>
        <span
          className="text-[10px] text-neutral-400 inline-flex items-center gap-1"
          title="1 produit = 1 fournisseur unique"
        >
          <Info className="h-3 w-3" />1 · 1
        </span>
      </div>

      {supplierId ? (
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded bg-neutral-100 flex items-center justify-center shrink-0">
            <Building2 className="h-5 w-5 text-neutral-400" />
          </div>
          <div className="min-w-0 flex-1">
            <Link
              href={`/contacts-organisations/suppliers/${supplierId}`}
              className="text-sm font-medium text-neutral-900 hover:underline truncate block"
            >
              {supplierName ?? 'Fournisseur inconnu'}
            </Link>
            {supplierSiret && (
              <p className="text-[11px] text-neutral-500 font-mono">
                SIRET {supplierSiret}
              </p>
            )}
          </div>
        </div>
      ) : (
        <p className="text-sm text-neutral-400 italic">
          Aucun fournisseur assigné
        </p>
      )}

      {lastPo && (
        <div className="mt-3 pt-3 border-t border-neutral-100 space-y-1.5 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-neutral-500 text-xs">Ref PO</span>
            <span className="font-mono text-xs text-neutral-900">
              {lastPo.reference ?? '—'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-500 text-xs">Date</span>
            <span className="text-xs text-neutral-900 tabular-nums">
              {lastPo.purchasedAt
                ? new Date(lastPo.purchasedAt).toLocaleDateString('fr-FR')
                : '—'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-500 text-xs">Montant</span>
            <span className="text-xs text-neutral-900 font-semibold tabular-nums">
              {lastPo.total != null ? formatPrice(lastPo.total) : '—'}
            </span>
          </div>
          {lastPo.status && (
            <div className="flex items-center justify-between">
              <span className="text-neutral-500 text-xs">Statut</span>
              <Badge variant="outline" className="text-[10px]">
                {lastPo.status}
              </Badge>
            </div>
          )}
        </div>
      )}

      {supplierId && (
        <Link
          href={`/contacts-organisations/suppliers/${supplierId}`}
          className="mt-3 text-xs text-neutral-600 underline hover:text-neutral-900 inline-flex items-center gap-1"
        >
          Voir la fiche fournisseur
          <ExternalLink className="h-3 w-3" />
        </Link>
      )}
    </section>
  );
}
