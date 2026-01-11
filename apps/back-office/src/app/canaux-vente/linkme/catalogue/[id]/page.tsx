'use client';

import { useState } from 'react';

import { useParams, useRouter } from 'next/navigation';

import { Card, CardContent, Button, Skeleton, Input, Label } from '@verone/ui';
import { ArrowLeft, AlertCircle, Users, UserPlus, Save } from 'lucide-react';
import { toast } from 'sonner';

import {
  ProductDetailHeader,
  ProductPricingCard,
  ProductInfoCard,
  ProductVariantsCard,
} from '../../components';
import {
  useLinkMeProductDetail,
  useUpdateLinkMePricing,
  useUpdateLinkMeMetadata,
  useToggleLinkMeProductField,
  useLinkMeProductVariants,
  useUpdateAffiliateCommission,
} from '../../hooks/use-linkme-catalog';
import type { LinkMePricingUpdate, LinkMeMetadataUpdate } from '../../types';

/**
 * Page détail produit LinkMe
 * Route: /canaux-vente/linkme/catalogue/[id]
 */
export default function LinkMeProductDetailPage(): React.JSX.Element {
  const params = useParams();
  const router = useRouter();
  const catalogProductId = params.id as string;

  // Hooks données
  const {
    data: product,
    isLoading,
    error,
  } = useLinkMeProductDetail(catalogProductId);

  // Hook variantes (dépend de product_id)
  const { data: variants, isLoading: variantsLoading } =
    useLinkMeProductVariants(product?.product_id ?? null);

  // Hooks mutations
  const updatePricing = useUpdateLinkMePricing();
  const updateMetadata = useUpdateLinkMeMetadata();
  const toggleField = useToggleLinkMeProductField();
  const updateAffiliateCommission = useUpdateAffiliateCommission();

  // État local pour la commission affilié
  const [editedCommission, setEditedCommission] = useState<number | null>(null);
  const currentCommission =
    editedCommission ?? product?.affiliate_commission_rate ?? 15;

  // Handlers
  const handleToggle = async (
    field:
      | 'is_enabled'
      | 'is_public_showcase'
      | 'is_featured'
      | 'show_supplier',
    value: boolean
  ): Promise<void> => {
    try {
      await toggleField.mutateAsync({ catalogProductId, field, value });
      toast.success('Paramètre mis à jour');
    } catch {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleSavePricing = async (
    pricing: LinkMePricingUpdate
  ): Promise<void> => {
    try {
      await updatePricing.mutateAsync({ catalogProductId, pricing });
      toast.success('Pricing enregistré');
    } catch {
      toast.error('Erreur lors de la sauvegarde du pricing');
    }
  };

  const handleSaveMetadata = async (
    metadata: LinkMeMetadataUpdate
  ): Promise<void> => {
    try {
      await updateMetadata.mutateAsync({ catalogProductId, metadata });
      toast.success('Informations enregistrées');
    } catch {
      toast.error('Erreur lors de la sauvegarde des informations');
    }
  };

  const handleSaveAffiliateCommission = async (): Promise<void> => {
    if (!product?.product_id || editedCommission === null) return;
    try {
      await updateAffiliateCommission.mutateAsync({
        productId: product.product_id,
        commissionRate: editedCommission,
      });
      toast.success('Commission affilié mise à jour');
      setEditedCommission(null); // Reset l'état local
    } catch {
      toast.error('Erreur lors de la mise à jour de la commission');
    }
  };

  // États loading
  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // État erreur
  if (error || !product) {
    return (
      <div className="container mx-auto p-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/canaux-vente/linkme/catalogue')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour au catalogue
        </Button>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Produit introuvable</h2>
            <p className="text-muted-foreground text-center max-w-md">
              Ce produit n&apos;existe pas dans le catalogue LinkMe ou a été
              supprimé.
            </p>
            <Button
              onClick={() => router.push('/canaux-vente/linkme/catalogue')}
              className="mt-6"
            >
              Retourner au catalogue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header avec bouton retour */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/canaux-vente/linkme/catalogue')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <nav className="text-sm text-muted-foreground mb-1">
            Canaux de vente / LinkMe / Catalogue
          </nav>
          <h1 className="text-2xl font-bold">{product.name}</h1>
        </div>
      </div>

      {/* Section 1 : Header produit - Pleine largeur */}
      <Card>
        <CardContent className="pt-6">
          <ProductDetailHeader
            product={product}
            onToggleActive={(v): void => void handleToggle('is_enabled', v)}
            onToggleFeatured={(v): void => void handleToggle('is_featured', v)}
            isUpdating={toggleField.isPending}
          />
        </CardContent>
      </Card>

      {/* Section Produit Sur Mesure (si applicable) */}
      {product.is_sourced && !product.created_by_affiliate && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-amber-600" />
            <span className="font-medium text-amber-800">
              Produit sur mesure
            </span>
          </div>
          <p className="text-sm text-amber-700 mt-1">
            Exclusif à :{' '}
            <span className="font-semibold">
              {product.enseigne_name ?? product.assigned_client_name}
            </span>
          </p>
        </div>
      )}

      {/* Badge Produit Affilié (si applicable) */}
      {product.created_by_affiliate && (
        <div className="bg-violet-50 border border-violet-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-violet-600" />
              <span className="font-medium text-violet-800">
                Produit Affilié
              </span>
            </div>
            <span className="text-sm text-violet-600 bg-violet-100 px-2 py-1 rounded">
              {product.affiliate_name ?? 'Affilié'}
            </span>
          </div>
        </div>
      )}

      {/* Section 2 : Layout deux colonnes */}
      <div className="grid md:grid-cols-[3fr_2fr] gap-6">
        {/* Colonne gauche : Informations personnalisées */}
        <ProductInfoCard
          product={product}
          onSave={handleSaveMetadata}
          isSaving={updateMetadata.isPending}
        />

        {/* Colonne droite : Pricing OU Commission affilié */}
        {product.created_by_affiliate ? (
          // Carte Commission Affilié
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-violet-600" />
                <h3 className="font-semibold text-lg">Commission Vérone</h3>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <Label className="text-sm font-medium text-gray-700">
                    Taux (%)
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={currentCommission}
                      onChange={e =>
                        setEditedCommission(Number(e.target.value))
                      }
                      min={0}
                      max={100}
                      step={0.5}
                      className="w-24"
                    />
                    {editedCommission !== null &&
                      editedCommission !==
                        product.affiliate_commission_rate && (
                        <Button
                          size="sm"
                          onClick={(): void =>
                            void handleSaveAffiliateCommission()
                          }
                          disabled={updateAffiliateCommission.isPending}
                        >
                          <Save className="h-4 w-4 mr-1" />
                          Enregistrer
                        </Button>
                      )}
                  </div>
                </div>

                {/* Simulateur de commission */}
                <div className="text-sm text-gray-600 bg-gray-50 rounded p-3">
                  <p className="font-medium mb-2">Simulation pour 1000€ HT :</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-gray-500">Commission Vérone :</span>
                      <span className="font-semibold text-violet-600 ml-2">
                        {((1000 * currentCommission) / 100).toFixed(2)}€
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Payout Affilié :</span>
                      <span className="font-semibold text-green-600 ml-2">
                        {(1000 * (1 - currentCommission / 100)).toFixed(2)}€
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <ProductPricingCard
            product={product}
            onSave={handleSavePricing}
            isSaving={updatePricing.isPending}
          />
        )}
      </div>

      {/* Section 3 : Variantes - Masqué pour produits affiliés */}
      {!product.created_by_affiliate && (
        <ProductVariantsCard
          variants={variants ?? []}
          isLoading={variantsLoading}
        />
      )}
    </div>
  );
}
