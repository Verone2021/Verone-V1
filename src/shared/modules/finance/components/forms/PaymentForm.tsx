// =====================================================================
// Composant: PaymentForm
// Date: 2025-10-11
// Description: Formulaire enregistrement paiement avec validation Zod
// =====================================================================

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ButtonV2 } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/shared/modules/common/hooks';
import { DollarSign, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

// =====================================================================
// VALIDATION SCHEMA
// =====================================================================

const paymentFormSchema = z.object({
  invoiceId: z.string().uuid('ID facture invalide'),
  amount: z
    .string()
    .min(1, 'Montant requis')
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: 'Montant doit être supérieur à 0',
    }),
  paymentDate: z.string().min(1, 'Date de paiement requise'),
  paymentMethod: z.enum(['bank_transfer', 'check', 'cash', 'card', 'other'], {
    message: 'Méthode de paiement requise',
  }),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

// =====================================================================
// TYPE PROPS
// =====================================================================

interface PaymentFormProps {
  invoiceId: string;
  invoiceNumber: string;
  remainingAmount: number; // Montant restant dû
  onSuccess?: () => void;
}

// =====================================================================
// COMPOSANT
// =====================================================================

export function PaymentForm({
  invoiceId,
  invoiceNumber,
  remainingAmount,
  onSuccess,
}: PaymentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  // Initialiser formulaire
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      invoiceId,
      amount: remainingAmount.toFixed(2),
      paymentDate: new Date().toISOString().split('T')[0], // Date du jour
      paymentMethod: 'bank_transfer',
      reference: '',
      notes: '',
    },
  });

  // Handler submit
  const onSubmit = async (values: PaymentFormValues) => {
    setIsSubmitting(true);

    try {
      // Insérer paiement dans table payments
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          invoice_id: values.invoiceId,
          amount_paid: parseFloat(values.amount),
          payment_date: values.paymentDate,
          payment_method: values.paymentMethod,
          reference: values.reference || null,
          notes: values.notes || null,
        })
        .select()
        .single();

      if (paymentError) {
        throw paymentError;
      }

      // Calculer nouveau montant payé
      const { data: currentInvoice, error: fetchError } = await supabase
        .from('invoices')
        .select('amount_paid, total_ttc')
        .eq('id', values.invoiceId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      const newAmountPaid = ((currentInvoice as any).amount_paid || 0) + parseFloat(values.amount);
      const newStatus =
        newAmountPaid >= (currentInvoice as any).total_ttc
          ? 'paid'
          : newAmountPaid > 0
            ? 'partially_paid'
            : 'sent';

      // Mettre à jour facture
      const { error: updateError } = await supabase
        .from('invoices')
        .update({
          amount_paid: newAmountPaid,
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', values.invoiceId);

      if (updateError) {
        throw updateError;
      }

      // Succès
      toast({
        title: 'Paiement enregistré',
        description: `Paiement de ${parseFloat(values.amount).toFixed(2)}€ enregistré pour la facture ${invoiceNumber}`,
      });

      // Reset formulaire
      form.reset();

      // Callback succès
      onSuccess?.();
    } catch (error) {
      console.error('Erreur enregistrement paiement:', error);

      toast({
        title: 'Erreur',
        description:
          error instanceof Error
            ? error.message
            : 'Impossible d\'enregistrer le paiement',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Formater montant
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enregistrer un paiement</CardTitle>
        <CardDescription>
          Facture {invoiceNumber} • Montant restant dû: {formatAmount(remainingAmount)}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Montant */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Montant du paiement (€)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={remainingAmount}
                        placeholder="0.00"
                        className="pl-9"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Montant maximum: {formatAmount(remainingAmount)}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date paiement */}
            <FormField
              control={form.control}
              name="paymentDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date du paiement</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Méthode paiement */}
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Méthode de paiement</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une méthode" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="bank_transfer">Virement bancaire</SelectItem>
                      <SelectItem value="check">Chèque</SelectItem>
                      <SelectItem value="cash">Espèces</SelectItem>
                      <SelectItem value="card">Carte bancaire</SelectItem>
                      <SelectItem value="other">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Référence (optionnel) */}
            <FormField
              control={form.control}
              name="reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Référence (optionnel)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Numéro de transaction, chèque..."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Référence bancaire, numéro de chèque, etc.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes (optionnel) */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optionnel)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Informations complémentaires..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit */}
            <div className="flex justify-end gap-2">
              <ButtonV2
                type="button"
                variant="outline"
                onClick={() => form.reset()}
                disabled={isSubmitting}
              >
                Réinitialiser
              </ButtonV2>
              <ButtonV2 type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <DollarSign className="mr-2 h-4 w-4" />
                    Enregistrer paiement
                  </>
                )}
              </ButtonV2>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
