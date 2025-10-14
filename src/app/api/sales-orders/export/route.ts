import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { generateSalesOrdersExcel } from '@/lib/excel-utils'
import type { SalesOrder, SalesOrderStatus } from '@/types/sales-order'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Récupérer les filtres depuis le body
    const {
      activeTab,
      customerTypeFilter,
      periodFilter,
      searchTerm
    }: {
      activeTab: SalesOrderStatus | 'all'
      customerTypeFilter: 'all' | 'professional' | 'individual'
      periodFilter: 'all' | 'month' | 'quarter' | 'year'
      searchTerm: string
    } = await request.json()

    // Récupérer toutes les commandes
    const { data: ordersData, error } = await supabase
      .from('sales_orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    // Fetch relations (organisations + individual_customers)
    const ordersWithCustomers = await Promise.all(
      (ordersData || []).map(async order => {
        let customerData = null

        if (order.customer_type === 'organization' && order.customer_id) {
          const { data: org } = await supabase
            .from('organisations')
            .select('id, name, email, phone')
            .eq('id', order.customer_id)
            .single()
          customerData = { organisations: org }
        } else if (order.customer_type === 'individual' && order.customer_id) {
          const { data: individual } = await supabase
            .from('individual_customers')
            .select('id, first_name, last_name, email, phone')
            .eq('id', order.customer_id)
            .single()
          customerData = { individual_customers: individual }
        }

        return {
          ...order,
          ...customerData
        }
      })
    )

    // Appliquer les mêmes filtres que la page (cohérence totale)
    const filteredOrders = ordersWithCustomers.filter(order => {
      // Filtre onglet statut
      if (activeTab !== 'all' && order.status !== activeTab) return false

      // Filtre type client
      if (customerTypeFilter !== 'all') {
        if (customerTypeFilter === 'professional' && order.customer_type !== 'organization') return false
        if (customerTypeFilter === 'individual' && order.customer_type !== 'individual') return false
      }

      // Filtre période
      if (periodFilter !== 'all') {
        const orderDate = new Date(order.created_at)
        const now = new Date()

        switch (periodFilter) {
          case 'month':
            const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
            if (orderDate < monthAgo) return false
            break
          case 'quarter':
            const quarterAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
            if (orderDate < quarterAgo) return false
            break
          case 'year':
            const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
            if (orderDate < yearAgo) return false
            break
        }
      }

      // Filtre recherche (même logique normalizeString que page)
      if (searchTerm) {
        const normalizeString = (str: string | null | undefined): string => {
          if (!str) return ''
          return str
            .trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
        }

        const term = normalizeString(searchTerm)
        const matchesOrderNumber = normalizeString(order.order_number).includes(term)
        const matchesOrgName = normalizeString(order.organisations?.name).includes(term)
        const matchesIndividualName =
          normalizeString(order.individual_customers?.first_name).includes(term) ||
          normalizeString(order.individual_customers?.last_name).includes(term)

        if (!matchesOrderNumber && !matchesOrgName && !matchesIndividualName) return false
      }

      return true
    })

    // Calculer stats sur commandes filtrées
    const stats = filteredOrders.reduce(
      (acc, order) => {
        acc.total_orders++
        acc.total_ht += order.total_ht || 0
        acc.total_ttc += order.total_ttc || 0

        if (order.status === 'draft' || order.status === 'confirmed') {
          acc.pending_orders++
        } else if (order.status === 'shipped' || order.status === 'partially_shipped') {
          acc.shipped_orders++
        }

        return acc
      },
      {
        total_orders: 0,
        total_ht: 0,
        total_ttc: 0,
        total_tva: 0,
        average_basket: 0,
        pending_orders: 0,
        shipped_orders: 0
      }
    )

    stats.total_tva = stats.total_ttc - stats.total_ht
    stats.average_basket = stats.total_orders > 0 ? stats.total_ttc / stats.total_orders : 0

    // Générer fichier Excel
    const excelBuffer = await generateSalesOrdersExcel(filteredOrders as SalesOrder[], stats)

    // Retourner fichier avec headers appropriés
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="commandes-clients-${new Date().toISOString().split('T')[0]}.xlsx"`
      }
    })
  } catch (error) {
    console.error('Erreur génération Excel:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la génération du fichier Excel' },
      { status: 500 }
    )
  }
}
