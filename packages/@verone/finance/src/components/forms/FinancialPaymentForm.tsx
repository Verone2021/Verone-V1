/**
 * Composant: FinancialPaymentForm
 * Description: Formulaire paiement unifié (AR + AP)
 *
 * Support:
 * - Paiements factures clients
 * - Paiements factures fournisseurs
 * - Paiements dépenses
 */

'use client';

import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Popover, PopoverContent, PopoverTrigger } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Calendar } from '@verone/ui';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@verone/ui';
import { Input } from '@verone/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { Textarea } from '@verone/ui';
import { cn } from '@verone/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import {
  useFinancialPayments,
  type PaymentMethod,
} from '../../hooks/use-financial-payments';

// =====================================================================
// SCHEMA VALIDATION
// =====================================================================

const paymentFormSchema = z.object({
  amount_paid: z
    .number()
    .positive('Le montant doit être positif')
    .max(999999, 'Montant trop élevé'),

  payment_date: z.date({
    message: 'La date de paiement est requise',
  }),

  payment_method: z.enum(
    ['virement', 'carte', 'cheque', 'especes', 'prelevement', 'other'],
    {
      message: 'La méthode de paiement est requise',
    }
  ),

  transaction_reference: z.string().optional(),

  notes: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

// =====================================================================
// TYPES
// =====================================================================

interface FinancialPaymentFormProps {
  documentId: string;
  documentNumber: string;
  remainingAmount: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// =====================================================================
// COMPOSANT
// =====================================================================

export function FinancialPaymentForm({
  documentId,
  documentNumber,
  remainingAmount,
  onSuccess,
  onCancel,
}: FinancialPaymentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { recordPayment } = useFinancialPayments(documentId);

  // Form setup
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      amount_paid: remainingAmount,
      payment_date: new Date(),
      payment_method: 'virement',
      transaction_reference: '',
      notes: '',
    },
  });

  // Submit handler
  const onSubmit = async (values: PaymentFormValues) => {
    try {
      setIsSubmitting(true);

      await recordPayment?.({
        document_id: documentId,
        amount_paid: values.amount_paid,
        payment_date: format(values.payment_date, 'yyyy-MM-dd'),
        payment_method: values.payment_method as PaymentMethod,
        transaction_reference: values.transaction_reference,
        notes: values.notes,
      });

      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error('Payment record error:', error);
      // Toast error déjà géré dans le hook
    } finally {
      setIsSubmitting(false);
    }
  };

  // Payment methods options
  const paymentMethods: { value: PaymentMethod; label: string }[] = [
    { value: 'virement', label: 'Virement bancaire' },
    { value: 'carte', label: 'Carte bancaire' },
    { value: 'cheque', label: 'Chèque' },
    { value: 'especes', label: 'Espèces' },
    { value: 'prelevement', label: 'Prélèvement' },
    { value: 'other', label: 'Autre' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold">Enregistrer un paiement</h3>
        <p className="text-sm text-gray-500">
          Document : {documentNumber} • Restant dû :{' '}
          {remainingAmount.toFixed(2)} €
        </p>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Montant */}
          <FormField
            control={form.control}
            name="amount_paid"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Montant payé *</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      onChange={e => field.onChange(parseFloat(e.target.value))}
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                      €
                    </span>
                  </div>
                </FormControl>
                <FormDescription>
                  Montant maximum : {remainingAmount.toFixed(2)} €
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Date paiement */}
          <FormField
            control={form.control}
            name="payment_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date de paiement *</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <ButtonV2
                        variant="outline"
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !field.value && 'text-gray-500'
                        )}
                      >
                        {field.value ? (
                          format(field.value, 'PPP', { locale: fr })
                        ) : (
                          <span>Sélectionner une date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </ButtonV2>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={date =>
                        date > new Date() || date < new Date('1900-01-01')
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Méthode paiement */}
          <FormField
            control={form.control}
            name="payment_method"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Méthode de paiement *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une méthode" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {paymentMethods.map(method => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Référence transaction */}
          <FormField
            control={form.control}
            name="transaction_reference"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Référence transaction</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: VIR-2025-001234" {...field} />
                </FormControl>
                <FormDescription>
                  Référence bancaire ou numéro de transaction
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Notes */}
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Notes complémentaires sur ce paiement..."
                    className="resize-none"
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <ButtonV2 type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                'Enregistrer le paiement'
              )}
            </ButtonV2>

            {onCancel && (
              <ButtonV2
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Annuler
              </ButtonV2>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
