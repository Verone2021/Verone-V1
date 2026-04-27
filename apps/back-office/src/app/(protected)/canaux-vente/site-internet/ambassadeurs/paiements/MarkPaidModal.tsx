'use client';

import { useState } from 'react';

import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from '@verone/ui';
import { Loader2 } from 'lucide-react';

import {
  formatEur,
  useMarkAttributionsPaid,
  type PayableAmbassador,
} from '../../hooks/use-pending-payouts';

// ============================================
// Props
// ============================================

interface MarkPaidModalProps {
  ambassador: PayableAmbassador | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ============================================
// Component
// ============================================

export function MarkPaidModal({
  ambassador,
  open,
  onOpenChange,
}: MarkPaidModalProps) {
  const [paymentDate, setPaymentDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [paymentReference, setPaymentReference] = useState('');

  const markPaid = useMarkAttributionsPaid(ambassador?.id ?? '');

  if (!ambassador) return null;

  const attributionIds = ambassador.validatedAttributions.map(a => a.id);
  const totalAmount = ambassador.validatedAttributions.reduce(
    (sum, a) => sum + Number(a.prime_amount),
    0
  );

  const handleSubmit = () => {
    if (!paymentDate || !paymentReference.trim()) return;

    void markPaid
      .mutateAsync({
        attribution_ids: attributionIds,
        payment_reference: paymentReference.trim(),
        payment_date: paymentDate,
      })
      .then(() => {
        onOpenChange(false);
        setPaymentReference('');
        setPaymentDate(new Date().toISOString().slice(0, 10));
      })
      .catch((err: unknown) => {
        console.error('[MarkPaidModal] markPaid failed:', err);
      });
  };

  const isValid =
    paymentDate.length === 10 && paymentReference.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-screen md:h-auto md:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Marquer payé — {ambassador.first_name} {ambassador.last_name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto md:max-h-[60vh] space-y-4 py-2">
          {/* Summary */}
          <div className="rounded-lg bg-muted/50 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Attributions validées
              </span>
              <span className="font-medium">{attributionIds.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Solde disponible</span>
              <span className="font-medium text-green-700">
                {formatEur(ambassador.current_balance)}
              </span>
            </div>
            <div className="flex justify-between text-sm border-t pt-2">
              <span className="font-semibold">Total à virer</span>
              <span className="font-bold text-lg">
                {formatEur(totalAmount)}
              </span>
            </div>
          </div>

          {/* Bank details */}
          <div className="space-y-1">
            <p className="text-sm font-medium">Coordonnées bancaires</p>
            {ambassador.iban ? (
              <div className="text-sm text-muted-foreground space-y-0.5">
                <div>
                  <span className="font-medium">IBAN : </span>
                  <span className="font-mono">
                    {ambassador.iban.slice(0, -4).replace(/./g, '•')}
                    {ambassador.iban.slice(-4)}
                  </span>
                </div>
                {ambassador.bic && (
                  <div>
                    <span className="font-medium">BIC : </span>
                    {ambassador.bic}
                  </div>
                )}
                {ambassador.bank_name && (
                  <div>
                    <span className="font-medium">Banque : </span>
                    {ambassador.bank_name}
                  </div>
                )}
                {ambassador.account_holder_name && (
                  <div>
                    <span className="font-medium">Titulaire : </span>
                    {ambassador.account_holder_name}
                  </div>
                )}
              </div>
            ) : (
              <Badge variant="destructive" className="text-xs">
                IBAN manquant
              </Badge>
            )}
            {ambassador.siret_required && (
              <div className="mt-1">
                {ambassador.siret ? (
                  <span className="text-sm text-muted-foreground">
                    SIRET : {ambassador.siret}
                  </span>
                ) : (
                  <Badge variant="destructive" className="text-xs">
                    SIRET requis manquant
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Payment fields */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="payment-date">Date de virement</Label>
              <Input
                id="payment-date"
                type="date"
                value={paymentDate}
                onChange={e => setPaymentDate(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="payment-ref">Référence virement</Label>
              <Input
                id="payment-ref"
                type="text"
                placeholder="Ex: VIR2026-042601"
                value={paymentReference}
                onChange={e => setPaymentReference(e.target.value)}
                className="w-full"
                maxLength={255}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 md:flex-row">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full md:w-auto"
            disabled={markPaid.isPending}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || markPaid.isPending}
            className="w-full md:w-auto"
          >
            {markPaid.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              `Confirmer le paiement (${formatEur(totalAmount)})`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
