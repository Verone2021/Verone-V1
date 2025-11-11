'use client';

import { useState } from 'react';

import Image from 'next/image';

import { useLogoUpload } from '@verone/common/hooks';
import { ButtonV2 } from '@verone/ui';

// FIXME: OrganisationLogo component doesn't exist in monorepo (unused import removed)
// import { OrganisationLogo } from '@/components/business/organisation-logo';
import { spacing, colors } from '@verone/ui';
import { cn } from '@verone/utils';
import { Upload, Trash2, Loader2, AlertCircle, ImagePlus } from 'lucide-react';

interface LogoUploadButtonProps {
  organisationId: string;
  organisationName: string;
  currentLogoUrl?: string | null;
  onUploadSuccess?: () => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

/**
 * Composant pour upload/supprimer un logo d'organisation avec drag & drop
 *
 * @param organisationId - ID de l'organisation
 * @param organisationName - Nom de l'organisation (pour affichage)
 * @param currentLogoUrl - URL actuelle du logo (path Storage)
 * @param onUploadSuccess - Callback appelé après upload/delete réussi
 * @param size - Taille du logo affiché
 * @param className - Classes CSS additionnelles
 *
 * @example
 * <LogoUploadButton
 *   organisationId={supplier.id}
 *   organisationName={supplier.name}
 *   currentLogoUrl={supplier.logo_url}
 *   onUploadSuccess={() => refetch()}
 *   size="lg"
 * />
 */
export function LogoUploadButton({
  organisationId,
  organisationName,
  currentLogoUrl,
  onUploadSuccess,
  size = 'lg',
  className,
}: LogoUploadButtonProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const { uploadLogo, deleteLogo, uploading, deleting, error } = useLogoUpload({
    organisationId,
    currentLogoUrl,
    onSuccess: () => {
      setPreviewUrl(null);
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    },
    onError: err => {
      console.error('Erreur logo:', err);
    },
  });

  /**
   * Gestion upload d'un fichier
   */
  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Preview local avant upload
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    await uploadLogo(file);
  };

  /**
   * Gestionnaires drag & drop
   */
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
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

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileUpload(files[0]);
    }
  };

  /**
   * Gestion click pour ouvrir sélecteur de fichiers
   */
  const handleClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg,image/svg+xml,image/webp';
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        handleFileUpload(file);
      }
    };
    input.click();
  };

  /**
   * Gestion suppression
   */
  const handleDelete = async () => {
    const confirmed = confirm(
      `Êtes-vous sûr de vouloir supprimer le logo de "${organisationName}" ?`
    );

    if (confirmed) {
      await deleteLogo();
    }
  };

  const isLoading = uploading || deleting;

  // Obtenir l'URL complète du logo depuis Supabase Storage
  const getLogoUrl = () => {
    if (!currentLogoUrl) return null;
    if (currentLogoUrl.startsWith('http')) return currentLogoUrl;
    // Construire l'URL publique Supabase
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/organisation-logos/${currentLogoUrl}`;
  };

  const logoUrl = getLogoUrl();

  return (
    <div className={cn('bo-space-y-4', className)}>
      {/* Zone de drag & drop / affichage logo */}
      <div
        className={cn(
          'bo-border-2 bo-border-dashed bo-rounded-lg bo-p-6 bo-transition-all bo-cursor-pointer',
          dragActive && 'bo-border-black bo-bg-gray-50',
          error && 'bo-border-red-500 bo-bg-red-50',
          !dragActive &&
            !error &&
            'bo-border-gray-300 hover:bo-border-gray-400',
          isLoading && 'bo-opacity-50 bo-pointer-events-none'
        )}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={!currentLogoUrl ? handleClick : undefined}
      >
        <div className="bo-flex bo-flex-col bo-items-center bo-justify-center bo-space-y-3">
          {/* Logo actuel ou preview ou placeholder */}
          {logoUrl || previewUrl ? (
            <div className="bo-relative">
              {logoUrl && !previewUrl ? (
                <div
                  className={cn(
                    'bo-relative bo-rounded-md bo-overflow-hidden bo-border bo-border-gray-200',
                    size === 'sm' && 'bo-h-16 bo-w-16',
                    size === 'md' && 'bo-h-24 bo-w-24',
                    size === 'lg' && 'bo-h-32 bo-w-32',
                    size === 'xl' && 'bo-h-40 bo-w-40'
                  )}
                >
                  <Image
                    src={logoUrl}
                    alt={`Logo ${organisationName}`}
                    fill
                    className="bo-object-contain"
                    sizes="(max-width: 768px) 100vw, 200px"
                  />
                </div>
              ) : previewUrl ? (
                <div className="bo-relative">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className={cn(
                      'bo-rounded-md bo-border bo-object-contain',
                      size === 'sm' && 'bo-h-16 bo-w-16',
                      size === 'md' && 'bo-h-24 bo-w-24',
                      size === 'lg' && 'bo-h-32 bo-w-32',
                      size === 'xl' && 'bo-h-40 bo-w-40'
                    )}
                    style={{ borderColor: colors.border.DEFAULT }}
                  />
                  <div className="bo-absolute bo-inset-0 bo-flex bo-items-center bo-justify-center bo-bg-black bo-bg-opacity-50 bo-rounded-md">
                    <Loader2 className="bo-h-8 bo-w-8 bo-text-white bo-animate-spin" />
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="bo-w-20 bo-h-20 bo-rounded-full bo-bg-gray-100 bo-flex bo-items-center bo-justify-center">
              {uploading ? (
                <Loader2 className="bo-w-8 bo-h-8 bo-text-gray-400 bo-animate-spin" />
              ) : (
                <ImagePlus className="bo-w-8 bo-h-8 bo-text-gray-400" />
              )}
            </div>
          )}

          {/* Texte indicatif */}
          <div className="bo-text-center">
            <p className="bo-text-sm bo-font-medium bo-text-black">
              {uploading
                ? 'Upload en cours...'
                : currentLogoUrl
                  ? 'Logo actuel'
                  : 'Ajouter un logo'}
            </p>
            <p className="bo-text-xs bo-text-gray-500 bo-mt-1">
              {!currentLogoUrl && 'Cliquez ou glissez-déposez une image'}
            </p>
            <p className="bo-text-xs bo-text-gray-400 bo-mt-1">
              PNG, JPEG, SVG, WebP • Max 5 MB
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      {currentLogoUrl && (
        <div className="bo-flex bo-gap-2">
          <ButtonV2
            variant="secondary"
            size="sm"
            onClick={handleClick}
            disabled={isLoading}
            icon={uploading ? Loader2 : Upload}
            loading={uploading}
          >
            {uploading ? 'Upload...' : 'Remplacer'}
          </ButtonV2>

          <ButtonV2
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isLoading}
            icon={deleting ? Loader2 : Trash2}
            loading={deleting}
          >
            {deleting ? 'Suppression...' : 'Supprimer'}
          </ButtonV2>
        </div>
      )}

      {/* Message d'erreur */}
      {error && (
        <div
          className="bo-flex bo-items-start bo-gap-2 bo-text-sm bo-p-3 bo-rounded-md bo-border"
          style={{
            backgroundColor: colors.danger[50],
            borderColor: colors.danger[200],
            color: colors.danger[700],
          }}
        >
          <AlertCircle className="bo-h-4 bo-w-4 bo-flex-shrink-0 bo-mt-0.5" />
          <div>
            <p className="bo-font-medium">Erreur</p>
            <p className="bo-text-xs bo-mt-0.5">{error.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
