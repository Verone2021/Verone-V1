# Dev-report — [BO-LINKME-PR-004] Bloc B — Détail demande + historique virements (affilié)

**Date** : 2026-05-21
**Branche** : `feat/BO-LINKME-PR-004-workflow-paiements`
**Commit** : `87f24890`
**Durée** : ~1 session

---

## Résumé

Implémentation complète du Bloc B : page détail d'une demande de paiement côté affilié LinkMe, y compris l'historique des virements reçus et la gestion du statut `partially_paid`.

---

## Fichiers créés

### `apps/linkme/src/app/(main)/commissions/demandes/[id]/page.tsx`

Page Next.js 15 (`'use client'`) utilisant `use(params)` pour lire l'id dynamique.

- En-tête : numéro de demande, statut (badge), montant total TTC
- Encart "Restant dû" visible uniquement si statut = `partially_paid` (montant total − somme virements reçus calculé côté client)
- Indicateur statut facture (déposée ou non)
- Section commissions incluses (délégué à `CommissionsSection`)
- Section historique des virements (délégué à `PaymentHistorySection`)
- États de chargement et d'erreur/not-found explicites
- Responsive mobile-first : `max-w-2xl mx-auto`, labels empilés sur mobile, touch targets 44px sur le lien retour

### `apps/linkme/src/app/(main)/commissions/demandes/[id]/_components/CommissionsSection.tsx`

Sous-composant (< 60 lignes) : liste les commissions liées à la demande avec numéro de commande, nom de sélection et montant TTC.

### `apps/linkme/src/app/(main)/commissions/demandes/[id]/_components/PaymentHistorySection.tsx`

Sous-composant (< 80 lignes) : liste les virements reçus (`linkme_payments`) avec date, montant, référence, notes et lien justificatif si présent. Gère l'état de chargement et la liste vide.

---

## Fichiers modifiés

### `apps/linkme/src/types/analytics.ts`

- `PaymentRequestStatus` : ajout de `'partially_paid'`
- `PAYMENT_REQUEST_STATUS_LABELS` : ajout `partially_paid: 'Partiellement payée'`
- `PAYMENT_REQUEST_STATUS_COLORS` : ajout `partially_paid: 'blue'`

### `apps/linkme/src/lib/hooks/use-payment-requests.ts`

- Typage strict du client Supabase : `SupabaseClient<Database>` (import `@verone/types`)
- Nouveau type exporté `AffiliatePayment` (shape des lignes `linkme_payments`)
- Nouveau hook `usePaymentHistory(requestId)` : requête `linkme_payments` avec colonnes explicites (`id, payment_request_id, amount_ttc, payment_reference, payment_date, payment_proof_url, notes, created_at`), trié par `payment_date` DESC, `staleTime: 60_000`, activé seulement si `requestId` et `affiliate` présents

### `apps/linkme/src/app/(main)/commissions/demandes/page.tsx`

- Import ajouté : `ChevronRight`, `CircleDollarSign`
- `StatusBadge` : ajout de la config `partially_paid` (icône `CircleDollarSign`, bleu), correction `|| config.pending` → `?? config.pending`
- `PaymentRequestRow` : zone principale devenue un `<Link>` cliquable vers `/commissions/demandes/${request.id}` avec chevron ; les boutons upload/justificatif déplacés sous la zone Link (pas d'imbrication bouton dans lien)
- Bouton "Uploader ma facture" visible aussi pour statut `partially_paid`
- Justificatif paiement affiché aussi pour `partially_paid`
- `groupedRequests.active` filtre maintenant `pending | partially_paid`

### `apps/linkme/src/components/commissions/PaymentRequestsPanel.tsx`

- Même fix que `demandes/page.tsx` : ajout `partially_paid` dans le `Record<PaymentRequestStatus, ...>` du `StatusBadge`

---

## Vérification

| Check                                     | Résultat      |
| ----------------------------------------- | ------------- |
| `pnpm --filter @verone/linkme type-check` | **0 erreur**  |
| `pnpm --filter @verone/linkme lint`       | **0 warning** |
| Pre-commit hook                           | **OK**        |

---

## Points d'attention pour le reviewer

- Le calcul "restant dû" est fait côté client (`totalAmountTTC - sum(payments.amountTTC)`). Il est cohérent tant que le trigger `recompute_payment_request_status` s'exécute correctement (corrigé en Bloc 0). Pas de requête SQL dédiée pour éviter une requête supplémentaire.
- La page détail est `'use client'` (nécessaire pour `use(params)` + hooks). Pas de Server Component ici car Next.js 15 avec `'use client'` + `use()` est le pattern correct pour les pages dynamiques avec hooks.
- La RLS `affiliates_view_own_linkme_payments` est déjà en place (vérifiée en contexte). L'affilié ne peut voir que ses propres virements.
- Upload de facture depuis la page détail : non implémenté — le plan indique que c'est dans Bloc C (upload justificatif de paiement côté back-office, différent de l'upload facture affilié). L'affilié uploade sa facture depuis la liste, pas depuis le détail.
