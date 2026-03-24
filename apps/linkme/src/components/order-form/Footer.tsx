import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

import type { FooterProps } from './types';

export function Footer({
  onBack,
  onNext,
  nextLabel,
  isSubmitting,
  cartTotals,
  formatPrice,
  showBackButton = true,
}: FooterProps) {
  return (
    <div className="flex-shrink-0 border-t bg-gray-50 px-4 py-3">
      {/* Mobile: show cart summary */}
      <div className="md:hidden flex items-center justify-between mb-3 pb-3 border-b border-gray-200 text-sm">
        <span className="text-gray-600">
          {cartTotals.totalItems} art. | HT: {formatPrice(cartTotals.totalHt)}
        </span>
        <span className="font-bold text-gray-900">
          TTC: {formatPrice(cartTotals.totalTtc)}
        </span>
      </div>

      <div className="flex gap-2">
        {showBackButton && onBack && (
          <button
            type="button"
            onClick={onBack}
            disabled={isSubmitting}
            className="flex-1 py-2 px-3 border border-gray-300 rounded font-medium text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors flex items-center justify-center gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Retour
          </button>
        )}
        <button
          type="button"
          onClick={onNext}
          disabled={isSubmitting}
          className="flex-1 py-2 px-3 bg-blue-600 text-white rounded font-medium text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-1"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Envoi...
            </>
          ) : (
            <>
              {nextLabel}
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
