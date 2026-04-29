'use client';

import { Camera, Star, Trash2, Loader2 } from 'lucide-react';

import { Badge, CloudflareImage } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { cn } from '@verone/utils';
import type { Database } from '@verone/utils/supabase/types';

type ProductImage = Database['public']['Tables']['product_images']['Row'];

interface ProductPhotosGalleryProps {
  images: ProductImage[];
  deletingImageId: string | null;
  settingPrimaryId: string | null;
  onSetPrimary: (imageId: string) => void;
  onDelete: (imageId: string, isPrimary: boolean) => void;
}

export function ProductPhotosGallery({
  images,
  deletingImageId,
  settingPrimaryId,
  onSetPrimary,
  onDelete,
}: ProductPhotosGalleryProps) {
  if (images.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-black">Photos du produit</h3>
        <p className="text-xs text-gray-500">
          Survolez pour définir comme principale ou supprimer
        </p>
      </div>

      <div className="grid grid-cols-5 gap-2.5">
        {images.map((image, index) => (
          <div
            key={image.id}
            className={cn(
              'relative group border rounded-lg overflow-hidden transition-all duration-200 hover:shadow-md',
              image.is_primary
                ? 'border-blue-500 ring-2 ring-blue-100'
                : 'border-gray-200 hover:border-gray-300'
            )}
          >
            <div className="aspect-square relative bg-gray-50">
              {image.public_url || image.cloudflare_image_id ? (
                <CloudflareImage
                  cloudflareId={image.cloudflare_image_id}
                  fallbackSrc={image.public_url}
                  alt={image.alt_text ?? `Photo ${index + 1}`}
                  fill
                  className="object-contain"
                  sizes="(max-width: 1200px) 25vw, 200px"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <Camera className="h-8 w-8 text-gray-400" />
                </div>
              )}
            </div>

            {image.is_primary && (
              <div className="absolute top-1.5 left-1.5 z-10">
                <Badge className="bg-blue-500 text-white text-[10px] font-medium flex items-center gap-0.5 px-1.5 py-0.5">
                  <Star className="h-2.5 w-2.5 fill-white" />
                  Principale
                </Badge>
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-end justify-center p-2 z-20">
              <div className="flex space-x-1.5 z-30">
                {!image.is_primary && (
                  <ButtonV2
                    size="sm"
                    variant="secondary"
                    onClick={() => onSetPrimary(image.id)}
                    disabled={settingPrimaryId === image.id}
                    className="h-7 px-2 text-xs bg-white/90 hover:bg-white text-black border-0 relative z-40"
                    title="Définir comme image principale"
                  >
                    {settingPrimaryId === image.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Star className="h-3 w-3" />
                    )}
                  </ButtonV2>
                )}

                <ButtonV2
                  size="sm"
                  variant="destructive"
                  onClick={() => onDelete(image.id, image.is_primary ?? false)}
                  disabled={deletingImageId === image.id}
                  className="h-7 px-2 text-xs bg-red-500/90 hover:bg-red-600 text-white border-0 relative z-40"
                  title="Supprimer la photo"
                >
                  {deletingImageId === image.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3" />
                  )}
                </ButtonV2>
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent text-white px-2 py-1.5 pt-4 z-10 pointer-events-none">
              <p className="text-[10px] font-medium truncate">
                Photo {index + 1}
                {image.file_size && (
                  <span className="text-gray-300 ml-1">
                    · {Math.round(image.file_size / 1024)} KB
                  </span>
                )}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
