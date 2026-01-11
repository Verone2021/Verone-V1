/**
 * Component: SelectionImageUpload
 * Upload et gestion de l'image de couverture d'une selection
 *
 * @module SelectionImageUpload
 * @since 2026-01-09
 */

'use client';

import { useRef, useState } from 'react';

import { Camera, Loader2, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';

import {
  useDeleteSelectionImage,
  useUploadSelectionImage,
} from '../../lib/hooks/use-selection-image';

interface ISelectionImageUploadProps {
  selectionId: string;
  currentImageUrl: string | null;
  selectionName: string;
}

const MAX_SIZE_MB = 5;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const RECOMMENDED_WIDTH = 1280;
const RECOMMENDED_HEIGHT = 360;

export function SelectionImageUpload({
  selectionId,
  currentImageUrl,
  selectionName,
}: ISelectionImageUploadProps): React.JSX.Element {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const {
    mutateAsync: uploadImage,
    isPending: isUploading,
    progress,
  } = useUploadSelectionImage();

  const { mutateAsync: deleteImage, isPending: isDeleting } =
    useDeleteSelectionImage();

  const handleFileSelect = async (file: File): Promise<void> => {
    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Format non supporté. Utilisez JPEG, PNG ou WebP');
      return;
    }

    // Validate file size
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`Le fichier doit faire moins de ${MAX_SIZE_MB}MB`);
      return;
    }

    try {
      await uploadImage({ selectionId, file });
      toast.success('Image mise à jour !');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erreur lors de l'upload";
      toast.error(message);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      void handleFileSelect(file);
    }
    // Reset input to allow selecting same file again
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent): void => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent): void => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent): void => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      void handleFileSelect(file);
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!currentImageUrl) return;

    try {
      await deleteImage({ selectionId, imageUrl: currentImageUrl });
      toast.success('Image supprimée');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Erreur lors de la suppression';
      toast.error(message);
    }
  };

  const triggerFileInput = (): void => {
    fileInputRef.current?.click();
  };

  // If image exists, show it with edit/delete options
  if (currentImageUrl) {
    return (
      <div className="relative h-48 bg-gradient-to-br from-linkme-turquoise/20 to-linkme-royal/20 group">
        <img
          src={currentImageUrl}
          alt={selectionName}
          className="w-full h-full object-cover"
        />

        {/* Overlay on hover with actions */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
          <label
            htmlFor="selection-image-change"
            className={`flex items-center gap-2 px-4 py-2 bg-white rounded-lg text-linkme-marine font-medium hover:bg-gray-100 transition-colors cursor-pointer ${
              isUploading || isDeleting ? 'opacity-50 pointer-events-none' : ''
            }`}
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Changer
          </label>

          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={isUploading || isDeleting}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Supprimer
          </button>
        </div>

        {/* Progress bar during upload */}
        {isUploading && progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
            <div
              className="h-full bg-linkme-turquoise transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* File input - linked to label via id */}
        <input
          id="selection-image-change"
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleInputChange}
          className="sr-only"
        />
      </div>
    );
  }

  // No image - show upload zone
  return (
    <div
      className={`relative h-48 bg-gradient-to-br from-linkme-turquoise/20 to-linkme-royal/20 transition-colors ${
        isDragging ? 'bg-linkme-turquoise/30 ring-2 ring-linkme-turquoise' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        {isUploading ? (
          <>
            <div className="flex items-center gap-2 px-5 py-3 bg-white/90 backdrop-blur-sm rounded-xl text-linkme-marine">
              <Loader2 className="h-5 w-5 text-linkme-turquoise animate-spin" />
              <span className="font-medium">
                Upload en cours... {progress}%
              </span>
            </div>
            <div className="w-48 h-2 bg-white/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-linkme-turquoise transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </>
        ) : (
          <>
            <label
              htmlFor="selection-image-upload"
              className="relative z-20 flex items-center gap-2 px-5 py-3 bg-white/90 backdrop-blur-sm rounded-xl text-linkme-marine hover:bg-white transition-all duration-200 shadow-md hover:shadow-lg group cursor-pointer"
            >
              <Camera className="h-5 w-5 text-linkme-turquoise group-hover:scale-110 transition-transform duration-200" />
              <span className="font-medium">Ajouter une image</span>
            </label>
            <span className="text-xs text-linkme-marine/50 bg-white/70 px-3 py-1 rounded-full backdrop-blur-sm">
              Dimensions recommandées : {RECOMMENDED_WIDTH} ×{' '}
              {RECOMMENDED_HEIGHT} pixels
            </span>
            <span className="text-xs text-linkme-marine/40">
              ou glissez-déposez une image ici
            </span>
          </>
        )}
      </div>

      {/* File input - linked to label via id */}
      <input
        id="selection-image-upload"
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleInputChange}
        className="sr-only"
      />
    </div>
  );
}
