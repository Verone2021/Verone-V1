/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';

interface ProductConsultationViewProps {
  productId: string;
  consultations: any[];
  onCreateLink: () => void;
}

export function ProductConsultationView({
  productId: _productId,
  consultations: _consultations,
  onCreateLink: _onCreateLink,
}: ProductConsultationViewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Consultations pour ce produit</CardTitle>
        <CardDescription>
          Gérer les associations entre ce produit et les consultations clients
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center text-gray-500">
          Interface produit-centrique à implémenter
        </div>
      </CardContent>
    </Card>
  );
}
