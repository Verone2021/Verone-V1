'use client';

import { Badge } from '@verone/ui';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@verone/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@verone/ui';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Mail,
  Phone,
  Calendar,
  ShoppingBag,
  MapPin,
  Heart,
  Star,
  Megaphone,
} from 'lucide-react';

import { useCustomerDetail } from '../hooks/use-customer-detail';

import { CustomerAddressesTab } from './customer-detail/CustomerAddressesTab';
import { CustomerOrdersTab } from './customer-detail/CustomerOrdersTab';

import type { SiteCustomer } from './ClientsSection';

interface Props {
  customer: SiteCustomer;
  open: boolean;
  onClose: () => void;
}

export function CustomerDetailModal({ customer, open, onClose }: Props) {
  const { data, isLoading } = useCustomerDetail(
    customer.id,
    customer.auth_user_id
  );

  const fullName =
    `${customer.first_name ?? ''} ${customer.last_name ?? ''}`.trim() ||
    'Client';

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">{fullName}</DialogTitle>
        </DialogHeader>

        {/* Customer Header */}
        <div className="space-y-3 pb-4 border-b">
          <div className="flex flex-wrap gap-2">
            {customer.is_active ? (
              <Badge variant="outline" className="bg-green-50 text-green-700">
                Actif
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-red-50 text-red-700">
                Inactif
              </Badge>
            )}
            {customer.accepts_marketing && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                <Megaphone className="h-3 w-3 mr-1" />
                Marketing
              </Badge>
            )}
            {customer.auth_user_id && (
              <Badge variant="outline" className="bg-purple-50 text-purple-700">
                Compte lie
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
            {customer.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                {customer.email}
              </div>
            )}
            {customer.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                {customer.phone}
              </div>
            )}
            {customer.created_at && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                Inscrit le{' '}
                {format(new Date(customer.created_at), 'dd MMMM yyyy', {
                  locale: fr,
                })}
              </div>
            )}
            {(customer.city ?? customer.postal_code) && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                {[customer.postal_code, customer.city]
                  .filter(Boolean)
                  .join(' ')}
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="commandes" className="mt-2">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="commandes" className="flex items-center gap-1">
              <ShoppingBag className="h-3.5 w-3.5" />
              Commandes
              {data && (
                <span className="text-xs text-gray-500">
                  ({data.orderCount})
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="adresses" className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              Adresses
              {data && (
                <span className="text-xs text-gray-500">
                  ({data.addresses.length})
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="activite" className="flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" />
              Activite
            </TabsTrigger>
          </TabsList>

          <TabsContent value="commandes" className="mt-4">
            <CustomerOrdersTab
              orders={data?.orders ?? []}
              totalSpent={data?.totalSpent ?? 0}
              orderCount={data?.orderCount ?? 0}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="adresses" className="mt-4">
            <CustomerAddressesTab
              addresses={data?.addresses ?? []}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="activite" className="mt-4">
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <Heart className="h-5 w-5 text-pink-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">
                      {data?.activity.wishlistCount ?? 0}
                    </p>
                    <p className="text-xs text-gray-500">Produits en favoris</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <Star className="h-5 w-5 text-yellow-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">
                      {data?.activity.reviewsCount ?? 0}
                    </p>
                    <p className="text-xs text-gray-500">Avis soumis</p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
