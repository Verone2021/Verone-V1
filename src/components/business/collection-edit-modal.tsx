/**
 * Modal d'édition de collection - Vérone Back Office
 */

'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { ButtonV2 } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Collection } from '@/hooks/use-collections'
import {
  COLLECTION_STYLE_OPTIONS,
  ROOM_CATEGORY_OPTIONS,
  CollectionStyle,
  RoomCategory
} from '@/types/collections'
import { RoomMultiSelect } from '@/components/ui/room-multi-select'
import type { RoomType } from '@/types/room-types'

interface CollectionEditModalProps {
  collection: Collection | null
  isOpen: boolean
  onClose: () => void
  onSave: (data: Partial<Collection>) => Promise<void>
}

export function CollectionEditModal({
  collection,
  isOpen,
  onClose,
  onSave,
}: CollectionEditModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: collection?.name || '',
    description: collection?.description || '',
    visibility: collection?.visibility || 'private',
    is_active: collection?.is_active ?? true,
    style: collection?.style || null,
    suitable_rooms: collection?.suitable_rooms || [],
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await onSave({
        id: collection?.id,
        ...formData,
      } as any)
      onClose()
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {collection ? 'Modifier la collection' : 'Nouvelle collection'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de la collection</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ex: Collection Printemps 2025"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Description de la collection..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="visibility">Visibilité</Label>
              <Select
                value={formData.visibility}
                onValueChange={(value: 'public' | 'private') =>
                  setFormData({ ...formData, visibility: value })
                }
              >
                <SelectTrigger id="visibility">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Privée</SelectItem>
                  <SelectItem value="public">Publique</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="style">Style décoratif</Label>
              <Select
                value={formData.style || ''}
                onValueChange={(value: CollectionStyle) =>
                  setFormData({ ...formData, style: value })
                }
              >
                <SelectTrigger id="style">
                  <SelectValue placeholder="Sélectionner un style" />
                </SelectTrigger>
                <SelectContent>
                  {COLLECTION_STYLE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="suitable_rooms">Pièces compatibles</Label>
              <p className="text-xs text-gray-600 mb-2">
                Sélectionnez les pièces où cette collection peut être utilisée
              </p>
              <RoomMultiSelect
                value={formData.suitable_rooms as RoomType[]}
                onChange={(rooms) =>
                  setFormData({ ...formData, suitable_rooms: rooms })
                }
                placeholder="Sélectionner les pièces compatibles..."
                className="w-full"
              />
              {formData.suitable_rooms.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {formData.suitable_rooms.length} pièce{formData.suitable_rooms.length > 1 ? 's' : ''} sélectionnée{formData.suitable_rooms.length > 1 ? 's' : ''}
                </p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="is_active" className="font-normal">
                Collection active
              </Label>
            </div>
          </div>

          <DialogFooter>
            <ButtonV2
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Annuler
            </ButtonV2>
            <ButtonV2
              type="submit"
              disabled={loading || !formData.name}
              className="bg-black text-white hover:bg-gray-800"
            >
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </ButtonV2>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}