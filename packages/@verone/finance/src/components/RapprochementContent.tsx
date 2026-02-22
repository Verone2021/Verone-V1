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

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

import { Badge, Input, ScrollArea } from '@verone/ui';
import { formatCurrency } from '@verone/utils';
import { createClient } from '@verone/utils/supabase/client';
import {
  Search,
  Loader2,
  AlertCircle,
  Package,
  Sparkles,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';

// =====================================================================
// TYPES (re-exported for consumers)
// =====================================================================

export interface OrderForLink {
  id: string;
  order_number: string;
  customer_name?: string | null;
  total_ttc: number;
  created_at: string;
  shipped_at?: string | null;
}

export interface RapprochementContentProps {
  order: OrderForLink | null;
  onSuccess?: () => void;
  orderType?: 'sales_order' | 'purchase_order';
}

interface CreditTransaction {
  id: string;
  transaction_id: string;
  label: string;
  amount: number;
  counterparty_name: string | null;
  emitted_at: string;
  settled_at: string | null;
  unified_status: string;
}

interface TransactionSuggestion extends CreditTransaction {
  matchPriority: string;
  matchReasons: string[];
  sortOrder: number;
}

// =====================================================================
// SCORING ALGORITHM (aligned with RapprochementModal)
// =====================================================================

function calculateMatch(
  order: OrderForLink,
  transaction: CreditTransaction
): { priority: string; reasons: string[]; sortOrder: number } {
  const reasons: string[] = [];

  const orderAmount = order.total_ttc;
  const txAmount = Math.abs(transaction.amount);
  const amountDiff = Math.abs(txAmount - orderAmount);

  // DATE FILTER: >1 year = excluded
  const orderDate = order.shipped_at
    ? new Date(order.shipped_at)
    : new Date(order.created_at);
  const txDate = new Date(transaction.settled_at || transaction.emitted_at);
  const yearsDiff = Math.abs(txDate.getFullYear() - orderDate.getFullYear());

  if (yearsDiff > 1) {
    return {
      priority: 'excluded',
      reasons: ['Date trop ancienne'],
      sortOrder: 999,
    };
  }

  const searchText = (transaction.label || '').toUpperCase();
  const hasReference = searchText.includes(order.order_number.toUpperCase());

  if (hasReference) {
    reasons.push('Référence trouvée');
  }

  if (amountDiff === 0) {
    reasons.unshift('Montant exact');
    return {
      priority: hasReference ? 'exact+ref' : 'exact',
      reasons,
      sortOrder: hasReference ? 1 : 2,
    };
  } else if (amountDiff <= 1) {
    reasons.unshift('≈ 1€');
    return {
      priority: hasReference ? 'close+ref' : 'close',
      reasons,
      sortOrder: hasReference ? 3 : 4,
    };
  } else if (amountDiff <= orderAmount * 0.02) {
    reasons.unshift('±2%');
    return {
      priority: hasReference ? 'similar+ref' : 'similar',
      reasons,
      sortOrder: hasReference ? 5 : 6,
    };
  }

  return { priority: 'none', reasons: [], sortOrder: 100 };
}

function getMatchLabel(priority: string): {
  label: string;
  color: string;
} {
  switch (priority) {
    case 'exact+ref':
      return {
        label: 'Match parfait',
        color: 'bg-green-100 text-green-800 border-green-300',
      };
    case 'exact':
      return {
        label: 'Montant exact',
        color: 'bg-green-100 text-green-800 border-green-300',
      };
    case 'close+ref':
      return {
        label: '≈ 1€ + Réf',
        color: 'bg-green-100 text-green-800 border-green-300',
      };
    case 'close':
      return {
        label: '≈ 1€',
        color: 'bg-amber-100 text-amber-800 border-amber-300',
      };
    case 'similar+ref':
      return {
        label: '±2% + Réf',
        color: 'bg-amber-100 text-amber-800 border-amber-300',
      };
    case 'similar':
      return {
        label: '±2%',
        color: 'bg-amber-100 text-amber-800 border-amber-300',
      };
    case 'excluded':
      return {
        label: 'Date trop ancienne',
        color: 'bg-red-100 text-red-800 border-red-300',
      };
    default:
      return { label: '', color: 'bg-gray-100 text-gray-600 border-gray-300' };
  }
}

// =====================================================================
// COMPONENT
// =====================================================================

export function RapprochementContent({
  order,
  onSuccess,
  orderType = 'sales_order',
}: RapprochementContentProps) {
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [searchResults, setSearchResults] = useState<CreditTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const supabase = createClient();

  const fetchTransactions = useCallback(async () => {
    if (!order) return;

    setIsLoading(true);
    setError(null);

    try {
      const transactionSide =
        orderType === 'purchase_order' ? 'debit' : 'credit';

      const { data, error: fetchError } = await supabase
        .from('v_transactions_unified')
        .select(
          'id, transaction_id, label, amount, counterparty_name, emitted_at, settled_at, unified_status'
        )
        .eq('side', transactionSide)
        .in('unified_status', ['to_process', 'classified'])
        .order('settled_at', { ascending: false, nullsFirst: false })
        .limit(100);

      if (fetchError) throw fetchError;

      setTransactions((data as CreditTransaction[]) || []);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Erreur lors du chargement des transactions');
    } finally {
      setIsLoading(false);
    }
  }, [order, supabase, orderType]);

  useEffect(() => {
    if (order) {
      void fetchTransactions();
    }
  }, [order, fetchTransactions]);

  // Server-side search: when user types >= 3 chars, search ALL transactions in DB
  useEffect(() => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    if (searchQuery.length < 3) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const transactionSide = orderType === 'purchase_order' ? 'debit' : 'credit';

    searchTimerRef.current = setTimeout(() => {
      const runSearch = async () => {
        try {
          const pattern = `%${searchQuery}%`;
          const { data, error: searchError } = await supabase
            .from('v_transactions_unified')
            .select(
              'id, transaction_id, label, amount, counterparty_name, emitted_at, settled_at, unified_status'
            )
            .eq('side', transactionSide)
            .in('unified_status', ['to_process', 'classified'])
            .or(`label.ilike.${pattern},counterparty_name.ilike.${pattern}`)
            .order('settled_at', { ascending: false, nullsFirst: false })
            .limit(50);

          if (searchError) throw searchError;
          setSearchResults((data as CreditTransaction[]) || []);
        } catch (err) {
          console.error('[RapprochementContent] Server search failed:', err);
        } finally {
          setIsSearching(false);
        }
      };

      void runSearch();
    }, 300);

    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, [searchQuery, orderType, supabase]);

  // Merge recent transactions + search results, deduplicate by id
  const allTransactions = useMemo(() => {
    if (searchResults.length === 0) return transactions;

    const recentIds = new Set(transactions.map(t => t.id));
    const extras = searchResults.filter(t => !recentIds.has(t.id));
    return [...transactions, ...extras];
  }, [transactions, searchResults]);

  const suggestions = useMemo(() => {
    if (!order || allTransactions.length === 0) return [];

    const withScores: TransactionSuggestion[] = allTransactions
      .map(tx => {
        const { priority, reasons, sortOrder } = calculateMatch(order, tx);
        return {
          ...tx,
          matchPriority: priority,
          matchReasons: reasons,
          sortOrder,
        };
      })
      .filter(
        tx => tx.matchPriority !== 'none' && tx.matchPriority !== 'excluded'
      );

    return withScores.sort((a, b) => a.sortOrder - b.sortOrder);
  }, [order, allTransactions]);

  const filteredSuggestions = useMemo(() => {
    if (!searchQuery) return suggestions;

    const query = searchQuery.toLowerCase();
    return suggestions.filter(
      tx =>
        tx.label?.toLowerCase().includes(query) ||
        tx.counterparty_name?.toLowerCase().includes(query) ||
        tx.transaction_id?.toLowerCase().includes(query)
    );
  }, [suggestions, searchQuery]);

  // Transactions restantes (pas dans les suggestions) pour navigation manuelle
  const otherTransactions = useMemo(() => {
    const suggestionIds = new Set(suggestions.map(s => s.id));
    let others = allTransactions.filter(tx => !suggestionIds.has(tx.id));

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      others = others.filter(
        tx =>
          tx.label?.toLowerCase().includes(query) ||
          tx.counterparty_name?.toLowerCase().includes(query) ||
          tx.transaction_id?.toLowerCase().includes(query)
      );
    }
    return others;
  }, [allTransactions, suggestions, searchQuery]);

  const handleLink = async (transactionId: string) => {
    if (!order) return;

    setIsLinking(true);

    try {
      const insertData =
        orderType === 'purchase_order'
          ? {
              transaction_id: transactionId,
              purchase_order_id: order.id,
              link_type: 'purchase_order',
              allocated_amount: -order.total_ttc,
            }
          : {
              transaction_id: transactionId,
              sales_order_id: order.id,
              link_type: 'sales_order',
              allocated_amount: order.total_ttc,
            };

      const { error: linkError } = await supabase
        .from('transaction_document_links')
        .insert(insertData);

      if (linkError) throw linkError;

      await supabase
        .from('bank_transactions')
        .update({
          matching_status: 'manual_matched',
          updated_at: new Date().toISOString(),
        })
        .eq('id', transactionId);

      toast.success('Commande liée à la transaction');
      onSuccess?.();
    } catch (err) {
      console.error('Error linking transaction:', err);
      toast.error('Erreur lors du rapprochement');
    } finally {
      setIsLinking(false);
    }
  };

  if (!order) return null;

  const topSuggestions = filteredSuggestions.slice(0, 3);
  const restSuggestions = filteredSuggestions.slice(3);

  return (
    <div className="space-y-3">
      {/* Order info */}
      <div className="p-3 bg-slate-50 rounded-lg space-y-1">
        <div className="flex justify-between items-start">
          <div className="space-y-0.5">
            <p className="font-medium text-sm text-slate-900">
              Commande #{order.order_number}
            </p>
            {order.customer_name && (
              <p className="text-xs text-slate-500">{order.customer_name}</p>
            )}
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(order.created_at).toLocaleDateString('fr-FR')}
              {order.shipped_at &&
                ` • Expédiée ${new Date(order.shipped_at).toLocaleDateString('fr-FR')}`}
            </p>
          </div>
          <span
            className={`text-base font-bold ${orderType === 'purchase_order' ? 'text-red-600' : 'text-green-600'}`}
          >
            {orderType === 'purchase_order' ? '-' : ''}
            {formatCurrency(order.total_ttc)}
          </span>
        </div>
      </div>

      {/* Top suggestions (amber box) */}
      {topSuggestions.length > 0 && (
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
              const isGreen =
                tx.matchPriority === 'exact+ref' ||
                tx.matchPriority === 'exact' ||
                tx.matchPriority === 'close+ref';
              return (
                <button
                  key={tx.id}
                  onClick={() => {
                    void handleLink(tx.id).catch((err: unknown) => {
                      console.error('[RapprochementContent] Link failed:', err);
                    });
                  }}
                  disabled={isLinking}
                  className="w-full flex items-center justify-between p-2 bg-white rounded border border-amber-200 hover:border-amber-400 transition-colors text-left disabled:opacity-50"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center ${isGreen ? 'bg-green-100' : 'bg-amber-100'}`}
                    >
                      <Sparkles
                        className={`h-4 w-4 ${isGreen ? 'text-green-600' : 'text-amber-600'}`}
                      />
                    </div>
                    <div>
                      <span className="font-medium text-sm truncate block max-w-[250px]">
                        {tx.label}
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(
                          tx.settled_at || tx.emitted_at
                        ).toLocaleDateString('fr-FR')}
                        {tx.counterparty_name && ` • ${tx.counterparty_name}`}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-semibold ${orderType === 'purchase_order' ? 'text-red-600' : 'text-green-600'}`}
                    >
                      {orderType === 'purchase_order' ? '-' : '+'}
                      {formatCurrency(Math.abs(tx.amount))}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        isGreen
                          ? 'border-green-500 text-green-700 bg-green-50'
                          : 'border-amber-500 text-amber-700 bg-amber-50'
                      }`}
                    >
                      {badge.label}
                    </Badge>
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

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
              Les transactions{' '}
              {orderType === 'purchase_order' ? 'débit' : 'crédit'} non
              rapprochées apparaîtront ici
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Suggestions restantes (avec badge match) */}
            {restSuggestions.map(tx => {
              const badge = getMatchLabel(tx.matchPriority);
              const isGreen =
                tx.matchPriority === 'exact+ref' ||
                tx.matchPriority === 'exact' ||
                tx.matchPriority === 'close+ref';
              return (
                <div
                  key={tx.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors hover:border-slate-300
                    ${isGreen ? 'border-l-4 border-l-green-400' : ''}
                  `}
                  onClick={() => {
                    void handleLink(tx.id).catch((err: unknown) => {
                      console.error('[RapprochementContent] Link failed:', err);
                    });
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center ${isGreen ? 'bg-green-100' : 'bg-amber-100'}`}
                      >
                        <Sparkles
                          className={`h-4 w-4 ${isGreen ? 'text-green-600' : 'text-amber-600'}`}
                        />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{tx.label}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(
                            tx.settled_at || tx.emitted_at
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
                        className={`font-semibold text-sm ${orderType === 'purchase_order' ? 'text-red-600' : 'text-green-600'}`}
                      >
                        {orderType === 'purchase_order' ? '-' : '+'}
                        {formatCurrency(Math.abs(tx.amount))}
                      </span>
                      {badge.label && (
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            isGreen
                              ? 'border-green-500 text-green-700 bg-green-50'
                              : 'border-amber-500 text-amber-700 bg-amber-50'
                          }`}
                        >
                          {badge.label}
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
            {filteredSuggestions.length === 0 &&
              otherTransactions.length > 0 && (
                <div className="flex items-center gap-2 pb-1">
                  <span className="text-xs font-medium text-slate-500">
                    Toutes les transactions{' '}
                    {orderType === 'purchase_order' ? 'débit' : 'crédit'} (
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
                  void handleLink(tx.id).catch((err: unknown) => {
                    console.error('[RapprochementContent] Link failed:', err);
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
                          tx.settled_at || tx.emitted_at
                        ).toLocaleDateString('fr-FR')}
                        {tx.counterparty_name && ` • ${tx.counterparty_name}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`font-semibold text-sm ${orderType === 'purchase_order' ? 'text-red-600' : 'text-green-600'}`}
                    >
                      {orderType === 'purchase_order' ? '-' : '+'}
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

      {/* Footer info */}
      <div className="text-xs text-slate-500 text-center pt-2 border-t">
        {filteredSuggestions.length} suggestion(s) • {otherTransactions.length}{' '}
        autre(s) transaction(s)
      </div>
    </div>
  );
}
