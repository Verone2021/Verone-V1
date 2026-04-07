'use client';

import { Badge, ScrollArea } from '@verone/ui';
import { formatCurrency } from '@verone/utils';
import { Loader2, Package, Sparkles } from 'lucide-react';

import { getMatchLabel } from './scoring';
import type { CreditTransaction, TransactionSuggestion } from './types';

interface RapprochementTransactionListProps {
  isLoading: boolean;
  isDebitSide: boolean;
  allTransactions: CreditTransaction[];
  restSuggestions: TransactionSuggestion[];
  otherTransactions: CreditTransaction[];
  filteredSuggestions: TransactionSuggestion[];
  searchQuery: string;
  onLink: (transactionId: string) => void;
}

export function RapprochementTransactionList({
  isLoading,
  isDebitSide,
  allTransactions,
  restSuggestions,
  otherTransactions,
  filteredSuggestions,
  searchQuery,
  onLink,
}: RapprochementTransactionListProps) {
  return (
    <ScrollArea className="h-[280px]">
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : allTransactions.length === 0 ? (
        <div className="text-center py-6 text-slate-500">
          <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Aucune transaction disponible</p>
          <p className="text-xs mt-1">
            Les transactions {isDebitSide ? 'débit' : 'crédit'} non rapprochées
            apparaîtront ici
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Suggestions restantes (avec badge match) */}
          {restSuggestions.map(tx => {
            const badge = getMatchLabel(tx.matchPriority);
            return (
              <div
                key={tx.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors hover:border-slate-300
                  ${badge.isGreen ? 'border-l-4 border-l-green-400' : ''}
                `}
                onClick={() => {
                  void Promise.resolve(onLink(tx.id)).catch((err: unknown) => {
                    console.error(
                      '[RapprochementTransactionList] Link failed:',
                      err
                    );
                  });
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center ${badge.isGreen ? 'bg-green-100' : 'bg-amber-100'}`}
                    >
                      <Sparkles
                        className={`h-4 w-4 ${badge.isGreen ? 'text-green-600' : 'text-amber-600'}`}
                      />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{tx.label}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(
                          tx.settled_at ?? tx.emitted_at
                        ).toLocaleDateString('fr-FR')}
                        {tx.counterparty_name && ` • ${tx.counterparty_name}`}
                      </p>
                      {tx.matchReasons.length > 0 && (
                        <p className="text-xs text-green-600 mt-0.5">
                          {tx.matchReasons.join(' • ')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <span
                      className={`font-semibold text-sm ${isDebitSide ? 'text-red-600' : 'text-green-600'}`}
                    >
                      {isDebitSide ? '-' : '+'}
                      {formatCurrency(Math.abs(tx.amount))}
                    </span>
                    {badge.label && (
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
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Separator between suggestions and other transactions */}
          {restSuggestions.length > 0 && otherTransactions.length > 0 && (
            <div className="flex items-center gap-2 py-1">
              <div className="flex-1 border-t border-slate-200" />
              <span className="text-xs text-slate-400">
                Autres transactions
              </span>
              <div className="flex-1 border-t border-slate-200" />
            </div>
          )}

          {/* Section header when no suggestions at all */}
          {filteredSuggestions.length === 0 && otherTransactions.length > 0 && (
            <div className="flex items-center gap-2 pb-1">
              <span className="text-xs font-medium text-slate-500">
                Toutes les transactions {isDebitSide ? 'débit' : 'crédit'} (
                {otherTransactions.length})
              </span>
            </div>
          )}

          {/* Other transactions (no match badge, neutral style) */}
          {otherTransactions.map(tx => (
            <div
              key={tx.id}
              className="p-3 rounded-lg border border-slate-200 cursor-pointer transition-colors hover:border-slate-400 hover:bg-slate-50"
              onClick={() => {
                void Promise.resolve(onLink(tx.id)).catch((err: unknown) => {
                  console.error(
                    '[RapprochementTransactionList] Link failed:',
                    err
                  );
                });
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center bg-slate-100">
                    <Package className="h-4 w-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{tx.label}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(
                        tx.settled_at ?? tx.emitted_at
                      ).toLocaleDateString('fr-FR')}
                      {tx.counterparty_name && ` • ${tx.counterparty_name}`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`font-semibold text-sm ${isDebitSide ? 'text-red-600' : 'text-green-600'}`}
                  >
                    {isDebitSide ? '-' : '+'}
                    {formatCurrency(Math.abs(tx.amount))}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* Empty search result */}
          {restSuggestions.length === 0 &&
            otherTransactions.length === 0 &&
            searchQuery && (
              <div className="text-center py-4 text-slate-500">
                <p className="text-sm">
                  Aucun résultat pour &quot;{searchQuery}&quot;
                </p>
              </div>
            )}
        </div>
      )}
    </ScrollArea>
  );
}
