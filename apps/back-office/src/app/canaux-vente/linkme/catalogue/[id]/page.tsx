'use client';

import { useParams, useRouter } from 'next/navigation';

import { Card, CardContent, Button, Skeleton } from '@verone/ui';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

import {
  ProductDetailHeader,
  ProductPricingCard,
  ProductInfoCard,
  ProductStatsCard,
} from '../../components';
import {
  useLinkMeProductDetail,
  useUpdateLinkMePricing,
  useUpdateLinkMeMetadata,
  useToggleLinkMeProductField,
} from '../../hooks/use-linkme-catalog';
import type { LinkMePricingUpdate, LinkMeMetadataUpdate } from '../../types';

/**
 * Page détail produit LinkMe
 * Route: /canaux-vente/linkme/catalogue/[id]
 */
export default function LinkMeProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const channelPricingId = params.id as string;

  // Hooks données
  const {
    data: product,
    isLoading,
    error,
  } = useLinkMeProductDetail(channelPricingId);

  // Hooks mutations
  const updatePricing = useUpdateLinkMePricing();
  const updateMetadata = useUpdateLinkMeMetadata();
  const toggleField = useToggleLinkMeProductField();

  // Handlers
  const handleToggle = async (
    field: 'is_active' | 'is_public_showcase' | 'is_featured' | 'show_supplier',
    value: boolean
  ) => {
    try {
      await toggleField.mutateAsync({ channelPricingId, field, value });
      toast.success('Paramètre mis à jour');
    } catch {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleSavePricing = async (pricing: LinkMePricingUpdate) => {
    try {
      await updatePricing.mutateAsync({ channelPricingId, pricing });
      toast.success('Pricing enregistré');
    } catch {
      toast.error('Erreur lors de la sauvegarde du pricing');
    }
  };

  const handleSaveMetadata = async (metadata: LinkMeMetadataUpdate) => {
    try {
      await updateMetadata.mutateAsync({ channelPricingId, metadata });
      toast.success('Informations enregistrées');
    } catch {
      toast.error('Erreur lors de la sauvegarde des informations');
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

      {/* Contenu principal - Grid 2 colonnes */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Colonne gauche : Header + Infos */}
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <ProductDetailHeader
                product={product}
                onToggleActive={v => handleToggle('is_active', v)}
                onToggleShowcase={v => handleToggle('is_public_showcase', v)}
                onToggleFeatured={v => handleToggle('is_featured', v)}
                onToggleShowSupplier={v => handleToggle('show_supplier', v)}
                isUpdating={toggleField.isPending}
              />
            </CardContent>
          </Card>

          <ProductInfoCard
            product={product}
            onSave={handleSaveMetadata}
            isSaving={updateMetadata.isPending}
          />
        </div>

        {/* Colonne droite : Pricing + Stats */}
        <div className="space-y-6">
          <ProductPricingCard
            product={product}
            onSave={handleSavePricing}
            isSaving={updatePricing.isPending}
          />

          <ProductStatsCard product={product} />
        </div>
      </div>
    </div>
  );
}
