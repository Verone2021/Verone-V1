'use client';

/**
 * Page Organisations LinkMe
 *
 * Gestion des organisations de l'enseigne (CRUD complet)
 * Accessible uniquement pour les rôles enseigne_admin et organisation_admin
 *
 * @module OrganisationsPage
 * @since 2026-01-10
 */

import { useEffect, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  Building2,
  ArrowLeft,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  MapPin,
  Search,
  AlertCircle,
  CheckCircle,
  X,
} from 'lucide-react';

import { useAuth } from '../../../contexts/AuthContext';
import { useEnseigneOrganisations } from '../../../lib/hooks/use-enseigne-organisations';
import { useUserAffiliate } from '../../../lib/hooks/use-user-selection';

// Rôles autorisés à voir cette page
const ALLOWED_ROLES = ['enseigne_admin', 'organisation_admin'];

export default function OrganisationsPage(): JSX.Element | null {
  const router = useRouter();
  const { user, linkMeRole, loading, initializing } = useAuth();
  const { data: affiliate, isLoading: affiliateLoading } = useUserAffiliate();
  const {
    data: organisations,
    isLoading: orgsLoading,
    refetch,
  } = useEnseigneOrganisations(affiliate?.id ?? null);

  // États locaux
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingOrg, setEditingOrg] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Rediriger si non connecté
  useEffect(() => {
    if (!loading && !initializing && !user) {
      router.push('/login');
    }
  }, [user, loading, initializing, router]);

  // Rediriger si rôle non autorisé
  useEffect(() => {
    if (
      !loading &&
      !initializing &&
      linkMeRole &&
      !ALLOWED_ROLES.includes(linkMeRole.role)
    ) {
      router.push('/dashboard');
    }
  }, [linkMeRole, loading, initializing, router]);

  // Afficher loader pendant chargement
  if (loading || initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // Si pas d'utilisateur ou rôle non autorisé
  if (!user || (linkMeRole && !ALLOWED_ROLES.includes(linkMeRole.role))) {
    return null;
  }

  // Filtrer les organisations par recherche
  const filteredOrgs = organisations?.filter(org => {
    const searchLower = searchTerm.toLowerCase();
    return (
      org.legal_name.toLowerCase().includes(searchLower) ||
      org.trade_name?.toLowerCase().includes(searchLower) ||
      org.city?.toLowerCase().includes(searchLower)
    );
  });

  const isLoading = affiliateLoading || orgsLoading;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au dashboard
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Building2 className="h-7 w-7 text-blue-600" />
                Mes Organisations
              </h1>
              <p className="text-gray-500 mt-1">
                Gérez les organisations de votre enseigne{' '}
                {linkMeRole?.enseigne_name && (
                  <span className="font-medium text-gray-700">
                    ({linkMeRole.enseigne_name})
                  </span>
                )}
              </p>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Ajouter
            </button>
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une organisation..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Liste des organisations */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">
                Chargement des organisations...
              </span>
            </div>
          ) : !filteredOrgs || filteredOrgs.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm
                  ? 'Aucune organisation trouvée pour cette recherche'
                  : 'Aucune organisation pour le moment'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Ajouter votre première organisation
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredOrgs.map(org => (
                <div
                  key={org.id}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {org.trade_name || org.legal_name}
                      </h3>
                      {org.trade_name && org.trade_name !== org.legal_name && (
                        <p className="text-sm text-gray-500">
                          {org.legal_name}
                        </p>
                      )}
                      {org.city && (
                        <p className="text-sm text-gray-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3" />
                          {org.city}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingOrg(org.id)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Modifier"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(org.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Statistiques */}
        {organisations && organisations.length > 0 && (
          <div className="mt-6 text-sm text-gray-500 text-center">
            {organisations.length} organisation
            {organisations.length > 1 ? 's' : ''}{' '}
            {searchTerm && filteredOrgs && (
              <span>
                ({filteredOrgs.length} affichée
                {filteredOrgs.length > 1 ? 's' : ''})
              </span>
            )}
          </div>
        )}

        {/* Modal Ajout (placeholder) */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Nouvelle organisation</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="py-8 text-center text-gray-500">
                <AlertCircle className="h-12 w-12 text-amber-400 mx-auto mb-3" />
                <p>
                  Fonctionnalité en cours de développement.
                  <br />
                  Contactez votre administrateur pour ajouter une organisation.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        )}

        {/* Modal Suppression (placeholder) */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-4">
              <div className="text-center mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <h2 className="text-lg font-semibold">
                  Supprimer l'organisation ?
                </h2>
                <p className="text-sm text-gray-500 mt-2">
                  Cette action est irréversible.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    // TODO: Implémenter la suppression
                    setDeleteConfirm(null);
                  }}
                  className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
