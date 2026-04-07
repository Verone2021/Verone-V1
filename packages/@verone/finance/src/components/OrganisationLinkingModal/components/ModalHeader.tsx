'use client';

import { Badge } from '@verone/ui/components/ui/badge';
import { DialogHeader, DialogTitle } from '@verone/ui/components/ui/dialog';
import { Building2, Info, AlertCircle } from 'lucide-react';

import { getPcgCategory } from '../../../lib/pcg-categories';
import type { IExistingRule } from '../types';

interface IModalHeaderProps {
  isCredit: boolean;
  label: string;
  transactionCount: number;
  totalAmount: number;
  existingRule: IExistingRule | null;
  formatAmount: (amount: number) => string;
}

export function ModalHeader({
  isCredit,
  label,
  transactionCount,
  totalAmount,
  existingRule,
  formatAmount,
}: IModalHeaderProps): React.JSX.Element {
  const categoryLabel = existingRule?.default_category
    ? (getPcgCategory(existingRule.default_category)?.label ??
      existingRule.default_category)
    : null;

  return (
    <div className="border-b bg-gradient-to-br from-slate-50 to-white px-6 pt-6 pb-4">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-xl">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500 shadow-lg shadow-blue-500/30">
            <Building2 size={18} className="text-white" />
          </div>
          {isCredit ? 'Associer à un client' : 'Associer à un fournisseur'}
        </DialogTitle>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Badge
            variant="secondary"
            className="gap-1 bg-slate-100 px-2.5 py-1 text-slate-700"
          >
            <span className="font-mono text-xs">{label}</span>
          </Badge>
          {transactionCount > 0 && (
            <span className="text-slate-500">
              • {transactionCount} transaction
              {transactionCount > 1 ? 's' : ''} • {formatAmount(totalAmount)}
            </span>
          )}
        </div>
      </DialogHeader>

      {existingRule?.organisation_id ? (
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3">
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-600" />
          <div className="text-sm">
            <p className="font-medium text-amber-900">
              Organisation verrouillée par règle
            </p>
            <p className="mt-0.5 text-amber-700">
              Cette transaction est gérée automatiquement. Pour modifier
              l&apos;organisation, modifiez la règle depuis la page Règles.
            </p>
          </div>
        </div>
      ) : existingRule ? (
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
          <Info size={18} className="mt-0.5 shrink-0 text-blue-600" />
          <div className="text-sm">
            <p className="font-medium text-blue-900">
              Règle existante détectée
            </p>
            <p className="mt-0.5 text-blue-700">
              {categoryLabel ? `Catégorie: ${categoryLabel}` : 'Sans catégorie'}
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <Info size={18} className="mt-0.5 shrink-0 text-slate-500" />
          <div className="text-sm">
            <p className="font-medium text-slate-700">Liaison directe</p>
            <p className="mt-0.5 text-slate-500">
              Les transactions existantes seront liées à l&apos;organisation
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
