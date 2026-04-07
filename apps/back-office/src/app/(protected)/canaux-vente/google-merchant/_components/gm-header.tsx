'use client';

import { Globe, RefreshCw, ExternalLink, Loader2 } from 'lucide-react';

import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';

interface GmHeaderProps {
  isSyncing: boolean;
  onSyncStatuses: () => void;
}

const MERCHANT_CENTER_URL =
  'https://merchants.google.com/mc/products/list?a=5495521926';

export function GmHeader({ isSyncing, onSyncStatuses }: GmHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
          <Globe className="h-6 w-6 text-blue-500" />
          Google Merchant Center
        </h1>
        <p className="text-muted-foreground mt-1">
          Gerez vos produits sur Google Shopping
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
          onClick={() => window.open(MERCHANT_CENTER_URL, '_blank')}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Merchant Center
        </ButtonV2>
        <Badge variant="outline" className="text-xs">
          Merchant ID: 5495521926
        </Badge>
      </div>
    </div>
  );
}
