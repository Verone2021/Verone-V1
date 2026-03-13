/**
 * API Route: POST /api/qonto/supplier-invoices/sync
 * Synchronise les factures fournisseurs depuis Qonto vers financial_documents
 */

import { NextResponse } from 'next/server';

import { getSupplierInvoiceSyncService } from '@verone/finance/services';
import type { SupplierInvoiceSyncOptions } from '@verone/finance/services';
import { createServerClient } from '@verone/utils/supabase/server';

export async function POST(request: Request) {
  try {
    // Auth check
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse options from body
    const body = (await request
      .json()
      .catch(() => ({}))) as Partial<SupplierInvoiceSyncOptions>;

    const options: SupplierInvoiceSyncOptions = {
      syncScope: body.syncScope ?? 'incremental',
      fromDate: body.fromDate,
      maxPages: body.maxPages ?? 50,
    };

    console.warn(
      '[API Supplier Invoices Sync] Starting sync with options:',
      options
    );

    const service = getSupplierInvoiceSyncService();
    const result = await service.sync(options);

    console.warn('[API Supplier Invoices Sync] Sync result:', {
      success: result.success,
      itemsFetched: result.itemsFetched,
      itemsCreated: result.itemsCreated,
      itemsUpdated: result.itemsUpdated,
      durationMs: result.durationMs,
      errorsCount: result.errors.length,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API Supplier Invoices Sync] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
