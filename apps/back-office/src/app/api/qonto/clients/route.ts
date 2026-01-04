/**
 * API Route: /api/qonto/clients
 * Gestion des clients Qonto
 *
 * GET  - Liste les clients
 * POST - Crée un client
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { QontoClient } from '@verone/integrations/qonto';

function getQontoClient(): QontoClient {
  return new QontoClient({
    authMode: (process.env.QONTO_AUTH_MODE as 'oauth' | 'api_key') ?? 'oauth',
    organizationId: process.env.QONTO_ORGANIZATION_ID,
    apiKey: process.env.QONTO_API_KEY,
    accessToken: process.env.QONTO_ACCESS_TOKEN,
  });
}

interface IGetResponse {
  success: boolean;
  clients?: unknown[];
  count?: number;
  error?: string;
}

interface IPostRequestBody {
  name: string;
  email?: string;
  vatNumber?: string;
  address?: {
    streetAddress?: string;
    city?: string;
    zipCode?: string;
    countryCode?: string;
  };
}

interface IPostResponse {
  success: boolean;
  client?: unknown;
  message?: string;
  isNew?: boolean;
  error?: string;
}

/**
 * GET /api/qonto/clients
 * Liste tous les clients Qonto
 */
export async function GET(): Promise<NextResponse<IGetResponse>> {
  try {
    const client = getQontoClient();
    const result = await client.getClients();

    return NextResponse.json({
      success: true,
      clients: result.clients,
      count: result.clients.length,
    });
  } catch (error) {
    console.error('[API Qonto Clients] GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/qonto/clients
 * Crée un nouveau client Qonto
 *
 * Body:
 * - name: string (required)
 * - email: string (optional)
 * - vatNumber: string (optional)
 * - address: { streetAddress, city, zipCode, countryCode } (optional)
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<IPostResponse>> {
  try {
    const body = (await request.json()) as IPostRequestBody;
    const { name, email, vatNumber, address } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'name is required' },
        { status: 400 }
      );
    }

    const qontoClient = getQontoClient();

    // Vérifier si le client existe déjà par email
    if (email) {
      const existingClient = await qontoClient.findClientByEmail(email);
      if (existingClient) {
        return NextResponse.json({
          success: true,
          client: existingClient,
          message: 'Client already exists',
          isNew: false,
        });
      }
    }

    // Créer le client
    const newClient = await qontoClient.createClient({
      name,
      email,
      vatNumber,
      currency: 'EUR',
      locale: 'fr',
      address: address
        ? {
            streetAddress: address.streetAddress ?? '',
            city: address.city ?? '',
            zipCode: address.zipCode ?? '',
            countryCode: address.countryCode ?? 'FR',
          }
        : undefined,
    });

    return NextResponse.json({
      success: true,
      client: newClient,
      message: 'Client created successfully',
      isNew: true,
    });
  } catch (error) {
    console.error('[API Qonto Clients] POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
