'use client';

import { Badge } from '@verone/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { CheckCircle, AlertCircle } from 'lucide-react';

import { formatDate } from './use-google-merchant-page';

type MerchantConfig = {
  merchant_id: string;
  api_connected: boolean;
  country: string;
  currency: string;
  language: string;
  last_sync: string | null;
};

type GoogleMerchantConfigCardProps = {
  config: MerchantConfig;
};

export function GoogleMerchantConfigCard({
  config,
}: GoogleMerchantConfigCardProps): JSX.Element {
  return (
    <Card className="border-black mb-6">
      <CardHeader>
        <CardTitle className="text-black flex items-center justify-between">
          Configuration Google Merchant
          {config.api_connected ? (
            <Badge
              variant="outline"
              className="border-green-300 text-green-600"
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Connecté
            </Badge>
          ) : (
            <Badge variant="outline" className="border-red-300 text-red-600">
              <AlertCircle className="h-3 w-3 mr-1" />
              Non connecté
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">ID Marchand</p>
            <p className="font-mono">{config.merchant_id}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Pays / Langue</p>
            <p className="font-medium">
              {config.country} / {config.language}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Devise</p>
            <p className="font-medium">{config.currency}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Dernière synchro</p>
            <p className="font-medium">
              {config.last_sync ? formatDate(config.last_sync) : 'Jamais'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
