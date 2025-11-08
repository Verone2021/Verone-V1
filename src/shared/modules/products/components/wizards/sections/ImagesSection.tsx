'use client';

import { useRef, useState } from 'react';

import Image from 'next/image';

import { Save, Upload, X, ImageIcon } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import type { WizardFormData } from '../CompleteProductWizard';

interface ImagesSectionProps {
  selectedImages: File[];
  setSelectedImages: (images: File[]) => void;
  formData: WizardFormData;
  onSave: () => void;
}

export function ImagesSection({
  selectedImages,
  setSelectedImages,
  formData,
  onSave,
}: ImagesSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (files.length > 0) {
      // Ajouter les nouveaux fichiers
      setSelectedImages([...selectedImages, ...files]);

      // Créer les URLs de préview
      const newPreviewUrls = files.map(file => URL.createObjectURL(file));
      setPreviewUrls([...previewUrls, ...newPreviewUrls]);
    }
  };

  const removeImage = (index: number) => {
    // Supprimer l'image
    const updatedImages = selectedImages.filter((_, i) => i !== index);
    setSelectedImages(updatedImages);

    // Nettoyer l'URL de preview
    if (previewUrls[index]) {
      URL.revokeObjectURL(previewUrls[index]);
    }
    const updatedPreviewUrls = previewUrls.filter((_, i) => i !== index);
    setPreviewUrls(updatedPreviewUrls);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Images du produit</CardTitle>
        <CardDescription>
          Ajoutez des images pour présenter le produit (formats : JPG, PNG,
          WebP)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Zone d'upload */}
        <div className="space-y-4">
          <div
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-2">
              Cliquez pour sélectionner des images ou glissez-déposez
            </p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG, WebP jusqu'à 10MB
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Aperçu des images */}
        {selectedImages.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">
                {selectedImages.length} image(s) sélectionnée(s)
              </h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  previewUrls.forEach(url => URL.revokeObjectURL(url));
                  setSelectedImages([]);
                  setPreviewUrls([]);
                }}
              >
                Tout supprimer
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {selectedImages.map((file, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square rounded-lg border overflow-hidden bg-muted">
                    {previewUrls[index] ? (
                      <Image
                        src={previewUrls[index]}
                        alt={file.name}
                        width={200}
                        height={200}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <ImageIcon className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity px-2"
                    onClick={() => removeImage(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {file.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Information */}
        <Alert>
          <AlertDescription>
            La première image sera utilisée comme image principale du produit.
            Vous pouvez réorganiser les images après upload.
          </AlertDescription>
        </Alert>

        {/* Bouton sauvegarder brouillon */}
        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={onSave}>
            <Save className="mr-2 h-4 w-4" />
            Sauvegarder le brouillon
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
