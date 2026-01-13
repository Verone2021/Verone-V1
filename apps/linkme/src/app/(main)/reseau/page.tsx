'use client';

/**
 * Page Réseau - Carte MapLibre avec Clustering
 *
 * Affiche le réseau d'établissements sur une carte interactive
 * avec zoom, clustering pour les zones denses, et KPIs simples.
 *
 * @module ReseauPage
 * @since 2026-01-12
 * @updated 2026-01-12 - Migration Leaflet → MapLibre GL
 * @updated 2026-01-12 - Ajout OrganisationDetailSheet
 */

import { useState } from 'react';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

import { Card } from '@tremor/react';
import { AlertCircle, Building2, MapPin, Store, Users } from 'lucide-react';

import { OrganisationDetailSheet } from '@/components/organisations';
import { useAuth } from '@/contexts/AuthContext';
import { useEnseigneOrganisations } from '@/lib/hooks/use-enseigne-organisations';
import { useUserAffiliate } from '@/lib/hooks/use-user-selection';

// Import dynamique pour éviter SSR (MapLibre nécessite window)
const MapLibreMapView = dynamic(
  () =>
    import('@/components/shared/MapLibreMapView').then(m => m.MapLibreMapView),
  {
    ssr: false,
    loading: () => (
      <div className="h-[600px] bg-gray-100 animate-pulse rounded-xl flex items-center justify-center">
        <div className="text-gray-400 flex flex-col items-center gap-2">
          <MapPin className="h-8 w-8 animate-bounce" />
          <span>Chargement de la carte...</span>
        </div>
      </div>
    ),
  }
);

// ============================================
// KPI CARD COMPONENT
// ============================================

interface KpiCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  percent?: number;
  color?: 'default' | 'turquoise' | 'orange';
}

function KpiCard({
  icon: Icon,
  label,
  value,
  percent,
  color = 'default',
}: KpiCardProps) {
  const bgColors = {
    default: 'bg-gray-100',
    turquoise: 'bg-[#5DBEBB]/10',
    orange: 'bg-orange-100',
  };

  const iconColors = {
    default: 'text-gray-600',
    turquoise: 'text-[#5DBEBB]',
    orange: 'text-orange-500',
  };

  return (
    <div className="bg-white rounded-xl border shadow-sm p-4 flex items-center gap-4">
      <div className={`p-3 rounded-full ${bgColors[color]}`}>
        <Icon className={`h-5 w-5 ${iconColors[color]}`} />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-[#183559]">
          {value}
          {percent !== undefined && (
            <span className="text-sm font-normal text-gray-400 ml-1">
              ({percent}%)
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function ReseauPage() {
  const router = useRouter();
  const { linkMeRole, loading: authLoading } = useAuth();
  const { data: affiliate, isLoading: affiliateLoading } = useUserAffiliate();

  // État pour le detail sheet
  const [detailSheetOrgId, setDetailSheetOrgId] = useState<string | null>(null);

  // Récupérer les organisations de l'enseigne avec coordonnées GPS
  const { data: organisations = [], isLoading: networkLoading } =
    useEnseigneOrganisations(affiliate?.id ?? null);

  // Vérifier si l'utilisateur est une enseigne
  const isEnseigne = linkMeRole?.role === 'enseigne_admin';

  // Calculer les KPIs (succursale = propre pour l'affichage)
  const total = organisations.length;
  const propres = organisations.filter(
    o => o.ownership_type === 'propre' || o.ownership_type === 'succursale'
  ).length;
  const franchises = organisations.filter(
    o => o.ownership_type === 'franchise'
  ).length;

  // Calculer les pourcentages
  const proprePercent = total > 0 ? Math.round((propres / total) * 100) : 0;
  const franchisePercent =
    total > 0 ? Math.round((franchises / total) * 100) : 0;

  // Loading state
  const isLoading = authLoading || affiliateLoading || networkLoading;

  // Redirection si pas enseigne (après chargement)
  if (!authLoading && !isEnseigne) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900">
              Accès réservé aux enseignes
            </h1>
            <p className="mt-2 text-gray-600">
              Cette page est réservée aux comptes de type enseigne qui gèrent un
              réseau d&apos;établissements.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="mt-6 px-6 py-2 bg-[#5DBEBB] text-white rounded-lg hover:bg-[#4DAEAB] transition-colors"
            >
              Retour au dashboard
            </button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-[#5DBEBB]/10 rounded-lg">
              <MapPin className="h-6 w-6 text-[#5DBEBB]" />
            </div>
            <h1 className="text-2xl font-bold text-[#183559]">Mon Réseau</h1>
          </div>
          <p className="text-gray-500">
            Visualisez vos établissements sur la carte
          </p>
        </div>

        {/* KPIs */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="bg-white rounded-xl border p-4 animate-pulse"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full" />
                  <div className="flex-1">
                    <div className="h-3 bg-gray-200 rounded w-16 mb-2" />
                    <div className="h-6 bg-gray-200 rounded w-12" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <KpiCard icon={Building2} label="Total" value={total} />
            <KpiCard
              icon={Store}
              label="Propres"
              value={propres}
              percent={proprePercent}
              color="turquoise"
            />
            <KpiCard
              icon={Users}
              label="Franchises"
              value={franchises}
              percent={franchisePercent}
              color="orange"
            />
          </div>
        )}

        {/* Carte MapLibre */}
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="h-[600px] bg-gray-100 animate-pulse flex items-center justify-center">
              <div className="text-gray-400 flex flex-col items-center gap-2">
                <MapPin className="h-8 w-8 animate-bounce" />
                <span>Chargement de la carte...</span>
              </div>
            </div>
          ) : (
            <MapLibreMapView
              organisations={organisations}
              height={600}
              onViewDetails={orgId => setDetailSheetOrgId(orgId)}
            />
          )}
        </div>

        {/* Légende */}
        <div className="mt-4 flex items-center justify-center gap-6 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-500" />
            <span>Propre</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-orange-500" />
            <span>Franchise</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#5DBEBB] text-white text-xs flex items-center justify-center font-semibold">
              42
            </div>
            <span>Cluster (cliquez pour zoomer)</span>
          </div>
        </div>
      </div>

      {/* Detail Sheet (mode view - lecture seule) */}
      <OrganisationDetailSheet
        organisationId={detailSheetOrgId}
        open={!!detailSheetOrgId}
        onOpenChange={open => !open && setDetailSheetOrgId(null)}
        mode="view"
      />
    </div>
  );
}
