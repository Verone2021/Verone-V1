/**
 * API Route: POST /api/expenses/classify
 *
 * @deprecated Cette API est OBSOLÈTE depuis décembre 2025.
 *
 * RAISON: Utilise les tables `counterparties` et `counterparty_bank_accounts`
 * qui ont été remplacées par le lien direct vers `organisations`.
 *
 * ALTERNATIVE: Utiliser le composant `OrganisationLinkingModal` qui :
 * 1. Crée/sélectionne une organisation dans la table `organisations`
 * 2. Crée une règle dans `matching_rules` via le hook `useMatchingRules`
 * 3. Applique la règle à l'historique via la RPC `apply_matching_rule_to_history`
 *
 * Cette API retourne maintenant une erreur 410 Gone.
 */

import { NextResponse } from 'next/server';

/**
 * @deprecated Cette API est obsolète. Utiliser OrganisationLinkingModal à la place.
 */
export async function POST() {
  console.warn(
    '[DEPRECATED] /api/expenses/classify called - this API is obsolete. Use OrganisationLinkingModal instead.'
  );

  return NextResponse.json(
    {
      error: 'Cette API est obsolète (deprecated)',
      message:
        "Utilisez le composant OrganisationLinkingModal qui gère la classification via les tables 'organisations' et 'matching_rules'.",
      alternative: '/finance/depenses/regles',
      deprecatedSince: '2025-12',
    },
    { status: 410 } // 410 Gone - Resource no longer available
  );
}
