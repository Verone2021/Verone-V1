'use client';

import { useState, useEffect } from 'react';

import Link from 'next/link';
import { useParams } from 'next/navigation';

import { AddressEditSection } from '@verone/common';
import { ContactEditSection } from '@verone/customers';
import { ContactsManagementSection } from '@verone/customers';
import { OrganisationTransactionsSection } from '@verone/finance/components';
import { OrganisationPurchaseOrdersSection } from '@verone/orders';
import { OrganisationLogoCard } from '@verone/organisations';
import { OrganisationStatsCard } from '@verone/organisations';
import { CommercialEditSection } from '@verone/organisations';
import { LegalIdentityEditSection } from '@verone/organisations';
import { PerformanceEditSection } from '@verone/organisations';
import {
  useOrganisation,
  useSuppliers,
  getOrganisationDisplayName,
} from '@verone/organisations';
import { useOrganisationTabCounts } from '@verone/organisations';
import { OrganisationProductsSection } from '@verone/organisations';
import type { Organisation } from '@verone/organisations';
import { TabsNavigation, TabContent } from '@verone/ui';
import { Card, CardContent } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Badge } from '@verone/ui';
import { cn } from '@verone/utils';
import {
  isModuleDeployed,
  getModulePhase,
} from '@verone/utils/deployed-modules';
import { createClient } from '@verone/utils/supabase/client';
import {
  ArrowLeft,
  Building2,
  Archive,
  ArchiveRestore,
  Package,
  Phone,
  ShoppingCart,
  FileText,
  Store,
  Sparkles,
  Wallet,
} from 'lucide-react';

// Interface pour les canaux de vente de l'organisation
interface OrganisationChannel {
  code: 'linkme' | 'site-internet' | 'b2b';
  name: string;
  link: string;
  isActive: boolean;
}

export default function SupplierDetailPage() {
  const { supplierId } = useParams();
  const [activeTab, setActiveTab] = useState('contacts');
  // État pour les canaux de vente
  const [organisationChannels, setOrganisationChannels] = useState<
    OrganisationChannel[]
  >([]);

  const {
    organisation: supplier,
    loading,
    error,
  } = useOrganisation(supplierId as string);
  const { archiveOrganisation, unarchiveOrganisation, refetch } =
    useSuppliers();

  // Charger les canaux de vente de cette organisation
  useEffect(() => {
    async function fetchOrganisationChannels() {
      if (!supplierId || typeof supplierId !== 'string') return;

      const channels: OrganisationChannel[] = [];

      try {
        const supabase = createClient();
        // Requête DIRECTE: chercher affilié avec organisation_id
        const { data: linkmeAffiliate } = await supabase
          .from('linkme_affiliates')
          .select('id, status')
          .eq('organisation_id', supplierId)
          .single();

        if (linkmeAffiliate) {
          channels.push({
            code: 'linkme',
            name: 'LinkMe',
            link: `/canaux-vente/linkme/organisations/${supplierId}`,
            isActive: linkmeAffiliate.status === 'active',
          });
        }

        setOrganisationChannels(channels);
      } catch (err) {
        console.error('Erreur chargement canaux organisation:', err);
      }
    }
    fetchOrganisationChannels();
  }, [supplierId]);

  // Hook centralisé pour les compteurs d'onglets
  const { counts, refreshCounts } = useOrganisationTabCounts({
    organisationId: supplierId as string,
    organisationType: 'supplier',
  });

  // Gestionnaire de mise à jour des données fournisseur
  const handleSupplierUpdate = (updatedData: Partial<Organisation>) => {
    // Les données sont automatiquement mises à jour par le hook useInlineEdit
    refetch();
    // Rafraîchir les compteurs
    refreshCounts();
  };

  // Configuration des onglets avec compteurs du hook + modules déployés
  const tabs = [
    {
      id: 'contacts',
      label: 'Contacts',
      icon: <Phone className="h-4 w-4" />,
      badge: counts.contacts.toString(),
      disabled: !isModuleDeployed('contacts'),
    },
    {
      id: 'orders',
      label: 'Commandes',
      icon: <ShoppingCart className="h-4 w-4" />,
      badge: counts.orders.toString(),
      disabled: !isModuleDeployed('purchase_orders'),
      disabledBadge: getModulePhase('purchase_orders'),
    },
    {
      id: 'invoices',
      label: 'Factures',
      icon: <FileText className="h-4 w-4" />,
      disabled: !isModuleDeployed('invoices'),
      disabledBadge: getModulePhase('invoices'),
    },
    {
      id: 'products',
      label: 'Produits',
      icon: <Package className="h-4 w-4" />,
      badge: counts.products.toString(),
      disabled: !isModuleDeployed('products'),
      disabledBadge: getModulePhase('products'),
    },
    {
      id: 'transactions',
      label: 'Transactions',
      icon: <Wallet className="h-4 w-4" />,
      disabled: !isModuleDeployed('finance'),
      disabledBadge: getModulePhase('finance'),
    },
  ];

  if (loading) {
    return (
      <div className="container mx-auto p-4 space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-8" />
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded" />
            <div className="h-32 bg-gray-200 rounded" />
            <div className="h-32 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !supplier) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="p-8 text-center">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-black mb-2">
              Fournisseur introuvable
            </h3>
            <p className="text-gray-600 mb-4">
              Ce fournisseur n'existe pas ou vous n'avez pas les droits pour le
              consulter.
            </p>
            <ButtonV2 asChild>
              <Link href="/contacts-organisations/suppliers">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour aux fournisseurs
              </Link>
            </ButtonV2>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleArchive = async () => {
    if (!supplier.archived_at) {
      // Archiver
      const success = await archiveOrganisation(supplier.id);
      if (success) {
        console.log('✅ Fournisseur archivé avec succès');
        refetch();
      }
    } else {
      // Restaurer
      const success = await unarchiveOrganisation(supplier.id);
      if (success) {
        console.log('✅ Fournisseur restauré avec succès');
        refetch();
      }
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/contacts-organisations/suppliers">
              <ButtonV2 variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Fournisseurs
              </ButtonV2>
            </Link>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="h-5 w-5 text-black" />
            <h1 className="text-lg font-semibold text-black">
              {getOrganisationDisplayName(supplier)}
            </h1>
            <div className="flex gap-2">
              <Badge
                variant={supplier.is_active ? 'secondary' : 'secondary'}
                className={
                  supplier.is_active ? 'bg-green-100 text-green-800' : ''
                }
              >
                {supplier.is_active ? 'Actif' : 'Inactif'}
              </Badge>
              {supplier.archived_at && (
                <Badge
                  variant="destructive"
                  className="bg-red-100 text-red-800"
                >
                  Archivé
                </Badge>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Fournisseur •{' '}
            {supplier.supplier_segment && `${supplier.supplier_segment} • `}ID:{' '}
            {supplier.id.slice(0, 8)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <ButtonV2
            variant={supplier.archived_at ? 'success' : 'danger'}
            onClick={handleArchive}
          >
            {supplier.archived_at ? (
              <>
                <ArchiveRestore className="h-4 w-4 mr-2" />
                Restaurer
              </>
            ) : (
              <>
                <Archive className="h-4 w-4 mr-2" />
                Archiver
              </>
            )}
          </ButtonV2>
        </div>
      </div>

      {/* Section Canaux de Vente */}
      {organisationChannels.length > 0 && (
        <Card className="border-purple-200 bg-purple-50/30">
          <CardContent className="py-3">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Store className="h-4 w-4" />
                Canaux de vente:
              </span>
              <div className="flex flex-wrap gap-2">
                {organisationChannels.map(channel => (
                  <Link key={channel.code} href={channel.link}>
                    <Badge
                      variant={channel.isActive ? 'default' : 'outline'}
                      className={cn(
                        'cursor-pointer hover:opacity-80 transition-opacity',
                        channel.code === 'linkme' &&
                          'bg-purple-600 hover:bg-purple-700 text-white'
                      )}
                    >
                      {channel.code === 'linkme' && (
                        <Sparkles className="h-3 w-3 mr-1" />
                      )}
                      {channel.name}
                      {!channel.isActive && (
                        <span className="ml-1 text-xs opacity-70">
                          (inactif)
                        </span>
                      )}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Layout en 2 colonnes avec composants EditSection */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Colonne principale - Informations éditables */}
        <div className="xl:col-span-2 space-y-4">
          {/* Identité Légale */}
          <LegalIdentityEditSection
            organisation={supplier}
            onUpdate={handleSupplierUpdate}
          />

          {/* Informations de Contact */}
          <ContactEditSection
            organisation={supplier}
            onUpdate={handleSupplierUpdate}
          />

          {/* Adresse */}
          <AddressEditSection
            organisation={supplier}
            onUpdate={handleSupplierUpdate}
          />

          {/* Conditions Commerciales */}
          <CommercialEditSection
            organisation={supplier}
            onUpdate={handleSupplierUpdate}
            organisationType="supplier"
          />
        </div>

        {/* Colonne latérale - Logo, Performance et Statistiques */}
        <div className="space-y-4">
          {/* Logo de l'organisation - Composant réutilisable */}
          <OrganisationLogoCard
            organisationId={supplier.id}
            organisationName={supplier.legal_name}
            organisationType="supplier"
            currentLogoUrl={supplier.logo_url}
            onUploadSuccess={() => refetch()}
          />

          {/* Performance & Qualité */}
          <PerformanceEditSection
            organisation={supplier}
            onUpdate={handleSupplierUpdate}
            organisationType="supplier"
          />

          {/* Statistiques - Composant réutilisable */}
          <OrganisationStatsCard
            organisation={supplier}
            organisationType="supplier"
          />
        </div>
      </div>

      {/* Section avec onglets - Modules business */}
      <div className="mt-8">
        <TabsNavigation
          tabs={tabs}
          defaultTab="contacts"
          onTabChange={setActiveTab}
        />

        <TabContent activeTab={activeTab} tabId="contacts">
          <ContactsManagementSection
            organisationId={supplier.id}
            organisationName={getOrganisationDisplayName(supplier)}
            organisationType="supplier"
            onUpdate={() => handleSupplierUpdate({})}
          />
        </TabContent>

        <TabContent activeTab={activeTab} tabId="orders">
          <OrganisationPurchaseOrdersSection
            organisationId={supplier.id}
            organisationName={getOrganisationDisplayName(supplier)}
            onUpdate={() => handleSupplierUpdate({})}
          />
        </TabContent>

        <TabContent activeTab={activeTab} tabId="invoices">
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-black mb-2">
              Module Factures
            </h3>
            <p className="text-gray-600">
              Ce module sera disponible dans une prochaine version.
            </p>
          </div>
        </TabContent>

        <TabContent activeTab={activeTab} tabId="products">
          <OrganisationProductsSection
            organisationId={supplier.id}
            organisationName={getOrganisationDisplayName(supplier)}
            organisationType="supplier"
            onUpdate={() => handleSupplierUpdate({})}
          />
        </TabContent>

        <TabContent activeTab={activeTab} tabId="transactions">
          <OrganisationTransactionsSection
            organisationId={supplier.id}
            organisationName={getOrganisationDisplayName(supplier)}
          />
        </TabContent>
      </div>
    </div>
  );
}
