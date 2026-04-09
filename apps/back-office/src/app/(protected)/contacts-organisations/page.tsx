'use client';

import { useState } from 'react';

import Link from 'next/link';

import {
  useOrganisations,
  GenericOrganisationFormModal,
  NewContactModal,
} from '@verone/organisations';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Phone,
  Plus,
  Settings,
  Store,
  Truck,
  Users,
} from 'lucide-react';

export default function ContactsOrganisationsPage() {
  const { organisations, loading } = useOrganisations();
  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400" />
        <span className="ml-2 text-sm text-gray-500">Chargement...</span>
      </div>
    );
  }

  // Stats
  const suppliers = organisations.filter(
    o => o.type === 'supplier' && !o.is_service_provider
  );
  const customersPro = organisations.filter(
    o =>
      o.type === 'customer' &&
      (!o.customer_type || o.customer_type === 'professional')
  );
  const prestataires = organisations.filter(
    o => o.type === 'supplier' && o.is_service_provider === true
  );
  const orgsWithoutSiret = organisations.filter(
    o => !o.siret && o.type !== 'internal'
  );
  const orgsWithoutEmail = organisations.filter(
    o => !o.email && o.type !== 'internal'
  );

  // Alertes "A traiter"
  const totalAlerts =
    (orgsWithoutSiret.length > 0 ? 1 : 0) +
    (orgsWithoutEmail.length > 0 ? 1 : 0) +
    (prestataires.length === 0 ? 0 : 0);

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Header + Navigation rapide */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Contacts & Organisations
            </h1>
            <div className="flex items-center gap-3 mt-1 text-xs">
              <Link
                href="/contacts-organisations/suppliers"
                className="text-gray-500 hover:text-gray-900"
              >
                Fournisseurs
              </Link>
              <span className="text-gray-300">|</span>
              <Link
                href="/contacts-organisations/customers?type=professional"
                className="text-gray-500 hover:text-gray-900"
              >
                Clients Pro
              </Link>
              <span className="text-gray-300">|</span>
              <Link
                href="/contacts-organisations/clients-particuliers"
                className="text-gray-500 hover:text-gray-900"
              >
                Clients Particuliers
              </Link>
              <span className="text-gray-300">|</span>
              <Link
                href="/contacts-organisations/contacts"
                className="text-gray-500 hover:text-gray-900"
              >
                Contacts
              </Link>
              <span className="text-gray-300">|</span>
              <Link
                href="/contacts-organisations/enseignes"
                className="text-gray-500 hover:text-gray-900"
              >
                Enseignes
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsOrgModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800"
            >
              <Plus className="h-3.5 w-3.5" />
              Organisation
            </button>
            <button
              onClick={() => setIsContactModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-gray-700 text-xs font-medium rounded-lg border border-gray-300 hover:bg-gray-50"
            >
              <Plus className="h-3.5 w-3.5" />
              Contact
            </button>
          </div>
        </div>

        {/* Alertes - A traiter */}
        {totalAlerts > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
              <span className="text-xs font-semibold text-amber-900">
                A traiter ({orgsWithoutSiret.length + orgsWithoutEmail.length})
              </span>
            </div>
            <div className="divide-y divide-gray-100">
              {orgsWithoutSiret.length > 0 && (
                <Link
                  href="/contacts-organisations/suppliers"
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                    <span className="text-sm text-gray-900">
                      <strong>{orgsWithoutSiret.length}</strong> organisation(s)
                      sans SIRET
                    </span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                </Link>
              )}
              {orgsWithoutEmail.length > 0 && (
                <Link
                  href="/contacts-organisations/customers?type=professional"
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span className="text-sm text-gray-900">
                      <strong>{orgsWithoutEmail.length}</strong> organisation(s)
                      sans email
                    </span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                </Link>
              )}
            </div>
          </div>
        )}

        {/* KPIs compacts */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="bg-white rounded-lg border border-gray-200 px-4 py-3">
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              Total
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {organisations.length}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 px-4 py-3">
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              Fournisseurs
            </p>
            <p className="text-2xl font-bold text-blue-600">
              {suppliers.length}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 px-4 py-3">
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              Clients Pro
            </p>
            <p className="text-2xl font-bold text-green-600">
              {customersPro.length}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 px-4 py-3">
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              Prestataires
            </p>
            <p className="text-2xl font-bold text-purple-600">
              {prestataires.length}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 px-4 py-3">
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              Enseignes
            </p>
            <p className="text-2xl font-bold text-orange-600">2</p>
          </div>
        </div>

        {/* Grille 2x2 modules */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Fournisseurs */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-blue-600" />
                <h2 className="text-base font-semibold text-gray-900">
                  Fournisseurs
                </h2>
              </div>
              <Link
                href="/contacts-organisations/suppliers"
                className="text-xs text-gray-500 hover:text-gray-900"
              >
                Voir tout →
              </Link>
            </div>
            <div className="space-y-2">
              <Link
                href="/contacts-organisations/suppliers"
                className="flex items-center justify-between py-1.5 text-sm text-gray-700 hover:text-gray-900"
              >
                <span>{suppliers.length} fournisseurs actifs</span>
                <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
              </Link>
              <Link
                href="/commandes/fournisseurs"
                className="flex items-center justify-between py-1.5 text-sm text-gray-700 hover:text-gray-900"
              >
                <span>Commandes fournisseurs</span>
                <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
              </Link>
            </div>
          </div>

          {/* Clients Pro */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-green-600" />
                <h2 className="text-base font-semibold text-gray-900">
                  Clients Professionnels
                </h2>
              </div>
              <Link
                href="/contacts-organisations/customers?type=professional"
                className="text-xs text-gray-500 hover:text-gray-900"
              >
                Voir tout →
              </Link>
            </div>
            <div className="space-y-2">
              <Link
                href="/contacts-organisations/customers?type=professional"
                className="flex items-center justify-between py-1.5 text-sm text-gray-700 hover:text-gray-900"
              >
                <span>{customersPro.length} clients B2B</span>
                <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
              </Link>
              <Link
                href="/commandes/clients"
                className="flex items-center justify-between py-1.5 text-sm text-gray-700 hover:text-gray-900"
              >
                <span>Commandes clients</span>
                <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
              </Link>
            </div>
          </div>

          {/* Contacts */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-orange-600" />
                <h2 className="text-base font-semibold text-gray-900">
                  Contacts
                </h2>
              </div>
              <Link
                href="/contacts-organisations/contacts"
                className="text-xs text-gray-500 hover:text-gray-900"
              >
                Voir tout →
              </Link>
            </div>
            <div className="space-y-2">
              <Link
                href="/contacts-organisations/contacts"
                className="flex items-center justify-between py-1.5 text-sm text-gray-700 hover:text-gray-900"
              >
                <span>Annuaire contacts organisations</span>
                <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
              </Link>
              <Link
                href="/contacts-organisations/clients-particuliers"
                className="flex items-center justify-between py-1.5 text-sm text-gray-700 hover:text-gray-900"
              >
                <span>
                  <Users className="h-3.5 w-3.5 inline mr-1" />
                  Clients particuliers (B2C)
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
              </Link>
            </div>
          </div>

          {/* Enseignes + Prestataires */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Store className="h-5 w-5 text-purple-600" />
                <h2 className="text-base font-semibold text-gray-900">
                  Enseignes & Prestataires
                </h2>
              </div>
            </div>
            <div className="space-y-2">
              <Link
                href="/contacts-organisations/enseignes"
                className="flex items-center justify-between py-1.5 text-sm text-gray-700 hover:text-gray-900"
              >
                <span>2 enseignes (chaines LinkMe)</span>
                <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
              </Link>
              <Link
                href="/contacts-organisations/partners"
                className="flex items-center justify-between py-1.5 text-sm text-gray-700 hover:text-gray-900"
              >
                <span>
                  <Settings className="h-3.5 w-3.5 inline mr-1" />
                  {prestataires.length} prestataires
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <GenericOrganisationFormModal
        isOpen={isOrgModalOpen}
        onClose={() => setIsOrgModalOpen(false)}
      />

      <NewContactModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
      />
    </div>
  );
}
