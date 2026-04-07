'use client';

/**
 * Page Stockage / Volumetrie - Back-Office LinkMe
 *
 * Vue d'ensemble du stockage entrepot avec onglets:
 * - Vue clients (cartes)
 * - Grille tarifaire (configuration prix avec toggle liste/grille)
 * - Demandes d'envoi de stock (approbation/rejet)
 *
 * @module StockagePage
 * @since 2025-12-22
 */

import { useState, useEffect } from 'react';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { Button, Tabs, TabsContent, TabsList, TabsTrigger } from '@verone/ui';
import { Plus, Users, Settings, Send } from 'lucide-react';

import { usePendingStorageRequestsCount } from '../hooks/use-storage-requests-admin';

import { StockageClientsTab } from './components/StockageClientsTab';
import { StockageKPIs } from './components/StockageKPIs';
import { PricingGridTab } from './components/PricingGridTab';
import { StorageRequestsAdminTab } from './components/StorageRequestsAdminTab';

export default function StockagePage(): React.ReactElement {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('clients');

  const { data: pendingCount } = usePendingStorageRequestsCount();

  // Handle tab from URL query param
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'tarifs' || tabParam === 'demandes') {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Stockage & Volumetrie
          </h1>
          <p className="text-sm text-gray-500">
            Gestion du stockage entrepot par client
          </p>
        </div>
        <Link href="/canaux-vente/linkme/stockage/nouvelle-allocation">
          <Button size="sm">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Nouvelle allocation
          </Button>
        </Link>
      </div>

      {/* KPIs */}
      <StockageKPIs />

      {/* Tabs: Vue Clients / Grille Tarifaire / Demandes */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="clients" className="gap-1.5 text-sm">
            <Users className="h-3.5 w-3.5" />
            Clients
          </TabsTrigger>
          <TabsTrigger value="tarifs" className="gap-1.5 text-sm">
            <Settings className="h-3.5 w-3.5" />
            Grille Tarifaire
          </TabsTrigger>
          <TabsTrigger value="demandes" className="gap-1.5 text-sm">
            <Send className="h-3.5 w-3.5" />
            Demandes
            {(pendingCount ?? 0) > 0 && (
              <span className="ml-1 inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 text-xs font-bold text-white bg-amber-500 rounded-full">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clients">
          <StockageClientsTab />
        </TabsContent>

        <TabsContent value="tarifs">
          <PricingGridTab />
        </TabsContent>

        <TabsContent value="demandes">
          <StorageRequestsAdminTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
