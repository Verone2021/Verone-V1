'use client';

import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { Switch } from '@verone/ui';
import { Textarea } from '@verone/ui';
import type { UseFormReturn } from 'react-hook-form';

import type { ContactFormData } from './contact-form-schema';
import { COMMUNICATION_METHODS, LANGUAGE_OPTIONS } from './contact-form-schema';

type FormProps = { form: UseFormReturn<ContactFormData> };

export function ContactPersonalSection({ form }: FormProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-black border-b pb-2">
        Informations personnelles
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="first_name">Prénom *</Label>
          <Input
            id="first_name"
            {...form.register('first_name')}
            placeholder="Ex: Jean"
            className="mt-1"
          />
          {form.formState.errors.first_name && (
            <p className="text-red-500 text-sm mt-1">
              {form.formState.errors.first_name.message}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="last_name">Nom de famille *</Label>
          <Input
            id="last_name"
            {...form.register('last_name')}
            placeholder="Ex: Dupont"
            className="mt-1"
          />
          {form.formState.errors.last_name && (
            <p className="text-red-500 text-sm mt-1">
              {form.formState.errors.last_name.message}
            </p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title">Titre/Poste</Label>
          <Input
            id="title"
            {...form.register('title')}
            placeholder="Ex: Directeur Commercial"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="department">Service/Département</Label>
          <Input
            id="department"
            {...form.register('department')}
            placeholder="Ex: Commercial"
            className="mt-1"
          />
        </div>
      </div>
    </div>
  );
}

export function ContactMainSection({ form }: FormProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-black border-b pb-2">
        Contact principal
      </h3>
      <div>
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          {...form.register('email')}
          placeholder="jean.dupont@entreprise.com"
          className="mt-1"
        />
        {form.formState.errors.email && (
          <p className="text-red-500 text-sm mt-1">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="phone">Téléphone fixe</Label>
          <Input
            id="phone"
            {...form.register('phone')}
            placeholder="01 23 45 67 89"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="mobile">Téléphone mobile</Label>
          <Input
            id="mobile"
            {...form.register('mobile')}
            placeholder="06 12 34 56 78"
            className="mt-1"
          />
        </div>
      </div>
    </div>
  );
}

export function ContactSecondarySection({ form }: FormProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-black border-b pb-2">
        Contact secondaire (optionnel)
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="secondary_email">Email secondaire</Label>
          <Input
            id="secondary_email"
            type="email"
            {...form.register('secondary_email')}
            placeholder="jean.dupont.backup@entreprise.com"
            className="mt-1"
          />
          {form.formState.errors.secondary_email && (
            <p className="text-red-500 text-sm mt-1">
              {form.formState.errors.secondary_email.message}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="direct_line">Ligne directe</Label>
          <Input
            id="direct_line"
            {...form.register('direct_line')}
            placeholder="01 23 45 67 90"
            className="mt-1"
          />
        </div>
      </div>
    </div>
  );
}

export function ContactRolesSection({ form }: FormProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-black border-b pb-2">
        Rôles et responsabilités
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <Switch
              id="is_primary_contact"
              checked={form.watch('is_primary_contact')}
              onCheckedChange={checked =>
                form.setValue('is_primary_contact', checked)
              }
            />
            <div>
              <Label htmlFor="is_primary_contact" className="font-medium">
                Contact principal
              </Label>
              <p className="text-xs text-gray-600">
                Contact prioritaire pour cette organisation
              </p>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <Switch
              id="is_billing_contact"
              checked={form.watch('is_billing_contact')}
              onCheckedChange={checked =>
                form.setValue('is_billing_contact', checked)
              }
            />
            <div>
              <Label htmlFor="is_billing_contact" className="font-medium">
                Contact facturation
              </Label>
              <p className="text-xs text-gray-600">Factures et paiements</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Switch
              id="is_technical_contact"
              checked={form.watch('is_technical_contact')}
              onCheckedChange={checked =>
                form.setValue('is_technical_contact', checked)
              }
            />
            <div>
              <Label htmlFor="is_technical_contact" className="font-medium">
                Contact technique
              </Label>
              <p className="text-xs text-gray-600">Support et spécifications</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ContactPreferencesSection({ form }: FormProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-black border-b pb-2">
        Préférences de communication
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="preferred_communication_method">
            Méthode préférée
          </Label>
          <Select
            value={form.watch('preferred_communication_method')}
            onValueChange={value =>
              form.setValue(
                'preferred_communication_method',
                value as 'email' | 'phone' | 'both'
              )
            }
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Sélectionner..." />
            </SelectTrigger>
            <SelectContent>
              {COMMUNICATION_METHODS.map(method => (
                <SelectItem key={method.value} value={method.value}>
                  {method.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="language_preference">Langue préférée</Label>
          <Select
            value={form.watch('language_preference')}
            onValueChange={value => form.setValue('language_preference', value)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Sélectionner..." />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGE_OPTIONS.map(language => (
                <SelectItem key={language.value} value={language.value}>
                  {language.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex items-center space-x-3">
          <Switch
            id="accepts_marketing"
            checked={form.watch('accepts_marketing')}
            onCheckedChange={checked =>
              form.setValue('accepts_marketing', checked)
            }
          />
          <div>
            <Label htmlFor="accepts_marketing" className="font-medium">
              Communications marketing
            </Label>
            <p className="text-xs text-gray-600">
              Newsletters et offres commerciales
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Switch
            id="accepts_notifications"
            checked={form.watch('accepts_notifications')}
            onCheckedChange={checked =>
              form.setValue('accepts_notifications', checked)
            }
          />
          <div>
            <Label htmlFor="accepts_notifications" className="font-medium">
              Notifications système
            </Label>
            <p className="text-xs text-gray-600">
              Alertes et mises à jour importantes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ContactNotesSection({ form }: FormProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-black border-b pb-2">Notes</h3>
      <div>
        <Label htmlFor="notes">Notes libres</Label>
        <Textarea
          id="notes"
          {...form.register('notes')}
          placeholder="Informations complémentaires sur ce contact..."
          className="mt-1"
          rows={3}
        />
      </div>
    </div>
  );
}
