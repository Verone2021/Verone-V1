import { StickyNote } from 'lucide-react';

import type { UseFormReturn } from 'react-hook-form';

import { Textarea } from '@verone/ui';

import type { CustomerFormData } from '../schema';

interface NotesSectionProps {
  form: UseFormReturn<CustomerFormData>;
}

export function NotesSection({ form }: NotesSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <StickyNote className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium text-muted-foreground">Notes</h3>
      </div>

      <Textarea
        id="description"
        {...form.register('description')}
        placeholder="Notes sur le client, informations complémentaires..."
        rows={3}
      />
    </div>
  );
}
