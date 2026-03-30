'use client';

import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { ArrowLeft, RefreshCw, Plus } from 'lucide-react';

interface MovementsPageHeaderProps {
  loading: boolean;
  onBack: () => void;
  onRefresh: () => void;
  onNewMovement: () => void;
}

export function MovementsPageHeader({
  loading,
  onBack,
  onRefresh,
  onNewMovement,
}: MovementsPageHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="w-full px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <ButtonV2
              variant="outline"
              size="sm"
              onClick={onBack}
              className="flex items-center text-gray-600 hover:text-black h-8 px-2"
            >
              <ArrowLeft className="h-3 w-3 mr-1.5" />
              Retour
            </ButtonV2>
            <h1 className="text-xl font-semibold text-black">
              Mouvements de Stock
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className="text-xs text-green-700 border-green-600 px-2 py-1"
            >
              ✓ Stock Réel
            </Badge>

            <ButtonV2
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
              className="border-black text-black hover:bg-black hover:text-white"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`}
              />
              Actualiser
            </ButtonV2>

            <ButtonV2
              size="sm"
              onClick={onNewMovement}
              className="bg-black text-white hover:bg-gray-800"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouveau mouvement
            </ButtonV2>
          </div>
        </div>
      </div>
    </div>
  );
}
