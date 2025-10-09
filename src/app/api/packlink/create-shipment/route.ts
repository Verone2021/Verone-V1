import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const PACKLINK_API_KEY = '03df0c0d63fc1038eac7bf0964b2190b57460810d1025a38e4a54de57e804346'
const PACKLINK_API_URL = 'https://api.packlink.com/v1'

interface ParcelData {
  weight_kg: number
  length_cm: number
  width_cm: number
  height_cm: number
  items: {
    orderItemId: string
    quantity: number
  }[]
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Authentification requise
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { salesOrderId, parcels, costCharged } = body as {
      salesOrderId: string
      parcels: ParcelData[]
      costCharged: number
    }

    // 1. Récupérer les infos de la commande
    const { data: order, error: orderError } = await supabase
      .from('sales_orders')
      .select(`
        *,
        organisations (
          id, name, email, phone,
          address_line1, address_line2, postal_code, city
        ),
        individual_customers (
          id, first_name, last_name, email, phone,
          address_line1, address_line2, postal_code, city
        )
      `)
      .eq('id', salesOrderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Commande introuvable' },
        { status: 404 }
      )
    }

    // 2. Préparer adresse destinataire
    let recipientAddress
    let recipientName
    let recipientEmail
    let recipientPhone

    if (order.customer_type === 'organization' && (order as any).organisations) {
      const org = (order as any).organisations
      recipientName = org.name
      recipientEmail = org.email || ''
      recipientPhone = org.phone || ''
      recipientAddress = {
        street1: org.address_line1 || '',
        street2: org.address_line2 || '',
        zip_code: org.postal_code || '',
        city: org.city || '',
        country: 'FR'
      }
    } else if (order.customer_type === 'individual' && (order as any).individual_customers) {
      const indiv = (order as any).individual_customers
      recipientName = `${indiv.first_name} ${indiv.last_name}`
      recipientEmail = indiv.email || ''
      recipientPhone = indiv.phone || ''
      recipientAddress = {
        street1: indiv.address_line1 || '',
        street2: indiv.address_line2 || '',
        zip_code: indiv.postal_code || '',
        city: indiv.city || '',
        country: 'FR'
      }
    } else {
      return NextResponse.json(
        { error: 'Adresse client manquante' },
        { status: 400 }
      )
    }

    // 3. Préparer données Packlink
    const packlinkPayload = {
      from: {
        name: "Vérone Décoration", // TODO: Récupérer depuis config
        surname: "",
        company: "Vérone",
        email: "contact@verone.com", // TODO: Config
        phone: "+33123456789", // TODO: Config
        street1: "123 Rue Example", // TODO: Warehouse address
        zip_code: "75001",
        city: "Paris",
        country: "FR"
      },
      to: {
        name: recipientName,
        surname: "",
        email: recipientEmail,
        phone: recipientPhone,
        street1: recipientAddress.street1,
        street2: recipientAddress.street2 || "",
        zip_code: recipientAddress.zip_code,
        city: recipientAddress.city,
        country: recipientAddress.country
      },
      packages: parcels.map((p) => ({
        weight: p.weight_kg,
        length: p.length_cm,
        width: p.width_cm,
        height: p.height_cm
      })),
      contentvalue: order.total_ttc || 0,
      content: `Commande ${order.order_number}`,
      reference: order.order_number
    }

    // 4. Appeler API Packlink pour créer shipment
    const packlinkResponse = await fetch(`${PACKLINK_API_URL}/shipments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PACKLINK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(packlinkPayload)
    })

    if (!packlinkResponse.ok) {
      const errorText = await packlinkResponse.text()
      console.error('Erreur API Packlink:', errorText)
      return NextResponse.json(
        { error: `Erreur Packlink: ${errorText}` },
        { status: packlinkResponse.status }
      )
    }

    const packlinkData = await packlinkResponse.json()

    // 5. Récupérer le label
    let labelUrl = null
    if (packlinkData.reference) {
      const labelResponse = await fetch(
        `${PACKLINK_API_URL}/shipments/${packlinkData.reference}/labels`,
        {
          headers: {
            'Authorization': `Bearer ${PACKLINK_API_KEY}`
          }
        }
      )

      if (labelResponse.ok) {
        const labelData = await labelResponse.json()
        labelUrl = labelData.url || labelData.label_url
      }
    }

    // 6. Retourner les données
    return NextResponse.json({
      success: true,
      packlink_id: packlinkData.reference,
      tracking_number: packlinkData.tracking,
      tracking_url: packlinkData.tracking_url,
      carrier_name: packlinkData.carrier?.name || 'Packlink',
      service_name: packlinkData.service?.name || 'Standard',
      cost_paid: packlinkData.price?.total || 0,
      label_url: labelUrl,
      raw_response: packlinkData
    })

  } catch (error) {
    console.error('Erreur API Packlink route:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}
