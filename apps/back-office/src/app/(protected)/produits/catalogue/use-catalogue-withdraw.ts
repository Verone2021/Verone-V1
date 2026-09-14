'use client';

import { useState } from 'react';

import type { Product } from '@verone/categories';

export type CatalogueWithdrawTarget =
  | { kind: 'single'; product: Product }
  | { kind: 'bulk'; ids: string[] };

interface UseCatalogueWithdrawParams {
  withdrawSingle: (product: Product, reason: string) => Promise<boolean>;
  withdrawBulk: (ids: string[], reason: string) => Promise<boolean>;
  onBulkDone: () => void;
}

/**
 * Retrait catalogue avec motif obligatoire (BO-PRODUCTS-P8-001) : garde le ou
 * les produits visés le temps que l'utilisateur saisisse le motif.
 */
export function useCatalogueWithdraw({
  withdrawSingle,
  withdrawBulk,
  onBulkDone,
}: UseCatalogueWithdrawParams) {
  const [target, setTarget] = useState<CatalogueWithdrawTarget | null>(null);

  const confirm = async (reason: string): Promise<boolean> => {
    if (!target) return false;
    if (target.kind === 'single') {
      return withdrawSingle(target.product, reason);
    }
    const ok = await withdrawBulk(target.ids, reason);
    if (ok) onBulkDone();
    return ok;
  };

  return {
    target,
    open: (next: CatalogueWithdrawTarget) => setTarget(next),
    close: () => setTarget(null),
    confirm,
  };
}
