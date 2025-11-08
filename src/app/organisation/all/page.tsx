'use client';

import React, { useState, useEffect } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { Building2 } from 'lucide-react';

import { PageHeader } from '@/components/layout/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { CustomersTab } from '../components/customers-tab';
import { PartnersTab } from '../components/partners-tab';
import { SuppliersTab } from '../components/suppliers-tab';

type TabValue = 'suppliers' | 'customers' | 'partners';

export default function OrganisationsAllPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as TabValue | null;

  // Onglet actif basé sur URL searchParams (défaut: suppliers)
  const [activeTab, setActiveTab] = useState<TabValue>(tabParam || 'suppliers');

  // Sync avec URL quand searchParams change
  useEffect(() => {
    if (tabParam && ['suppliers', 'customers', 'partners'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Mettre à jour URL quand onglet change
  const handleTabChange = (value: string) => {
    const tab = value as TabValue;
    setActiveTab(tab);
    router.push(`/organisation/all?tab=${tab}`, { scroll: false });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <PageHeader
        title="Organisations - Gestion Unifiée"
        description="Vue complète de vos fournisseurs, clients professionnels et prestataires"
        icon={Building2}
        showBackButton
        backButtonHref="/organisation"
      />

      {/* Onglets Navigation */}
      <div className="p-6">
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="suppliers" className="text-sm font-medium">
              Fournisseurs
            </TabsTrigger>
            <TabsTrigger value="customers" className="text-sm font-medium">
              Clients Pro
            </TabsTrigger>
            <TabsTrigger value="partners" className="text-sm font-medium">
              Prestataires
            </TabsTrigger>
          </TabsList>

          <TabsContent value="suppliers" className="mt-0">
            <SuppliersTab />
          </TabsContent>

          <TabsContent value="customers" className="mt-0">
            <CustomersTab />
          </TabsContent>

          <TabsContent value="partners" className="mt-0">
            <PartnersTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
