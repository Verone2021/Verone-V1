'use client';

/**
 * OrganisationActionsBar
 *
 * Barre d'actions pour la page organisations
 * - Bouton "Nouvelle organisation"
 * - Séparée des filtres pour une meilleure UX
 *
 * @module OrganisationActionsBar
 * @since 2026-01-14
 */

import { Button } from '@verone/ui';
import { Plus } from 'lucide-react';

interface IOrganisationActionsBarProps {
  onNewOrganisation: () => void;
  disabled?: boolean;
}

export function OrganisationActionsBar({
  onNewOrganisation,
  disabled = false,
}: IOrganisationActionsBarProps): JSX.Element {
  return (
    <div className="flex items-center justify-end">
      <Button
        onClick={onNewOrganisation}
        disabled={disabled}
        className="bg-linkme-turquoise hover:bg-linkme-turquoise/90 text-white"
      >
        <Plus className="h-4 w-4 mr-2" />
        Nouvelle organisation
      </Button>
    </div>
  );
}
