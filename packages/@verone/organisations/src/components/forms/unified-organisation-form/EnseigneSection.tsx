'use client';

import { Label } from '@verone/ui';
import { RadioGroup, RadioGroupItem } from '@verone/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { spacing, colors } from '@verone/ui';
import { Store, Info } from 'lucide-react';
import { type UseFormReturn } from 'react-hook-form';

import { useActiveEnseignes } from '../../../hooks/use-enseignes';

import type { OrganisationFormData } from './types';

interface EnseigneSectionProps {
  form: UseFormReturn<OrganisationFormData>;
  isSubmitting: boolean;
}

export function EnseigneSection({ form, isSubmitting }: EnseigneSectionProps) {
  const { enseignes, loading: enseignesLoading } = useActiveEnseignes();

  return (
    <div>
      <h3
        className="text-lg font-semibold flex items-center gap-2"
        style={{
          color: colors.text.DEFAULT,
          marginBottom: spacing[4],
        }}
      >
        <Store className="h-5 w-5" />
        Rattachement enseigne
      </h3>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing[4],
        }}
      >
        {/* Enseigne Select */}
        <div>
          <Label
            htmlFor="enseigne_id"
            className="text-sm font-medium"
            style={{
              color: colors.text.DEFAULT,
              display: 'block',
              marginBottom: spacing[2],
            }}
          >
            Rattacher à une enseigne (facultatif)
          </Label>
          <Select
            value={form.watch('enseigne_id') ?? '__none__'}
            onValueChange={value => {
              if (value === '__none__') {
                form.setValue('enseigne_id', null);
                form.setValue('ownership_type', null);
              } else {
                form.setValue('enseigne_id', value);
              }
            }}
            disabled={isSubmitting ?? enseignesLoading}
          >
            <SelectTrigger
              style={{
                borderColor: colors.border.DEFAULT,
                color: colors.text.DEFAULT,
                borderRadius: '8px',
              }}
            >
              <SelectValue placeholder="Aucune enseigne" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Aucune</SelectItem>
              {enseignes.map(enseigne => (
                <SelectItem key={enseigne.id} value={enseigne.id}>
                  {enseigne.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Ownership Type (conditionnel: visible si enseigne sélectionnée) */}
        {form.watch('enseigne_id') && (
          <div>
            <Label
              className="text-sm font-medium"
              style={{
                color: colors.text.DEFAULT,
                display: 'block',
                marginBottom: spacing[2],
              }}
            >
              Type de rattachement (facultatif)
            </Label>
            <RadioGroup
              value={form.watch('ownership_type') ?? ''}
              onValueChange={value => {
                form.setValue(
                  'ownership_type',
                  value as 'succursale' | 'franchise' | 'propre'
                );
              }}
              orientation="vertical"
              spacing="sm"
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[2],
                }}
              >
                <RadioGroupItem value="succursale" id="ownership_succursale" />
                <Label
                  htmlFor="ownership_succursale"
                  className="text-sm cursor-pointer"
                  style={{ color: colors.text.DEFAULT }}
                >
                  Propre (succursale)
                </Label>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[2],
                }}
              >
                <RadioGroupItem value="franchise" id="ownership_franchise" />
                <Label
                  htmlFor="ownership_franchise"
                  className="text-sm cursor-pointer"
                  style={{ color: colors.text.DEFAULT }}
                >
                  Franchise
                </Label>
              </div>
            </RadioGroup>
            <p
              className="flex items-center gap-1"
              style={{
                color: colors.text.muted,
                fontSize: '0.75rem',
                marginTop: spacing[2],
              }}
            >
              <Info className="h-3 w-3" />
              Si &quot;Propre&quot;, les conditions commerciales seront héritées
              de l&apos;enseigne
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
