"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { ProductPhotosModal } from './product-photos-modal'

interface ProductImagesModalProps {
  isOpen: boolean
  onClose: () => void
  product: any
  onUpdate: (updatedProduct: any) => void
}

export function ProductImagesModal({ isOpen, onClose, product, onUpdate }: ProductImagesModalProps) {
  return (
    <ProductPhotosModal
      isOpen={isOpen}
      onClose={onClose}
      productId={product.id}
      productName={product.name || "Produit"}
      productType="product"
    />
  )
}