'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import * as Select from '@radix-ui/react-select'
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Settings, Search, Filter, Building, User, Mail, Phone } from 'lucide-react'
import Link from 'next/link'
import { getRoleColor, getRoleLabel } from '@/lib/validations/utilisateurs'

interface UserWithRoles {
  id: string
  nom: string | null
  prenom: string | null
  email: string
  telephone: string | null
  role: string
  created_at: string
  updated_at: string
  user_roles: Array<{
    organisation_id: string
    role: string
    organisation: {
      id: string
      nom: string
      pays: string
    } | null
  }>
}

interface UsersManagementTableProps {
  users: UserWithRoles[]
}

export function UsersManagementTable({ users }: UsersManagementTableProps) {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')

  // Filtrer les utilisateurs
  const filteredUsers = users.filter(user => {
    const matchesSearch = search === '' || 
      user.nom?.toLowerCase().includes(search.toLowerCase()) ||
      user.prenom?.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
    
    const matchesRole = roleFilter === 'all' || 
      user.user_roles?.some(role => role.role === roleFilter) ||
      (roleFilter === 'legacy' && user.role && !user.user_roles?.length)

    return matchesSearch && matchesRole
  })

  // Obtenir les organisations d'un utilisateur
  const getUserOrganisations = (user: UserWithRoles) => {
    if (!user.user_roles?.length) return []
    return user.user_roles
      .filter(role => role.organisation)
      .map(role => role.organisation!)
  }

  // Obtenir les rôles actifs d'un utilisateur
  const getUserActiveRoles = (user: UserWithRoles) => {
    if (!user.user_roles?.length) {
      return user.role ? [user.role] : []
    }
    return [...new Set(user.user_roles.map(role => role.role))]
  }

  return (
    <div className="space-y-6">
      {/* Filtres et recherche */}
      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher par nom, prénom ou email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2 sm:w-auto">
              <Filter className="h-4 w-4 text-gray-500" />
              <Select.Root value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrer par rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les rôles</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="utilisateur">Utilisateur</SelectItem>
                  <SelectItem value="legacy">Legacy (ancien système)</SelectItem>
                </SelectContent>
              </Select.Root>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Résultats */}
      <div className="text-sm text-gray-600 mb-4">
        {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''} trouvé{filteredUsers.length > 1 ? 's' : ''}
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="font-semibold">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Utilisateur
                </div>
              </TableHead>
              <TableHead className="font-semibold">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Contact
                </div>
              </TableHead>
              <TableHead className="font-semibold">Rôles</TableHead>
              <TableHead className="font-semibold">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Organisations
                </div>
              </TableHead>
              <TableHead className="font-semibold text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map(user => {
              const activeRoles = getUserActiveRoles(user)
              const organisations = getUserOrganisations(user)
              const canAssignOrgs = activeRoles.includes('admin')

              return (
                <TableRow key={user.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium text-gray-900">
                        {user.prenom} {user.nom || '(Nom non renseigné)'}
                      </div>
                      <div className="text-sm text-gray-500">
                        ID: {user.id.slice(0, 8)}...
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm font-medium">{user.email}</div>
                      {user.telephone && (
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {user.telephone}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {activeRoles.map(role => (
                        <Badge key={role} className={getRoleColor(role as any)}>
                          {getRoleLabel(role as any)}
                        </Badge>
                      ))}
                      {!activeRoles.length && (
                        <Badge variant="outline" className="text-gray-500">
                          Aucun rôle
                        </Badge>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    {organisations.length > 0 ? (
                      <div className="space-y-1">
                        {organisations.slice(0, 2).map(org => (
                          <div key={org.id} className="text-sm">
                            <span className="font-medium">{org.nom}</span>
                            <span className="text-gray-500 ml-1">({org.pays})</span>
                          </div>
                        ))}
                        {organisations.length > 2 && (
                          <div className="text-xs text-gray-500">
                            +{organisations.length - 2} autres...
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500 italic">
                        Aucune organisation
                      </span>
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="flex justify-center gap-2">
                      {canAssignOrgs && (
                        <Link href={`/super-admin/utilisateurs/${user.id}/assign`}>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="hover:bg-brand-copper hover:text-white transition-colors"
                          >
                            <Settings className="h-3 w-3 mr-1" />
                            Assigner
                          </Button>
                        </Link>
                      )}
                      <Link href={`/utilisateurs/${user.id}`}>
                        <Button size="sm" variant="ghost">
                          <User className="h-3 w-3 mr-1" />
                          Voir
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">Aucun utilisateur trouvé</p>
            <p className="text-sm">Essayez de modifier vos critères de recherche</p>
          </div>
        )}
      </div>
    </div>
  )
}