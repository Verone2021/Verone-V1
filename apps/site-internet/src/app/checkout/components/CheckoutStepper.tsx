'use client';

import { Check, CreditCard, ShoppingCart, Truck } from 'lucide-react';

const CHECKOUT_STEPS = [
  { label: 'Panier', icon: ShoppingCart, done: true },
  { label: 'Livraison', icon: Truck, done: false },
  { label: 'Paiement', icon: CreditCard, done: false },
  { label: 'Confirmation', icon: Check, done: false },
];

export function CheckoutStepper() {
  return (
    <div className="mb-10">
      <div className="flex items-center justify-between max-w-lg mx-auto">
        {CHECKOUT_STEPS.map((step, i) => {
          const isActive = i === 1;
          const Icon = step.icon;
          return (
            <div key={step.label} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    step.done
                      ? 'bg-green-500 text-white'
                      : isActive
                        ? 'bg-verone-black text-verone-white'
                        : 'bg-verone-gray-200 text-verone-gray-400'
                  }`}
                >
                  {step.done ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>
                <span
                  className={`text-xs mt-1.5 ${
                    isActive
                      ? 'text-verone-black font-medium'
                      : 'text-verone-gray-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {i < CHECKOUT_STEPS.length - 1 && (
                <div
                  className={`w-12 md:w-20 h-0.5 mx-2 mb-5 ${
                    step.done ? 'bg-green-500' : 'bg-verone-gray-200'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
