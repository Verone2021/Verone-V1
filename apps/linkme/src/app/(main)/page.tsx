'use client';

/**
 * Page d'accueil LinkMe
 *
 * Présentation de la plateforme LinkMe:
 * - Hero avec CTA
 * - Section fonctionnalités/avantages
 * - Section partenaires (fournisseurs)
 *
 * @module HomePage
 * @since 2025-12-04
 */

import Image from 'next/image';
import Link from 'next/link';

import {
  Store,
  Package,
  TrendingUp,
  Users,
  ShoppingBag,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

import { useAuth, type LinkMeRole } from '../../contexts/AuthContext';
import { useVisibleSuppliers } from '../../lib/hooks/use-linkme-public';

// Rôles autorisés à voir le catalogue
const CATALOG_ROLES: LinkMeRole[] = [
  'enseigne_admin',
  'org_independante',
  'organisation_admin',
];

export default function HomePage() {
  const { user, linkMeRole } = useAuth();
  const { data: suppliers, isLoading: suppliersLoading } =
    useVisibleSuppliers();

  // Vérifier si l'utilisateur peut accéder au catalogue
  const canAccessCatalog =
    user && linkMeRole && CATALOG_ROLES.includes(linkMeRole.role);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-2xl md:text-3xl font-bold mb-4">
            LinkMe - Votre plateforme de vente partenaire
          </h1>
          <p className="text-base text-blue-100 max-w-2xl mx-auto mb-6">
            Mobilier et décoration d'intérieur haut de gamme. Créez vos
            sélections personnalisées et gagnez des commissions sur vos ventes.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {canAccessCatalog ? (
              <Link
                href="/catalogue"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                <Package className="h-5 w-5" />
                Découvrir le catalogue
              </Link>
            ) : user ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Accéder au dashboard
                <ArrowRight className="h-5 w-5" />
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Se connecter
                <ArrowRight className="h-5 w-5" />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Section Fonctionnalités */}
      <section className="py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              Comment ça fonctionne ?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              LinkMe vous permet de créer vos propres sélections de produits et
              de les partager avec vos clients. Gagnez des commissions sur
              chaque vente.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Étape 1 */}
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">
                1. Parcourez le catalogue
              </h3>
              <p className="text-gray-600">
                Découvrez notre large sélection de mobilier et décoration haut
                de gamme issus de nos partenaires.
              </p>
            </div>

            {/* Étape 2 */}
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <ShoppingBag className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">
                2. Créez votre sélection
              </h3>
              <p className="text-gray-600">
                Constituez votre propre sélection de produits adaptée aux goûts
                de vos clients et partagez-la.
              </p>
            </div>

            {/* Étape 3 */}
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">
                3. Gagnez des commissions
              </h3>
              <p className="text-gray-600">
                Pour chaque vente réalisée via votre sélection, recevez une
                commission attractive.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section Avantages */}
      <section className="py-10 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Texte */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Pourquoi rejoindre LinkMe ?
              </h2>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      Catalogue premium
                    </h4>
                    <p className="text-gray-600">
                      Accédez à une sélection de produits haut de gamme,
                      soigneusement choisis par nos équipes.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      Marges personnalisables
                    </h4>
                    <p className="text-gray-600">
                      Définissez vos propres prix de vente et optimisez vos
                      marges sur chaque produit.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      Suivi en temps réel
                    </h4>
                    <p className="text-gray-600">
                      Suivez vos ventes, commissions et performances depuis
                      votre tableau de bord.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      Support dédié
                    </h4>
                    <p className="text-gray-600">
                      Une équipe à votre écoute pour vous accompagner dans le
                      développement de votre activité.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Image/Stats */}
            <div className="bg-white rounded-lg shadow-lg p-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600 mx-auto mb-1.5" />
                  <p className="text-2xl font-bold text-gray-900">150+</p>
                  <p className="text-sm text-gray-600">Partenaires actifs</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <Package className="h-6 w-6 text-green-600 mx-auto mb-1.5" />
                  <p className="text-2xl font-bold text-gray-900">2000+</p>
                  <p className="text-xs text-gray-600">Produits disponibles</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <ShoppingBag className="h-6 w-6 text-purple-600 mx-auto mb-1.5" />
                  <p className="text-2xl font-bold text-gray-900">10k+</p>
                  <p className="text-xs text-gray-600">Ventes réalisées</p>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-orange-600 mx-auto mb-1.5" />
                  <p className="text-2xl font-bold text-gray-900">25%</p>
                  <p className="text-xs text-gray-600">Commission moyenne</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fournisseurs Partenaires */}
      <section className="py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-900">Nos partenaires</h2>
          </div>

          {suppliersLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div
                  key={i}
                  className="bg-gray-100 rounded-lg h-32 animate-pulse"
                />
              ))}
            </div>
          ) : suppliers && suppliers.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {suppliers.map(supplier => (
                <div
                  key={supplier.id}
                  className="bg-gray-50 rounded-lg p-3 text-center hover:shadow-md transition-shadow"
                >
                  {/* Logo */}
                  <div className="relative w-12 h-12 mx-auto mb-2 bg-white rounded-full overflow-hidden shadow-sm">
                    {supplier.logo_url ? (
                      <Image
                        src={supplier.logo_url}
                        alt={supplier.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Store className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-medium text-gray-900 text-sm truncate">
                    {supplier.name}
                  </h3>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Store className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun partenaire pour le moment</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-10 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-xl font-bold mb-3">
            Prêt à développer votre activité ?
          </h2>
          <p className="text-blue-100 mb-6">
            Rejoignez LinkMe et commencez à créer vos sélections personnalisées
            dès aujourd'hui.
          </p>

          {canAccessCatalog ? (
            <Link
              href="/catalogue"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors text-sm"
            >
              <Package className="h-4 w-4" />
              Accéder au catalogue
            </Link>
          ) : user ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors text-sm"
            >
              Voir mon dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors text-sm"
            >
              Commencer maintenant
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
