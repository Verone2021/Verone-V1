# Review Report — 2026-09-15

## Verdict global : FAIL

Blocs audités : A (auth-wrapper), C (tabs-navigation), L (sidebar counters RPC), N (dead-code removal),
P (catalogue single-sheet + refactor splits), R (mobile headers + migrations/config).

Exclus conformément au scope : `profitability/**`, `use-product-sales-margin.ts`, `product-sales-margin*`,
`linkme/analytics/page.tsx`, `use-linkme-verone-margin.ts`, `VeroneNetMargin*`, migrations `2026091518*`,
`docs/scratchpad/*bloc-S*`.

TypeScript : deux erreurs dans `use-linkme-verone-margin.ts` (fichier exclu du scope — agent B encore actif).
ESLint sur les fichiers en scope : 0 erreur, 0 warning.
Anti-raccourcis (grep) : aucun `@ts-ignore`, aucun `as any` introduit, aucun seuil baissé, aucun `eslint-disable` ajouté.

---

### CRITICAL — CatalogueHeader.tsx / CatalogueTabs.tsx / CatalogueToolbar.tsx — Screenshots catalogue LIST absents

**Problème** : Les trois fichiers modifient le rendu de la page `/produits/catalogue` (liste des produits).
Per `.claude/rules/responsive.md`, cette page figure dans les **exceptions back-office à 5 tailles obligatoires**
(`/produits/catalogue` — consultation magasin/livraison). Aucun screenshot n'existe pour la page LIST à l'une
des 5 tailles requises (375 / 768 / 1024 / 1440 / 1920). Les deux screenshots trouvés dans
`.playwright-mcp/screenshots/20260915/` (`catalogue-sac-jute-ventes-par-canal-375/1440`) sont des captures d'un
**onglet fiche produit**, pas de la vue liste. Règle : « Si screenshots absents de la PR UI → FAIL automatique ».

**Fix** : Capturer via MCP Playwright les 5 tailles sur `/produits/catalogue` (liste active) et déposer dans
`.playwright-mcp/screenshots/20260915/` avec nommage `catalogue-liste-<size>-<HHmmss>.png`. Inclure la barre de
recherche, les filtres et le premier rang de produits visibles.

---

### CRITICAL — product-detail-header.tsx — Screenshots fiche produit incomplets (2/5 tailles)

**Problème** : `/produits/catalogue/[productId]` figure également dans les **exceptions 5 tailles** de
`responsive.md`. Les captures disponibles (`catalogue-sac-jute-ventes-par-canal-375`, `...-1440`) couvrent
seulement 2 des 5 tailles obligatoires. Manquent : 768 × 1024, 1024 × 768, 1920 × 1080. Per règles reviewer :
FAIL automatique.

**Fix** : Capturer via MCP Playwright à 768 × 1024, 1024 × 768, 1920 × 1080 sur la fiche d'un produit réel.
Vérifier que le thumbnail (16×16 → 100×100), les boutons 44 px et le titre tronqué avec `title` sont
corrects aux 3 tailles manquantes.

---

### WARNING — scripts/supabase-advisors-baseline.json:3 — Alerte Supabase `auth_leaked_password_protection` figée à 1

**Problème** : La baseline CI intègre `"auth_leaked_password_protection": 1`. Cette valeur bascule le check
CI en baseline-accepted, ce qui signifie que le problème de protection de mots de passe ne sera jamais
remonté tant que la baseline n'est pas corrigée. Selon `.claude/rules/database.md` (R-GRANT), les advisors
sécurité ne se silencent pas, ils se corrigent.

**Fix** : `mcp__supabase__get_advisors({ type: "security" })`, identifier le compte sans protection de mot de
passe fuité, appliquer le correctif (généralement activer "Leaked password protection" dans Supabase Auth
Settings), puis baisser la baseline à 0.

---

### WARNING — use-product-channel-pricing.ts:27-31 — `sales_channels` fetchée sans `.limit()`

**Problème** : La query `supabase.from('sales_channels').select('id, name, code').eq('is_active', true)` n'a
pas de `.limit()`. Per `.claude/rules/data-fetching.md` : « Ne JAMAIS fetch sans `.limit()` quand la table
peut grossir ». Le nombre de canaux actifs est actuellement faible mais cette règle s'applique à toute table
sans limite explicite.

**Fix** :

```ts
.eq('is_active', true)
.order('display_order', { ascending: true })
.limit(50); // sécurité défensive : max 50 canaux de vente
```

---

### INFO — fetch-product.ts:132 — Cast `data as Product` masque les colonnes non sélectionnées

**Note** : `return data as unknown as Product` via `return data as Product` mappe un objet partiel vers le
type `Product = ProductRow & ProductRelations` qui contient TOUTES les colonnes de la table. Si un futur
composant accède à une colonne `ProductRow` non présente dans le `select` explicite (ex : `creation_mode`,
`completion_status`), TypeScript ne produira pas d'erreur mais la valeur sera `undefined` à l'exécution.
Actuellement tous les champs accédés dans `detail/[id]/**` sont couverts par le `select` (vérification grep
effectuée) — pas de bug présent. À surveiller si des composants sont ajoutés.

---

## Résultats par bloc

| Bloc   | Sujet                             | Verdict                                                                                                                                                                                                                                                              |
| ------ | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A      | Auth wrapper                      | PASS — hooks avant early-returns ✓, `/module-inactive` ✓, `window.location.replace` ✓, `min-w-0` ✓, `p-4 md:p-6` ✓, logout SidebarFooter + AppHeader conformes ✓                                                                                                     |
| C      | Tabs navigation                   | PASS — `gap-4 overflow-x-auto md:gap-8` correct ✓, 4 usages restants non impactés ✓                                                                                                                                                                                  |
| L      | Sidebar counts RPC                | PASS — 11 requêtes → 1 RPC ✓, filtres identiques vérifiés ✓, JSON défensif ✓, `retry:1` + `retryDelay` ✓, types mis à jour (`+get_sidebar_counts`, `−get_product_margin_analysis`, `−get_product_cost_price_details`) ✓                                              |
| N      | Dead-code removal                 | PASS — tous les fichiers supprimés correctement désexportés ✓, aucune référence pendante dans apps/ ou packages/ ✓ (`QuickSourcingModal`/`SourcingQuickForm` restants sont de `@verone/products`, pas de `components/business`, correct)                             |
| P      | Catalogue single-sheet + refactor | PASS — `[id]/_components/` supprimé, rewrite `next.config.js` conservé ✓, publication checks portés avec poids/dimensions/meta requis ✓, liens stock corrigés ✓, refactors < 400 lignes ✓, colonnes explicites `fetch-product.ts` couvrent tous les accès vérifiés ✓ |
| R-resp | Mobile headers                    | FAIL — voir CRITICAL #1 et #2 (screenshots manquants)                                                                                                                                                                                                                |
| R-migr | Migrations + config               | PASS — `quality.yml` env E2E ✓, `workflow.md` ADR-040 suspendu ✓, `DECISIONS.md` ✓, migrations SQL avec ROLLBACK ✓, baseline 13/141/7/1/1 cohérente avec les révocations lot-7 ✓                                                                                     |
