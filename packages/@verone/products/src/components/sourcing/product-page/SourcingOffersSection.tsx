'use client';

import type { ComponentProps } from 'react';

import { SourcingCandidateSuppliers } from '../notebook/SourcingCandidateSuppliers';
import { SourcingPriceHistory } from '../notebook/SourcingPriceHistory';

interface SourcingOffersSectionProps {
  candidates: ComponentProps<typeof SourcingCandidateSuppliers>;
  prices: ComponentProps<typeof SourcingPriceHistory>;
}

/** Fournisseurs candidats et historique des prix négociés, côte à côte. */
export function SourcingOffersSection({
  candidates,
  prices,
}: SourcingOffersSectionProps) {
  return (
    <section aria-labelledby="sourcing-offers-title" className="space-y-3">
      <h2
        id="sourcing-offers-title"
        className="text-base font-semibold text-black"
      >
        Fournisseurs et offres
      </h2>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SourcingCandidateSuppliers {...candidates} />
        <SourcingPriceHistory {...prices} />
      </div>
    </section>
  );
}
