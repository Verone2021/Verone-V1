# Rapport — BO-LINKME-PR-002 · Refonte workflow demandes de paiement LinkMe

**Date :** 2026-05-13
**Branche :** `fix/BO-LINKME-PR-002` (PR #1013)
**Statut :** Fait à 70 % — fonctionnel de bout en bout. Reste un chantier "Facturation / Trésorerie" + un correctif de fragilité.

---

## 1. Ce qui est fait et poussé sur la branche

### 1.1 Fixes de base

- Colonne `linkme_commissions.order_date` créée + backfill (la page détail plantait sans elle).
- Bucket Supabase Storage `linkme-invoices` créé + 4 policies (affilié upload/lecture/suppression sur son propre dossier, staff lecture).
- Types Supabase régénérés (`packages/@verone/types/src/supabase.ts` était vide → erreurs TS2306 sur toute la codebase).
- Numéro de demande créé depuis le back-office : `PR-YYYY-NNNNNN` (avant : `DMV-{timestamp}-{random}` qui contournait le trigger).
- **RLS côté affilié ajoutées** sur `linkme_payment_requests` / `_items` (avant : seul le staff back-office y avait accès au niveau sécurité → flux affilié LinkMe cassé).
- Contrainte CHECK `linkme_commissions_status_check` étendue pour autoriser `'requested'` (manquait, faisait planter toute création de demande depuis le back-office — bug latent depuis 8 mois).
- 10 commissions "Payable" anormales (client jamais payé + aucune facture) repassées en `pending` (9 Pokawa = 1 076 € + 1 Black & White = 135 €).

### 1.2 Refonte workflow demandes de paiement

- **Paiements partiels** : nouvelle table `linkme_payments` (1 demande → N virements), statut intermédiaire `partially_paid`, trigger `recompute_payment_request_status` qui recalcule le statut à chaque ajout/suppression de paiement, MAJ du trigger de synchro commissions pour gérer le dé-soldage (paid → partially_paid).
- **Modal "Traiter le paiement"** (`ProcessPaymentModal`) qui remplace `MarkAsPaidModal` : montant (défaut = restant), case "paiement de la totalité", référence, date, notes. Bouton "Traiter" visible sur les demandes `pending` / `invoice_received` / `partially_paid` (élargi sur les demandes en attente de facture — cas régularisation où la facture existe déjà côté Qonto).
- **Historique des paiements** dans la page détail (back-office et LinkMe) avec "restant dû".
- **Garde-fou mélange affiliés** : bouton "Payer" désactivé + bandeau d'avertissement si la sélection contient plusieurs affiliés (page Rémunération).
- **Notification in-app** automatique à l'affilié quand sa demande est réglée (trigger DB `notify_affiliate_payment_request_paid` → table `notifications`).
- Affichage de la **facture déposée** dans la page détail back-office (bloc dédié, avant on n'avait que l'icône télécharger dans la liste).
- Re-synchro inverse : trigger `sync_commission_status_on_payment` gère désormais paiement client annulé → commission repasse en `pending` (avant : faille).
- Page détail affilié LinkMe `/commissions/demandes/[id]` créée.
- Consolidation des 2 fichiers de hooks admin dupliqués.
- Demande de test PR-2026-000001 supprimée puis recréée proprement par Roméo (91 commissions Pokawa, 30 471,84 € TTC).

### 1.3 Migrations livrées (6)

- `20260512140000_add_order_date_linkme_commissions.sql`
- `20260513120000_linkme_payments_partial.sql`
- `20260513140000_notify_affiliate_payment_paid.sql`
- `20260513150000_fix_linkme_commissions_status_requested.sql`
- `20260513160000_fix_linkme_commissions_validated_without_payment.sql`
- (régen types Supabase committée)

### 1.4 Tests

- `pnpm --filter @verone/back-office type-check` → 0 erreur
- `pnpm --filter @verone/linkme type-check` → 0 erreur
- Création demande Pokawa 91 commissions via UI → OK (PR-2026-000001 créée)
- Playwright smoke : pages Rémunération + Demandes de paiement, 0 erreur console
- Triggers paiements partiels testés en transaction (partiel → partially_paid, complément → paid, suppression → rollback)

---

## 2. Ce qui reste à faire (par priorité)

### 2.1 Chantier "Facturation / Trésorerie" (gros, prochaine session)

Le maillon manquant : un paiement à un affilié LinkMe n'apparaît **nulle part** dans la compta/trésorerie. La facture déposée vit uniquement dans le bucket Storage, n'est pas reliée à `financial_documents`, pas rapprochée d'une transaction bancaire Qonto. Décision Roméo confirmée : la facture déposée par l'affilié = **une dépense / sortie d'argent**, elle doit atterrir dans `/finance/transactions`.

Sous-tâches par ordre de priorité :

1. **Espace facturation dans le profil affilié LinkMe** : page `/profil/facturation` (ou section profil) listant toutes ses demandes de paiement + statut, avec dépôt/re-dépôt de facture pour celles qui l'attendent. + ses infos de facturation persistantes (raison sociale, SIRET, IBAN, adresse) saisissables, utilisées pour pré-remplir le modèle de facture puis la `financial_documents`.
2. **Sécuriser le bucket** `linkme-invoices` : remplacer `getPublicUrl()` par `createSignedUrl()` côté affilié ET back-office (le bucket est privé mais les URLs étaient "publiques").
3. **Bouton "Déposer la facture" côté back-office** : sur la page détail demande, pour le cas où l'affilié l'envoie par email plutôt que via LinkMe.
4. **Pont demande de paiement → `financial_documents`** : générer une `financial_documents` de type `supplier_invoice` (ou `expense` — à valider avec le comptable) + `document_direction='inbound'`, `partner_id` = organisation de l'affilié, `linkme_affiliate_id`, `total_ht/ttc` depuis la demande, `pcg_code` (rétribution tiers, ex. 622x/642x), lien vers le PDF, `status='draft'` → `'finalized'` quand soldée. Stocker `financial_document_id` sur `linkme_payment_requests`. → la dépense apparaît dans `/finance/documents/achats` et la bibliothèque.
5. **Rapprochement Qonto** : quand un `linkme_payments` (virement réel à l'affilié) est enregistré, le rapprocher : créer/lier une `bank_transactions` via `transaction_document_links`, incrémenter `financial_documents.amount_paid`. → apparaît dans `/finance/tresorerie` côté sortie d'argent.
6. **Statut "payé MAIS en attente de facture"** : aujourd'hui `paid` et `invoice_received` sont dans le même champ `status` (mutuellement exclusifs). Recommandation : sortir "facture reçue" du champ statut → colonne booléenne indépendante `invoice_received` (`status` reste : pending / partially_paid / paid / cancelled). Permet les deux cas.
7. **Conditions de paiement ("rythme") depuis Qonto** : récupérer `payment_terms` / `payment_terms_type` des clients depuis Qonto pour les afficher sur la demande ; sinon saisie manuelle. (Moins prioritaire.)

### 2.2 Correctif fragilité statut commission (de l'audit A — prochaine session)

Source du problème identifiée : le statut de `linkme_commissions` est écrit par 3 chemins (2 triggers + migrations ad-hoc qui hardcodent `'validated'`). Pas de source unique de vérité. Les commissions "Payable" sans paiement client viennent des migrations de backfill de déc 2025 / fév 2026 (concrètement `supabase/migrations/20260213230100_create_f25_commissions.sql`).

Faille latente non corrigée : `create_linkme_commission_on_order_update` fait `INSERT ON CONFLICT (order_id) DO UPDATE SET status = EXCLUDED.status` → si une commande validée/expédiée est re-modifiée, ce trigger **écrase** le statut de la commission, même si elle est `requested` (dans une demande) ou `paid`. C'est probablement ce qui va re-casser.

Sous-tâches :

1. Modifier `create_linkme_commission_on_order_update` pour que l'`ON CONFLICT DO UPDATE` ne touche **pas** `status` quand la commission est `'requested'` ou `'paid'` (ne pas écraser un état de demande/paiement).
2. Source unique de vérité : un seul mécanisme dérive le statut de `sales_orders.payment_status_v2` + appartenance à une demande/paiement ; interdire les écritures directes ailleurs.
3. Requête de cohérence ajoutée à un audit récurrent (CI ?) : "commission `validated` sans `payment_status_v2='paid'` et sans facture client" → doit toujours renvoyer 0.

### 2.3 Reste du chantier initial (petits)

- **Email à l'affilié** quand sa demande est réglée intégralement (la notification in-app est faite, l'email demande un template Resend dédié — TODO Phase 5 du plan initial).
- **Upload du justificatif de paiement** dans `ProcessPaymentModal` (le champ `payment_proof_url` existe en base, pas branché dans le modal).

---

## 3. Fichiers principaux touchés

| Fichier                                                                                  | Action                                                                                              |
| ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `supabase/migrations/20260512140000_*` à `20260513160000_*`                              | CRÉÉ (6 migrations)                                                                                 |
| `packages/@verone/types/src/supabase.ts`                                                 | RÉGÉNÉRÉ                                                                                            |
| `apps/back-office/.../linkme/hooks/use-payment-requests-admin.ts`                        | MODIFIÉ — consolidation, `useAddPayment`, `usePaymentHistory`, `useCancelPaymentRequestAdmin`, etc. |
| `apps/back-office/.../linkme/demandes-paiement/_components/ProcessPaymentModal.tsx`      | CRÉÉ (remplace `MarkAsPaidModal.tsx`)                                                               |
| `apps/back-office/.../linkme/demandes-paiement/_components/PaymentRequestsTable.tsx`     | MODIFIÉ — bouton Traiter, partially_paid                                                            |
| `apps/back-office/.../linkme/demandes-paiement/_components/PaymentRequestsStats.tsx`     | MODIFIÉ — partially_paid                                                                            |
| `apps/back-office/.../linkme/demandes-paiement/_components/StatusBadge.tsx` + `types.ts` | MODIFIÉ                                                                                             |
| `apps/back-office/.../linkme/demandes-paiement/[id]/page.tsx`                            | MODIFIÉ — historique paiements, partially_paid, facture déposée                                     |
| `apps/back-office/.../linkme/demandes-paiement/page.tsx`                                 | MODIFIÉ                                                                                             |
| `apps/back-office/.../linkme/commissions/hooks/use-commissions-page.ts`                  | MODIFIÉ — garde-fou affiliés                                                                        |
| `apps/back-office/.../linkme/commissions/components/CommissionsTabContent.tsx`           | MODIFIÉ — bandeau mélange                                                                           |
| `apps/linkme/src/lib/hooks/use-payment-requests.ts`                                      | MODIFIÉ — partially_paid, usePaymentRequestPayments                                                 |
| `apps/linkme/src/app/(main)/commissions/demandes/[id]/page.tsx`                          | CRÉÉ                                                                                                |
| `apps/linkme/src/app/(main)/commissions/demandes/page.tsx`                               | MODIFIÉ                                                                                             |
| `apps/linkme/src/types/analytics.ts`                                                     | MODIFIÉ — partially_paid                                                                            |

---

## 4. PR

`https://github.com/Verone2021/Verone-V1/pull/1013` — actuellement sur la branche `fix/BO-LINKME-PR-002`, en attente du dernier passage de la CI. À merger sur `staging` quand Roméo valide.
