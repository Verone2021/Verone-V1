# Review Report — 2026-09-16

## Chantier : BO-SOURCING-COMPLETUDE-001 / SAMPLE-002 / ETAPES-003 / OFFRES-004

## Verdict : FAIL

---

### CRITICAL — packages/@verone/products/src/components/sourcing/notebook/SourcingPriceHistory.tsx:283 — Promesse flottante sur le bouton « Adopter ce prix »

**Problème** :

```tsx
onClick={() => onAdoptPrice(entry)}
```

`onAdoptPrice` est typé `(entry: SourcingPriceEntry) => void` dans les props, mais l'implémentation réelle (`adoptCostPrice` dans `use-sourcing-pricing.ts`) est `async`. Absence de `try/catch` interne dans `adoptCostPrice` : la fonction appelle `await addCommunication(...)`, et `addCommunication` fait `if (error) throw error` (ligne 235 de `use-sourcing-notebook.ts`). Sur une erreur Supabase (réseau, RLS, timeout), l'erreur remonte sans être capturée → rejet de Promesse non géré. L'utilisateur ne voit aucun message d'erreur.

**Fix** : Ajouter un bloc `catch` dans `adoptCostPrice` (use-sourcing-pricing.ts) :

```ts
} catch (error) {
  console.error('[useSourcingPricing] adoptCostPrice failed:', error);
  toast({
    title: 'Erreur',
    description: "Le prix d'achat n'a pas pu être repris. Réessayez.",
    variant: 'destructive',
  });
  return false;
}
```

(Le `finally { setAdoptingPriceId(null); }` existant suffit pour le reset d'état.)

---

### WARNING — packages/@verone/common/src/hooks/use-inline-edit.ts:1 — Fichier à 518 lignes (limite : 400)

**Problème** :
Le fichier était à 489 lignes sur `staging` (déjà hors limite). Ce PR ajoute 29 lignes supplémentaires sans décomposer. La fonction `saveChanges` seule encode la logique de mise à jour de 5 tables différentes (products, organisations, contacts, sales_orders, purchase_orders) dans un seul `if / else if` de ~200 lignes.

**Fix** : Extraire les 5 branches table en helpers privés (ex. `saveProductSection`, `saveOrganisationSection`, etc.) ou déplacer la logique table-spécifique dans chaque module consommateur. La partie générique (ref-mirror, startEdit, cancelEdit, updateEditedData) doit rester dans ce hook.

---

### WARNING — packages/@verone/products/src/components/sourcing/product-page/SourcingOffersSection.tsx:90-103 — `compareOffers` appelé deux fois par render

**Problème** :

```ts
// Dans SourcingOffersSection (parent)
const comparison = compareOffers(
  offers.map(offer => ({ ...offer, quotedPrice: offer.quoted_price, ... })),
  product.target_price
);
const bestLandedCost = comparison.find(item => item.isBest)?.cost.landedUnitCost ?? null;
```

`SourcingOffersComparison` (enfant) recalcule ensuite `compareOffers` de son côté avec les mêmes données. `offers.map(...)` crée un nouveau tableau à chaque render, rendant toute mémoïsation inefficace. À faible n (3-10 fournisseurs) ce n'est pas bloquant, mais c'est de la computation dupliquée sans justification.

**Fix** : Calculer `comparison` une seule fois dans le parent, passer `bestLandedCost` comme prop à `SourcingOffersComparison`, et laisser l'enfant recevoir le tableau `comparison` calculé — ou passer `bestLandedCost` directement sans le recalcul dans l'enfant.

---

### INFO — supabase/migrations/20260916020000\_...sql:42 vs sourcing-completeness.ts:95 — Parité SQL / TypeScript : divergence sur les chaînes vides

**Note** :
SQL : `WHERE p.supplier_id IS NULL` et `WHERE p.subcategory_id IS NULL`.
TypeScript : `hasText(p.supplier_id)` et `hasText(p.subcategory_id)`, ce qui rejette aussi les chaînes vides `""`.

Si `supplier_id` ou `subcategory_id` vaut `""` en base (impossible avec une FK UUID, mais défensif), l'écran dirait « manquant » et la base dirait « présent ». Risque nul en pratique. À documenter dans le commentaire de `sourcing_missing_fields` pour les lecteurs futurs.

---

### INFO — packages/@verone/common/src/hooks/use-inline-edit.ts:119 — `createClient()` instancié sans mémoïsation

**Note** :
`const supabase = createClient();` est appelé à chaque render du composant hôte. La référence figure dans le tableau de dépendances de `saveChanges` (ligne 503), ce qui régénère `saveChanges` à chaque render. Pré-existant (hors périmètre direct de ce PR). Fix : `const supabase = useRef(createClient())` ou `useMemo(() => createClient(), [])`.

---

## Vérifications passées (pour mémoire)

- **Rétro-compatibilité `useInlineEdit`** : le paramètre `payload` est optionnel ; tous les appelants existants qui ne le passent pas fonctionnent à l'identique (le path `payload === undefined && !sectionState?.hasChanges` couvre l'ancienne garde). La mutation directe de `sectionState.editedData['min_stock']` est remplacée par une copie (`dataToSave`) : regression corrigée.
- **Parité SQL / TypeScript (poids)** : `weight` est `blocking: false` en TypeScript et absent de la fonction SQL — intentionnel, documenté, cohérent.
- **Fonctions SQL recopiées (migration A1)** : `apply_product_lifecycle_action` et `request_sample_order` — les trois DELTA (déclaration `v_missing`, ajout `'archived'` dans `reopen`, remplacement des contrôles en dur par `sourcing_missing_fields`) sont les seules différences vérifiées. Aucune autre ligne modifiée.
- **Migration A4** : colonnes `quoted_shipping_ht` / `quoted_customs_ht` bien nullable, `quoted_currency` / `shipping_scope` NOT NULL avec DEFAULT (safe sur table existante). Contraintes CHECK complètes. `adopt_sourcing_offer` : verrous dans l'ordre candidat → produit (pas de deadlock dans les cas d'usage documentés) ; aucune colonne de stock écrite ; droits `REVOKE PUBLIC/anon + GRANT authenticated/service_role` conformes à R-GRANT. Rollback complet (DROP FUNCTION + 5 DROP CONSTRAINT + 4 DROP COLUMN + 1 ALTER DEFAULT).
- **Calculs purs** : `offerLandedUnitCost` — division par zéro impossible (`quantity = Math.max(1, ...)`) ; `compareOffers` — division par `cible` protégée par `cible > 0`. Arrondi `round2` via `Number.EPSILON` conforme au pattern de `allocate_po_fees_and_calculate_unit_cost`.
- **SourcingCandidateSuppliers.tsx supprimé** : aucune référence dans les sources (seul `.next/` de build). L'export a déjà été retiré de `sourcing/index.ts` dans le HEAD commité. Clean.
- **Contrat plugin Chrome** (`/api/sourcing/import`) : les colonnes ajoutées (A4) sont toutes `IF NOT EXISTS` et ont des valeurs par défaut ; aucune n'est `NOT NULL` sans défaut. Le plugin insère uniquement dans `products` et `sourcing_candidate_suppliers` — les champs qu'il écrit (`product_id`, `supplier_id`, statut) ne sont pas touchés par les migrations A1-A4. Contrat préservé.
- **Zéro `any`, `@ts-ignore`, `eslint-disable` introduits** (grep `git diff staging..HEAD` sur motifs ANTI-RACCOURCIS) : sortie vide.
- **Responsive** : `ResponsiveDataView` utilisé dans `SourcingOffersComparison` avec `renderTable` + `renderCard` ; touch targets `h-11 md:h-9` / `h-11 w-11 md:h-8 md:w-8` présents. Colonnes masquables progressivement (`hidden lg:table-cell`, `hidden xl:table-cell`). Conforme aux 5 techniques.

---

## Corrections apportées après la relecture — 2026-09-16

### CRITICAL — promesse sans filet sur « Adopter ce prix » : **corrigé**

`packages/@verone/products/src/hooks/sourcing/use-sourcing-pricing.ts`

Le prix d'achat était écrit, puis `addCommunication` était appelée sans protection : une erreur
réseau ou RLS sur le journal remontait à l'appelant, qui se contentait d'un `console.error`.
L'utilisateur ne voyait rien — alors que le prix, lui, avait changé.

L'écriture du journal est désormais dans son propre `try/catch`. En cas d'échec, l'opération est
comptée comme réussie (elle l'est : le prix est écrit) et l'utilisateur reçoit un message qui dit
exactement ce qui s'est passé : « Le prix est bien à jour, la trace au journal n'a pas pu être
enregistrée. » Plus aucun chemin silencieux.

### WARNING — `use-inline-edit.ts` à 518 lignes : **corrigé**

La partie « écriture en base » a été sortie dans
`packages/@verone/common/src/hooks/inline-edit-persist.ts`.

- `use-inline-edit.ts` : 518 → **309 lignes**
- `inline-edit-persist.ts` : **253 lignes**

**Aucun changement de comportement** : la logique extraite a été comparée ligne à ligne avec la
version d'origine (commentaires retirés, espaces réduits). Les seules différences sont des retours
à la ligne dus au nouveau niveau d'indentation. Le client Supabase est typé
(`ReturnType<typeof createBrowserClient<Database>>`), aucun `any` n'a été introduit.

### WARNING — comparatif d'offres calculé deux fois : **corrigé**

`SourcingOffersSection` calculait le comparatif pour en extraire le meilleur coût rendu, puis
`SourcingOffersComparison` le recalculait à l'identique. Le calcul est maintenant fait **une seule
fois** chez le parent et passé en propriété (`comparison`), avec un type partagé `OfferLine`.

### Contrôles après corrections

- `@verone/common` : type-check et lint verts.
- `@verone/products` : lint vert ; type-check limité aux 2 erreurs connues, en attente de la
  migration A4.
- Les 4 tests unitaires du sourcing : verts.
