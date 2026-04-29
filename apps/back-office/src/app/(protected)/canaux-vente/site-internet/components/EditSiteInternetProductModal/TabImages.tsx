'use client';

// =============================================================================
// Onglet Images — Statistiques, Galerie, Actions overlay, Ajout
// =============================================================================

import { useToast } from '@verone/common/hooks';
import { ButtonV2 } from '@verone/ui';
import { Badge, CloudflareImage } from '@verone/ui';
import { cn } from '@verone/utils';
import {
  Image as ImageIcon,
  Loader2,
  Upload,
  Trash2,
  Star,
  RefreshCw,
} from 'lucide-react';

interface CatalogueImage {
  id: string;
  public_url: string | null;
  cloudflare_image_id: string | null;
  alt_text: string | null;
  is_primary: boolean | null;
}

interface TabImagesProps {
  catalogueImages: CatalogueImage[];
  imagesLoading: boolean;
  fetchImages: () => Promise<void>;
  setPrimaryImage: (id: string) => Promise<void>;
  deleteImage: (id: string) => Promise<void>;
  onAddImages: () => void;
}

export function TabImages({
  catalogueImages,
  imagesLoading,
  fetchImages,
  setPrimaryImage,
  deleteImage,
  onAddImages,
}: TabImagesProps) {
  const { toast } = useToast();

  return (
    <div className="space-y-6">
      {/* STATISTIQUES EN HAUT */}
      <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center gap-6">
          {/* Total photos */}
          <div className="text-center">
            <div className="text-2xl font-bold text-black">
              {catalogueImages.length}
            </div>
            <div className="text-xs text-gray-600">
              Photo{catalogueImages.length > 1 ? 's' : ''}
            </div>
          </div>

          {/* Photo principale */}
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {catalogueImages.find(img => img.is_primary) ? '1' : '0'}
            </div>
            <div className="text-xs text-gray-600">Principale</div>
          </div>

          {/* Photos restantes */}
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {20 - catalogueImages.length}
            </div>
            <div className="text-xs text-gray-600">Restantes</div>
          </div>
        </div>

        {/* Bouton actualiser */}
        <ButtonV2
          variant="outline"
          size="sm"
          onClick={() => {
            void fetchImages().catch(error => {
              console.error(
                '[EditSiteInternetProductModal] fetchImages failed:',
                error
              );
            });
          }}
          disabled={imagesLoading}
        >
          {imagesLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Actualiser
        </ButtonV2>
      </div>

      {/* GALERIE PHOTOS */}
      {catalogueImages.length > 0 ? (
        <div className="space-y-4">
          {/* Header galerie */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-black">
              Photos du produit
            </h3>
            <p className="text-sm text-gray-500">
              Cliquez sur l'⭐ pour définir comme image principale
            </p>
          </div>

          {/* Grille 4 colonnes */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {catalogueImages.map((image, index) => (
              <div
                key={image.id}
                className={cn(
                  'relative group border-2 rounded-xl overflow-hidden transition-all duration-200 hover:shadow-lg',
                  image.is_primary
                    ? 'border-blue-500 shadow-lg ring-4 ring-blue-100'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                {/* Image */}
                <div className="aspect-square relative bg-gray-100">
                  <CloudflareImage
                    cloudflareId={image.cloudflare_image_id}
                    fallbackSrc={image.public_url ?? ''}
                    alt={image.alt_text ?? `Photo ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                </div>

                {/* Badge image principale */}
                {image.is_primary && (
                  <div className="absolute top-3 left-3 z-10">
                    <Badge className="bg-blue-500 text-white text-xs font-medium flex items-center gap-1 px-2 py-1">
                      <Star className="h-3 w-3 fill-white" />
                      Principale
                    </Badge>
                  </div>
                )}

                {/* Overlay avec contrôles */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-end justify-center p-3 z-20">
                  <div className="flex space-x-2 z-30">
                    {/* Bouton définir comme principale */}
                    {!image.is_primary && (
                      <ButtonV2
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          void (async () => {
                            try {
                              await setPrimaryImage(image.id);
                              toast({
                                title: 'Image principale définie',
                                description:
                                  "L'image a été définie comme principale avec succès",
                              });
                            } catch (_error) {
                              toast({
                                title: 'Erreur',
                                description:
                                  "Impossible de définir l'image comme principale",
                                variant: 'destructive',
                              });
                            }
                          })().catch(error => {
                            console.error(
                              '[EditSiteInternetProductModal] setPrimaryImage failed:',
                              error
                            );
                          });
                        }}
                        className="h-9 px-3 bg-white/90 hover:bg-white text-black border-0 relative z-40"
                      >
                        <Star className="h-4 w-4 mr-1" />
                        Principal
                      </ButtonV2>
                    )}

                    {/* Bouton suppression */}
                    <ButtonV2
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        void (async () => {
                          if (image.is_primary) {
                            toast({
                              title: 'Image principale',
                              description:
                                'Définissez une autre image comme principale avant de supprimer',
                              variant: 'destructive',
                            });
                            return;
                          }
                          try {
                            await deleteImage(image.id);
                            toast({
                              title: 'Image supprimée',
                              description:
                                "L'image a été supprimée avec succès",
                            });
                          } catch (_error) {
                            toast({
                              title: 'Erreur',
                              description: "Impossible de supprimer l'image",
                              variant: 'destructive',
                            });
                          }
                        })().catch(error => {
                          console.error(
                            '[EditSiteInternetProductModal] deleteImage failed:',
                            error
                          );
                        });
                      }}
                      className="h-9 px-3 bg-red-500/90 hover:bg-red-600 text-white border-0 relative z-40"
                    >
                      <Trash2 className="h-4 w-4" />
                    </ButtonV2>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ÉTAT VIDE */
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
          <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Aucune image</p>
          <p className="text-sm text-gray-500 mt-1">
            Le produit doit avoir au moins 1 image pour être éligible
          </p>
        </div>
      )}

      {/* BOUTON AJOUTER */}
      <ButtonV2 className="w-full" onClick={onAddImages}>
        <Upload className="h-4 w-4 mr-2" />
        Ajouter des images
      </ButtonV2>
    </div>
  );
}
