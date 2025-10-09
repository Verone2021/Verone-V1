/**
 * Hook React: Pricing Intelligent Multi-Canaux & Clients - V2
 *
 * Gestion complète du calcul de prix avec waterfall priorités:
 * 1. Prix contrat client spécifique → PRIORITÉ MAX
 * 2. Prix groupe client (B2B Gold, VIP, etc.) → HAUTE PRIORITÉ
 * 3. Prix canal de vente (Retail, Wholesale, B2B) → PRIORITÉ NORMALE
 * 4. Prix catalogue base → FALLBACK
 *
 * Features:
 * - Cache intelligent avec React Query
 * - Support batch pricing (plusieurs produits)
 * - Support paliers quantités natifs
 * - Support listes de prix avec priorités
 * - Invalidation automatique cache
 * - Types TypeScript stricts
 * - Error handling complet
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { logger } from '@/lib/logger'

// =====================================================================
// TYPES - Version 2.0 (Price Lists System)
// =====================================================================

export interface PricingResultV2 {
  price_ht: number
  original_price: number
  discount_rate: number | null
  price_list_id: string
  price_list_name: string
  price_source: 'customer_specific' | 'customer_group' | 'channel' | 'base_catalog'
  min_quantity: number
  max_quantity: number | null
  currency: string
  margin_rate: number | null
  notes: string | null
}

// Type legacy pour compatibilité (mapping vers PricingResultV2)
export interface PricingResult {
  final_price_ht: number
  pricing_source: 'customer_specific' | 'customer_group' | 'channel' | 'base_catalog'
  discount_applied: number
  original_price_ht: number
}

export interface PricingParams {
  productId: string
  customerId?: string
  customerType?: 'organization' | 'individual'
  channelId?: string
  quantity?: number
  date?: string  // YYYY-MM-DD format
}

export interface BatchPricingRequest {
  items: PricingParams[]
}

export interface BatchPricingResult {
  productId: string
  pricing: PricingResult | null
  error?: string
}

// =====================================================================
// HOOK: useProductPrice (Single Product)
// =====================================================================

export function useProductPrice(params: PricingParams) {
  const supabase = createClientComponentClient()

  return useQuery({
    queryKey: ['pricing-v2', params],
    queryFn: async (): Promise<PricingResult> => {
      try {
        // IMPORTANT: Utiliser calculate_product_price_v2 (nouvelle architecture Price Lists)
        const { data, error } = await supabase.rpc('calculate_product_price_v2', {
          p_product_id: params.productId,
          p_quantity: params.quantity || 1,
          p_channel_id: params.channelId || null,
          p_customer_id: params.customerId || null,
          p_customer_type: params.customerType || null,
          p_date: params.date || new Date().toISOString().split('T')[0]
        })

        if (error) {
          logger.error('Failed to calculate product price', {
            operation: 'useProductPrice',
            error: error.message,
            params
          })
          throw new Error(`Pricing calculation failed: ${error.message}`)
        }

        if (!data || data.length === 0) {
          throw new Error('No pricing data returned')
        }

        // Fonction RPC retourne un array avec 1 élément (PricingResultV2)
        const resultV2 = data[0] as PricingResultV2

        // Mapper vers format legacy pour compatibilité
        const result: PricingResult = {
          final_price_ht: resultV2.price_ht,
          pricing_source: resultV2.price_source,
          discount_applied: resultV2.discount_rate || 0,
          original_price_ht: resultV2.original_price
        }

        logger.info('Product price calculated successfully (V2)', {
          operation: 'useProductPrice',
          productId: params.productId,
          finalPrice: result.final_price_ht,
          source: result.pricing_source,
          priceList: resultV2.price_list_name
        })

        return result
      } catch (error) {
        logger.error('Exception in useProductPrice', {
          operation: 'useProductPrice',
          error: error instanceof Error ? error.message : String(error),
          params
        })
        throw error
      }
    },
    enabled: !!params.productId,
    staleTime: 5 * 60 * 1000,  // 5 minutes cache
    cacheTime: 10 * 60 * 1000  // 10 minutes retention
  })
}

// =====================================================================
// HOOK: useBatchPricing (Multiple Products)
// =====================================================================

export function useBatchPricing() {
  const supabase = createClientComponentClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (request: BatchPricingRequest): Promise<BatchPricingResult[]> => {
      try {
        logger.info('Batch pricing calculation started (V2)', {
          operation: 'useBatchPricing',
          itemsCount: request.items.length
        })

        // Calcul parallèle pour performance
        const results = await Promise.all(
          request.items.map(async (params): Promise<BatchPricingResult> => {
            try {
              // IMPORTANT: Utiliser calculate_product_price_v2
              const { data, error } = await supabase.rpc('calculate_product_price_v2', {
                p_product_id: params.productId,
                p_quantity: params.quantity || 1,
                p_channel_id: params.channelId || null,
                p_customer_id: params.customerId || null,
                p_customer_type: params.customerType || null,
                p_date: params.date || new Date().toISOString().split('T')[0]
              })

              if (error) {
                return {
                  productId: params.productId,
                  pricing: null,
                  error: error.message
                }
              }

              // Mapper résultat V2 vers legacy
              const resultV2 = data?.[0] as PricingResultV2
              if (resultV2) {
                const pricing: PricingResult = {
                  final_price_ht: resultV2.price_ht,
                  pricing_source: resultV2.price_source,
                  discount_applied: resultV2.discount_rate || 0,
                  original_price_ht: resultV2.original_price
                }
                return {
                  productId: params.productId,
                  pricing
                }
              }

              return {
                productId: params.productId,
                pricing: null
              }
            } catch (err) {
              return {
                productId: params.productId,
                pricing: null,
                error: err instanceof Error ? err.message : String(err)
              }
            }
          })
        )

        const successCount = results.filter(r => r.pricing !== null).length
        const failureCount = results.filter(r => r.error).length

        logger.info('Batch pricing calculation completed (V2)', {
          operation: 'useBatchPricing',
          total: results.length,
          success: successCount,
          failed: failureCount
        })

        return results
      } catch (error) {
        logger.error('Exception in useBatchPricing', {
          operation: 'useBatchPricing',
          error: error instanceof Error ? error.message : String(error)
        })
        throw error
      }
    },
    onSuccess: (results) => {
      // Invalider cache des produits concernés (queryKey V2)
      results.forEach(result => {
        queryClient.invalidateQueries({ queryKey: ['pricing-v2', { productId: result.productId }] })
      })
    }
  })
}

// =====================================================================
// HOOK: useSalesChannels (Liste des Canaux)
// =====================================================================

export interface SalesChannel {
  id: string
  code: string
  name: string
  description: string | null
  default_discount_rate: number | null
  is_active: boolean
  requires_approval: boolean
  min_order_value: number | null
  display_order: number
  icon_name: string | null
}

export function useSalesChannels() {
  const supabase = createClientComponentClient()

  return useQuery({
    queryKey: ['sales-channels'],
    queryFn: async (): Promise<SalesChannel[]> => {
      try {
        const { data, error } = await supabase
          .from('sales_channels')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true })

        if (error) {
          logger.error('Failed to fetch sales channels', {
            operation: 'useSalesChannels',
            error: error.message
          })
          throw error
        }

        logger.info('Sales channels fetched successfully', {
          operation: 'useSalesChannels',
          count: data?.length || 0
        })

        return data || []
      } catch (error) {
        logger.error('Exception in useSalesChannels', {
          operation: 'useSalesChannels',
          error: error instanceof Error ? error.message : String(error)
        })
        throw error
      }
    },
    staleTime: 10 * 60 * 1000,  // 10 minutes (canaux changent rarement)
    cacheTime: 30 * 60 * 1000   // 30 minutes retention
  })
}

// =====================================================================
// HOOK: useChannelPricing (Prix Produit par Canal)
// =====================================================================

export interface ChannelPricing {
  id: string
  product_id: string
  channel_id: string
  custom_price_ht: number | null
  discount_rate: number | null
  markup_rate: number | null
  min_quantity: number
  valid_from: string | null
  valid_until: string | null
  is_active: boolean
  notes: string | null
}

export function useChannelPricing(productId: string) {
  const supabase = createClientComponentClient()

  return useQuery({
    queryKey: ['channel-pricing', productId],
    queryFn: async (): Promise<ChannelPricing[]> => {
      try {
        const { data, error } = await supabase
          .from('channel_pricing')
          .select(`
            *,
            sales_channels (code, name)
          `)
          .eq('product_id', productId)
          .eq('is_active', true)
          .order('min_quantity', { ascending: true })

        if (error) {
          logger.error('Failed to fetch channel pricing', {
            operation: 'useChannelPricing',
            productId,
            error: error.message
          })
          throw error
        }

        logger.info('Channel pricing fetched successfully', {
          operation: 'useChannelPricing',
          productId,
          count: data?.length || 0
        })

        return data || []
      } catch (error) {
        logger.error('Exception in useChannelPricing', {
          operation: 'useChannelPricing',
          error: error instanceof Error ? error.message : String(error)
        })
        throw error
      }
    },
    enabled: !!productId,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000
  })
}

// =====================================================================
// HOOK: useCustomerPricing (Prix Client Spécifique)
// =====================================================================

export interface CustomerPricing {
  id: string
  customer_id: string
  customer_type: 'organization' | 'individual'
  product_id: string
  custom_price_ht: number | null
  discount_rate: number | null
  contract_reference: string | null
  min_quantity: number
  valid_from: string
  valid_until: string | null
  is_active: boolean
  approval_status: 'pending' | 'approved' | 'rejected'
  notes: string | null
}

export function useCustomerPricing(customerId: string, customerType: 'organization' | 'individual') {
  const supabase = createClientComponentClient()

  return useQuery({
    queryKey: ['customer-pricing', customerId, customerType],
    queryFn: async (): Promise<CustomerPricing[]> => {
      try {
        const { data, error } = await supabase
          .from('customer_pricing')
          .select('*')
          .eq('customer_id', customerId)
          .eq('customer_type', customerType)
          .eq('is_active', true)
          .eq('approval_status', 'approved')
          .order('valid_from', { ascending: false })

        if (error) {
          logger.error('Failed to fetch customer pricing', {
            operation: 'useCustomerPricing',
            customerId,
            customerType,
            error: error.message
          })
          throw error
        }

        logger.info('Customer pricing fetched successfully', {
          operation: 'useCustomerPricing',
          customerId,
          count: data?.length || 0
        })

        return data || []
      } catch (error) {
        logger.error('Exception in useCustomerPricing', {
          operation: 'useCustomerPricing',
          error: error instanceof Error ? error.message : String(error)
        })
        throw error
      }
    },
    enabled: !!customerId,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000
  })
}

// =====================================================================
// UTILITY: Format Price Display
// =====================================================================

export function formatPrice(
  price: number,
  currency: string = 'EUR',
  locale: string = 'fr-FR'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price)
}

// =====================================================================
// UTILITY: Calculate Discount Percentage
// =====================================================================

export function calculateDiscountPercentage(
  originalPrice: number,
  finalPrice: number
): number {
  if (originalPrice === 0) return 0
  return Math.round(((originalPrice - finalPrice) / originalPrice) * 100)
}

// =====================================================================
// UTILITY: Invalidate Pricing Cache
// =====================================================================

export function useInvalidatePricing() {
  const queryClient = useQueryClient()

  return {
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-v2'] })
      queryClient.invalidateQueries({ queryKey: ['channel-pricing'] })
      queryClient.invalidateQueries({ queryKey: ['customer-pricing'] })
      logger.info('All pricing caches invalidated (V2)', {
        operation: 'invalidatePricing'
      })
    },
    invalidateProduct: (productId: string) => {
      queryClient.invalidateQueries({ queryKey: ['pricing-v2', { productId }] })
      queryClient.invalidateQueries({ queryKey: ['channel-pricing', productId] })
      logger.info('Product pricing cache invalidated (V2)', {
        operation: 'invalidatePricing',
        productId
      })
    },
    invalidateCustomer: (customerId: string) => {
      queryClient.invalidateQueries({ queryKey: ['customer-pricing', customerId] })
      logger.info('Customer pricing cache invalidated (V2)', {
        operation: 'invalidatePricing',
        customerId
      })
    }
  }
}
