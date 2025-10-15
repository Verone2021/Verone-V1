'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ButtonV2 } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  UserCheck,
  Building,
  Calendar,
  ArrowRight,
  Search,
  Filter,
  Plus,
  Phone,
  Mail,
  MapPin,
  Archive,
  Trash2,
  ArchiveRestore,
  ArrowLeft,
  Award,
  ExternalLink,
  Building2
} from 'lucide-react'
import Link from 'next/link'
import { useOrganisations } from '@/hooks/use-organisations'
import { PartnerFormModal } from '@/components/business/partner-form-modal'
import { OrganisationLogo } from '@/components/business/organisation-logo'
import { spacing, colors } from '@/lib/design-system'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

export default function PartnersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active')
  const [archivedPartners, setArchivedPartners] = useState<any[]>([])
  const [archivedLoading, setArchivedLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPartner, setSelectedPartner] = useState<any>(null)

  // Utiliser useMemo pour stabiliser l'objet filters et éviter la boucle infinie
  const filters = useMemo(() => ({
    type: 'partner' as const,
    is_active: true,
    search: searchQuery || undefined
  }), [searchQuery])

  const {
    organisations: partners,
    loading,
    error,
    toggleOrganisationStatus,
    archiveOrganisation,
    unarchiveOrganisation,
    hardDeleteOrganisation,
    refetch
  } = useOrganisations(filters)

  const handleArchive = async (partner: any) => {
    if (!partner.archived_at) {
      // Archiver
      const success = await archiveOrganisation(partner.id)
      if (success) {
        refetch()
        if (activeTab === 'archived') {
          await loadArchivedPartnersData()
        }
      }
    } else {
      // Restaurer
      const success = await unarchiveOrganisation(partner.id)
      if (success) {
        refetch()
        await loadArchivedPartnersData()
      }
    }
  }

  const handleDelete = async (partner: any) => {
    const confirmed = confirm(
      `Êtes-vous sûr de vouloir supprimer définitivement "${partner.name}" ?\n\nCette action est irréversible !`
    )

    if (confirmed) {
      const success = await hardDeleteOrganisation(partner.id)
      if (success) {
        await loadArchivedPartnersData()
      }
    }
  }

  const handleCreatePartner = () => {
    setSelectedPartner(null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedPartner(null)
  }

  const handlePartnerSuccess = () => {
    refetch()
    handleCloseModal()
  }

  const loadArchivedPartnersData = async () => {
    setArchivedLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('organisations')
        .select('*')
        .eq('type', 'partner')
        .not('archived_at', 'is', null)
        .order('archived_at', { ascending: false })

      if (error) throw error
      setArchivedPartners((data || []) as any[])
    } catch (err) {
      console.error('Erreur chargement partenaires archivés:', err)
    } finally {
      setArchivedLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'archived') {
      loadArchivedPartnersData()
    }
  }, [activeTab])

  const displayedPartners = activeTab === 'active' ? partners : archivedPartners
  const isLoading = activeTab === 'active' ? loading : archivedLoading

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start" style={{ marginBottom: spacing[6] }}>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/contacts-organisations">
              <ButtonV2 variant="ghost" size="sm" icon={ArrowLeft}>
                Organisations
              </ButtonV2>
            </Link>
          </div>
          <h1 className="text-3xl font-semibold" style={{ color: colors.text.DEFAULT }}>
            Partenaires
          </h1>
          <p className="mt-2" style={{ color: colors.text.subtle }}>
            Gestion du réseau de partenaires et distributeurs commerciaux
          </p>
        </div>
        <ButtonV2
          variant="primary"
          onClick={handleCreatePartner}
          icon={Plus}
        >
          Nouveau Partenaire
        </ButtonV2>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent style={{ padding: spacing[4] }}>
            <div className="text-2xl font-bold" style={{ color: colors.text.DEFAULT }}>
              {partners.length}
            </div>
            <p className="text-sm" style={{ color: colors.text.subtle }}>
              Total partenaires
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent style={{ padding: spacing[4] }}>
            <div className="text-2xl font-bold" style={{ color: colors.success[500] }}>
              {partners.filter(p => p.is_active).length}
            </div>
            <p className="text-sm" style={{ color: colors.text.subtle }}>
              Actifs
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent style={{ padding: spacing[4] }}>
            <div className="text-2xl font-bold" style={{ color: colors.accent[500] }}>
              {partners.filter(p => p.email || p.phone).length}
            </div>
            <p className="text-sm" style={{ color: colors.text.subtle }}>
              Avec contact
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent style={{ padding: spacing[4] }}>
            <div className="text-2xl font-bold" style={{ color: colors.primary[500] }}>
              {partners.filter(p => p.country).length}
            </div>
            <p className="text-sm" style={{ color: colors.text.subtle }}>
              Internationaux
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent style={{ padding: spacing[4] }}>
            <div className="text-2xl font-bold" style={{ color: colors.text.DEFAULT }}>
              {archivedPartners.length}
            </div>
            <p className="text-sm" style={{ color: colors.text.subtle }}>
              Archivés
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Actifs/Archivés */}
      <div className="flex items-center gap-2" style={{ marginBottom: spacing[4] }}>
        <button
          onClick={() => setActiveTab('active')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-all',
            activeTab === 'active'
              ? 'bg-black text-white'
              : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
          )}
        >
          Actifs
          <span className="ml-2 opacity-70">({partners.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('archived')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-all',
            activeTab === 'archived'
              ? 'bg-black text-white'
              : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
          )}
        >
          Archivés
          <span className="ml-2 opacity-70">({archivedPartners.length})</span>
        </button>
      </div>

      {/* Search */}
      <Card>
        <CardContent style={{ padding: spacing[4] }}>
          <div className="relative">
            <Search
              className="absolute left-3 top-3 h-4 w-4"
              style={{ color: colors.text.muted }}
            />
            <Input
              placeholder="Rechercher par nom..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              style={{ borderColor: colors.border.DEFAULT, color: colors.text.DEFAULT }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Partners Grid - 4-5 par ligne, cartes compactes */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {isLoading ? (
          Array.from({ length: 10 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader style={{ padding: spacing[2] }}>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent style={{ padding: spacing[2] }}>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))
        ) : (
          displayedPartners.map((partner) => (
            <Card key={partner.id} className="hover:shadow-md transition-shadow" data-testid="partner-card">
              <CardHeader style={{ padding: spacing[2] }}>
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-1.5 flex-1 min-w-0">
                    <OrganisationLogo
                      logoUrl={partner.logo_url}
                      organisationName={partner.name}
                      size="sm"
                      fallback="initials"
                      className="flex-shrink-0"
                    />
                    {partner.website ? (
                      <a
                        href={partner.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline truncate flex items-center gap-1"
                        style={{ color: colors.text.DEFAULT }}
                        data-testid="partner-name"
                      >
                        <span className="truncate">{partner.name}</span>
                        <ExternalLink className="h-3 w-3 flex-shrink-0 opacity-60" />
                      </a>
                    ) : (
                      <span className="truncate" style={{ color: colors.text.DEFAULT }} data-testid="partner-name">
                        {partner.name}
                      </span>
                    )}
                  </CardTitle>
                  {partner.archived_at && (
                    <Badge
                      variant="destructive"
                      className="text-xs flex-shrink-0"
                      style={{ backgroundColor: colors.danger[100], color: colors.danger[700] }}
                    >
                      Archivé
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-1.5" style={{ padding: spacing[2] }}>
                {/* Pays uniquement */}
                {partner.country && (
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: colors.text.subtle }}>
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{partner.country}</span>
                  </div>
                )}

                {/* Actions - Button Group Horizontal */}
                <div className="pt-1.5 border-t flex items-center gap-1" style={{ borderColor: colors.border.DEFAULT }}>
                  {activeTab === 'active' ? (
                    <>
                      {/* Onglet Actifs: Voir détails + Archive icon */}
                      <Link href={`/contacts-organisations/partners/${partner.id}`} className="flex-1">
                        <ButtonV2 variant="ghost" size="sm" className="w-full text-xs">
                          Voir détails
                        </ButtonV2>
                      </Link>

                      <ButtonV2
                        variant="ghost"
                        size="sm"
                        onClick={() => handleArchive(partner)}
                        icon={Archive}
                        className="px-2 text-xs"
                        aria-label="Archiver"
                      />
                    </>
                  ) : (
                    <>
                      {/* Onglet Archivés: Icons + Voir détails */}
                      <ButtonV2
                        variant="secondary"
                        size="sm"
                        onClick={() => handleArchive(partner)}
                        icon={ArchiveRestore}
                        className="px-2 text-xs"
                        aria-label="Restaurer"
                      />

                      <ButtonV2
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(partner)}
                        icon={Trash2}
                        className="px-2 text-xs"
                        aria-label="Supprimer"
                      />

                      <Link href={`/contacts-organisations/partners/${partner.id}`} className="flex-1">
                        <ButtonV2 variant="ghost" size="sm" className="w-full text-xs">
                          Voir détails
                        </ButtonV2>
                      </Link>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {displayedPartners.length === 0 && !isLoading && (
        <Card>
          <CardContent className="text-center" style={{ padding: spacing[8] }}>
            <Building2 className="h-12 w-12 mx-auto mb-4" style={{ color: colors.text.muted }} />
            <h3 className="text-lg font-medium mb-2" style={{ color: colors.text.DEFAULT }}>
              Aucun partenaire trouvé
            </h3>
            <p className="mb-4" style={{ color: colors.text.subtle }}>
              {searchQuery
                ? 'Aucun partenaire ne correspond à votre recherche.'
                : activeTab === 'active'
                  ? 'Commencez par créer votre premier partenaire.'
                  : 'Aucun partenaire archivé.'
              }
            </p>
            {activeTab === 'active' && (
              <ButtonV2
                variant="primary"
                onClick={handleCreatePartner}
                icon={Plus}
              >
                Créer un partenaire
              </ButtonV2>
            )}
          </CardContent>
        </Card>
      )}

      <PartnerFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        partner={selectedPartner}
        onSuccess={handlePartnerSuccess}
      />
    </div>
  )
}