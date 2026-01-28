/**
 * 🎯 VÉRONE - Composant Upload Images Simple
 *
 * Upload simple d'images avec drag & drop
 * Approche classique : Upload → Storage → URL directe
 */

'use client';

import React, { useRef, useState } from 'react';

import Image from 'next/image';

import { Alert, AlertDescription } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Progress } from '@verone/ui';
import {
  Upload,
  X,
  Image as ImageIcon,
  Loader2,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

import { useImageUpload, type UseImageUploadProps } from '@verone/common';
import type { BucketType } from '@verone/utils/upload/validation';

import { cn } from '@verone/utils';

interface ImageUploadV2Props
  extends Omit<UseImageUploadProps, 'onUploadSuccess' | 'onUploadError'> {
  currentImageUrl?: string;
  onImageUpload: (url: string) => void;
  onImageRemove: () => void;
  className?: string;
  allowReplace?: boolean;
}

export function ImageUploadV2({
  bucket,
  currentImageUrl,
  onImageUpload,
  onImageRemove,
  className,
  allowReplace = true,
  autoUpload = true,
}: ImageUploadV2Props) {
  // État pour drag & drop
  const [dragActive, setDragActive] = useState(false);

  // Référence pour input file
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hook simple d'upload
  const {
    state,
    isUploading,
    progress,
    error,
    validationError,
    uploadResult,
    userProfile,
    bucketConfig,
    uploadFile,
    validateFile,
    clearError,
    reset,
    deleteUploadedFile,
    canUpload,
    supportedTypes,
    maxSizeMB,
  } = useImageUpload({
    bucket,
    autoUpload,
    onUploadSuccess: result => {
      console.log('🎉 Upload terminé:', result?.publicUrl);
      onImageUpload(result?.publicUrl ?? '');
    },
    onUploadError: error => {
      console.error('❌ Erreur upload:', error?.message);
    },
  });

  /**
   * 📁 Gestion sélection de fichier
   */
  const handleFileSelect = async (file: File) => {
    if (!canUpload) {
      console.warn('⚠️ Upload non autorisé');
      return;
    }

    // Validation préalable avec feedback immédiat
    const validation = validateFile(file);
    if (!validation.isValid) {
      // L'erreur sera affichée par le hook
      return;
    }

    // Nettoyer les erreurs précédentes
    clearError();

    // Lancer l'upload
    const success = await uploadFile(file);

    if (success) {
      console.log('✅ Upload réussi');
    } else {
      console.log('❌ Upload échoué');
    }
  };

  /**
   * 🗑️ Gestion suppression d'image
   */
  const handleRemoveImage = async () => {
    if (!currentImageUrl) return;

    try {
      // Si c'est un fichier qu'on vient d'uploader
      if (uploadResult) {
        const success = await deleteUploadedFile();
        if (success) {
          onImageRemove();
        }
      } else {
        // Image existante - juste callback
        onImageRemove();
      }
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
    }
  };

  /**
   * 🖱️ Gestionnaires drag & drop
   */
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (canUpload) {
      setDragActive(true);
    }
  };

  const handleDragOut = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (!canUpload) return;

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      void handleFileSelect(files[0]).catch((error: unknown) => {
        console.error('[ImageUploadV2] File select failed:', error);
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      void handleFileSelect(files[0]).catch((error: unknown) => {
        console.error('[ImageUploadV2] File select failed:', error);
      });
    }
  };

  /**
   * 🎨 Rendu des états d'upload
   */
  const renderUploadState = () => {
    if (state === 'success' && uploadResult) {
      return (
        <div className="flex items-center space-x-2 text-green-600">
          <CheckCircle className="w-5 h-5" />
          <span className="text-sm font-medium">Upload réussi !</span>
        </div>
      );
    }

    if (isUploading) {
      return (
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-black">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-medium">
              {state === 'validating' && 'Validation...'}
              {state === 'uploading' && 'Upload en cours...'}
              {state === 'retrying' && 'Nouvelle tentative...'}
            </span>
          </div>

          {progress && (
            <div className="space-y-1">
              <Progress value={progress.percentage} className="h-2" />
              <div className="flex justify-between text-xs text-gray-500">
                <span>{Math.round(progress.percentage)}%</span>
                <span>
                  {Math.round(progress.uploaded / 1024)}KB /{' '}
                  {Math.round(progress.total / 1024)}KB
                </span>
              </div>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  /**
   * 🚨 Rendu des erreurs
   */
  const renderError = () => {
    const errorMessage = validationError || error?.message;

    if (!errorMessage) return null;

    return (
      <Alert variant="destructive" className="mt-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>{errorMessage}</span>
          {error?.retryable && (
            <ButtonV2
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="ml-2"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Réessayer
            </ButtonV2>
          )}
        </AlertDescription>
      </Alert>
    );
  };

  // Déterminer l'URL de l'image à afficher
  const displayImageUrl = uploadResult?.publicUrl || currentImageUrl;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Image actuelle */}
      {displayImageUrl && (
        <div className="relative w-full max-w-xs mx-auto">
          <div className="relative w-full h-32 rounded-lg overflow-hidden border">
            <Image
              src={displayImageUrl}
              alt="Image actuelle"
              fill
              className="object-cover"
            />
          </div>
          <ButtonV2
            type="button"
            variant="destructive"
            size="sm"
            className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full"
            onClick={() => {
              void handleRemoveImage().catch((error: unknown) => {
                console.error('[ImageUploadV2] Remove image failed:', error);
              });
            }}
          >
            <X className="w-3 h-3" />
          </ButtonV2>
        </div>
      )}

      {/* Zone d'upload */}
      {(!displayImageUrl || allowReplace) && !isUploading && (
        <div
          className={cn(
            'border-2 border-dashed border-gray-300 rounded-lg p-6 text-center transition-colors',
            canUpload
              ? 'cursor-pointer hover:border-gray-400'
              : 'opacity-50 cursor-not-allowed',
            dragActive && canUpload && 'border-black bg-gray-50',
            (error || validationError) && 'border-red-500 bg-red-50'
          )}
          onDragEnter={handleDragIn}
          onDragLeave={handleDragOut}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => canUpload && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={supportedTypes.join(',')}
            onChange={handleInputChange}
            className="hidden"
            disabled={!canUpload}
          />

          <div className="flex flex-col items-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              <Upload className="w-6 h-6 text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-medium">
                {canUpload
                  ? 'Cliquez ou glissez une image'
                  : 'Connectez-vous pour uploader'}
              </p>
              <p className="text-xs text-gray-500">
                JPG, PNG, WebP (max {maxSizeMB}MB)
              </p>
              {userProfile && (
                <p className="text-xs text-black mt-1">
                  Connecté en tant que {userProfile.role}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* État de l'upload */}
      {renderUploadState()}

      {/* Erreurs */}
      {renderError()}

      {/* Bouton pour remplacer l'image existante */}
      {displayImageUrl && allowReplace && !isUploading && canUpload && (
        <ButtonV2
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => fileInputRef.current?.click()}
        >
          <ImageIcon className="w-4 h-4 mr-2" />
          Remplacer l'image
        </ButtonV2>
      )}
    </div>
  );
}
