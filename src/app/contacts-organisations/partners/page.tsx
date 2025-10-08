'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
  Award
} from 'lucide-react'
import Link from 'next/link'
import { useOrganisations } from '@/hooks/use-organisations'

export default function PartnersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showActiveOnly, setShowActiveOnly] = useState(true)

  // Utiliser useMemo pour stabiliser l'objet filters et éviter la boucle infinie
  const filters = useMemo(() => ({
    type: 'partner' as const,
    is_active: showActiveOnly ? true : undefined,
    search: searchQuery || undefined
  }), [showActiveOnly, searchQuery])

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
        console.log('✅ Partenaire archivé avec succès')
      }
    } else {
      // Restaurer
      const success = await unarchiveOrganisation(partner.id)
      if (success) {
        console.log('✅ Partenaire restauré avec succès')
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
        console.log('✅ Partenaire supprimé définitivement')
      }
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/contacts-organisations">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Organisations
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-semibold text-black">Partenaires</h1>
          <p className="text-gray-600 mt-2">
            Gestion du réseau de partenaires et distributeurs commerciaux
          </p>
        </div>
        <Button
          className="bg-black text-white hover:bg-gray-800"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Partenaire
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-black">{partners.length}</div>
            <p className="text-sm text-gray-600">Total partenaires</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {partners.filter(p => p.is_active).length}
            </div>
            <p className="text-sm text-gray-600">Actifs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {partners.filter(p => p.email || p.phone).length}
            </div>
            <p className="text-sm text-gray-600">Avec contact</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-black">
              {partners.filter(p => p.country).length}
            </div>
            <p className="text-sm text-gray-600">Internationaux</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par nom ou email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={showActiveOnly ? 'default' : 'outline'}
                onClick={() => setShowActiveOnly(!showActiveOnly)}
                size="sm"
              >
                <Filter className="h-4 w-4 mr-2" />
                {showActiveOnly ? 'Actifs uniquement' : 'Tous'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Partners List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          partners.map((partner) => (
            <Card key={partner.id} className="hover:shadow-lg transition-shadow" data-testid="partner-card">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg text-black flex items-center gap-2" data-testid="partner-name">
                      <UserCheck className="h-5 w-5" />
                      {partner.name}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      ID: {partner.id.slice(0, 8)}...
                    </CardDescription>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Badge
                      variant={partner.is_active ? 'default' : 'secondary'}
                      className={partner.is_active ? 'bg-green-100 text-green-800' : ''}
                    >
                      {partner.is_active ? 'Actif' : 'Inactif'}
                    </Badge>
                    {partner.archived_at && (
                      <Badge variant="destructive" className="bg-red-100 text-red-800 text-xs">
                        Archivé
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Contact Info */}
                <div className="space-y-2">
                  {partner.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{partner.email}</span>
                    </div>
                  )}

                  {partner.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4" />
                      {partner.phone}
                    </div>
                  )}
                </div>

                {/* Location & Business */}
                <div className="space-y-2">
                  {(partner.city || partner.country) && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span className="truncate">
                        {[partner.city, partner.country].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}

                </div>

                {/* Actions */}
                <div className="pt-4 border-t">
                  <div className="flex gap-2 flex-wrap">
                    {/* 1. Archiver/Restaurer */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleArchive(partner)}
                      className={`flex-1 min-w-0 ${partner.archived_at ? "text-blue-600 border-blue-200 hover:bg-blue-50" : "text-black border-gray-200 hover:bg-gray-50"}`}
                    >
                      {partner.archived_at ? (
                        <>
                          <ArchiveRestore className="h-4 w-4 mr-1" />
                          Restaurer
                        </>
                      ) : (
                        <>
                          <Archive className="h-4 w-4 mr-1" />
                          Archiver
                        </>
                      )}
                    </Button>

                    {/* 2. Supprimer */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(partner)}
                      className="flex-1 min-w-0 text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Supprimer
                    </Button>

                    {/* 3. Voir détails */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 min-w-0"
                      data-testid="partner-actions"
                    >
                      Voir détails
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {partners.length === 0 && !loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-black mb-2">
              Aucun partenaire trouvé
            </h3>
            <p className="text-gray-600 mb-4">
              {searchQuery
                ? 'Aucun partenaire ne correspond à votre recherche.'
                : 'Commencez par créer votre premier partenaire.'
              }
            </p>
            <Button
              className="bg-black text-white hover:bg-gray-800"
            >
              <Plus className="h-4 w-4 mr-2" />
              Créer un partenaire
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}