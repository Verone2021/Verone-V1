/**
 * API Route: /api/qonto/credit-notes
 * Lecture des avoirs clients via Qonto API
 *
 * GET - Liste les avoirs
 *
 * NOTE: L'API Qonto ne supporte PAS POST /v2/credit_notes.
 * Les avoirs doivent etre crees directement sur le dashboard Qonto.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { getQontoClient } from '@verone/integrations/qonto';

/**
 * GET /api/qonto/credit-notes
 * Liste les avoirs avec filtre optionnel par status
 */
export async function GET(request: NextRequest): Promise<
  NextResponse<{
    success: boolean;
    credit_notes?: unknown[];
    count?: number;
    meta?: unknown;
    error?: string;
  }>
> {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as 'draft' | 'finalized' | null;

    const client = getQontoClient();
    const result = await client.getClientCreditNotes(
      status ? { status } : undefined
    );

    return NextResponse.json({
      success: true,
      credit_notes: result.client_credit_notes,
      count: result.client_credit_notes.length,
      meta: result.meta,
    });
  } catch (error) {
    console.error('[API Qonto Credit Notes] GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
