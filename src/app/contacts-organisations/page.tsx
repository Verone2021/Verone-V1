'use client';

import React from 'react';

import { useRouter } from 'next/navigation';

import { Building2, Truck, Settings, Phone, TrendingUp } from 'lucide-react';

import { ButtonV2 } from '@/components/ui/button';
import { KPICardUnified } from '@/components/ui/kpi-card-unified';
import { useOrganisations } from '@/shared/modules/organisations/hooks';

interface OrganisationStats {
  totalOrganisations: number;
  suppliers: number;
  customersProfessional: number;
  partners: number;
}

export default function ContactsOrganisationsPage() {
  const router = useRouter();
  const { organisations, loading } = useOrganisations();

  // Calculer les statistiques des organisations uniquement (excluant les particuliers)
  const organisationsOnly = organisations.filter(
    o =>
      o.type !== 'customer' ||
      (o.type === 'customer' && o.customer_type !== 'individual')
  );

  const stats: OrganisationStats = {
    totalOrganisations: organisationsOnly.length,
    suppliers: organisations.filter(o => o.type === 'supplier').length,
    // Si customer_type n'existe pas, on considère tous les customers comme professionnels par défaut
    customersProfessional: organisations.filter(
      o =>
        o.type === 'customer' &&
        (!o.customer_type || o.customer_type === 'professional')
    ).length,
    partners: organisations.filter(o => o.type === 'partner').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Chargement des organisations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Compact */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Contacts & Organisations
            </h1>
            <p className="text-sm text-slate-600">
              Hub central pour la gestion de l'écosystème relationnel Vérone
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Zone 1: KPIs Design V2 */}
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-3">
            Vue d'ensemble
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICardUnified variant="elegant"
              title="Total Organisations"
              value={stats.totalOrganisations}
              icon={Building2}
            />

            <KPICardUnified variant="elegant"
              title="Fournisseurs"
              value={stats.suppliers}
              icon={Truck}
              onClick={() => router.push('/contacts-organisations/suppliers')}
            />

            <KPICardUnified variant="elegant"
              title="Clients Pro"
              value={stats.customersProfessional}
              icon={Building2}
              onClick={() =>
                router.push(
                  '/contacts-organisations/customers?type=professional'
                )
              }
            />

            <KPICardUnified variant="elegant"
              title="Prestataires"
              value={stats.partners}
              icon={Settings}
              onClick={() => router.push('/contacts-organisations/partners')}
            />
          </div>
        </div>

        {/* Zone 2: Modules Navigation */}
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Modules</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Fournisseurs */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-50">
                    <Truck className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Fournisseurs
                    </h3>
                    <p className="text-xs text-slate-600">
                      Gestion partenaires
                    </p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-slate-900">
                  {stats.suppliers}
                </span>
              </div>
              <ButtonV2
                variant="primary"
                size="sm"
                className="w-full"
                onClick={() => router.push('/contacts-organisations/suppliers')}
              >
                Gérer →
              </ButtonV2>
            </div>

            {/* Clients Professionnels */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-50">
                    <Building2 className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Clients Pro
                    </h3>
                    <p className="text-xs text-slate-600">Clients B2B</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-slate-900">
                  {stats.customersProfessional}
                </span>
              </div>
              <ButtonV2
                variant="success"
                size="sm"
                className="w-full"
                onClick={() =>
                  router.push(
                    '/contacts-organisations/customers?type=professional'
                  )
                }
              >
                Gérer →
              </ButtonV2>
            </div>

            {/* Prestataires */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-50">
                    <Settings className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Prestataires
                    </h3>
                    <p className="text-xs text-slate-600">Services</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-slate-900">
                  {stats.partners}
                </span>
              </div>
              <ButtonV2
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={() => router.push('/contacts-organisations/partners')}
              >
                Gérer →
              </ButtonV2>
            </div>
          </div>
        </div>

        {/* Zone 3: Contacts + Activité (grid 2 colonnes) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Widget Contacts */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-orange-600" />
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Contacts Professionnels
                  </h3>
                  <p className="text-xs text-slate-600">Annuaire centralisé</p>
                </div>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Gestion centralisée des contacts avec rôles spécialisés
              (Commercial, Technique, Facturation)
            </p>
            <ButtonV2
              variant="secondary"
              size="sm"
              className="w-full"
              onClick={() => router.push('/contacts-organisations/contacts')}
            >
              Accéder aux contacts →
            </ButtonV2>
          </div>

          {/* Widget Activité Récente */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-slate-700" />
              <h3 className="text-base font-semibold text-slate-900">
                Activité Récente
              </h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-slate-700">
                    Fournisseurs actifs
                  </span>
                </div>
                <span className="text-sm font-semibold text-slate-900">
                  {stats.suppliers}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-slate-700">Clients B2B</span>
                </div>
                <span className="text-sm font-semibold text-slate-900">
                  {stats.customersProfessional}
                </span>
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-purple-600" />
                  <span className="text-sm text-slate-700">Prestataires</span>
                </div>
                <span className="text-sm font-semibold text-slate-900">
                  {stats.partners}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
