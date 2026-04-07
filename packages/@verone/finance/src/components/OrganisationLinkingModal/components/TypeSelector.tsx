'use client';

import { cn } from '@verone/ui';
import { Label } from '@verone/ui/components/ui/label';
import { Package, Settings, User, Briefcase } from 'lucide-react';

import type { CounterpartyType } from '../types';

interface ITypeSelectorProps {
  isCredit: boolean;
  counterpartyType: CounterpartyType;
  onTypeChange: (type: CounterpartyType) => void;
}

export function TypeSelector({
  isCredit,
  counterpartyType,
  onTypeChange,
}: ITypeSelectorProps): React.JSX.Element {
  return (
    <div className="space-y-3">
      <Label className="text-base font-semibold">Type</Label>
      <div className="grid grid-cols-2 gap-3">
        {isCredit ? (
          <>
            <button
              type="button"
              onClick={() => onTypeChange('individual')}
              className={cn(
                'flex items-center gap-3 rounded-xl border-2 p-3 transition-all',
                counterpartyType === 'individual'
                  ? 'border-green-500 bg-green-50'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              )}
            >
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-lg',
                  counterpartyType === 'individual'
                    ? 'bg-green-500 text-white'
                    : 'bg-slate-100 text-slate-500'
                )}
              >
                <User size={20} />
              </div>
              <div className="text-left">
                <div className="font-medium text-sm">Client</div>
                <div className="text-xs text-slate-500">particulier (B2C)</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onTypeChange('customer_pro')}
              className={cn(
                'flex items-center gap-3 rounded-xl border-2 p-3 transition-all',
                counterpartyType === 'customer_pro'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              )}
            >
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-lg',
                  counterpartyType === 'customer_pro'
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-100 text-slate-500'
                )}
              >
                <Briefcase size={20} />
              </div>
              <div className="text-left">
                <div className="font-medium text-sm">Client</div>
                <div className="text-xs text-slate-500">
                  professionnel (B2B)
                </div>
              </div>
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => onTypeChange('supplier')}
              className={cn(
                'flex items-center gap-3 rounded-xl border-2 p-3 transition-all',
                counterpartyType === 'supplier'
                  ? 'border-amber-500 bg-amber-50'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              )}
            >
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-lg',
                  counterpartyType === 'supplier'
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-100 text-slate-500'
                )}
              >
                <Package size={20} />
              </div>
              <div className="text-left">
                <div className="font-medium text-sm">Fournisseur</div>
                <div className="text-xs text-slate-500">de biens</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onTypeChange('partner')}
              className={cn(
                'flex items-center gap-3 rounded-xl border-2 p-3 transition-all',
                counterpartyType === 'partner'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              )}
            >
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-lg',
                  counterpartyType === 'partner'
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-100 text-slate-500'
                )}
              >
                <Settings size={20} />
              </div>
              <div className="text-left">
                <div className="font-medium text-sm">Prestataire</div>
                <div className="text-xs text-slate-500">de services</div>
              </div>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
