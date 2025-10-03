"use client"

import { useState } from 'react'
import { Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProductDuplicateModal } from './product-duplicate-modal'
import type { Database } from '@/lib/supabase/types'

type Product = Database['public']['Tables']['products']['Row']

interface ProductDuplicateButtonProps {
  product: Product
  variantType: string
  onSuccess?: (newProduct: Product) => void
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  showLabel?: boolean
}

export function ProductDuplicateButton({
  product,
  variantType,
  onSuccess,
  variant = 'outline',
  size = 'sm',
  showLabel = true
}: ProductDuplicateButtonProps) {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setModalOpen(true)}
      >
        <Copy className="h-4 w-4" />
        {showLabel && <span className="ml-2">Dupliquer</span>}
      </Button>

      <ProductDuplicateModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        sourceProduct={product}
        variantType={variantType}
        onSuccess={onSuccess}
      />
    </>
  )
}
