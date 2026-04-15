'use client';

import { Users, Package, Link, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@verone/ui';

interface ConsultationLike {
  status: string;
}

interface ConsultationOverviewStatsProps {
  consultations: ConsultationLike[];
  eligibleProducts: unknown[];
  consultationProducts: unknown[];
}

export function ConsultationOverviewStats({
  consultations,
  eligibleProducts,
  consultationProducts,
}: ConsultationOverviewStatsProps) {
  const conversionRate =
    consultations.length > 0
      ? Math.round(
          (consultations.filter(c => c.status === 'terminee').length /
            consultations.length) *
            100
        )
      : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Consultations actives</p>
              <p className="text-2xl font-bold">
                {consultations.filter(c => c.status === 'en_cours').length}
              </p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Produits eligibles</p>
              <p className="text-2xl font-bold">{eligibleProducts.length}</p>
            </div>
            <Package className="h-8 w-8 text-green-600" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Produits associes</p>
              <p className="text-2xl font-bold">
                {consultationProducts.length}
              </p>
            </div>
            <Link className="h-8 w-8 text-purple-600" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Taux conversion</p>
              <p className="text-2xl font-bold">{conversionRate}%</p>
            </div>
            <CheckCircle className="h-8 w-8 text-amber-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
