'use client';

/**
 * UploadDropZone — zone drag & drop dédiée avec bouton "Parcourir".
 * Gère dragOver / dragLeave / drop + click sur input file.
 *
 * Sprint : BO-UI-PROD-IMG-001
 */

import { useRef, useState, useCallback } from 'react';

import { Loader2, Upload } from 'lucide-react';

import { cn } from '@verone/utils';

interface UploadDropZoneProps {
  uploading: boolean;
  onFiles: (files: File[]) => void;
}

export function UploadDropZone({ uploading, onFiles }: UploadDropZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      const files = Array.from(e.dataTransfer.files).filter(f =>
        f.type.startsWith('image/')
      );
      if (files.length > 0) onFiles(files);
    },
    [onFiles]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const files = Array.from(e.target.files);
        onFiles(files);
        e.target.value = '';
      }
    },
    [onFiles]
  );

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-6">
      <p className="text-sm font-semibold text-neutral-900 mb-4">
        Ajouter des images
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={handleInputChange}
      />

      <div
        className={cn(
          'flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-10 px-6 transition-colors cursor-pointer',
          dragActive
            ? 'border-indigo-500 bg-indigo-50/30'
            : 'border-neutral-300 hover:border-indigo-400 hover:bg-indigo-50/10'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        role="button"
        tabIndex={0}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') triggerFileInput();
        }}
        aria-label="Zone de dépôt d'images"
      >
        {uploading ? (
          <Loader2 className="h-12 w-12 text-indigo-400 animate-spin mb-3" />
        ) : (
          <Upload
            className={cn(
              'h-12 w-12 mb-3 transition-colors',
              dragActive ? 'text-indigo-500' : 'text-neutral-400'
            )}
          />
        )}

        <p className="text-sm font-medium text-neutral-700 text-center">
          {uploading
            ? 'Upload en cours…'
            : 'Glissez vos images ici ou cliquez pour sélectionner'}
        </p>
        <p className="text-xs text-neutral-400 mt-1 text-center">
          JPEG, PNG, WebP · max 10 MB par fichier · upload multiple
        </p>

        {!uploading && (
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              triggerFileInput();
            }}
            className="mt-4 flex items-center gap-1.5 px-4 py-2.5 md:py-2 rounded border border-neutral-300 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            <Upload className="h-4 w-4" />
            Parcourir les fichiers
          </button>
        )}
      </div>
    </div>
  );
}
