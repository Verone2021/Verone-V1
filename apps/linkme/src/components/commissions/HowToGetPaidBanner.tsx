/**
 * HowToGetPaidBanner
 * Banner explicatif simplifié du processus de rémunération
 * Toujours ouvert avec bouton pour ouvrir le modal de sélection
 *
 * @module HowToGetPaidBanner
 * @since 2026-01-10
 */

'use client';

import {
  ShoppingCart,
  CreditCard,
  CheckCircle,
  Banknote,
  ArrowRight,
} from 'lucide-react';

interface IStep {
  icon: typeof ShoppingCart;
  title: string;
  color: string;
  bgColor: string;
}

const STEPS: IStep[] = [
  {
    icon: ShoppingCart,
    title: 'Commande reçue',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    icon: CreditCard,
    title: 'Client paie',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  {
    icon: CheckCircle,
    title: 'Commission payable',
    color: 'text-teal-600',
    bgColor: 'bg-teal-100',
  },
  {
    icon: Banknote,
    title: 'Vous demandez',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
  },
];

interface IHowToGetPaidBannerProps {
  className?: string;
  onOpenSelectionModal?: () => void;
  payableCount?: number;
  payableAmount?: number;
}

export function HowToGetPaidBanner({
  className,
  onOpenSelectionModal,
  payableCount = 0,
  payableAmount = 0,
}: IHowToGetPaidBannerProps): JSX.Element {
  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div
      className={`bg-gradient-to-r from-teal-50 via-cyan-50 to-blue-50 rounded-xl border border-teal-100 p-4 ${className ?? ''}`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Étapes simplifiées */}
        <div className="flex items-center gap-2 lg:gap-3">
          <span className="text-xs font-medium text-gray-500 mr-1">
            Comment ça marche :
          </span>
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="flex items-center">
                {index > 0 && (
                  <ArrowRight className="h-3 w-3 text-gray-300 mx-1 hidden sm:block" />
                )}
                <div className="flex items-center gap-1.5">
                  <div className={`p-1.5 rounded-full ${step.bgColor}`}>
                    <Icon className={`h-3 w-3 ${step.color}`} />
                  </div>
                  <span className="text-xs font-medium text-gray-700 hidden md:inline">
                    {step.title}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bouton CTA */}
        {onOpenSelectionModal && (
          <button
            onClick={onOpenSelectionModal}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 text-white text-sm font-semibold rounded-xl hover:from-teal-700 hover:to-cyan-700 transition-all shadow-md hover:shadow-lg"
          >
            <Banknote className="h-4 w-4" />
            {payableCount > 0 ? (
              <>
                Demander mes commissions
                <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-lg text-xs">
                  {payableCount} · {formatAmount(payableAmount)}
                </span>
              </>
            ) : (
              'Voir mes commissions'
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export default HowToGetPaidBanner;
