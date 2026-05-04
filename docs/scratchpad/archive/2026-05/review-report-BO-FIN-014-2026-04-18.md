# Review Report — BO-FIN-014 — 2026-04-18

Verdict : PASS

Sprint : BO-FIN-014 (fix format PROFORMA + guard ecrasement draft)
Branche : `fix/BO-FIN-014-fix-proforma-format`
Commit audite : `08fb22979`
Base : `origin/staging` (1 commit au-dessus)

---

## Points audites et valides

### Fix 1 — Format PROFORMA (route.ts:798)

`PROFORMA-${typedOrder.order_number}` est correct. `typedOrder` est construit depuis la requete DB (`sales_orders.select('*')` via `.single()`) donc `order_number` est garanti present a ce stade (si absent, le `404` precedent arrete la route). Aucune collision possible : la DB confirme zero doublon `order_number` dans `sales_orders`. Le format est deterministe, lisible, traitable par index.

### Fix 2 — Guard ecrasement draft (route.ts:333-376)

Logique conforme a R4 :

- Detection `finalized` = tout document avec `status !== 'draft'` → 409. Logique inverse correcte (un document `cancelled` est aussi `!== 'draft'` mais la query filtre deja `.not('status', 'eq', 'cancelled')` → seuls `draft`, `sent`, `paid`, `unpaid`, `overdue` passent ; le 409 bloque `sent/paid/unpaid/overdue`).
- Loop sur tous les drafts existants (multi-documents toleree).
- Qonto delete non-bloquant (catch + warn) : acceptable, la proforma Qonto peut rester orpheline cote Qonto mais n'a plus de trace locale — risque documente.

### Fix 3 — Return HTTP 500 si softDeleteError (route.ts:363-374)

Implemente. Si soft-delete echoue, la route retourne 500 immediatement et n'insere pas la nouvelle proforma. Etat potentiel : Qonto delete reussi + local intact → divergence Qonto/DB, mais bloque correctement l'insertion du doublon.

### Fix 4 — finance.md tracking

Table Tracking correcte : `BO-FIN-014 | R4 (guard écrasement proforma) | En cours (PR pending)`.

### Migration SQL (20260422_partial_unique_document_number.sql)

Index `unique_document_number_per_type` verifie en DB live : `WHERE (deleted_at IS NULL)` present. Migration idempotente (`DROP CONSTRAINT IF EXISTS` + `DROP INDEX IF EXISTS`). Aucune perte de donnees (DDL sur index uniquement).

### DB live — Etat proformas

- Zero proforma orpheline (`sales_order_id IS NULL AND document_number LIKE 'PROFORMA-%' AND deleted_at IS NULL` → 0).
- Zero doublon actif (0 commandes avec plus d'une proforma non-supprimee).
- 5 proformas actives, toutes liees a une commande, format `PROFORMA-SO-2026-XXXXX`. Format conforme.
- Zero `document_number NULL` dans les documents actifs.

### Perimetre routes Qonto

Seul `apps/back-office/src/app/api/qonto/invoices/route.ts` a ete modifie. Les routes `quotes/route.ts`, `invoices/service/route.ts`, `invoices/by-order/`, webhooks — intactes.

### Hygiene code

- Zero `any` introduit dans le diff.
- Zero `@ts-ignore`, zero `eslint-disable`.
- Imports `@verone/*` uniquement (aucun import relatif `../../`).
- Pas de promesse flottante dans les nouvelles lignes (toutes les appels Qonto sont `await` dans la loop).

---

## Warnings (non bloquants, dettes pre-existantes)

### WARNING — route.ts:284-305 — Absence de validation Zod sur le body POST

Le body est parse avec un cast TypeScript brut `as { salesOrderId: string; ... }`. Aucune validation Zod. Un appel peut envoyer `salesOrderId: ""`, `autoFinalize: "true"` (string au lieu de boolean), ou des champs inattendus. La seule protection en place est le check `if (!salesOrderId)` ligne 308. Pre-existant au sprint BO-FIN-014. A tracker dans BO-FIN-009.

### WARNING — route.ts:926 — Fichier depasse 400 lignes

Le fichier fait 926 lignes. La regle `code-standards.md` impose refactoring > 400 lignes. Ce commit ajoute 34 lignes (net), aggrave marginalement la dette mais n'en est pas la cause principale. Refactoring planifie dans BO-TECH-001.

### INFO — route.ts:331-332 — Qonto delete non-bloquant : divergence possible

Si le delete Qonto echoue (timeout, 404, erreur reseau) et que le soft-delete local reussit, la proforma reste visible cote Qonto en `draft` mais n'a plus de trace locale. Cas documente dans le warn log, mecanisme de reconciliation a traiter dans BO-FIN-009 (route `/regenerate`).

---

## Autorisation PR

Ce commit est autorise a passer en PR vers `staging`.

- Aucun CRITICAL present.
- Les 3 findings du reviewer precedent (dev-plan-2026-04-18-BO-FIN-014-fix-findings.md) sont tous implementes et verifies en DB live.
- Les 2 WARNINGs sont des dettes pre-existantes documentees, a tracker dans BO-FIN-009 et BO-TECH-001.
- Aucune route Qonto tierce n'a ete touchee.
