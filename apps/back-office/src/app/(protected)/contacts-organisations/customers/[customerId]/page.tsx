'use client';

import { useState } from 'react';

import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';

import { AddressEditSection } from '@verone/common';
import { ContactEditSection } from '@verone/customers';
import { ContactsManagementSection } from '@verone/customers';
import { OrganisationTransactionsSection } from '@verone/finance/components';
import {
  OrganisationSalesOrdersSection,
  CustomerSamplesSection,
} from '@verone/orders';
import { OrganisationLogoCard } from '@verone/organisations';
import { OrganisationStatsCard } from '@verone/organisations';
import { CommercialEditSection } from '@verone/organisations';
import { LegalIdentityEditSection } from '@verone/organisations';
import { PerformanceEditSection } from '@verone/organisations';
import {
  useOrganisation,
  useOrganisations,
  getOrganisationDisplayName,
} from '@verone/organisations';
import { useOrganisationTabCounts } from '@verone/organisations';
import type { Organisation } from '@verone/organisations';
import { TabsNavigation, TabContent } from '@verone/ui';
import { Card, CardContent } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Badge } from '@verone/ui';
import {
  isModuleDeployed,
  getModulePhase,
} from '@verone/utils/deployed-modules';
import {
  Building2,
  Phone,
  Package,
  ShoppingCart,
  FileText,
  Euro,
  FlaskConical,
  Store,
  Sparkles,
  Wallet,
  ArrowLeft,
} from 'lucide-react';
import { cn } from '@verone/utils';

import { useCustomerDetail } from './use-customer-detail';
import { CustomerDetailHeader } from './CustomerDetailHeader';
import { CustomerKbisCard } from './CustomerKbisCard';
import { CustomerProductsTab } from './CustomerProductsTab';

export default function CustomerDetailPage() {
  const { customerId } = useParams();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl');
  const [activeTab, setActiveTab] = useState('contacts');

  const {
    organisation: customer,
    loading,
    error,
    refetch: refetchCustomer,
  } = useOrganisation(customerId as string);

  const {
    kbisUrl,
    kbisUploading,
    handleKbisUpload,
    customerProducts,
    productsLoading,
    organisationChannels,
  } = useCustomerDetail(customerId);

  // Merge kbis_url into customer for LegalIdentityEditSection
  const customerWithKbis = customer ? { ...customer, kbis_url: kbisUrl } : null;

  const { archiveOrganisation, unarchiveOrganisation, refetch } =
    useOrganisations({ type: 'customer' });

  const { counts, refreshCounts } = useOrganisationTabCounts({
    organisationId: customerId as string,
    organisationType: 'customer',
  });

  const handleCustomerUpdate = (_updatedData: Partial<Organisation>) => {
    refetchCustomer();
    void refetch().catch(error => {
      console.error('[CustomerDetail] Refetch organisations failed:', error);
    });
    void refreshCounts().catch(error => {
      console.error('[CustomerDetail] Refresh counts failed:', error);
    });
  };

  const handleArchive = async () => {
    if (!customer) return;
    if (!customer.archived_at) {
      const success = await archiveOrganisation(customer.id);
      if (success) {
        console.warn('✅ Client archivé avec succès');
        await refetch();
      }
    } else {
      const success = await unarchiveOrganisation(customer.id);
      if (success) {
        console.warn('✅ Client restauré avec succès');
        await refetch();
      }
    }
  };

  const tabs = [
    {
      id: 'contacts',
      label: 'Contacts',
      icon: <Phone className="h-4 w-4" />,
      badge: counts.contacts.toString(),
      disabled: !isModuleDeployed('contacts'),
    },
    {
      id: 'products',
      label: 'Produits',
      icon: <Package className="h-4 w-4" />,
      badge: customerProducts.length.toString(),
    },
    {
      id: 'pricing',
      label: 'Tarification',
      icon: <Euro className="h-4 w-4" />,
      disabled: !isModuleDeployed('products'),
      disabledBadge: getModulePhase('products'),
    },
    {
      id: 'orders',
      label: 'Commandes',
      icon: <ShoppingCart className="h-4 w-4" />,
      disabled: !isModuleDeployed('sales_orders'),
      disabledBadge: getModulePhase('sales_orders'),
    },
    {
      id: 'invoices',
      label: 'Factures',
      icon: <FileText className="h-4 w-4" />,
      disabled: !isModuleDeployed('invoices'),
      disabledBadge: getModulePhase('invoices'),
    },
    ...(customer?.customer_type === 'professional'
      ? [
          {
            id: 'samples',
            label: 'Échantillons',
            icon: <FlaskConical className="h-4 w-4" />,
            badge: counts.samples?.toString() ?? '0',
            disabled: !isModuleDeployed('sales_orders'),
            disabledBadge: getModulePhase('sales_orders'),
          },
        ]
      : []),
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

  if (error || !customer) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="p-8 text-center">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-black mb-2">
              Client introuvable
            </h3>
            <p className="text-gray-600 mb-4">
              Ce client n&apos;existe pas ou vous n&apos;avez pas les droits
              pour le consulter.
            </p>
            <ButtonV2 asChild>
              <Link href="/contacts-organisations/customers">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour aux clients
              </Link>
            </ButtonV2>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-4">
      <CustomerDetailHeader
        customer={customer}
        returnUrl={returnUrl}
        onArchive={() => {
          void handleArchive().catch(error => {
            console.error('[CustomerDetail] Archive failed:', error);
          });
        }}
      />

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

      {/* Layout en 2 colonnes */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">
          <LegalIdentityEditSection
            organisation={customerWithKbis ?? customer}
            onUpdate={handleCustomerUpdate}
          />
          <ContactEditSection
            organisation={customer}
            onUpdate={handleCustomerUpdate}
          />
          <AddressEditSection
            organisation={customer}
            onUpdate={handleCustomerUpdate}
          />
          {customer.customer_type === 'professional' && (
            <CommercialEditSection
              organisation={customer}
              onUpdate={handleCustomerUpdate}
              organisationType="customer"
            />
          )}
        </div>

        <div className="space-y-4">
          <OrganisationLogoCard
            organisationId={customer.id}
            organisationName={customer.legal_name}
            organisationType="customer"
            currentLogoUrl={customer.logo_url}
            onUploadSuccess={() => {
              void refetch().catch(error => {
                console.error(
                  '[CustomerDetail] Refetch after upload failed:',
                  error
                );
              });
            }}
          />
          <CustomerKbisCard
            kbisUrl={kbisUrl}
            kbisUploading={kbisUploading}
            onUpload={handleKbisUpload}
          />
          {customer.customer_type === 'professional' && (
            <PerformanceEditSection
              organisation={customer}
              onUpdate={handleCustomerUpdate}
              organisationType="customer"
            />
          )}
          <OrganisationStatsCard
            organisation={customer}
            organisationType="customer"
          />
        </div>
      </div>

      {/* Onglets */}
      <div className="mt-8">
        <TabsNavigation
          tabs={tabs}
          defaultTab="contacts"
          onTabChange={setActiveTab}
        />

        <TabContent activeTab={activeTab} tabId="contacts">
          <ContactsManagementSection
            organisationId={customer.id}
            organisationName={getOrganisationDisplayName(customer)}
            organisationType="customer"
            onUpdate={() => handleCustomerUpdate({})}
          />
        </TabContent>

        <TabContent activeTab={activeTab} tabId="products">
          <CustomerProductsTab
            products={customerProducts}
            loading={productsLoading}
          />
        </TabContent>

        <TabContent activeTab={activeTab} tabId="orders">
          <OrganisationSalesOrdersSection
            organisationId={customer.id}
            organisationName={getOrganisationDisplayName(customer)}
            onUpdate={() => handleCustomerUpdate({})}
          />
        </TabContent>

        <TabContent activeTab={activeTab} tabId="pricing">
          <div className="text-center py-12">
            <Euro className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-black mb-2">
              Tarification Client
            </h3>
            <p className="text-gray-600">
              Produits avec prix spécifiques pour ce client (customer_pricing).
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Affichage des produits avec tarification personnalisée.
            </p>
          </div>
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

        {customer?.customer_type === 'professional' && (
          <TabContent activeTab={activeTab} tabId="samples">
            <CustomerSamplesSection
              customerId={customer.id}
              customerName={getOrganisationDisplayName(customer)}
            />
          </TabContent>
        )}

        <TabContent activeTab={activeTab} tabId="transactions">
          <OrganisationTransactionsSection
            organisationId={customer.id}
            organisationName={getOrganisationDisplayName(customer)}
          />
        </TabContent>
      </div>
    </div>
  );
}
