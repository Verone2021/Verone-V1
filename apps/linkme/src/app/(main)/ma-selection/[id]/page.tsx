'use client';

/**
 * Page Détail Sélection
 * Affiche et permet d'éditer une sélection spécifique
 *
 * Fonctionnalités :
 * - Édition nom/description/image
 * - KPIs spécifiques à la sélection
 * - Top 3 produits vendus
 * - Actions : publier, prévisualiser, partager, supprimer
 *
 * @module SelectionDetailPage
 * @since 2025-12-10
 */

import { useState, useEffect } from 'react';

import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';

import {
  ArrowLeft,
  Loader2,
  Package,
  Globe,
  Lock,
  ExternalLink,
  Edit2,
  Trash2,
  Copy,
  Check,
  Camera,
  Eye,
  Share2,
  TrendingUp,
  ShoppingCart,
  DollarSign,
} from 'lucide-react';
import { toast } from 'sonner';

import { useAuth, type LinkMeRole } from '../../../../contexts/AuthContext';
import {
  useUserAffiliate,
  useUserSelections,
  useSelectionItems,
  useToggleSelectionPublished,
  type UserSelection,
} from '../../../../lib/hooks/use-user-selection';
import { formatCurrency } from '../../../../types/analytics';

// Rôles autorisés
const AUTHORIZED_ROLES: LinkMeRole[] = ['enseigne_admin', 'org_independante'];

export default function SelectionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const selectionId = params.id as string;

  const { user, linkMeRole, loading: authLoading } = useAuth();
  const { data: affiliate, isLoading: affiliateLoading } = useUserAffiliate();
  const { data: selections, isLoading: selectionsLoading } =
    useUserSelections();
  const { data: items, isLoading: itemsLoading } =
    useSelectionItems(selectionId);

  const togglePublishedMutation = useToggleSelectionPublished();

  // State
  const [linkCopied, setLinkCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Trouver la sélection actuelle
  const selection = selections?.find(s => s.id === selectionId);

  // Initialiser les champs d'édition
  useEffect(() => {
    if (selection) {
      setEditName(selection.name);
      setEditDescription(selection.description || '');
    }
  }, [selection]);

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

  // Handler toggle publié
  const handleTogglePublished = async () => {
    if (!selection) return;

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

  // Copier le lien public simplifie /s/[id]
  const handleCopyLink = () => {
    if (!selection) return;

    // Nouvelle URL publique simplifiee /s/[id]
    const shareUrl = `${window.location.origin}/s/${selection.id}`;
    navigator.clipboard.writeText(shareUrl);
    setLinkCopied(true);
    toast.success('Lien public copie !');

    setTimeout(() => setLinkCopied(false), 2000);
  };

  // Chargement
  if (authLoading || affiliateLoading || selectionsLoading) {
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

  // Sélection non trouvée
  if (!selection) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <Package className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Sélection introuvable
          </h1>
          <p className="text-gray-600 mb-4 text-sm">
            Cette sélection n'existe pas ou a été supprimée.
          </p>
          <Link
            href="/ma-selection"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux sélections
          </Link>
        </div>
      </div>
    );
  }

  // URL publique
  const publicUrl =
    selection.is_public && affiliate
      ? `${window.location.origin}/${affiliate.slug}/${selection.slug}`
      : null;

  // Top 3 produits (basé sur display_order pour l'instant)
  const topProducts = items?.slice(0, 3) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header navigation */}
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/ma-selection"
            className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 transition-colors text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="font-medium">Mes sélections</span>
          </Link>

          <button
            onClick={() => toast.info('Fonctionnalité à venir')}
            className="flex items-center gap-1.5 px-2 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">Supprimer</span>
          </button>
        </div>

        {/* Carte principale */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-4">
          {/* Image header */}
          <div className="relative h-32 bg-gradient-to-br from-amber-100 to-orange-100">
            {selection.image_url ? (
              <img
                src={selection.image_url}
                alt={selection.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <button
                  onClick={() => toast.info('Upload image à venir')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 backdrop-blur-sm rounded-lg text-gray-700 hover:bg-white transition-colors text-sm"
                >
                  <Camera className="h-4 w-4" />
                  <span className="font-medium">Ajouter une image</span>
                </button>
              </div>
            )}

            {/* Badge statut */}
            <div className="absolute top-2 right-2">
              <span
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  selection.is_public
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {selection.is_public ? (
                  <>
                    <Globe className="h-3 w-3" />
                    Publiée
                  </>
                ) : (
                  <>
                    <Lock className="h-3 w-3" />
                    Brouillon
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Infos sélection */}
          <div className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                {isEditing ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="text-lg font-bold text-gray-900 w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <h1 className="text-lg font-bold text-gray-900">
                    {selection.name}
                  </h1>
                )}

                {isEditing ? (
                  <textarea
                    value={editDescription}
                    onChange={e => setEditDescription(e.target.value)}
                    placeholder="Description (optionnelle)"
                    rows={2}
                    className="mt-1.5 w-full px-2 py-1 text-gray-600 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  selection.description && (
                    <p className="text-gray-600 mt-0.5 text-sm">
                      {selection.description}
                    </p>
                  )
                )}
              </div>

              <button
                onClick={() => setIsEditing(!isEditing)}
                className="ml-3 p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Edit2 className="h-4 w-4" />
              </button>
            </div>

            {/* Lien public */}
            {publicUrl && (
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-500 truncate flex-1">
                  {publicUrl}
                </span>
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  {linkCopied ? (
                    <>
                      <Check className="h-3 w-3" />
                      Copié
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      Copier
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-blue-600 mb-1">
              <Package className="h-4 w-4" />
            </div>
            <div className="text-lg font-bold text-gray-900">
              {selection.products_count}
            </div>
            <div className="text-xs text-gray-500">Produits</div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-emerald-600 mb-1">
              <DollarSign className="h-4 w-4" />
            </div>
            <div className="text-lg font-bold text-gray-900">
              {formatCurrency(selection.total_revenue)}
            </div>
            <div className="text-xs text-gray-500">CA HT</div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-purple-600 mb-1">
              <ShoppingCart className="h-4 w-4" />
            </div>
            <div className="text-lg font-bold text-gray-900">
              {selection.orders_count}
            </div>
            <div className="text-xs text-gray-500">Commandes</div>
          </div>
        </div>

        {/* Top 3 Produits */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-amber-500" />
              Top produits
            </h2>
            <Link
              href={`/ma-selection/${selectionId}/produits`}
              className="text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              Voir tous les produits
            </Link>
          </div>

          {itemsLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
            </div>
          ) : topProducts.length > 0 ? (
            <div className="space-y-2">
              {topProducts.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center justify-center w-6 h-6 bg-amber-100 text-amber-700 rounded-full font-bold text-xs">
                    {index + 1}
                  </div>
                  <div className="w-10 h-10 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                    {item.product_image_url ? (
                      <img
                        src={item.product_image_url}
                        alt={item.product_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate text-sm">
                      {item.product_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatCurrency(item.selling_price_ht)} HT
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Package className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">
                Aucun produit dans cette sélection
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Actions</h2>

          <div className="flex flex-wrap gap-2">
            {/* Publier/Dépublier */}
            <button
              onClick={handleTogglePublished}
              disabled={togglePublishedMutation.isPending}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors text-sm ${
                selection.is_public
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {togglePublishedMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : selection.is_public ? (
                <Lock className="h-3.5 w-3.5" />
              ) : (
                <Globe className="h-3.5 w-3.5" />
              )}
              {selection.is_public ? 'Dépublier' : 'Publier'}
            </button>

            {/* Prévisualiser */}
            {publicUrl && (
              <Link
                href={publicUrl}
                target="_blank"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
              >
                <Eye className="h-3.5 w-3.5" />
                Prévisualiser
              </Link>
            )}

            {/* Partager */}
            <button
              onClick={handleCopyLink}
              disabled={!selection.is_public}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <Share2 className="h-3.5 w-3.5" />
              Partager
            </button>

            {/* Gérer produits */}
            <Link
              href={`/ma-selection/${selectionId}/produits`}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg font-medium hover:bg-amber-200 transition-colors text-sm"
            >
              <Package className="h-3.5 w-3.5" />
              Gérer les produits
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
