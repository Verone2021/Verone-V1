'use client';

import { useState, useEffect } from 'react';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import {
  useOrganisation,
  getOrganisationDisplayName,
} from '@verone/organisations';
import { ProductThumbnail } from '@verone/products';
import { Button, Badge } from '@verone/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import {
  ArrowLeft,
  Loader2,
  Building2,
  MapPin,
  Package,
  ShoppingBag,
  Eye,
  ShoppingCart,
  ChevronRight,
} from 'lucide-react';

/**
 * Type pour les sélections de l'affilié
 */
interface OrganisationSelection {
  id: string;
  name: string;
  description: string | null;
  status: 'draft' | 'active' | 'archived';
  is_public: boolean;
  products_count: number;
  views_count: number;
  orders_count: number;
  created_at: string;
}

/**
 * Hook pour récupérer les sélections d'une organisation via l'affilié
 *
 * ARCHITECTURE: Requête DIRECTE par organisation_id
 * linkme_affiliates.organisation_id = organisationId
 */
function useOrganisationSelections(organisationId: string | null) {
  const [selections, setSelections] = useState<OrganisationSelection[]>([]);
  const [loading, setLoading] = useState(true);
  const [affiliateInfo, setAffiliateInfo] = useState<{
    id: string;
    display_name: string;
    status: string | null;
  } | null>(null);

  useEffect(() => {
    if (!organisationId) {
      setLoading(false);
      return;
    }

    const fetchSelections = async () => {
      setLoading(true);
      const supabase = createClient();

      // Requête DIRECTE: chercher affilié avec organisation_id
      const { data: affiliate } = await supabase
        .from('linkme_affiliates')
        .select('id, display_name, status')
        .eq('organisation_id', organisationId)
        .single();

      if (!affiliate) {
        setSelections([]);
        setAffiliateInfo(null);
        setLoading(false);
        return;
      }

      setAffiliateInfo(affiliate);

      // Récupérer les sélections de cet affilié
      const { data, error } = await supabase
        .from('linkme_selections')
        .select(
          'id, name, description, status, is_public, products_count, views_count, orders_count, created_at'
        )
        .eq('affiliate_id', affiliate.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur chargement sélections:', error);
        setSelections([]);
      } else {
        setSelections((data || []) as OrganisationSelection[]);
      }
      setLoading(false);
    };

    fetchSelections();
  }, [organisationId]);

  return { selections, loading, affiliateInfo };
}

/**
 * Type pour les produits sourcés par organisation
 */
interface OrganisationProduct {
  id: string;
  name: string;
  supplier_reference: string | null;
  primary_image_url: string | null;
  created_at: string | null;
}

/**
 * Hook pour récupérer les produits sourcés pour une organisation
 * Cherche selon le type: assigned_client_id (customer) ou supplier_id (supplier)
 */
function useOrganisationProducts(
  organisationId: string | null,
  organisationType: string | null
) {
  const [products, setProducts] = useState<OrganisationProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organisationId || !organisationType) {
      setLoading(false);
      return;
    }

    const fetchProducts = async () => {
      setLoading(true);
      const supabase = createClient();

      // Choisir la colonne selon le type d'organisation
      const columnFilter =
        organisationType === 'supplier' ? 'supplier_id' : 'assigned_client_id';

      const { data, error } = await supabase
        .from('products')
        .select(
          `
          id,
          name,
          supplier_reference,
          created_at,
          product_images!left(public_url, is_primary)
        `
        )
        .eq(columnFilter, organisationId)
        .is('archived_at', null)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        // Si join échoue, essayer sans images
        const { data: dataNoImg, error: errorNoImg } = await supabase
          .from('products')
          .select('id, name, supplier_reference, created_at')
          .eq(columnFilter, organisationId)
          .is('archived_at', null)
          .order('created_at', { ascending: false })
          .limit(50);

        if (errorNoImg) {
          console.error('Erreur chargement produits organisation:', errorNoImg);
          setProducts([]);
        } else {
          setProducts(
            (dataNoImg || []).map(p => ({
              ...p,
              primary_image_url: null,
            }))
          );
        }
      } else {
        // Transformer les données pour aplatir public_url
        setProducts(
          (data || []).map((p: any) => {
            const primaryImg = (p.product_images || []).find(
              (img: any) => img.is_primary
            );
            return {
              id: p.id,
              name: p.name,
              supplier_reference: p.supplier_reference,
              created_at: p.created_at,
              primary_image_url: primaryImg?.public_url || null,
            };
          })
        );
      }
      setLoading(false);
    };

    fetchProducts();
  }, [organisationId, organisationType]);

  return { products, loading };
}

/**
 * Retourne l'URL de retour selon le type d'organisation
 */
function getReturnUrl(orgType: string | null, orgId: string): string {
  switch (orgType) {
    case 'customer':
      return `/contacts-organisations/customers/${orgId}`;
    case 'supplier':
      return `/contacts-organisations/suppliers/${orgId}`;
    case 'partner':
      return `/contacts-organisations/partners/${orgId}`;
    default:
      return '/canaux-vente/linkme';
  }
}

/**
 * Retourne le label du type d'organisation
 */
function getTypeLabel(orgType: string | null): string {
  switch (orgType) {
    case 'customer':
      return 'Client';
    case 'supplier':
      return 'Fournisseur';
    case 'partner':
      return 'Partenaire';
    default:
      return 'Organisation';
  }
}

/**
 * Page détail organisation LinkMe
 * Affiche les informations d'une organisation affiliée avec onglets
 */
export default function OrganisationLinkMeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  // Hook pour données organisation
  const {
    organisation,
    loading: orgLoading,
    error: orgError,
  } = useOrganisation(id);

  const { products, loading: productsLoading } = useOrganisationProducts(
    id,
    organisation?.type || null
  );
  const {
    selections,
    loading: selectionsLoading,
    affiliateInfo,
  } = useOrganisationSelections(id);

  // État onglet actif
  const [activeTab, setActiveTab] = useState('overview');

  // Gestion erreur
  if (orgError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-red-500">Erreur : {orgError}</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
      </div>
    );
  }

  // Chargement
  if (orgLoading || !organisation) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // Si pas d'affilié LinkMe pour cette organisation
  if (!affiliateInfo && !selectionsLoading) {
    return (
      <div className="space-y-6">
        {/* Header avec bouton retour */}
        <div className="flex items-center gap-4">
          <Link href={getReturnUrl(organisation.type, id)}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à l&apos;organisation
            </Button>
          </Link>
        </div>

        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="py-8 text-center">
            <ShoppingBag className="h-12 w-12 mx-auto text-amber-400 mb-4" />
            <h2 className="text-lg font-semibold mb-2">Pas de compte LinkMe</h2>
            <p className="text-sm text-gray-600 mb-4">
              L&apos;organisation{' '}
              <strong>{getOrganisationDisplayName(organisation)}</strong>{' '}
              n&apos;a pas encore de compte affilié LinkMe.
            </p>
            <Button
              variant="outline"
              onClick={() => router.push('/canaux-vente/linkme/affilies')}
            >
              Voir les affiliés LinkMe
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const returnUrl = getReturnUrl(organisation.type, id);
  const typeLabel = getTypeLabel(organisation.type);

  return (
    <div className="space-y-6">
      {/* Header avec bouton retour */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={returnUrl}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour {typeLabel}
            </Button>
          </Link>
        </div>
      </div>

      {/* Card Header Organisation */}
      <Card>
        <CardContent className="py-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-xl bg-purple-100 flex items-center justify-center">
                <Building2 className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl font-semibold">
                    {getOrganisationDisplayName(organisation)}
                  </h1>
                  <Badge
                    variant="secondary"
                    className="bg-purple-100 text-purple-700"
                  >
                    LinkMe
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5" />
                    {typeLabel}
                  </span>
                  {organisation.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {organisation.city}
                    </span>
                  )}
                </div>
                {affiliateInfo && (
                  <div className="flex items-center gap-2 mt-2">
                    <Badge
                      variant={
                        affiliateInfo.status === 'active'
                          ? 'default'
                          : 'secondary'
                      }
                      className={
                        affiliateInfo.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : ''
                      }
                    >
                      Affilié{' '}
                      {affiliateInfo.status === 'active'
                        ? 'actif'
                        : affiliateInfo.status}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList variant="underline" className="w-full justify-start border-b">
          <TabsTrigger value="overview" variant="underline">
            <Building2 className="h-4 w-4 mr-2" />
            Informations
          </TabsTrigger>
          <TabsTrigger value="products" variant="underline">
            <Package className="h-4 w-4 mr-2" />
            Produits ({products.length})
          </TabsTrigger>
          <TabsTrigger value="selections" variant="underline">
            <ShoppingBag className="h-4 w-4 mr-2" />
            Sélections ({selections.length})
          </TabsTrigger>
        </TabsList>

        {/* Onglet Informations */}
        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Infos Organisation */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Informations Organisation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Nom légal</span>
                  <span className="font-medium">{organisation.legal_name}</span>
                </div>
                {organisation.trade_name && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Nom commercial</span>
                    <span className="font-medium">
                      {organisation.trade_name}
                    </span>
                  </div>
                )}
                {organisation.siret && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">SIRET</span>
                    <span className="font-mono">{organisation.siret}</span>
                  </div>
                )}
                {organisation.city && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Ville</span>
                    <span>{organisation.city}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Infos Affilié LinkMe */}
            {affiliateInfo && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Compte LinkMe</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Nom d&apos;affichage</span>
                    <span className="font-medium">
                      {affiliateInfo.display_name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Statut</span>
                    <Badge
                      variant={
                        affiliateInfo.status === 'active'
                          ? 'default'
                          : 'secondary'
                      }
                      className={
                        affiliateInfo.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : ''
                      }
                    >
                      {affiliateInfo.status === 'active'
                        ? 'Actif'
                        : affiliateInfo.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Sélections</span>
                    <span className="font-medium">{selections.length}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Onglet Produits */}
        <TabsContent value="products" className="mt-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center">
                <Package className="h-5 w-5 mr-2 text-blue-500" />
                Produits liés
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({products.length} produit{products.length > 1 ? 's' : ''})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {productsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : products.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  Aucun produit lié à cette organisation
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {products.map(product => (
                    <div
                      key={product.id}
                      className="group cursor-pointer"
                      onClick={() =>
                        router.push(`/catalogue/produits/${product.id}`)
                      }
                    >
                      <ProductThumbnail
                        src={product.primary_image_url}
                        alt={product.name}
                        size="lg"
                        className="group-hover:ring-2 ring-blue-500 transition-all"
                      />
                      <p className="mt-2 text-xs font-medium truncate">
                        {product.name}
                      </p>
                      {product.supplier_reference && (
                        <p className="text-xs text-gray-500 truncate">
                          {product.supplier_reference}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Sélections */}
        <TabsContent value="selections" className="mt-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center">
                <ShoppingBag className="h-5 w-5 mr-2 text-purple-500" />
                Sélections de produits
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({selections.length} sélection
                  {selections.length > 1 ? 's' : ''})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectionsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : selections.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingBag className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-sm text-gray-500 mb-4">
                    Aucune sélection pour cette organisation
                  </p>
                  <Button
                    variant="outline"
                    onClick={() =>
                      router.push('/canaux-vente/linkme/selections')
                    }
                  >
                    Voir toutes les sélections
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {selections.map(selection => {
                    const selectionStatusConfig = {
                      draft: {
                        label: 'Brouillon',
                        variant: 'secondary' as const,
                        className: 'bg-gray-100 text-gray-700',
                      },
                      active: {
                        label: 'Active',
                        variant: 'default' as const,
                        className: 'bg-green-100 text-green-700',
                      },
                      archived: {
                        label: 'Archivée',
                        variant: 'outline' as const,
                        className: 'bg-gray-50 text-gray-500',
                      },
                    };
                    const config =
                      selectionStatusConfig[selection.status] ||
                      selectionStatusConfig.draft;

                    return (
                      <div
                        key={selection.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group"
                        onClick={() =>
                          router.push(
                            `/canaux-vente/linkme/selections/${selection.id}`
                          )
                        }
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium truncate">
                              {selection.name}
                            </h3>
                            <Badge
                              variant={config.variant}
                              className={config.className}
                            >
                              {config.label}
                            </Badge>
                            {selection.is_public && (
                              <Badge
                                variant="outline"
                                className="bg-blue-50 text-blue-600"
                              >
                                Public
                              </Badge>
                            )}
                          </div>
                          {selection.description && (
                            <p className="text-sm text-gray-500 truncate mb-2">
                              {selection.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Package className="h-3.5 w-3.5" />
                              {selection.products_count} produit
                              {selection.products_count > 1 ? 's' : ''}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="h-3.5 w-3.5" />
                              {selection.views_count} vue
                              {selection.views_count > 1 ? 's' : ''}
                            </span>
                            <span className="flex items-center gap-1">
                              <ShoppingCart className="h-3.5 w-3.5" />
                              {selection.orders_count} commande
                              {selection.orders_count > 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
