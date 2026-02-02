'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';

import {
  Upload,
  X,
  Image as ImageIcon,
  AlertCircle,
  Camera,
  Plus,
} from 'lucide-react';

import { useToast } from '@verone/common/hooks';

import { cn } from '@verone/utils';
import { Alert, AlertDescription } from '@verone/ui';
import { Badge } from '@verone/ui';
import { Button } from '@verone/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import { Label } from '@verone/ui';
import type { WizardFormData } from '../complete-product-wizard';

interface ImagesSectionProps {
  selectedImages: File[];
  setSelectedImages: (images: File[]) => void;
  formData: WizardFormData;
  onSave: () => void;
}

export function ImagesSection({
  selectedImages,
  setSelectedImages,
  formData: _formData,
  onSave: _onSave,
}: ImagesSectionProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<
    { file: File; preview: string }[]
  >([]);

  // Gestion de la sélection de fichiers
  const handleFileSelect = (files: File[]) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length !== files.length) {
      toast({
        title: 'Fichiers ignorés',
        description: 'Seules les images sont acceptées',
        variant: 'destructive',
      });
    }

    if (selectedImages.length + imageFiles.length > 10) {
      toast({
        title: 'Limite dépassée',
        description: 'Maximum 10 images par produit',
        variant: 'destructive',
      });
      return;
    }

    // Créer les previews
    const newPreviews: { file: File; preview: string }[] = [];
    let processedCount = 0;

    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = e => {
        newPreviews.push({
          file,
          preview: e.target?.result as string,
        });
        processedCount++;

        if (processedCount === imageFiles.length) {
          setSelectedImages([...selectedImages, ...imageFiles]);
          setImagePreviews([...imagePreviews, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Gestion drag & drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    handleFileSelect(files);
  };

  // Supprimer une image
  const removeImage = (index: number) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setSelectedImages(newImages);
    setImagePreviews(newPreviews);
  };

  // Réorganiser les images (définir comme principale)
  const setPrimaryImage = (index: number) => {
    if (index === 0) return; // Déjà principale

    const newImages = [...selectedImages];
    const newPreviews = [...imagePreviews];

    const [movedImage] = newImages.splice(index, 1);
    const [movedPreview] = newPreviews.splice(index, 1);

    newImages.unshift(movedImage);
    newPreviews.unshift(movedPreview);

    setSelectedImages(newImages);
    setImagePreviews(newPreviews);

    toast({
      title: 'Image principale définie',
      description: 'Cette image sera affichée en premier',
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ImageIcon className="h-5 w-5 mr-2" />
            Images du produit
          </CardTitle>
          <CardDescription>
            Ajoutez jusqu'à 10 images pour présenter votre produit
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Zone d'upload */}
          <div
            className={cn(
              'border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer',
              dragActive
                ? 'border-blue-400 bg-blue-50'
                : selectedImages.length > 0
                  ? 'border-green-300 bg-green-50'
                  : 'border-gray-300 hover:border-gray-400'
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="space-y-3">
              <div className="mx-auto">
                {selectedImages.length > 0 ? (
                  <Camera className="h-12 w-12 text-green-600 mx-auto" />
                ) : (
                  <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                )}
              </div>

              <div>
                <p className="text-gray-600">
                  {selectedImages.length > 0
                    ? `${selectedImages.length} image(s) sélectionnée(s)`
                    : 'Glissez-déposez vos images ou cliquez pour sélectionner'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PNG, JPG, WEBP jusqu'à 10MB par image • Maximum 10 images
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={e => {
                  const files = Array.from(e.target.files ?? []);
                  if (files.length > 0) {
                    handleFileSelect(files);
                  }
                }}
              />
            </div>
          </div>

          {/* Aperçu des images */}
          {imagePreviews.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">
                  Images sélectionnées ({imagePreviews.length}/10)
                </Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={selectedImages.length >= 10}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {imagePreviews.map((item, index) => (
                  <div
                    key={index}
                    className="relative group border rounded-lg overflow-hidden"
                  >
                    <div className="relative w-full h-32">
                      <Image
                        src={item.preview}
                        alt={`Aperçu ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* Badge image principale */}
                    {index === 0 && (
                      <Badge className="absolute top-2 left-2 bg-blue-600 text-white text-xs">
                        Principale
                      </Badge>
                    )}

                    {/* Actions */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center space-x-2 opacity-0 group-hover:opacity-100">
                      {index !== 0 && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setPrimaryImage(index)}
                          className="text-xs"
                        >
                          Principale
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Nom du fichier */}
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-2 truncate">
                      {item.file.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Informations et conseils */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div className="font-medium">
                  Conseils pour de meilleures images :
                </div>
                <ul className="text-sm space-y-1">
                  <li>
                    • La première image sera utilisée comme image principale
                  </li>
                  <li>
                    • Utilisez des images de haute qualité (min. 800x800px)
                  </li>
                  <li>
                    • Préférez un fond neutre pour mettre en valeur le produit
                  </li>
                  <li>• Incluez différents angles de vue</li>
                  <li>• Ajoutez des images d'ambiance si pertinentes</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
