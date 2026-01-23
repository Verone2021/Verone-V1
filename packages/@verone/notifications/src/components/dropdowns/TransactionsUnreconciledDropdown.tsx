/**
 * TransactionsUnreconciledDropdown - Dropdown transactions non rapprochées
 * Affiche les transactions bancaires à rapprocher
 *
 * Design System 2026 - Minimaliste, professionnel
 *
 * @author Romeo Dos Santos
 * @date 2026-01-23
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

import { Badge } from '@verone/ui';
import { Button } from '@verone/ui';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@verone/ui';
import { ScrollArea } from '@verone/ui';
import { Skeleton } from '@verone/ui';
import { cn } from '@verone/utils';
import { createClient } from '@verone/utils/supabase/client';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ArrowLeftRight,
  ArrowDownLeft,
  ArrowUpRight,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  CheckCircle,
} from 'lucide-react';

import { useTransactionsUnreconciledCount } from '../../hooks';

// Type pour les transactions non rapprochées
interface UnreconciledTransaction {
  id: string;
  reference: string;
  amount: number;
  side: 'credit' | 'debit';
  label: string;
  emitted_at: string;
  counterparty_name: string | null;
}

interface TransactionItemProps {
  transaction: UnreconciledTransaction;
}

/**
 * Item individuel de transaction
 */
function TransactionItem({ transaction }: TransactionItemProps) {
  const isCredit = transaction.side === 'credit';
  const Icon = isCredit ? ArrowDownLeft : ArrowUpRight;
  const colorClass = isCredit ? 'text-green-600' : 'text-red-600';
  const bgClass = isCredit ? 'bg-green-50' : 'bg-red-50';
  const borderClass = isCredit ? 'border-green-200' : 'border-red-200';

  const formattedAmount = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(Math.abs(transaction.amount));

  const formattedDate = format(new Date(transaction.emitted_at), 'dd/MM', {
    locale: fr,
  });

  return (
    <Link
      href={`/finance/transactions/${transaction.id}`}
      className={cn(
        'group flex items-start gap-3 p-3 rounded-lg transition-all duration-150',
        'hover:bg-black/5 hover:translate-x-0.5',
        'border-l-2',
        borderClass
      )}
    >
      {/* Icône */}
      <div
        className={cn(
          'flex items-center justify-center w-8 h-8 rounded-md flex-shrink-0',
          bgClass
        )}
      >
        <Icon className={cn('h-4 w-4', colorClass)} />
      </div>

      {/* Contenu */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-sm truncate">
            {transaction.counterparty_name || transaction.label || 'Transaction'}
          </span>
          <span className={cn('font-semibold text-sm', colorClass)}>
            {isCredit ? '+' : '-'}{formattedAmount}
          </span>
        </div>

        <div className="flex items-center gap-2 mt-0.5 text-xs text-black/60">
          {transaction.reference && (
            <span className="font-mono truncate">{transaction.reference}</span>
          )}
        </div>

        <div className="text-[10px] text-black/40 mt-1">
          {formattedDate}
        </div>
      </div>

      {/* Flèche hover */}
      <ArrowRight
        className={cn(
          'h-4 w-4 text-black/20 transition-all duration-150',
          'group-hover:text-black group-hover:translate-x-0.5'
        )}
      />
    </Link>
  );
}

interface TransactionsUnreconciledDropdownProps {
  /** Trigger element (badge cliquable) */
  children: React.ReactNode;
  /** Nombre max de transactions affichées */
  maxItems?: number;
  /** Callback quand dropdown s'ouvre */
  onOpen?: () => void;
  /** Côté du popover */
  side?: 'top' | 'right' | 'bottom' | 'left';
  /** Alignement du popover */
  align?: 'start' | 'center' | 'end';
}

/**
 * Dropdown des transactions non rapprochées
 */
export function TransactionsUnreconciledDropdown({
  children,
  maxItems = 5,
  onOpen,
  side = 'right',
  align = 'start',
}: TransactionsUnreconciledDropdownProps) {
  const [open, setOpen] = useState(false);
  const [transactions, setTransactions] = useState<UnreconciledTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { count, refetch: refetchCount } = useTransactionsUnreconciledCount();
  const supabase = createClient();

  /**
   * Fetch transactions when dropdown opens
   */
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from('bank_transactions')
        .select(`
          id,
          reference,
          amount,
          side,
          label,
          emitted_at,
          counterparty_name
        `)
        .or('is_reconciled.is.null,is_reconciled.eq.false')
        .order('emitted_at', { ascending: false })
        .limit(maxItems);

      if (queryError) {
        throw new Error(queryError.message);
      }

      setTransactions((data as UnreconciledTransaction[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur chargement');
      console.error('[TransactionsUnreconciledDropdown] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase, maxItems]);

  useEffect(() => {
    if (open) {
      fetchTransactions();
      onOpen?.();
    }
  }, [open, fetchTransactions, onOpen]);

  const handleRefresh = async () => {
    await Promise.all([fetchTransactions(), refetchCount()]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>

      <PopoverContent
        side={side}
        align={align}
        className="w-80 p-0"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50/50">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="h-4 w-4 text-purple-500" />
            <span className="font-semibold text-sm">À rapprocher</span>
            {count > 0 && (
              <Badge className="bg-purple-500 text-white text-xs px-1.5 py-0">
                {count}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw
              className={cn('h-3.5 w-3.5', loading && 'animate-spin')}
            />
          </Button>
        </div>

        {/* Content */}
        <ScrollArea className="max-h-80">
          {loading && transactions.length === 0 ? (
            <div className="p-4 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded-md" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <AlertCircle className="h-8 w-8 mx-auto text-red-400 mb-2" />
              <p className="text-sm text-red-600">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="mt-2"
              >
                Réessayer
              </Button>
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-6 text-center">
              <CheckCircle className="h-8 w-8 mx-auto text-green-400 mb-2" />
              <p className="text-sm text-black/60">Tout est rapproché</p>
              <p className="text-xs text-black/40 mt-1">
                Aucune transaction en attente
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {transactions.map(transaction => (
                <TransactionItem key={transaction.id} transaction={transaction} />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {count > 0 && (
          <div className="border-t px-4 py-2 bg-gray-50/50">
            <Link
              href="/finance/transactions?reconciled=false"
              className="flex items-center justify-center gap-1.5 text-sm font-medium text-black hover:text-black/70 transition-colors"
              onClick={() => setOpen(false)}
            >
              Voir toutes les transactions
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
