'use client';

/**
 * SelectionConfigSheet
 * Sheet lateral pour la configuration d'une selection (nom, image, visibilite, prix).
 * Remplace l'ancienne page de configuration en mode overlay.
 *
 * @module SelectionConfigSheet
 * @since 2026-03
 */

import { useState, useEffect } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@verone/ui';

import {
  Globe,
  Lock,
  Loader2,
  Edit3,
  Copy,
  Check,
  CheckCircle2,
  Save,
  X,
  Camera,
  Euro,
  Trash2,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';

import { HelpTooltip } from '../../components/ui/help-tooltip';
import { SelectionImageUploadDialog } from './SelectionImageUploadDialog';
import type { UserSelection } from '../../lib/hooks/use-user-selection';
import {
  useToggleSelectionPublished,
  useUpdateSelectionPriceDisplayMode,
} from '../../lib/hooks/use-user-selection';

interface SelectionConfigSheetProps {
  selection: UserSelection;
  isOpen: boolean;
  onClose: () => void;
}

export function SelectionConfigSheet({
  selection,
  isOpen,
  onClose,
}: SelectionConfigSheetProps): React.JSX.Element {
  const togglePublishedMutation = useToggleSelectionPublished();
  const updatePriceDisplayModeMutation = useUpdateSelectionPriceDisplayMode();

  const isPublished = !!selection.published_at;

  // State
  const [linkCopied, setLinkCopied] = useState(false);
  const [priceDisplayMode, setPriceDisplayMode] = useState<'HT' | 'TTC'>('TTC');
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);

  // Initialiser les champs d'edition
  useEffect(() => {
    setEditName(selection.name);
    setEditDescription(selection.description ?? '');
    setPriceDisplayMode(selection.price_display_mode ?? 'TTC');
  }, [selection]);

  // Handler toggle publie
  const handleTogglePublished = async (): Promise<void> => {
    try {
      await togglePublishedMutation.mutateAsync({
        selectionId: selection.id,
        isPublic: !isPublished,
      });
      toast.success(isPublished ? 'Boutique masquée' : 'Boutique en ligne !');
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Erreur lors de la mise à jour';
      toast.error(errorMessage);
    }
  };

  // Copier le lien public
  const handleCopyLink = (): void => {
    const shareUrl = `${window.location.origin}/s/${selection.slug}`;
    void navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        setLinkCopied(true);
        toast.success('Lien copié !');
        setTimeout(() => setLinkCopied(false), 2000);
      })
      .catch((err: unknown) => {
        console.error('[SelectionConfigSheet] Copy failed:', err);
        toast.error('Impossible de copier le lien');
      });
  };

  // Handler sauvegarde edition (placeholder)
  const handleSaveEdit = (): void => {
    toast.info('Sauvegarde à implémenter');
    setIsEditing(false);
  };

  // Handler suppression (placeholder)
  const handleDelete = (): void => {
    toast.info('Suppression à implémenter');
  };

  // Handler changement mode affichage prix
  const handlePriceDisplayModeChange = async (
    mode: 'HT' | 'TTC'
  ): Promise<void> => {
    if (mode === priceDisplayMode) return;

    const previousMode = priceDisplayMode;
    setPriceDisplayMode(mode);
    try {
      await updatePriceDisplayModeMutation.mutateAsync({
        selectionId: selection.id,
        priceDisplayMode: mode,
      });
      toast.success(
        mode === 'HT'
          ? 'Prix affichés hors taxes'
          : 'Prix affichés toutes taxes comprises'
      );
    } catch (error: unknown) {
      setPriceDisplayMode(previousMode);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Erreur lors de la mise à jour';
      toast.error(errorMessage);
    }
  };

  const publicUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/s/${selection.slug}`;

  return (
    <>
      <Sheet
        open={isOpen}
        onOpenChange={open => {
          if (!open) onClose();
        }}
      >
        <SheetContent
          side="right"
          className="w-full sm:max-w-lg overflow-y-auto"
        >
          <SheetHeader className="mb-6">
            <SheetTitle className="text-linkme-marine">
              Personnaliser ma boutique
            </SheetTitle>
          </SheetHeader>

          {/* Image de couverture */}
          <div
            className="relative h-40 rounded-xl bg-gradient-to-br from-linkme-turquoise/20 to-linkme-royal/20 cursor-pointer group overflow-hidden mb-6"
            onClick={() => setIsImageDialogOpen(true)}
          >
            {selection.image_url ? (
              <>
                <Image
                  src={selection.image_url}
                  alt={selection.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg text-linkme-marine font-medium text-sm">
                    <Camera className="h-4 w-4" />
                    Modifier l&apos;image
                  </span>
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <Camera className="h-8 w-8 text-linkme-turquoise/40" />
                <span className="text-sm text-linkme-marine/50">
                  Ajouter une image de couverture
                </span>
              </div>
            )}
          </div>

          {/* Informations */}
          <div className="border border-gray-100 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-linkme-marine">
                Informations
              </h3>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-linkme-turquoise hover:bg-linkme-turquoise/10 rounded-lg transition-colors text-sm font-medium"
                >
                  <Edit3 className="h-4 w-4" />
                  Modifier
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-linkme-marine/60 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium"
                  >
                    <X className="h-4 w-4" />
                    Annuler
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-linkme-turquoise text-white rounded-lg hover:bg-linkme-turquoise/90 transition-colors text-sm font-medium"
                  >
                    <Save className="h-4 w-4" />
                    Sauvegarder
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-linkme-marine/50 mb-1">
                  Nom
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-linkme-turquoise/30 focus:border-linkme-turquoise transition-all"
                  />
                ) : (
                  <p className="text-linkme-marine font-medium text-sm">
                    {selection.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-linkme-marine/50 mb-1">
                  Description
                </label>
                {isEditing ? (
                  <textarea
                    value={editDescription}
                    onChange={e => setEditDescription(e.target.value)}
                    placeholder="Ajoutez une description..."
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-linkme-turquoise/30 focus:border-linkme-turquoise transition-all resize-none"
                  />
                ) : (
                  <p className="text-linkme-marine/70 text-sm">
                    {selection.description ?? (
                      <span className="italic text-linkme-marine/40">
                        Aucune description
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Visibilité */}
          <div className="border border-gray-100 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-1.5 mb-3">
              <h3 className="text-sm font-semibold text-linkme-marine">
                Visibilité
              </h3>
              <HelpTooltip content="Non publiée = visible uniquement par vous. En ligne = accessible via le lien client." />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  if (isPublished) void handleTogglePublished();
                }}
                disabled={togglePublishedMutation.isPending}
                className={`relative p-3 rounded-xl border-2 transition-all text-left ${
                  !isPublished
                    ? 'border-linkme-marine bg-linkme-marine/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {!isPublished && (
                  <CheckCircle2 className="absolute top-2 right-2 h-4 w-4 text-linkme-marine" />
                )}
                <Lock className="h-5 w-5 text-gray-600 mb-2" />
                <div className="font-semibold text-linkme-marine text-sm">
                  Non publiée
                </div>
                <p className="text-xs text-linkme-marine/50 mt-0.5">
                  Visible par vous seul
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!isPublished) void handleTogglePublished();
                }}
                disabled={togglePublishedMutation.isPending}
                className={`relative p-3 rounded-xl border-2 transition-all text-left ${
                  isPublished
                    ? 'border-linkme-turquoise bg-linkme-turquoise/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {isPublished && (
                  <CheckCircle2 className="absolute top-2 right-2 h-4 w-4 text-linkme-turquoise" />
                )}
                <Globe className="h-5 w-5 text-linkme-turquoise mb-2" />
                <div className="font-semibold text-linkme-marine text-sm">
                  En ligne
                </div>
                <p className="text-xs text-linkme-marine/50 mt-0.5">
                  Visible par vos clients
                </p>
              </button>
            </div>

            {togglePublishedMutation.isPending && (
              <div className="flex items-center justify-center gap-2 mt-3 text-linkme-turquoise text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Mise à jour...</span>
              </div>
            )}
          </div>

          {/* Affichage des prix */}
          <div className="border border-gray-100 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Euro className="h-4 w-4 text-linkme-turquoise" />
              <h3 className="text-sm font-semibold text-linkme-marine">
                Affichage des prix
              </h3>
            </div>

            <p className="text-sm text-linkme-marine/70 mb-3">
              Vos clients voient les prix en :
            </p>
            <div className="flex rounded-xl border border-gray-200 overflow-hidden">
              <button
                type="button"
                onClick={() => void handlePriceDisplayModeChange('HT')}
                disabled={updatePriceDisplayModeMutation.isPending}
                className={`flex-1 px-4 py-2.5 text-sm font-medium transition-all ${
                  priceDisplayMode === 'HT'
                    ? 'bg-linkme-turquoise text-white'
                    : 'bg-white text-linkme-marine/60 hover:bg-gray-50'
                }`}
              >
                HT
              </button>
              <button
                type="button"
                onClick={() => void handlePriceDisplayModeChange('TTC')}
                disabled={updatePriceDisplayModeMutation.isPending}
                className={`flex-1 px-4 py-2.5 text-sm font-medium transition-all ${
                  priceDisplayMode === 'TTC'
                    ? 'bg-linkme-turquoise text-white'
                    : 'bg-white text-linkme-marine/60 hover:bg-gray-50'
                }`}
              >
                TTC
              </button>
            </div>
          </div>

          {/* Lien client */}
          <div className="border border-gray-100 rounded-xl p-4 mb-4">
            <h3 className="text-sm font-semibold text-linkme-marine mb-3">
              Lien client
            </h3>

            <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl">
              <p className="flex-1 min-w-0 text-xs text-linkme-marine/70 truncate font-mono">
                {publicUrl}
              </p>
              <button
                onClick={handleCopyLink}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-xs transition-all ${
                  linkCopied
                    ? 'bg-linkme-turquoise text-white'
                    : 'bg-linkme-turquoise/10 text-linkme-turquoise hover:bg-linkme-turquoise hover:text-white'
                }`}
              >
                {linkCopied ? (
                  <>
                    <Check className="h-3.5 w-3.5" /> Copié !
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" /> Copier
                  </>
                )}
              </button>
            </div>

            {!isPublished && (
              <p className="text-xs text-amber-600 mt-2 flex items-center gap-1.5">
                <Lock className="h-3 w-3" />
                Publiez votre boutique pour que le lien soit accessible
              </p>
            )}
          </div>

          {/* Voir ma boutique */}
          <Link
            href={publicUrl}
            target="_blank"
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 border border-linkme-turquoise text-linkme-turquoise rounded-xl font-medium hover:bg-linkme-turquoise/5 transition-all text-sm mb-4"
          >
            <Eye className="h-4 w-4" />
            Voir ma boutique
          </Link>

          {/* Supprimer */}
          <button
            onClick={handleDelete}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors text-sm font-medium"
          >
            <Trash2 className="h-4 w-4" />
            Supprimer cette boutique
          </button>
        </SheetContent>
      </Sheet>

      {/* Dialog Upload Image */}
      <SelectionImageUploadDialog
        isOpen={isImageDialogOpen}
        onClose={() => setIsImageDialogOpen(false)}
        selectionId={selection.id}
        currentImageUrl={selection.image_url}
        selectionName={selection.name}
      />
    </>
  );
}
