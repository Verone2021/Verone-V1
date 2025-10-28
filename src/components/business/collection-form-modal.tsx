'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ButtonV2 } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { X, Tag, Plus } from 'lucide-react'
import { cn } from '../../lib/utils'
import type { Collection, CreateCollectionData } from '../../hooks/use-collections'
import type { RoomCategory, CollectionStyle } from '../../types/collections'
import { RoomMultiSelect } from '@/components/ui/room-multi-select'
import type { RoomType } from '../../types/room-types'
import { CollectionImageUpload } from './collection-image-upload'
import {
  ComponentInstanceIcon,
  DesktopIcon,
  RocketIcon,
  FrameIcon,
  GearIcon,
  ReaderIcon,
  SewingPinIcon,
  DrawingPinIcon
} from '@radix-ui/react-icons'

const COLLECTION_STYLES: { value: CollectionStyle; label: string; description: string; icon: string }[] = [
  { value: 'minimaliste', label: 'Minimaliste', description: 'Épuré et fonctionnel', icon: '⬜' },
  { value: 'contemporain', label: 'Contemporain', description: 'Moderne et actuel', icon: '🏙️' },
  { value: 'moderne', label: 'Moderne', description: 'Design avant-gardiste', icon: '🚀' },
  { value: 'scandinave', label: 'Scandinave', description: 'Chaleureux et lumineux', icon: '🌲' },
  { value: 'industriel', label: 'Industriel', description: 'Brut et authentique', icon: '⚙️' },
  { value: 'classique', label: 'Classique', description: 'Intemporel et élégant', icon: '👑' },
  { value: 'boheme', label: 'Bohème', description: 'Libre et éclectique', icon: '🌺' },
  { value: 'art_deco', label: 'Art Déco', description: 'Raffiné et géométrique', icon: '💎' },
]

const ROOM_CATEGORIES: { value: RoomCategory; label: string; icon: string }[] = [
  { value: 'chambre', label: 'Chambre', icon: '🛏️' },
  { value: 'wc_salle_bain', label: 'WC / Salle de bain', icon: '🚿' },
  { value: 'salon', label: 'Salon', icon: '🛋️' },
  { value: 'cuisine', label: 'Cuisine', icon: '🍽️' },
  { value: 'bureau', label: 'Bureau', icon: '💼' },
  { value: 'salle_a_manger', label: 'Salle à manger', icon: '🍷' },
  { value: 'entree', label: 'Entrée', icon: '🚪' },
  { value: 'plusieurs_pieces', label: 'Plusieurs pièces', icon: '🏠' },
  { value: 'exterieur_balcon', label: 'Extérieur - Balcon', icon: '🌿' },
  { value: 'exterieur_jardin', label: 'Extérieur - Jardin', icon: '🌳' },
]

interface CollectionFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateCollectionData) => Promise<void>
  collection?: Collection
  mode: 'create' | 'edit'
}

export function CollectionFormModal({
  isOpen,
  onClose,
  onSubmit,
  collection,
  mode
}: CollectionFormModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [style, setStyle] = useState<CollectionStyle | undefined>()
  const [suitableRooms, setSuitableRooms] = useState<RoomType[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')
  const [visibility, setVisibility] = useState<'public' | 'private'>('private')
  const [isActive, setIsActive] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (collection && mode === 'edit') {
      setName(collection.name)
      setDescription(collection.description || '')
      setStyle(collection.style)
      setSuitableRooms((collection.suitable_rooms || []) as RoomType[])
      setTags(collection.theme_tags || [])
      setVisibility(collection.visibility)
      setIsActive(collection.is_active)
    } else {
      setName('')
      setDescription('')
      setStyle(undefined)
      setSuitableRooms([])
      setTags([])
      setVisibility('private')
      setIsActive(true)
    }
  }, [collection, mode, isOpen])

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsSubmitting(true)
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        style,
        suitable_rooms: suitableRooms.length > 0 ? suitableRooms : undefined,
        theme_tags: tags,
        visibility,
        is_active: isActive,
      })
      onClose()
    } catch (error) {
      console.error('Erreur lors de la soumission:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Nouvelle collection' : 'Modifier la collection'}
          </DialogTitle>
          <DialogDescription>
            Créez une collection thématique pour organiser vos produits par style et destination
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations de base */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-sm font-medium">
                Nom de la collection *
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Collection Scandinave Salon 2025"
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-sm font-medium">
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez l'ambiance et les caractéristiques de cette collection..."
                rows={3}
                className="mt-1"
              />
            </div>

            {/* Image de couverture - ALIGNÉE SUR LARGEUR FORMULAIRE */}
            <div>
              <Label className="text-sm font-medium">Image de couverture</Label>
              <div className="mt-2 w-full">
                <CollectionImageUpload
                  collectionId={collection?.id || ''}
                  onImageUpload={(imageId, publicUrl) => {
                    console.log('✅ Image collection uploadée:', imageId)
                  }}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Style - UNE SEULE FOIS */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Style décoratif</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {COLLECTION_STYLES.map((styleOption) => (
                <button
                  key={styleOption.value}
                  type="button"
                  onClick={() => setStyle(style === styleOption.value ? undefined : styleOption.value)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-lg border-2 text-center transition-all",
                    style === styleOption.value
                      ? "border-black bg-black text-white shadow-md"
                      : "border-gray-300 hover:border-gray-400 hover:shadow-sm"
                  )}
                >
                  <div className="text-2xl mb-1">{styleOption.icon}</div>
                  <div className="space-y-1">
                    <div className="font-medium text-sm">{styleOption.label}</div>
                    <div className={cn(
                      "text-xs",
                      style === styleOption.value ? "text-gray-200" : "text-gray-500"
                    )}>
                      {styleOption.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Pièces compatibles - IDENTIQUE À VARIANT GROUPS */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Pièces de la maison compatibles
            </Label>
            <p className="text-xs text-gray-600">
              Sélectionnez les pièces où cette collection peut être utilisée
            </p>
            <RoomMultiSelect
              value={suitableRooms}
              onChange={setSuitableRooms}
              placeholder="Sélectionner les pièces compatibles..."
              className="w-full"
            />
            {suitableRooms.length > 0 && (
              <p className="text-xs text-gray-600">
                {suitableRooms.length} pièce{suitableRooms.length > 1 ? 's' : ''} sélectionnée{suitableRooms.length > 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Tags personnalisés */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Tags personnalisés</Label>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddTag()
                  }
                }}
                placeholder="Ex: Eco-responsable, Petit espace..."
              />
              <ButtonV2
                type="button"
                variant="outline"
                onClick={handleAddTag}
                disabled={!newTag.trim()}
              >
                <Plus className="h-4 w-4" />
              </ButtonV2>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="pl-2 pr-1">
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Paramètres */}
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Visibilité</Label>
                <p className="text-xs text-gray-600">Publique ou privée</p>
              </div>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as 'public' | 'private')}
                className="border border-gray-300 rounded px-3 py-2"
              >
                <option value="private">Privée</option>
                <option value="public">Publique</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Statut</Label>
                <p className="text-xs text-gray-600">Active ou inactive</p>
              </div>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                  isActive ? "bg-black" : "bg-gray-300"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    isActive ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </button>
            </div>
          </div>

          <DialogFooter>
            <ButtonV2
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Annuler
            </ButtonV2>
            <ButtonV2
              type="submit"
              disabled={!name.trim() || isSubmitting}
              className="bg-black text-white hover:bg-gray-800"
            >
              {isSubmitting ? 'Enregistrement...' : mode === 'create' ? 'Créer' : 'Enregistrer'}
            </ButtonV2>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}