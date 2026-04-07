import { CreditCard } from 'lucide-react';

import type { UseFormReturn } from 'react-hook-form';

import { Label, Switch } from '@verone/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';

import { currencies, paymentTermsOptions } from '../constants';
import type { CustomerFormData } from '../schema';

interface CommercialSectionProps {
  form: UseFormReturn<CustomerFormData>;
}

export function CommercialSection({ form }: CommercialSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <CreditCard className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium text-muted-foreground">
          Commercial
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="payment_terms">Conditions de paiement</Label>
          <Select
            value={form.watch('payment_terms')}
            onValueChange={value =>
              form.setValue('payment_terms', value as '0' | '30' | '60' | '90')
            }
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Sélectionner..." />
            </SelectTrigger>
            <SelectContent>
              {paymentTermsOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="currency">Devise</Label>
          <Select
            value={form.watch('currency')}
            onValueChange={value => form.setValue('currency', value)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Sélectionner..." />
            </SelectTrigger>
            <SelectContent>
              {currencies.map(currency => (
                <SelectItem key={currency.code} value={currency.code}>
                  {currency.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end pb-1">
          <div className="flex items-center space-x-3">
            <Switch
              id="is_active"
              checked={form.watch('is_active')}
              onCheckedChange={checked => form.setValue('is_active', checked)}
            />
            <Label htmlFor="is_active" className="text-sm font-medium">
              Client actif
            </Label>
          </div>
        </div>
      </div>

      {form.watch('payment_terms') === '0' && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="flex items-center space-x-3">
            <Switch
              id="prepayment_required"
              checked={form.watch('prepayment_required')}
              onCheckedChange={checked =>
                form.setValue('prepayment_required', checked)
              }
            />
            <div className="flex-1">
              <Label
                htmlFor="prepayment_required"
                className="text-gray-900 font-medium text-sm"
              >
                Prépaiement obligatoire
              </Label>
              <p className="text-xs text-gray-500">
                {form.watch('prepayment_required')
                  ? "Commande bloquée jusqu'au règlement préalable"
                  : 'Envoi et facturation simultanés'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
