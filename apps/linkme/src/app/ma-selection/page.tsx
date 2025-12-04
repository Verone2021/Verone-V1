'use client';

/**
 * Page Ma Sélection LinkMe
 *
 * Permet à l'utilisateur de:
 * - Voir ses sélections existantes
 * - Créer une nouvelle sélection
 * - Gérer les produits de ses sélections
 *
 * Accessible uniquement aux rôles: enseigne_admin, org_independante
 *
 * @module MaSelectionPage
 * @since 2025-12-04
 */

import { useState, useEffect } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  Star,
  Plus,
  Loader2,
  Package,
  Eye,
  Edit2,
  Trash2,
  ExternalLink,
  Globe,
  Lock,
  MoreHorizontal,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

import { useAuth, type LinkMeRole } from '../../contexts/AuthContext';
import {
  useUserAffiliate,
  useUserSelections,
  useSelectionItems,
  useCreateSelection,
  useRemoveFromSelection,
  useToggleSelectionPublished,
  type UserSelection,
  type SelectionItem,
} from '../../lib/hooks/use-user-selection';

// Rôles autorisés
const AUTHORIZED_ROLES: LinkMeRole[] = ['enseigne_admin', 'org_independante'];

export default function MaSelectionPage() {
  const router = useRouter();
  const { user, linkMeRole, loading: authLoading } = useAuth();
  const { data: affiliate, isLoading: affiliateLoading } = useUserAffiliate();
  const { data: selections, isLoading: selectionsLoading } =
    useUserSelections();

  // State
  const [selectedSelectionId, setSelectedSelectionId] = useState<string | null>(
    null
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Hooks mutation
  const createSelectionMutation = useCreateSelection();
  const togglePublishedMutation = useToggleSelectionPublished();

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

  // Sélectionner la première sélection par défaut
  useEffect(() => {
    if (selections && selections.length > 0 && !selectedSelectionId) {
      setSelectedSelectionId(selections[0].id);
    }
  }, [selections, selectedSelectionId]);

  // Handler création sélection
  const handleCreateSelection = async (name: string, description: string) => {
    try {
      const newSelection = await createSelectionMutation.mutateAsync({
        name,
        description,
      });
      toast.success('Sélection créée avec succès');
      setSelectedSelectionId(newSelection.id);
      setIsCreateModalOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la création');
    }
  };

  // Handler toggle publié
  const handleTogglePublished = async (selection: UserSelection) => {
    try {
      await togglePublishedMutation.mutateAsync({
        selectionId: selection.id,
        isPublic: !selection.is_public,
      });
      toast.success(
        selection.is_public ? 'Sélection dépubliée' : 'Sélection publiée'
      );
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la mise à jour');
    }
  };

  // Chargement
  if (authLoading || affiliateLoading || selectionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto" />
          <p className="text-gray-600">Chargement de vos sélections...</p>
        </div>
      </div>
    );
  }

  // Vérification accès
  if (!user || !linkMeRole || !AUTHORIZED_ROLES.includes(linkMeRole.role)) {
    return null;
  }

  // Pas encore d'affilié
  if (!affiliate) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <Star className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Compte affilié non configuré
          </h1>
          <p className="text-gray-600 mb-6">
            Votre compte n'est pas encore configuré comme affilié LinkMe.
            Contactez votre administrateur pour activer cette fonctionnalité.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Retour au dashboard
          </Link>
        </div>
      </div>
    );
  }

  const selectedSelection = selections?.find(s => s.id === selectedSelectionId);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100">
              <Star className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Mes sélections
              </h1>
              <p className="text-gray-600">
                Gérez vos sélections de produits personnalisées
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nouvelle sélection
          </button>
        </div>

        {/* Layout principal */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar sélections */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-4 border-b bg-gray-50">
                <h2 className="font-semibold text-gray-900">Mes sélections</h2>
                <p className="text-sm text-gray-500">
                  {selections?.length || 0} sélection(s)
                </p>
              </div>

              {selections && selections.length > 0 ? (
                <div className="divide-y">
                  {selections.map(selection => (
                    <button
                      key={selection.id}
                      onClick={() => setSelectedSelectionId(selection.id)}
                      className={`w-full p-4 text-left hover:bg-gray-50 transition-colors flex items-center justify-between ${
                        selectedSelectionId === selection.id
                          ? 'bg-blue-50 border-l-4 border-blue-600'
                          : ''
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 truncate">
                            {selection.name}
                          </p>
                          {selection.is_public ? (
                            <Globe className="h-3.5 w-3.5 text-green-500" />
                          ) : (
                            <Lock className="h-3.5 w-3.5 text-gray-400" />
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {selection.products_count} produit(s)
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500">
                  <Package className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">Aucune sélection</p>
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="mt-3 text-blue-600 text-sm font-medium hover:text-blue-700"
                  >
                    Créer ma première sélection
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Contenu principal */}
          <div className="lg:col-span-3">
            {selectedSelection ? (
              <SelectionDetail
                selection={selectedSelection}
                affiliate={affiliate}
                onTogglePublished={() =>
                  handleTogglePublished(selectedSelection)
                }
              />
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <Star className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Sélectionnez ou créez une sélection
                </h2>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  Choisissez une sélection dans la liste ou créez-en une
                  nouvelle pour commencer à ajouter des produits.
                </p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Créer une sélection
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal création */}
      {isCreateModalOpen && (
        <CreateSelectionModal
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateSelection}
          isLoading={createSelectionMutation.isPending}
        />
      )}
    </div>
  );
}

// ============================================================================
// Composants internes
// ============================================================================

interface SelectionDetailProps {
  selection: UserSelection;
  affiliate: any;
  onTogglePublished: () => void;
}

function SelectionDetail({
  selection,
  affiliate,
  onTogglePublished,
}: SelectionDetailProps) {
  const { data: items, isLoading } = useSelectionItems(selection.id);
  const removeItemMutation = useRemoveFromSelection();

  const handleRemoveItem = async (item: SelectionItem) => {
    if (!confirm('Retirer ce produit de la sélection ?')) return;

    try {
      await removeItemMutation.mutateAsync({
        itemId: item.id,
        selectionId: selection.id,
      });
      toast.success('Produit retiré');
    } catch (error: any) {
      toast.error(error.message || 'Erreur');
    }
  };

  // Lien public de la sélection
  const publicUrl = selection.is_public
    ? `/${affiliate.slug}/${selection.slug}`
    : null;

  return (
    <div className="space-y-6">
      {/* Header sélection */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {selection.name}
            </h2>
            {selection.description && (
              <p className="text-gray-600 mt-1">{selection.description}</p>
            )}
            <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
              <span>{selection.products_count} produits</span>
              <span>{selection.views_count} vues</span>
              <span>{selection.orders_count} commandes</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Bouton publier/dépublier */}
            <button
              onClick={onTogglePublished}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                selection.is_public
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {selection.is_public ? (
                <>
                  <Globe className="h-4 w-4" />
                  Publiée
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  Brouillon
                </>
              )}
            </button>

            {/* Lien public */}
            {publicUrl && (
              <Link
                href={publicUrl}
                target="_blank"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Voir en ligne
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Produits de la sélection
        </h3>
        <Link
          href="/catalogue"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Ajouter des produits
        </Link>
      </div>

      {/* Liste produits */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto" />
        </div>
      ) : items && items.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="divide-y">
            {items.map(item => (
              <div
                key={item.id}
                className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
              >
                {/* Image */}
                <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  {item.product_image_url ? (
                    <img
                      src={item.product_image_url}
                      alt={item.product_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-8 w-8 text-gray-300" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 truncate">
                    {item.product_name}
                  </h4>
                  <p className="text-sm text-gray-500 font-mono">
                    {item.product_reference}
                  </p>
                </div>

                {/* Prix */}
                <div className="text-right">
                  <p className="font-bold text-gray-900">
                    {item.selling_price_ht.toFixed(2)} € HT
                  </p>
                  <p className="text-sm text-gray-500">
                    Marge: {item.margin_rate}%
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRemoveItem(item)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Retirer de la sélection"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Aucun produit dans cette sélection
          </h3>
          <p className="text-gray-500 mb-6">
            Ajoutez des produits depuis le catalogue pour commencer à constituer
            votre sélection.
          </p>
          <Link
            href="/catalogue"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Parcourir le catalogue
          </Link>
        </div>
      )}
    </div>
  );
}

interface CreateSelectionModalProps {
  onClose: () => void;
  onSubmit: (name: string, description: string) => void;
  isLoading: boolean;
}

function CreateSelectionModal({
  onClose,
  onSubmit,
  isLoading,
}: CreateSelectionModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim(), description.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            Créer une nouvelle sélection
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Nom de la sélection *
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ma sélection déco"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description (optionnelle)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Une description de votre sélection..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isLoading}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Créer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
