# Dev Report — BO-FIN-023 Sprint 1

**Date** : 2026-04-21
**Task ID** : `[BO-FIN-023]`
**Sprint** : 1/6 — helper `planCascadeCancel` + `executeCascade`
**Branche** : `feat/BO-FIN-023-cascade-order-docs`
**Commit** : `a896b6503`

---

## Fichier créé

`apps/back-office/src/lib/orders/cascade-cancel-linked-docs.ts`

- **Lignes** : ~300 (après prettier)
- **Exports** : `LinkedDoc`, `CascadeVerdict`, `planCascadeCancel`, `executeCascade`

---

## Résultats validations

- **Type-check** : VERT — `pnpm --filter @verone/back-office type-check` → 0 erreur
- **Lint** : VERT — `pnpm --filter @verone/back-office lint` → 0 warning, 0 erreur

---

## Push

- Branche `feat/BO-FIN-023-cascade-order-docs` poussée sur origin
- Hash commit : `a896b6503`

---

## Surprise rencontrée

L'enum `document_type` dans le schéma TypeScript généré est large
(`'customer_invoice' | 'customer_credit_note' | 'supplier_invoice' | ...`).
Les premières comparaisons incluaient `'quote'` et `'invoice'` (aliases fictifs)
qui se trouvaient hors de l'union TypeScript → 3 erreurs `TS2367`.

**Fix** : suppression des aliases, comparaisons uniquement sur `'customer_quote'`
et `'customer_invoice'` (valeurs confirmées par requête SQL sur la DB réelle).

---

## Décisions prises

1. **Import `createAdminClient`** depuis `@verone/utils/supabase/server`
   (réexporte depuis `admin.ts` — pattern existant dans `purchase-orders.ts`).
2. **`QontoError`** importé directement depuis `@verone/integrations/qonto`
   (exporté via `export * from './errors'` dans l'index).
3. **Type guard `isValidDocRow`** pour les rows DB : filtre silencieusement
   les docs sans `qonto_invoice_id` (ne devrait pas arriver, mais zéro crash).
4. **Switch exhaustif** sur `QontoQuoteStatus` et `QontoInvoiceStatus`
   avec branche `default: never` pour capturer tout nouveau statut Qonto.
5. **404/410 Qonto** → log warning + `CASCADE_AUTO` (doc déjà absent, on soft-delete local).

---

## Sprint suivant

Sprint 2 : route `POST /api/sales-orders/[id]/cancel`

- Appelle `planCascadeCancel` + `executeCascade`
- Retourne `{ requireConfirm, reason, docsToDelete }` si HTTP 409
- Retourne `{ error, reason }` si HTTP 400
