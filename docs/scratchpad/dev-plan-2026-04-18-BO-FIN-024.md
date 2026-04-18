# Dev Plan — BO-FIN-024 — Fix 3 bugs modal commande → devis/facture

**Date** : 2026-04-18  
**Branche** : `fix/BO-FIN-024-commande-devis-bugs`  
**Scope** : 3 bugs distincts

---

## Fix 1 — TVA 0% dans modal devis (P0 fiscal)

### Cause racine

`use-fetch-order.ts:71` : le select Supabase sur `sales_order_items` ne récupère pas `tax_rate`.  
`page.tsx:176` : le mapping `IOrderForDocument` utilise `order.tax_rate` (taux global) au lieu de `item.tax_rate`.

### Fichiers à modifier

1. `apps/back-office/src/app/(protected)/canaux-vente/linkme/commandes/[id]/details/use-fetch-order.ts`
   - Ajouter `tax_rate` dans le select `sales_order_items ( id, product_id, quantity, unit_price_ht, total_ht, tax_rate, products ( name, sku ) )`

2. `apps/back-office/src/app/(protected)/canaux-vente/linkme/commandes/[id]/details/components/types.ts`
   - `SalesOrderItemRaw` : ajouter `tax_rate: number | null`
   - `OrderWithDetails.items` : ajouter `tax_rate: number | null`

3. `apps/back-office/src/app/(protected)/canaux-vente/linkme/commandes/[id]/details/page.tsx`
   - Ligne 176 : `tax_rate: order.tax_rate ?? 0.2` → `tax_rate: item.tax_rate ?? order.tax_rate ?? 0.2`

4. `apps/back-office/src/app/(protected)/canaux-vente/linkme/commandes/[id]/details/use-fetch-order.ts`
   - Mapper `tax_rate` dans `setOrder` items (ligne 210-214)

### Règles préservées : R1 (aucun changement totaux), R2 (prix readonly), R6 (status check inchangé)

---

## Fix 2 — Sélecteur organisation livraison dans modal devis (P1 UX)

### Décision de scope (simplification vs brief)

Le brief demande un `OrganisationShippingPicker` dans `@verone/organisations`. Après analyse :

- Le type `IOrderForDocument.organisations` n'expose pas `enseigne_id` → besoin de l'étendre
- Le modal `QuoteCreateFromOrderModal` doit recevoir les orgs du groupe via props ou fetch interne
- La route API `/api/qonto/quotes` doit accepter `shippingAddress`

**Stratégie retenue** : ajouter `enseigne_id` à `IOrderForDocument.organisations`, créer un sélecteur inline dans `QuoteCreateFromOrderModal` (pas de nouveau package), persister `shipping_address` en DB local.

### Fichiers à modifier

1. `packages/@verone/finance/src/components/order-select/types.ts`
   - `IOrderForDocument.organisations` : ajouter `enseigne_id?: string | null`

2. `apps/back-office/src/app/(protected)/canaux-vente/linkme/commandes/[id]/details/page.tsx`
   - `orderForDocument.organisations` : ajouter `enseigne_id: order.organisation.enseigne_id`

3. `packages/@verone/finance/src/components/QuoteCreateFromOrderModal/index.tsx`
   - Ajouter states : `shippingOrgId`, `shippingAddress`, `hasDifferentShipping`, `availableOrgs`
   - Fetch orgs du groupe via `enseigne_id` (si présent)
   - Section UI "Adresse de livraison" avec toggle + combobox simple

4. Route API `apps/back-office/src/app/api/qonto/quotes/route.ts`
   - `IPostRequestBody` : ajouter `shippingAddress?: IDocumentAddress`
   - `saveQuoteToLocalDb` : persister `shipping_address` jsonb
   - `buildAndCreateQontoQuote` : injecter dans `footer` si présent

---

## Fix 3 — Sauvegarde modifications articles (P0 data)

### Cause racine

RLS sur `sales_order_items` : pas de policy UPDATE pour les staff back-office.
`linkme_users_update_own_order_items` couvre les affiliés LinkMe uniquement.
Quand `handleSaveItems()` (hooks.ts:141) appelle `supabase.from('sales_order_items').update(...)`, Supabase RLS bloque sans erreur visible (retourne 0 rows updated).

### Fichier à créer

`supabase/migrations/20260418_staff_update_sales_order_items.sql`

```sql
CREATE POLICY "staff_update_sales_order_items"
ON sales_order_items
FOR UPDATE
TO authenticated
USING (is_backoffice_user())
WITH CHECK (is_backoffice_user());
```

### Vérification

Après migration : `handleSaveItems()` doit retourner `{ data, error: null }` et `fetchOrder()` doit refléter les nouvelles valeurs.

---

## Ordre d'exécution

1. Fix 1 (code pur, aucune migration) → commit 1
2. Fix 3 (migration SQL) → commit 2
3. Fix 2 (feature shipping picker) → commit 3

## Type-check obligatoire après chaque commit

```bash
pnpm --filter @verone/finance type-check
pnpm --filter @verone/back-office type-check
pnpm --filter @verone/back-office build
```
