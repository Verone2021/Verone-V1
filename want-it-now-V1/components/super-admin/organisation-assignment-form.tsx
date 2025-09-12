'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Building, CheckCircle, XCircle, AlertCircle, Trash2 } from 'lucide-react'
import { assignOrganisationsAction, removeAssignmentAction } from '@/actions/user-assignments'
import { toast } from 'sonner'

interface Organisation {
  id: string
  nom: string
  pays: string
  is_active: boolean
}

interface UserAssignment {
  organisation_id: string
  role: string
  organisation: Organisation
}

interface OrganisationAssignmentFormProps {
  userId: string
  userName: string
  userEmail: string
  availableOrganisations: Organisation[]
  currentAssignments: UserAssignment[]
}

export function OrganisationAssignmentForm({
  userId,
  userName,
  userEmail,
  availableOrganisations,
  currentAssignments
}: OrganisationAssignmentFormProps) {
  const [selectedOrgIds, setSelectedOrgIds] = useState<string[]>([])
  const [isPending, startTransition] = useTransition()
  const [isRemoving, setIsRemoving] = useState<string | null>(null)

  // Organisations déjà assignées
  const assignedOrgIds = new Set(currentAssignments.map(a => a.organisation_id))
  
  // Organisations disponibles pour assignation (non encore assignées)
  const unassignedOrganisations = availableOrganisations.filter(
    org => !assignedOrgIds.has(org.id) && org.is_active
  )

  // Gérer la sélection des organisations
  const handleOrgToggle = (orgId: string) => {
    setSelectedOrgIds(prev => 
      prev.includes(orgId) 
        ? prev.filter(id => id !== orgId)
        : [...prev, orgId]
    )
  }

  // Soumettre les nouvelles assignations
  const handleAssign = () => {
    if (selectedOrgIds.length === 0) {
      toast.error('Veuillez sélectionner au moins une organisation')
      return
    }

    startTransition(async () => {
      try {
        await assignOrganisationsAction({
          userId,
          organisationIds: selectedOrgIds
        })
        
        toast.success(`${selectedOrgIds.length} organisation(s) assignée(s) avec succès`)
        setSelectedOrgIds([])
        
        // Actualiser la page
        window.location.reload()
      } catch (error) {
        console.error('Error assigning organisations:', error)
        toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'assignation')
      }
    })
  }

  // Supprimer une assignation existante
  const handleRemoveAssignment = (organisationId: string) => {
    setIsRemoving(organisationId)
    
    startTransition(async () => {
      try {
        await removeAssignmentAction({
          userId,
          organisationId
        })
        
        toast.success('Assignation supprimée avec succès')
        
        // Actualiser la page
        window.location.reload()
      } catch (error) {
        console.error('Error removing assignment:', error)
        toast.error(error instanceof Error ? error.message : 'Erreur lors de la suppression')
      } finally {
        setIsRemoving(null)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Informations utilisateur */}
      <Card className="modern-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Utilisateur à gérer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">Nom :</span>
              <span>{userName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Email :</span>
              <span className="text-sm text-gray-600">{userEmail}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">ID :</span>
              <span className="text-sm font-mono text-gray-500">{userId.slice(0, 8)}...</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Organisations actuellement assignées */}
      <Card className="modern-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5 text-blue-600" />
            Organisations Assignées ({currentAssignments.length})
          </CardTitle>
          <CardDescription>
            Organisations actuellement accessibles à cet administrateur
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentAssignments.length > 0 ? (
            <div className="space-y-3">
              {currentAssignments.map(assignment => (
                <div 
                  key={assignment.organisation_id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <div className="font-medium">{assignment.organisation.nom}</div>
                      <div className="text-sm text-gray-500">{assignment.organisation.pays}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{assignment.role}</Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:bg-red-50 hover:border-red-200"
                      onClick={() => handleRemoveAssignment(assignment.organisation_id)}
                      disabled={isRemoving === assignment.organisation_id}
                    >
                      {isRemoving === assignment.organisation_id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Building className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Aucune organisation assignée</p>
              <p className="text-sm">Utilisez le formulaire ci-dessous pour en assigner</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Formulaire d'assignation de nouvelles organisations */}
      <Card className="modern-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5 text-brand-copper" />
            Assigner de Nouvelles Organisations
          </CardTitle>
          <CardDescription>
            Sélectionnez les organisations à ajouter aux permissions de cet administrateur
          </CardDescription>
        </CardHeader>
        <CardContent>
          {unassignedOrganisations.length > 0 ? (
            <div className="space-y-4">
              {/* Liste des organisations disponibles */}
              <div className="grid gap-3 max-h-64 overflow-y-auto">
                {unassignedOrganisations.map(org => (
                  <div 
                    key={org.id}
                    className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Checkbox
                      id={`org-${org.id}`}
                      checked={selectedOrgIds.includes(org.id)}
                      onCheckedChange={() => handleOrgToggle(org.id)}
                      disabled={isPending}
                    />
                    <label 
                      htmlFor={`org-${org.id}`}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="font-medium">{org.nom}</div>
                      <div className="text-sm text-gray-500">{org.pays}</div>
                    </label>
                    {org.is_active ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                ))}
              </div>

              {/* Résumé de la sélection */}
              {selectedOrgIds.length > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {selectedOrgIds.length} organisation(s) sélectionnée(s) pour assignation
                  </AlertDescription>
                </Alert>
              )}

              {/* Bouton d'assignation */}
              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleAssign}
                  disabled={selectedOrgIds.length === 0 || isPending}
                  className="bg-gradient-to-br from-brand-copper to-secondary-copper text-white hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Assignation en cours...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Assigner {selectedOrgIds.length} organisation(s)
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-300" />
              <p className="font-medium">Toutes les organisations sont déjà assignées</p>
              <p className="text-sm">Cet administrateur a accès à toutes les organisations disponibles</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}