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
  customer_name_alt?: string | null;
  total_ttc: number;
  created_at: string;
  order_date?: string | null;
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
  matchScore: number;
  matchReasons: string[];
  sortOrder: number;
}

// =====================================================================
// HELPERS
// =====================================================================

/** Generic legal suffixes to ignore when extracting search keywords */
const GENERIC_WORDS = new Set([
  'gmbh',
  'sarl',
  'sas',
  'sasu',
  'eurl',
  'sa',
  'inc',
  'ltd',
  'llc',
  'co',
  'kg',
  'ag',
  'bv',
  'nv',
  'plc',
  'corp',
  'europe',
  'france',
  'international',
  'group',
  'holding',
  'the',
  'and',
  'und',
  'les',
  'des',
]);

/**
 * Extract the best search keyword from customer names.
 *
 * Priority:
 *   1. altName if provided (trade name, usually short and discriminant: "PK Prado")
 *   2. name if short enough (< 20 chars → use as-is minus generic words)
 *   3. Longest meaningful word from name (fallback)
 */
function extractSearchKeyword(name: string, altName?: string | null): string {
  // Priority 1: altName (trade name / short commercial name)
  if (altName) {
    const altWords = altName
      .toLowerCase()
      .replace(/[^a-zà-ÿ0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 2 && !GENERIC_WORDS.has(w));
    if (altWords.length > 0) {
      // If altName is short, use it entirely (most discriminant)
      if (altWords.join(' ').length <= 20) {
        return altWords.join(' ');
      }
      // Otherwise pick longest word
      return altWords.reduce(
        (best, w) => (w.length > best.length ? w : best),
        altWords[0]
      );
    }
  }

  // Priority 2 & 3: primary name
  const words = name
    .toLowerCase()
    .replace(/[^a-zà-ÿ0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 3 && !GENERIC_WORDS.has(w));

  if (words.length === 0) return '';

  // If short enough, return all meaningful words joined
  const joined = words.join(' ');
  if (joined.length <= 20) return joined;

  // Fallback: longest meaningful word
  return words.reduce(
    (best, w) => (w.length > best.length ? w : best),
    words[0]
  );
}

// =====================================================================
// SCORING ALGORITHM — Cardinality-based decision tree
// =====================================================================

/**
 * Decision-tree scoring for bank reconciliation.
 *
 * Score = degree of uniqueness, NOT a weighted average.
 * Steps:
 *   0. Exact reference in label → 100% (short-circuit)
 *   1. Count transactions with exact amount (N_amount)
 *   2. Among those, count name matches (N_name)
 *   3. Decision tree based on cardinality
 *   4. Fallback: fuzzy amount + weighted average
 *
 * Returns a percentage score (0-100) and a priority bucket.
 */
function calculateMatch(
  order: OrderForLink,
  transaction: CreditTransaction,
  allTransactions: CreditTransaction[]
): { priority: string; score: number; reasons: string[]; sortOrder: number } {
  const reasons: string[] = [];

  const orderAmount = order.total_ttc;
  const txAmount = Math.abs(transaction.amount);
  const amountDiff = Math.abs(txAmount - orderAmount);
  const amountPct = orderAmount > 0 ? (amountDiff / orderAmount) * 100 : 100;

  // DATE: use order_date (real date), not created_at
  const orderDate = order.shipped_at
    ? new Date(order.shipped_at)
    : new Date(order.order_date || order.created_at);
  const txDate = new Date(transaction.settled_at || transaction.emitted_at);
  const daysDiff = Math.abs(
    (txDate.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // DATE FILTER: >2 years = excluded
  if (daysDiff > 730) {
    return {
      priority: 'excluded',
      score: 0,
      reasons: ['Date trop ancienne'],
      sortOrder: 999,
    };
  }

  // --- NAME MATCHING (boolean: matches or not) ---
  const orderNames = [order.customer_name, order.customer_name_alt]
    .filter(Boolean)
    .map(n => (n as string).toLowerCase().trim());
  const txLabel = (transaction.label || '').toLowerCase().trim();
  const txCounterparty = (transaction.counterparty_name || '')
    .toLowerCase()
    .trim();

  let nameMatches = false;
  for (const orderName of orderNames) {
    if (orderName.length < 3) continue;
    const nameWords = orderName.split(/[\s,.-]+/).filter(w => w.length >= 3);
    const matchedInLabel = nameWords.some(w => txLabel.includes(w));
    const matchedInCounterparty =
      txCounterparty.length > 0 &&
      nameWords.some(w => txCounterparty.includes(w));
    if (matchedInLabel || matchedInCounterparty) {
      nameMatches = true;
      break;
    }
  }

  if (nameMatches) {
    reasons.push('Nom fournisseur');
  }

  // --- STEP 0: Exact reference match (short-circuit) ---
  const searchText = (transaction.label || '').toUpperCase();
  const txCounterpartyUpper = (
    transaction.counterparty_name || ''
  ).toUpperCase();
  const orderRef = order.order_number.toUpperCase();
  if (searchText.includes(orderRef) || txCounterpartyUpper.includes(orderRef)) {
    reasons.push('Ref. trouvée');
    if (amountDiff < 0.01) reasons.push('Montant exact');
    return {
      priority: 'excellent',
      score: 100,
      reasons,
      sortOrder: 0,
    };
  }

  // --- STEP 1: Cardinality — how many transactions have the exact amount? ---
  const exactAmountTxs = allTransactions.filter(tx => {
    const amt = Math.abs(tx.amount);
    return Math.abs(amt - orderAmount) < 0.01;
  });
  const nAmount = exactAmountTxs.length;

  // --- STEP 2: Among exact-amount, how many match the supplier name? ---
  const exactAmountAndNameTxs = exactAmountTxs.filter(tx => {
    const label = (tx.label || '').toLowerCase().trim();
    const counterparty = (tx.counterparty_name || '').toLowerCase().trim();
    for (const oName of orderNames) {
      if (oName.length < 3) continue;
      const nameWords = oName.split(/[\s,.-]+/).filter(w => w.length >= 3);
      if (
        nameWords.some(w => label.includes(w)) ||
        (counterparty.length > 0 &&
          nameWords.some(w => counterparty.includes(w)))
      )
        return true;
    }
    return false;
  });
  const nName = exactAmountAndNameTxs.length;

  // --- DECISION TREE ---
  const isExactAmount = amountDiff < 0.01;

  if (isExactAmount) {
    reasons.push('Montant exact');

    if (nAmount === 1) {
      // Only ONE transaction with this exact amount
      if (nameMatches) {
        // Unique amount + name match = total certainty
        return {
          priority: 'excellent',
          score: 100,
          reasons,
          sortOrder: 0,
        };
      }
      // Unique amount but name doesn't match — still very likely
      return {
        priority: 'excellent',
        score: 90,
        reasons,
        sortOrder: 10,
      };
    }

    // nAmount > 1: multiple transactions with same exact amount
    if (nName === 0) {
      // None match the name — amount ok but no name confirmation
      return {
        priority: 'excellent',
        score: 80,
        reasons,
        sortOrder: 20,
      };
    }

    if (nName === 1) {
      // Only ONE matches both amount AND name = uniqueness recovered
      if (nameMatches) {
        return {
          priority: 'excellent',
          score: 100,
          reasons,
          sortOrder: 0,
        };
      }
      // This transaction has the amount but NOT the name — demote
      return {
        priority: 'good',
        score: 50,
        reasons,
        sortOrder: 50,
      };
    }

    // nName > 1: multiple match both amount AND name — use date proximity
    if (nameMatches) {
      // Sort by date proximity, give decreasing scores
      const sortedByDate = [...exactAmountAndNameTxs].sort((a, b) => {
        const dateA = new Date(a.settled_at || a.emitted_at);
        const dateB = new Date(b.settled_at || b.emitted_at);
        return (
          Math.abs(dateA.getTime() - orderDate.getTime()) -
          Math.abs(dateB.getTime() - orderDate.getTime())
        );
      });
      const rank = sortedByDate.findIndex(tx => tx.id === transaction.id);
      const score = Math.max(95 - rank * 5, 70);
      if (rank === 0) reasons.push('Date la plus proche');
      return {
        priority: 'excellent',
        score,
        reasons,
        sortOrder: 100 - score,
      };
    }

    // Has exact amount, multiple name matches exist, but THIS one doesn't match name
    return {
      priority: 'good',
      score: 50,
      reasons,
      sortOrder: 50,
    };
  }

  // --- NO EXACT AMOUNT: Fuzzy matching ---
  if (amountDiff <= 1 && nameMatches) {
    reasons.push('Montant ~1\u00A0\u20AC');
    return {
      priority: 'excellent',
      score: 90,
      reasons,
      sortOrder: 10,
    };
  }

  if (amountPct <= 2 && nameMatches) {
    reasons.push(`\u00B1${amountPct.toFixed(1)}%`);
    return {
      priority: 'excellent',
      score: 85,
      reasons,
      sortOrder: 15,
    };
  }

  if (amountPct <= 5 && nameMatches) {
    reasons.push(`\u00B1${amountPct.toFixed(1)}%`);
    return {
      priority: 'excellent',
      score: 75,
      reasons,
      sortOrder: 25,
    };
  }

  // --- FALLBACK: weighted average for weak matches ---
  let amountScore = 0;
  if (amountDiff <= 1) {
    amountScore = 95;
  } else if (amountPct <= 2) {
    amountScore = 85;
  } else if (amountPct <= 5) {
    amountScore = 65;
  } else if (amountPct <= 10) {
    amountScore = 40;
  }

  const nameScore = nameMatches ? 80 : 0;

  let dateScore = 0;
  if (daysDiff <= 3) {
    dateScore = 100;
  } else if (daysDiff <= 7) {
    dateScore = 85;
  } else if (daysDiff <= 14) {
    dateScore = 70;
  } else if (daysDiff <= 30) {
    dateScore = 50;
  } else if (daysDiff <= 90) {
    dateScore = 25;
  }

  const finalScore = Math.round(
    amountScore * 0.35 + nameScore * 0.4 + dateScore * 0.15
  );

  if (finalScore >= 50) {
    if (amountPct <= 10) reasons.push(`\u00B1${amountPct.toFixed(1)}%`);
    return {
      priority: 'good',
      score: finalScore,
      reasons,
      sortOrder: 100 - finalScore,
    };
  } else if (finalScore >= 25) {
    return {
      priority: 'partial',
      score: finalScore,
      reasons,
      sortOrder: 100 - finalScore,
    };
  }

  return { priority: 'none', score: finalScore, reasons: [], sortOrder: 100 };
}

function getMatchLabel(priority: string): {
  label: string;
  color: string;
  isGreen: boolean;
} {
  switch (priority) {
    case 'excellent':
      return {
        label: 'Match fort',
        color: 'bg-green-100 text-green-800 border-green-300',
        isGreen: true,
      };
    case 'good':
      return {
        label: 'Match probable',
        color: 'bg-green-100 text-green-800 border-green-300',
        isGreen: true,
      };
    case 'partial':
      return {
        label: 'Match partiel',
        color: 'bg-amber-100 text-amber-800 border-amber-300',
        isGreen: false,
      };
    case 'excluded':
      return {
        label: 'Date trop ancienne',
        color: 'bg-red-100 text-red-800 border-red-300',
        isGreen: false,
      };
    default:
      return {
        label: '',
        color: 'bg-gray-100 text-gray-600 border-gray-300',
        isGreen: false,
      };
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
  const [linkedTxIds, setLinkedTxIds] = useState<Set<string>>(new Set());
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
      const fields =
        'id, transaction_id, label, amount, counterparty_name, emitted_at, settled_at, unified_status';

      // Two parallel queries: recent transactions + amount-matched transactions
      const recentQuery = supabase
        .from('v_transactions_unified')
        .select(fields)
        .eq('side', transactionSide)
        .in('unified_status', ['to_process', 'classified'])
        .order('settled_at', { ascending: false, nullsFirst: false })
        .limit(100);

      // Amount-first search: find transactions matching order amount (±1€)
      const amountQuery = supabase
        .from('v_transactions_unified')
        .select(fields)
        .eq('side', transactionSide)
        .in('unified_status', ['to_process', 'classified'])
        .gte('amount', order.total_ttc - 1)
        .lte('amount', order.total_ttc + 1)
        .order('settled_at', { ascending: false, nullsFirst: false })
        .limit(30);

      const [recentResult, amountResult] = await Promise.all([
        recentQuery,
        amountQuery,
      ]);

      if (recentResult.error) throw recentResult.error;

      // Merge and deduplicate: amount-matched first (higher relevance)
      const recentTxs = (recentResult.data as CreditTransaction[]) || [];
      const amountTxs = (amountResult.data as CreditTransaction[]) || [];
      const recentIds = new Set(recentTxs.map(t => t.id));
      const extraAmountTxs = amountTxs.filter(t => !recentIds.has(t.id));

      setTransactions([...recentTxs, ...extraAmountTxs]);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Erreur lors du chargement des transactions');
    } finally {
      setIsLoading(false);
    }
  }, [order, supabase, orderType]);

  // Fetch IDs of transactions already linked to ANY order (cannot be reused)
  const fetchLinkedIds = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('transaction_document_links')
        .select('transaction_id');

      if (data) {
        setLinkedTxIds(new Set(data.map(row => row.transaction_id)));
      }
    } catch (err) {
      console.error('Error fetching linked transaction IDs:', err);
    }
  }, [supabase]);

  useEffect(() => {
    if (order) {
      void fetchTransactions();
      void fetchLinkedIds();
    }
  }, [order, fetchTransactions, fetchLinkedIds]);

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

          // Build OR filter: search query + altName keyword (if different)
          let orFilter = `label.ilike.${pattern},counterparty_name.ilike.${pattern}`;

          // Also search with altName if available and different from current query
          if (order?.customer_name_alt) {
            const altKeyword = extractSearchKeyword(
              '',
              order.customer_name_alt
            );
            if (altKeyword && altKeyword !== searchQuery.toLowerCase()) {
              const altPattern = `%${altKeyword}%`;
              orFilter += `,label.ilike.${altPattern},counterparty_name.ilike.${altPattern}`;
            }
          }

          const { data, error: searchError } = await supabase
            .from('v_transactions_unified')
            .select(
              'id, transaction_id, label, amount, counterparty_name, emitted_at, settled_at, unified_status'
            )
            .eq('side', transactionSide)
            .in('unified_status', ['to_process', 'classified'])
            .or(orFilter)
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
  }, [searchQuery, orderType, supabase, order]);

  // Merge recent transactions + search results, deduplicate by id,
  // and EXCLUDE transactions already linked to another order
  const allTransactions = useMemo(() => {
    let merged: CreditTransaction[];
    if (searchResults.length === 0) {
      merged = transactions;
    } else {
      const recentIds = new Set(transactions.map(t => t.id));
      const extras = searchResults.filter(t => !recentIds.has(t.id));
      merged = [...transactions, ...extras];
    }

    // Filter out already-linked transactions (1 transaction = 1 order only)
    if (linkedTxIds.size > 0) {
      return merged.filter(t => !linkedTxIds.has(t.id));
    }
    return merged;
  }, [transactions, searchResults, linkedTxIds]);

  const suggestions = useMemo(() => {
    if (!order || allTransactions.length === 0) return [];

    const withScores: TransactionSuggestion[] = allTransactions
      .map(tx => {
        const { priority, score, reasons, sortOrder } = calculateMatch(
          order,
          tx,
          allTransactions
        );
        return {
          ...tx,
          matchPriority: priority,
          matchScore: score,
          matchReasons: reasons,
          sortOrder,
        };
      })
      .filter(
        tx => tx.matchPriority !== 'none' && tx.matchPriority !== 'excluded'
      );

    // Sort purely by score — exact amount match always first
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
      // Use RPC to ensure cross-references (document_id, amount_paid, payment_status)
      // are properly updated — matching the pattern in RapprochementModal.handleLinkOrder()
      const rpcParams =
        orderType === 'purchase_order'
          ? {
              p_transaction_id: transactionId,
              p_purchase_order_id: order.id,
              p_allocated_amount: order.total_ttc,
            }
          : {
              p_transaction_id: transactionId,
              p_sales_order_id: order.id,
              p_allocated_amount: order.total_ttc,
            };

      const { error: linkError } = await (supabase.rpc as CallableFunction)(
        'link_transaction_to_document',
        rpcParams
      );

      if (linkError) throw linkError;

      // Immediately add to linked set so it disappears from suggestions
      setLinkedTxIds(prev => new Set([...prev, transactionId]));

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
              {new Date(
                order.order_date || order.created_at
              ).toLocaleDateString('fr-FR')}
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
              return (
                <div
                  key={tx.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors hover:border-slate-300
                    ${badge.isGreen ? 'border-l-4 border-l-green-400' : ''}
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
