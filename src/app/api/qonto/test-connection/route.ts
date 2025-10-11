// =====================================================================
// Qonto Test Connection API Route
// Date: 2025-10-11
// Description: Endpoint test pour vérifier connexion Qonto API
// STATUS: DÉSACTIVÉ Phase 1 (Finance module disabled)
// =====================================================================

import { NextResponse } from 'next/server';
// import { getQontoClient } from '@/lib/qonto'; // Désactivé Phase 1

export const dynamic = 'force-dynamic';

export async function GET() {
  // FEATURE FLAG: Finance module disabled for Phase 1
  return NextResponse.json(
    {
      success: false,
      disabled: true,
      message: 'Module Finance désactivé pour déploiement Phase 1',
      phase: 'Phase 1 - Catalogue/Stock/Commandes uniquement',
      availability: 'Module Qonto disponible en Phase 2',
    },
    { status: 503 } // Service Unavailable
  );

  /* CODE ORIGINAL - RÉACTIVATION PHASE 2
  {
  try {
    const qontoClient = getQontoClient();

    // Test 1: Récupérer les comptes bancaires
    const accounts = await qontoClient.getBankAccounts();

    if (!accounts || accounts.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Aucun compte bancaire trouvé',
          details: 'Vérifiez que votre organisation Qonto possède au moins un compte actif.',
        },
        { status: 404 }
      );
    }

    // Test 2: Récupérer le solde du premier compte
    const firstAccount = accounts[0];
    const accountBalance = await qontoClient.getBalance(firstAccount.id);

    // Test 3: Récupérer les 5 dernières transactions du premier compte
    const { transactions, meta } = await qontoClient.getTransactions({
      bankAccountId: firstAccount.id,
      perPage: 5,
      sortBy: 'settled_at',
    });

    return NextResponse.json({
      success: true,
      message: 'Connexion Qonto réussie',
      data: {
        accounts_count: accounts.length,
        primary_account: {
          id: firstAccount.id,
          slug: firstAccount.slug,
          iban: firstAccount.iban.replace(/(.{4})(?=.)/g, '$1 '), // Format IBAN lisible
          balance: firstAccount.balance,
          authorized_balance: firstAccount.authorized_balance,
          currency: firstAccount.currency,
          status: firstAccount.status,
        },
        all_accounts: accounts.map((acc) => ({
          id: acc.id,
          slug: acc.slug,
          iban: acc.iban.replace(/(.{4})(?=.)/g, '$1 '),
          balance: acc.balance,
          currency: acc.currency,
          status: acc.status,
        })),
        recent_transactions: {
          count: transactions.length,
          total_count: meta.total_count,
          transactions: transactions.map((tx) => ({
            id: tx.transaction_id,
            amount: tx.amount,
            currency: tx.currency,
            side: tx.side,
            label: tx.label,
            counterparty: tx.counterparty?.name || 'N/A',
            settled_at: tx.settled_at,
            status: tx.status,
          })),
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Qonto connection test failed:', error);

    // Gestion erreurs spécifiques
    if (error.code === 'AUTH_ERROR') {
      return NextResponse.json(
        {
          success: false,
          error: 'Erreur d\'authentification Qonto',
          message: 'Les identifiants fournis sont invalides.',
          details: {
            organization_id: process.env.QONTO_ORGANIZATION_ID
              ? '✅ Configuré'
              : '❌ Manquant',
            api_key: process.env.QONTO_API_KEY ? '✅ Configuré' : '❌ Manquant',
          },
        },
        { status: 401 }
      );
    }

    if (error.code === 'PERMISSION_ERROR') {
      return NextResponse.json(
        {
          success: false,
          error: 'Permissions insuffisantes',
          message: 'Votre clé API n\'a pas les permissions nécessaires.',
          details: 'Vérifiez que la clé API possède les permissions: read:transactions, read:bank_accounts',
        },
        { status: 403 }
      );
    }

    if (error.code === 'RATE_LIMIT') {
      return NextResponse.json(
        {
          success: false,
          error: 'Limite de taux dépassée',
          message: 'Trop de requêtes vers l\'API Qonto.',
          retry_after: '60 secondes',
        },
        { status: 429 }
      );
    }

    // Erreur générique
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur de connexion Qonto',
        message: error.message || 'Une erreur inattendue s\'est produite',
        code: error.code || 'UNKNOWN_ERROR',
        details: error.details,
      },
      { status: error.statusCode || 500 }
    );
  }
}
