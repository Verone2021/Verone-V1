'use client';

import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import { Unlink } from 'lucide-react';

interface ConsultationProductItem {
  id: string;
  product?: {
    name: string;
    sku: string;
  };
  proposed_price?: number;
  is_primary_proposal?: boolean;
}

interface ConsultationProductsViewProps {
  consultationId: string;
  consultationProducts: ConsultationProductItem[];
  eligibleProducts: unknown[];
  onCreateLink: () => void;
  onRemoveLink: (id: string) => void;
}

export function ConsultationProductsView({
  consultationId: _consultationId,
  consultationProducts,
  eligibleProducts: _eligibleProducts,
  onCreateLink: _onCreateLink,
  onRemoveLink,
}: ConsultationProductsViewProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Produits associes a cette consultation</CardTitle>
          <CardDescription>
            Gerer les produits proposes pour cette consultation client
          </CardDescription>
        </CardHeader>
        <CardContent>
          {consultationProducts.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              Aucun produit associe a cette consultation
            </div>
          ) : (
            <div className="space-y-4">
              {consultationProducts.map(cp => (
                <div
                  key={cp.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <h4 className="font-medium">{cp.product?.name}</h4>
                    <p className="text-sm text-gray-500">{cp.product?.sku}</p>
                    {cp.proposed_price && (
                      <p className="text-sm font-medium text-green-600">
                        {cp.proposed_price}&euro; HT
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {cp.is_primary_proposal && <Badge>Principale</Badge>}
                    <ButtonV2
                      variant="outline"
                      size="sm"
                      onClick={() => onRemoveLink(cp.id)}
                    >
                      <Unlink className="h-4 w-4" />
                    </ButtonV2>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
