'use client';

import Image from 'next/image';

import { ButtonV2 } from '@verone/ui';
import { Label } from '@verone/ui';
import { Upload, X } from 'lucide-react';

import { useToast } from '@verone/common';
import { createClient } from '@verone/utils/supabase/client';

interface SubcategoryImageUploadProps {
  imageUrl: string | undefined;
  uploadingImage: boolean;
  setUploadingImage: (v: boolean) => void;
  onImageChange: (url: string) => void;
  onImageRemove: () => void;
}

export function SubcategoryImageUpload({
  imageUrl,
  uploadingImage,
  setUploadingImage,
  onImageChange,
  onImageRemove,
}: SubcategoryImageUploadProps) {
  const { toast } = useToast();

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      const supabase = createClient();
      const fileExt = file.name.split('.').pop();
      const fileName = `subcategory-${Date.now()}.${fileExt}`;
      const filePath = `subcategory-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('family-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('family-images').getPublicUrl(filePath);

      onImageChange(publicUrl);

      toast({
        title: 'Image telechargeé',
        description: "L'image a ete uploadee avec succes",
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : JSON.stringify(error);
      console.error('Erreur upload image sous-categorie:', message);
      toast({
        title: 'Erreur upload',
        description: "Impossible de telecharger l'image",
        variant: 'destructive',
      });
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-black">Image de la sous-categorie</Label>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
        {imageUrl ? (
          <div className="relative">
            <Image
              src={imageUrl}
              alt="Preview"
              className="w-full h-32 object-cover rounded-lg"
              width={400}
              height={128}
            />
            <ButtonV2
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
              onClick={onImageRemove}
            >
              <X className="h-4 w-4" />
            </ButtonV2>
          </div>
        ) : (
          <div className="text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <Label htmlFor="imageUpload" className="cursor-pointer">
                <span className="mt-2 block text-sm font-medium text-gray-900">
                  Cliquez ou glissez une image
                </span>
                <span className="mt-1 block text-xs text-gray-500">
                  JPG, PNG, WebP (max 5MB)
                </span>
              </Label>
              <input
                id="imageUpload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file && file.size <= 5 * 1024 * 1024) {
                    void handleImageUpload(file).catch(error => {
                      console.error(
                        '[SubcategoryForm] handleImageUpload failed:',
                        error
                      );
                    });
                  } else {
                    toast({
                      title: 'Fichier trop volumineux',
                      description: "L'image doit faire moins de 5MB",
                      variant: 'destructive',
                    });
                  }
                }}
                disabled={uploadingImage}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
