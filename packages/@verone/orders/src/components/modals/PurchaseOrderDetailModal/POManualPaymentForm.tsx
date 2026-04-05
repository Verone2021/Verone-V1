'use client';

import { ButtonV2 } from '@verone/ui';
import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';

import type { ManualPaymentType } from '@verone/orders/hooks';

interface POManualPaymentFormProps {
  unifiedRemaining: number;
  manualPaymentType: ManualPaymentType;
  setManualPaymentType: (v: ManualPaymentType) => void;
  manualPaymentAmount: string;
  setManualPaymentAmount: (v: string) => void;
  manualPaymentDate: string;
  setManualPaymentDate: (v: string) => void;
  manualPaymentRef: string;
  setManualPaymentRef: (v: string) => void;
  manualPaymentNote: string;
  setManualPaymentNote: (v: string) => void;
  paymentSubmitting: boolean;
  onSubmit: () => void;
}

export function POManualPaymentForm({
  unifiedRemaining,
  manualPaymentType,
  setManualPaymentType,
  manualPaymentAmount,
  setManualPaymentAmount,
  manualPaymentDate,
  setManualPaymentDate,
  manualPaymentRef,
  setManualPaymentRef,
  manualPaymentNote,
  setManualPaymentNote,
  paymentSubmitting,
  onSubmit,
}: POManualPaymentFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="po-payment-type">Type de paiement</Label>
        <Select
          value={manualPaymentType}
          onValueChange={v => setManualPaymentType(v as ManualPaymentType)}
        >
          <SelectTrigger id="po-payment-type">
            <SelectValue placeholder="Sélectionner..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="transfer_other">Virement bancaire</SelectItem>
            <SelectItem value="cash">Espèces</SelectItem>
            <SelectItem value="check">Chèque</SelectItem>
            <SelectItem value="card">Carte bancaire</SelectItem>
            <SelectItem value="compensation">Compensation</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="po-payment-amount">
          Montant (EUR)
          {unifiedRemaining > 0 && (
            <span className="text-muted-foreground font-normal ml-1">
              — Reste a payer : {unifiedRemaining.toFixed(2)} EUR
            </span>
          )}
        </Label>
        <Input
          id="po-payment-amount"
          type="number"
          step="0.01"
          min="0.01"
          max={unifiedRemaining}
          value={manualPaymentAmount}
          onChange={e => setManualPaymentAmount(e.target.value)}
        />
        {parseFloat(manualPaymentAmount) > unifiedRemaining + 0.01 && (
          <p className="text-sm text-destructive">
            Le montant dépasse le reste à payer ({unifiedRemaining.toFixed(2)}{' '}
            EUR)
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="po-payment-date">Date du paiement</Label>
        <Input
          id="po-payment-date"
          type="date"
          value={manualPaymentDate}
          onChange={e => setManualPaymentDate(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="po-payment-ref">
          Reference{' '}
          <span className="text-gray-400 font-normal">(optionnel)</span>
        </Label>
        <Input
          id="po-payment-ref"
          placeholder="N° chèque, réf. virement..."
          value={manualPaymentRef}
          onChange={e => setManualPaymentRef(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="po-payment-note">
          Note <span className="text-gray-400 font-normal">(optionnel)</span>
        </Label>
        <Input
          id="po-payment-note"
          placeholder="Commentaire..."
          value={manualPaymentNote}
          onChange={e => setManualPaymentNote(e.target.value)}
        />
      </div>

      <ButtonV2
        onClick={onSubmit}
        disabled={
          paymentSubmitting ||
          !manualPaymentAmount ||
          parseFloat(manualPaymentAmount) <= 0 ||
          parseFloat(manualPaymentAmount) > unifiedRemaining + 0.01 ||
          unifiedRemaining <= 0
        }
        className="w-full bg-green-600 hover:bg-green-700"
      >
        {paymentSubmitting ? 'Enregistrement...' : 'Enregistrer le paiement'}
      </ButtonV2>
    </div>
  );
}
