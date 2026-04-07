import { ArrowLeft, RefreshCw } from 'lucide-react';

import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

import { ButtonV2 } from '@verone/ui';

interface AlertesHeaderProps {
  router: AppRouterInstance;
  loading: boolean;
  fetchAlerts: () => Promise<void>;
}

export function AlertesHeader({
  router,
  loading,
  fetchAlerts,
}: AlertesHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <ButtonV2
              variant="outline"
              onClick={() => router.push('/stocks')}
              className="flex items-center text-gray-600 hover:text-black"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </ButtonV2>
            <div>
              <h1 className="text-3xl font-bold text-black">Alertes Stock</h1>
              <p className="text-gray-600 mt-1">
                Surveillance temps réel et alertes automatiques
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <ButtonV2
              variant="outline"
              onClick={() => {
                void fetchAlerts().catch(error => {
                  console.error('[AlertesPage] Manual refresh failed:', error);
                });
              }}
              disabled={loading}
              className="border-black text-black hover:bg-black hover:text-white"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`}
              />
              Actualiser
            </ButtonV2>
          </div>
        </div>
      </div>
    </div>
  );
}
