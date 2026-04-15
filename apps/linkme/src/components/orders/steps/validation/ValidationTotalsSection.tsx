'use client';

/**
 * ValidationTotalsSection - Section totaux dans la validation commande
 *
 * @module ValidationTotalsSection
 * @since 2026-04-14
 */

import { Calculator, Coins } from 'lucide-react';

import { usePermissions } from '@/hooks/use-permissions';

import { ValidationSectionWrapper } from './ValidationSectionWrapper';

interface CartTotals {
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  totalCommission: number;
  itemsCount: number;
  effectiveTaxRate: number;
}

interface ValidationTotalsSectionProps {
  cartTotals: CartTotals;
  isOpen: boolean;
  onToggle: () => void;
  formatCurrency: (value: number) => string;
}

export function ValidationTotalsSection({
  cartTotals,
  isOpen,
  onToggle,
  formatCurrency,
}: ValidationTotalsSectionProps) {
  const { canViewCommissions } = usePermissions();

  return (
    <ValidationSectionWrapper
      sectionKey="totals"
      title="Total"
      icon={Calculator}
      iconBgClass="bg-linkme-turquoise/10"
      iconColorClass="text-linkme-turquoise"
      isOpen={isOpen}
      onToggle={onToggle}
      cardClassName="border-2 border-linkme-turquoise/30"
      subtitleElement={
        <p className="text-lg font-bold text-linkme-turquoise">
          {formatCurrency(cartTotals.totalTTC)} € TTC
        </p>
      }
    >
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total HT</span>
          <span className="font-medium">
            {formatCurrency(cartTotals.totalHT)} €
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">
            {cartTotals.effectiveTaxRate === 0
              ? 'TVA (0%) - Export'
              : `TVA (${Math.round(cartTotals.effectiveTaxRate * 100)}%)`}
          </span>
          <span className="font-medium">
            {formatCurrency(cartTotals.totalTVA)} €
          </span>
        </div>
        <div className="flex justify-between pt-2 border-t">
          <span className="font-semibold">Total TTC</span>
          <span className="text-xl font-bold">
            {formatCurrency(cartTotals.totalTTC)} €
          </span>
        </div>

        {canViewCommissions && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800">
                  Votre commission
                </span>
              </div>
              <span className="text-lg font-bold text-green-700">
                +{formatCurrency(cartTotals.totalCommission)} € HT
              </span>
            </div>
          </div>
        )}
      </div>
    </ValidationSectionWrapper>
  );
}
