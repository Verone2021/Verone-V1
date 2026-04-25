import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const PACKLINK_API_KEY = process.env.PACKLINK_API_KEY;
const PACKLINK_API_URL = 'https://api.packlink.com/v1';

interface PackageInput {
  width: number; // cm
  height: number; // cm
  length: number; // cm
  weight: number; // kg
}

interface AddressInput {
  street1: string;
  city: string;
  zip_code: string;
  country: string;
}

export async function POST(request: NextRequest) {
  try {
    // Vérifier si l'API Packlink est configurée
    if (!PACKLINK_API_KEY) {
      return NextResponse.json(
        {
          error:
            "API Packlink non configurée. Veuillez contacter l'administrateur.",
        },
        { status: 501 }
      );
    }

    const body = await request.json();
    const { from, to, packages } = body as {
      from: AddressInput;
      to: AddressInput;
      packages: PackageInput[];
    };

    // Validation des données
    if (!from || !to || !packages || packages.length === 0) {
      return NextResponse.json(
        {
          error: 'Adresses et colis requis (from, to, packages)',
        },
        { status: 400 }
      );
    }

    // 🔧 CORRECTION CRITIQUE : PackLink API utilise GET /v1/services avec query parameters
    // Référence: https://github.com/wout/packlink.cr/blob/master/src/packlink/service.cr
    // La méthode Service.all() utilise GET, pas POST

    // Construire query string pour PackLink API
    const queryParams = new URLSearchParams();

    // From address
    queryParams.append('from[country]', from.country);
    queryParams.append('from[zip]', from.zip_code);

    // To address
    queryParams.append('to[country]', to.country);
    queryParams.append('to[zip]', to.zip_code);

    // Packages (format: packages[0][weight], packages[0][length], etc.)
    packages.forEach((pkg, index) => {
      queryParams.append(`packages[${index}][weight]`, pkg.weight.toString());
      queryParams.append(`packages[${index}][length]`, pkg.length.toString());
      queryParams.append(`packages[${index}][width]`, pkg.width.toString());
      queryParams.append(`packages[${index}][height]`, pkg.height.toString());
    });

    const queryString = queryParams.toString();
    const fullUrl = `${PACKLINK_API_URL}/services?${queryString}`;

    // DEBUG: Log request details
    console.log('[Packlink] Request Method: GET');
    console.log('[Packlink] Request URL:', fullUrl);
    console.log('[Packlink] Query Parameters:', {
      from: { country: from.country, zip: from.zip_code },
      to: { country: to.country, zip: to.zip_code },
      packages: packages.map((pkg, i) => ({
        index: i,
        weight: pkg.weight,
        length: pkg.length,
        width: pkg.width,
        height: pkg.height,
      })),
    });
    console.log(
      '[Packlink] API Key (first 10 chars):',
      PACKLINK_API_KEY?.substring(0, 10)
    );

    // Appeler l'API Packlink (GET avec query parameters)
    const packlinkResponse = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        Authorization: PACKLINK_API_KEY,
        // Pas de Content-Type pour GET
      },
    });

    console.log('[Packlink] Response Status:', packlinkResponse.status);
    console.log(
      '[Packlink] Response Headers:',
      Object.fromEntries(packlinkResponse.headers.entries())
    );

    if (!packlinkResponse.ok) {
      const errorText = await packlinkResponse.text();
      console.error(
        '[Packlink Search Services] API Error Response:',
        errorText
      );
      console.error('[Packlink Search Services] Full Error Details:', {
        status: packlinkResponse.status,
        statusText: packlinkResponse.statusText,
        headers: Object.fromEntries(packlinkResponse.headers.entries()),
        body: errorText,
      });
      return NextResponse.json(
        {
          error: `Erreur Packlink: ${errorText || packlinkResponse.statusText}`,
        },
        { status: packlinkResponse.status }
      );
    }

    const packlinkData = await packlinkResponse.json();
    console.log(
      '[Packlink] Response Data:',
      JSON.stringify(packlinkData, null, 2)
    );

    // Formater les services pour l'UI avec détails collection/delivery
    const services = (Array.isArray(packlinkData) ? packlinkData : []).map(
      (service: any) => ({
        id: service.id,
        carrier_name:
          service.carrier_name || service.carrier?.name || 'Transporteur',
        service_name: service.name || service.service_name || 'Standard',
        price: {
          amount: parseFloat(
            service.price?.total_price || service.total_price || 0
          ),
          currency: service.price?.currency || service.currency || 'EUR',
        },
        delivery_time: {
          min_days: parseInt(
            service.delivery_time?.min || service.min_delivery_days || 1
          ),
          max_days: parseInt(
            service.delivery_time?.max || service.max_delivery_days || 3
          ),
        },
        description: service.description || null,
        logo_url: service.logo_url || null,
        // Détails type de collecte et livraison
        collection_type:
          service.collection?.type || (service.dropoff ? 'dropoff' : 'home'),
        delivery_type: service.delivery?.type || 'home',
        dropoff: service.dropoff || false,
      })
    );

    // Trier par prix croissant
    services.sort((a: any, b: any) => a.price.amount - b.price.amount);

    console.log('[Packlink] Services Found:', services.length);

    return NextResponse.json({
      success: true,
      services,
      count: services.length,
    });
  } catch (error) {
    console.error('[Packlink Search Services] Error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Erreur serveur interne',
      },
      { status: 500 }
    );
  }
}
