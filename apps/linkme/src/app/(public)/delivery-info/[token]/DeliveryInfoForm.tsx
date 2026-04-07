'use client';

import { Button, Input, Label, Separator } from '@verone/ui';
import { User, Mail, Phone, Calendar } from 'lucide-react';

import type { DeliveryFormState } from './delivery-info.types';

interface DeliveryInfoFormProps {
  form: DeliveryFormState;
  setForm: React.Dispatch<React.SetStateAction<DeliveryFormState>>;
  isSubmitting: boolean;
  submitError: string | null;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

export function DeliveryInfoForm({
  form,
  setForm,
  isSubmitting,
  submitError,
  onSubmit,
}: DeliveryInfoFormProps) {
  const set = <K extends keyof DeliveryFormState>(
    key: K,
    value: DeliveryFormState[K]
  ) => setForm(prev => ({ ...prev, [key]: value }));

  return (
    <form
      onSubmit={e => {
        void onSubmit(e).catch(error => {
          console.error('[DeliveryInfo] Submit failed:', error);
        });
      }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="receptionName" className="flex items-center gap-1">
          <User className="h-4 w-4" />
          Nom complet *
        </Label>
        <Input
          id="receptionName"
          value={form.receptionName}
          onChange={e => set('receptionName', e.target.value)}
          placeholder="Jean Dupont"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="receptionEmail" className="flex items-center gap-1">
          <Mail className="h-4 w-4" />
          Email *
        </Label>
        <Input
          id="receptionEmail"
          type="email"
          value={form.receptionEmail}
          onChange={e => set('receptionEmail', e.target.value)}
          placeholder="jean.dupont@restaurant.fr"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="receptionPhone" className="flex items-center gap-1">
          <Phone className="h-4 w-4" />
          Téléphone
        </Label>
        <Input
          id="receptionPhone"
          type="tel"
          value={form.receptionPhone}
          onChange={e => set('receptionPhone', e.target.value)}
          placeholder="06 12 34 56 78"
        />
      </div>

      <Separator />

      <div className="space-y-2">
        <Label
          htmlFor="desiredDeliveryDate"
          className="flex items-center gap-1"
        >
          <Calendar className="h-4 w-4" />
          Date de livraison souhaitée
        </Label>
        <Input
          id="desiredDeliveryDate"
          type="date"
          value={form.desiredDeliveryDate}
          onChange={e => set('desiredDeliveryDate', e.target.value)}
          min={new Date().toISOString().split('T')[0]}
        />
        <p className="text-xs text-gray-500">
          Notre équipe vous confirmera la date finale par email.
        </p>
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="mallFormRequired"
            checked={form.mallFormRequired}
            onChange={e => set('mallFormRequired', e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
          />
          <Label htmlFor="mallFormRequired" className="cursor-pointer">
            Livraison en centre commercial (formulaire requis)
          </Label>
        </div>

        {form.mallFormRequired && (
          <div className="space-y-2 pl-7">
            <Label htmlFor="mallFormEmail">Email du centre commercial *</Label>
            <Input
              id="mallFormEmail"
              type="email"
              value={form.mallFormEmail}
              onChange={e => set('mallFormEmail', e.target.value)}
              placeholder="contact@centre-commercial.fr"
              required={form.mallFormRequired}
            />
            <p className="text-xs text-gray-500">
              Nous vous enverrons le formulaire à remplir pour l'autorisation de
              livraison.
            </p>
          </div>
        )}
      </div>

      {submitError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {submitError}
        </div>
      )}

      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={isSubmitting || !form.receptionName || !form.receptionEmail}
      >
        {isSubmitting ? 'Envoi en cours...' : 'Confirmer les informations'}
      </Button>
    </form>
  );
}
