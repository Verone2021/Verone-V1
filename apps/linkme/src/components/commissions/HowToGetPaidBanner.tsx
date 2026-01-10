/**
 * HowToGetPaidBanner
 * Banner explicatif du processus de rémunération pour les affiliés
 *
 * @module HowToGetPaidBanner
 * @since 2026-01-10
 */

'use client';

import { useState } from 'react';

import { Card } from '@tremor/react';
import {
  ShoppingCart,
  CreditCard,
  CheckCircle,
  Banknote,
  ChevronDown,
  ChevronUp,
  HelpCircle,
} from 'lucide-react';

interface IStep {
  icon: typeof ShoppingCart;
  title: string;
  description: string;
  color: string;
  bgColor: string;
}

const STEPS: IStep[] = [
  {
    icon: ShoppingCart,
    title: '1. Commande',
    description: 'Un client commande via votre sélection',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    icon: CreditCard,
    title: '2. Paiement',
    description: 'La commande est payée par le client',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  {
    icon: CheckCircle,
    title: '3. Validation',
    description: 'Votre commission devient "Payable"',
    color: 'text-teal-600',
    bgColor: 'bg-teal-100',
  },
  {
    icon: Banknote,
    title: '4. Versement',
    description: 'Demandez le versement et uploadez votre facture',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
  },
];

interface IHowToGetPaidBannerProps {
  className?: string;
  defaultExpanded?: boolean;
}

export function HowToGetPaidBanner({
  className,
  defaultExpanded = true,
}: IHowToGetPaidBannerProps): JSX.Element {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <Card className={`p-0 overflow-hidden ${className ?? ''}`}>
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between bg-gradient-to-r from-linkme-turquoise/10 to-linkme-royal/10 hover:from-linkme-turquoise/15 hover:to-linkme-royal/15 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-linkme-turquoise/20 rounded-full">
            <HelpCircle className="h-4 w-4 text-linkme-turquoise" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-gray-900">
              Comment être rémunéré ?
            </h3>
            <p className="text-xs text-gray-500">
              Comprenez le processus de commissionnement
            </p>
          </div>
        </div>
        <div className="p-1 text-gray-400">
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="p-4 pt-2 border-t border-gray-100">
          {/* Steps */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={index}
                  className="relative flex flex-col items-center text-center p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  {/* Connector line (except last) */}
                  {index < STEPS.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-1.5 w-3 h-0.5 bg-gray-200" />
                  )}

                  <div className={`p-2.5 rounded-full ${step.bgColor} mb-2`}>
                    <Icon className={`h-4 w-4 ${step.color}`} />
                  </div>
                  <h4 className="text-xs font-semibold text-gray-900 mb-1">
                    {step.title}
                  </h4>
                  <p className="text-[10px] text-gray-500 leading-tight">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Note importante */}
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-800">
              <strong>Important :</strong> Seules les commissions dont le statut
              est <span className="font-semibold text-teal-600">"Payable"</span>{' '}
              peuvent être incluses dans une demande de versement. Cela signifie
              que la commande a été payée.
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}

export default HowToGetPaidBanner;
