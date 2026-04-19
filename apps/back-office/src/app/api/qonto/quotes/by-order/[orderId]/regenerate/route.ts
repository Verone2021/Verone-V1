/**
 * POST /api/qonto/quotes/by-order/[orderId]/regenerate
 * Placeholder stub — route removed in BO-FIN-030.
 * @deprecated This route has been removed. Use the by-order route directly.
 */

import { NextResponse } from 'next/server';

export async function POST(): Promise<NextResponse> {
  return NextResponse.json(
    { success: false, error: 'Route removed' },
    { status: 410 }
  );
}
