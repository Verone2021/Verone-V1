'use client';

// =============================================================================
// Footer — Compteur erreurs + boutons Annuler / Sauvegarder
// =============================================================================

import { ButtonV2 } from '@verone/ui';
import { Loader2 } from 'lucide-react';

import type { z } from 'zod';

interface EditSiteInternetProductModalFooterProps {
  errors: z.ZodIssue[];
  isPending: boolean;
  onClose: () => void;
}

export function EditSiteInternetProductModalFooter({
  errors,
  isPending,
  onClose,
}: EditSiteInternetProductModalFooterProps) {
  return (
    <div className="border-t pt-4 bg-gray-50 -mx-6 -mb-6 px-6 pb-6 mt-6">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {errors.length > 0 && (
            <span className="text-red-600">
              {errors.length} erreur{errors.length > 1 ? 's' : ''} de validation
            </span>
          )}
        </div>
        <div className="flex flex-col gap-2 md:flex-row">
          <ButtonV2
            variant="outline"
            onClick={onClose}
            type="button"
            className="w-full md:w-auto"
          >
            Annuler
          </ButtonV2>
          <ButtonV2
            type="submit"
            disabled={isPending}
            className="w-full md:w-auto"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              'Sauvegarder'
            )}
          </ButtonV2>
        </div>
      </div>
    </div>
  );
}
