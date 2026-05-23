# Review Report — 2026-05-21

## Verdict initial : FAIL (3 CRITICAL + 2 WARNING)

---

## Re-revue 2026-05-21 — Vérification des correctifs

### Verdict final : PASS

---

### CRITICAL 1 — Taille page.tsx + extraction sous-composants — LEVÉ

- `apps/back-office/src/app/(protected)/canaux-vente/linkme/demandes-paiement/[id]/page.tsx` : **200 lignes** (< 400, conforme).
- `InvoiceSection.tsx` : **134 lignes** (< 200, conforme).
- `RequestInfoCards.tsx` : **92 lignes** (conforme).
- Données chargées via `usePaymentRequestDetail`, `usePaymentRequestCommissions`, `usePaymentHistory` (TanStack Query, `use-linkme-payments.ts` — 381 lignes, bien en dessous de 400).
- Aucun `useEffect` de fetch résiduel dans les hooks.

### CRITICAL 2 — Garde-fou anti-surpaiement — LEVÉ

- Migration `20260521150000_bo_linkme_pr_004_overpayment_guard.sql` présente.
- Trigger `trg_prevent_linkme_payment_overpay` BEFORE INSERT sur `linkme_payments`, ERRCODE `check_violation`, tolérance 0,01 €.
- Logique correcte : `v_already_paid + NEW.amount_ttc > v_total_due + 0.01`.

### CRITICAL 3 — Validation Zod sur route email — LEVÉ

- `apps/back-office/src/app/api/emails/payment-request-paid/route.ts` : schéma `paymentRequestPaidSchema` avec `safeParse`, rejet HTTP 400 si invalide. Plus aucun cast brut.

### WARNING 1 — ERRCODE corrigé — LEVÉ

- `mark_commission_requested_on_item_insert` : le cas status NULL lève désormais `RAISE EXCEPTION` standard (P0001 implicite). Le cas status ≠ 'validated' utilise `ERRCODE = 'check_violation'`. Plus de `foreign_key_violation` trompeur.

### WARNING 2 — `useMarkAsPaid` supprimé — LEVÉ

- `MarkAsPaidModal.tsx` absent du dossier `_components/`.
- Grep sur `apps/back-office/src/` et `apps/linkme/src/` : aucun résultat pour `useMarkAsPaid` ni `MarkAsPaidModal`.

---

### Recherche de régressions — RAS

- Zéro `as any`, `as never`, `@ts-ignore`, `eslint-disable` introduit dans le diff.
- Zéro `select('*')` dans les fichiers modifiés.
- `invalidateQueries` présent avec `await` dans tous les `onSuccess` (`hooks.ts` lignes 166/169/172 et `use-linkme-payments.ts` lignes 369/372/375).
- Aucun `useEffect` de fetch dans les hooks TanStack Query.
- Promesse `fetch` email (best-effort) correctement gérée avec `.catch()` (ligne 328).
