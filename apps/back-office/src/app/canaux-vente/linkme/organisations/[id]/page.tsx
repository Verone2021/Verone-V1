'use client';

import { useState, useEffect } from 'react';

import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';

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
  FileText,
  Users,
  Briefcase,
} from 'lucide-react';

/**
 * Type pour l'organisation
 */
interface OrganisationDetail {
  id: string;
  legal_name: string;
  trade_name: string | null;
  logo_url: string | null;
  siret: string | null;
  siren: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
}

/**
 * Type pour les sélections
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
 * Type pour les produits sourcés
 */
interface OrganisationProduct {
  id: string;
  name: string;
  supplier_reference: string | null;
  primary_image_url: string | null;
}

/**
 * Hook pour récupérer les détails d'une organisation
 */
function useOrganisation(organisationId: string | null) {
  const [organisation, setOrganisation] = useState<OrganisationDetail | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!organisationId) {
      setLoading(false);
      return;
    }

    const fetchOrganisation = async () => {
      setLoading(true);
      const supabase = createClient();

      const { data, error } = await supabase
        .from('organisations')
        .select(
          `
          id, legal_name, trade_name, logo_url,
          siret, siren,
          address_line1, address_line2, city, postal_code, country,
          phone, email
        `
        )
        .eq('id', organisationId)
        .single();

      if (error) {
        console.error('Erreur chargement organisation:', error);
        setError('Organisation non trouvée');
      } else {
        setOrganisation(data);
      }
      setLoading(false);
    };

    fetchOrganisation();
  }, [organisationId]);

  return { organisation, loading, error };
}

/**
 * Hook pour récupérer les sélections d'une organisation via l'affilié
 */
function useOrganisationSelections(organisationId: string | null) {
  const [selections, setSelections] = useState<OrganisationSelection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organisationId) {
      setLoading(false);
      return;
    }

    const fetchSelections = async () => {
      setLoading(true);
      const supabase = createClient();

      // Chercher l'affilié lié à cette organisation
      const { data: affiliate } = await supabase
        .from('linkme_affiliates')
        .select('id')
        .eq('organisation_id', organisationId)
        .single();

      if (!affiliate) {
        // Pas d'affilié = pas de sélections
        setSelections([]);
        setLoading(false);
        return;
      }

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

  return { selections, loading };
}

/**
 * Hook pour récupérer les produits sourcés pour une organisation
 */
function useOrganisationProducts(organisationId: string | null) {
  const [products, setProducts] = useState<OrganisationProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organisationId) {
      setLoading(false);
      return;
    }

    const fetchProducts = async () => {
      setLoading(true);
      const supabase = createClient();

      // Récupérer les produits liés à cette organisation (supplier_id)
      const { data, error } = await supabase
        .from('products')
        .select(
          `
          id, name, supplier_reference,
          product_images!left(public_url, is_primary)
        `
        )
        .eq('supplier_id', organisationId)
        .is('archived_at', null)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        // Fallback sans images
        const { data: dataNoImg } = await supabase
          .from('products')
          .select('id, name, supplier_reference')
          .eq('supplier_id', organisationId)
          .is('archived_at', null)
          .order('created_at', { ascending: false })
          .limit(50);

        setProducts(
          (dataNoImg || []).map(p => ({ ...p, primary_image_url: null }))
        );
      } else {
        setProducts(
          (data || []).map((p: any) => {
            const primaryImg = (p.product_images || []).find(
              (img: any) => img.is_primary
            );
            return {
              id: p.id,
              name: p.name,
              supplier_reference: p.supplier_reference,
              primary_image_url: primaryImg?.public_url || null,
            };
          })
        );
      }
      setLoading(false);
    };

    fetchProducts();
  }, [organisationId]);

  return { products, loading };
}

/**
 * Hook pour récupérer le nombre d'utilisateurs LinkMe pour cette organisation
 */
function useOrganisationUsersCount(organisationId: string | null) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organisationId) {
      setLoading(false);
      return;
    }

    const fetchCount = async () => {
      setLoading(true);
      const supabase = createClient();

      const { count: userCount, error } = await supabase
        .from('v_linkme_users')
        .select('*', { count: 'exact', head: true })
        .eq('organisation_id', organisationId);

      if (!error && userCount !== null) {
        setCount(userCount);
      }
      setLoading(false);
    };

    fetchCount();
  }, [organisationId]);

  return { count, loading };
}

/**
 * Page détail organisation LinkMe
 * Structure identique à enseignes mais adaptée aux organisations
 */
export default function OrganisationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  // Hooks pour données
  const {
    organisation,
    loading: orgLoading,
    error: orgError,
  } = useOrganisation(id);
  const { products, loading: productsLoading } = useOrganisationProducts(id);
  const { selections, loading: selectionsLoading } =
    useOrganisationSelections(id);
  const { count: usersCount, loading: usersLoading } =
    useOrganisationUsersCount(id);

  // État onglet actif
  const [activeTab, setActiveTab] = useState('infos');

  // Logo URL helper
  const getLogoUrl = (logoPath: string | null) => {
    if (!logoPath) return null;
    if (logoPath.startsWith('http')) return logoPath;
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/organisation-logos/${logoPath}`;
  };

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

  const displayName = organisation.trade_name || organisation.legal_name;

  return (
    <div className="space-y-6">
      {/* Header - PAS de bouton Modifier */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>

          {/* Logo */}
          <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden border">
            {organisation.logo_url ? (
              <Image
                src={getLogoUrl(organisation.logo_url) || ''}
                alt={displayName}
                width={48}
                height={48}
                className="object-contain"
              />
            ) : (
              <Briefcase className="h-6 w-6 text-gray-400" />
            )}
          </div>

          <div>
            <h1 className="text-2xl font-bold">{displayName}</h1>
            {organisation.trade_name &&
              organisation.trade_name !== organisation.legal_name && (
                <p className="text-sm text-muted-foreground">
                  {organisation.legal_name}
                </p>
              )}
          </div>

          <Badge variant="default" className="bg-green-100 text-green-700">
            Active
          </Badge>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Produits sourcés
            </CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {productsLoading ? '...' : products.length}
            </div>
            <p className="text-xs text-muted-foreground">
              produits dans le catalogue
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sélections</CardTitle>
            <ShoppingBag className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {selectionsLoading ? '...' : selections.length}
            </div>
            <p className="text-xs text-muted-foreground">sélections créées</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Utilisateurs LinkMe
            </CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usersLoading ? '...' : usersCount}
            </div>
            <p className="text-xs text-muted-foreground">utilisateurs actifs</p>
          </CardContent>
        </Card>
      </div>

      {/* Onglets - Infos, Produits, Sélections (PAS de Géographie ni Organisation) */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList variant="underline" className="w-full justify-start border-b">
          <TabsTrigger value="infos" variant="underline">
            <FileText className="h-4 w-4 mr-2" />
            Informations personnelles
          </TabsTrigger>
          <TabsTrigger value="products" variant="underline">
            <Package className="h-4 w-4 mr-2" />
            Produits sourcés ({products.length})
          </TabsTrigger>
          <TabsTrigger value="selections" variant="underline">
            <ShoppingBag className="h-4 w-4 mr-2" />
            Sélections ({selections.length})
          </TabsTrigger>
        </TabsList>

        {/* Onglet Informations personnelles */}
        <TabsContent value="infos" className="mt-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-500" />
                Informations de l&apos;organisation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Raison sociale
                    </p>
                    <p className="font-medium">{organisation.legal_name}</p>
                  </div>
                  {organisation.trade_name &&
                    organisation.trade_name !== organisation.legal_name && (
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Nom commercial
                        </p>
                        <p className="font-medium">{organisation.trade_name}</p>
                      </div>
                    )}
                  {(organisation.siret || organisation.siren) && (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {organisation.siret ? 'SIRET' : 'SIREN'}
                      </p>
                      <p className="font-medium">
                        {organisation.siret || organisation.siren}
                      </p>
                    </div>
                  )}
                </div>
                <div className="space-y-4 border-l pl-6">
                  {(organisation.address_line1 || organisation.city) && (
                    <div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        Adresse
                      </p>
                      <p className="font-medium">
                        {[
                          organisation.address_line1,
                          organisation.address_line2,
                          organisation.postal_code,
                          organisation.city,
                          organisation.country,
                        ]
                          .filter(Boolean)
                          .join(', ') || '-'}
                      </p>
                    </div>
                  )}
                  {organisation.email && (
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{organisation.email}</p>
                    </div>
                  )}
                  {organisation.phone && (
                    <div>
                      <p className="text-sm text-muted-foreground">Téléphone</p>
                      <p className="font-medium">{organisation.phone}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Produits sourcés */}
        <TabsContent value="products" className="mt-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center">
                <Package className="h-5 w-5 mr-2 text-blue-500" />
                Produits sourcés par {displayName}
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
                  Aucun produit sourcé pour cette organisation
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {products.map(product => (
                    <div
                      key={product.id}
                      className="group cursor-pointer"
                      onClick={() =>
                        router.push(`/produits/catalogue/${product.id}`)
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
                    const statusConfig = {
                      draft: {
                        label: 'Brouillon',
                        className: 'bg-gray-100 text-gray-700',
                      },
                      active: {
                        label: 'Active',
                        className: 'bg-green-100 text-green-700',
                      },
                      archived: {
                        label: 'Archivée',
                        className: 'bg-gray-50 text-gray-500',
                      },
                    };
                    const config =
                      statusConfig[selection.status] || statusConfig.draft;

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
                            <Badge className={config.className}>
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
