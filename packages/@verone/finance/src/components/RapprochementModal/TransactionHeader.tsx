'use client';

import { Badge } from '@verone/ui';
import { Building2 } from 'lucide-react';

import { formatAmount } from './utils';

interface TransactionHeaderProps {
  label: string;
  amount: number;
  counterpartyName?: string | null;
  organisationName?: string | null;
}

export function TransactionHeader({
  label,
  amount,
  counterpartyName,
  organisationName,
}: TransactionHeaderProps) {
  return (
    <div className="p-2 bg-slate-50 rounded-lg space-y-1">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-medium text-slate-900">{label}</p>
          {counterpartyName && (
            <p className="text-sm text-slate-600">{counterpartyName}</p>
          )}
        </div>
        <div className="text-right">
          <span
            className={`text-lg font-bold ${amount < 0 ? 'text-red-600' : 'text-green-600'}`}
          >
            {amount < 0 ? '' : '+'}
            {formatAmount(amount)}
          </span>
        </div>
      </div>

      {/* Organisation liée */}
      {organisationName && (
        <div className="flex items-center gap-2 pt-2 border-t border-slate-200 mt-2">
          <Building2 className="h-4 w-4 text-emerald-600" />
          <span className="text-sm text-emerald-700 font-medium">
            {organisationName}
          </span>
          <Badge variant="outline" className="text-xs">
            Organisation liée
          </Badge>
        </div>
      )}
    </div>
  );
}
