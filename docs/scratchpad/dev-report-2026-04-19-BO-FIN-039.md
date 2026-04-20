# Dev Report — BO-FIN-039 — Rollback BO-FIN-037 + colonne billing_org_id

**Date** : 2026-04-19
**Branche** : `feat/BO-FIN-031-org-picker-modal`
**Durée** : session courante
**Verdict** : READY_FOR_REVIEW

---

## Constat initial

Lors de l'analyse, plusieurs fichiers étaient déjà dans l'état attendu (rollback partiel de BO-FIN-037 déjà effectué dans la branche) :

- `apps/back-office/src/app/api/qonto/invoices/_lib/propagate-order-customer.ts` — **déjà supprimé**
- `apps/back-office/src/app/api/qonto/invoices/route.ts` — **déjà propre** (pas d'import propagateOrderCustomer)
- `apps/back-office/src/app/api/qonto/invoices/_lib/persist-financial-document.ts` — **déjà correct** (partner_id = order.customer_id, billing_org_id dans insertPayload avec cast temporaire)
- `apps/back-office/src/app/api/qonto/quotes/route.post.ts` — **déjà correct** (guard SIRET, effectiveCustomerId = orderCustomerId, billingOrgId passé)

Seul point manquant : `route.db.ts` avait le paramètre `billingOrgId` dans l'interface mais ne l'utilisait pas dans le payload INSERT.

---

## Fichiers modifiés par BO-FIN-039

### 1. `apps/back-office/src/app/api/qonto/quotes/route.db.ts`

- Ajout de `billingOrgId` dans la destructuration de `params`
- Renommage `payload` → `basePayload`, puis construction de `payload` avec `billing_org_id: billingOrgId ?? null` via cast temporaire `as unknown as FinancialDocumentInsert`
- Commentaire `// [BO-FIN-039] billing_org_id added in migration 20260430, types regen pending`

### 2. `apps/back-office/src/app/api/qonto/quotes/by-order/[orderId]/regenerate/_helpers.ts` (erreurs préexistantes corrigées)

- Import `Database` depuis `@verone/types` ajouté
- `supabase: SupabaseClient` → `supabase: SupabaseClient<Database>` (corrigeait `@typescript-eslint/no-unsafe-argument`)
- `.update({ revision_number: newRevisionNumber })` → `.update({ revision_number: newRevisionNumber } as Record<string, unknown>)` (corrigeait `TS2353 : revision_number not in types`)

---

## Grep propagateOrderCustomer

```
Grep pattern: propagateOrderCustomer
Path: apps/back-office/src/app/api
Result: No files found
```

Zéro occurrence dans le code source. Seule mention restante : `docs/scratchpad/dev-plan-2026-04-19-BO-FIN-039.md` (document de planification, non-code).

---

## Validation type-check

```
pnpm --filter @verone/back-office type-check
> tsc --noEmit
[no output — PASS]
```

Exit code : 0

---

## Validation lint

```
pnpm --filter @verone/back-office lint
> eslint . --max-warnings=0
[no output — PASS]
```

Exit code : 0

---

## Architecture finale billing_org_id

| Champ             | Table                 | Valeur                                                               |
| ----------------- | --------------------- | -------------------------------------------------------------------- |
| `customer_id`     | `sales_orders`        | Org commande (Pokawa Avignon) — INCHANGÉ                             |
| `partner_id`      | `financial_documents` | Org commande (Pokawa Avignon) — R5 finance.md                        |
| `billing_org_id`  | `financial_documents` | Org facturation (Pokawa SAS) ou null                                 |
| `qonto_client_id` | (Qonto)               | Basé sur billingOrg si présente (résolu via resolve-qonto-client.ts) |

---

## Guard SIRET devis (présent)

`route.post.ts` lignes 73-82 : si `effectiveCustomerType === 'organization'` et `!vatNumber && !taxId` → HTTP 400 avec message clair. Symétrique avec le guard factures dans `resolve-qonto-client.ts`.

---

## Ce qui reste (hors scope BO-FIN-039)

- Migration SQL `20260430_add_billing_org_id_to_financial_documents.sql` — créée mais NON appliquée (FEU ROUGE Romeo)
- Régénération types Database après application migration (Romeo)
- Bug UI livraison `OrganisationCard.tsx:272-277` → tâche séparée
- BO-FIN-040 auto-resolve maison mère — BLOQUÉ en attente décision Romeo

---

## Verdict

**READY_FOR_REVIEW** — type-check PASS, lint PASS, zéro propagation vers sales_orders, billing_org_id persisté dans financial_documents pour devis et factures.
