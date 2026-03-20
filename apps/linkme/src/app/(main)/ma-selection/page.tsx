'use client';

/**
 * Page Liste des Sélections LinkMe - REFONTE 2026
 * Page de CONFIGURATION de mini-sites pour vendre
 *
 * Design minimaliste orienté configuration, PAS statistiques.
 * Les stats et Top produits existent déjà ailleurs.
 *
 * @module MaSelectionPage
 * @since 2026-01
 */

import { useState, useEffect } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  Star,
  Plus,
  Loader2,
  Package,
  Globe,
  Lock,
  ShoppingBag,
  Settings,
  Eye,
  Share2,
  Check,
  Sparkles,
  ArrowRight,
  Layers,
  MousePointerClick,
  Link2,
  Store,
} from 'lucide-react';

import { toast } from 'sonner';

import { PageTourTrigger } from '../../../components/onboarding/PageTourTrigger';
import { SelectionCatalogDialog } from '../../../components/selection/SelectionProductsSheet';
import { useAuth, type LinkMeRole } from '../../../contexts/AuthContext';
import {
  useUserAffiliate,
  useUserSelections,
  type UserSelection,
} from '../../../lib/hooks/use-user-selection';

// Rôles autorisés
const AUTHORIZED_ROLES: LinkMeRole[] = ['enseigne_admin', 'organisation_admin'];

export default function MaSelectionPage(): React.JSX.Element {
  const router = useRouter();
  const { user, linkMeRole, initializing: authLoading } = useAuth();
  const { data: affiliate, isLoading: affiliateLoading } = useUserAffiliate();
  const { data: selections, isLoading: selectionsLoading } =
    useUserSelections();

  // Smart redirect : si une seule sélection, aller directement dessus
  const [redirecting, setRedirecting] = useState(false);
  useEffect(() => {
    if (!selectionsLoading && selections?.length === 1) {
      const slug = selections[0].slug || selections[0].id;
      setRedirecting(true);
      router.replace(`/ma-selection/${slug}`);
    }
  }, [selectionsLoading, selections, router]);

  // Chargement (incluant le chargement du rôle) ou redirect en cours
  if (authLoading || affiliateLoading || selectionsLoading || redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 text-linkme-turquoise animate-spin mx-auto" />
          <p className="text-gray-600">Chargement de vos boutiques...</p>
        </div>
      </div>
    );
  }

  // Vérification accès - afficher message si non autorisé
  if (!user || !linkMeRole || !AUTHORIZED_ROLES.includes(linkMeRole.role)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <Lock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-linkme-marine mb-2">
            Accès non autorisé
          </h1>
          <p className="text-gray-600 mb-6">
            Vous n&apos;avez pas les permissions nécessaires pour accéder à
            cette page.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-linkme-turquoise text-white rounded-lg font-medium hover:bg-linkme-turquoise/90 transition-colors"
          >
            Retour au dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Pas encore d'affilié
  if (!affiliate) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <Star className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-linkme-marine mb-2">
            Compte affilié non configuré
          </h1>
          <p className="text-gray-600 mb-6">
            Votre compte n&apos;est pas encore configuré comme affilié LinkMe.
            Contactez votre administrateur pour activer cette fonctionnalité.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-linkme-turquoise text-white rounded-lg font-medium hover:bg-linkme-turquoise/90 transition-colors"
          >
            Retour au dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Calculs KPIs minimalistes
  const totalSelections = selections?.length ?? 0;
  const publishedCount = selections?.filter(s => !!s.published_at).length ?? 0;
  // Utiliser orders_count depuis les sélections déjà chargées (pas besoin d'analytics)
  // Note: orders_count = nb de commandes passées via cette sélection
  const totalQuantitySold = (selections ?? []).reduce(
    (sum, s) => sum + (s.orders_count ?? 0),
    0
  );

  // Afficher onboarding si peu de sélections
  const showOnboarding = totalSelections < 2;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageTourTrigger tourId="tour_selection" />
        {/* Header */}
        <div
          data-tour="selection-header"
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linkme-turquoise/10">
              <Layers className="h-6 w-6 text-linkme-turquoise" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-linkme-marine">
                Mes boutiques
              </h1>
              <p className="text-gray-500 text-sm">
                Gérez vos vitrines de vente personnalisées
              </p>
            </div>
          </div>

          <Link
            href="/ma-selection/nouvelle"
            data-tour="selection-create"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-linkme-turquoise text-white rounded-lg font-medium hover:bg-linkme-turquoise/90 transition-all shadow-lg shadow-linkme-turquoise/25 hover:shadow-xl hover:shadow-linkme-turquoise/30"
          >
            <Plus className="h-5 w-5" />
            Créer une boutique
          </Link>
        </div>

        {/* Onboarding - Zone explicative pour les nouveaux */}
        {showOnboarding && (
          <div className="bg-gradient-to-r from-linkme-turquoise/5 via-linkme-royal/5 to-linkme-mauve/5 border border-linkme-turquoise/20 rounded-2xl p-6 mb-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linkme-turquoise/10 flex-shrink-0">
                <Sparkles className="h-5 w-5 text-linkme-turquoise" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-linkme-marine mb-1">
                  Une boutique = un mini-site pour vendre
                </h2>
                <p className="text-gray-600 text-sm">
                  Créez des vitrines personnalisées pour partager vos produits
                  avec vos clients. Chaque boutique a son propre lien
                  partageable.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <OnboardingStep
                step={1}
                icon={<Plus className="h-4 w-4" />}
                title="Créer"
                description="Créer une boutique"
              />
              <OnboardingStep
                step={2}
                icon={<Package className="h-4 w-4" />}
                title="Ajouter"
                description="Vos produits"
              />
              <OnboardingStep
                step={3}
                icon={<MousePointerClick className="h-4 w-4" />}
                title="Personnaliser"
                description="Vos marges"
              />
              <OnboardingStep
                step={4}
                icon={<Link2 className="h-4 w-4" />}
                title="Partager"
                description="Le lien"
              />
            </div>
          </div>
        )}

        {/* KPIs Minimalistes - 2 seulement */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-linkme-turquoise/10">
                <Layers className="h-5 w-5 text-linkme-turquoise" />
              </div>
              <div>
                <div className="text-2xl font-bold text-linkme-marine">
                  {totalSelections}
                </div>
                <div className="text-sm text-gray-500">
                  Boutique{totalSelections > 1 ? 's' : ''}
                  {publishedCount > 0 && (
                    <span className="ml-2 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                      {publishedCount} en ligne
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-linkme-royal/10">
                <ShoppingBag className="h-5 w-5 text-linkme-royal" />
              </div>
              <div>
                <div className="text-2xl font-bold text-linkme-marine">
                  {totalQuantitySold}
                </div>
                <div className="text-sm text-gray-500">
                  Quantité{totalQuantitySold > 1 ? 's' : ''} vendue
                  {totalQuantitySold > 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Grille des sélections */}
        {selections && selections.length > 0 ? (
          <div
            data-tour="selection-list"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {selections.map(selection => (
              <SelectionCard key={selection.id} selection={selection} />
            ))}

            {/* Carte "+ Créer une boutique" */}
            <Link
              href="/ma-selection/nouvelle"
              className="group flex flex-col items-center justify-center p-8 border-2 border-dashed border-linkme-turquoise/30 rounded-2xl hover:border-linkme-turquoise hover:bg-linkme-turquoise/5 transition-all min-h-[280px]"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-linkme-turquoise/10 group-hover:bg-linkme-turquoise/20 transition-colors mb-4">
                <Plus className="h-7 w-7 text-linkme-turquoise" />
              </div>
              <span className="text-linkme-marine font-semibold group-hover:text-linkme-turquoise transition-colors">
                Créer une boutique
              </span>
              <span className="text-gray-500 text-sm mt-1">
                Créez une nouvelle boutique
              </span>
            </Link>
          </div>
        ) : (
          /* État vide */
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-linkme-turquoise/10 mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-linkme-turquoise" />
            </div>
            <h3 className="text-xl font-semibold text-linkme-marine mb-2">
              Créez votre première boutique
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Une boutique est une vitrine personnalisée que vous pouvez
              partager avec vos clients. Ajoutez vos produits et configurez vos
              marges.
            </p>
            <Link
              href="/ma-selection/nouvelle"
              className="inline-flex items-center gap-2 px-6 py-3 bg-linkme-turquoise text-white rounded-lg font-medium hover:bg-linkme-turquoise/90 transition-all shadow-lg shadow-linkme-turquoise/25"
            >
              <Plus className="h-5 w-5" />
              Créer ma première boutique
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Composant OnboardingStep
// ============================================================================

interface IOnboardingStepProps {
  step: number;
  icon: React.ReactNode;
  title: string;
  description: string;
}

function OnboardingStep({
  step,
  icon,
  title,
  description,
}: IOnboardingStepProps): React.JSX.Element {
  return (
    <div className="flex items-center gap-3 bg-white/60 rounded-xl p-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-linkme-turquoise text-white text-sm font-bold flex-shrink-0">
        {step}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 text-linkme-marine font-medium text-sm">
          {icon}
          {title}
        </div>
        <div className="text-xs text-gray-500 truncate">{description}</div>
      </div>
    </div>
  );
}

// ============================================================================
// Composant SelectionCard - Style catalogue avec hover effects
// ============================================================================

interface ISelectionCardProps {
  selection: UserSelection;
}

function SelectionCard({ selection }: ISelectionCardProps): React.JSX.Element {
  const [isHovered, setIsHovered] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);

  return (
    <div
      className="group relative bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image header avec zoom au hover */}
      <div className="relative h-40 overflow-hidden">
        {selection.image_url ? (
          <Image
            src={selection.image_url}
            alt={selection.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-linkme-turquoise/20 via-linkme-royal/10 to-linkme-mauve/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-700">
            <Layers className="h-12 w-12 text-linkme-turquoise/40" />
          </div>
        )}

        {/* Overlay gradient au hover */}
        <div
          className={`absolute inset-0 bg-gradient-to-t from-linkme-marine/80 via-linkme-marine/40 to-transparent transition-opacity duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Badge statut */}
        <div className="absolute top-3 right-3 z-10">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
              selection.published_at
                ? 'bg-green-500/90 text-white'
                : 'bg-gray-800/70 text-white'
            }`}
          >
            {selection.published_at ? (
              <>
                <Globe className="h-3 w-3" />
                En ligne
              </>
            ) : (
              <>
                <Lock className="h-3 w-3" />
                Non publiée
              </>
            )}
          </span>
        </div>

        {/* Pas de boutons sur le hover image — juste l'overlay gradient */}
      </div>

      {/* Contenu de la carte */}
      <div className="p-4">
        <h3 className="font-semibold text-linkme-marine text-lg mb-2 line-clamp-1 group-hover:text-linkme-turquoise transition-colors">
          {selection.name}
        </h3>

        {/* Stats + Configurer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <div className="flex items-center gap-1.5">
              <Package className="h-4 w-4" />
              <span>
                {selection.products_count} produit
                {selection.products_count > 1 ? 's' : ''}
              </span>
            </div>
            {selection.orders_count > 0 && (
              <div className="flex items-center gap-1.5 text-linkme-turquoise font-medium">
                <ShoppingBag className="h-4 w-4" />
                <span>
                  {selection.orders_count} vendu
                  {selection.orders_count > 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
          <Link
            href={`/ma-selection/${selection.slug}`}
            className="relative z-10 flex items-center gap-1 text-xs text-gray-500 hover:text-linkme-turquoise transition-colors"
          >
            <Settings className="h-3.5 w-3.5" />
            Gérer
          </Link>
        </div>

        {/* Lien "Voir les produits" - toujours visible */}
        <button
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            setIsCatalogOpen(true);
          }}
          className="relative z-10 mt-2 text-sm text-linkme-turquoise font-medium hover:text-linkme-turquoise/80 transition-colors flex items-center gap-1"
        >
          <Eye className="h-3.5 w-3.5" />
          Voir les produits
        </button>

        {/* Boutons Boutique + Partager - toujours visibles */}
        {selection.published_at && (
          <div className="relative z-10 flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
            <Link
              href={`/s/${selection.slug ?? selection.id}`}
              target="_blank"
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-linkme-turquoise/10 text-linkme-turquoise rounded-lg text-xs font-medium hover:bg-linkme-turquoise/20 transition-colors"
            >
              <Store className="h-3.5 w-3.5" />
              Voir ma boutique
            </Link>
            <button
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                void navigator.clipboard
                  .writeText(
                    `${window.location.origin}/s/${selection.slug ?? selection.id}`
                  )
                  .then(() => {
                    setLinkCopied(true);
                    toast.success('Lien copié !');
                    setTimeout(() => setLinkCopied(false), 2000);
                  })
                  .catch((err: unknown) => {
                    console.error('[SelectionCard] Copy failed:', err);
                    toast.error('Impossible de copier le lien');
                  });
              }}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors"
            >
              {linkCopied ? (
                <Check className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Share2 className="h-3.5 w-3.5" />
              )}
              {linkCopied ? 'Copié !' : 'Partager'}
            </button>
          </div>
        )}
      </div>

      {/* Lien invisible pour navigation vers config */}
      <Link
        href={`/ma-selection/${selection.slug}`}
        className="absolute inset-0 z-0"
        aria-label={`Configurer ${selection.name}`}
      />

      {/* Dialog catalogue produits */}
      <SelectionCatalogDialog
        selection={selection}
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
      />
    </div>
  );
}
