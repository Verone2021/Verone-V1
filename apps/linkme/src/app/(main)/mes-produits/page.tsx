'use client';

/**
 * Page Mes Produits - LinkMe
 *
 * Liste les produits créés par l'enseigne de l'utilisateur
 * Affiche le statut d'approbation (draft, pending, approved, rejected)
 *
 * Design e-commerce 2026
 *
 * @module MesProduitsPage
 * @since 2025-12-20
 * @updated 2026-01
 */

import { Suspense, useEffect } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Disable static generation completely - force dynamic rendering
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import {
  Package,
  Loader2,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  FileEdit,
  AlertCircle,
} from 'lucide-react';

import { useAuth, type LinkMeRole } from '@/contexts/AuthContext';
import {
  useAffiliateProducts,
  type AffiliateProduct,
  type AffiliateProductApprovalStatus,
} from '@/lib/hooks/use-affiliate-products';
import { cn } from '@/lib/utils';

// Roles qui peuvent creer des produits
const CAN_CREATE_ROLES: LinkMeRole[] = ['enseigne_admin', 'org_independante'];

// Config statuts
const STATUS_CONFIG: Record<
  AffiliateProductApprovalStatus,
  { label: string; icon: React.ElementType; color: string; bgColor: string }
> = {
  draft: {
    label: 'Brouillon',
    icon: FileEdit,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
  },
  pending_approval: {
    label: 'En attente',
    icon: Clock,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
  approved: {
    label: 'Approuve',
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  rejected: {
    label: 'Rejete',
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
};

export default function MesProduitsPage(): JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 text-linkme-turquoise animate-spin mx-auto" />
            <p className="text-gray-500">Chargement de vos produits...</p>
          </div>
        </div>
      }
    >
      <MesProduitsContent />
    </Suspense>
  );
}

function MesProduitsContent(): JSX.Element | null {
  const router = useRouter();
  const { user, linkMeRole, loading: authLoading } = useAuth();
  const { data: products, isLoading } = useAffiliateProducts();

  const canCreate = linkMeRole && CAN_CREATE_ROLES.includes(linkMeRole.role);

  // Redirect if not authenticated - via useEffect to avoid "Cannot update component while rendering" error
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  // Early return while redirecting
  if (!authLoading && !user) {
    return null;
  }

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 text-linkme-turquoise animate-spin mx-auto" />
          <p className="text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  // Group products by status
  const productsByStatus = (products ?? []).reduce(
    (acc, product) => {
      const status = product.affiliate_approval_status;
      if (!acc[status]) acc[status] = [];
      acc[status].push(product);
      return acc;
    },
    {} as Record<AffiliateProductApprovalStatus, AffiliateProduct[]>
  );

  // Count by status
  const counts = {
    draft: productsByStatus.draft?.length || 0,
    pending_approval: productsByStatus.pending_approval?.length || 0,
    approved: productsByStatus.approved?.length || 0,
    rejected: productsByStatus.rejected?.length || 0,
    total: products?.length ?? 0,
  };

  return (
    <div className="min-h-screen bg-gray-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-linkme-marine">
              Mes Produits
            </h1>
            <p className="text-gray-500 mt-1">
              Gérez vos propres produits à vendre sur LinkMe
            </p>
          </div>
          {canCreate && (
            <Link
              href="/mes-produits/nouveau"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-linkme-turquoise text-white rounded-lg hover:bg-linkme-turquoise/90 transition-all shadow-sm font-medium"
            >
              <Plus className="h-5 w-5" />
              <span>Nouveau produit</span>
            </Link>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {(['draft', 'pending_approval', 'approved', 'rejected'] as const).map(
            status => {
              const config = STATUS_CONFIG[status];
              const Icon = config.icon;
              return (
                <div
                  key={status}
                  className={`${config.bgColor} rounded-xl p-4 border`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg bg-white/50 ${config.color}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{counts[status]}</p>
                      <p className={`text-sm ${config.color}`}>
                        {config.label}
                      </p>
                    </div>
                  </div>
                </div>
              );
            }
          )}
        </div>

        {/* Empty State */}
        {counts.total === 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-100">
            <div className="w-16 h-16 bg-linkme-turquoise/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 text-linkme-turquoise" />
            </div>
            <h2 className="text-xl font-semibold text-linkme-marine mb-2">
              Aucun produit
            </h2>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Vous n&apos;avez pas encore créé de produit. Créez votre premier
              produit et soumettez-le pour approbation.
            </p>
            {canCreate && (
              <Link
                href="/mes-produits/nouveau"
                className="inline-flex items-center gap-2 px-6 py-3 bg-linkme-turquoise text-white rounded-lg hover:bg-linkme-turquoise/90 transition-all shadow-sm font-medium"
              >
                <Plus className="h-5 w-5" />
                <span>Créer mon premier produit</span>
              </Link>
            )}
          </div>
        )}

        {/* Products List */}
        {counts.total > 0 && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                      Produit
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                      Prix vente HT
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                      Commission LinkMe
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                      <span className="text-green-600">Encaissement net</span>
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                      Statut
                    </th>
                    <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(products ?? []).map(product => (
                    <ProductRow key={product.id} product={product} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ProductRow({ product }: { product: AffiliateProduct }): JSX.Element {
  const config = STATUS_CONFIG[product.affiliate_approval_status];
  const Icon = config.icon;
  const canEdit = product.affiliate_approval_status === 'draft';
  const isRejected = product.affiliate_approval_status === 'rejected';

  // Calcul du prix de vente HT pour les produits AFFILIÉS
  // Le modèle est: l'affilié fixe son payout, Vérone AJOUTE sa commission
  // Formule correcte: prixVente = payout × (1 + commissionRate/100)
  const commissionRate = product.affiliate_commission_rate || 0;
  const payoutHt = product.affiliate_payout_ht || 0;
  const prixVenteHt = payoutHt * (1 + commissionRate / 100);
  const commissionMontant = payoutHt * (commissionRate / 100);

  return (
    <tr className="hover:bg-gray-50/50 transition-colors">
      <td className="px-6 py-4">
        <div>
          <p className="font-medium text-linkme-marine">{product.name}</p>
          <p className="text-sm text-gray-400 font-mono">{product.sku}</p>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="text-gray-700">{prixVenteHt.toFixed(2)} €</span>
      </td>
      <td className="px-6 py-4">
        <div>
          <span className="text-gray-600">{commissionRate}%</span>
          <p className="text-xs text-gray-400">
            ({commissionMontant.toFixed(2)} €)
          </p>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="font-semibold text-green-600">
          {payoutHt.toFixed(2)} €
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
              config.bgColor,
              config.color
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {config.label}
          </span>
          {isRejected && product.affiliate_rejection_reason && (
            <button
              className="text-red-600 hover:text-red-700"
              title={product.affiliate_rejection_reason}
            >
              <AlertCircle className="h-4 w-4" />
            </button>
          )}
        </div>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          {/* Voir - toujours disponible */}
          <Link
            href={`/mes-produits/${product.id}`}
            className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
          >
            Voir
          </Link>

          {/* Modifier - uniquement draft */}
          {canEdit && (
            <Link
              href={`/mes-produits/${product.id}?edit=true`}
              className="px-3 py-1.5 text-sm text-linkme-turquoise hover:bg-linkme-turquoise/10 rounded-lg transition-colors font-medium"
            >
              Modifier
            </Link>
          )}

          {/* Corriger - uniquement rejected */}
          {isRejected && (
            <Link
              href={`/mes-produits/${product.id}?edit=true`}
              className="px-3 py-1.5 text-sm text-amber-600 hover:bg-amber-50 rounded-lg transition-colors font-medium"
            >
              Corriger
            </Link>
          )}
        </div>
      </td>
    </tr>
  );
}
