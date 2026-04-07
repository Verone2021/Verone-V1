import { FileText } from 'lucide-react';

import type { UseFormReturn } from 'react-hook-form';

import { Input, Label } from '@verone/ui';

import type { CustomerFormData } from '../schema';

interface LegalSectionProps {
  form: UseFormReturn<CustomerFormData>;
}

export function LegalSection({ form }: LegalSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium text-muted-foreground">Légal</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="siren">SIREN</Label>
          <Input
            id="siren"
            {...form.register('siren')}
            placeholder="123 456 789"
            maxLength={9}
            className="mt-1"
          />
          {form.formState.errors.siren && (
            <p className="text-red-500 text-sm mt-1">
              {form.formState.errors.siren.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="siret">SIRET</Label>
          <Input
            id="siret"
            {...form.register('siret')}
            placeholder="123 456 789 00012"
            maxLength={14}
            className="mt-1"
          />
          {form.formState.errors.siret && (
            <p className="text-red-500 text-sm mt-1">
              {form.formState.errors.siret.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="vat_number">TVA intracommunautaire</Label>
          <Input
            id="vat_number"
            {...form.register('vat_number')}
            placeholder="FR12345678901"
            className="mt-1"
          />
        </div>
      </div>
    </div>
  );
}
