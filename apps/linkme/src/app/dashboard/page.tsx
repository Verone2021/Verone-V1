'use client';

/**
 * Dashboard LinkMe - Page principale après connexion
 *
 * Affiche les informations de l'utilisateur connecté
 * et les statistiques selon son rôle (enseigne_admin, organisation_admin, client)
 *
 * @module DashboardPage
 * @since 2025-12-01
 */

import { useEffect } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  Building2,
  Store,
  TrendingUp,
  ShoppingBag,
  Users,
  Euro,
  Package,
  ArrowRight,
  Loader2,
} from 'lucide-react';

import { useAuth, type LinkMeRole } from '../../contexts/AuthContext';

// Labels des rôles
const ROLE_LABELS: Record<LinkMeRole, string> = {
  enseigne_admin: 'Administrateur Enseigne',
  organisation_admin: 'Administrateur Organisation',
  client: 'Client',
};

// Couleurs des badges par rôle
const ROLE_COLORS: Record<LinkMeRole, string> = {
  enseigne_admin: 'bg-purple-100 text-purple-700 border-purple-200',
  organisation_admin: 'bg-blue-100 text-blue-700 border-blue-200',
  client: 'bg-green-100 text-green-700 border-green-200',
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, linkMeRole, loading } = useAuth();

  // Rediriger si non connecté
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Afficher loader pendant chargement
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Si pas d'utilisateur (en cours de redirection)
  if (!user) {
    return null;
  }

  // Obtenir le nom d'affichage
  const displayName =
    user.user_metadata?.first_name && user.user_metadata?.last_name
      ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
      : user.email?.split('@')[0] || 'Utilisateur';

  // Obtenir l'entité associée
  const entityName =
    linkMeRole?.enseigne_name || linkMeRole?.organisation_name || null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Bienvenue, {displayName} !
          </h1>
          <p className="text-gray-600 mt-1">
            Voici un aperçu de votre espace LinkMe
          </p>
        </div>

        {/* Info Utilisateur */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-2xl">
                {displayName.charAt(0).toUpperCase()}
              </div>

              {/* Infos */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {displayName}
                </h2>
                <p className="text-gray-500">{user.email}</p>

                {/* Rôle */}
                {linkMeRole && (
                  <div className="mt-2 flex items-center gap-3">
                    <span
                      className={`text-sm px-3 py-1 rounded-full border ${ROLE_COLORS[linkMeRole.role]}`}
                    >
                      {ROLE_LABELS[linkMeRole.role]}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Entité */}
            {entityName && (
              <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg">
                {linkMeRole?.enseigne_id ? (
                  <Building2 className="h-5 w-5 text-purple-600" />
                ) : (
                  <Store className="h-5 w-5 text-blue-600" />
                )}
                <span className="font-medium text-gray-700">{entityName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Statistiques (selon le rôle) */}
        {(linkMeRole?.role === 'enseigne_admin' ||
          linkMeRole?.role === 'organisation_admin') && (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <KpiCard
                icon={<Euro className="h-6 w-6" />}
                label="Commissions du mois"
                value="--"
                subtext="En attente de données"
                color="green"
              />
              <KpiCard
                icon={<ShoppingBag className="h-6 w-6" />}
                label="Ventes totales"
                value="--"
                subtext="En attente de données"
                color="blue"
              />
              <KpiCard
                icon={<Package className="h-6 w-6" />}
                label="Commandes en cours"
                value="--"
                subtext="En attente de données"
                color="orange"
              />
              <KpiCard
                icon={<Users className="h-6 w-6" />}
                label="Clients référés"
                value="--"
                subtext="En attente de données"
                color="purple"
              />
            </div>

            {/* Actions rapides */}
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Actions rapides
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <QuickAction
                href="/commissions"
                icon={<TrendingUp className="h-6 w-6" />}
                title="Mes commissions"
                description="Suivez vos gains et l'historique de vos commissions"
                color="green"
              />
              <QuickAction
                href="/ventes"
                icon={<ShoppingBag className="h-6 w-6" />}
                title="Mes ventes"
                description="Consultez l'historique des ventes de vos clients"
                color="blue"
              />
              <QuickAction
                href="/profil"
                icon={<Users className="h-6 w-6" />}
                title="Mon profil"
                description="Gérez vos informations personnelles"
                color="gray"
              />
            </div>
          </>
        )}

        {/* Pour les clients */}
        {linkMeRole?.role === 'client' && (
          <>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Mes commandes
            </h3>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                Vous n&apos;avez pas encore de commandes
              </p>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 mt-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                Découvrir nos produits
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </>
        )}

        {/* Message si pas de rôle LinkMe */}
        {!linkMeRole && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
            <p className="text-yellow-800">
              Votre compte n&apos;a pas encore de rôle LinkMe configuré.
              <br />
              Contactez votre administrateur pour obtenir l&apos;accès aux
              fonctionnalités.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Composant KPI Card
interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext: string;
  color: 'green' | 'blue' | 'orange' | 'purple';
}

function KpiCard({ icon, label, value, subtext, color }: KpiCardProps) {
  const colorClasses = {
    green: 'bg-green-50 text-green-600',
    blue: 'bg-blue-50 text-blue-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>{icon}</div>
        <span className="text-sm font-medium text-gray-600">{label}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <p className="text-sm text-gray-500 mt-1">{subtext}</p>
    </div>
  );
}

// Composant Action Rapide
interface QuickActionProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  color: 'green' | 'blue' | 'gray';
}

function QuickAction({
  href,
  icon,
  title,
  description,
  color,
}: QuickActionProps) {
  const colorClasses = {
    green: 'bg-green-50 text-green-600 group-hover:bg-green-100',
    blue: 'bg-blue-50 text-blue-600 group-hover:bg-blue-100',
    gray: 'bg-gray-50 text-gray-600 group-hover:bg-gray-100',
  };

  return (
    <Link
      href={href}
      className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all"
    >
      <div className="flex items-start gap-4">
        <div
          className={`p-3 rounded-lg transition-colors ${colorClasses[color]}`}
        >
          {icon}
        </div>
        <div>
          <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
            {title}
          </h4>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        </div>
      </div>
    </Link>
  );
}
