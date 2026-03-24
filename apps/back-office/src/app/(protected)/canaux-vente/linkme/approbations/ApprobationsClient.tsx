'use client';

/**
 * Page Approbations LinkMe - Back-Office
 *
 * 3 onglets de validation:
 * - Commandes: status = 'pending_approval'
 * - Produits: affiliate_approval_status = 'pending_approval'
 * - Organisations: approval_status = 'pending_validation'
 *
 * @module ApprobationsPage
 * @since 2026-01-05
 */

import { Badge, Tabs, TabsContent, TabsList, TabsTrigger } from '@verone/ui';
import { Package, Clock, ShoppingCart, Building2 } from 'lucide-react';

import { usePendingOrdersCount } from '../hooks/use-linkme-order-actions';
import { usePendingApprovalsCount } from '../hooks/use-product-approvals';
import { usePendingOrganisationsCount } from '../hooks/use-organisation-approvals';

import { CommandesTab } from './components/CommandesTab';
import { ProduitsTab } from './components/ProduitsTab';
import { OrganisationsTab } from './components/OrganisationsTab';

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function ApprobationsClient() {
  const { data: pendingOrdersCount = 0 } = usePendingOrdersCount();
  const { data: pendingProductsCount = 0 } = usePendingApprovalsCount();
  const { data: pendingOrgsCount = 0 } = usePendingOrganisationsCount();

  const totalPending =
    pendingOrdersCount + pendingProductsCount + pendingOrgsCount;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Approbations</h1>
          <p className="text-gray-500 mt-1">
            Validez les commandes, produits et organisations
          </p>
        </div>
        {totalPending > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
            <Clock className="h-5 w-5 text-amber-600" />
            <span className="font-semibold text-amber-700">
              {totalPending} en attente
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="commandes" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="commandes" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Commandes
            {pendingOrdersCount > 0 && (
              <Badge variant="destructive" className="ml-1">
                {pendingOrdersCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="produits" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Produits
            {pendingProductsCount > 0 && (
              <Badge variant="destructive" className="ml-1">
                {pendingProductsCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="organisations"
            className="flex items-center gap-2"
          >
            <Building2 className="h-4 w-4" />
            Organisations
            {pendingOrgsCount > 0 && (
              <Badge variant="destructive" className="ml-1">
                {pendingOrgsCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="commandes">
          <CommandesTab />
        </TabsContent>

        <TabsContent value="produits">
          <ProduitsTab />
        </TabsContent>

        <TabsContent value="organisations">
          <OrganisationsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
