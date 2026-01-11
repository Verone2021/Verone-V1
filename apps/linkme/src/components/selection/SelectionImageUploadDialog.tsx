/**
 * Component: SelectionImageUploadDialog
 * Modal Dialog pour uploader l'image de couverture d'une selection
 * Avec outil de recadrage (cropping) intégré
 *
 * @module SelectionImageUploadDialog
 * @since 2026-01-09
 * @updated 2026-01-10 - Ajout du cropping avec react-easy-crop
 */

'use client';

import { useCallback, useRef, useState } from 'react';

import Image from 'next/image';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@verone/ui';
import {
  ArrowLeft,
  Camera,
  Check,
  Loader2,
  Trash2,
  Upload,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import Cropper, { type Area, type Point } from 'react-easy-crop';
import { toast } from 'sonner';

import {
  useDeleteSelectionImage,
  useUploadSelectionImage,
} from '../../lib/hooks/use-selection-image';
import {
  getCroppedImage,
  type ICroppedAreaPixels,
} from '../../lib/utils/image-crop';

interface ISelectionImageUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectionId: string;
  currentImageUrl: string | null;
  selectionName: string;
}

const MAX_SIZE_MB = 10; // Increased to allow larger source images for cropping
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const OUTPUT_WIDTH = 1280;
const OUTPUT_HEIGHT = 360;
const ASPECT_RATIO = OUTPUT_WIDTH / OUTPUT_HEIGHT; // 32:9 ≈ 3.556

type TDialogStep = 'select' | 'crop' | 'uploading';

export function SelectionImageUploadDialog({
  isOpen,
  onClose,
  selectionId,
  currentImageUrl,
  selectionName,
}: ISelectionImageUploadDialogProps): React.JSX.Element {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dialog state
  const [step, setStep] = useState<TDialogStep>('select');
  const [isDragging, setIsDragging] = useState(false);

  // Cropper state
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] =
    useState<ICroppedAreaPixels | null>(null);

  const {
    mutateAsync: uploadImage,
    isPending: _isUploading,
    progress,
  } = useUploadSelectionImage();

  const { mutateAsync: deleteImage, isPending: isDeleting } =
    useDeleteSelectionImage();

  // Handle crop complete - store the pixel coordinates
  const onCropComplete = useCallback(
    (_croppedArea: Area, croppedAreaPx: Area): void => {
      setCroppedAreaPixels(croppedAreaPx);
    },
    []
  );

  // Handle file selection - move to crop step
  const handleFileSelect = (file: File): void => {
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

    // Create preview URL and switch to crop mode
    const reader = new FileReader();
    reader.onload = e => {
      setImageSrc(e.target?.result as string);
      setStep('crop');
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
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
      handleFileSelect(file);
    }
  };

  // Cancel cropping - go back to select
  const handleCancelCrop = (): void => {
    setStep('select');
    setImageSrc(null);
    setCroppedAreaPixels(null);
  };

  // Validate cropping and upload
  const handleValidateCrop = async (): Promise<void> => {
    if (!imageSrc || !croppedAreaPixels) {
      toast.error('Veuillez sélectionner une zone de recadrage');
      return;
    }

    setStep('uploading');

    try {
      // Generate cropped image blob
      const croppedBlob = await getCroppedImage(
        imageSrc,
        croppedAreaPixels,
        OUTPUT_WIDTH,
        OUTPUT_HEIGHT
      );

      // Create file from blob
      const croppedFile = new File([croppedBlob], 'cover-image.jpg', {
        type: 'image/jpeg',
      });

      // Upload
      await uploadImage({ selectionId, file: croppedFile });
      toast.success('Image mise à jour !');

      // Reset and close
      setStep('select');
      setImageSrc(null);
      setCroppedAreaPixels(null);
      onClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erreur lors de l'upload";
      toast.error(message);
      setStep('crop');
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!currentImageUrl) return;

    try {
      await deleteImage({ selectionId, imageUrl: currentImageUrl });
      toast.success('Image supprimée');
      onClose();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Erreur lors de la suppression';
      toast.error(message);
    }
  };

  // Reset state when dialog closes
  const handleOpenChange = (open: boolean): void => {
    if (!open) {
      setStep('select');
      setImageSrc(null);
      setCroppedAreaPixels(null);
      onClose();
    }
  };

  // Render based on current step
  const renderContent = (): React.JSX.Element => {
    // Step: Cropping
    if (step === 'crop' && imageSrc) {
      return (
        <div className="space-y-4">
          {/* Cropper container */}
          <div className="relative h-[300px] bg-gray-900 rounded-lg overflow-hidden">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={ASPECT_RATIO}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
              minZoom={1}
              maxZoom={3}
              showGrid
              style={{
                containerStyle: {
                  borderRadius: '0.5rem',
                },
              }}
            />

            {/* Guidelines overlay */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Thirds grid */}
              <div className="absolute inset-0 flex">
                <div className="flex-1 border-r border-white/20" />
                <div className="flex-1 border-r border-white/20" />
                <div className="flex-1" />
              </div>
              <div className="absolute inset-0 flex flex-col">
                <div className="flex-1 border-b border-white/20" />
                <div className="flex-1 border-b border-white/20" />
                <div className="flex-1" />
              </div>
            </div>
          </div>

          {/* Zoom slider */}
          <div className="flex items-center gap-3 px-2">
            <ZoomOut className="h-4 w-4 text-gray-400" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={e => setZoom(Number(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-linkme-turquoise"
            />
            <ZoomIn className="h-4 w-4 text-gray-400" />
          </div>

          {/* Info text */}
          <p className="text-xs text-center text-gray-500">
            Déplacez et zoomez pour ajuster la zone visible ({OUTPUT_WIDTH} ×{' '}
            {OUTPUT_HEIGHT}px)
          </p>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCancelCrop}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </button>
            <button
              type="button"
              onClick={() => void handleValidateCrop()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-linkme-turquoise text-white rounded-lg font-medium hover:bg-linkme-turquoise/90 transition-colors"
            >
              <Check className="h-4 w-4" />
              Valider
            </button>
          </div>
        </div>
      );
    }

    // Step: Uploading
    if (step === 'uploading') {
      return (
        <div className="py-12 text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-linkme-turquoise mx-auto" />
          <div>
            <p className="font-medium text-gray-900">Upload en cours...</p>
            <p className="text-sm text-gray-500">{progress}%</p>
          </div>
          <div className="w-48 h-2 bg-gray-200 rounded-full mx-auto overflow-hidden">
            <div
              className="h-full bg-linkme-turquoise transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      );
    }

    // Step: Select (default)
    // Show current image if exists
    if (currentImageUrl) {
      return (
        <div className="space-y-4">
          <div className="relative h-48 rounded-lg overflow-hidden border border-gray-200">
            <Image
              src={currentImageUrl}
              alt={selectionName}
              fill
              className="object-cover"
              unoptimized
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isDeleting}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-linkme-turquoise text-white rounded-lg font-medium hover:bg-linkme-turquoise/90 transition-colors ${
                isDeleting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Upload className="h-4 w-4" />
              Remplacer
            </button>
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={isDeleting}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Supprimer
            </button>
          </div>

          <p className="text-xs text-center text-gray-500">
            Dimensions : {OUTPUT_WIDTH} × {OUTPUT_HEIGHT} pixels
          </p>
        </div>
      );
    }

    // No image - show upload zone
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`relative block w-full border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
            isDragging
              ? 'border-linkme-turquoise bg-linkme-turquoise/10'
              : 'border-gray-300 hover:border-linkme-turquoise hover:bg-gray-50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="space-y-3">
            <div className="w-16 h-16 rounded-full bg-linkme-turquoise/10 flex items-center justify-center mx-auto">
              <Upload className="h-8 w-8 text-linkme-turquoise" />
            </div>
            <div>
              <p className="text-base font-medium text-gray-900">
                Cliquez ou glissez une image
              </p>
              <p className="text-sm text-gray-500 mt-1">
                JPEG, PNG ou WebP (max {MAX_SIZE_MB}MB)
              </p>
            </div>
          </div>
        </button>

        <p className="text-xs text-center text-gray-500">
          L&apos;image sera recadrée au format {OUTPUT_WIDTH} × {OUTPUT_HEIGHT}{' '}
          pixels
        </p>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        dialogSize="lg"
        className="bg-white border-0 shadow-2xl rounded-2xl overflow-y-auto max-h-[90vh]"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-linkme-turquoise" />
            {step === 'crop' ? "Recadrer l'image" : 'Image de couverture'}
          </DialogTitle>
        </DialogHeader>

        <div className="pt-4">{renderContent()}</div>

        {/* Hidden file input - visibility:hidden works better than display:none in modals */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleInputChange}
          style={{
            position: 'absolute',
            width: 0,
            height: 0,
            visibility: 'hidden',
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
