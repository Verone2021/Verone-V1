"use client"

import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

type ProductPackage = Database['public']['Tables']['product_packages']['Row']
type ProductPackageInsert = Database['public']['Tables']['product_packages']['Insert']

// Types selon business rules conditionnements-packages.md
export type PackageType = 'single' | 'pack' | 'bulk' | 'custom'

interface UseProductPackagesOptions {
  productId: string
  autoFetch?: boolean
}

export function useProductPackages({
  productId,
  autoFetch = true
}: UseProductPackagesOptions) {
  const [packages, setPackages] = useState<ProductPackage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  // 🎯 Fetch packages avec validation business rules
  const fetchPackages = useCallback(async () => {
    if (!productId || productId.trim() === '') {
      setPackages([])
      setLoading(false)
      setError(null)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('product_packages')
        .select('id, product_id, quantity, unit, unit_price, display_order, is_active, created_at, updated_at')
        .eq('product_id', productId)
        .eq('is_active', true)
        .order('display_order')
        .order('created_at')

      if (error) throw error

      console.log(`✅ ${data?.length || 0} packages chargés pour produit ${productId}`)
      setPackages((data || []) as any)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur chargement packages'
      console.error('❌ Erreur chargement packages:', errorMessage)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [productId, supabase])

  // 💰 Calcul prix package selon business rules
  const calculatePackagePrice = useCallback((
    basePrice: number,
    packageData: ProductPackage
  ): number => {
    // Mode manuel : prix unitaire spécifique défini
    if (packageData.unit_price_ht && packageData.unit_price_ht > 0) {
      return packageData.unit_price_ht * packageData.base_quantity
    }

    // Mode automatique : prix de base × quantité × (1 - remise)
    const grossPrice = basePrice * packageData.base_quantity
    const discount = packageData.discount_rate || 0
    const netPrice = grossPrice * (1 - discount)

    return Math.round(netPrice * 100) / 100 // Arrondi 2 décimales
  }, [])

  // 📊 Helpers business selon conditionnements-packages.md
  const getDefaultPackage = useCallback(() => {
    return packages.find(pkg => pkg.is_default) || packages[0] || null
  }, [packages])

  const getPackagesByType = useCallback((type: PackageType) => {
    return packages.filter(pkg => pkg.type === type)
  }, [packages])

  const getSinglePackage = useCallback(() => {
    return packages.find(pkg => pkg.type === 'single') || null
  }, [packages])

  const getPackPackages = useCallback(() => {
    return packages.filter(pkg => pkg.type === 'pack')
  }, [packages])

  const getBulkPackages = useCallback(() => {
    return packages.filter(pkg => pkg.type === 'bulk')
  }, [packages])

  // 💡 Business helpers avancés
  const getMaxDiscount = useCallback(() => {
    return Math.max(...packages.map(pkg => pkg.discount_rate || 0))
  }, [packages])

  const getBestValuePackage = useCallback((basePrice: number) => {
    if (packages.length === 0) return null

    return packages.reduce((best, current) => {
      const currentPricePerUnit = calculatePackagePrice(basePrice, current) / current.base_quantity
      const bestPricePerUnit = calculatePackagePrice(basePrice, best) / best.base_quantity

      return currentPricePerUnit < bestPricePerUnit ? current : best
    })
  }, [packages, calculatePackagePrice])

  // 🎨 Helpers pour UX
  const getDiscountLabel = useCallback((packageData: ProductPackage) => {
    const discount = packageData.discount_rate
    if (!discount || discount === 0) return null

    return `Jusqu'à -${Math.round(discount * 100)}%`
  }, [])

  // ✨ Auto-fetch
  useEffect(() => {
    if (autoFetch && productId && productId.trim() !== '') {
      console.log('🔄 Auto-fetch packages:', productId)
      fetchPackages()
    }
  }, [productId, fetchPackages, autoFetch])

  return {
    // 📊 Data
    packages,
    defaultPackage: getDefaultPackage(),
    singlePackage: getSinglePackage(),

    // 🔄 State
    loading,
    error,

    // 🎬 Actions
    fetchPackages,
    calculatePackagePrice,

    // 🛠️ Helpers business
    getPackagesByType,
    getPackPackages,
    getBulkPackages,
    getBestValuePackage,
    getDiscountLabel,

    // 📈 Stats
    totalPackages: packages.length,
    hasMultiplePackages: packages.length > 1,
    hasDiscounts: packages.some(pkg => (pkg.discount_rate || 0) > 0),
    maxDiscount: getMaxDiscount(),

    // 🎯 Business validation
    isValidPackageSystem: packages.length > 0 && packages.some(pkg => pkg.is_default && pkg.type === 'single')
  }
}