'use client';

import { Label } from '@verone/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { spacing, colors } from '@verone/ui';
import { CreditCard } from 'lucide-react';
import { type UseFormReturn } from 'react-hook-form';

import { CURRENCIES, PAYMENT_TERMS_OPTIONS } from './constants';
import type { OrganisationFormData } from './types';

interface CommercialSectionProps {
  form: UseFormReturn<OrganisationFormData>;
  isSubmitting: boolean;
}

export function CommercialSection({
  form,
  isSubmitting,
}: CommercialSectionProps) {
  return (
    <div>
      <h3
        className="text-lg font-semibold flex items-center gap-2"
        style={{
          color: colors.text.DEFAULT,
          marginBottom: spacing[4],
        }}
      >
        <CreditCard className="h-5 w-5" />
        Informations commerciales
      </h3>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: spacing[4],
        }}
      >
        {/* Currency */}
        <div>
          <Label
            htmlFor="currency"
            className="text-sm font-medium"
            style={{
              color: colors.text.DEFAULT,
              display: 'block',
              marginBottom: spacing[2],
            }}
          >
            Devise
          </Label>
          <Select
            value={form.watch('currency')}
            onValueChange={value => form.setValue('currency', value)}
            disabled={isSubmitting}
          >
            <SelectTrigger
              style={{
                borderColor: colors.border.DEFAULT,
                color: colors.text.DEFAULT,
                borderRadius: '8px',
              }}
            >
              <SelectValue placeholder="Sélectionner une devise" />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map(currency => (
                <SelectItem key={currency.value} value={currency.value}>
                  {currency.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Payment Terms */}
        <div>
          <Label
            htmlFor="payment_terms"
            className="text-sm font-medium"
            style={{
              color: colors.text.DEFAULT,
              display: 'block',
              marginBottom: spacing[2],
            }}
          >
            Conditions de paiement
          </Label>
          <Select
            value={form.watch('payment_terms')}
            onValueChange={value => form.setValue('payment_terms', value)}
            disabled={isSubmitting}
          >
            <SelectTrigger
              style={{
                borderColor: colors.border.DEFAULT,
                color: colors.text.DEFAULT,
                borderRadius: '8px',
              }}
            >
              <SelectValue placeholder="Sélectionner des conditions" />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_TERMS_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
