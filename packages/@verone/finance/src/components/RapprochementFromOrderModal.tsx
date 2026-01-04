'use client';

/**
 * RapprochementFromOrderModal - Modal pour lier une commande à une transaction
 *
 * Direction INVERSE du RapprochementModal:
 * - RapprochementModal: Transaction → Commande/Document
 * - RapprochementFromOrderModal: Commande → Transaction
 *
 * Features:
 * - Affiche les transactions crédit non rapprochées
 * - Calcule un score de confiance basé sur montant, date, nom client
 * - Affichage couleur selon le score (vert/jaune/orange/gris)
 * - Permet de lier la commande à une transaction
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Button,
  Badge,
  Input,
  ScrollArea,
  Separator,
} from '@verone/ui';
import { formatCurrency } from '@verone/utils';
import { createClient } from '@verone/utils/supabase/client';
import {
  Search,
  Link2,
  Check,
  Loader2,
  AlertCircle,
  Package,
  Sparkles,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';

// =====================================================================
// TYPES
// =====================================================================

interface OrderForLink {
  id: string;
  order_number: string;
  customer_name?: string | null;
  total_ttc: number;
  created_at: string;
  shipped_at?: string | null;
}

interface RapprochementFromOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: OrderForLink | null;
  onSuccess?: () => void;
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
// SCORING ALGORITHM (aligné sur RapprochementModal)
// =====================================================================

/**
 * Calcule la pertinence d'un match entre commande et transaction
 *
 * Approche Pennylane: montant STRICTEMENT identique = match suggéré
 * - Montant exact = critère PRINCIPAL
 * - Référence (LINK-XXXXXX dans le label) = bonus de pertinence
 * - Date = FILTRE uniquement (>1 an = exclu)
 */
function calculateMatch(
  order: OrderForLink,
  transaction: CreditTransaction
): { priority: string; reasons: string[]; sortOrder: number } {
  const reasons: string[] = [];

  const orderAmount = order.total_ttc;
  const txAmount = Math.abs(transaction.amount);
  const amountDiff = Math.abs(txAmount - orderAmount);

  // FILTRE DATE: >1 an = exclu
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

  // Vérifier si la référence de commande est dans le label
  const searchText = (transaction.label || '').toUpperCase();
  const hasReference = searchText.includes(order.order_number.toUpperCase());

  if (hasReference) {
    reasons.push('Référence trouvée');
  }

  // MONTANT - critère principal
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

/**
 * Retourne le label et la couleur pour une priorité de match
 */
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

export function RapprochementFromOrderModal({
  open,
  onOpenChange,
  order,
  onSuccess,
}: RapprochementFromOrderModalProps) {
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // Fetch available credit transactions
  const fetchTransactions = useCallback(async () => {
    if (!order) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('v_transactions_unified')
        .select(
          'id, transaction_id, label, amount, counterparty_name, emitted_at, settled_at, unified_status'
        )
        .eq('side', 'credit')
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
  }, [order, supabase]);

  useEffect(() => {
    if (open && order) {
      fetchTransactions();
    }
  }, [open, order, fetchTransactions]);

  // Calculate suggestions with match priority
  const suggestions = useMemo(() => {
    if (!order || transactions.length === 0) return [];

    const withScores: TransactionSuggestion[] = transactions
      .map(tx => {
        const { priority, reasons, sortOrder } = calculateMatch(order, tx);
        return {
          ...tx,
          matchPriority: priority,
          matchReasons: reasons,
          sortOrder,
        };
      })
      // Exclure les transactions sans match et celles trop anciennes
      .filter(
        tx => tx.matchPriority !== 'none' && tx.matchPriority !== 'excluded'
      );

    // Sort by sortOrder ascending (meilleurs matchs en premier)
    return withScores.sort((a, b) => a.sortOrder - b.sortOrder);
  }, [order, transactions]);

  // Filter by search query
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

  // Link transaction to order
  const handleLink = async (transactionId: string) => {
    if (!order) return;

    setIsLinking(true);

    try {
      const { error: linkError } = await supabase
        .from('transaction_document_links')
        .insert({
          transaction_id: transactionId,
          sales_order_id: order.id,
          link_type: 'sales_order',
          allocated_amount: order.total_ttc,
        });

      if (linkError) throw linkError;

      // Also update the transaction matching_status
      await supabase
        .from('bank_transactions')
        .update({
          matching_status: 'manual_matched',
          updated_at: new Date().toISOString(),
        })
        .eq('id', transactionId);

      toast.success('Commande liée à la transaction');
      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      console.error('Error linking transaction:', err);
      toast.error('Erreur lors du rapprochement');
    } finally {
      setIsLinking(false);
    }
  };

  if (!order) return null;

  // Séparer les meilleures suggestions (3 max) du reste
  const topSuggestions = filteredSuggestions.slice(0, 3);
  const restSuggestions = filteredSuggestions.slice(3);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Lier à une transaction
          </DialogTitle>
          <DialogDescription>
            Sélectionnez la transaction bancaire correspondant à cette commande
          </DialogDescription>
        </DialogHeader>

        {/* Order info */}
        <div className="p-4 bg-slate-50 rounded-lg space-y-2">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="font-medium text-slate-900">
                Commande #{order.order_number}
              </p>
              {order.customer_name && (
                <p className="text-sm text-slate-500">{order.customer_name}</p>
              )}
              <p className="text-sm text-slate-500 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(order.created_at).toLocaleDateString('fr-FR')}
                {order.shipped_at &&
                  ` • Expédiée ${new Date(order.shipped_at).toLocaleDateString('fr-FR')}`}
              </p>
            </div>
            <span className="text-lg font-bold text-green-600">
              {formatCurrency(order.total_ttc)}
            </span>
          </div>
        </div>

        {/* Suggestions automatiques (zone ambrée comme RapprochementModal) */}
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
                    onClick={() => handleLink(tx.id)}
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
                      <span className="text-sm font-semibold text-green-600">
                        +{formatCurrency(Math.abs(tx.amount))}
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
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

        {/* Autres transactions (si plus de 3) */}
        <ScrollArea className="h-[220px] flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : restSuggestions.length === 0 && topSuggestions.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>Aucune transaction disponible</p>
              <p className="text-xs mt-1">
                Les transactions crédit non rapprochées apparaîtront ici
              </p>
            </div>
          ) : restSuggestions.length > 0 ? (
            <div className="space-y-2">
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
                    onClick={() => handleLink(tx.id)}
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
                            {tx.counterparty_name &&
                              ` • ${tx.counterparty_name}`}
                          </p>
                          {tx.matchReasons.length > 0 && (
                            <p className="text-xs text-green-600 mt-0.5">
                              {tx.matchReasons.join(' • ')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <span className="font-semibold text-sm text-green-600">
                          +{formatCurrency(Math.abs(tx.amount))}
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
            </div>
          ) : null}
        </ScrollArea>

        {/* Footer info */}
        <div className="text-xs text-slate-500 text-center pt-2 border-t">
          {filteredSuggestions.length} transaction(s) correspondante(s) • Triées
          par pertinence
        </div>
      </DialogContent>
    </Dialog>
  );
}
