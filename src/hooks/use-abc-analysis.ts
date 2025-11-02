import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'

// =============================================
// ABC ANALYSIS - CLASSIFICATION PARETO
// Inspiré de Odoo, ERPNext, SAP
// =============================================

// Classes ABC standard (Pareto 80/15/5)
export const ABC_CLASSES = [
  {
    id: 'A',
    label: 'Classe A',
    description: '80% de la valeur',
    threshold: 0.80, // 80% de la valeur cumulée
    color: 'bg-green-100',
    textColor: 'text-green-800',
    priority: 'Critique'
  },
  {
    id: 'B',
    label: 'Classe B',
    description: '15% de la valeur',
    threshold: 0.95, // 80% + 15% = 95%
    color: 'bg-blue-100',
    textColor: 'text-blue-800',
    priority: 'Important'
  },
  {
    id: 'C',
    label: 'Classe C',
    description: '5% de la valeur',
    threshold: 1.00, // 100%
    color: 'bg-gray-100',
    textColor: 'text-gray-800',
    priority: 'Faible'
  }
] as const

interface ProductWithABC {
  id: string
  name: string
  sku: string
  stock_quantity: number
  cost_price: number
  value: number
  cumulative_value: number
  cumulative_percentage: number
  abc_class: 'A' | 'B' | 'C'
  rank: number
}

interface ABCClassData {
  class_id: 'A' | 'B' | 'C'
  label: string
  description: string
  count: number
  quantity: number
  value: number
  percentage: number
  color: string
  textColor: string
  priority: string
}

export interface ABCReportData {
  summary: {
    total_products: number
    total_quantity: number
    total_value: number
    class_a_count: number
    class_b_count: number
    class_c_count: number
    class_a_value_percentage: number
    class_b_value_percentage: number
    class_c_value_percentage: number
  }
  classes: ABCClassData[]
  products_by_class: {
    A: ProductWithABC[]
    B: ProductWithABC[]
    C: ProductWithABC[]
  }
  top_20_high_value: ProductWithABC[]
  top_20_low_value: ProductWithABC[]
  generated_at: string
}

export function useABCAnalysis() {
  const [report, setReport] = useState<ABCReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const supabase = createClient()

  const generateReport = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // ============================================
      // QUERY: Récupérer tous les produits non archivés avec stock
      // ============================================
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, sku, stock_quantity, cost_price')
        .is('archived_at', null)
        .gt('stock_quantity', 0)

      if (productsError) throw productsError

      if (!products || products.length === 0) {
        toast({
          title: "Aucun produit",
          description: "Aucun produit en stock à analyser",
          variant: "default"
        })
        setReport(null)
        return null
      }

      // ============================================
      // CALCUL VALEUR ET TRI DÉCROISSANT PAR VALEUR
      // ============================================
      const productsWithValue = products
        .map(product => ({
          id: product.id,
          name: product.name || 'Sans nom',
          sku: product.sku || '',
          stock_quantity: product.stock_quantity || 0,
          cost_price: product.cost_price || 0,
          value: (product.stock_quantity || 0) * (product.cost_price || 0)
        }))
        .sort((a, b) => b.value - a.value) // Tri décroissant par valeur

      // Calcul valeur totale
      const totalValue = productsWithValue.reduce((sum, p) => sum + p.value, 0)

      if (totalValue === 0) {
        toast({
          title: "Valeur nulle",
          description: "La valeur totale du stock est nulle (cost_price manquant?)",
          variant: "default"
        })
        setReport(null)
        return null
      }

      // ============================================
      // CALCUL VALEURS CUMULÉES ET CLASSIFICATION ABC
      // ============================================
      let cumulativeValue = 0
      const productsWithABC: ProductWithABC[] = productsWithValue.map((product, index) => {
        cumulativeValue += product.value
        const cumulativePercentage = (cumulativeValue / totalValue) * 100

        // Déterminer la classe ABC selon Pareto
        let abcClass: 'A' | 'B' | 'C' = 'C'
        const cumulativeRatio = cumulativeValue / totalValue

        if (cumulativeRatio <= ABC_CLASSES[0].threshold) {
          abcClass = 'A' // 0-80%
        } else if (cumulativeRatio <= ABC_CLASSES[1].threshold) {
          abcClass = 'B' // 80-95%
        } else {
          abcClass = 'C' // 95-100%
        }

        return {
          ...product,
          cumulative_value: cumulativeValue,
          cumulative_percentage: cumulativePercentage,
          abc_class: abcClass,
          rank: index + 1
        }
      })

      // ============================================
      // CALCUL DES MÉTRIQUES PAR CLASSE
      // ============================================
      const classStats: ABCClassData[] = ABC_CLASSES.map(abcClass => {
        const productsInClass = productsWithABC.filter(p => p.abc_class === abcClass.id)

        const classValue = productsInClass.reduce((sum, p) => sum + p.value, 0)
        const classQuantity = productsInClass.reduce((sum, p) => sum + p.stock_quantity, 0)

        return {
          class_id: abcClass.id as 'A' | 'B' | 'C',
          label: abcClass.label,
          description: abcClass.description,
          count: productsInClass.length,
          quantity: classQuantity,
          value: classValue,
          percentage: totalValue > 0 ? (classValue / totalValue) * 100 : 0,
          color: abcClass.color,
          textColor: abcClass.textColor,
          priority: abcClass.priority
        }
      })

      // ============================================
      // GROUPEMENT PAR CLASSE
      // ============================================
      const productsByClass = {
        A: productsWithABC.filter(p => p.abc_class === 'A'),
        B: productsWithABC.filter(p => p.abc_class === 'B'),
        C: productsWithABC.filter(p => p.abc_class === 'C')
      }

      // ============================================
      // TOP 20 HAUTE/BASSE VALEUR
      // ============================================
      const top20HighValue = productsWithABC.slice(0, 20)
      const top20LowValue = [...productsWithABC]
        .reverse()
        .slice(0, 20)

      // ============================================
      // CALCUL DES MÉTRIQUES GLOBALES
      // ============================================
      const totalProducts = productsWithABC.length
      const totalQuantity = productsWithABC.reduce((sum, p) => sum + p.stock_quantity, 0)

      const classACounts = productsByClass.A.length
      const classBCounts = productsByClass.B.length
      const classCCounts = productsByClass.C.length

      const classAValue = productsByClass.A.reduce((sum, p) => sum + p.value, 0)
      const classBValue = productsByClass.B.reduce((sum, p) => sum + p.value, 0)
      const classCValue = productsByClass.C.reduce((sum, p) => sum + p.value, 0)

      // ============================================
      // CONSTRUCTION DU RAPPORT
      // ============================================
      const reportData: ABCReportData = {
        summary: {
          total_products: totalProducts,
          total_quantity: totalQuantity,
          total_value: totalValue,
          class_a_count: classACounts,
          class_b_count: classBCounts,
          class_c_count: classCCounts,
          class_a_value_percentage: totalValue > 0 ? (classAValue / totalValue) * 100 : 0,
          class_b_value_percentage: totalValue > 0 ? (classBValue / totalValue) * 100 : 0,
          class_c_value_percentage: totalValue > 0 ? (classCValue / totalValue) * 100 : 0
        },
        classes: classStats,
        products_by_class: productsByClass,
        top_20_high_value: top20HighValue,
        top_20_low_value: top20LowValue,
        generated_at: new Date().toISOString()
      }

      setReport(reportData)

      toast({
        title: "Rapport ABC généré",
        description: `${classACounts} produits classe A, ${classBCounts} classe B, ${classCCounts} classe C`,
        variant: "default"
      })

      return reportData

    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de la génération du rapport ABC'
      setError(errorMessage)
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive"
      })
      return null
    } finally {
      setLoading(false)
    }
  }, [supabase, toast])

  return {
    report,
    loading,
    error,
    generateReport
  }
}
