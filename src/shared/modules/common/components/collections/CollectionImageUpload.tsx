/**
 * 🖼️ Collection Image Upload - Vérone Back Office
 * Composant d'upload d'image de couverture pour collections
 * Aligné avec primary-image-upload.tsx (best practices)
 */

'use client';

import React, { useRef, useState, useEffect } from 'react';

import Image from 'next/image';

import {
  Upload,
  X,
  Image as ImageIcon,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ButtonV2 } from '@/components/ui/button';
import { cn } from '@verone/utils';
import { useCollectionImages } from '@/shared/modules/collections/hooks';

interface CollectionImageUploadProps {
  collectionId: string;
  onImageUpload?: (imageId: string, publicUrl: string) => void;
  onImageRemove?: () => void;
  className?: string;
  disabled?: boolean;
}

export function CollectionImageUpload({
  collectionId,
  onImageUpload,
  onImageRemove,
  className,
  disabled = false,
}: CollectionImageUploadProps) {
  // État pour drag & drop
  const [dragActive, setDragActive] = useState(false);

  // Référence pour input file
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hook useCollectionImages pour gestion cohérente
  const {
    primaryImage,
    loading,
    uploading,
    error,
    uploadImage,
    deleteImage,
    hasImages,
    fetchImages,
  } = useCollectionImages({
    collectionId,
    autoFetch: !!collectionId,
  });

  // 🔄 Synchronisation avec useCollectionImages
  useEffect(() => {
    if (collectionId && collectionId.trim() !== '') {
      fetchImages();
    }
  }, [collectionId, fetchImages]);

  // 🎯 Callback après upload réussi
  useEffect(() => {
    if (primaryImage && onImageUpload) {
      onImageUpload(primaryImage.id, primaryImage.public_url || '');
    }
  }, [primaryImage, onImageUpload]);

  /**
   * 📁 Gestion sélection de fichier
   */
  const handleFileSelect = async (file: File) => {
    if (!collectionId || collectionId.trim() === '') {
      console.warn("⚠️ Impossible d'uploader sans ID de collection valide");
      return;
    }

    try {
      // Upload l'image en tant qu'image de couverture primaire
      const result = await uploadImage(file, {
        isPrimary: true,
        imageType: 'cover',
        altText: `Image couverture - ${file.name}`,
      });

      console.log('✅ Image couverture collection uploadée avec succès');
    } catch (error) {
      console.error('❌ Erreur upload image collection:', error);
    }
  };

  /**
   * 🗑️ Gestion suppression d'image
   */
  const handleRemoveImage = async () => {
    if (!primaryImage) return;

    try {
      await deleteImage(primaryImage.id);
      onImageRemove?.();
      console.log('✅ Image collection supprimée');
    } catch (error) {
      console.error('❌ Erreur suppression image collection:', error);
    }
  };

  /**
   * 🖱️ Handlers Drag & Drop
   */
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled || !collectionId) return;

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (disabled || !collectionId) return;

    const files = e.target.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleButtonClick = () => {
    if (!disabled && collectionId) {
      fileInputRef.current?.click();
    }
  };

  // 🎨 Affichage selon l'état
  return (
    <div className={cn('space-y-4', className)}>
      {/* Erreur */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Zone d'upload ou preview */}
      {primaryImage ? (
        /* Preview image uploadée */
        <div className="relative group">
          <div className="relative aspect-video w-full max-w-md rounded-lg border-2 border-gray-200 overflow-hidden bg-gray-50">
            <Image
              src={primaryImage.public_url || ''}
              alt={primaryImage.alt_text || 'Collection cover'}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 400px"
            />
            {/* Overlay suppression */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <ButtonV2
                variant="destructive"
                size="sm"
                onClick={handleRemoveImage}
                disabled={disabled}
              >
                <X className="w-4 h-4 mr-2" />
                Supprimer
              </ButtonV2>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Badge
              variant="outline"
              className="bg-green-50 text-green-700 border-green-200"
            >
              <CheckCircle className="w-3 h-3 mr-1" />
              Image chargée
            </Badge>
            {primaryImage.file_size && (
              <span className="text-xs text-gray-500">
                {(primaryImage.file_size / 1024).toFixed(0)} KB
              </span>
            )}
          </div>
        </div>
      ) : (
        /* Zone drag & drop */
        <div
          className={cn(
            'relative aspect-video w-full max-w-md rounded-lg border-2 border-dashed transition-colors',
            dragActive
              ? 'border-black bg-gray-50'
              : 'border-gray-300 hover:border-gray-400',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleChange}
            disabled={disabled || !collectionId}
          />

          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            {uploading ? (
              <>
                <Loader2 className="w-12 h-12 text-gray-400 animate-spin mb-4" />
                <p className="text-sm font-medium text-gray-700">
                  Upload en cours...
                </p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <Upload className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-700 mb-1">
                  {dragActive
                    ? "Déposer l'image ici"
                    : 'Glisser-déposer une image'}
                </p>
                <p className="text-xs text-gray-500 mb-4">ou</p>
                <ButtonV2
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleButtonClick}
                  disabled={disabled || !collectionId}
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Parcourir
                </ButtonV2>
                <p className="text-xs text-gray-400 mt-4">
                  JPG, PNG, WebP • Max 5MB
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Info si pas d'ID collection */}
      {!collectionId && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Créez d'abord la collection pour pouvoir uploader une image
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
