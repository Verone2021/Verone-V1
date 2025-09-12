'use client'

import { useState, useMemo } from 'react'
import { Plus, Users, Building2, Edit, Trash2, AlertCircle, Calculator, Eye, Mail, Phone, Calendar, MapPin, FileText, Globe } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

import { deleteAssocie } from '@/actions/proprietaires'
import {
  formatNombreParts,
  formatCapitalSocial,
  formatAssocieNomComplet,
} from '@/lib/utils/proprietaires'
import { type Proprietaire, type Associe } from '@/lib/validations/proprietaires'

// ==============================================================================
// TYPES & INTERFACES
// ==============================================================================

interface AssociesListProps {
  proprietaire: Proprietaire
  associes: Associe[]
  onAssocieDeleted?: () => void
  onAssocieEdit?: (associe: Associe) => void
  showQuickActions?: boolean
  showStats?: boolean
  className?: string
}

interface AssocieItemProps {
  associe: Associe
  proprietaire: Proprietaire
  percentage: number
  onEdit?: (associe: Associe) => void
  onDelete?: (associeId: string) => void
  showActions?: boolean
}

// ==============================================================================
// ASSOCIE DETAIL MODAL COMPONENT
// ==============================================================================

function AssocieDetailModal({ associe, proprietaire, percentage }: {
  associe: Associe
  proprietaire: Proprietaire
  percentage: number
}) {
  const nomComplet = formatAssocieNomComplet(associe)
  const capitalValue = proprietaire.capital_social ? (proprietaire.capital_social * percentage / 100) : null
  
  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center space-x-2">
          {associe.type === 'physique' ? (
            <Users className="h-5 w-5 text-blue-500" />
          ) : (
            <Building2 className="h-5 w-5 text-purple-500" />
          )}
          <span>{nomComplet}</span>
        </DialogTitle>
        <DialogDescription>
          Détails complets de l'associé{associe.type === 'physique' ? '' : 'e'}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6">
        {/* Informations principales */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 flex items-center space-x-2">
            <FileText className="h-4 w-4 text-gray-400" />
            <span>Informations principales</span>
          </h4>
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Type :</span>
              <Badge variant="outline">
                {associe.type === 'physique' ? '👤 Personne physique' : '🏢 Personne morale'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Parts détenues :</span>
              <span className="font-medium">{formatNombreParts(associe.nombre_parts)} ({percentage.toFixed(1)}%)</span>
            </div>
            {capitalValue && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Valeur du capital :</span>
                <span className="font-medium">{formatCapitalSocial(capitalValue)}</span>
              </div>
            )}
            {associe.date_entree && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Date d'entrée :</span>
                <span className="font-medium">
                  {new Date(associe.date_entree).toLocaleDateString('fr-FR')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Informations personnelles/société */}
        {associe.type === 'physique' && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 flex items-center space-x-2">
              <Users className="h-4 w-4 text-gray-400" />
              <span>Informations personnelles</span>
            </h4>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              {associe.date_naissance && (
                <div className="flex items-center space-x-2 text-sm">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-500">Né(e) le :</span>
                  <span className="font-medium">
                    {new Date(associe.date_naissance).toLocaleDateString('fr-FR')}
                    {associe.lieu_naissance && ` à ${associe.lieu_naissance}`}
                  </span>
                </div>
              )}
              {associe.nationalite && (
                <div className="flex items-center space-x-2 text-sm">
                  <Globe className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-500">Nationalité :</span>
                  <span className="font-medium">{associe.nationalite}</span>
                </div>
              )}
              {associe.numero_identification && (
                <div className="flex items-center space-x-2 text-sm">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-500">N° identification :</span>
                  <span className="font-mono text-sm">{associe.numero_identification}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {associe.type === 'morale' && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 flex items-center space-x-2">
              <Building2 className="h-4 w-4 text-gray-400" />
              <span>Informations société</span>
            </h4>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              {associe.forme_juridique && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Forme juridique :</span>
                  <span className="font-medium">{associe.forme_juridique}</span>
                </div>
              )}
              {associe.numero_identification && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">N° identification :</span>
                  <span className="font-mono text-sm">{associe.numero_identification}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contact */}
        {(associe.email || associe.telephone) && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 flex items-center space-x-2">
              <Mail className="h-4 w-4 text-gray-400" />
              <span>Contact</span>
            </h4>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              {associe.email && (
                <div className="flex items-center space-x-2 text-sm">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-500">Email :</span>
                  <a 
                    href={`mailto:${associe.email}`}
                    className="text-brand-copper hover:underline font-medium"
                  >
                    {associe.email}
                  </a>
                </div>
              )}
              {associe.telephone && (
                <div className="flex items-center space-x-2 text-sm">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-500">Téléphone :</span>
                  <a 
                    href={`tel:${associe.telephone}`}
                    className="text-brand-copper hover:underline font-medium"
                  >
                    {associe.telephone}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Adresse */}
        {(associe.adresse || associe.ville) && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span>Adresse</span>
            </h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700">
                {associe.adresse && (
                  <>
                    {associe.adresse}
                    {(associe.code_postal || associe.ville) && <br />}
                  </>
                )}
                {associe.code_postal && `${associe.code_postal} `}
                {associe.ville}
                {associe.pays && associe.pays !== 'FR' && (
                  <>
                    <br />
                    <span className="text-gray-500">{associe.pays}</span>
                  </>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Métadonnées */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Métadonnées</h4>
          <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Créé le :</span>
              <span className="font-medium">
                {new Date(associe.created_at).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Modifié le :</span>
              <span className="font-medium">
                {new Date(associe.updated_at).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Statut :</span>
              <Badge variant={associe.is_active ? "default" : "secondary"}>
                {associe.is_active ? '🟢 Actif' : '🔴 Inactif'}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </DialogContent>
  )
}

// ==============================================================================
// ASSOCIE ITEM COMPONENT
// ==============================================================================

function AssocieItem({
  associe,
  proprietaire,
  percentage,
  onEdit,
  onDelete,
  showActions = true,
}: AssocieItemProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!onDelete) return
    
    setIsDeleting(true)
    try {
      await onDelete(associe.id)
    } finally {
      setIsDeleting(false)
    }
  }

  const nomComplet = formatAssocieNomComplet(associe)

  return (
    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
      {/* Ligne principale avec nom et actions */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {associe.type === 'physique' ? (
            <Users className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
          ) : (
            <Building2 className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <p className="font-medium text-gray-900 truncate">
                {nomComplet}
              </p>
              <Badge variant="outline" className="text-xs flex-shrink-0">
                {associe.type === 'physique' ? '👤 Physique' : '🏢 Morale'}
              </Badge>
            </div>
            
            {/* Parts et pourcentage */}
            <div className="flex items-center space-x-3 mt-1">
              <span className="text-sm text-gray-500">
                {formatNombreParts(associe.nombre_parts)} parts
              </span>
              <span className="text-sm font-medium text-brand-copper">
                {percentage.toFixed(1)}%
              </span>
              {proprietaire.capital_social && (
                <span className="text-sm text-gray-600">
                  {formatCapitalSocial(proprietaire.capital_social * percentage / 100)}
                </span>
              )}
            </div>

            {/* Informations enrichies */}
            <div className="mt-3 space-y-2">
              {/* Contact */}
              {(associe.email || associe.telephone) && (
                <div className="flex items-center space-x-4">
                  {associe.email && (
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <Mail className="h-3 w-3" />
                      <span className="truncate max-w-40">{associe.email}</span>
                    </div>
                  )}
                  {associe.telephone && (
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <Phone className="h-3 w-3" />
                      <span>{associe.telephone}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Informations spécifiques selon le type */}
              {associe.type === 'physique' && (
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  {associe.date_naissance && (
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {new Date(associe.date_naissance).toLocaleDateString('fr-FR')}
                        {associe.lieu_naissance && ` (${associe.lieu_naissance})`}
                      </span>
                    </div>
                  )}
                  {associe.nationalite && (
                    <div className="flex items-center space-x-1">
                      <Globe className="h-3 w-3" />
                      <span>{associe.nationalite}</span>
                    </div>
                  )}
                </div>
              )}

              {associe.type === 'morale' && (
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  {associe.forme_juridique && (
                    <div className="flex items-center space-x-1">
                      <Building2 className="h-3 w-3" />
                      <span>{associe.forme_juridique}</span>
                    </div>
                  )}
                  {associe.numero_identification && (
                    <div className="flex items-center space-x-1">
                      <FileText className="h-3 w-3" />
                      <span className="font-mono">{associe.numero_identification}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Adresse si disponible */}
              {(associe.ville || associe.adresse) && (
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">
                    {associe.ville}{associe.adresse && associe.ville && ', '}{associe.adresse && (associe.adresse.length > 30 ? `${associe.adresse.substring(0, 30)}...` : associe.adresse)}
                  </span>
                </div>
              )}

              {/* Date d'entrée */}
              {associe.date_entree && (
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <Calendar className="h-3 w-3" />
                  <span>Entrée le {new Date(associe.date_entree).toLocaleDateString('fr-FR')}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-1 flex-shrink-0">
          {/* Bouton détails avec modal */}
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-blue-100"
                title="Voir les détails"
              >
                <Eye className="h-3 w-3 text-blue-600" />
              </Button>
            </DialogTrigger>
            <AssocieDetailModal 
              associe={associe} 
              proprietaire={proprietaire} 
              percentage={percentage} 
            />
          </Dialog>
          
          {showActions && (
            <>
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => onEdit(associe)}
                >
                  <Edit className="h-3 w-3" />
                </Button>
              )}
            
            {onDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Supprimer l'associé</AlertDialogTitle>
                    <AlertDialogDescription>
                      Êtes-vous sûr de vouloir supprimer <strong>{nomComplet}</strong> ?
                      Cette action est irréversible et libérera {formatNombreParts(associe.nombre_parts)} parts
                      ({percentage.toFixed(1)}% du capital).
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-red-600 hover:bg-red-700"
                      disabled={isDeleting}
                    >
                      {isDeleting ? 'Suppression...' : 'Supprimer'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </>
        )}
        </div>
      </div>
    </div>
  )
}

// ==============================================================================
// MAIN COMPONENT
// ==============================================================================

export function AssociesList({
  proprietaire,
  associes,
  onAssocieDeleted,
  onAssocieEdit,
  showQuickActions = true,
  showStats = true,
  className = "",
}: AssociesListProps) {
  const [deletingAssocieId, setDeletingAssocieId] = useState<string | null>(null)

  // ==============================================================================
  // CALCULATIONS
  // ==============================================================================

  const stats = useMemo(() => {
    const totalParts = associes.reduce((sum, a) => sum + a.nombre_parts, 0)
    const partsRestantes = (proprietaire.nombre_parts_total || 0) - totalParts
    const percentageAlloue = proprietaire.nombre_parts_total 
      ? (totalParts / proprietaire.nombre_parts_total) * 100
      : 0

    return {
      totalParts,
      partsRestantes,
      percentageAlloue,
      isComplete: partsRestantes === 0,
      hasOverflow: partsRestantes < 0,
    }
  }, [associes, proprietaire.nombre_parts_total])

  // ==============================================================================
  // HANDLERS
  // ==============================================================================

  const handleDeleteAssocie = async (associeId: string) => {
    setDeletingAssocieId(associeId)
    
    try {
      const result = await deleteAssocie(associeId)
      
      if (result.success) {
        onAssocieDeleted?.()
      } else {
        console.error('Erreur lors de la suppression:', result.error)
        // TODO: Afficher un toast d'erreur
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'associé:', error)
      // TODO: Afficher un toast d'erreur
    } finally {
      setDeletingAssocieId(null)
    }
  }

  // ==============================================================================
  // RENDER HELPERS
  // ==============================================================================

  const renderStats = () => {
    if (!showStats || !proprietaire.nombre_parts_total) return null

    return (
      <div className="space-y-4">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Répartition du capital</span>
            <span className="font-medium">
              {stats.percentageAlloue.toFixed(1)}% alloué
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-300 ${
                stats.hasOverflow 
                  ? 'bg-red-500'
                  : stats.isComplete 
                    ? 'bg-green-500'
                    : 'bg-brand-copper'
              }`}
              style={{ 
                width: `${Math.min(100, Math.max(0, stats.percentageAlloue))}%` 
              }}
            />
          </div>
        </div>

        {/* Stats details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Parts attribuées</span>
            <p className="font-medium text-gray-900">
              {formatNombreParts(stats.totalParts)}
            </p>
          </div>
          
          <div>
            <span className="text-gray-500">Parts restantes</span>
            <p className={`font-medium ${
              stats.hasOverflow 
                ? 'text-red-600'
                : stats.isComplete 
                  ? 'text-green-600'
                  : 'text-gray-900'
            }`}>
              {formatNombreParts(stats.partsRestantes)}
            </p>
          </div>
        </div>

        {/* Capital total */}
        {proprietaire.capital_social && (
          <div className="pt-2 border-t border-gray-100">
            <span className="text-gray-500 text-sm">Capital social total</span>
            <p className="font-semibold text-lg text-gray-900">
              {formatCapitalSocial(proprietaire.capital_social)}
            </p>
          </div>
        )}

        {/* Alerts */}
        {stats.hasOverflow && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Attention : Le nombre de parts attribuées dépasse le capital social total 
              de {formatNombreParts(Math.abs(stats.partsRestantes))} parts.
            </AlertDescription>
          </Alert>
        )}

        {stats.isComplete && (
          <Alert className="border-green-200 bg-green-50">
            <AlertCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Le capital social est entièrement réparti entre les associés.
            </AlertDescription>
          </Alert>
        )}
      </div>
    )
  }

  const renderAssociesList = () => {
    if (associes.length === 0) {
      return (
        <div className="text-center py-8">
          <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucun associé
          </h3>
          <p className="text-gray-500 mb-4">
            Cette personne morale n'a pas encore d'associés enregistrés.
          </p>
          {showQuickActions && (
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un associé
            </Button>
          )}
        </div>
      )
    }

    return (
      <div className="space-y-3">
        {associes.map((associe) => {
          const percentage = proprietaire.nombre_parts_total
            ? (associe.nombre_parts / proprietaire.nombre_parts_total) * 100
            : 0

          return (
            <AssocieItem
              key={associe.id}
              associe={associe}
              proprietaire={proprietaire}
              percentage={percentage}
              onEdit={onAssocieEdit}
              onDelete={showQuickActions ? handleDeleteAssocie : undefined}
              showActions={showQuickActions}
            />
          )
        })}
      </div>
    )
  }

  // ==============================================================================
  // MAIN RENDER
  // ==============================================================================

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Associés ({associes.length})</span>
            {stats.hasOverflow && (
              <Badge variant="destructive" className="text-xs">
                Dépassement
              </Badge>
            )}
            {stats.isComplete && !stats.hasOverflow && (
              <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                Complet
              </Badge>
            )}
          </CardTitle>
          
          {showQuickActions && (
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Stats section */}
        {renderStats()}
        
        {/* List section */}
        {showStats && associes.length > 0 && <Separator />}
        {renderAssociesList()}

        {/* Quick calculator hint */}
        {showQuickActions && associes.length > 0 && !stats.isComplete && !stats.hasOverflow && (
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Calculator className="h-4 w-4" />
              <span>
                Il reste {formatNombreParts(stats.partsRestantes)} parts à attribuer
                ({(100 - stats.percentageAlloue).toFixed(1)}% du capital)
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ==============================================================================
// EXPORT VARIANTS
// ==============================================================================

export function AssociesListCompact(props: Omit<AssociesListProps, 'showStats'>) {
  return <AssociesList {...props} showStats={false} />
}

export function AssociesListReadOnly(props: Omit<AssociesListProps, 'showQuickActions'>) {
  return <AssociesList {...props} showQuickActions={false} />
}