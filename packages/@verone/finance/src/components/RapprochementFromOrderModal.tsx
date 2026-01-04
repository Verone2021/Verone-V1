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
import { Search, Link2, Check, Loader2, AlertCircle } from 'lucide-react';
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
  confidence: number;
  matchReasons: string[];
}

// =====================================================================
// SCORING ALGORITHM
// =====================================================================

function calculateConfidence(
  order: OrderForLink,
  transaction: CreditTransaction
): { confidence: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  const orderAmount = order.total_ttc;
  const txAmount = Math.abs(transaction.amount);
  const tolerance = 10; // ±10€

  // 1. Amount matching
  const amountDiff = Math.abs(txAmount - orderAmount);
  if (amountDiff === 0) {
    score += 70;
    reasons.push('Montant exact');
  } else if (amountDiff <= tolerance) {
    score += 50;
    reasons.push(`Montant proche (±${amountDiff.toFixed(2)}€)`);
  } else if (amountDiff <= 50) {
    score += 20;
    reasons.push(`Montant similaire`);
  }

  // 2. Customer name matching
  if (order.customer_name && transaction.counterparty_name) {
    const orderName = order.customer_name.toLowerCase();
    const txName = transaction.counterparty_name.toLowerCase();
    if (
      txName.includes(orderName.substring(0, 10)) ||
      orderName.includes(txName.substring(0, 10))
    ) {
      score += 30;
      reasons.push('Nom client similaire');
    }
  }

  // 3. Date matching
  const orderDate = order.shipped_at
    ? new Date(order.shipped_at)
    : new Date(order.created_at);
  const txDate = new Date(transaction.settled_at || transaction.emitted_at);
  const daysDiff = Math.abs(
    (txDate.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysDiff <= 3) {
    score += 25;
    reasons.push('Date très proche (≤3j)');
  } else if (daysDiff <= 7) {
    score += 20;
    reasons.push('Date proche (≤7j)');
  } else if (daysDiff <= 14) {
    score += 10;
    reasons.push('Date proche (≤14j)');
  }

  return {
    confidence: Math.min(score, 100),
    reasons,
  };
}

function getConfidenceBadge(confidence: number) {
  if (confidence >= 90) {
    return {
      color: 'bg-green-100 text-green-800 border-green-300',
      label: 'Très probable',
    };
  } else if (confidence >= 70) {
    return {
      color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      label: 'Probable',
    };
  } else if (confidence >= 50) {
    return {
      color: 'bg-orange-100 text-orange-800 border-orange-300',
      label: 'Possible',
    };
  } else {
    return {
      color: 'bg-gray-100 text-gray-600 border-gray-300',
      label: 'Faible',
    };
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

  // Calculate suggestions with confidence scores
  const suggestions = useMemo(() => {
    if (!order || transactions.length === 0) return [];

    const withScores: TransactionSuggestion[] = transactions.map(tx => {
      const { confidence, reasons } = calculateConfidence(order, tx);
      return {
        ...tx,
        confidence,
        matchReasons: reasons,
      };
    });

    // Sort by confidence descending
    return withScores.sort((a, b) => b.confidence - a.confidence);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Lier à une transaction
          </DialogTitle>
          <DialogDescription>
            Sélectionnez la transaction bancaire correspondant à cette commande
          </DialogDescription>
        </DialogHeader>

        {/* Order info */}
        <div className="bg-slate-50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium">Commande {order.order_number}</p>
              {order.customer_name && (
                <p className="text-sm text-muted-foreground">
                  {order.customer_name}
                </p>
              )}
            </div>
            <Badge variant="outline" className="text-lg font-semibold">
              {formatCurrency(order.total_ttc)}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Créée le {new Date(order.created_at).toLocaleDateString('fr-FR')}
            {order.shipped_at &&
              ` • Expédiée le ${new Date(order.shipped_at).toLocaleDateString('fr-FR')}`}
          </p>
        </div>

        <Separator />

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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

        {/* Transactions list */}
        <ScrollArea className="h-[350px] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredSuggestions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Aucune transaction disponible</p>
              <p className="text-xs mt-1">
                Les transactions crédit non rapprochées apparaîtront ici
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredSuggestions.map(tx => {
                const badge = getConfidenceBadge(tx.confidence);
                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{tx.label}</p>
                        {tx.confidence > 0 && (
                          <Badge
                            variant="outline"
                            className={`text-xs ${badge.color}`}
                          >
                            {tx.confidence}%
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>
                          {new Date(
                            tx.settled_at || tx.emitted_at
                          ).toLocaleDateString('fr-FR')}
                        </span>
                        {tx.counterparty_name && (
                          <>
                            <span>•</span>
                            <span className="truncate">
                              {tx.counterparty_name}
                            </span>
                          </>
                        )}
                      </div>
                      {tx.matchReasons.length > 0 && (
                        <p className="text-xs text-green-600 mt-1">
                          {tx.matchReasons.join(' • ')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <span className="font-semibold text-green-600 whitespace-nowrap">
                        +{formatCurrency(Math.abs(tx.amount))}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => handleLink(tx.id)}
                        disabled={isLinking}
                      >
                        {isLinking ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                        Lier
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer info */}
        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          {filteredSuggestions.length} transaction(s) disponible(s) • Triées par
          probabilité de correspondance
        </div>
      </DialogContent>
    </Dialog>
  );
}
