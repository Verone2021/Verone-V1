'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

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
// Phase 1: organisation-products-section désactivé (Phase 2+)
// import { OrganisationProductsSection } from '@verone/organisations'
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
  Euro,
  FlaskConical,
  Store,
  Sparkles,
  Wallet,
} from 'lucide-react';

// Interface pour les images de produit (Supabase join)
interface ProductImageRow {
  public_url: string | null;
  is_primary: boolean;
}

// Interface pour les produits retournés par Supabase
interface ProductWithImages {
  id: string;
  name: string;
  sku: string | null;
  product_status: string;
  created_at: string | null;
  product_images: ProductImageRow[] | null;
}

// Interface pour les produits du client
interface CustomerProduct {
  id: string;
  name: string;
  sku: string | null;
  product_status: string;
  created_at: string | null;
  primary_image_url?: string | null;
}

// Interface pour les canaux de vente de l'organisation
interface OrganisationChannel {
  code: 'linkme' | 'site-internet' | 'b2b';
  name: string;
  link: string;
  isActive: boolean;
}

// Helper pour générer le badge ownership_type
function getOwnershipBadge(
  type: string | null
): { label: string; className: string } | null {
  switch (type) {
    case 'succursale':
      return { label: 'Propre', className: 'bg-blue-100 text-blue-700' };
    case 'franchise':
      return { label: 'Franchise', className: 'bg-amber-100 text-amber-700' };
    default:
      return null;
  }
}

export default function CustomerDetailPage() {
  const { customerId } = useParams();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl');
  const [activeTab, setActiveTab] = useState('contacts');
  const [customerProducts, setCustomerProducts] = useState<CustomerProduct[]>(
    []
  );
  const [productsLoading, setProductsLoading] = useState(false);
  // État pour les canaux de vente
  const [organisationChannels, setOrganisationChannels] = useState<
    OrganisationChannel[]
  >([]);

  const {
    organisation: customer,
    loading,
    error,
    refetch: refetchCustomer,
  } = useOrganisation(customerId as string);

  // Charger les produits sourcés pour ce client
  useEffect(() => {
    async function fetchCustomerProducts() {
      if (!customerId || typeof customerId !== 'string') return;
      setProductsLoading(true);
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('products')
          .select(
            `id, name, sku, product_status, created_at,
            product_images!left(public_url, is_primary)`
          )
          .eq('assigned_client_id', customerId)
          .order('created_at', { ascending: false });

        // Mapper les données avec l'image primaire
        const products = data as ProductWithImages[] | null;
        const mappedProducts: CustomerProduct[] = (products ?? []).map(p => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          product_status: p.product_status,
          created_at: p.created_at,
          primary_image_url:
            p.product_images?.find(img => img.is_primary)?.public_url ?? null,
        }));
        setCustomerProducts(mappedProducts);
      } catch (err) {
        console.error('Erreur chargement produits client:', err);
      } finally {
        setProductsLoading(false);
      }
    }
    void fetchCustomerProducts().catch(error => {
      console.error('[CustomerDetail] Fetch products failed:', error);
    });
  }, [customerId]);

  // Charger les canaux de vente de cette organisation
  useEffect(() => {
    async function fetchOrganisationChannels() {
      if (!customerId || typeof customerId !== 'string') return;

      const channels: OrganisationChannel[] = [];

      try {
        const supabase = createClient();
        // Requête DIRECTE: chercher affilié avec organisation_id
        const { data: linkmeAffiliate } = await supabase
          .from('linkme_affiliates')
          .select('id, status')
          .eq('organisation_id', customerId)
          .single();

        if (linkmeAffiliate) {
          channels.push({
            code: 'linkme',
            name: 'LinkMe',
            link: `/canaux-vente/linkme/organisations/${customerId}`,
            isActive: linkmeAffiliate.status === 'active',
          });
        }

        setOrganisationChannels(channels);
      } catch (err) {
        console.error('Erreur chargement canaux organisation:', err);
      }
    }
    void fetchOrganisationChannels().catch(error => {
      console.error('[CustomerDetail] Fetch channels failed:', error);
    });
  }, [customerId]);

  const { archiveOrganisation, unarchiveOrganisation, refetch } =
    useOrganisations({ type: 'customer' });

  // Hook centralisé pour les compteurs d'onglets
  const { counts, refreshCounts } = useOrganisationTabCounts({
    organisationId: customerId as string,
    organisationType: 'customer',
  });

  // Gestionnaire de mise à jour des données client
  const handleCustomerUpdate = (_updatedData: Partial<Organisation>) => {
    // Rafraîchir les données du customer immédiatement
    refetchCustomer();
    // Rafraîchir la liste des organisations (cache)
    void refetch().catch(error => {
      console.error('[CustomerDetail] Refetch organisations failed:', error);
    });
    // Rafraîchir les compteurs
    void refreshCounts().catch(error => {
      console.error('[CustomerDetail] Refresh counts failed:', error);
    });
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
      id: 'products',
      label: 'Produits',
      icon: <Package className="h-4 w-4" />,
      badge: customerProducts.length.toString(),
    },
    {
      id: 'pricing',
      label: 'Tarification',
      icon: <Euro className="h-4 w-4" />,
      disabled: !isModuleDeployed('products'), // Nécessite products pour customer_pricing
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
    // Onglet Échantillons - uniquement pour clients professionnels
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
              Ce client n'existe pas ou vous n'avez pas les droits pour le
              consulter.
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

  const handleArchive = async () => {
    if (!customer.archived_at) {
      // Archiver
      const success = await archiveOrganisation(customer.id);
      if (success) {
        console.warn('✅ Client archivé avec succès');
        await refetch();
      }
    } else {
      // Restaurer
      const success = await unarchiveOrganisation(customer.id);
      if (success) {
        console.warn('✅ Client restauré avec succès');
        await refetch();
      }
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-2">
            {returnUrl ? (
              <Link href={decodeURIComponent(returnUrl)}>
                <ButtonV2
                  variant="ghost"
                  size="sm"
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Retour à LinkMe
                </ButtonV2>
              </Link>
            ) : (
              <Link href="/contacts-organisations/customers">
                <ButtonV2 variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Clients
                </ButtonV2>
              </Link>
            )}
          </div>
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="h-5 w-5 text-black" />
            <h1 className="text-lg font-semibold text-black">
              {getOrganisationDisplayName(customer)}
            </h1>
            <div className="flex gap-2">
              <Badge
                variant={customer.is_active ? 'secondary' : 'secondary'}
                className={
                  customer.is_active ? 'bg-green-100 text-green-800' : ''
                }
              >
                {customer.is_active ? 'Actif' : 'Inactif'}
              </Badge>
              {customer.archived_at && (
                <Badge
                  variant="destructive"
                  className="bg-red-100 text-red-800"
                >
                  Archivé
                </Badge>
              )}
              {customer.customer_type && (
                <Badge
                  variant="outline"
                  className="bg-blue-50 text-blue-700 border-blue-200"
                >
                  {customer.customer_type === 'professional'
                    ? 'Client Professionnel'
                    : 'Client Particulier'}
                </Badge>
              )}
              {customer.ownership_type &&
                (() => {
                  const badge = getOwnershipBadge(customer.ownership_type);
                  return badge ? (
                    <Badge
                      variant="outline"
                      className={cn('border-gray-200', badge.className)}
                    >
                      {badge.label}
                    </Badge>
                  ) : null;
                })()}
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Entreprise •{' '}
            {customer.customer_type === 'professional' ? 'B2B' : 'B2C'} • ID:{' '}
            {customer.id.slice(0, 8)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <ButtonV2
            variant={customer.archived_at ? 'success' : 'danger'}
            onClick={() => {
              void handleArchive().catch(error => {
                console.error('[CustomerDetail] Archive failed:', error);
              });
            }}
          >
            {customer.archived_at ? (
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
            organisation={customer}
            onUpdate={handleCustomerUpdate}
          />

          {/* Informations de Contact */}
          <ContactEditSection
            organisation={customer}
            onUpdate={handleCustomerUpdate}
          />

          {/* Adresse */}
          <AddressEditSection
            organisation={customer}
            onUpdate={handleCustomerUpdate}
          />

          {/* Conditions Commerciales - Uniquement pour les clients professionnels */}
          {customer.customer_type === 'professional' && (
            <CommercialEditSection
              organisation={customer}
              onUpdate={handleCustomerUpdate}
              organisationType="customer"
            />
          )}
        </div>

        {/* Colonne latérale - Logo, Performance et Statistiques */}
        <div className="space-y-4">
          {/* Logo de l'organisation - Composant réutilisable */}
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

          {/* Performance & Qualité - Uniquement pour les clients professionnels */}
          {customer.customer_type === 'professional' && (
            <PerformanceEditSection
              organisation={customer}
              onUpdate={handleCustomerUpdate}
              organisationType="customer"
            />
          )}

          {/* Statistiques - Composant réutilisable */}
          <OrganisationStatsCard
            organisation={customer}
            organisationType="customer"
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
            organisationId={customer.id}
            organisationName={getOrganisationDisplayName(customer)}
            organisationType="customer"
            onUpdate={() => handleCustomerUpdate({})}
          />
        </TabContent>

        <TabContent activeTab={activeTab} tabId="products">
          {productsLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4" />
              <p className="text-gray-600">Chargement des produits...</p>
            </div>
          ) : customerProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-black mb-2">
                Aucun produit sourcé
              </h3>
              <p className="text-gray-600">
                Aucun produit n'a été sourcé pour ce client.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-black">
                  Produits sourcés pour ce client
                </h3>
                <Badge variant="secondary">{customerProducts.length}</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {customerProducts.map(product => (
                  <Link
                    key={product.id}
                    href={`/produits/catalogue/${product.id}`}
                    className="block"
                  >
                    <Card className="hover:border-black transition-colors cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          {product.primary_image_url ? (
                            <Image
                              src={product.primary_image_url}
                              alt={product.name}
                              width={48}
                              height={48}
                              className="object-cover rounded"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                              <Package className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-black truncate">
                              {product.name}
                            </h4>
                            {product.sku && (
                              <p className="text-xs text-gray-500">
                                SKU: {product.sku}
                              </p>
                            )}
                            <Badge
                              variant={
                                product.product_status === 'active'
                                  ? 'success'
                                  : 'secondary'
                              }
                              size="sm"
                              className="mt-1"
                            >
                              {product.product_status === 'active'
                                ? 'Actif'
                                : product.product_status}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
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

        {/* Onglet Échantillons - uniquement pour clients professionnels */}
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
