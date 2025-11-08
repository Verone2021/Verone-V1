'use client';

import { useState } from 'react';

import Link from 'next/link';
import { useParams } from 'next/navigation';

import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Card, CardContent } from '@verone/ui';
import { TabsNavigation, TabContent } from '@verone/ui';
import {
  ArrowLeft,
  Building2,
  Archive,
  ArchiveRestore,
  Phone,
  FileText,
} from 'lucide-react';

import { isModuleDeployed, getModulePhase } from '@/lib/deployed-modules';
import { AddressEditSection } from '@verone/common';
import { ContactEditSection } from '@verone/customers';
import { ContactsManagementSection } from '@verone/customers';
import { OrganisationLogoCard } from '@verone/organisations';
import { OrganisationStatsCard } from '@verone/organisations';
import { CommercialEditSection } from '@verone/organisations';
import { LegalIdentityEditSection } from '@verone/organisations';
import {
  useOrganisation,
  useOrganisations,
  getOrganisationDisplayName,
} from '@verone/organisations';
import { useOrganisationTabCounts } from '@verone/organisations';
import type { Organisation } from '@verone/organisations';

export default function PartnerDetailPage() {
  const { partnerId } = useParams();
  const [activeTab, setActiveTab] = useState('contacts');

  const {
    organisation: partner,
    loading,
    error,
  } = useOrganisation(partnerId as string);
  const { archiveOrganisation, unarchiveOrganisation, refetch } =
    useOrganisations({ type: 'partner' });

  // Hook centralisé pour les compteurs d'onglets
  const { counts, refreshCounts } = useOrganisationTabCounts({
    organisationId: partnerId as string,
    organisationType: 'provider',
  });

  // Gestionnaire de mise à jour des données partenaire
  const handlePartnerUpdate = (updatedData: Partial<Organisation>) => {
    // Les données sont automatiquement mises à jour par le hook useInlineEdit
    refetch();
    // Rafraîchir les compteurs
    refreshCounts();
  };

  // Configuration des onglets avec compteurs du hook + modules déployés
  const tabs = [
    {
      id: 'contacts',
      label: 'Contacts',
      icon: <Phone className="h-4 w-4" />,
      badge: counts.contacts.toString(),
      disabled: !isModuleDeployed('contacts'),
    },
    {
      id: 'invoices',
      label: 'Factures',
      icon: <FileText className="h-4 w-4" />,
      disabled: !isModuleDeployed('invoices'),
      disabledBadge: getModulePhase('invoices'),
    },
  ];

  if (loading) {
    return (
      <div className="container mx-auto p-4 space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-8" />
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded" />
            <div className="h-32 bg-gray-200 rounded" />
            <div className="h-32 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !partner) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="p-8 text-center">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-black mb-2">
              Partenaire introuvable
            </h3>
            <p className="text-gray-600 mb-4">
              Ce partenaire n'existe pas ou vous n'avez pas les droits pour le
              consulter.
            </p>
            <ButtonV2 asChild>
              <Link href="/contacts-organisations/partners">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour aux partenaires
              </Link>
            </ButtonV2>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleArchive = async () => {
    if (!partner.archived_at) {
      // Archiver
      const success = await archiveOrganisation(partner.id);
      if (success) {
        console.log('✅ Partenaire archivé avec succès');
        refetch();
      }
    } else {
      // Restaurer
      const success = await unarchiveOrganisation(partner.id);
      if (success) {
        console.log('✅ Partenaire restauré avec succès');
        refetch();
      }
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/contacts-organisations/partners">
              <ButtonV2 variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Partenaires
              </ButtonV2>
            </Link>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="h-5 w-5 text-black" />
            <h1 className="text-lg font-semibold text-black">
              {getOrganisationDisplayName(partner)}
            </h1>
            <div className="flex gap-2">
              <Badge
                variant={partner.is_active ? 'secondary' : 'secondary'}
                className={
                  partner.is_active ? 'bg-green-100 text-green-800' : ''
                }
              >
                {partner.is_active ? 'Actif' : 'Inactif'}
              </Badge>
              {partner.archived_at && (
                <Badge
                  variant="destructive"
                  className="bg-red-100 text-red-800"
                >
                  Archivé
                </Badge>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Partenaire • ID: {partner.id.slice(0, 8)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <ButtonV2
            variant="outline"
            onClick={handleArchive}
            className={
              partner.archived_at
                ? 'text-blue-600 border-blue-200 hover:bg-blue-50'
                : 'text-black border-gray-200 hover:bg-gray-50'
            }
          >
            {partner.archived_at ? (
              <>
                <ArchiveRestore className="h-4 w-4 mr-2" />
                Restaurer
              </>
            ) : (
              <>
                <Archive className="h-4 w-4 mr-2" />
                Archiver
              </>
            )}
          </ButtonV2>
        </div>
      </div>

      {/* Layout en 2 colonnes avec composants EditSection */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Colonne principale - Informations éditables */}
        <div className="xl:col-span-2 space-y-4">
          {/* Identité Légale */}
          <LegalIdentityEditSection
            organisation={partner}
            onUpdate={handlePartnerUpdate}
          />

          {/* Informations de Contact */}
          <ContactEditSection
            organisation={partner}
            onUpdate={handlePartnerUpdate}
          />

          {/* Adresse */}
          <AddressEditSection
            organisation={partner}
            onUpdate={handlePartnerUpdate}
          />

          {/* Conditions Commerciales */}
          <CommercialEditSection
            organisation={partner}
            onUpdate={handlePartnerUpdate}
          />
        </div>

        {/* Colonne latérale - Logo et Statistiques */}
        <div className="space-y-4">
          {/* Logo de l'organisation - Composant réutilisable */}
          <OrganisationLogoCard
            organisationId={partner.id}
            organisationName={partner.legal_name}
            organisationType="provider"
            currentLogoUrl={partner.logo_url}
            onUploadSuccess={() => refetch()}
          />

          {/* Statistiques - Composant réutilisable */}
          <OrganisationStatsCard
            organisation={partner}
            organisationType="provider"
          />
        </div>
      </div>

      {/* Section avec onglets - Modules business */}
      <div className="mt-8">
        <TabsNavigation
          tabs={tabs}
          defaultTab="contacts"
          onTabChange={setActiveTab}
        />

        <TabContent activeTab={activeTab} tabId="contacts">
          <ContactsManagementSection
            organisationId={partner.id}
            organisationName={getOrganisationDisplayName(partner)}
            organisationType="supplier"
            onUpdate={() => handlePartnerUpdate({})}
          />
        </TabContent>

        <TabContent activeTab={activeTab} tabId="invoices">
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-black mb-2">
              Module Factures
            </h3>
            <p className="text-gray-600">
              Ce module sera disponible dans une prochaine version.
            </p>
          </div>
        </TabContent>
      </div>
    </div>
  );
}
