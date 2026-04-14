'use client';

import React from 'react';

import { Plus, Loader2 } from 'lucide-react';

import { cn } from '@verone/utils';

interface ProductPhotosUploadZoneProps {
  dragActive: boolean;
  uploading: boolean;
  error: string | null;
  imagesCount: number;
  maxImages: number;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onDrag: (e: React.DragEvent) => void;
  onDragIn: (e: React.DragEvent) => void;
  onDragOut: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ProductPhotosUploadZone({
  dragActive,
  uploading,
  error,
  imagesCount,
  maxImages,
  fileInputRef,
  onDrag,
  onDragIn,
  onDragOut,
  onDrop,
  onInputChange,
}: ProductPhotosUploadZoneProps) {
  if (imagesCount >= maxImages) return null;

  return (
    <div
      className={cn(
        'relative border-2 border-dashed border-gray-300 rounded-lg p-5 text-center transition-all',
        dragActive && 'border-black bg-gray-100',
        error && 'border-red-500 bg-red-50',
        !uploading && 'cursor-pointer hover:border-gray-400 hover:bg-gray-50'
      )}
      onDragEnter={onDragIn}
      onDragLeave={onDragOut}
      onDragOver={onDrag}
      onDrop={onDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={onInputChange}
        disabled={uploading}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
        onDragEnter={onDragIn}
        onDragLeave={onDragOut}
        onDragOver={onDrag}
        onDrop={onDrop}
      />

      <div className="flex flex-col items-center gap-2">
        <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center">
          {uploading ? (
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          ) : (
            <Plus className="w-6 h-6 text-white" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-black">
            {uploading ? 'Upload en cours...' : 'Ajouter des photos'}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Cliquez ou glissez-déposez · JPG, PNG, WebP · Max 10MB
            {imagesCount === 0 && (
              <span className="text-blue-600 ml-1">
                · Première image = principale
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
