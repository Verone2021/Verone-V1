'use client';

import { Badge } from '@verone/ui';
import { formatCurrency } from '@verone/utils';
import { ArrowRight, Sparkles } from 'lucide-react';

import { getMatchLabel } from './scoring';
import type { TransactionSuggestion } from './types';

interface RapprochementSuggestionsBoxProps {
  topSuggestions: TransactionSuggestion[];
  isDebitSide: boolean;
  isLinking: boolean;
  onLink: (transactionId: string) => void;
}

export function RapprochementSuggestionsBox({
  topSuggestions,
  isDebitSide,
  isLinking,
  onLink,
}: RapprochementSuggestionsBoxProps) {
  if (topSuggestions.length === 0) return null;

  return (
    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="h-4 w-4 text-amber-600" />
        <span className="text-sm font-medium text-amber-800">
          Suggestions de rapprochement
        </span>
      </div>
      <div className="space-y-2">
        {topSuggestions.map(tx => {
          const badge = getMatchLabel(tx.matchPriority);
          return (
            <button
              key={tx.id}
              onClick={() => {
                void Promise.resolve(onLink(tx.id)).catch((err: unknown) => {
                  console.error(
                    '[RapprochementSuggestionsBox] Link failed:',
                    err
                  );
                });
              }}
              disabled={isLinking}
              className="w-full flex items-center justify-between p-2 bg-white rounded border border-amber-200 hover:border-amber-400 transition-colors text-left disabled:opacity-50"
            >
              <div className="flex items-center gap-2">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center ${badge.isGreen ? 'bg-green-100' : 'bg-amber-100'}`}
                >
                  <Sparkles
                    className={`h-4 w-4 ${badge.isGreen ? 'text-green-600' : 'text-amber-600'}`}
                  />
                </div>
                <div>
                  <span className="font-medium text-sm truncate block max-w-[250px]">
                    {tx.label}
                  </span>
                  <span className="text-xs text-slate-500">
                    {new Date(
                      tx.settled_at ?? tx.emitted_at
                    ).toLocaleDateString('fr-FR')}
                    {tx.counterparty_name && ` • ${tx.counterparty_name}`}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm font-semibold ${isDebitSide ? 'text-red-600' : 'text-green-600'}`}
                >
                  {isDebitSide ? '-' : '+'}
                  {formatCurrency(Math.abs(tx.amount))}
                </span>
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    badge.isGreen
                      ? 'border-green-500 text-green-700 bg-green-50'
                      : 'border-amber-500 text-amber-700 bg-amber-50'
                  }`}
                >
                  {badge.label} {tx.matchScore}%
                </Badge>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
