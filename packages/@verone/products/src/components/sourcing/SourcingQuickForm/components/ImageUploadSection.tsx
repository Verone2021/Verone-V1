/* eslint-disable @next/next/no-img-element */
'use client';

import { useRef } from 'react';

import { Button, Label } from '@verone/ui';
import { cn } from '@verone/utils';
import { Upload, X } from 'lucide-react';

interface ImageUploadSectionProps {
  selectedImages: File[];
  imagePreviews: string[];
  errors: Record<string, string>;
  onImagesSelect: (files: File[]) => void;
  onRemoveImage: (index: number) => void;
}

export function ImageUploadSection({
  selectedImages,
  imagePreviews,
  errors,
  onImagesSelect,
  onRemoveImage,
}: ImageUploadSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files);
    onImagesSelect(files);
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        Images du produit (facultatif)
      </Label>

      {imagePreviews.length > 0 && (
        <div className="grid grid-cols-4 gap-3 mb-3">
          {imagePreviews.map((preview, index) => (
            <div key={index} className="relative group">
              <img
                src={preview}
                alt={`Image ${index + 1}`}
                className={cn(
                  'h-24 w-full object-cover rounded-lg border-2',
                  index === 0 ? 'border-green-400' : 'border-gray-200'
                )}
              />
              {index === 0 && (
                <span className="absolute top-1 left-1 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded">
                  Principale
                </span>
              )}
              <button
                type="button"
                onClick={() => onRemoveImage(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
              <div className="text-[10px] text-gray-500 truncate mt-1">
                {selectedImages[index]?.name}
              </div>
            </div>
          ))}
        </div>
      )}

      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center transition-colors',
          selectedImages.length > 0
            ? 'border-green-300 bg-green-50'
            : errors.image
              ? 'border-red-300 bg-red-50'
              : 'border-gray-300 hover:border-gray-400'
        )}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="space-y-3">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <div>
            <p className="text-gray-600">
              {selectedImages.length > 0
                ? 'Glissez-déposez pour ajouter des images ou'
                : 'Glissez-déposez des images ou'}
            </p>
            <Button
              type="button"
              variant="ghost"
              onClick={() => fileInputRef.current?.click()}
              className="text-black hover:underline p-0 h-auto font-normal"
            >
              cliquez pour sélectionner
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={e => {
                const files = Array.from(e.target.files ?? []);
                if (files.length > 0) onImagesSelect(files);
                e.target.value = '';
              }}
            />
          </div>
          <p className="text-xs text-gray-500">
            PNG, JPG, WEBP jusqu&apos;à 10MB — La 1ère image sera l&apos;image
            principale
          </p>
        </div>
      </div>

      {errors.image && <p className="text-sm text-red-600">{errors.image}</p>}
    </div>
  );
}
