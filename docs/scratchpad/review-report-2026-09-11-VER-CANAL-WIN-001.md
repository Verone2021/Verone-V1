# Review Report — 2026-09-11

## Bloc : VER-CANAL-WIN-001 — Canal « Want It Now »

## Verdict : FAIL

---

### CRITICAL — feed.test.ts:68 — `as unknown as` sans justification

**Problème** : `feed.produits as unknown as Record<string, unknown>[]`
Correspond au pattern interdit « `as unknown as X` ajouté » (code-standards.md § ANTI-RACCOURCIS → CRITICAL automatique). Aucun commentaire justificatif présent.

**Fix** :

```typescript
// Changer la signature de acceptWantItNowProduct pour accepter le type exact :
export function acceptWantItNowProduct(product: WantItNowFeedProduct): boolean {
  const supplier = product.fournisseur;
  if (!product.sku || !product.nom) return false;
  if (typeof product.prix_achat !== 'number' || product.prix_achat < 0)
    return false;
  if (!supplier?.nom) return false;
  if (!product.disponible) return false;
  return product.photos.every(url => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  });
}
// → plus besoin du cast, les deux types sont compatibles
```

---

### WARNING — feed.ts:141 / use-want-it-now-channel.ts:42 — Divergence cost_price=0 entre feed et UI

**Problème** : `toPurchasePrice(0)` retourne `0` (le produit part dans le flux avec `prix_achat: 0`). Mais `isEmittedToFeed` dans le hook UI vérifie `cost_price > 0` (strict) et compte un produit à 0 € comme « Incomplet ». `WantItNowPublicationCard` affiche « Sans prix d'achat : ce produit ne partira pas dans le flux » pour cost_price=0, alors qu'il part bien. Le contrat passation § 5 valide `prix_achat ≥ 0`. Confusion UX potentielle.

**Fix** : Aligner `toPurchasePrice` sur le même seuil strict que l'UI :

```typescript
// feed.ts:141
if (costPrice === null || !Number.isFinite(costPrice) || costPrice <= 0) {
  return null;
}
```

Et ajuster le commentaire de la passation (prix_achat=0 n'a pas de sens métier pour un produit physique).

---

### WARNING — use-product-detail.tsx:165 / use-want-it-now-channel.ts:46 — Cache TanStack Query non invalidé après toggle

**Problème** : Quand `handleProductUpdate({ is_published_want_it_now: ... })` est appelé depuis `WantItNowPublicationCard`, le cache `['want-it-now-channel-products']` (page canaux-vente/want-it-now) n'est jamais invalidé. Si l'utilisateur bascule sur la page canal en moins de 60 secondes (staleTime), les KPIs affichent des données obsolètes. Viole le standard « await queryClient.invalidateQueries() après mutation » (code-standards.md).

**Fix** : Dans `handleProductUpdate`, après un succès qui concerne `is_published_want_it_now`, invalider le cache :

```typescript
// use-product-detail.tsx, dans le bloc else du succès Supabase
if ('is_published_want_it_now' in updatedData) {
  await queryClient.invalidateQueries({
    queryKey: ['want-it-now-channel-products'],
  });
}
```

Nécessite d'injecter `queryClient` dans le hook.

---

### INFO — route.ts:87 — Effet de bord d'un GET (recordWantItNowExport)

**Note** : `recordWantItNowExport` écrit `last_export_at` à chaque GET du flux. Sémantiquement inhabituel mais volontaire et documenté dans le commentaire de la route (« passation Want It Now du 2026-09-10 »). Si l'écriture échoue, la route retourne quand même 200 et log l'erreur — comportement correct (ne pas bloquer la livraison du flux pour une donnée d'audit). Acceptable.

---

### INFO — Tests — Route HTTP non couverte

**Note** : Les 15 tests couvrent `feed.ts` et `token.ts` avec une excellente couverture (cas limites contrat, jeton, sku en double, plafond, photos HTTPS, alias pièces). La route `route.ts` elle-même (comportement HTTP : 401 sans token, 500 si Supabase down, 200 + Cache-Control no-store) n'a pas de test d'intégration. Acceptable dans le cadre d'une PR initiale ; à documenter comme dette.

---

## Axes OK (non bloquants)

**Sécurité** : Authentification Bearer via `timingSafeEqual` sur SHA-256 des deux côtés → longueurs identiques, temps constant garanti. Pas de jeton en base, pas de jeton dans les logs. Client admin (service_role) justifié (route sans session utilisateur). `Cache-Control: no-store` présent. RLS `feed_configs` : policy `FOR ALL TO authenticated USING (is_backoffice_user())` — `anon` ne peut pas lire `access_token` (défaut deny car aucune policy pour `anon`). Conforme.

**Conformité contrat** : Les 15 tests passent, le document produit est identique au jeu d'essai de la passation champ pour champ. Champs interdits absents (prix de vente, marge, notes, affilié). `version: "2.0"`, `devise: "EUR"`, `canal: "want-it-now"` présents. Traitement `disponible: false`, absence de `fournisseur`, plafond 2001 → tous testés. Aliases pièces (`hall_entree→entree`, `toilettes→wc`, `salon_sejour→salon`) corrects.

**Migration** : Additive (pas de donnée supprimée). `lock_timeout = '5s'` présent. Style CHECK élargi aux 4 nouveaux styles WIN 2026, styles existants en production non affectés (0 produit avec `bord_de_mer` en DB). `feed_configs.access_token` passé en nullable (jeton vit dans env var).

**Responsive** : `ResponsiveDataView` utilisé avec `renderTable` + `renderCard`. Colonnes masquables (`hidden lg:table-cell`). Touch target 44px mobile sur le switch (`h-11 min-w-11 md:h-auto md:min-w-0`). Pas de `w-auto`, pas de largeur fixe sur colonne principale. Conforme aux 5 techniques.

**Qualité générale** : Zéro `any`, zéro `@ts-ignore`, zéro `eslint-disable`. `type-check` vert. ESLint vert (0 warning). Fichiers < 400 lignes. Imports `@verone/*` utilisés correctement. Fonctions bien nommées, responsabilité unique.

---

## Re-review 2026-09-11 (commit d9705b3d)

### Verdict : PASS

Chèques exécutés : `npx tsx feed.test.ts` → 16/16 ✅ ; `pnpm --filter @verone/back-office type-check` → 0 erreur ✅ ; `npx eslint --max-warnings=0` sur les 6 fichiers → 0 warning ✅. Aucun `as unknown as`, `as any`, `@ts-ignore`, `eslint-disable` introduit.

---

### CRITICAL précédent résolu — feed.test.ts:68 — `as unknown as` supprimé

`feed-test-helpers.ts` : signature de `acceptWantItNowProduct` passée de `Record<string, unknown>` à `WantItNowFeedProduct` (type exporté de `feed.ts`). Le cast `feed.produits as unknown as Record<string, unknown>[]` a disparu. `feed.test.ts` accède maintenant directement à `feed.produits` sans transtypage. ESLint 0 warning confirme l'absence de tout pattern anti-raccourci résiduel. **RÉSOLU.**

---

### WARNING 1 précédent résolu — feed.ts:141 — Divergence cost_price=0 alignée

`toPurchasePrice` : seuil passé de `costPrice < 0` à `costPrice <= 0`. Commentaire JSDoc ajouté ("Un prix d'achat nul ou négatif n'a pas de sens métier : le produit n'est pas émis."). Nouveau test « un prix d'achat à 0 € n'est pas émis, comme l'annonce l'écran du canal » vérifie que `PRIX-ZERO` atterrit dans `skipped` avec `reason: 'prix_achat_manquant'`. Le canal et le flux sont maintenant cohérents sur le même seuil strict. **RÉSOLU.**

**Observation résiduelle (INFO, non bloquant)** : `acceptWantItNowProduct` dans `feed-test-helpers.ts:179` conserve le seuil `< 0` (= fidèle au § 9 de la passation : Want It Now accepte `prix_achat >= 0` côté partenaire). Ce delta intentionnel est correct — on émet _moins_ de produits que ce que leur contrat autorise, donc tout ce qu'on envoie passe leur validation. Mais comme `feed.ts` filtre en amont (`<= 0`), aucun produit à prix_achat=0 n'atteindra jamais `acceptWantItNowProduct` en pratique. La distinction « règle partenaire » vs « règle Vérone » gagnerait à être commentée en en-tête de la fonction pour un prochain lecteur.

---

### WARNING 2 précédent résolu — Invalidation cache inter-composants

`query-keys.ts` créé : deux constantes `as const` (`WANT_IT_NOW_CHANNEL_PRODUCTS_KEY`, `WANT_IT_NOW_CHANNEL_LAST_EXPORT_KEY`) partagées par `use-want-it-now-channel.ts` et `WantItNowPublicationCard.tsx`. La clé utilisée dans `invalidateQueries` est **la même instance** que celle du `useQuery` — cohérence garantie sans risque de désynchronisation de chaîne. Dans `WantItNowPublicationCard`, `await queryClient.invalidateQueries(...)` s'exécute **avant** `toast.success` dans le bloc `.then(async () => {...})`. Le bloc `.catch()` est préservé tel quel : toute erreur (y compris un échec de `invalidateQueries`) remonte au `.catch()` et déclenche le toast d'erreur. **RÉSOLU.**

---

### INFO précédents — toujours ouverts (non bloquants)

- **route.ts:87 — effet de bord GET `recordWantItNowExport`** : non touché dans ce commit. Comportement correct (échec d'écriture = log + 200 quand même). Reste acceptable.
- **Route HTTP sans test d'intégration** : non traité. Reste comme dette documentée (401 sans token, 500 si Supabase down, Cache-Control no-store).

---

### Résumé 6 lignes

1. CRITICAL `as unknown as` : supprimé — `acceptWantItNowProduct` est maintenant typé `WantItNowFeedProduct`, zéro cast résiduel.
2. WARNING cost_price=0 : aligné — `toPurchasePrice` refuse `<= 0`, nouveau test vert en preuve.
3. WARNING invalidation : résolue — clés partagées via `query-keys.ts`, `await invalidateQueries` avant toast, catch intact.
4. Aucun anti-raccourci introduit : ESLint 0 warning, type-check 0 erreur, 16/16 tests verts.
5. INFO résiduel mineur : seuil `acceptWantItNowProduct` reste `< 0` (fidèle contrat partenaire) pendant que feed filtre `<= 0` — delta intentionnel, documentable mais non bloquant.
6. Verdict : **PASS** — les 3 findings bloquants sont corrigés sans régression.

> Note coordinateur : le commit `d9705b3d` a été complété localement (commentaire d'en-tête demandé en INFO) et porte désormais le hash `f20c73d4` ; aucun changement de logique.
