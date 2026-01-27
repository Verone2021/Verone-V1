'use client';

/**
 * Page détail enseigne - Version professionnelle 2025
 *
 * Features:
 * - Header avec logo, nom, statut
 * - 4 KPIs business (organisations, CA total, CA moyen, villes)
 * - Répartition géographique avec barres CA
 * - Tableau organisations avec CA par membre
 * - Modal deux colonnes pour gestion organisations
 *
 * @module EnseigneDetailPage
 */

import { useState, useCallback, useEffect } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import {
  useEnseigne,
  useEnseignes,
  useEnseigneStats,
  OrganisationSelectorModal,
  EnseigneDetailHeader,
  EnseigneKPIGrid,
  EnseigneGeographySection,
  EnseigneOrganisationsTable,
} from '@verone/organisations';
import { ButtonV2 } from '@verone/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@verone/ui';
import { Input } from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@verone/ui';
import { Label } from '@verone/ui';
import { Switch } from '@verone/ui';
import { Badge } from '@verone/ui';
import { cn } from '@verone/utils';
import { createClient } from '@verone/utils/supabase/client';
import {
  ArrowLeft,
  Loader2,
  Package,
  Building2,
  MapPin,
  Store,
  Sparkles,
  Globe,
} from 'lucide-react';

// Interface pour les produits de l'enseigne
interface EnseigneProduct {
  id: string;
  name: string;
  sku: string | null;
  product_status: string;
  created_at: string | null;
  primary_image_url?: string | null;
}

// Interface pour les canaux de vente de l'enseigne
interface EnseigneChannel {
  code: 'linkme' | 'site-internet' | 'b2b';
  name: string;
  link: string;
  isActive: boolean;
}

export default function EnseigneDetailPage() {
  const params = useParams();
  const router = useRouter();
  const enseigneId = params.id as string;

  const supabase = createClient();

  // Hooks données
  const {
    enseigne,
    loading,
    error,
    refetch: refetchEnseigne,
  } = useEnseigne(enseigneId);
  const {
    updateEnseigne,
    deleteEnseigne,
    linkOrganisationToEnseigne,
    unlinkOrganisationFromEnseigne,
  } = useEnseignes();
  const {
    stats,
    loading: statsLoading,
    refetch: refetchStats,
  } = useEnseigneStats(enseigneId);

  // Tab state
  const [activeTab, setActiveTab] = useState('overview');

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isOrganisationModalOpen, setIsOrganisationModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    logo_url: '',
    is_active: true,
  });

  // État pour les produits de l'enseigne
  const [enseigneProducts, setEnseigneProducts] = useState<EnseigneProduct[]>(
    []
  );
  const [productsLoading, setProductsLoading] = useState(false);

  // État pour les canaux de vente de l'enseigne
  const [enseigneChannels, setEnseigneChannels] = useState<EnseigneChannel[]>(
    []
  );

  // Charger les produits de cette enseigne
  useEffect(() => {
    async function fetchEnseigneProducts() {
      if (!enseigneId) return;
      setProductsLoading(true);
      try {
        const { data } = await supabase
          .from('products')
          .select(
            `id, name, sku, product_status, created_at,
            product_images!left(public_url, is_primary)`
          )
          .eq('enseigne_id', enseigneId)
          .order('created_at', { ascending: false });

        // Mapper les données avec l'image primaire
        const mappedProducts: EnseigneProduct[] = (data || []).map(p => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          product_status: p.product_status,
          created_at: p.created_at,
          primary_image_url:
            (
              p.product_images as { public_url: string; is_primary: boolean }[]
            )?.find(img => img.is_primary)?.public_url || null,
        }));
        setEnseigneProducts(mappedProducts);
      } catch (err) {
        console.error('Erreur chargement produits enseigne:', err);
      } finally {
        setProductsLoading(false);
      }
    }
    fetchEnseigneProducts();
  }, [enseigneId, supabase]);

  // Charger les canaux de vente de cette enseigne
  useEffect(() => {
    async function fetchEnseigneChannels() {
      if (!enseigneId) return;

      const channels: EnseigneChannel[] = [];

      try {
        // 1. Vérifier si compte LinkMe existe
        // Requête: linkme_affiliates via organisations.enseigne_id
        const { data: linkmeAffiliate } = await supabase
          .from('linkme_affiliates')
          .select(
            `
            id,
            status,
            organisation:organisations!organisation_id(enseigne_id)
          `
          )
          .not('organisation_id', 'is', null)
          .single();

        // Vérifier si l'affiliate est lié à cette enseigne via son organisation
        if (linkmeAffiliate) {
          const org = linkmeAffiliate.organisation as unknown as {
            enseigne_id: string | null;
          };
          if (org?.enseigne_id === enseigneId) {
            channels.push({
              code: 'linkme',
              name: 'LinkMe',
              link: `/canaux-vente/linkme/enseignes/${enseigneId}`,
              isActive: linkmeAffiliate.status === 'active',
            });
          }
        }

        // 2. TODO: Vérifier autres canaux (Site Internet, etc.)
        // Pour l'instant, pas d'autres canaux implémentés

        setEnseigneChannels(channels);
      } catch (err) {
        console.error('Erreur chargement canaux enseigne:', err);
      }
    }
    fetchEnseigneChannels();
  }, [enseigneId, supabase]);

  // Refresh tout
  const handleRefresh = useCallback(() => {
    refetchEnseigne();
    refetchStats();
  }, [refetchEnseigne, refetchStats]);

  // Ouvrir modal édition
  const handleOpenEditModal = () => {
    if (enseigne) {
      setFormData({
        name: enseigne.name,
        description: enseigne.description || '',
        logo_url: enseigne.logo_url || '',
        is_active: enseigne.is_active,
      });
      setIsEditModalOpen(true);
    }
  };

  // Soumettre édition
  const handleSubmitEdit = async () => {
    if (!enseigne || !formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      await updateEnseigne({
        id: enseigne.id,
        ...formData,
      });
      setIsEditModalOpen(false);
      handleRefresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Supprimer enseigne
  const handleDelete = async () => {
    if (!enseigne) return;

    setIsSubmitting(true);
    try {
      const success = await deleteEnseigne(enseigne.id);
      if (success) {
        router.push('/contacts-organisations/enseignes');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sauvegarder organisations depuis le modal deux colonnes
  const handleSaveOrganisations = async (
    organisationIds: string[],
    parentId: string | null
  ): Promise<boolean> => {
    if (!enseigne) return false;

    try {
      // 1. Récupérer les IDs actuels
      const currentIds = new Set(enseigne.organisations?.map(o => o.id) || []);
      const newIds = new Set(organisationIds);

      // 2. Organisations à ajouter
      const toAdd = organisationIds.filter(id => !currentIds.has(id));

      // 3. Organisations à retirer
      const toRemove = [...currentIds].filter(id => !newIds.has(id));

      // 4. Exécuter les ajouts
      for (const orgId of toAdd) {
        const isParent = orgId === parentId;
        await linkOrganisationToEnseigne(orgId, enseigne.id, isParent);
      }

      // 5. Exécuter les retraits
      for (const orgId of toRemove) {
        await unlinkOrganisationFromEnseigne(orgId);
      }

      // 6. Mettre à jour le parent si changé
      // Si le parent a changé, mettre à jour les flags
      const currentParent = enseigne.organisations?.find(
        o => o.is_enseigne_parent
      );
      if (currentParent?.id !== parentId) {
        // Reset ancien parent
        if (currentParent && newIds.has(currentParent.id)) {
          await (supabase as any)
            .from('organisations')
            .update({ is_enseigne_parent: false })
            .eq('id', currentParent.id);
        }
        // Set nouveau parent
        if (parentId && newIds.has(parentId)) {
          await (supabase as any)
            .from('organisations')
            .update({ is_enseigne_parent: true })
            .eq('id', parentId);
        }
      }

      handleRefresh();
      return true;
    } catch (err) {
      console.error('Erreur sauvegarde organisations:', err);
      return false;
    }
  };

  // Retirer une organisation depuis le tableau
  const handleRemoveOrganisation = async (organisationId: string) => {
    await unlinkOrganisationFromEnseigne(organisationId);
    handleRefresh();
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-24 bg-white rounded-lg border" />
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-20 bg-white rounded-lg border" />
              ))}
            </div>
            <div className="h-64 bg-white rounded-lg border" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-6">
          <Card>
            <CardContent className="p-8">
              <div className="text-center text-red-600">
                <p className="text-lg font-medium">Erreur</p>
                <p className="mt-2">{error}</p>
                <Link href="/contacts-organisations/enseignes">
                  <ButtonV2 variant="ghost" className="mt-4">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour aux enseignes
                  </ButtonV2>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Not found state
  if (!enseigne) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-6">
          <Card>
            <CardContent className="p-8">
              <div className="text-center text-gray-500">
                <p className="text-lg font-medium">Enseigne non trouvée</p>
                <p className="mt-2">
                  L'enseigne demandée n'existe pas ou a été supprimée.
                </p>
                <Link href="/contacts-organisations/enseignes">
                  <ButtonV2 variant="ghost" className="mt-4">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour aux enseignes
                  </ButtonV2>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <EnseigneDetailHeader
        enseigne={enseigne}
        onEdit={handleOpenEditModal}
        onManageOrganisations={() => setIsOrganisationModalOpen(true)}
      />

      {/* Contenu principal */}
      <div className="container mx-auto p-6 space-y-6">
        {/* Section Canaux de Vente */}
        {enseigneChannels.length > 0 && (
          <Card className="border-purple-200 bg-purple-50/30">
            <CardContent className="py-3">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Store className="h-4 w-4" />
                  Canaux de vente:
                </span>
                <div className="flex flex-wrap gap-2">
                  {enseigneChannels.map(channel => (
                    <Link key={channel.code} href={channel.link}>
                      <Badge
                        variant={channel.isActive ? 'default' : 'outline'}
                        className={cn(
                          'cursor-pointer hover:opacity-80 transition-opacity',
                          channel.code === 'linkme' &&
                            'bg-purple-600 hover:bg-purple-700 text-white',
                          channel.code === 'site-internet' &&
                            'bg-blue-600 hover:bg-blue-700 text-white',
                          channel.code === 'b2b' &&
                            'bg-emerald-600 hover:bg-emerald-700 text-white'
                        )}
                      >
                        {channel.code === 'linkme' && (
                          <Sparkles className="h-3 w-3 mr-1" />
                        )}
                        {channel.code === 'site-internet' && (
                          <Globe className="h-3 w-3 mr-1" />
                        )}
                        {channel.code === 'b2b' && (
                          <Building2 className="h-3 w-3 mr-1" />
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

        {/* Hook jaune - Organisation Mère */}
        {stats?.parentOrganisation && (
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="py-4">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-amber-600" />
                  <span className="font-medium text-amber-900">
                    {stats.parentOrganisation.trade_name ||
                      stats.parentOrganisation.legal_name}
                  </span>
                  <span className="text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded">
                    Siege
                  </span>
                </div>
                {(stats.parentOrganisation.siret ||
                  stats.parentOrganisation.siren) && (
                  <div className="text-sm text-amber-800">
                    <span className="font-medium">
                      {stats.parentOrganisation.siret ? 'SIRET' : 'SIREN'}:
                    </span>{' '}
                    {stats.parentOrganisation.siret ||
                      stats.parentOrganisation.siren}
                  </div>
                )}
                {(stats.parentOrganisation.billing_address_line1 ||
                  stats.parentOrganisation.billing_postal_code ||
                  stats.parentOrganisation.billing_city) && (
                  <div className="flex items-center gap-1.5 text-sm text-amber-800">
                    <MapPin className="h-3.5 w-3.5" />
                    {[
                      stats.parentOrganisation.billing_address_line1,
                      stats.parentOrganisation.billing_postal_code,
                      stats.parentOrganisation.billing_city,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* KPIs */}
        <EnseigneKPIGrid stats={stats} loading={statsLoading} />

        {/* Onglets */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList
            variant="underline"
            className="w-full justify-start border-b"
          >
            <TabsTrigger value="overview" variant="underline">
              <Building2 className="h-4 w-4 mr-2" />
              Vue d&apos;ensemble
            </TabsTrigger>
            <TabsTrigger value="geography" variant="underline">
              <MapPin className="h-4 w-4 mr-2" />
              Geographie
            </TabsTrigger>
            <TabsTrigger value="products" variant="underline">
              <Package className="h-4 w-4 mr-2" />
              Produits sources ({enseigneProducts.length})
            </TabsTrigger>
          </TabsList>

          {/* Onglet Vue d'ensemble */}
          <TabsContent value="overview" className="mt-6">
            <EnseigneOrganisationsTable
              organisations={stats?.organisationsWithRevenue || []}
              parentOrganisation={stats?.parentOrganisation || null}
              onAddOrganisations={() => setIsOrganisationModalOpen(true)}
              onRemoveOrganisation={handleRemoveOrganisation}
              loading={statsLoading}
            />
          </TabsContent>

          {/* Onglet Geographie */}
          <TabsContent value="geography" className="mt-6">
            <EnseigneGeographySection
              citiesDistribution={stats?.citiesDistribution || []}
              loading={statsLoading}
              className="max-w-none"
            />
          </TabsContent>

          {/* Onglet Produits sources */}
          <TabsContent value="products" className="mt-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center">
                  <Package className="h-5 w-5 mr-2 text-blue-500" />
                  Produits sources pour {enseigne.name}
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({enseigneProducts.length} produit
                    {enseigneProducts.length > 1 ? 's' : ''})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {productsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                ) : enseigneProducts.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">
                    Aucun produit source pour cette enseigne
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {enseigneProducts.map(product => (
                      <Link
                        key={product.id}
                        href={`/catalogue/produits/${product.id}`}
                        className="group cursor-pointer"
                      >
                        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2 flex items-center justify-center group-hover:ring-2 ring-blue-500 transition-all">
                          {product.primary_image_url ? (
                            <Image
                              src={product.primary_image_url}
                              alt={product.name}
                              width={120}
                              height={120}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <Package className="h-8 w-8 text-gray-300" />
                          )}
                        </div>
                        <p className="text-xs font-medium truncate">
                          {product.name}
                        </p>
                        {product.sku && (
                          <p className="text-xs text-gray-500 truncate">
                            {product.sku}
                          </p>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal Gestion Organisations (deux colonnes) */}
      <OrganisationSelectorModal
        open={isOrganisationModalOpen}
        onOpenChange={setIsOrganisationModalOpen}
        enseigne={enseigne}
        currentOrganisations={enseigne.organisations || []}
        onSave={handleSaveOrganisations}
        onSuccess={handleRefresh}
      />

      {/* Modal Édition */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Modifier l'enseigne</DialogTitle>
            <DialogDescription>
              Modifiez les informations de l'enseigne
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e =>
                  setFormData(prev => ({ ...prev, name: e.target.value }))
                }
                placeholder="Ex: Pokawa, Black and White..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo_url">URL du logo</Label>
              <Input
                id="logo_url"
                value={formData.logo_url}
                onChange={e =>
                  setFormData(prev => ({ ...prev, logo_url: e.target.value }))
                }
                placeholder="https://..."
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Enseigne active</Label>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={checked =>
                  setFormData(prev => ({ ...prev, is_active: checked }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <ButtonV2 variant="ghost" onClick={() => setIsEditModalOpen(false)}>
              Annuler
            </ButtonV2>
            <ButtonV2
              onClick={handleSubmitEdit}
              disabled={!formData.name.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Enregistrement...
                </>
              ) : (
                'Enregistrer'
              )}
            </ButtonV2>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Suppression */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Supprimer l'enseigne</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer l'enseigne "{enseigne.name}" ?
              Les organisations membres seront dissociées mais pas supprimées.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <ButtonV2
              variant="ghost"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Annuler
            </ButtonV2>
            <ButtonV2
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Suppression...
                </>
              ) : (
                'Supprimer'
              )}
            </ButtonV2>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
