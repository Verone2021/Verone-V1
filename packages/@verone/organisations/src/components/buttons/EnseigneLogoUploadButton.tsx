'use client';

/**
 * Composant pour sélectionner/prévisualiser un logo d'enseigne
 *
 * Flux correct :
 * 1. Drop/clic → preview affichée, fichier stocké localement, PAS d'upload
 * 2. Le parent appelle uploadPendingFile() au clic "Enregistrer"
 * 3. Après upload, le callback onUploadSuccess rafraîchit les données
 *
 * Utilise un <input type="file" ref> dans le DOM (compatible modals/dialogs)
 */

import {
  useState,
  useRef,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from 'react';

import Image from 'next/image';

import { useLogoUpload } from '@verone/common/hooks';
import { ButtonV2 } from '@verone/ui';
import { cn } from '@verone/utils';
import { Upload, Trash2, Loader2, AlertCircle, ImagePlus } from 'lucide-react';

export interface EnseigneLogoUploadRef {
  /** Effectue l'upload du fichier en attente. Retourne true si succès. */
  uploadPendingFile: () => Promise<boolean>;
  /** Supprime le logo actuel. Retourne true si succès. */
  deleteCurrentLogo: () => Promise<boolean>;
  /** Retourne true si un fichier est en attente d'upload */
  hasPendingFile: () => boolean;
}

interface EnseigneLogoUploadButtonProps {
  enseigneId: string;
  enseigneName: string;
  currentLogoUrl?: string | null;
  onUploadSuccess?: () => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const EnseigneLogoUploadButton = forwardRef<
  EnseigneLogoUploadRef,
  EnseigneLogoUploadButtonProps
>(function EnseigneLogoUploadButton(
  {
    enseigneId,
    enseigneName,
    currentLogoUrl,
    onUploadSuccess,
    size = 'lg',
    className,
  },
  ref
) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingDelete, setPendingDelete] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { uploadLogo, deleteLogo, uploading, deleting, error } = useLogoUpload({
    entityId: enseigneId,
    entityTable: 'enseignes',
    currentLogoUrl,
    onSuccess: () => {
      setPreviewUrl(null);
      setPendingFile(null);
      setPendingDelete(false);
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    },
    onError: err => {
      console.error('Erreur logo enseigne:', err);
    },
  });

  // Exposer les méthodes au parent via ref
  useImperativeHandle(
    ref,
    () => ({
      uploadPendingFile: async () => {
        // Si suppression demandée
        if (pendingDelete) {
          return await deleteLogo();
        }
        // Si nouveau fichier sélectionné
        if (pendingFile) {
          const result = await uploadLogo(pendingFile);
          return result !== null;
        }
        // Rien à faire
        return true;
      },
      deleteCurrentLogo: async () => {
        return await deleteLogo();
      },
      hasPendingFile: () => pendingFile !== null || pendingDelete,
    }),
    [pendingFile, pendingDelete, uploadLogo, deleteLogo]
  );

  /** Sélectionner un fichier : stocker + preview, PAS d'upload */
  const handleFileSelected = useCallback((file: File) => {
    if (!file) return;
    setPendingFile(file);
    setPendingDelete(false);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

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
    if (files?.[0]) {
      handleFileSelected(files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelected(file);
    }
    e.target.value = '';
  };

  /** Marquer pour suppression (pas de suppression immédiate) */
  const handleMarkForDelete = () => {
    const confirmed = confirm(
      `Êtes-vous sûr de vouloir supprimer le logo de "${enseigneName}" ?`
    );
    if (confirmed) {
      setPendingDelete(true);
      setPendingFile(null);
      setPreviewUrl(null);
    }
  };

  const handleCancelPending = () => {
    setPendingFile(null);
    setPendingDelete(false);
    setPreviewUrl(null);
  };

  const isLoading = uploading || deleting;

  const getLogoUrl = () => {
    if (!currentLogoUrl) return null;
    if (currentLogoUrl.startsWith('http')) return currentLogoUrl;
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/organisation-logos/${currentLogoUrl}`;
  };

  const logoUrl = getLogoUrl();

  const sizeClasses = {
    sm: 'h-16 w-16',
    md: 'h-24 w-24',
    lg: 'h-32 w-32',
    xl: 'h-40 w-40',
  };

  // Déterminer ce qui est affiché
  const showPendingDelete = pendingDelete && !pendingFile;
  const showPreview = !!previewUrl && !!pendingFile;
  const showCurrentLogo = !showPendingDelete && !showPreview && !!logoUrl;
  const showEmpty = !showPendingDelete && !showPreview && !showCurrentLogo;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Input file caché (ref) — fonctionne dans les modals */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Zone de drag & drop */}
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-6 transition-all cursor-pointer',
          dragActive && 'border-black bg-gray-50',
          error && 'border-red-500 bg-red-50',
          showPendingDelete && 'border-red-300 bg-red-50',
          showPreview && 'border-green-400 bg-green-50',
          !dragActive &&
            !error &&
            !showPendingDelete &&
            !showPreview &&
            'border-gray-300 hover:border-gray-400',
          isLoading && 'opacity-50 pointer-events-none'
        )}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <div className="flex flex-col items-center justify-center space-y-3">
          {/* Preview du nouveau fichier */}
          {showPreview && previewUrl && (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Preview"
                className={cn(
                  'rounded-md border border-green-300 object-contain',
                  sizeClasses[size]
                )}
              />
            </div>
          )}

          {/* Logo actuel */}
          {showCurrentLogo && logoUrl && (
            <div
              className={cn(
                'relative rounded-md overflow-hidden border border-gray-200',
                sizeClasses[size]
              )}
            >
              <Image
                src={logoUrl}
                alt={`Logo ${enseigneName}`}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 200px"
              />
            </div>
          )}

          {/* Suppression en attente */}
          {showPendingDelete && (
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
              <Trash2 className="w-8 h-8 text-red-400" />
            </div>
          )}

          {/* Pas de logo */}
          {showEmpty && (
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
              {isLoading ? (
                <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
              ) : (
                <ImagePlus className="w-8 h-8 text-gray-400" />
              )}
            </div>
          )}

          {/* Texte indicatif */}
          <div className="text-center">
            <p className="text-sm font-medium text-black">
              {isLoading
                ? uploading
                  ? 'Upload en cours...'
                  : 'Suppression en cours...'
                : showPendingDelete
                  ? "Logo sera supprimé à l'enregistrement"
                  : showPreview && pendingFile
                    ? `${pendingFile.name}`
                    : currentLogoUrl
                      ? 'Cliquez pour remplacer le logo'
                      : 'Cliquez ou glissez-déposez une image'}
            </p>
            {(showPreview || showPendingDelete) && !isLoading && (
              <p
                className={cn(
                  'text-xs mt-1',
                  showPendingDelete ? 'text-red-600' : 'text-green-600'
                )}
              >
                {showPendingDelete
                  ? 'Cliquez "Enregistrer" pour confirmer la suppression'
                  : 'Cliquez "Enregistrer" pour sauvegarder'}
              </p>
            )}
            {!showPreview && !showPendingDelete && (
              <p className="text-xs text-gray-400 mt-1">
                PNG, JPEG, SVG, WebP - Max 5 MB
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bouton annuler la modification en attente */}
      {(showPreview || showPendingDelete) && !isLoading && (
        <ButtonV2
          variant="ghost"
          size="sm"
          onClick={handleCancelPending}
          className="w-full text-gray-500"
        >
          Annuler la modification
        </ButtonV2>
      )}

      {/* Boutons Remplacer / Supprimer (si logo existant et pas de modification en attente) */}
      {currentLogoUrl && !showPreview && !showPendingDelete && (
        <div className="flex gap-2">
          <ButtonV2
            variant="secondary"
            size="sm"
            onClick={handleClick}
            disabled={isLoading}
            icon={Upload}
            className="flex-1"
          >
            Remplacer
          </ButtonV2>

          <ButtonV2
            variant="destructive"
            size="sm"
            onClick={handleMarkForDelete}
            disabled={isLoading}
            icon={Trash2}
            className="flex-1"
          >
            Supprimer
          </ButtonV2>
        </div>
      )}

      {/* Erreur */}
      {error && (
        <div className="flex items-start gap-2 text-sm p-3 rounded-md border bg-red-50 border-red-200 text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Erreur</p>
            <p className="text-xs mt-0.5">{error.message}</p>
          </div>
        </div>
      )}
    </div>
  );
});
