'use client';

import { useState, useCallback } from 'react';

import { createClient } from '@verone/utils/supabase/client';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';

// =====================================================================
// TYPES
// =====================================================================

interface UploadZoneProps {
  onUploadComplete: (fileUrl: string, fileName: string) => void;
}

// =====================================================================
// COMPONENT
// =====================================================================

export function UploadZone({ onUploadComplete }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const supabase = createClient();

  const handleUpload = useCallback(
    async (file: File) => {
      if (!file.type.match(/^(application\/pdf|image\/(jpeg|png|webp))$/)) {
        toast.error('Format non supporté. Accepté : PDF, JPG, PNG');
        return;
      }

      setUploading(true);
      try {
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const storagePath = `uploads/${new Date().getFullYear()}/${timestamp}_${safeName}`;

        const { error: uploadError } = await supabase.storage
          .from('invoices')
          .upload(storagePath, file, {
            contentType: file.type,
            upsert: false,
          });

        if (uploadError) {
          toast.error(`Erreur upload : ${uploadError.message}`);
          return;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from('invoices').getPublicUrl(storagePath);

        toast.success(`${file.name} uploadé avec succès`);
        onUploadComplete(publicUrl, file.name);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erreur inconnue';
        toast.error(`Upload échoué : ${msg}`);
      } finally {
        setUploading(false);
      }
    },
    [supabase, onUploadComplete]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        void handleUpload(file);
      }
    },
    [handleUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        void handleUpload(file);
      }
      e.target.value = '';
    },
    [handleUpload]
  );

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`
        relative border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer
        ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
        ${uploading ? 'opacity-50 pointer-events-none' : ''}
      `}
    >
      <input
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={uploading}
      />
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Upload className="h-4 w-4" />
        {uploading ? (
          <span>Upload en cours...</span>
        ) : (
          <span>
            Déposer un fichier ou{' '}
            <span className="text-primary underline underline-offset-2">
              parcourir
            </span>
          </span>
        )}
      </div>
    </div>
  );
}
