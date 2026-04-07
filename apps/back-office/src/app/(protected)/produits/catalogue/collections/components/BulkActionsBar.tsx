'use client';

import { ButtonV2 } from '@verone/ui';

interface BulkActionsBarProps {
  selectedCount: number;
  onBulkStatusToggle: () => Promise<void>;
  onClearSelection: () => void;
}

export function BulkActionsBar({
  selectedCount,
  onBulkStatusToggle,
  onClearSelection,
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center space-x-2 p-4 bg-blue-50 rounded-md mx-6">
      <span className="text-sm text-gray-700">
        {selectedCount} collection{selectedCount !== 1 ? 's' : ''} sélectionnée
        {selectedCount !== 1 ? 's' : ''}
      </span>
      <ButtonV2
        variant="ghost"
        size="sm"
        onClick={() => {
          void onBulkStatusToggle();
        }}
      >
        Changer le statut
      </ButtonV2>
      <ButtonV2
        variant="ghost"
        size="sm"
        onClick={() => {
          // TODO: Implémenter partage en lot
        }}
        className="text-blue-600 hover:text-blue-700"
      >
        Partager
      </ButtonV2>
      <ButtonV2
        variant="ghost"
        size="sm"
        onClick={onClearSelection}
        className="text-red-600 hover:text-red-700"
      >
        Supprimer
      </ButtonV2>
    </div>
  );
}
