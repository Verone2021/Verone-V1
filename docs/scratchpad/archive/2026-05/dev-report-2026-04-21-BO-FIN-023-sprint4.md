# Dev Report — BO-FIN-023 Sprint 4 : Cascade order validation on quote accept

**Date** : 2026-04-21
**Task ID** : `[BO-FIN-023]`
**Branche** : `feat/BO-FIN-023-cascade-order-docs`
**Commit** : `d068f08bb`

---

## Fichier modifié

`apps/back-office/src/app/api/qonto/quotes/[id]/accept/route.ts`

---

## Vérifications préalables effectuées

### Schéma `sales_orders`

- Colonne `order_number` : `varchar NOT NULL` — confirmé dans `docs/current/database/schema/03-commandes.md`
- Colonne `confirmed_at` : `timestamptz YES` — nullable, modifiable
- Colonne `confirmed_by` : `uuid YES` — nullable, FK vers `auth.users`
- Colonne `status` : `enum:sales_order_status NOT NULL` — FSM contrôlé par triggers

### Pattern Supabase dans les routes API

- `createAdminClient()` sans type générique explicite : pattern standard du projet (inférence automatique via définition de fonction — ex. `invoices/service/route.ts`, `quotes/[id]/convert/route.ts`)
- `createServerClient()` avec `await` pour récupérer l'utilisateur courant : pattern identique à `quotes/[id]/convert/route.ts` lignes 108-111

---

## Diff résumé

**Imports ajoutés** :

```ts
import {
  createAdminClient,
  createServerClient,
} from '@verone/utils/supabase/server';
```

**Bloc cascade ajouté** entre `const data = (await response.json())` et `return NextResponse.json(...)` :

1. `createServerClient()` → `auth.getUser()` → `userId` (nullable)
2. `createAdminClient()` → `financial_documents` `.eq('qonto_invoice_id', id)` `.eq('document_type', 'customer_quote')` → `docRow.sales_order_id`
3. Si `sales_order_id` non null → `sales_orders.select('id, order_number, status').eq('id', ...).single()`
4. Si `order?.status === 'draft'` → `sales_orders.update({ status: 'validated', confirmed_at, confirmed_by?, updated_at }).eq('id', ...).eq('status', 'draft')` (double guard race condition)
5. `validatedOrder` retourné dans la réponse JSON (`null` si pas de cascade)

**Réponse enrichie** :

```ts
return NextResponse.json({
  success: true,
  quote: data.quote,
  message: 'Devis marqué comme accepté',
  validatedOrder, // { id, number } ou null
});
```

---

## Triggers DB déclenchés automatiquement

Lors du passage `draft → validated` via UPDATE :

- `trg_lock_prices_on_validation` — lock prix items
- `trigger_so_update_forecasted_out` — stock prévisionnel sortant
- `trg_create_linkme_commission` — commission LinkMe si applicable
- `sales_order_status_change_trigger` → `handle_sales_order_confirmation` → stock_movements forecast

Ces triggers sont protégés (`.claude/rules/stock-triggers-protected.md`) et non modifiés.

---

## Comportement si cascade échoue

| Scénario                                             | Comportement                                                                                          |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `docRow` introuvable (devis sans commande liée)      | `validatedOrder = null`, route réussit                                                                |
| `order.status !== 'draft'` (déjà validée, expédiée…) | `validatedOrder = null`, route réussit, FSM respecté                                                  |
| `UPDATE` SQL échoue (erreur Supabase)                | Log `console.error`, `validatedOrder = null`, route réussit — l'utilisateur peut valider manuellement |
| Exception levée dans le bloc `try`                   | `catch` attrape, log `console.error`, `validatedOrder = null`, route réussit                          |

La route **ne peut pas échouer à cause de la cascade**. L'action primaire (accept Qonto) est toujours prioritaire.

---

## Type-check / Lint

```
pnpm --filter @verone/back-office type-check  → 0 erreur
pnpm --filter @verone/back-office lint        → 0 erreur, 0 warning
```

Correction lint intermédiaire : `order && order.status === 'draft'` → `order?.status === 'draft'` (`@typescript-eslint/prefer-optional-chain`).

---

## Commit & Push

```
[feat/BO-FIN-023-cascade-order-docs d068f08bb] [BO-FIN-023] feat: auto-validate draft order on quote accept
 2 files changed, 85 insertions(+), 1 deletion(-)
Push → origin/feat/BO-FIN-023-cascade-order-docs ✅
```

---

## Ce qui n'a PAS été touché

- Helper sprint 1
- Route sprint 2
- Modals sprint 3
- UI `/factures/[id]/` (sprint 5)
- Aucun trigger stock
- Aucune route API existante autre que le fichier cible
