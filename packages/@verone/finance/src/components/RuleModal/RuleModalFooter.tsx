'use client';

import { Button } from '@verone/ui/components/ui/button';
import { Check, Loader2, Plus } from 'lucide-react';

interface RuleModalFooterProps {
  isEditMode: boolean;
  isSubmitting: boolean;
  canSubmit: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}

export function RuleModalFooter({
  isEditMode,
  isSubmitting,
  canSubmit,
  onCancel,
  onSubmit,
}: RuleModalFooterProps) {
  return (
    <div className="flex items-center justify-between gap-4 border-t bg-slate-50 px-6 py-4">
      <Button variant="ghost" onClick={onCancel} className="text-slate-600">
        Annuler
      </Button>
      <Button
        onClick={onSubmit}
        disabled={isSubmitting || !canSubmit}
        className="min-w-[140px] gap-2"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Enregistrement...
          </>
        ) : isEditMode ? (
          <>
            <Check className="h-4 w-4" />
            Enregistrer
          </>
        ) : (
          <>
            <Plus className="h-4 w-4" />
            Créer la règle
          </>
        )}
      </Button>
    </div>
  );
}
