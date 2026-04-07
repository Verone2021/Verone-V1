'use client';

import { AlertCircle, Check, Loader2 } from 'lucide-react';

interface CartTotals {
  totalTtc: number;
}

interface CartItem {
  quantity: number;
}

interface Props {
  title: string;
  restaurantName: string;
  restaurantAddress?: string;
  cart: CartItem[];
  cartTotals: CartTotals;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmOrderModal({
  title,
  restaurantName,
  restaurantAddress,
  cart,
  cartTotals,
  isPending,
  onClose,
  onConfirm,
}: Props) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b bg-gradient-to-r from-green-600 to-green-700">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-gray-600">
            Vous êtes sur le point de soumettre une commande pour :
          </p>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <p className="font-semibold text-gray-900">{restaurantName}</p>
            {restaurantAddress && (
              <p className="text-sm text-gray-600">{restaurantAddress}</p>
            )}
            <div className="pt-2 border-t">
              <p className="text-sm text-gray-500">
                {cart.reduce((sum, item) => sum + item.quantity, 0)} article(s)
              </p>
              <p className="font-bold text-gray-900">
                {cartTotals.totalTtc.toFixed(2)} € TTC
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 p-3 rounded-lg">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <p>La commande sera envoyée à l&apos;équipe pour validation.</p>
          </div>
        </div>
        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium transition-colors"
          >
            {isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Check className="h-5 w-5" />
            )}
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
}
