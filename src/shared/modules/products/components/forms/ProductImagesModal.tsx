"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ButtonV2 } from '@/components/ui/button'
// import { ProductPhotosModal } from './product-photos-modal' // Fichier non trouvé après migration

interface ProductImagesModalProps {
  isOpen: boolean
  onClose: () => void
  product: any
  onUpdate: (updatedProduct: any) => void
}

export function ProductImagesModal({ isOpen, onClose, product, onUpdate }: ProductImagesModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gestion des Images</DialogTitle>
        </DialogHeader>
        <div className="text-center py-8 text-gray-500">
          Composant ProductPhotosModal en cours de migration...
        </div>
        <ButtonV2 onClick={onClose} className="mt-4">Fermer</ButtonV2>
      </DialogContent>
    </Dialog>
  )
}