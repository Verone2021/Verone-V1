# Blind audit BO-SHIP-003 — 2026-04-17

**Auteur** : reviewer-agent (blind audit pre-PR, read-only strict)

## Verdict : PASS WITH WARNINGS

0 CRITICAL. 4 WARNING non bloquants.

## CRITICAL (0)

Aucun.

## WARNING (4)

### [WARNING-1] Casts `as string | null` / `as number | null` dans use-shipment-detail.ts

- Fichier : `packages/@verone/orders/src/hooks/use-sales-shipments/use-shipment-detail.ts` lignes 149, 269, 273, 274
- Problème : casts typés (pas `any`) mais masquent l'inférence Supabase à cause de la query template-string dynamique. Si une colonne est renommée, le type-check ne détectera pas l'erreur.
- Fix : utiliser query statique pour générer les types automatiquement, OU commenter explicitement pourquoi les casts sont inévitables.

### [WARNING-2] `supabase` dans deps useCallback de `loadSalesOrderForShipment`

- Fichier : `use-shipment-detail.ts` ligne 149
- Problème : `createClient()` appelé à chaque render. `supabase` instable → recreation du callback à chaque render. Chaîne avec `loadShipmentHistory` (ligne 349) et `handleRefreshHistory` (use-expeditions-history.ts ligne 72).
- Mitigation : `createClient()` utilise un cache singleton via `globalThis` donc risque limité en pratique.
- Fix : ajouter commentaire explicatif ou utiliser `useMemo`.

### [WARNING-3] Fallback silencieux `onEditSuccess ?? onClose`

- Fichier : `expeditions-history-modal.tsx` ligne 251
- Problème : si `onEditSuccess` est absent (prop optionnelle), le bouton Modifier ferme simplement le modal sans rafraîchir. Risque de passer inaperçu lors des tests.
- Fix : rendre `onEditSuccess` non-optionnel, ou logger warning si absent.

### [WARNING-4] Validation Zod tracking_url accepte chaîne vide

- Fichier : `sales-shipments.ts` schéma Zod + conversion dans action (ligne 266)
- Problème : `z.string().url().optional().or(z.literal(''))` accepte `''` et l'action convertit `'' || null`. La transformation est dans l'action, pas le schéma → incohérence entre validé et persisté.
- Fix : `.transform(v => v || null)` dans le schéma Zod.

## INFO

- **I1** : `revalidatePath` utilise `shipment.sales_order_id` récupéré en DB (pas depuis le client). Sécurisé.
- **I2** : RLS `backoffice_full_access_sales_order_shipments` ALL via `is_backoffice_user()` — conforme.
- **I3** : Guard `delivery_method === 'manual'` présent côté serveur (ligne 253 action). UI additionnelle mais protection réelle server-side.
- **I4** : UPDATE ne touche que les 5 champs éditables. `quantity_shipped`, `delivery_method`, colonnes Packlink absents → triggers stock ne se déclenchent pas.

## Conclusion

Sécurité serveur respectée, RLS en place, promesses wrappées `void ... .catch()`, zéro `any`/`as any` (les casts typés sont acceptables), zéro `eslint-disable` ajouté, useEffect deps stables sur les nouvelles fonctions. **Prêt pour PR.**
