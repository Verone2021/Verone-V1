'use client';

import { useState } from 'react';

import { ButtonV2 } from '@verone/ui/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@verone/ui/components/ui/card';
import { ResponsiveDataView } from '@verone/ui/components/ui/responsive-data-view';
import { cn } from '@verone/utils';
import { Check, Plus, Users } from 'lucide-react';

import type { SourcingCandidateSupplier } from '../../../hooks/sourcing/use-sourcing-notebook';
import type { OfferStatus } from '../../../utils/sourcing-offer-cost';
import {
  euros,
  OfferCard,
  OfferRow,
  type OfferLine,
} from './SourcingOfferLines';

const HEADER = 'p-2 text-xs font-medium uppercase tracking-wider text-gray-500';

export interface SourcingOffersComparisonProps {
  /**
   * Offres déjà passées par `compareOffers` : le calcul se fait une seule fois,
   * chez le parent qui en a aussi besoin pour le prix cible.
   */
  comparison: OfferLine[];
  /** Prix d'achat visé : sert de repère à chaque offre. */
  targetPrice: number | null;
  /** Fournisseur actuellement lié au produit. */
  currentSupplierId: string | null;
  busy?: boolean;
  adoptingId?: string | null;
  onAdd: () => void;
  onEdit: (offer: SourcingCandidateSupplier) => void;
  onUpdateStatus: (offerId: string, status: OfferStatus) => void;
  onUpdateStatuses: (offerIds: string[], status: OfferStatus) => void;
  onAdopt: (offerId: string) => void;
}

/**
 * Comparatif des offres fournisseurs — [BO-SOURCING-OFFRES-004]
 *
 * Le cœur des étapes Évaluation et Négociation : les offres côte à côte, au
 * **coût rendu** (prix + éco-participation + transport et douane ramenés à
 * l'unité) et non au prix départ usine. Retenir une offre remplit le
 * fournisseur et le prix d'achat du produit d'un seul clic.
 */
export function SourcingOffersComparison({
  comparison,
  targetPrice,
  currentSupplierId,
  busy = false,
  adoptingId = null,
  onAdd,
  onEdit,
  onUpdateStatus,
  onUpdateStatuses,
  onAdopt,
}: SourcingOffersComparisonProps) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) =>
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );

  const aContacter = comparison.filter(
    c => c.offer.status === 'identified'
  ).length;

  return (
    <Card className="border-gray-200">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Users className="h-4 w-4" />
            Offres fournisseurs ({comparison.length})
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            {selected.length > 0 && (
              <ButtonV2
                variant="outline"
                size="sm"
                icon={Check}
                disabled={busy}
                onClick={() => {
                  onUpdateStatuses(selected, 'contacted');
                  setSelected([]);
                }}
                className="h-11 md:h-9"
              >
                Marquer contactés ({selected.length})
              </ButtonV2>
            )}
            <ButtonV2
              variant="outline"
              size="sm"
              icon={Plus}
              onClick={onAdd}
              disabled={busy}
              className="h-11 md:h-9"
            >
              Ajouter
            </ButtonV2>
          </div>
        </div>
        {targetPrice !== null && (
          <p className="text-xs text-gray-500">
            Prix cible : {euros(targetPrice)} — l’écart est calculé sur le coût
            rendu, pas sur le prix annoncé.
          </p>
        )}
        {aContacter > 0 && (
          <p className="text-xs text-gray-500">
            {aContacter} fournisseur{aContacter > 1 ? 's' : ''} pas encore
            contacté{aContacter > 1 ? 's' : ''}.
          </p>
        )}
      </CardHeader>

      <CardContent className="p-0 md:px-4 md:pb-4">
        <ResponsiveDataView
          data={comparison}
          emptyMessage={
            <p className="px-4 py-6 text-center text-sm text-gray-500">
              Aucune offre. Ajoutez les fournisseurs à consulter pour les
              comparer au coût rendu.
            </p>
          }
          renderTable={items => (
            <div className="w-full overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-gray-50/80">
                  <tr className="text-left">
                    <th className={cn(HEADER, 'w-[44px]')} />
                    <th className={cn(HEADER, 'min-w-[160px]')}>Fournisseur</th>
                    <th className={cn(HEADER, 'w-[110px]')}>Statut</th>
                    <th className={cn(HEADER, 'w-[90px] text-right')}>Prix</th>
                    <th
                      className={cn(
                        HEADER,
                        'hidden w-[70px] text-right lg:table-cell'
                      )}
                    >
                      MOQ
                    </th>
                    <th
                      className={cn(
                        HEADER,
                        'hidden w-[80px] text-right xl:table-cell'
                      )}
                    >
                      Délai
                    </th>
                    <th
                      className={cn(
                        HEADER,
                        'hidden w-[90px] text-right lg:table-cell'
                      )}
                    >
                      Frais/u
                    </th>
                    <th className={cn(HEADER, 'w-[110px] text-right')}>
                      Coût rendu
                    </th>
                    <th
                      className={cn(
                        HEADER,
                        'hidden w-[90px] text-right xl:table-cell'
                      )}
                    >
                      Écart cible
                    </th>
                    <th className={cn(HEADER, 'w-[120px] text-right')}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <OfferRow
                      key={item.offer.id}
                      item={item}
                      selected={selected.includes(item.offer.id)}
                      onToggle={() => toggle(item.offer.id)}
                      isCurrentSupplier={
                        item.offer.supplier_id === currentSupplierId
                      }
                      busy={busy}
                      adopting={adoptingId === item.offer.id}
                      onEdit={onEdit}
                      onUpdateStatus={onUpdateStatus}
                      onAdopt={onAdopt}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
          renderCard={item => (
            <OfferCard
              item={item}
              selected={selected.includes(item.offer.id)}
              onToggle={() => toggle(item.offer.id)}
              isCurrentSupplier={item.offer.supplier_id === currentSupplierId}
              busy={busy}
              adopting={adoptingId === item.offer.id}
              onEdit={onEdit}
              onUpdateStatus={onUpdateStatus}
              onAdopt={onAdopt}
            />
          )}
        />
      </CardContent>
    </Card>
  );
}
