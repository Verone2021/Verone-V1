/**
 * Qonto Health Check API
 * Verifie que les credentials Qonto sont valides
 *
 * GET /api/qonto/health
 *
 * Supporte 2 modes d'authentification:
 * - oauth (défaut): QONTO_ACCESS_TOKEN requis
 * - api_key: QONTO_ORGANIZATION_ID + QONTO_API_KEY requis
 *
 * Set QONTO_AUTH_MODE=api_key pour utiliser API Key
 */

import { NextResponse } from 'next/server';

import { QontoClient, QontoError } from '@verone/integrations/qonto';
import type { QontoHealthCheckResult } from '@verone/integrations/qonto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy' | 'misconfigured';
  authMode?: 'oauth' | 'api_key';
  timestamp: string;
  bankAccountsCount?: number;
  sampleBankAccountId?: string;
  error?: string;
  configDetails?: {
    authMode: string;
    hasAccessToken: boolean;
    hasOrganizationId: boolean;
    hasApiKey: boolean;
  };
}

export async function GET(): Promise<NextResponse<HealthCheckResponse>> {
  const timestamp = new Date().toISOString();

  // Déterminer le mode d'auth configuré
  const authMode =
    process.env.QONTO_AUTH_MODE?.toLowerCase() === 'api_key'
      ? 'api_key'
      : 'oauth';

  // Vérifier les credentials selon le mode
  const hasAccessToken = !!process.env.QONTO_ACCESS_TOKEN;
  const hasOrganizationId = !!process.env.QONTO_ORGANIZATION_ID;
  const hasApiKey = !!process.env.QONTO_API_KEY;

  const configDetails = {
    authMode,
    hasAccessToken,
    hasOrganizationId,
    hasApiKey,
  };

  // Validation des credentials selon le mode
  if (authMode === 'oauth' && !hasAccessToken) {
    return NextResponse.json(
      {
        status: 'misconfigured',
        authMode,
        timestamp,
        error:
          'OAuth mode requires QONTO_ACCESS_TOKEN. ' +
          'Set QONTO_AUTH_MODE=api_key if using API Key authentication.',
        configDetails,
      },
      { status: 503 }
    );
  }

  if (authMode === 'api_key' && (!hasOrganizationId || !hasApiKey)) {
    return NextResponse.json(
      {
        status: 'misconfigured',
        authMode,
        timestamp,
        error:
          'API Key mode requires QONTO_ORGANIZATION_ID and QONTO_API_KEY. ' +
          'Set QONTO_AUTH_MODE=oauth if using OAuth authentication.',
        configDetails,
      },
      { status: 503 }
    );
  }

  try {
    // Créer le client avec le mode d'auth approprié
    const client = new QontoClient({ authMode });
    const result: QontoHealthCheckResult = await client.healthCheck();

    if (result.healthy) {
      return NextResponse.json({
        status: 'healthy',
        authMode: result.authMode,
        timestamp: result.timestamp,
        bankAccountsCount: result.bankAccountsCount,
        sampleBankAccountId: result.sampleBankAccountId,
      });
    } else {
      return NextResponse.json(
        {
          status: 'unhealthy',
          authMode: result.authMode,
          timestamp: result.timestamp,
          error: result.error,
          configDetails,
        },
        { status: 503 }
      );
    }
  } catch (error) {
    let errorMessage = 'Unknown error';
    if (error instanceof QontoError) {
      errorMessage = `${error.code}: ${error.message}`;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      {
        status: 'unhealthy',
        authMode,
        timestamp,
        error: errorMessage,
        configDetails,
      },
      { status: 503 }
    );
  }
}
