'use client';

import { Badge } from '@verone/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { OrganisationNameDisplay } from '@verone/ui';
import { Calendar, User, TruckIcon, ShoppingCart } from 'lucide-react';

import type { OrderHeader } from './universal-order-modal.types';
import { statusColors, statusLabels } from './universal-order-modal.types';

interface UniversalOrderHeaderCardProps {
  orderHeader: OrderHeader;
}

function formatDate(date: string | null): string {
  if (!date) return 'Non définie';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function UniversalOrderHeaderCard({
  orderHeader,
}: UniversalOrderHeaderCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">
              {orderHeader.order_number}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Créée le {formatDate(orderHeader.created_at)}
            </p>
          </div>
          <Badge
            className={
              statusColors[orderHeader.status] ?? 'bg-gray-100 text-gray-800'
            }
          >
            {statusLabels[orderHeader.status] ?? orderHeader.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {orderHeader.customer_name && (
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-700">Client</p>
                <OrganisationNameDisplay
                  legalName={orderHeader.customer_name}
                  tradeName={orderHeader.customer_trade_name}
                  variant="compact"
                  className="text-sm text-gray-900"
                />
              </div>
            </div>
          )}
          {orderHeader.supplier_name && (
            <div className="flex items-start gap-3">
              <TruckIcon className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-700">Fournisseur</p>
                <p className="text-sm text-gray-900">
                  {orderHeader.supplier_name}
                </p>
              </div>
            </div>
          )}
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-700">
                Livraison prévue
              </p>
              <p className="text-sm text-gray-900">
                {formatDate(orderHeader.expected_delivery_date)}
              </p>
            </div>
          </div>
          {orderHeader.creator_name && (
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-700">Créateur</p>
                <p className="text-sm text-gray-900">
                  {orderHeader.creator_name}
                  {orderHeader.creator_email && (
                    <span className="text-gray-500">
                      {' '}
                      ({orderHeader.creator_email})
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}
          {orderHeader.channel_name && (
            <div className="flex items-start gap-3">
              <ShoppingCart className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-700">Source</p>
                <p className="text-sm text-gray-900">
                  {orderHeader.channel_name}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
