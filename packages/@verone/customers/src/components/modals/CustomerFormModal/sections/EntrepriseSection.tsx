import { Building2 } from 'lucide-react';

import type { UseFormReturn } from 'react-hook-form';

import { Input, Label } from '@verone/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';

import { legalForms } from '../constants';
import type { CustomerFormData } from '../schema';

interface EntrepriseSectionProps {
  form: UseFormReturn<CustomerFormData>;
}

export function EntrepriseSection({ form }: EntrepriseSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium text-muted-foreground">
          Entreprise
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="name">Dénomination sociale *</Label>
          <Input
            id="name"
            {...form.register('name')}
            placeholder="Ex: SAS Mobilier Design"
            className="mt-1"
          />
          {form.formState.errors.name && (
            <p className="text-red-500 text-sm mt-1">
              {form.formState.errors.name.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="business_name">
            Nom commercial
            <span className="text-gray-400 ml-1 font-normal">
              (si différent)
            </span>
          </Label>
          <Input
            id="business_name"
            {...form.register('business_name')}
            placeholder="Ex: Pokawa Paris 1"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="legal_form">Forme juridique</Label>
          <Select
            value={form.watch('legal_form')}
            onValueChange={value => form.setValue('legal_form', value)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Sélectionner..." />
            </SelectTrigger>
            <SelectContent>
              {legalForms.map(lf => (
                <SelectItem key={lf} value={lf}>
                  {lf}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
