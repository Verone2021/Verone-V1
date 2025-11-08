/**
 * Composant: ImageUploadZone
 * Description: Zone upload drag & drop réutilisable avec react-dropzone
 * Usage: StockAdjustmentForm, ExpenseForm, ProductForm (Step 2)
 * Features: Preview, validation format/taille, upload Supabase Storage
 */
'use client';

import { useCallback, useState } from 'react';

import Image from 'next/image';

import { createClient } from '@verone/utils';
import {
  Upload,
  X,
  FileImage,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';

import { ButtonV2 } from './button';
import { Card, CardContent } from './card';

// =====================================================================
// TYPES
// =====================================================================

interface ImageUploadZoneProps {
  /** Bucket Supabase Storage (ex: 'stock-adjustments', 'expense-receipts') */
  bucket: string;

  /** Sous-dossier dans bucket (ex: 'adjustments/2025/10') */
  folder: string;

  /** Callback avec URL publique fichier uploadé */
  onUploadSuccess: (publicUrl: string, fileName: string) => void;

  /** Callback erreur upload */
  onUploadError?: (error: Error) => void;

  /** URL fichier existant (mode édition) */
  existingFileUrl?: string;

  /** Nom fichier existant (mode édition) */
  existingFileName?: string;

  /** Formats acceptés (défaut: images + PDF) */
  acceptedFormats?: {
    [key: string]: string[];
  };

  /** Taille max en MB (défaut: 10 MB) */
  maxSizeMB?: number;

  /** Multiple fichiers ? (défaut: false) */
  multiple?: boolean;

  /** Label personnalisé */
  label?: string;

  /** Description helper text */
  helperText?: string;
}

interface UploadedFile {
  name: string;
  size: number;
  url: string;
  storagePath: string;
}

// =====================================================================
// CONSTANTES
// =====================================================================

const DEFAULT_ACCEPTED_FORMATS = {
  'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
  'application/pdf': ['.pdf'],
};

const DEFAULT_MAX_SIZE_MB = 10;
const DEFAULT_MAX_SIZE_BYTES = DEFAULT_MAX_SIZE_MB * 1024 * 1024;

// =====================================================================
// COMPOSANT PRINCIPAL
// =====================================================================

export function ImageUploadZone({
  bucket,
  folder,
  onUploadSuccess,
  onUploadError,
  existingFileUrl,
  existingFileName,
  acceptedFormats = DEFAULT_ACCEPTED_FORMATS,
  maxSizeMB = DEFAULT_MAX_SIZE_MB,
  multiple = false,
  label = 'Document justificatif',
  helperText = 'Glissez-déposez ou cliquez pour sélectionner',
}: ImageUploadZoneProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(
    existingFileUrl && existingFileName
      ? {
          name: existingFileName,
          size: 0,
          url: existingFileUrl,
          storagePath: '',
        }
      : null
  );
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // Upload fichier vers Supabase Storage
  const uploadFile = async (file: File): Promise<UploadedFile> => {
    // Générer nom unique avec timestamp
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${sanitizedName}`;
    const storagePath = `${folder}/${fileName}`;

    // Upload vers Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Échec upload: ${uploadError.message}`);
    }

    // Récupérer URL publique (bucket privé → signedUrl requise)
    // Note: Pour buckets publics, utiliser getPublicUrl()
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(storagePath);

    if (!urlData?.publicUrl) {
      throw new Error('Impossible de récupérer URL publique');
    }

    return {
      name: file.name,
      size: file.size,
      url: urlData.publicUrl,
      storagePath,
    };
  };

  // Handler drop fichiers
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0]; // Single file pour l'instant

      // Reset états
      setError(null);
      setUploading(true);

      try {
        // Validation taille
        const maxSizeBytes = maxSizeMB * 1024 * 1024;
        if (file.size > maxSizeBytes) {
          throw new Error(`Fichier trop volumineux (max ${maxSizeMB} MB)`);
        }

        // Upload
        const uploadedFile = await uploadFile(file);

        setUploadedFile(uploadedFile);
        onUploadSuccess(uploadedFile.url, uploadedFile.name);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Erreur upload inconnue';
        setError(errorMessage);
        if (onUploadError) {
          onUploadError(err instanceof Error ? err : new Error(errorMessage));
        }
      } finally {
        setUploading(false);
      }
    },
    [bucket, folder, maxSizeMB, onUploadSuccess, onUploadError]
  );

  // Configuration react-dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFormats,
    maxSize: maxSizeMB * 1024 * 1024,
    multiple,
    disabled: uploading || !!uploadedFile,
  });

  // Supprimer fichier uploadé
  const handleRemoveFile = async () => {
    if (!uploadedFile) return;

    // Si fichier uploadé sur Supabase (pas existant), supprimer du storage
    if (uploadedFile.storagePath) {
      try {
        await supabase.storage.from(bucket).remove([uploadedFile.storagePath]);
      } catch (err) {
        console.error('Échec suppression fichier:', err);
      }
    }

    setUploadedFile(null);
    setError(null);
  };

  return (
    <div className="space-y-2">
      {/* Label */}
      <label className="text-sm font-medium">{label}</label>

      {/* Zone upload */}
      {!uploadedFile && (
        <Card
          {...getRootProps()}
          className={`border-2 border-dashed cursor-pointer transition-colors ${
            isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-gray-300 hover:border-gray-400'
          } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <CardContent className="flex flex-col items-center justify-center py-10 px-6">
            <input {...getInputProps()} />

            {uploading ? (
              <>
                <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                <p className="text-sm font-medium">Upload en cours...</p>
              </>
            ) : (
              <>
                <Upload className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-sm font-medium text-gray-900 mb-1">
                  {isDragActive ? 'Déposez le fichier ici' : helperText}
                </p>
                <p className="text-xs text-gray-500">
                  {Object.keys(acceptedFormats)
                    .flatMap(key => acceptedFormats[key])
                    .join(', ')}{' '}
                  (max {maxSizeMB} MB)
                </p>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Fichier uploadé */}
      {uploadedFile && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="flex items-center gap-4 py-4">
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {uploadedFile.name}
              </p>
              {uploadedFile.size > 0 && (
                <p className="text-xs text-gray-500">
                  {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Preview si image */}
              {uploadedFile.url &&
                uploadedFile.name.match(/\.(jpg|jpeg|png|webp)$/i) && (
                  <div className="relative w-12 h-12 rounded overflow-hidden border">
                    <Image
                      src={uploadedFile.url}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

              {/* Bouton supprimer */}
              <ButtonV2
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemoveFile}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </ButtonV2>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Erreur */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-red-50 border border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
    </div>
  );
}
