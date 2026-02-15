'use client';

/**
 * Page Création Nouvelle Sélection
 * Design moderne avec charte graphique LinkMe
 *
 * Fonctionnalités :
 * - Nom (obligatoire)
 * - Description (optionnelle)
 * - Image de couverture (optionnelle)
 * - Choix visibilité (brouillon/publiée)
 * - Redirection après création
 *
 * @module NewSelectionPage
 * @since 2026-01-09
 */

import { useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  ArrowLeft,
  Loader2,
  Camera,
  Globe,
  Lock,
  Plus,
  Sparkles,
  LayoutGrid,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

import { useAuth, type LinkMeRole } from '../../../../contexts/AuthContext';
import {
  useUserAffiliate,
  useCreateSelection,
} from '../../../../lib/hooks/use-user-selection';

// Rôles autorisés
const AUTHORIZED_ROLES: LinkMeRole[] = ['enseigne_admin', 'organisation_admin'];

export default function NewSelectionPage() {
  const router = useRouter();

  const { user, linkMeRole, initializing: authLoading } = useAuth();
  const { data: affiliate, isLoading: affiliateLoading } = useUserAffiliate();

  const createSelectionMutation = useCreateSelection();

  // State formulaire
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'draft' | 'public'>('draft');
  const [imagePreview, _setImagePreview] = useState<string | null>(null);

  // Handler création
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Le nom est obligatoire');
      return;
    }

    try {
      const newSelection = (await createSelectionMutation.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
      })) as { id: string };

      toast.success('Sélection créée avec succès !');

      // Redirection vers la page de gestion des produits
      router.push(`/ma-selection/${newSelection.id}/produits`);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erreur lors de la création';
      toast.error(errorMessage);
    }
  };

  // Handler image (placeholder pour l'instant)
  const handleImageClick = () => {
    toast.info("L'upload d'image sera disponible prochainement");
  };

  // Chargement
  if (authLoading || affiliateLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-gray-50">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-linkme-turquoise/10 flex items-center justify-center mx-auto">
              <Loader2 className="h-8 w-8 text-linkme-turquoise animate-spin" />
            </div>
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
            Vous n&apos;avez pas les permissions pour créer une sélection.
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

  // Pas d'affilié
  if (!affiliate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 rounded-2xl bg-linkme-turquoise/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-8 w-8 text-linkme-turquoise" />
          </div>
          <h1 className="text-xl font-bold text-linkme-marine mb-2">
            Compte affilié non configuré
          </h1>
          <p className="text-linkme-marine/60 mb-6 text-sm">
            Votre compte n&apos;est pas encore configuré comme affilié LinkMe.
          </p>
          <Link
            href="/ma-selection"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-linkme-turquoise text-white rounded-xl font-medium hover:bg-linkme-turquoise/90 transition-all duration-200 shadow-md hover:shadow-lg text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50">
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header navigation */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/ma-selection"
            className="flex items-center gap-2 text-linkme-marine/60 hover:text-linkme-marine transition-colors text-sm group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform duration-200" />
            <span className="font-medium">Annuler</span>
          </Link>

          {/* Indicateur étapes */}
          <div className="flex items-center gap-2 text-xs text-linkme-marine/40">
            <span className="flex items-center gap-1 text-linkme-turquoise font-medium">
              <span className="w-5 h-5 rounded-full bg-linkme-turquoise text-white flex items-center justify-center text-xs">
                1
              </span>
              Créer
            </span>
            <span className="text-linkme-marine/20">→</span>
            <span className="flex items-center gap-1">
              <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-xs">
                2
              </span>
              Produits
            </span>
          </div>
        </div>

        {/* Titre avec icône */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-linkme-turquoise/10 rounded-2xl mb-4">
            <LayoutGrid className="h-8 w-8 text-linkme-turquoise" />
          </div>
          <h1 className="text-2xl font-bold text-linkme-marine">
            Nouvelle sélection
          </h1>
          <p className="text-linkme-marine/60 mt-2 text-sm max-w-sm mx-auto">
            Créez un mini-site personnalisé pour présenter vos produits à vos
            clients
          </p>
        </div>

        {/* Formulaire */}
        <form
          onSubmit={e => {
            void handleSubmit(e).catch(error => {
              console.error('[NewSelection] Submit failed:', error);
            });
          }}
          className="space-y-6"
        >
          {/* Card principale */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
            {/* Image de couverture */}
            <div>
              <label className="block text-sm font-semibold text-linkme-marine mb-2">
                Image de couverture
              </label>
              <button
                type="button"
                onClick={handleImageClick}
                className="w-full h-40 border-2 border-dashed border-linkme-turquoise/30 rounded-xl hover:border-linkme-turquoise transition-all duration-200 flex flex-col items-center justify-center gap-3 bg-linkme-turquoise/5 hover:bg-linkme-turquoise/10 group"
              >
                {imagePreview ? (
                  <Image
                    src={imagePreview}
                    alt="Aperçu"
                    fill
                    className="object-cover rounded-xl"
                  />
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-xl bg-linkme-turquoise/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                      <Camera className="h-6 w-6 text-linkme-turquoise" />
                    </div>
                    <div className="text-center">
                      <span className="text-sm text-linkme-marine/70 font-medium">
                        Cliquez pour ajouter une image
                      </span>
                      <span className="block text-xs text-linkme-marine/40 mt-1">
                        Format recommandé : 16:9
                      </span>
                    </div>
                  </>
                )}
              </button>
            </div>

            {/* Nom */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-semibold text-linkme-marine mb-2"
              >
                Nom de la sélection{' '}
                <span className="text-linkme-turquoise">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex: Collection Printemps 2026"
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-linkme-turquoise/30 focus:border-linkme-turquoise transition-all duration-200 placeholder:text-gray-400"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-semibold text-linkme-marine mb-2"
              >
                Description{' '}
                <span className="text-linkme-marine/40 font-normal">
                  (optionnelle)
                </span>
              </label>
              <textarea
                id="description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Décrivez votre sélection pour donner envie à vos clients..."
                rows={3}
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-linkme-turquoise/30 focus:border-linkme-turquoise transition-all duration-200 resize-none placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Visibilité - Card séparée */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <label className="block text-sm font-semibold text-linkme-marine mb-4">
              Visibilité initiale
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Option Brouillon */}
              <button
                type="button"
                onClick={() => setVisibility('draft')}
                className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                  visibility === 'draft'
                    ? 'border-linkme-marine bg-linkme-marine/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {visibility === 'draft' && (
                  <CheckCircle2 className="absolute top-3 right-3 h-5 w-5 text-linkme-marine" />
                )}
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center mb-3">
                  <Lock className="h-5 w-5 text-gray-600" />
                </div>
                <div className="font-semibold text-linkme-marine text-sm mb-1">
                  Brouillon
                </div>
                <p className="text-xs text-linkme-marine/50">
                  Non visible, modifiable
                </p>
              </button>

              {/* Option Publiée */}
              <button
                type="button"
                onClick={() => setVisibility('public')}
                className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                  visibility === 'public'
                    ? 'border-linkme-turquoise bg-linkme-turquoise/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {visibility === 'public' && (
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
          </div>

          {/* Bouton submit */}
          <button
            type="submit"
            disabled={createSelectionMutation.isPending || !name.trim()}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-linkme-turquoise text-white rounded-xl font-semibold hover:bg-linkme-turquoise/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
          >
            {createSelectionMutation.isPending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Création en cours...
              </>
            ) : (
              <>
                <Plus className="h-5 w-5" />
                Créer et ajouter des produits
              </>
            )}
          </button>

          {/* Info */}
          <p className="text-center text-xs text-linkme-marine/40">
            Étape suivante : ajoutez des produits depuis le catalogue LinkMe
          </p>
        </form>
      </div>
    </div>
  );
}
