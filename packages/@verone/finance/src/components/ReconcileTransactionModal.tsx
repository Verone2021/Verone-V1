'use client';

import { useCallback, useEffect, useState } from 'react';

import { useToast } from '@verone/common/hooks';
import { Button, Input, Label, Badge, Separator } from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@verone/ui';
import {
  ArrowDownRight,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Search,
} from 'lucide-react';

interface IQontoTransaction {
  transaction_id: string;
  amount: number;
  amount_cents: number;
  currency: string;
  side: 'credit' | 'debit';
  label: string;
  emitted_at: string;
  settled_at: string | null;
  status: string;
  reference?: string;
}

interface IReconcileTransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  invoiceNumber: string;
  invoiceAmount: number; // in cents
  currency?: string;
  onSuccess?: () => void;
}

type ReconcileStatus = 'idle' | 'loading' | 'reconciling' | 'success' | 'error';

function formatAmount(cents: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(cents / 100);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function ReconcileTransactionModal({
  open,
  onOpenChange,
  invoiceId,
  invoiceNumber,
  invoiceAmount,
  currency = 'EUR',
  onSuccess,
}: IReconcileTransactionModalProps): React.ReactNode {
  const { toast } = useToast();
  const [status, setStatus] = useState<ReconcileStatus>('idle');
  const [transactions, setTransactions] = useState<IQontoTransaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] =
    useState<IQontoTransaction | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Load transactions when modal opens
  useEffect(() => {
    if (open) {
      loadTransactions();
    }
  }, [open]);

  const loadTransactions = async () => {
    setStatus('loading');
    try {
      // Calculate amount range: +/- 10% of invoice amount
      const tolerance = Math.round(invoiceAmount * 0.1);
      const minAmount = Math.max(0, invoiceAmount - tolerance);
      const maxAmount = invoiceAmount + tolerance;

      const response = await fetch(
        `/api/qonto/transactions?side=credit&minAmount=${minAmount}&maxAmount=${maxAmount}&perPage=50`
      );
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || 'Erreur lors du chargement des transactions'
        );
      }

      setTransactions(data.transactions || []);
      setStatus('idle');
    } catch (error) {
      console.error('[ReconcileTransactionModal] Load error:', error);
      toast({
        title: 'Erreur',
        description:
          error instanceof Error
            ? error.message
            : 'Erreur lors du chargement des transactions',
        variant: 'destructive',
      });
      setStatus('error');
    }
  };

  const handleReconcile = useCallback(async () => {
    if (!selectedTransaction) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner une transaction',
        variant: 'destructive',
      });
      return;
    }

    setStatus('reconciling');

    try {
      const response = await fetch(
        `/api/qonto/invoices/${invoiceId}/reconcile`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            transactionId: selectedTransaction.transaction_id,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors du rapprochement');
      }

      setStatus('success');

      toast({
        title: 'Rapprochement effectué',
        description: `Facture ${invoiceNumber} rapprochée avec la transaction "${selectedTransaction.label}"`,
      });

      // Wait a bit then close
      setTimeout(() => {
        handleClose();
        onSuccess?.();
      }, 1500);
    } catch (error) {
      console.error('[ReconcileTransactionModal] Reconcile error:', error);
      setStatus('error');
      toast({
        title: 'Erreur',
        description:
          error instanceof Error
            ? error.message
            : 'Erreur lors du rapprochement',
        variant: 'destructive',
      });
      setTimeout(() => setStatus('idle'), 2000);
    }
  }, [selectedTransaction, invoiceId, invoiceNumber, toast, onSuccess]);

  const handleClose = useCallback(() => {
    setStatus('idle');
    setSelectedTransaction(null);
    setSearchTerm('');
    onOpenChange(false);
  }, [onOpenChange]);

  // Filter transactions by search term
  const filteredTransactions = transactions.filter(t => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      t.label.toLowerCase().includes(term) ||
      t.reference?.toLowerCase().includes(term)
    );
  });

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Rapprochement bancaire</DialogTitle>
          <DialogDescription>
            Sélectionnez la transaction correspondant à la facture{' '}
            {invoiceNumber}
            <br />
            <span className="font-medium">
              Montant attendu : {formatAmount(invoiceAmount, currency)}
            </span>
          </DialogDescription>
        </DialogHeader>

        {status === 'success' ? (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
            <p className="text-lg font-medium">Rapprochement effectué</p>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col gap-4 py-4">
            {/* Search */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une transaction..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={loadTransactions}
                disabled={status === 'loading'}
              >
                <RefreshCw
                  className={`h-4 w-4 ${status === 'loading' ? 'animate-spin' : ''}`}
                />
              </Button>
            </div>

            {/* Transaction list */}
            <div className="flex-1 overflow-y-auto border rounded-md">
              {status === 'loading' ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <p>Aucune transaction trouvée</p>
                  <p className="text-sm">
                    correspondant au montant de la facture
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredTransactions.map(transaction => {
                    const isSelected =
                      selectedTransaction?.transaction_id ===
                      transaction.transaction_id;
                    const amountDiff = Math.abs(
                      transaction.amount_cents - invoiceAmount
                    );
                    const isExactMatch = amountDiff === 0;

                    return (
                      <div
                        key={transaction.transaction_id}
                        onClick={() => setSelectedTransaction(transaction)}
                        className={`p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                          isSelected
                            ? 'bg-primary/10 border-l-2 border-primary'
                            : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <ArrowDownRight className="h-4 w-4 text-green-600 flex-shrink-0" />
                              <span className="font-medium truncate">
                                {transaction.label}
                              </span>
                              {isExactMatch && (
                                <Badge
                                  variant="outline"
                                  className="bg-green-50 text-green-700 border-green-200"
                                >
                                  Montant exact
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                              <span>{formatDate(transaction.emitted_at)}</span>
                              {transaction.reference && (
                                <>
                                  <span>•</span>
                                  <span className="truncate">
                                    Réf: {transaction.reference}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-medium text-green-600">
                              +
                              {formatAmount(
                                transaction.amount_cents,
                                transaction.currency
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Selected transaction summary */}
            {selectedTransaction && (
              <>
                <Separator />
                <div className="bg-muted/50 rounded-md p-3">
                  <Label className="text-xs text-muted-foreground">
                    Transaction sélectionnée
                  </Label>
                  <div className="flex justify-between items-center mt-1">
                    <span className="font-medium">
                      {selectedTransaction.label}
                    </span>
                    <span className="text-green-600 font-medium">
                      +
                      {formatAmount(
                        selectedTransaction.amount_cents,
                        selectedTransaction.currency
                      )}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <DialogFooter>
          {status !== 'success' && (
            <>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={status === 'reconciling'}
              >
                Annuler
              </Button>
              <Button
                onClick={handleReconcile}
                disabled={!selectedTransaction || status === 'reconciling'}
              >
                {status === 'reconciling' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Rapprochement...
                  </>
                ) : (
                  'Confirmer le rapprochement'
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
