'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  getProprieteQuotites, 
  removeProprieteProprietaire
} from '@/actions/proprietes'
import { type ProprieteQuotite } from '@/lib/validations/proprietes'
import { formatPercent } from '@/lib/utils'
import {
  Users,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  Building2,
  User,
  MoreHorizontal
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ConfirmationModal } from '@/components/ui/confirmation-modal'
import { QuotiteDialog } from '../dialogs/quotite-dialog'

interface ProprieteQuotitesSectionProps {
  proprieteId: string
  quotitesTotal: number
  isAdmin: boolean
}

export function ProprieteQuotitesSection({
  proprieteId,
  quotitesTotal: initialTotal,
  isAdmin
}: ProprieteQuotitesSectionProps) {
  const [quotites, setQuotites] = useState<any[]>([])
  const [quotitesTotal, setQuotitesTotal] = useState(initialTotal)
  const [isLoading, setIsLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    quotite: any | null
  }>({ isOpen: false, quotite: null })

  useEffect(() => {
    loadQuotites()
  }, [proprieteId])

  const loadQuotites = async () => {
    setIsLoading(true)
    const result = await getProprieteQuotites(proprieteId)
    if (result.success && result.data) {
      setQuotites(result.data.quotites)
      setQuotitesTotal(result.data.total)
    }
    setIsLoading(false)
  }

  const handleDelete = async () => {
    if (!deleteModal.quotite) return
    
    const result = await removeProprieteProprietaire(
      proprieteId,
      deleteModal.quotite.proprietaire_id
    )
    
    if (result.success) {
      await loadQuotites()
      setDeleteModal({ isOpen: false, quotite: null })
    }
  }

  const renderProprietaireCell = (quotite: any) => {
    const proprietaire = quotite.proprietaire
    if (!proprietaire?.nom) return 'N/A'
    
    return (
      <div className="flex items-center gap-2">
        {proprietaire.type === 'morale' ? (
          <Building2 className="w-4 h-4 text-gray-400" />
        ) : (
          <User className="w-4 h-4 text-gray-400" />
        )}
        <div>
          <p className="font-medium">
            {proprietaire.type === 'physique' && proprietaire.prenom
              ? `${proprietaire.prenom} ${proprietaire.nom}`
              : proprietaire.nom
            }
          </p>
          {proprietaire.email && (
            <p className="text-sm text-gray-500">{proprietaire.email}</p>
          )}
        </div>
      </div>
    )
  }

  const isComplete = quotitesTotal === 100
  const hasQuotites = quotites.length > 0

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-400" />
            Répartition de la propriété
          </h3>
          {isAdmin && !isComplete && (
            <Button
              onClick={() => setShowAddDialog(true)}
              className="bg-copper hover:bg-copper-dark"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un propriétaire
            </Button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Quotités attribuées</span>
            <span className={`font-semibold ${isComplete ? 'text-green' : 'text-orange-600'}`}>
              {quotitesTotal}%
            </span>
          </div>
          <Progress 
            value={quotitesTotal} 
            className={`h-3 ${isComplete ? 'bg-green/10' : 'bg-orange-100'}`}
          />
          {!isComplete && (
            <div className="flex items-center gap-2 text-sm text-orange-600">
              <AlertCircle className="w-4 h-4" />
              <span>Il reste {100 - quotitesTotal}% à attribuer</span>
            </div>
          )}
          {isComplete && (
            <div className="flex items-center gap-2 text-sm text-green">
              <CheckCircle className="w-4 h-4" />
              <span>La répartition est complète</span>
            </div>
          )}
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
          <div>
            <p className="text-sm text-gray-600">Nombre de propriétaires</p>
            <p className="text-2xl font-bold">{quotites.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Personnes physiques</p>
            <p className="text-2xl font-bold">
              {quotites.filter(q => q.proprietaire?.type === 'physique').length}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Personnes morales</p>
            <p className="text-2xl font-bold">
              {quotites.filter(q => q.proprietaire?.type === 'morale').length}
            </p>
          </div>
        </div>
      </Card>

      {/* Quotites Table */}
      {hasQuotites && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Liste des propriétaires</h3>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Propriétaire</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Quotité</TableHead>
                  <TableHead>Date d'acquisition</TableHead>
                  {isAdmin && <TableHead className="w-[70px]"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotites.map((quotite) => (
                  <TableRow key={quotite.id}>
                    <TableCell>
                      {renderProprietaireCell(quotite)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={quotite.proprietaire?.type === 'morale' ? 'default' : 'outline'}>
                        {quotite.proprietaire?.type === 'morale' ? 'Personne morale' : 'Personne physique'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-lg">
                          {formatPercent(quotite.pourcentage)}
                        </span>
                        <Progress value={quotite.pourcentage} className="w-20" />
                      </div>
                    </TableCell>
                    <TableCell>
                      {quotite.date_acquisition ? new Date(quotite.date_acquisition).toLocaleDateString('fr-FR') : '-'}
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => setDeleteModal({ isOpen: true, quotite })}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Retirer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {!hasQuotites && !isLoading && (
        <Card className="p-12 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucun propriétaire</h3>
          <p className="text-gray-600 mb-6">
            Cette propriété n'a pas encore de propriétaires assignés.
          </p>
          {isAdmin && (
            <Button
              onClick={() => setShowAddDialog(true)}
              className="bg-copper hover:bg-copper-dark"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter le premier propriétaire
            </Button>
          )}
        </Card>
      )}

      {/* Add Quotite Dialog */}
      {showAddDialog && (
        <QuotiteDialog
          proprieteId={proprieteId}
          currentTotal={quotitesTotal}
          onClose={() => setShowAddDialog(false)}
          onSuccess={() => {
            loadQuotites()
            setShowAddDialog(false)
          }}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, quotite: null })}
        onConfirm={handleDelete}
        title="Retirer le propriétaire"
        description={`Êtes-vous sûr de vouloir retirer ${
          deleteModal.quotite?.proprietaire?.type === 'physique'
            ? `${deleteModal.quotite.proprietaire.prenom || ''} ${deleteModal.quotite.proprietaire.nom || ''}`.trim()
            : deleteModal.quotite?.proprietaire?.nom || 'ce propriétaire'
        } de cette propriété ?`}
        confirmText="Retirer"
        variant="destructive"
      />
    </div>
  )
}