import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

import { cn } from '@verone/utils';

export function MarginIndicator({ margin }: { margin: number | null }) {
  if (margin === null) {
    return <span className="text-gray-400">-</span>;
  }

  const marginPercent = margin * 100;
  const isNegative = marginPercent < 0;
  const isLow = marginPercent < 15;
  const isGood = marginPercent >= 15 && marginPercent < 30;
  const isHigh = marginPercent >= 30;

  return (
    <div className="flex items-center gap-1">
      {isNegative ? (
        <TrendingDown className="h-4 w-4 text-red-500" />
      ) : isLow ? (
        <Minus className="h-4 w-4 text-amber-500" />
      ) : (
        <TrendingUp className="h-4 w-4 text-green-500" />
      )}
      <span
        className={cn(
          'font-mono text-sm font-medium',
          isNegative && 'text-red-600',
          isLow && 'text-amber-600',
          isGood && 'text-green-600',
          isHigh && 'text-emerald-600'
        )}
      >
        {marginPercent.toFixed(1)}%
      </span>
    </div>
  );
}
