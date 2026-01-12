'use client';

import { useCallback, useState } from 'react';

import { useToast } from '@verone/common/hooks';
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@verone/ui';
import { CheckCircle2, Loader2 } from 'lucide-react';

interface IPaymentRecordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  invoiceNumber: string;
  totalAmount: number;
  currency?: string;
  onSuccess?: () => void;
}

type RecordStatus = 'idle' | 'recording' | 'success' | 'error';

type PaymentMethod = 'card' | 'transfer' | 'check' | 'cash';

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'card', label: 'Carte bancaire' },
  { value: 'transfer', label: 'Virement' },
  { value: 'check', label: 'Chèque' },
  { value: 'cash', label: 'Espèces' },
];

function formatAmount(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(amount);
}

function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function PaymentRecordModal({
  open,
  onOpenChange,
  invoiceId,
  invoiceNumber,
  totalAmount,
  currency = 'EUR',
  onSuccess,
}: IPaymentRecordModalProps): React.ReactNode {
  const { toast } = useToast();
  const [status, setStatus] = useState<RecordStatus>('idle');

  // Form fields
  const [amount, setAmount] = useState<string>(totalAmount.toString());
  const [paymentDate, setPaymentDate] = useState<string>(
    formatDateForInput(new Date())
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('transfer');
  const [reference, setReference] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const isPartialPayment =
    parseFloat(amount) > 0 && parseFloat(amount) < totalAmount;
  const remainingAmount = totalAmount - parseFloat(amount || '0');

  const resetForm = useCallback(() => {
    setAmount(totalAmount.toString());
    setPaymentDate(formatDateForInput(new Date()));
    setPaymentMethod('transfer');
    setReference('');
    setNotes('');
    setStatus('idle');
  }, [totalAmount]);

  const handleClose = useCallback(() => {
    resetForm();
    onOpenChange(false);
  }, [resetForm, onOpenChange]);

  const handleRecordPayment = useCallback(async () => {
    const amountValue = parseFloat(amount);

    if (isNaN(amountValue) || amountValue <= 0) {
      toast({
        title: 'Erreur',
        description: 'Le montant doit être supérieur à 0',
        variant: 'destructive',
      });
      return;
    }

    if (amountValue > totalAmount) {
      toast({
        title: 'Erreur',
        description: 'Le montant ne peut pas dépasser le total de la facture',
        variant: 'destructive',
      });
      return;
    }

    setStatus('recording');

    try {
      // Call mark-paid API
      const response = await fetch(
        `/api/qonto/invoices/${invoiceId}/mark-paid`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: amountValue,
            payment_date: paymentDate,
            payment_method: paymentMethod,
            reference,
            notes,
            is_partial: isPartialPayment,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Erreur lors de l'enregistrement du paiement"
        );
      }

      setStatus('success');

      toast({
        title: 'Paiement enregistré',
        description: isPartialPayment
          ? `Paiement partiel de ${formatAmount(amountValue, currency)} enregistré. Reste à payer : ${formatAmount(remainingAmount, currency)}`
          : `Facture ${invoiceNumber} marquée comme payée`,
      });

      // Wait a bit then close
      setTimeout(() => {
        handleClose();
        onSuccess?.();
      }, 1500);
    } catch (error) {
      console.error('[PaymentRecordModal] Error:', error);
      setStatus('error');
      toast({
        title: 'Erreur',
        description:
          error instanceof Error
            ? error.message
            : "Erreur lors de l'enregistrement",
        variant: 'destructive',
      });
      // Reset to idle after error
      setTimeout(() => setStatus('idle'), 2000);
    }
  }, [
    amount,
    totalAmount,
    invoiceId,
    paymentDate,
    paymentMethod,
    reference,
    notes,
    isPartialPayment,
    remainingAmount,
    currency,
    invoiceNumber,
    toast,
    handleClose,
    onSuccess,
  ]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Enregistrer un paiement</DialogTitle>
          <DialogDescription>
            Enregistrer un paiement pour la facture {invoiceNumber}
          </DialogDescription>
        </DialogHeader>

        {status === 'success' ? (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
            <p className="text-lg font-medium">Paiement enregistré</p>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Montant</Label>
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  max={totalAmount}
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="pr-12"
                  disabled={status === 'recording'}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  {currency}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Total facture : {formatAmount(totalAmount, currency)}
              </p>
              {isPartialPayment && (
                <p className="text-sm text-amber-600">
                  Paiement partiel - Reste à payer :{' '}
                  {formatAmount(remainingAmount, currency)}
                </p>
              )}
            </div>

            {/* Payment Date */}
            <div className="space-y-2">
              <Label htmlFor="payment-date">Date du paiement</Label>
              <Input
                id="payment-date"
                type="date"
                value={paymentDate}
                onChange={e => setPaymentDate(e.target.value)}
                disabled={status === 'recording'}
              />
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label htmlFor="payment-method">Méthode de paiement</Label>
              <Select
                value={paymentMethod}
                onValueChange={value =>
                  setPaymentMethod(value as PaymentMethod)
                }
                disabled={status === 'recording'}
              >
                <SelectTrigger id="payment-method">
                  <SelectValue placeholder="Sélectionner une méthode" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map(method => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Reference (optional) */}
            <div className="space-y-2">
              <Label htmlFor="reference">
                Référence{' '}
                <span className="text-muted-foreground">(optionnel)</span>
              </Label>
              <Input
                id="reference"
                placeholder="N° de chèque, référence virement..."
                value={reference}
                onChange={e => setReference(e.target.value)}
                disabled={status === 'recording'}
              />
            </div>

            {/* Notes (optional) */}
            <div className="space-y-2">
              <Label htmlFor="notes">
                Notes <span className="text-muted-foreground">(optionnel)</span>
              </Label>
              <Input
                id="notes"
                placeholder="Notes internes..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                disabled={status === 'recording'}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          {status !== 'success' && (
            <>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={status === 'recording'}
              >
                Annuler
              </Button>
              <Button
                onClick={handleRecordPayment}
                disabled={status === 'recording'}
              >
                {status === 'recording' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  'Enregistrer le paiement'
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
