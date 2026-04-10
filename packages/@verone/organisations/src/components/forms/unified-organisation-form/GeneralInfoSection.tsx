'use client';

import { Checkbox } from '@verone/ui';
import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import { spacing, colors } from '@verone/ui';
import { Building2 } from 'lucide-react';
import { type UseFormReturn } from 'react-hook-form';

import type { OrganisationFormData } from './types';

interface GeneralInfoSectionProps {
  form: UseFormReturn<OrganisationFormData>;
  isSubmitting: boolean;
}

export function GeneralInfoSection({
  form,
  isSubmitting,
}: GeneralInfoSectionProps) {
  return (
    <div>
      <h3
        className="text-lg font-semibold flex items-center gap-2"
        style={{
          color: colors.text.DEFAULT,
          marginBottom: spacing[4],
        }}
      >
        <Building2 className="h-5 w-5" />
        Informations générales
      </h3>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing[4],
        }}
      >
        {/* Dénomination sociale (legal_name) */}
        <div>
          <Label
            htmlFor="name"
            className="text-sm font-medium"
            style={{
              color: colors.text.DEFAULT,
              display: 'block',
              marginBottom: spacing[2],
            }}
          >
            Dénomination sociale *
          </Label>
          <Input
            id="name"
            {...form.register('name')}
            placeholder="Ex: SAS Mobilier Design"
            disabled={isSubmitting}
            className="transition-all duration-200"
            style={{
              borderColor: form.formState.errors.name
                ? colors.danger[500]
                : colors.border.DEFAULT,
              color: colors.text.DEFAULT,
              borderRadius: '8px',
            }}
          />
          {form.formState.errors.name && (
            <p
              style={{
                color: colors.danger[500],
                fontSize: '0.875rem',
                marginTop: spacing[1],
              }}
            >
              {form.formState.errors.name.message}
            </p>
          )}
        </div>

        {/* Nom commercial différent */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing[2],
          }}
        >
          <Checkbox
            id="has_different_trade_name"
            checked={form.watch('has_different_trade_name')}
            onCheckedChange={checked => {
              form.setValue('has_different_trade_name', checked as boolean);
              if (!checked) {
                form.setValue('trade_name', '');
              }
            }}
            disabled={isSubmitting}
          />
          <Label
            htmlFor="has_different_trade_name"
            className="text-sm font-medium cursor-pointer"
            style={{ color: colors.text.DEFAULT }}
          >
            Nom commercial différent
          </Label>
        </div>

        {/* Trade Name (conditionnel) */}
        {form.watch('has_different_trade_name') && (
          <div>
            <Label
              htmlFor="trade_name"
              className="text-sm font-medium"
              style={{
                color: colors.text.DEFAULT,
                display: 'block',
                marginBottom: spacing[2],
              }}
            >
              Nom commercial
            </Label>
            <Input
              id="trade_name"
              {...form.register('trade_name')}
              placeholder="Ex: Marque XYZ"
              disabled={isSubmitting}
              className="transition-all duration-200"
              style={{
                borderColor: colors.border.DEFAULT,
                color: colors.text.DEFAULT,
                borderRadius: '8px',
              }}
            />
          </div>
        )}

        {/* is_active always true — no checkbox needed */}
      </div>
    </div>
  );
}
