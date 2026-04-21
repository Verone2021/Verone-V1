/**
 * API Route: POST /api/sales-orders/[id]/cancel
 *
 * Annule une commande client (status draft uniquement) avec cascade :
 *   - Planification : planCascadeCancel vérifie les docs Qonto liés
 *   - Exécution : executeCascade supprime les docs Qonto + soft-delete local
 *   - Update sales_orders.status = 'cancelled'
 *   - Libération stock_reservations
 *
 * Règles métier (finance.md R6) :
 *   - Seules les commandes draft peuvent être annulées via cette route
 *   - Facture finalized/unpaid/paid → REFUSE (créer un avoir d'abord)
 *   - Devis accepted → CONFIRM (force=true requis)
 *
 * Body : { force?: boolean }  — default false
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import {
  createAdminClient,
  createServerClient,
} from '@verone/utils/supabase/server';

import {
  planCascadeCancel,
  executeCascade,
} from '@/lib/orders/cascade-cancel-linked-docs';
import type { LinkedDoc } from '@/lib/orders/cascade-cancel-linked-docs';

// ---------------------------------------------------------------------------
// Types de réponse
// ---------------------------------------------------------------------------

type SuccessResponse = {
  success: true;
  cancelled: true;
  docsDeleted: number;
  forced?: boolean;
};

type ConfirmResponse = {
  requireConfirm: true;
  reason: string;
  docsToDelete: Array<{
    id: string;
    documentType: 'customer_quote' | 'customer_invoice';
    documentNumber: string | null;
    qontoStatus: string;
  }>;
};

type RefuseResponse = {
  success: false;
  error: string;
};

type ErrorResponse = {
  success: false;
  error: string;
  partiallyDeletedDocs?: string[];
};

// ---------------------------------------------------------------------------
// Validation Zod
// ---------------------------------------------------------------------------

const CancelBodySchema = z.object({
  force: z.boolean().optional(),
});

// UUID v4 guard
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ---------------------------------------------------------------------------
// Helper : libérer les stock_reservations de la commande
// ---------------------------------------------------------------------------

async function releaseStockReservations(
  orderId: string,
  userId: string
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('stock_reservations')
    .update({
      released_at: new Date().toISOString(),
      released_by: userId,
    })
    .eq('reference_type', 'sales_order')
    .eq('reference_id', orderId)
    .is('released_at', null);

  if (error) {
    console.error(
      '[API cancel sales order] Erreur libération stock_reservations:',
      error
    );
    // Non-bloquant : log mais pas d'exception (les triggers DB gèrent le rollback stock)
  }
}

// ---------------------------------------------------------------------------
// Helper : annuler la commande en DB
// ---------------------------------------------------------------------------

async function cancelOrderInDb(orderId: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('sales_orders')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', orderId);

  if (error) {
    throw new Error(`Mise à jour status commande échouée : ${error.message}`);
  }
}

// ---------------------------------------------------------------------------
// Helper : exécuter la cascade + update status + libérer stock
// Retourne la liste des doc IDs effectivement soft-deletés pour le cas d'erreur partielle
// ---------------------------------------------------------------------------

async function performCancellation(
  orderId: string,
  userId: string,
  docsToDelete: LinkedDoc[]
): Promise<{ docsDeleted: number }> {
  // executeCascade peut lancer en cours de route — on laisse remonter
  // Le status n'est mis à jour QUE si la cascade réussit
  await executeCascade(docsToDelete);

  await cancelOrderInDb(orderId);
  await releaseStockReservations(orderId, userId);

  return { docsDeleted: docsToDelete.length };
}

// ---------------------------------------------------------------------------
// POST /api/sales-orders/[id]/cancel
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<
  NextResponse<
    SuccessResponse | ConfirmResponse | RefuseResponse | ErrorResponse
  >
> {
  // 1. Auth
  const supabaseAuth = await createServerClient();
  const {
    data: { user: authUser },
    error: authError,
  } = await supabaseAuth.auth.getUser();

  if (authError || !authUser) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' } satisfies RefuseResponse,
      { status: 401 }
    );
  }
  const userId = authUser.id;

  // 2. Params
  const { id: orderId } = await params;

  if (!orderId || !UUID_REGEX.test(orderId)) {
    return NextResponse.json(
      {
        success: false,
        error: 'Identifiant commande invalide',
      } satisfies RefuseResponse,
      { status: 400 }
    );
  }

  // 3. Validation body
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    rawBody = {};
  }

  const parsed = CancelBodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error:
          'Corps de requête invalide : ' +
          parsed.error.issues.map(i => i.message).join(' | '),
      } satisfies RefuseResponse,
      { status: 400 }
    );
  }

  const force = parsed.data.force ?? false;

  // 4. Lire la commande
  const supabase = createAdminClient();
  const { data: order, error: orderError } = await supabase
    .from('sales_orders')
    .select('id, status, order_number')
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    return NextResponse.json(
      {
        success: false,
        error: 'Commande introuvable',
      } satisfies RefuseResponse,
      { status: 404 }
    );
  }

  if (order.status !== 'draft') {
    return NextResponse.json(
      {
        success: false,
        error: `Seules les commandes brouillon peuvent être annulées via cette route. Statut actuel : ${order.status}`,
      } satisfies RefuseResponse,
      { status: 400 }
    );
  }

  // 5. Planification cascade
  let verdict: Awaited<ReturnType<typeof planCascadeCancel>>;
  try {
    verdict = await planCascadeCancel(orderId);
  } catch (err) {
    console.error('[API cancel sales order] Erreur planCascadeCancel:', err);
    return NextResponse.json(
      {
        success: false,
        error:
          err instanceof Error
            ? err.message
            : 'Impossible de vérifier les documents liés à la commande',
      } satisfies ErrorResponse,
      { status: 500 }
    );
  }

  // 6. Router selon verdict

  // 6a. REFUSE : facture émise non annulable
  if (verdict.action === 'refuse') {
    return NextResponse.json(
      { success: false, error: verdict.reason } satisfies RefuseResponse,
      { status: 400 }
    );
  }

  // 6b. CONFIRM sans force : demander confirmation
  if (verdict.action === 'confirm' && !force) {
    const confirmResponse: ConfirmResponse = {
      requireConfirm: true,
      reason: verdict.reason,
      docsToDelete: verdict.docsToDelete.map((doc: LinkedDoc) => ({
        id: doc.id,
        documentType: doc.documentType,
        documentNumber: doc.documentNumber,
        qontoStatus: doc.qontoStatus,
      })),
    };
    return NextResponse.json(confirmResponse, { status: 409 });
  }

  // 6c. PROCEED ou CONFIRM+force : exécuter
  const docsToDelete = verdict.docsToDelete;

  try {
    const { docsDeleted } = await performCancellation(
      orderId,
      userId,
      docsToDelete
    );

    const successResponse: SuccessResponse = {
      success: true,
      cancelled: true,
      docsDeleted,
      ...(force && verdict.action === 'confirm' ? { forced: true } : {}),
    };

    return NextResponse.json(successResponse, { status: 200 });
  } catch (err) {
    console.error("[API cancel sales order] Erreur lors de l'annulation:", err);

    // Identifier les docs partiellement supprimés pour la réponse
    // executeCascade soft-delete en séquence — on ne peut pas savoir exactement
    // lesquels ont réussi sans état intermédiaire. On retourne les IDs attendus
    // pour que le frontend puisse afficher un message informatif.
    const partiallyDeletedDocs = docsToDelete.map((doc: LinkedDoc) => doc.id);

    return NextResponse.json(
      {
        success: false,
        error:
          err instanceof Error
            ? err.message
            : "Erreur lors de l'annulation de la commande",
        partiallyDeletedDocs,
      } satisfies ErrorResponse,
      { status: 500 }
    );
  }
}
