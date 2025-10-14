/**
 * 📄 API Route - Génération PDF Commande Client
 *
 * Endpoint: GET /api/sales-orders/[id]/pdf
 *
 * Fonctionnalités:
 * - Récupération commande + items depuis Supabase
 * - Génération PDF avec jsPDF + jspdf-autotable
 * - Authentification via createServerClient (JWT cookies)
 * - Headers appropriés pour téléchargement PDF
 *
 * Date: 2025-10-14
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { generateSalesOrderPDF } from '@/lib/pdf-utils'
import type { SalesOrder, SalesOrderItem } from '@/hooks/use-sales-orders'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient()
    const { id: orderId } = await params

    // ============ AUTHENTICATION ============
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié - JWT manquant' },
        { status: 401 }
      )
    }

    // ============ FETCH ORDER ============
    const { data: orderData, error: orderError } = await supabase
      .from('sales_orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError || !orderData) {
      console.error('[PDF API] Erreur fetch order:', orderError)
      return NextResponse.json(
        { error: 'Commande non trouvée' },
        { status: 404 }
      )
    }

    // ============ FETCH CUSTOMER DATA (polymorphic) ============
    let customerData = null
    if (orderData.customer_type === 'organization' && orderData.customer_id) {
      const { data: org } = await supabase
        .from('organisations')
        .select('id, name, email, phone, address_line1, address_line2, postal_code, city')
        .eq('id', orderData.customer_id)
        .single()
      customerData = { organisations: org }
    } else if (orderData.customer_type === 'individual' && orderData.customer_id) {
      const { data: individual } = await supabase
        .from('individual_customers')
        .select('id, first_name, last_name, email, phone')
        .eq('id', orderData.customer_id)
        .single()
      customerData = { individual_customers: individual }
    }

    // Merge customer data
    const orderWithCustomer = {
      ...orderData,
      ...customerData
    }

    // ============ FETCH ITEMS ============
    const { data: itemsData, error: itemsError } = await supabase
      .from('sales_order_items')
      .select(`
        *,
        products (
          id,
          name,
          sku
        )
      `)
      .eq('sales_order_id', orderId)
      .order('created_at', { ascending: true })

    if (itemsError) {
      console.error('[PDF API] Erreur fetch items:', itemsError)
      return NextResponse.json(
        { error: 'Erreur récupération items' },
        { status: 500 }
      )
    }

    // ============ SERIALIZE DATA FOR PDF ============
    const order: SalesOrder = {
      id: String(orderWithCustomer.id),
      order_number: orderWithCustomer.order_number,
      customer_id: orderWithCustomer.customer_id ? String(orderWithCustomer.customer_id) : null,
      customer_type: orderWithCustomer.customer_type,
      status: orderWithCustomer.status,
      currency: orderWithCustomer.currency || 'EUR',
      tax_rate: orderWithCustomer.tax_rate || 0.2,
      total_ht: orderWithCustomer.total_ht || 0,
      total_ttc: orderWithCustomer.total_ttc || 0,
      expected_delivery_date: orderWithCustomer.expected_delivery_date ? String(orderWithCustomer.expected_delivery_date) : undefined,
      payment_terms: orderWithCustomer.payment_terms || undefined,
      notes: orderWithCustomer.notes || undefined,
      created_by: String(orderWithCustomer.created_by),
      created_at: String(orderWithCustomer.created_at),
      updated_at: String(orderWithCustomer.updated_at),
      organisations: orderWithCustomer.organisations ? {
        id: String(orderWithCustomer.organisations.id),
        name: orderWithCustomer.organisations.name || '',
        email: orderWithCustomer.organisations.email || undefined,
        phone: orderWithCustomer.organisations.phone || undefined,
        address_line1: orderWithCustomer.organisations.address_line1 || undefined,
        address_line2: orderWithCustomer.organisations.address_line2 || undefined,
        postal_code: orderWithCustomer.organisations.postal_code || undefined,
        city: orderWithCustomer.organisations.city || undefined,
      } : undefined,
      individual_customers: orderWithCustomer.individual_customers ? {
        id: String(orderWithCustomer.individual_customers.id),
        first_name: orderWithCustomer.individual_customers.first_name || '',
        last_name: orderWithCustomer.individual_customers.last_name || '',
        email: orderWithCustomer.individual_customers.email || undefined,
        phone: orderWithCustomer.individual_customers.phone || undefined,
      } : undefined,
    }

    const items: SalesOrderItem[] = (itemsData || []).map(item => ({
      id: String(item.id),
      sales_order_id: String(item.sales_order_id),
      product_id: String(item.product_id),
      quantity: item.quantity,
      unit_price_ht: item.unit_price_ht,
      tax_rate: item.tax_rate || 0.2,
      discount_percentage: item.discount_percentage || 0,
      total_ht: item.total_ht,
      quantity_shipped: item.quantity_shipped || 0,
      created_at: String(item.created_at),
      updated_at: String(item.updated_at),
      products: item.products ? {
        id: String(item.products.id),
        name: item.products.name || 'Produit',
        sku: item.products.sku || 'N/A',
      } : undefined,
    }))

    // ============ GENERATE PDF with jsPDF ============
    console.log('[PDF API] Génération PDF jsPDF pour commande:', order.order_number)

    try {
      const pdfBuffer = generateSalesOrderPDF(order, items)

      // ============ RETURN PDF ============
      const fileName = `commande-${order.order_number}-${new Date().toISOString().split('T')[0]}.pdf`

      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Content-Length': pdfBuffer.length.toString(),
        },
      })
    } catch (pdfError) {
      console.error('[PDF API] Erreur génération PDF jsPDF:', pdfError)
      return NextResponse.json(
        { error: 'Erreur génération PDF' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('[PDF API] Exception globale:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}
