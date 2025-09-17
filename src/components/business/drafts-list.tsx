'use client'

import { useState } from 'react'
import { useDrafts, DraftWithMeta } from '../../hooks/use-drafts'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { Pencil, Copy, Trash2, FileText, Plus, ImageIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'

interface DraftsListProps {
  onCreateNew?: () => void
  onEditDraft?: (draftId: string) => void
}

export function DraftsList({ onCreateNew, onEditDraft }: DraftsListProps) {
  const { drafts, loading, error, deleteDraft, duplicateDraft, stats } = useDrafts()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const router = useRouter()

  const handleEdit = (draft: DraftWithMeta) => {
    onEditDraft?.(draft.id)
  }

  const handleDelete = async (draftId: string) => {
    try {
      setActionLoading(draftId)
      await deleteDraft(draftId)
      setDeleteDialogOpen(false)
      setSelectedDraftId(null)
    } catch (error) {
      console.error('Erreur suppression:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDuplicate = async (draftId: string) => {
    try {
      setActionLoading(draftId)
      await duplicateDraft(draftId)
    } catch (error) {
      console.error('Erreur duplication:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusBadge = (draft: DraftWithMeta) => {
    if (draft.canFinalize) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Prêt à finaliser</Badge>
    }
    if (draft.wizard_step_completed > 0) {
      return <Badge variant="secondary">En cours</Badge>
    }
    return <Badge variant="outline">Nouveau</Badge>
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-2">Chargement des brouillons...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-red-600">
            <p>Erreur lors du chargement des brouillons : {error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-gray-600">Total brouillons</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.readyToFinalize}</div>
            <div className="text-sm text-gray-600">Prêts à finaliser</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
            <div className="text-sm text-gray-600">En cours</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{stats.recent}</div>
            <div className="text-sm text-gray-600">Modifiés récemment</div>
          </CardContent>
        </Card>
      </div>

      {/* Drafts List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Mes brouillons ({drafts.length})
            </CardTitle>
            {onCreateNew && (
              <Button onClick={onCreateNew} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau produit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {drafts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun brouillon trouvé</p>
              <p className="text-sm">Commencez par créer un nouveau produit</p>
            </div>
          ) : (
            <div className="space-y-4">
              {drafts.map((draft) => (
                <div
                  key={draft.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Image Column */}
                    <div className="flex-shrink-0 w-16 h-16">
                      {draft.primary_image_url ? (
                        <img
                          src={draft.primary_image_url}
                          alt={draft.name || 'Image produit'}
                          className="w-full h-full object-cover rounded-lg border"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 border rounded-lg flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Content Column */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold truncate">
                          {draft.name || 'Produit sans nom'}
                        </h3>
                        {getStatusBadge(draft)}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                        <div>
                          <span className="font-medium">SKU:</span> {draft.sku || 'Non défini'}
                        </div>
                        <div>
                          <span className="font-medium">Prix fournisseur:</span> {
                            draft.supplier_price ? `${draft.supplier_price}€ HT` : 'Non défini'
                          }
                        </div>
                        <div>
                          <span className="font-medium">Modifié:</span> {draft.lastModified}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm text-gray-600">Progression:</span>
                        <Progress value={draft.progressPercentage} className="flex-1 max-w-xs" />
                        <span className="text-sm font-medium">{draft.progressPercentage}%</span>
                      </div>

                      {/* Missing Fields Display */}
                      {draft.missingFields && draft.missingFields.length > 0 && (
                        <div className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                          <span className="font-medium">Champs manquants:</span> {draft.missingFields.join(', ')}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(draft)}
                        disabled={actionLoading === draft.id}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDuplicate(draft.id)}
                        disabled={actionLoading === draft.id}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedDraftId(draft.id)
                          setDeleteDialogOpen(true)
                        }}
                        disabled={actionLoading === draft.id}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le brouillon</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer ce brouillon ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button
              onClick={() => selectedDraftId && handleDelete(selectedDraftId)}
              disabled={actionLoading === selectedDraftId}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}