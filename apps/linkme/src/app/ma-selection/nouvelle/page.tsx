'use client';

/**
 * Page Création Nouvelle Sélection
 * Formulaire complet avec tous les champs disponibles
 *
 * Fonctionnalités :
 * - Nom (obligatoire)
 * - Description (optionnelle)
 * - Image de couverture (optionnelle)
 * - Choix visibilité (brouillon/publiée)
 * - Redirection après création
 *
 * @module NewSelectionPage
 * @since 2025-12-10
 */

import { useState, useEffect } from 'react';

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
} from 'lucide-react';
import { toast } from 'sonner';

import { useAuth, type LinkMeRole } from '../../../contexts/AuthContext';
import {
  useUserAffiliate,
  useCreateSelection,
} from '../../../lib/hooks/use-user-selection';

// Rôles autorisés
const AUTHORIZED_ROLES: LinkMeRole[] = ['enseigne_admin', 'org_independante'];

export default function NewSelectionPage() {
  const router = useRouter();

  const { user, linkMeRole, loading: authLoading } = useAuth();
  const { data: affiliate, isLoading: affiliateLoading } = useUserAffiliate();

  const createSelectionMutation = useCreateSelection();

  // State formulaire
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'draft' | 'public'>('draft');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Vérifier les droits d'accès
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
        return;
      }

      if (!linkMeRole || !AUTHORIZED_ROLES.includes(linkMeRole.role)) {
        router.push('/dashboard');
        return;
      }
    }
  }, [user, linkMeRole, authLoading, router]);

  // Handler création
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Le nom est obligatoire');
      return;
    }

    try {
      const newSelection = await createSelectionMutation.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
      });

      toast.success('Sélection créée avec succès !');

      // Redirection vers la page de gestion des produits
      router.push(`/ma-selection/${newSelection.id}/produits`);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la création');
    }
  };

  // Handler image (placeholder pour l'instant)
  const handleImageClick = () => {
    toast.info("L'upload d'image sera disponible prochainement");
  };

  // Chargement
  if (authLoading || affiliateLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto" />
          <p className="text-gray-600 text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  // Vérification accès
  if (!user || !linkMeRole || !AUTHORIZED_ROLES.includes(linkMeRole.role)) {
    return null;
  }

  // Pas d'affilié
  if (!affiliate) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <Sparkles className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Compte affilié non configuré
          </h1>
          <p className="text-gray-600 mb-4 text-sm">
            Votre compte n'est pas encore configuré comme affilié LinkMe.
          </p>
          <Link
            href="/ma-selection"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header navigation */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/ma-selection"
            className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 transition-colors text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="font-medium">Annuler</span>
          </Link>
        </div>

        {/* Titre */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-100 rounded-lg mb-3">
            <Sparkles className="h-6 w-6 text-amber-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">
            Nouvelle sélection
          </h1>
          <p className="text-gray-600 mt-1 text-sm">
            Créez une sélection personnalisée de produits à partager
          </p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image de couverture */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Image de couverture
            </label>
            <button
              type="button"
              onClick={handleImageClick}
              className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors flex flex-col items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100"
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Aperçu"
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <>
                  <Camera className="h-6 w-6 text-gray-400" />
                  <span className="text-xs text-gray-500">
                    Cliquez pour ajouter une image
                  </span>
                  <span className="text-[10px] text-gray-400">
                    (Fonctionnalité à venir)
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Nom */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Nom de la sélection <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Ma sélection déco"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Description <span className="text-gray-400">(optionnelle)</span>
            </label>
            <textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Décrivez votre sélection en quelques mots..."
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>

          {/* Visibilité */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Visibilité
            </label>
            <div className="space-y-2">
              <label
                className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  visibility === 'draft'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="visibility"
                  value="draft"
                  checked={visibility === 'draft'}
                  onChange={() => setVisibility('draft')}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-gray-600" />
                    <span className="font-medium text-gray-900 text-sm">
                      Brouillon
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    La sélection n'est pas visible. Vous pourrez la publier plus
                    tard.
                  </p>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  visibility === 'public'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="visibility"
                  value="public"
                  checked={visibility === 'public'}
                  onChange={() => setVisibility('public')}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-green-600" />
                    <span className="font-medium text-gray-900 text-sm">
                      Publiée
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    La sélection sera visible sur votre page affilié dès sa
                    création.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Bouton submit */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={createSelectionMutation.isPending || !name.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {createSelectionMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Création en cours...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Créer et ajouter des produits
                </>
              )}
            </button>
          </div>

          {/* Info */}
          <p className="text-center text-xs text-gray-500">
            Après création, vous pourrez ajouter des produits depuis le
            catalogue.
          </p>
        </form>
      </div>
    </div>
  );
}
