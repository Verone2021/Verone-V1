'use client';

import { useState } from 'react';

import { Badge } from '@verone/ui';
import { formatCurrency } from '@verone/utils';
import { ArrowRight, X, Sparkles } from 'lucide-react';

import { getMatchLabel } from '../RapprochementContent/scoring';
import type { ReconciliationSuggestion } from '../../hooks/use-invoice-reconciliation-suggestions';

interface SuggestionRowProps {
  suggestion: ReconciliationSuggestion;
  isValidating: boolean;
  onValidate: (suggestion: ReconciliationSuggestion) => void;
  onIgnore: (invoiceId: string) => void;
}

export function SuggestionRow({
  suggestion,
  isValidating,
  onValidate,
  onIgnore,
}: SuggestionRowProps) {
  const { invoice, transaction, score, priority, reasons } = suggestion;
  const badge = getMatchLabel(priority);
  const [isIgnoring, setIsIgnoring] = useState(false);

  const txDate = new Date(
    transaction.settled_at ?? transaction.emitted_at
  ).toLocaleDateString('fr-FR');

  return (
    <div className="flex flex-col gap-2 p-3 bg-white rounded-lg border border-amber-200 hover:border-amber-300 transition-colors md:flex-row md:items-center md:gap-3">
      {/* Infos facture */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-1 text-sm font-medium text-slate-800">
          <span className="truncate">Facture {invoice.document_number}</span>
          {invoice.customer_name && (
            <span className="text-slate-500 truncate">
              · {invoice.customer_name}
            </span>
          )}
          <span className="font-semibold text-slate-900 ml-1">
            {formatCurrency(invoice.remaining)}
          </span>
          {invoice.amount_paid > 0 && (
            <span className="text-xs text-slate-400">
              (reste sur {formatCurrency(invoice.total_ttc)})
            </span>
          )}
        </div>
        {/* Infos virement */}
        <div className="flex flex-wrap items-center gap-1 mt-1 text-xs text-slate-500">
          <ArrowRight className="h-3 w-3 text-amber-500 shrink-0" />
          <span className="font-medium text-slate-700">
            {transaction.counterparty_name ?? transaction.label}
          </span>
          <span>·</span>
          <span className="font-semibold text-green-700">
            +{formatCurrency(Math.abs(transaction.amount))}
          </span>
          <span>·</span>
          <span>{txDate}</span>
        </div>
        {/* Raisons + badge */}
        <div className="flex flex-wrap items-center gap-1 mt-1">
          <Badge
            variant="outline"
            className={`text-xs px-1.5 py-0 ${
              badge.isGreen
                ? 'border-green-400 text-green-700 bg-green-50'
                : 'border-amber-400 text-amber-700 bg-amber-50'
            }`}
          >
            {badge.label} {score}%
          </Badge>
          {reasons.map(r => (
            <span
              key={r}
              className="text-xs text-slate-400 bg-slate-100 rounded px-1.5 py-0.5"
            >
              {r}
            </span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => {
            void Promise.resolve(onValidate(suggestion)).catch(
              (err: unknown) => {
                console.error('[SuggestionRow] Validate failed:', err);
              }
            );
          }}
          disabled={isValidating}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors h-11 md:h-9"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Valider
        </button>
        <button
          type="button"
          onClick={() => {
            setIsIgnoring(true);
            onIgnore(invoice.id);
          }}
          disabled={isIgnoring || isValidating}
          className="flex items-center justify-center h-11 w-11 md:h-9 md:w-9 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Ignorer cette suggestion"
          aria-label="Ignorer cette suggestion"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
