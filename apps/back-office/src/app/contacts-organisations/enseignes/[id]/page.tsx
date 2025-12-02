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
import { Card, CardContent } from '@verone/ui';
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
import { Textarea } from '@verone/ui';
import { Switch } from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import { ArrowLeft, Loader2, Package, ExternalLink } from 'lucide-react';

// Interface pour les produits de l'enseigne
interface EnseigneProduct {
  id: string;
  name: string;
  sku: string | null;
  product_status: string;
  created_at: string | null;
  primary_image_url?: string | null;
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
        {/* KPIs */}
        <EnseigneKPIGrid stats={stats} loading={statsLoading} />

        {/* Deux colonnes : Géographie + Table */}
        <div className="grid grid-cols-3 gap-6">
          {/* Répartition géographique (1/3) */}
          <EnseigneGeographySection
            citiesDistribution={stats?.citiesDistribution || []}
            loading={statsLoading}
            className="col-span-1"
          />

          {/* Tableau organisations (2/3) */}
          <EnseigneOrganisationsTable
            organisations={stats?.organisationsWithRevenue || []}
            parentOrganisation={stats?.parentOrganisation || null}
            onAddOrganisations={() => setIsOrganisationModalOpen(true)}
            onRemoveOrganisation={handleRemoveOrganisation}
            loading={statsLoading}
            className="col-span-2"
          />
        </div>

        {/* Section Produits Sourcés */}
        <Card className="border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Produits sourcés pour cette enseigne
                </h3>
                {enseigneProducts.length > 0 && (
                  <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-sm">
                    {enseigneProducts.length}
                  </span>
                )}
              </div>
              <Link href={`/produits/sourcing?enseigne=${enseigneId}`}>
                <ButtonV2 variant="ghost" size="sm">
                  Voir tout
                  <ExternalLink className="h-4 w-4 ml-1" />
                </ButtonV2>
              </Link>
            </div>

            {productsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : enseigneProducts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Aucun produit sourcé pour cette enseigne</p>
                <p className="text-sm mt-1">
                  Les produits avec{' '}
                  <code className="bg-gray-100 px-1 rounded">enseigne_id</code>{' '}
                  correspondant apparaîtront ici.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {enseigneProducts.slice(0, 12).map(product => (
                  <Link
                    key={product.id}
                    href={`/produits/catalogue/${product.id}`}
                    className="group block bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors"
                  >
                    <div className="aspect-square bg-white rounded-md border border-gray-200 overflow-hidden mb-2 flex items-center justify-center">
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
                    <h4 className="text-sm font-medium text-gray-900 truncate group-hover:text-black">
                      {product.name}
                    </h4>
                    <p className="text-xs text-gray-500 truncate">
                      {product.sku || 'Sans SKU'}
                    </p>
                  </Link>
                ))}
              </div>
            )}

            {enseigneProducts.length > 12 && (
              <div className="text-center mt-4">
                <Link href={`/produits/sourcing?enseigne=${enseigneId}`}>
                  <ButtonV2 variant="outline" size="sm">
                    Voir les {enseigneProducts.length - 12} autres produits
                  </ButtonV2>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
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
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Description de l'enseigne..."
                rows={3}
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
