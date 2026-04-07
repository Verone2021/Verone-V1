'use client';

import { useRouter } from 'next/navigation';

import { ButtonV2 } from '@verone/ui';
import { Globe, ArrowLeft, RefreshCw, Settings } from 'lucide-react';

type GoogleMerchantHeaderProps = {
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  onConfigOpen: () => void;
  onSync: () => void;
};

export function GoogleMerchantHeader({
  syncStatus,
  onConfigOpen,
  onSync,
}: GoogleMerchantHeaderProps): JSX.Element {
  const router = useRouter();

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <ButtonV2
              variant="outline"
              size="sm"
              onClick={() => router.push('/canaux-vente')}
              className="border-black text-black hover:bg-black hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </ButtonV2>
            <div>
              <h1 className="text-3xl font-bold text-black flex items-center space-x-2">
                <Globe className="h-8 w-8" />
                <span>Google Merchant Center</span>
              </h1>
              <p className="text-gray-600 mt-1">
                Gérez votre catalogue produits sur Google Shopping
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <ButtonV2
              variant="outline"
              className="border-black text-black hover:bg-black hover:text-white"
              onClick={onConfigOpen}
            >
              <Settings className="h-4 w-4 mr-2" />
              Configuration
            </ButtonV2>
            <ButtonV2
              className="bg-black hover:bg-gray-800 text-white"
              onClick={onSync}
              disabled={syncStatus === 'syncing'}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2${syncStatus === 'syncing' ? ' animate-spin' : ''}`}
              />
              Synchroniser
            </ButtonV2>
          </div>
        </div>
      </div>
    </div>
  );
}
