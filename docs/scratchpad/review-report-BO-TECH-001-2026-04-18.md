Verdict : PASS

# Review Report — BO-TECH-001 — 2026-04-18

Sprint : BO-TECH-001 (refactor iso-fonctionnel /api/qonto/invoices/route.ts)
Branche : `refactor/BO-TECH-001-route-qonto-invoices`
Base : `origin/staging`
Decoupage : 926 lignes → route.ts 286L + 9 modules `_lib/`

---

## Verification des 10 points obligatoires

### 1. Messages d'erreur — PASS (identiques a la virgule)

Tous les 8 messages verifies un par un :

- `"salesOrderId is required"` (400) → route.ts:125
- `"Le SIRET ou numéro de TVA de l'organisation est requis pour créer une facture. Veuillez le renseigner dans la fiche organisation."` (400) → resolve-qonto-client.ts:52-54
- `"Adresse de facturation incomplète. Ville et code postal requis."` (400) → resolve-qonto-client.ts:83
- `"No active Qonto bank account found"` (500) → route.ts:182
- `"Order not found"` (404) → fetch-order-with-customer.ts:39
- `"Une facture finalisée existe déjà pour cette commande : ${...}. Impossible de la remplacer."` (409) → duplicate-guard.ts:36
- `"Impossible de supprimer la proforma existante (${...}). Veuillez reessayer."` (500) → duplicate-guard.ts:67
- `` `Erreur creation document local: ${...}` `` (500) → persist-financial-document.ts:128

### 2. Status HTTP — PASS

Tous les codes preserves : 400 (4 cas), 404, 409, 500 (4 cas), 200 implicite. Aucune divergence.

### 3. Logs console — PASS

Tous les `console.error` et `console.warn` avec prefixe `[API Qonto Invoices]` preserves dans les memes contextes.

### 4. Payload INSERT financial_documents — PASS

25 champs verifies champ par champ entre original (L790-826) et persist-financial-document.ts (L76-110). Tous presents, meme logique, meme casts (`(bodyBillingAddress ?? order.billing_address) as Json`). Le cast `(finalizedInvoice as unknown as Record<string, unknown>).number` preserve a l'identique.

### 5. Payload INSERT financial_document_items — PASS

Structure identique : `document_id`, `product_id`, `description`, `quantity`, `unit_price_ht`, `total_ht`, `tva_rate` (multiplie par 100), `tva_amount`, `total_ttc`, `sort_order`. Cast `as unknown as { from: ... }` reproduit a l'identique.

### 6. Ordre d'execution POST — PASS

guard → fetch → resolve → bank accounts → build items → compute dates → create invoice → correction date → finalize → persist → return. Identique a l'original.

### 7. Side effects Qonto — PASS

- `findClientByEmail` prioritaire, `findClientByName` en fallback via `??=` (resolve-qonto-client.ts:118-122)
- `updateClient` si existant / `createClient` si nouveau — logique identique
- `createClientInvoice` → check `issue_date` → `updateClientInvoice` si mismatch → `finalizeClientInvoice` si `autoFinalize && draft`
- `deleteClientInvoice` try/catch non-bloquant dans duplicate-guard.ts

### 8. Typage — PASS

Zero `any` introduit. Zero `@ts-ignore`. Zero `eslint-disable`.

### 9. Auth pattern — PASS

`createAdminClient()` dans route.ts pour toutes les queries DB. `createServerClient()` uniquement dans persist-financial-document.ts pour recuperer `authUser.id` (created_by).

### 10. Rate limiting — PASS

`withRateLimit(request, RATE_LIMIT_PRESETS.api)` en debut de POST, meme pattern de retour anticipe (route.ts:99-105).

---

## Observations sans impact fonctionnel

### NOTE — Double computation des fees (route.ts:229-235)

`feesVatRate`, `shippingCost`, `handlingCost`, `insuranceCost` calcules dans `buildInvoiceItems` et a nouveau dans route.ts pour `persistFinancialDocument`. Formules identiques, memes inputs, aucune divergence. Dette technique a eliminer dans BO-FIN-009.

### NOTE — select('\*') avec .single() (fetch-order-with-customer.ts:54,64)

Le `.single()` implique un limit(1) PostgreSQL. Pattern identique a l'original. Non bloquant.

### NOTE — Branche morte (route.ts:155-160)

`fetchOrderWithCustomer` ne peut jamais retourner `{ order: null, error: null }`. La guard `if (!typedOrder)` est donc du code mort. Inoffensif mais peut creer de la confusion lors de BO-FIN-009.

---

## PR autorisee

Refactor strictement iso-fonctionnel. Aucun changement de comportement externe detecte. Aucun CRITICAL. Aucun WARNING bloquant.

Taille route.ts : 286L (< 400L, conforme regle repo).
Type-check : PASS 0 erreur.

Dettes techniques mineures a tracker dans BO-FIN-009 (duplication fees, code mort).
