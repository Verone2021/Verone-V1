'use client';

import {
  Facebook,
  Instagram,
  RefreshCw,
  ExternalLink,
  Loader2,
} from 'lucide-react';

import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';

interface MetaHeaderProps {
  isSyncing: boolean;
  onSyncStatuses: () => void;
}

const COMMERCE_MANAGER_URL =
  'https://business.facebook.com/commerce/catalogs/1223749196006844/products?business_id=222452897164348';
const ADS_MANAGER_URL =
  'https://business.facebook.com/adsmanager?business_id=222452897164348';

export function MetaHeader({ isSyncing, onSyncStatuses }: MetaHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Facebook className="h-6 w-6 text-blue-600" />
            <Instagram className="h-6 w-6 text-pink-500" />
          </div>
          Meta Commerce
        </h1>
        <p className="text-muted-foreground mt-1">
          Gerez vos produits sur Facebook Shop, Instagram Shopping et WhatsApp
        </p>
      </div>
      <div className="flex items-center gap-2">
        <ButtonV2
          variant="outline"
          size="sm"
          onClick={onSyncStatuses}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Actualiser les statuts
        </ButtonV2>
        <ButtonV2
          variant="outline"
          size="sm"
          onClick={() => window.open(COMMERCE_MANAGER_URL, '_blank')}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Commerce Manager
        </ButtonV2>
        <ButtonV2
          variant="outline"
          size="sm"
          onClick={() => window.open(ADS_MANAGER_URL, '_blank')}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Ads Manager
        </ButtonV2>
        <Badge variant="outline" className="text-xs">
          Catalogue ID: 1223749196006844
        </Badge>
      </div>
    </div>
  );
}
