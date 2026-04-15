'use client';

import { cn } from '@verone/utils';

interface IResultRowProps {
  label: string;
  value: number;
  bold?: boolean;
  positive?: boolean;
}

export function ResultRow({
  label,
  value,
  bold,
  positive,
}: IResultRowProps): React.ReactNode {
  return (
    <div className="flex justify-between items-center">
      <span className={cn('text-sm', bold ? 'font-semibold' : 'text-gray-600')}>
        {label}
      </span>
      <span
        className={cn(
          'text-sm font-medium',
          bold && 'text-base font-bold',
          positive === true && 'text-green-600',
          positive === false && 'text-red-600',
          positive === undefined && 'text-gray-900'
        )}
      >
        {value >= 0 ? '+' : ''}
        {new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: 'EUR',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(value)}
      </span>
    </div>
  );
}
