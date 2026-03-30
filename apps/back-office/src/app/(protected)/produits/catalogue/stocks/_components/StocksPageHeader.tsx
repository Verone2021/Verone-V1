'use client';

import { ButtonV2 } from '@verone/ui';
import { History, Plus, RefreshCw } from 'lucide-react';

interface StocksPageHeaderProps {
  loading: boolean;
  onRefresh: () => void;
  onNewMovement: () => void;
}

export function StocksPageHeader({
  loading,
  onRefresh,
  onNewMovement,
}: StocksPageHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold">Gestion des Stocks</h1>
        <p className="text-gray-600 mt-1">
          Suivi en temps réel du stock physique et prévisionnel
        </p>
      </div>
      <div className="flex gap-2">
        <ButtonV2
          variant="outline"
          onClick={() => (window.location.href = '/historique-mouvements')}
        >
          <History className="h-4 w-4 mr-2" />
          Historique complet
        </ButtonV2>
        <ButtonV2 variant="outline" onClick={onNewMovement}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau mouvement
        </ButtonV2>
        <ButtonV2 variant="outline" onClick={onRefresh} disabled={loading}>
          <RefreshCw
            className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`}
          />
          Actualiser
        </ButtonV2>
      </div>
    </div>
  );
}
