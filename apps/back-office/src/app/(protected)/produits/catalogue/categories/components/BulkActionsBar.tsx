import { Eye, Trash2 } from 'lucide-react';

import { ButtonUnified } from '@verone/ui';

interface BulkActionsBarProps {
  selectedCount: number;
  onBulkStatusToggle: () => void;
  onDeleteItems: () => void;
}

export function BulkActionsBar({
  selectedCount,
  onBulkStatusToggle,
  onDeleteItems,
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center space-x-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
      <span className="text-black text-sm font-medium">
        {selectedCount} élément(s) sélectionné(s)
      </span>
      <ButtonUnified
        variant="outline"
        size="sm"
        onClick={onBulkStatusToggle}
        icon={Eye}
        iconPosition="left"
      >
        Changer statut
      </ButtonUnified>
      <ButtonUnified
        variant="danger"
        size="sm"
        onClick={onDeleteItems}
        icon={Trash2}
        iconPosition="left"
      >
        Supprimer
      </ButtonUnified>
    </div>
  );
}
