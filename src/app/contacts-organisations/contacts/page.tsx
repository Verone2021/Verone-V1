'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  Search,
  Filter,
  Plus,
  Phone,
  Mail,
  Building,
  User,
  Eye,
  Edit,
  MapPin,
  Briefcase,
  UserCheck,
  Archive,
  Trash2,
  ArchiveRestore,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import { useContacts } from '@/hooks/use-contacts'

interface ContactStats {
  totalContacts: number
  supplierContacts: number
  customerContacts: number
  primaryContacts: number
  activeContacts: number
}

export default function ContactsPage() {
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

  // Charger tous les contacts au montage
  useEffect(() => {
    fetchContacts()
  }, [fetchContacts])

  // Filtrer les contacts selon les critères
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.organisation?.name.toLowerCase().includes(searchTerm.toLowerCase())

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

  // Calculer les statistiques
  const stats: ContactStats = {
    totalContacts: contacts.length,
    supplierContacts: contacts.filter(c => c.organisation?.type === 'supplier').length,
    customerContacts: contacts.filter(c => c.organisation?.type === 'customer').length,
    primaryContacts: contacts.filter(c => c.is_primary_contact).length,
    activeContacts: contacts.filter(c => c.is_active).length
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
        console.log('✅ Contact archivé avec succès')
      } else {
        await activateContact(contact.id)
        console.log('✅ Contact restauré avec succès')
      }
    } catch (error) {
      console.error('❌ Erreur archivage contact:', error)
    }
  }

  const handleDelete = async (contact: any) => {
    const confirmed = confirm(
      `Êtes-vous sûr de vouloir supprimer définitivement "${contact.first_name} ${contact.last_name}" ?\n\nCette action est irréversible !`
    )

    if (confirmed) {
      try {
        await deleteContact(contact.id)
        console.log('✅ Contact supprimé définitivement')
      } catch (error) {
        console.error('❌ Erreur suppression contact:', error)
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
          <h1 className="text-3xl font-semibold text-black">Contacts</h1>
          <p className="text-gray-600 mt-2">
            Gestion centralisée des contacts fournisseurs et clients professionnels
          </p>
        </div>
        <Button className="bg-black text-white hover:bg-gray-800">
          <Plus className="h-4 w-4 mr-2" />
          Nouveau contact
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Contacts
            </CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">{stats.totalContacts}</div>
            <p className="text-xs text-gray-500">
              Contacts enregistrés
            </p>
          </CardContent>
        </Card>

        <Card className="border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Fournisseurs
            </CardTitle>
            <Building className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.supplierContacts}</div>
            <p className="text-xs text-gray-500">
              Contacts fournisseurs
            </p>
          </CardContent>
        </Card>

        <Card className="border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Clients Pro
            </CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.customerContacts}</div>
            <p className="text-xs text-gray-500">
              Contacts clients pros
            </p>
          </CardContent>
        </Card>

        <Card className="border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Principaux
            </CardTitle>
            <UserCheck className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.primaryContacts}</div>
            <p className="text-xs text-gray-500">
              Contacts principaux
            </p>
          </CardContent>
        </Card>

        <Card className="border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Actifs
            </CardTitle>
            <Phone className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.activeContacts}</div>
            <p className="text-xs text-gray-500">
              Contacts actifs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et recherche */}
      <Card className="border">
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
                <Button
                  variant={filterType === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('all')}
                >
                  Tous
                </Button>
                <Button
                  variant={filterType === 'supplier' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('supplier')}
                >
                  Fournisseurs
                </Button>
                <Button
                  variant={filterType === 'customer' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('customer')}
                >
                  Clients Pro
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filterRole === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterRole('all')}
                >
                  Tous rôles
                </Button>
                <Button
                  variant={filterRole === 'primary' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterRole('primary')}
                >
                  Principaux
                </Button>
                <Button
                  variant={filterRole === 'commercial' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterRole('commercial')}
                >
                  Commercial
                </Button>
                <Button
                  variant={filterRole === 'technical' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterRole('technical')}
                >
                  Technique
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des contacts */}
      <Card className="border">
        <CardHeader>
          <CardTitle>
            {filteredContacts.length} contact{filteredContacts.length > 1 ? 's' : ''}
            {(filterType !== 'all' || filterRole !== 'all') && (
              <span className="text-gray-500 font-normal">
                {' '}(filtré{filteredContacts.length > 1 ? 's' : ''})
              </span>
            )}
          </CardTitle>
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
                              {contact.organisation?.name}
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
                            {/* Archiver/Restaurer */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleArchive(contact)}
                              className={`${!contact.is_active ? "text-blue-600 border-blue-200 hover:bg-blue-50" : "text-orange-600 border-orange-200 hover:bg-orange-50"}`}
                            >
                              {!contact.is_active ? (
                                <ArchiveRestore className="h-4 w-4" />
                              ) : (
                                <Archive className="h-4 w-4" />
                              )}
                            </Button>

                            {/* Supprimer */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(contact)}
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>

                            {/* Voir détails */}
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
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