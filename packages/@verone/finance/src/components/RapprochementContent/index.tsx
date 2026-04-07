'use client';

/**
 * RapprochementContent - Headless content for bank reconciliation
 *
 * Extracted from RapprochementFromOrderModal to allow embedding
 * directly in other dialogs (e.g. OrderDetailModal payment tab).
 *
 * The original RapprochementFromOrderModal is now a thin Dialog wrapper
 * around this component (API unchanged = 0 regressions).
 */

import { Input } from '@verone/ui';
import { AlertCircle, Loader2, Search } from 'lucide-react';

import { RapprochementExistingLinks } from './RapprochementExistingLinks';
import { RapprochementLinkSuccess } from './RapprochementLinkSuccess';
import { RapprochementOrderInfo } from './RapprochementOrderInfo';
import { RapprochementSuggestionsBox } from './RapprochementSuggestionsBox';
import { RapprochementTransactionList } from './RapprochementTransactionList';
import type { RapprochementContentProps } from './types';
import { useRapprochementData } from './useRapprochementData';

// Re-export public types for consumers
export type {
  ExistingLink,
  OrderForLink,
  RapprochementContentProps,
} from './types';

export function RapprochementContent({
  order,
  onSuccess,
  onLinksChanged,
  orderType = 'sales_order',
}: RapprochementContentProps) {
  // Avoirs (credit notes) behave like purchase orders for display: debit side, red color, '-' sign
  const isDebitSide = orderType === 'purchase_order' || orderType === 'avoir';

  const {
    isLoading,
    isSearching,
    isLinking,
    linkSuccess,
    searchQuery,
    setSearchQuery,
    error,
    existingLinksLocal,
    unlinkingId,
    allTransactions,
    filteredSuggestions,
    otherTransactions,
    handleLink,
    handleUnlink,
  } = useRapprochementData(order, orderType, onSuccess, onLinksChanged);

  if (!order) return null;

  // Success confirmation screen
  if (linkSuccess) {
    return (
      <RapprochementLinkSuccess
        orderNumber={order.order_number}
        transactionLabel={linkSuccess.transactionLabel}
        transactionAmount={linkSuccess.transactionAmount}
        onClose={() => onSuccess?.()}
      />
    );
  }

  const topSuggestions = filteredSuggestions.slice(0, 3);
  const restSuggestions = filteredSuggestions.slice(3);

  return (
    <div className="space-y-3">
      {/* Order info */}
      <RapprochementOrderInfo order={order} isDebitSide={isDebitSide} />

      {/* Existing links (with unlink button) */}
      <RapprochementExistingLinks
        links={existingLinksLocal}
        isDebitSide={isDebitSide}
        unlinkingId={unlinkingId}
        onUnlink={linkId => {
          void handleUnlink(linkId).catch((err: unknown) => {
            console.error('[RapprochementContent] Unlink failed:', err);
          });
        }}
      />

      {/* Top suggestions (amber box) */}
      <RapprochementSuggestionsBox
        topSuggestions={topSuggestions}
        isDebitSide={isDebitSide}
        isLinking={isLinking}
        onLink={txId => {
          void handleLink(txId).catch((err: unknown) => {
            console.error('[RapprochementContent] Link failed:', err);
          });
        }}
      />

      {/* Search */}
      <div className="relative">
        {isSearching ? (
          <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 animate-spin" />
        ) : (
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        )}
        <Input
          placeholder="Rechercher une transaction..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Rest of transactions */}
      <RapprochementTransactionList
        isLoading={isLoading}
        isDebitSide={isDebitSide}
        allTransactions={allTransactions}
        restSuggestions={restSuggestions}
        otherTransactions={otherTransactions}
        filteredSuggestions={filteredSuggestions}
        searchQuery={searchQuery}
        onLink={txId => {
          void handleLink(txId).catch((err: unknown) => {
            console.error('[RapprochementContent] Link failed:', err);
          });
        }}
      />

      {/* Footer info */}
      <div className="text-xs text-slate-500 text-center pt-2 border-t">
        {filteredSuggestions.length} suggestion(s) • {otherTransactions.length}{' '}
        autre(s) transaction(s)
      </div>
    </div>
  );
}
