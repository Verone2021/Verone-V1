# Dev-plan — [BO-LINKME-PR-004] Finaliser le workflow paiements LinkMe

**Date** : 2026-05-21
**Branche** : `feat/BO-LINKME-PR-004-workflow-paiements` (créée depuis staging à jour)
**Remplace** : PR #1013 `fix/BO-LINKME-PR-002` (abandonnée — désynchronisée du modèle actuel)

---

## Contexte

Le paiement des commissions aux affiliés LinkMe a été traité en deux temps :
PR-003 (#1036, mergée le 20/05) a livré la facturation/trésorerie ; PR-002 (#1013)
devait livrer la refonte du workflow (paiements partiels, garde-fous, notifs) mais
n'a jamais été mergée et est devenue obsolète.

**Constat de l'audit du 2026-05-21** : la **base de données est 100 % au modèle
cible** (toutes les migrations de PR-002 et PR-003 sont appliquées en prod). C'est
le **code** qui est en retard. Le chantier restant est donc quasi exclusivement du
code, plus 3 corrections DB ciblées.

## État vérifié de la base (prod)

- Table `linkme_payments` existe : `id, payment_request_id, amount_ttc,
payment_reference, payment_date, payment_proof_url, notes, paid_by, created_at`.
- `linkme_payment_requests.status` CHECK = `pending | partially_paid | paid | cancelled`.
- `linkme_payment_requests.invoice_received` = booléen indépendant ; `financial_document_id`, `payment_proof_url` présents.
- `linkme_commissions.status` CHECK = `pending | validated | payable | requested | paid | cancelled`.
- Triggers en place : `recompute_payment_request_status`, `sync_commissions_on_payment_request_paid`,
  `notify_affiliate_payment_request_paid`, `mark_commission_requested_on_item_insert`,
  `release_commission_on_item_delete`, `sync_commission_status_on_payment`.

### Bug latent détecté

`recompute_payment_request_status` (trigger sur `linkme_payments` INSERT/DELETE)
contient `... SET status = CASE WHEN v_has_invoice THEN 'invoice_received' ELSE 'pending' END`.
Or `invoice_received` a été retiré du CHECK statut par PR-003 → si ce trigger tombe
dans cette branche (suppression du dernier virement d'une demande avec facture),
il viole le CHECK et plante. **À corriger (Bloc 0).**

---

## Bloc 0 — Corrections DB (migration unique, GO Roméo requis)

Une seule migration `supabase/migrations/20260521xxxxxx_bo_linkme_pr_004_fix_triggers.sql` :

1. **`recompute_payment_request_status`** : remplacer `'invoice_received'` par `'pending'`
   dans la branche ELSE (le statut ne doit jamais valoir `invoice_received`).
2. **`create_linkme_commission_on_order_update`** (faille « Bloc 2 ») :
   - dans le `ON CONFLICT (order_id) DO UPDATE`, préserver `status` quand la valeur
     existante est `requested`, `paid` ou `cancelled` (ne recalculer que `pending`↔`validated`) ;
   - ne pas `DELETE` les commissions `requested`/`paid` quand la commande quitte
     `validated`/`shipped` (ex. passage à `delivered`).
3. **`mark_commission_requested_on_item_insert`** : rendre le garde-fou bloquant —
   `RAISE EXCEPTION` si la commission ciblée n'est pas `validated` (au lieu d'un
   `UPDATE ... WHERE status='validated'` silencieux qui laisse créer une ligne incohérente).

Après application : régénérer les types (`pnpm run generate:types`), committer `supabase.ts`.

---

## Bloc A — Paiements partiels (back-office)

Dossier : `apps/back-office/src/app/(protected)/canaux-vente/linkme/demandes-paiement/`

- **`_components/ProcessPaymentModal.tsx`** (nouveau) — remplace `MarkAsPaidModal`.
  Champs : montant TTC (défaut = restant dû), case « paiement de la totalité »,
  référence, date, + upload optionnel d'un justificatif PDF (Bloc C). À la
  validation : `INSERT` dans `linkme_payments` (le trigger `recompute_payment_request_status`
  fait passer la demande en `partially_paid` ou `paid` tout seul).
  S'inspirer de la version PR #1013 (`git show origin/fix/BO-LINKME-PR-002:...ProcessPaymentModal.tsx`,
  292 lignes) mais l'adapter au modèle `invoice_received` booléen.
- **Supprimer `_components/MarkAsPaidModal.tsx`** une fois ProcessPaymentModal en place.
- **`_components/types.ts`** — ajouter `partially_paid` à `PaymentRequestStatus`,
  `STATUS_LABELS`, `STATUS_CONFIG`.
- **`hooks/use-payment-requests-admin.ts`** — ajouter `useAddPayment` (insert
  `linkme_payments` + invalidation) et `usePaymentHistory` (liste des virements
  d'une demande). Conserver l'appel best-effort au RPC `link_linkme_payment_to_bank_transaction`.
- **`[id]/page.tsx`** — bouton « Traiter le paiement » → ProcessPaymentModal ;
  afficher « restant dû » et l'historique des virements.
- **`page.tsx` + `PaymentRequestsTable.tsx` + `PaymentRequestsStats.tsx`** —
  gérer l'affichage du statut `partially_paid`.

## Bloc B — Historique + détail côté affilié

- **`apps/linkme/src/app/(main)/commissions/demandes/[id]/page.tsx`** (nouveau) —
  page détail d'une demande : commissions incluses, historique des virements reçus,
  restant dû. Le hook `usePaymentRequestDetail` existe déjà côté linkme.
- **`apps/linkme/src/types/analytics.ts`** — ajouter `partially_paid` à
  `PaymentRequestStatus` + label.
- **`apps/linkme/src/app/(main)/commissions/demandes/page.tsx`** — afficher le
  statut `partially_paid` et le restant dû dans la liste.

## Bloc C — Finitions

- **Justificatif de paiement** : dans `ProcessPaymentModal`, upload PDF optionnel
  vers le bucket, écrit dans `linkme_payments.payment_proof_url`.
- **Email Resend** : route API + template, envoyé quand une demande passe `paid`
  (la notif in-app existe déjà via trigger `notify_affiliate_payment_request_paid`).
- **Garde-fou mélange affiliés** : à la création d'une demande côté back-office,
  désactiver la validation si la sélection de commissions couvre plusieurs affiliés.

## Bloc D — Doc + cleanup

- Doc LinkMe corrigée : déjà faite en local (`business-rules-linkme.md`,
  `commission-reference.md`) — à committer dans cette PR.
- Fermer la PR #1013 avec un commentaire renvoyant vers PR-004.

---

## Ordre d'exécution

1. Bloc 0 (migration DB) — après GO Roméo, appliquer en prod + régénérer types.
2. Bloc A (paiements partiels back-office) — cœur du chantier.
3. Bloc B (détail + historique affilié).
4. Bloc C (finitions).
5. Bloc D (doc + fermeture #1013).
6. Une seule PR `feat/BO-LINKME-PR-004` vers staging, auto-merge sur CI verte.

Délégation : le code des Blocs A/B/C à `dev-agent` (15+ fichiers). Le coordinateur
fait le Bloc 0, la revue, les tests Playwright et le git.

## Tests

- Bloc 0 : transaction de test — supprimer le dernier virement d'une demande avec
  facture → statut revient à `pending` sans erreur ; passer une commande LinkMe
  `shipped` (commission `requested`) à `delivered` → commission préservée ;
  ajouter à une demande une commission `pending` → refus.
- Bloc A : Playwright — créer un virement partiel sur une demande → statut
  `partially_paid` + restant dû correct ; second virement soldant → `paid`.
- Bloc B : Playwright affilié — page détail demande affiche commissions + virements.
- Non-régression : la demande Pokawa PR-2026-000001 ne doit pas être altérée.
