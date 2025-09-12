'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { RadixSelect as Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Card } from '@/components/ui/card'
import { Building, User, Search, Plus, X, Check, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { assignUserToOrganisation, removeAssignmentFromUser } from '@/actions/user-assignments'
import { cn } from '@/lib/utils'

interface Organisation {
  id: string
  nom: string
  pays: string
  is_active: boolean
}

interface Admin {
  id: string
  prenom: string
  nom: string
  email: string
  user_roles?: any[]
}

interface AssignmentData {
  organisation: Organisation
  admins: Admin[]
  hasAdmin: boolean
}

interface AssignmentTableProps {
  data: AssignmentData[]
  availableAdmins: Admin[]
}

export function AssignmentTable({ data, availableAdmins }: AssignmentTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [assigningOrg, setAssigningOrg] = useState<string | null>(null)
  const [selectedAdmin, setSelectedAdmin] = useState<string>('')
  const [loading, setLoading] = useState(false)

  // Filtrer les données selon la recherche
  const filteredData = data.filter(item => 
    item.organisation.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.organisation.pays.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Gérer l'assignation d'un admin
  const handleAssignAdmin = async (organisationId: string) => {
    if (!selectedAdmin) {
      toast.error('Veuillez sélectionner un administrateur')
      return
    }

    setLoading(true)
    try {
      const result = await assignUserToOrganisation({
        userId: selectedAdmin,
        organisationId: organisationId,
        role: 'admin'
      })

      if (result.success) {
        toast.success('Administrateur assigné avec succès')
        setAssigningOrg(null)
        setSelectedAdmin('')
        // Recharger la page pour voir les changements
        window.location.reload()
      } else {
        throw new Error(result.error || 'Erreur lors de l\'assignation')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error(error instanceof Error ? error.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  // Gérer la suppression d'un admin
  const handleRemoveAdmin = async (organisationId: string, adminId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir retirer cet administrateur de cette organisation ?')) {
      return
    }

    setLoading(true)
    try {
      const result = await removeAssignmentFromUser({
        userId: adminId,
        organisationId: organisationId
      })

      if (result.success) {
        toast.success('Administrateur retiré avec succès')
        window.location.reload()
      } else {
        throw new Error(result.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error(error instanceof Error ? error.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Barre de recherche */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher une organisation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Badge variant="secondary">
          {filteredData.length} organisation{filteredData.length > 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Table des assignations */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Organisation</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Administrateur(s)</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((item) => (
              <TableRow key={item.organisation.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 gradient-copper rounded-lg flex items-center justify-center">
                      <Building className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">{item.organisation.nom}</p>
                      <p className="text-sm text-gray-500">{item.organisation.pays}</p>
                    </div>
                  </div>
                </TableCell>
                
                <TableCell>
                  <Badge 
                    variant={item.organisation.is_active ? "success" : "secondary"}
                    className={cn(
                      item.organisation.is_active 
                        ? "bg-green-100 text-green-800" 
                        : "bg-gray-100 text-gray-600"
                    )}
                  >
                    {item.organisation.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                
                <TableCell>
                  <div className="space-y-2">
                    {item.admins.length > 0 ? (
                      item.admins.map((admin) => (
                        <div key={admin.id} className="flex items-center gap-2">
                          <div className="flex items-center gap-2 flex-1">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                {admin.prenom} {admin.nom}
                              </p>
                              <p className="text-xs text-gray-500">{admin.email}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveAdmin(item.organisation.id, admin.id)}
                            disabled={loading}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center gap-2 text-orange-600">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm">Aucun admin assigné</span>
                      </div>
                    )}
                  </div>
                </TableCell>
                
                <TableCell className="text-right">
                  {assigningOrg === item.organisation.id ? (
                    <div className="flex items-center gap-2 justify-end">
                      <Select
                        value={selectedAdmin}
                        onValueChange={setSelectedAdmin}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Choisir un admin..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableAdmins
                            .filter(admin => 
                              !item.admins.some(a => a.id === admin.id)
                            )
                            .map((admin) => (
                              <SelectItem key={admin.id} value={admin.id}>
                                {admin.prenom} {admin.nom}
                              </SelectItem>
                            ))
                          }
                        </SelectContent>
                      </Select>
                      
                      <Button
                        size="sm"
                        onClick={() => handleAssignAdmin(item.organisation.id)}
                        disabled={loading || !selectedAdmin}
                        className="gradient-green text-white"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setAssigningOrg(null)
                          setSelectedAdmin('')
                        }}
                        disabled={loading}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setAssigningOrg(item.organisation.id)}
                      disabled={loading}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Assigner
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {filteredData.length === 0 && (
          <div className="p-8 text-center">
            <Building className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Aucune organisation trouvée</p>
          </div>
        )}
      </div>
    </div>
  )
}