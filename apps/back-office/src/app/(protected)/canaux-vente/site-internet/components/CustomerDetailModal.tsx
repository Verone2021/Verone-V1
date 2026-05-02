'use client';

import { useCallback, useState } from 'react';

import { Badge } from '@verone/ui';
import { Button } from '@verone/ui';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@verone/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@verone/ui';
import { Textarea } from '@verone/ui';
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
  FileText,
  Save,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

import { useCustomerDetail } from '../hooks/use-customer-detail';
import { useUpdateCustomerNotes } from '../hooks/use-update-customer-notes';

import { CustomerAddressesTab } from './customer-detail/CustomerAddressesTab';
import { CustomerOrdersTab } from './customer-detail/CustomerOrdersTab';

import type { SiteCustomer } from '../hooks/use-site-customers';

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

  // Notes internes — initialisées depuis le client passé en prop
  const [notesValue, setNotesValue] = useState(customer.notes ?? '');
  const { mutate: updateNotes, isPending: isSavingNotes } =
    useUpdateCustomerNotes();

  const fullName =
    `${customer.first_name ?? ''} ${customer.last_name ?? ''}`.trim() ||
    'Client';

  const handleSaveNotes = useCallback(() => {
    updateNotes(
      { customerId: customer.id, notes: notesValue },
      {
        onSuccess: () => toast.success('Notes sauvegardées'),
        onError: () => toast.error('Erreur lors de la sauvegarde'),
      }
    );
  }, [customer.id, notesValue, updateNotes]);

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="h-screen md:h-auto max-w-full md:max-w-2xl flex flex-col md:max-h-[85vh]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-lg">{fullName}</DialogTitle>
        </DialogHeader>

        {/* En-tête client — fixe */}
        <div className="flex-shrink-0 space-y-3 pb-4 border-b">
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
                Compte lié
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

        {/* Onglets — tabs fixes, contenu seul scrollable */}
        <Tabs
          defaultValue="commandes"
          className="mt-2 flex flex-col flex-1 overflow-hidden"
        >
          <TabsList className="flex-shrink-0 grid grid-cols-4 w-full">
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
              Activité
            </TabsTrigger>
            <TabsTrigger value="notes" className="flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" />
              Notes
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4">
            <TabsContent value="commandes" className="mt-0">
              <CustomerOrdersTab
                orders={data?.orders ?? []}
                totalSpent={data?.totalSpent ?? 0}
                orderCount={data?.orderCount ?? 0}
                isLoading={isLoading}
              />
            </TabsContent>

            <TabsContent value="adresses" className="mt-0">
              <CustomerAddressesTab
                addresses={data?.addresses ?? []}
                isLoading={isLoading}
              />
            </TabsContent>

            <TabsContent value="activite" className="mt-0">
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
                      <p className="text-xs text-gray-500">
                        Produits en favoris
                      </p>
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

            <TabsContent value="notes" className="mt-0">
              <div className="space-y-3">
                <p className="text-sm text-gray-500">
                  Notes internes — visibles uniquement par l&apos;équipe.
                </p>
                <Textarea
                  placeholder="Ajouter une note interne sur ce client..."
                  value={notesValue}
                  onChange={e => setNotesValue(e.target.value)}
                  rows={6}
                  className="resize-none text-sm"
                  disabled={isSavingNotes}
                />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={handleSaveNotes}
                    disabled={isSavingNotes}
                  >
                    {isSavingNotes ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <Save className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Sauvegarder
                  </Button>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
