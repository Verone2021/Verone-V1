'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ButtonV2 } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  Plus,
  Phone,
  Mail,
  Users,
  Building,
  UserCheck,
  Archive,
  Trash2,
  ArchiveRestore,
  Eye
} from 'lucide-react'
import { useContacts } from '@/shared/modules/organisations/hooks'
import { getOrganisationDisplayName, type Organisation } from '@/shared/modules/organisations/hooks'

interface ContactStats {
  totalContacts: number
  supplierContacts: number
  customerContacts: number
  partnerContacts: number
}

export function ContactsTab() {
  const {
    contacts,
    loading,
    fetchContacts,
    deactivateContact,
    activateContact,
    deleteContact
  } = useContacts()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'supplier' | 'customer'>('all')
  const [filterRole, setFilterRole] = useState<'all' | 'primary' | 'commercial' | 'technical' | 'billing'>('all')

  useEffect(() => {
    fetchContacts()
  }, [fetchContacts])

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (contact.organisation && getOrganisationDisplayName(contact.organisation as Organisation).toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesType = filterType === 'all' ||
                       (filterType === 'supplier' && contact.organisation?.type === 'supplier') ||
                       (filterType === 'customer' && contact.organisation?.type === 'customer')

    const matchesRole = filterRole === 'all' ||
                       (filterRole === 'primary' && contact.is_primary_contact) ||
                       (filterRole === 'commercial' && contact.is_commercial_contact) ||
                       (filterRole === 'technical' && contact.is_technical_contact) ||
                       (filterRole === 'billing' && contact.is_billing_contact)

    return matchesSearch && matchesType && matchesRole
  })

  const stats: ContactStats = {
    totalContacts: contacts.length,
    supplierContacts: contacts.filter(c => c.organisation?.type === 'supplier').length,
    customerContacts: contacts.filter(c => c.organisation?.type === 'customer').length,
    partnerContacts: contacts.filter(c => c.organisation?.type === 'partner').length
  }

  const getContactRoles = (contact: any) => {
    const roles = []
    if (contact.is_primary_contact) roles.push('Principal')
    if (contact.is_commercial_contact) roles.push('Commercial')
    if (contact.is_billing_contact) roles.push('Facturation')
    if (contact.is_technical_contact) roles.push('Technique')
    return roles.join(', ') || 'Aucun rôle'
  }

  const getOrganisationTypeInfo = (type: string) => {
    switch (type) {
      case 'supplier':
        return {
          icon: <Building className="h-4 w-4" />,
          label: 'Fournisseur',
          color: 'bg-blue-50 text-blue-700 border-blue-200'
        }
      case 'customer':
        return {
          icon: <Users className="h-4 w-4" />,
          label: 'Client Pro',
          color: 'bg-green-50 text-green-700 border-green-200'
        }
      default:
        return {
          icon: <Building className="h-4 w-4" />,
          label: 'Organisation',
          color: 'bg-gray-50 text-gray-700 border-gray-200'
        }
    }
  }

  const handleArchive = async (contact: any) => {
    try {
      if (contact.is_active) {
        await deactivateContact(contact.id)
      } else {
        await activateContact(contact.id)
      }
    } catch (error) {
      console.error('Erreur archivage contact:', error)
    }
  }

  const handleDelete = async (contact: any) => {
    const confirmed = confirm(
      `Êtes-vous sûr de vouloir supprimer définitivement "${contact.first_name} ${contact.last_name}" ?\n\nCette action est irréversible !`
    )

    if (confirmed) {
      try {
        await deleteContact(contact.id)
      } catch (error) {
        console.error('Erreur suppression contact:', error)
      }
    }
  }

  return (
    <div className="space-y-4">
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Contacts
            </CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">{stats.totalContacts}</div>
            <p className="text-xs text-gray-500">Contacts enregistrés</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Fournisseurs
            </CardTitle>
            <Building className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.supplierContacts}</div>
            <p className="text-xs text-gray-500">Contacts fournisseurs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Clients Pro
            </CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.customerContacts}</div>
            <p className="text-xs text-gray-500">Contacts clients pros</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Prestataires
            </CardTitle>
            <UserCheck className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.partnerContacts}</div>
            <p className="text-xs text-gray-500">Contacts prestataires</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col space-y-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Rechercher par nom, email, organisation..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex gap-2">
                <ButtonV2
                  variant={filterType === 'all' ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('all')}
                >
                  Tous
                </ButtonV2>
                <ButtonV2
                  variant={filterType === 'supplier' ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('supplier')}
                >
                  Fournisseurs
                </ButtonV2>
                <ButtonV2
                  variant={filterType === 'customer' ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('customer')}
                >
                  Clients Pro
                </ButtonV2>
              </div>
              <div className="flex gap-2">
                <ButtonV2
                  variant={filterRole === 'all' ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => setFilterRole('all')}
                >
                  Tous rôles
                </ButtonV2>
                <ButtonV2
                  variant={filterRole === 'primary' ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => setFilterRole('primary')}
                >
                  Principaux
                </ButtonV2>
                <ButtonV2
                  variant={filterRole === 'commercial' ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => setFilterRole('commercial')}
                >
                  Commercial
                </ButtonV2>
                <ButtonV2
                  variant={filterRole === 'technical' ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => setFilterRole('technical')}
                >
                  Technique
                </ButtonV2>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des contacts */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              {filteredContacts.length} contact{filteredContacts.length > 1 ? 's' : ''}
              {(filterType !== 'all' || filterRole !== 'all') && (
                <span className="text-gray-500 font-normal">
                  {' '}(filtré{filteredContacts.length > 1 ? 's' : ''})
                </span>
              )}
            </CardTitle>
            <ButtonV2 className="bg-black text-white hover:bg-gray-800" icon={Plus}>
              Nouveau contact
            </ButtonV2>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="text-gray-500">Chargement des contacts...</div>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm ? 'Aucun contact trouvé pour cette recherche' : 'Aucun contact enregistré'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Contact</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Organisation</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Rôles</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Coordonnées</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Statut</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredContacts.map((contact) => {
                    const orgTypeInfo = getOrganisationTypeInfo(contact.organisation?.type || '')

                    return (
                      <tr key={contact.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <span className="font-medium text-black">
                              {contact.first_name} {contact.last_name}
                            </span>
                            {contact.title && (
                              <p className="text-sm text-gray-500">{contact.title}</p>
                            )}
                            {contact.department && (
                              <p className="text-xs text-gray-400">{contact.department}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <span className="font-medium text-black">
                              {contact.organisation && getOrganisationDisplayName(contact.organisation as Organisation)}
                            </span>
                            <Badge variant="outline" className={orgTypeInfo.color}>
                              <div className="flex items-center gap-1">
                                {orgTypeInfo.icon}
                                {orgTypeInfo.label}
                              </div>
                            </Badge>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm">
                            {getContactRoles(contact)}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center text-sm text-gray-600">
                              <Mail className="h-4 w-4 mr-2" />
                              {contact.email}
                            </div>
                            {contact.phone && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Phone className="h-4 w-4 mr-2" />
                                {contact.phone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant="outline"
                            className={contact.is_active
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : 'bg-gray-50 text-gray-700 border-gray-200'
                            }
                          >
                            {contact.is_active ? 'Actif' : 'Inactif'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <ButtonV2
                              variant="outline"
                              size="sm"
                              onClick={() => handleArchive(contact)}
                              className={`${!contact.is_active ? "text-blue-600 border-blue-200 hover:bg-blue-50" : "text-black border-gray-200 hover:bg-gray-50"}`}
                            >
                              {!contact.is_active ? (
                                <ArchiveRestore className="h-4 w-4" />
                              ) : (
                                <Archive className="h-4 w-4" />
                              )}
                            </ButtonV2>

                            <ButtonV2
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(contact)}
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </ButtonV2>

                            <ButtonV2 variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </ButtonV2>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Information sur les contacts */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <Users className="h-5 w-5" />
            À Propos des Contacts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-blue-700 mb-2">Fournisseurs</h4>
              <p className="text-blue-600">
                Contacts multiples par fournisseur avec rôles spécialisés :
                commercial, technique, facturation, contact principal.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-blue-700 mb-2">Clients Professionnels</h4>
              <p className="text-blue-600">
                Contacts d'entreprises clientes. Les clients particuliers
                ont leurs données directement dans l'organisation.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
