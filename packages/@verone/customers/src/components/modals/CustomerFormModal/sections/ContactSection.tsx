import { Mail } from 'lucide-react';

import type { UseFormReturn } from 'react-hook-form';

import { Input, Label } from '@verone/ui';

import type { CustomerFormData } from '../schema';

interface ContactSectionProps {
  form: UseFormReturn<CustomerFormData>;
}

export function ContactSection({ form }: ContactSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Mail className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium text-muted-foreground">Contact</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...form.register('email')}
            placeholder="contact@entreprise.com"
            className="mt-1"
          />
          {form.formState.errors.email && (
            <p className="text-red-500 text-sm mt-1">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="phone">Téléphone</Label>
          <Input
            id="phone"
            {...form.register('phone')}
            placeholder="01 23 45 67 89"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="website">Site web</Label>
          <Input
            id="website"
            type="url"
            {...form.register('website')}
            placeholder="https://www.entreprise.com"
            className="mt-1"
          />
          {form.formState.errors.website && (
            <p className="text-red-500 text-sm mt-1">
              {form.formState.errors.website.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
