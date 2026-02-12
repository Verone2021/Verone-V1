'use client';

/**
 * Page Détail/Configuration Sélection
 * Page MINIMALISTE orientée CONFIGURATION (pas statistiques)
 *
 * Fonctionnalités :
 * - Édition nom/description/image
 * - Toggle visibilité (brouillon/publiée)
 * - Lien de partage
 * - Actions : prévisualiser, partager, supprimer
 *
 * PAS de KPIs ni Top produits (redondant avec /statistiques)
 *
 * @module SelectionDetailPage
 * @since 2026-01-09
 */

import { useState, useEffect } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import {
  ArrowLeft,
  Loader2,
  Package,
  Globe,
  Lock,
  Edit3,
  Trash2,
  Copy,
  Check,
  Eye,
  Settings,
  CheckCircle2,
  Save,
  X,
  LayoutGrid,
  Camera,
  Euro,
} from 'lucide-react';
import { toast } from 'sonner';

import { SelectionImageUploadDialog } from '../../../../components/selection/SelectionImageUploadDialog';
import { useAuth, type LinkMeRole } from '../../../../contexts/AuthContext';
import {
  useUserAffiliate,
  useUserSelections,
  useToggleSelectionPublished,
  useUpdateSelectionPriceDisplayMode,
} from '../../../../lib/hooks/use-user-selection';

// Rôles autorisés
const AUTHORIZED_ROLES: LinkMeRole[] = ['enseigne_admin', 'organisation_admin'];

export default function SelectionDetailPage(): React.JSX.Element | null {
  const params = useParams();
  const selectionId = params.id as string;

  const { user, linkMeRole, initializing: authLoading } = useAuth();
  const { data: _affiliate, isLoading: affiliateLoading } = useUserAffiliate();
  const { data: selections, isLoading: selectionsLoading } =
    useUserSelections();

  const togglePublishedMutation = useToggleSelectionPublished();
  const updatePriceDisplayModeMutation = useUpdateSelectionPriceDisplayMode();

  // State
  const [linkCopied, setLinkCopied] = useState(false);
  const [priceDisplayMode, setPriceDisplayMode] = useState<'HT' | 'TTC'>('TTC');
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);

  // Trouver la sélection actuelle (par ID ou slug pour URLs propres)
  const selection = selections?.find(
    s => s.id === selectionId || s.slug === selectionId
  );

  // Helper: vérifier si la sélection est publiée (basé sur published_at)
  const isPublished = !!selection?.published_at;

  // Initialiser les champs d'édition
  useEffect(() => {
    if (selection) {
      setEditName(selection.name);
      setEditDescription(selection.description ?? '');
      setPriceDisplayMode(selection.price_display_mode ?? 'TTC');
    }
  }, [selection]);

  // Handler toggle publié
  const handleTogglePublished = async (): Promise<void> => {
    if (!selection) return;

    try {
      await togglePublishedMutation.mutateAsync({
        selectionId: selection.id,
        isPublic: !isPublished,
      });
      toast.success(
        isPublished ? 'Sélection dépubliée' : 'Sélection publiée !'
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Erreur lors de la mise à jour';
      toast.error(errorMessage);
    }
  };

  // Copier le lien public /s/[slug]
  const handleCopyLink = (): void => {
    if (!selection) return;

    const shareUrl = `${window.location.origin}/s/${selection.slug}`;
    void navigator.clipboard.writeText(shareUrl);
    setLinkCopied(true);
    toast.success('Lien copié !');

    setTimeout(() => setLinkCopied(false), 2000);
  };

  // Handler sauvegarde édition (placeholder)
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
    if (!selection || mode === priceDisplayMode) return;

    setPriceDisplayMode(mode); // Update local state immediately for UX
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
      // Revert on error
      setPriceDisplayMode(priceDisplayMode === 'HT' ? 'TTC' : 'HT');
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Erreur lors de la mise à jour';
      toast.error(errorMessage);
    }
  };

  // Chargement
  if (authLoading || affiliateLoading || selectionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-gray-50">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-linkme-turquoise/10 flex items-center justify-center mx-auto">
            <Loader2 className="h-8 w-8 text-linkme-turquoise animate-spin" />
          </div>
          <p className="text-linkme-marine/60 text-sm font-medium">
            Chargement...
          </p>
        </div>
      </div>
    );
  }

  // Vérification accès - afficher message si non autorisé
  if (!user || !linkMeRole || !AUTHORIZED_ROLES.includes(linkMeRole.role)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 rounded-2xl bg-linkme-turquoise/10 flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8 text-linkme-turquoise" />
          </div>
          <h1 className="text-xl font-bold text-linkme-marine mb-2">
            Accès non autorisé
          </h1>
          <p className="text-linkme-marine/60 mb-6 text-sm">
            Vous n&apos;avez pas les permissions pour accéder à cette sélection.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-linkme-turquoise text-white rounded-xl font-medium hover:bg-linkme-turquoise/90 transition-all duration-200 shadow-md hover:shadow-lg text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Sélection non trouvée
  if (!selection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 rounded-2xl bg-linkme-turquoise/10 flex items-center justify-center mx-auto mb-4">
            <LayoutGrid className="h-8 w-8 text-linkme-turquoise" />
          </div>
          <h1 className="text-xl font-bold text-linkme-marine mb-2">
            Sélection introuvable
          </h1>
          <p className="text-linkme-marine/60 mb-6 text-sm">
            Cette sélection n&apos;existe pas ou a été supprimée.
          </p>
          <Link
            href="/ma-selection"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-linkme-turquoise text-white rounded-xl font-medium hover:bg-linkme-turquoise/90 transition-all duration-200 shadow-md hover:shadow-lg text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux sélections
          </Link>
        </div>
      </div>
    );
  }

  // URL publique
  const publicUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/s/${selection.slug}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header navigation */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/ma-selection"
            className="flex items-center gap-2 text-linkme-marine/60 hover:text-linkme-marine transition-colors text-sm group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform duration-200" />
            <span className="font-medium">Mes sélections</span>
          </Link>

          <button
            onClick={handleDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors text-sm"
          >
            <Trash2 className="h-4 w-4" />
            <span className="font-medium">Supprimer</span>
          </button>
        </div>

        {/* Titre avec icône */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-linkme-turquoise/10 flex items-center justify-center flex-shrink-0">
            <Settings className="h-7 w-7 text-linkme-turquoise" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-linkme-marine">
              Configuration
            </h1>
            <p className="text-linkme-marine/60 text-sm">
              Personnalisez votre sélection
            </p>
          </div>
        </div>

        {/* Card Image de couverture */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6 relative">
          <div
            className="relative h-48 bg-gradient-to-br from-linkme-turquoise/20 to-linkme-royal/20 cursor-pointer group"
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
                  <span className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg text-linkme-marine font-medium">
                    <Camera className="h-4 w-4" />
                    Modifier l'image
                  </span>
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <button
                  type="button"
                  className="flex items-center gap-2 px-5 py-3 bg-white/90 backdrop-blur-sm rounded-xl text-linkme-marine hover:bg-white transition-all duration-200 shadow-md hover:shadow-lg group"
                >
                  <Camera className="h-5 w-5 text-linkme-turquoise group-hover:scale-110 transition-transform duration-200" />
                  <span className="font-medium">Ajouter une image</span>
                </button>
                <span className="text-xs text-linkme-marine/50 bg-white/70 px-3 py-1 rounded-full backdrop-blur-sm">
                  Dimensions recommandées : 1280 × 360 pixels
                </span>
              </div>
            )}
          </div>

          {/* Badge statut */}
          <div className="absolute top-4 right-4 z-10">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${
                isPublished
                  ? 'bg-linkme-turquoise text-white'
                  : 'bg-white text-linkme-marine/70'
              }`}
            >
              {isPublished ? (
                <>
                  <Globe className="h-3.5 w-3.5" />
                  Publiée
                </>
              ) : (
                <>
                  <Lock className="h-3.5 w-3.5" />
                  Brouillon
                </>
              )}
            </span>
          </div>
        </div>

        {/* Dialog Upload Image */}
        <SelectionImageUploadDialog
          isOpen={isImageDialogOpen}
          onClose={() => setIsImageDialogOpen(false)}
          selectionId={selection.id}
          currentImageUrl={selection.image_url}
          selectionName={selection.name}
        />

        {/* Card Informations */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-linkme-marine">
              Informations
            </h2>
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

          <div className="space-y-4">
            {/* Nom */}
            <div>
              <label className="block text-xs font-medium text-linkme-marine/50 mb-1.5">
                Nom
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-linkme-turquoise/30 focus:border-linkme-turquoise transition-all duration-200"
                />
              ) : (
                <p className="text-linkme-marine font-medium">
                  {selection.name}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-linkme-marine/50 mb-1.5">
                Description
              </label>
              {isEditing ? (
                <textarea
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  placeholder="Ajoutez une description..."
                  rows={3}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-linkme-turquoise/30 focus:border-linkme-turquoise transition-all duration-200 resize-none"
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

            {/* Produits */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-linkme-turquoise" />
                <span className="text-sm text-linkme-marine">
                  <strong>{selection.products_count}</strong> produit
                  {selection.products_count > 1 ? 's' : ''}
                </span>
              </div>
              <Link
                href={`/ma-selection/${selection.slug}/produits`}
                className="text-sm font-medium text-linkme-turquoise hover:text-linkme-turquoise/80 transition-colors"
              >
                Gérer les produits →
              </Link>
            </div>
          </div>
        </div>

        {/* Card Visibilité */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="text-sm font-semibold text-linkme-marine mb-4">
            Visibilité
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {/* Option Brouillon */}
            <button
              type="button"
              onClick={() => {
                if (isPublished) void handleTogglePublished();
              }}
              disabled={togglePublishedMutation.isPending}
              className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                !isPublished
                  ? 'border-linkme-marine bg-linkme-marine/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {!isPublished && (
                <CheckCircle2 className="absolute top-3 right-3 h-5 w-5 text-linkme-marine" />
              )}
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center mb-3">
                <Lock className="h-5 w-5 text-gray-600" />
              </div>
              <div className="font-semibold text-linkme-marine text-sm mb-1">
                Brouillon
              </div>
              <p className="text-xs text-linkme-marine/50">
                Non visible publiquement
              </p>
            </button>

            {/* Option Publiée */}
            <button
              type="button"
              onClick={() => {
                if (!isPublished) void handleTogglePublished();
              }}
              disabled={togglePublishedMutation.isPending}
              className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                isPublished
                  ? 'border-linkme-turquoise bg-linkme-turquoise/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {isPublished && (
                <CheckCircle2 className="absolute top-3 right-3 h-5 w-5 text-linkme-turquoise" />
              )}
              <div className="w-10 h-10 rounded-lg bg-linkme-turquoise/10 flex items-center justify-center mb-3">
                <Globe className="h-5 w-5 text-linkme-turquoise" />
              </div>
              <div className="font-semibold text-linkme-marine text-sm mb-1">
                Publiée
              </div>
              <p className="text-xs text-linkme-marine/50">
                Visible par vos clients
              </p>
            </button>
          </div>

          {togglePublishedMutation.isPending && (
            <div className="flex items-center justify-center gap-2 mt-4 text-linkme-turquoise text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Mise à jour...</span>
            </div>
          )}
        </div>

        {/* Card Affichage des prix */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Euro className="h-5 w-5 text-linkme-turquoise" />
            <h2 className="text-sm font-semibold text-linkme-marine">
              Affichage des prix
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-linkme-marine/70">
              Afficher les prix sur cette sélection en :
            </span>
            <div className="flex rounded-xl border border-gray-200 overflow-hidden">
              <button
                type="button"
                onClick={() => void handlePriceDisplayModeChange('HT')}
                disabled={updatePriceDisplayModeMutation.isPending}
                className={`px-5 py-2.5 text-sm font-medium transition-all duration-200 ${
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
                className={`px-5 py-2.5 text-sm font-medium transition-all duration-200 ${
                  priceDisplayMode === 'TTC'
                    ? 'bg-linkme-turquoise text-white'
                    : 'bg-white text-linkme-marine/60 hover:bg-gray-50'
                }`}
              >
                TTC
              </button>
            </div>
          </div>

          <p className="mt-3 text-xs text-linkme-marine/50">
            Les prix seront affichés{' '}
            {priceDisplayMode === 'TTC'
              ? 'toutes taxes comprises'
              : 'hors taxes'}{' '}
            sur cette sélection
          </p>

          {updatePriceDisplayModeMutation.isPending && (
            <div className="flex items-center justify-center gap-2 mt-4 text-linkme-turquoise text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Mise à jour...</span>
            </div>
          )}
        </div>

        {/* Card Lien de partage */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="text-sm font-semibold text-linkme-marine mb-4">
            Lien de partage
          </h2>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-linkme-marine/70 truncate font-mono">
                {publicUrl}
              </p>
            </div>
            <button
              onClick={handleCopyLink}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                linkCopied
                  ? 'bg-linkme-turquoise text-white'
                  : 'bg-linkme-turquoise/10 text-linkme-turquoise hover:bg-linkme-turquoise hover:text-white'
              }`}
            >
              {linkCopied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copié !
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copier
                </>
              )}
            </button>
          </div>

          {!isPublished && (
            <p className="text-xs text-amber-600 mt-3 flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" />
              Publiez votre sélection pour que le lien soit accessible
            </p>
          )}
        </div>

        {/* Actions rapides */}
        <div className="flex flex-wrap gap-3">
          <Link
            href={publicUrl}
            target="_blank"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-linkme-turquoise text-white rounded-xl font-semibold hover:bg-linkme-turquoise/90 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
          >
            <Eye className="h-5 w-5" />
            Prévisualiser
          </Link>

          <Link
            href={`/ma-selection/${selection.slug}/produits`}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-linkme-turquoise text-linkme-turquoise rounded-xl font-semibold hover:bg-linkme-turquoise/5 transition-all duration-200"
          >
            <Package className="h-5 w-5" />
            Gérer produits
          </Link>
        </div>
      </div>
    </div>
  );
}
