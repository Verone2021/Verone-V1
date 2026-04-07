'use client';

import { Textarea } from '@verone/ui';
import { spacing, colors } from '@verone/ui';
import { FileText } from 'lucide-react';
import { type UseFormReturn } from 'react-hook-form';

import type { OrganisationFormData } from './types';

interface NotesSectionProps {
  form: UseFormReturn<OrganisationFormData>;
  isSubmitting: boolean;
}

export function NotesSection({ form, isSubmitting }: NotesSectionProps) {
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
        Notes
      </h3>

      <Textarea
        {...form.register('notes')}
        placeholder="Notes ou informations complémentaires..."
        rows={4}
        disabled={isSubmitting}
        className="transition-all duration-200"
        style={{
          borderColor: colors.border.DEFAULT,
          color: colors.text.DEFAULT,
          backgroundColor: colors.background.DEFAULT,
          borderRadius: '8px',
        }}
      />
    </div>
  );
}
