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
import { spacing, colors } from '@verone/ui';
import { FileText } from 'lucide-react';
import { type UseFormReturn } from 'react-hook-form';

import { LEGAL_FORMS } from './constants';
import type { OrganisationFormData } from './types';

interface LegalSectionProps {
  form: UseFormReturn<OrganisationFormData>;
  isSubmitting: boolean;
}

export function LegalSection({ form, isSubmitting }: LegalSectionProps) {
  return (
    <div>
      <h3
        className="text-lg font-semibold flex items-center gap-2"
        style={{
          color: colors.text.DEFAULT,
          marginBottom: spacing[4],
        }}
      >
        <FileText className="h-5 w-5" />
        Informations légales
      </h3>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing[4],
        }}
      >
        {/* Row 1: Forme juridique + SIREN + SIRET */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: spacing[4],
          }}
        >
          {/* Legal Form */}
          <div>
            <Label
              htmlFor="legal_form"
              className="text-sm font-medium"
              style={{
                color: colors.text.DEFAULT,
                display: 'block',
                marginBottom: spacing[2],
              }}
            >
              Forme juridique
            </Label>
            <Select
              value={form.watch('legal_form')}
              onValueChange={value => form.setValue('legal_form', value)}
              disabled={isSubmitting}
            >
              <SelectTrigger
                style={{
                  borderColor: colors.border.DEFAULT,
                  color: colors.text.DEFAULT,
                }}
              >
                <SelectValue placeholder="Sélectionner..." />
              </SelectTrigger>
              <SelectContent>
                {LEGAL_FORMS.map(legalForm => (
                  <SelectItem key={legalForm.value} value={legalForm.value}>
                    {legalForm.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* SIREN */}
          <div>
            <Label
              htmlFor="siren"
              className="text-sm font-medium"
              style={{
                color: colors.text.DEFAULT,
                display: 'block',
                marginBottom: spacing[2],
              }}
            >
              SIREN
            </Label>
            <Input
              id="siren"
              {...form.register('siren')}
              placeholder="123 456 789"
              disabled={isSubmitting}
              style={{
                borderColor: colors.border.DEFAULT,
                color: colors.text.DEFAULT,
                borderRadius: '8px',
              }}
            />
          </div>

          {/* SIRET */}
          <div>
            <Label
              htmlFor="siret"
              className="text-sm font-medium"
              style={{
                color: colors.text.DEFAULT,
                display: 'block',
                marginBottom: spacing[2],
              }}
            >
              SIRET
            </Label>
            <Input
              id="siret"
              {...form.register('siret')}
              placeholder="123 456 789 00012"
              disabled={isSubmitting}
              style={{
                borderColor: colors.border.DEFAULT,
                color: colors.text.DEFAULT,
                borderRadius: '8px',
              }}
            />
          </div>
        </div>

        {/* Row 2: TVA + Secteur d'activité */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: spacing[4],
          }}
        >
          {/* VAT Number */}
          <div>
            <Label
              htmlFor="vat_number"
              className="text-sm font-medium"
              style={{
                color: colors.text.DEFAULT,
                display: 'block',
                marginBottom: spacing[2],
              }}
            >
              N° TVA intracommunautaire
            </Label>
            <Input
              id="vat_number"
              {...form.register('vat_number')}
              placeholder="FR12345678901"
              disabled={isSubmitting}
              style={{
                borderColor: colors.border.DEFAULT,
                color: colors.text.DEFAULT,
                borderRadius: '8px',
              }}
            />
          </div>

          {/* Industry Sector */}
          <div>
            <Label
              htmlFor="industry_sector"
              className="text-sm font-medium"
              style={{
                color: colors.text.DEFAULT,
                display: 'block',
                marginBottom: spacing[2],
              }}
            >
              Secteur d'activité
            </Label>
            <Input
              id="industry_sector"
              {...form.register('industry_sector')}
              placeholder="Ex: Mobilier, Décoration, Textile"
              disabled={isSubmitting}
              style={{
                borderColor: colors.border.DEFAULT,
                color: colors.text.DEFAULT,
                borderRadius: '8px',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
