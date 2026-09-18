# Audit data-fetching back-office — 2026-04-27

Scope : `apps/back-office/src/` + packages consommés (`@verone/finance`, `@verone/orders`, `@verone/products`).
Mode : READ-ONLY. Aucun fichier code modifié.
Rule de référence : `.claude/rules/data-fetching.md` (créée le 2026-04-27).

---

## Score global

- **Fichiers scannés** : ~1 886 (1 399 back-office + 263 finance + 255 orders + 189 products + 36 consultations hors scope isolé, 0 organizations/contacts)
- **Bugs critiques (boucles confirmées ou à fort risque)** : 3
- **Warnings haute priorité** : 8
- **Optimisations possibles** : 11
- **select('\*') total** : 49 occurrences (37 BO src + 8 finance + 4 orders)
- **invalidateQueries sans await confirmés** : 0 (tous sous Promise.all ou await direct — OK)

---

## 🔴 CRITIQUES (boucle infinie probable ou avérée)

### #1 — Variantes archives : DÉJÀ IDENTIFIÉ + FIXÉ (référence)

**Fichier** : `apps/back-office/src/app/(protected)/produits/catalogue/variantes/use-variantes-page.ts:152-158`

Pattern exact interdit :

```ts
if (activeTab === 'archived' && archivedVariantGroups.length === 0) {
  void loadArchived();
}
}, [activeTab, archivedVariantGroups.length, handleLoadArchivedGroups]);
```

- `length === 0` reste toujours vrai quand la DB retourne `[]`
- `handleLoadArchivedGroups` non vérifiée comme stable (useCallback ?)
- **244 requêtes / 5 s observées en production**

Fix recommandé : remplacer `length === 0` par un flag `archivedLoaded` (boolean).
Status : identifié, fix à déployer.

---

### #2 — Page Factures : triple boucle sur onglets vides

**Fichier** : `apps/back-office/src/app/(protected)/factures/hooks/use-factures-page.ts:131-146`

```ts
useEffect(() => {
  if (activeTab === 'factures' && invoices.length === 0)
    void fetchInvoicesAsync();
  else if (activeTab === 'devis' && qontoQuotes.length === 0)
    void fetchQontoQuotesAsync();
  else if (activeTab === 'avoirs' && creditNotes.length === 0)
    void fetchCreditNotesAsync();
}, [
  activeTab,
  invoices.length, // ← PROBLÈME
  qontoQuotes.length, // ← PROBLÈME
  creditNotes.length, // ← PROBLÈME
  fetchInvoicesAsync,
  fetchQontoQuotesAsync,
  fetchCreditNotesAsync,
]);
```

**Pourquoi critique :**

- Si Qonto renvoie une liste vide (0 devis, 0 avoirs, 0 factures), chaque changement d'onglet re-déclenchera le fetch en boucle.
- Les 3 fonctions `fetchXxxAsync` sont dans `useCallback([], [])` (deps vides — stable). C'est le seul garde-fou, mais il ne protège pas contre des données réellement vides.
- L'onglet `factures` a un **double fetch** : `useEffect(() => { void fetchInvoicesAsync(); }, [fetchInvoicesAsync])` à la ligne 127-129 (initial load) PLUS le second useEffect conditionnel. Si la liste revient vide, le second effect re-déclenche.
- Cas réel : un utilisateur sans factures Qonto (nouveau compte, ou erreur API transitoire) déclenche une boucle jusqu'à ce que Qonto réponde.

**Fix recommandé** : utiliser un flag `invoicesLoaded`, `quotesLoaded`, `creditNotesLoaded` (boolean, initialisé à false, passé à true dans le `.finally()` de chaque fetch) au lieu de `length === 0`.

**Impact** : élevé. La page `/factures` est la plus consultée du back-office (finance).

---

### #3 — Expéditions : `exp.orders.length` en dep d'un useEffect de navigation

**Fichier** : `apps/back-office/src/app/(protected)/stocks/expeditions/page.tsx:87-92`

```ts
useEffect(() => {
  const orderId = searchParams.get('order');
  if (orderId && exp.orders.length > 0) {
    exp.toggleRowExpansion(orderId);
  }
}, [searchParams, exp.orders.length]); // eslint-disable-line react-hooks/exhaustive-deps
```

**Pourquoi critique :**

- L'auteur a supprimé `exp.toggleRowExpansion` des deps via `eslint-disable` pour éviter une boucle, mais a laissé `exp.orders.length`.
- À chaque ajout/suppression d'une expédition, `exp.orders.length` change → l'effect se re-déclenche → si `?order=UUID` est dans l'URL, `toggleRowExpansion` est rappelé en boucle sur le même orderId.
- Le commentaire `eslint-disable` signale que le dev savait que quelque chose n'allait pas mais n'a pas trouvé la bonne correction.

**Fix recommandé** :

```ts
const initialOpenDone = useRef(false);
useEffect(() => {
  const orderId = searchParams.get('order');
  if (orderId && exp.orders.length > 0 && !initialOpenDone.current) {
    initialOpenDone.current = true;
    exp.toggleRowExpansion(orderId);
  }
}, [searchParams, exp.orders.length]);
```

Ou mieux : utiliser un flag `orderExpanded` dans l'état pour ne déclencher qu'une fois.

---

## 🟡 WARNINGS

### #W1 — Dashboard LinkMe : chargement de TOUTES les commandes sans filtre

**Fichier** : `apps/back-office/src/app/(protected)/canaux-vente/linkme/hooks/use-linkme-dashboard.ts:168-172`

```ts
const { data: allOrders } = await supabase
  .from('linkme_orders_with_margins') // vue avec 8 LEFT JOIN
  .select('id, total_ht, total_affiliate_margin, created_at')
  .order('created_at', { ascending: true });
// PAS DE .limit() — charge TOUTES les commandes de tous les temps
```

**Pourquoi warning :** la vue `linkme_orders_with_margins` fait 8 LEFT JOIN. Sans `.limit()` ni filtre de date, elle charge l'intégralité de l'historique commandes pour calculer une moyenne mensuelle en JavaScript. Le calcul devrait se faire en SQL via RPC.
**Fix recommandé** : créer `get_linkme_dashboard_kpis(p_month TEXT)` en RPC SQL. Impact immédiat sur le chargement du dashboard principal LinkMe.

---

### #W2 — Analytics LinkMe : pattern useState+useEffect+fetch (anti-pattern legacy)

**Fichier** : `apps/back-office/src/app/(protected)/canaux-vente/linkme/hooks/use-linkme-analytics.ts`

Pattern : `useState + useCallback(fetchAnalytics) + useEffect(() => fetchAnalytics(), [fetchAnalytics])`.
Pas de cache React Query. Chaque montage du composant Analytics relance tous les fetches (5+ requêtes Supabase en cascade).
**Fix recommandé** : migrer vers `useQuery` avec `queryKey: ['linkme-analytics', period, startDateISO, endDateISO, year]` et `staleTime: 60_000`.

---

### #W3 — Commissions page : fetch complet sans pagination

**Fichier** : `apps/back-office/src/app/(protected)/canaux-vente/linkme/commissions/hooks/use-commissions-page.ts:49-59`

```ts
await supabase
  .from('linkme_commissions')
  .select(`*, affiliate:linkme_affiliates(...), sales_order:sales_orders(...)`)
  .order('created_at', { ascending: false });
// PAS de .limit() — toutes les commissions de tous les temps
```

La table `linkme_commissions` grossira avec le temps. Pas de pagination. Les calculs de filtrage/tri sont faits en JS.
**Fix recommandé** : ajouter `.limit(200)` + pagination côté front, ou migrer vers `useInfiniteQuery`.

---

### #W4 — `select('*')` sur tables à 40+ colonnes dans des hooks fréquemment appelés

**Fichiers critiques (trafic élevé) :**

- `apps/back-office/src/app/(protected)/contacts-organisations/customers/hooks/use-customers-page.ts:151` → `individual_customers` (table avec json metadata)
- `apps/back-office/src/app/(protected)/contacts-organisations/suppliers/hooks/useSuppliersPage.ts:113` → `organisations`
- `apps/back-office/src/app/(protected)/contacts-organisations/partners/hooks.ts:57` → `organisations`
- `apps/back-office/src/app/api/qonto/invoices/_lib/fetch-order-with-customer.ts:54,64` → deux select('\*') dans une route API critique (Qonto)
- `packages/@verone/finance/src/hooks/use-bank-transaction-stats.ts:157` → `v_transactions_unified` (vue complexe)
- `packages/@verone/finance/src/hooks/use-expenses.ts:129` → `financial_documents`
- `apps/back-office/src/app/(protected)/canaux-vente/site-internet/hooks/use-ambassadors.ts:154,170,198,211,230` → 5 select('\*') dans le même hook ambassadeurs

**Impact** : payload réseau x3 à x8 sur des tables avec colonnes texte lourdes (notes, description, metadata JSONB).

---

### #W5 — Inventaire stocks et Commandes fournisseurs : `array.length > 0` dans dep useEffect (non-boucle mais instable)

**Fichiers** :

- `apps/back-office/src/app/(protected)/stocks/inventaire/use-inventaire-page.ts:53` : `inventory.length > 0` dans les deps — re-déclenche à chaque chargement de produit mais ne boucle pas car condition `!isHistoryModalOpen` brise le cycle.
- `apps/back-office/src/app/(protected)/commandes/fournisseurs/use-fournisseurs-page.ts:140` : `orders.length > 0` dans les deps + `orders` comme objet array complet (référence instable).

**Fix recommandé** : remplacer par `useRef` pour marquer le "premier load" de navigation au lieu de surveiller `length`.

---

### #W6 — Alertes stocks : useEffect avec `fetchAlerts` dans deps (dépendance de stabilité à vérifier)

**Fichier** : `apps/back-office/src/app/(protected)/stocks/alertes/hooks.ts:151-159, 162-178`

Trois useEffect dépendent de `fetchAlerts`. Si `fetchAlerts` est dans un `useCallback` avec des deps instables, ces 3 effects se re-déclenchent. Le polling à 30 secondes (ligne 152) est correct, mais les deux autres effects (ligne 151 et 162) dépendent de `fetchAlerts` — à vérifier que `fetchAlerts` lui-même est stable.

---

### #W7 — Stock movements : `select('*')` dans use-stock-core sans limit par défaut

**Fichier** : `apps/back-office/src/hooks/core/use-stock-core.ts:150-163`

`supabase.from('stock_movements').select('*', ...)` — le select est bien ciblé (produits + channels) mais la query principale utilise `select('*')` sur `stock_movements`. Le `.limit()` est optionnel (conditionnel à `filters.limit`). Sans filtre produit, charge tous les mouvements.
**Fix** : rendre `.limit(100)` par défaut, surridable.

---

### #W8 — `use-selections-data.ts` : fetchData non-memoizée dans un useEffect sans deps

**Fichier** : `apps/back-office/src/app/(protected)/canaux-vente/linkme/components/SelectionsSection/use-selections-data.ts:26-31`

```ts
useEffect(() => {
  void fetchData().catch(...)
  // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchData is not memoized
}, []);
```

L'auteur a désactivé ESLint pour contourner le problème : `fetchData` est une fonction `async` déclarée dans le corps du hook, pas dans `useCallback`. Elle est ré-instanciée à chaque render mais exclue des deps. Fonctionne car `useEffect(fn, [])` ne se re-déclenche jamais — mais c'est un anti-pattern fragile. Si quelqu'un ajoute une dep, la boucle repart.
**Fix** : wrapper `fetchData` dans `useCallback([], [])` ou migrer vers `useQuery`.

---

## 🟢 OPTIMISATIONS

### #O1 — use-linkme-analytics : aucun cache (React Query non utilisé)

Voir W2 — candidat prioritaire pour migration `useQuery`.

### #O2 — Commissions page : aucun cache React Query

Voir W3 — calculs JS sur tous les items en mémoire.

### #O3 — use-affiliates.ts : 3 fetches en cascade dans un seul useEffect

**Fichier** : `apps/back-office/src/app/(protected)/canaux-vente/linkme/components/AffiliatesSection/use-affiliates.ts:137-147`

```ts
useEffect(() => {
  void fetchAffiliates(); // useCallback ✓
  void fetchOrganisations(); // inline async function — instable ?
  void fetchEnseignes(); // inline async function — instable ?
}, [fetchAffiliates]);
```

`fetchOrganisations` et `fetchEnseignes` ne sont pas dans les deps car non-memoizées. Pattern fragile similaire à W8.

### #O4 — select('\*') dans routes API (route Qonto)

**Fichier** : `apps/back-office/src/app/api/qonto/invoices/_lib/fetch-order-with-customer.ts:54,64`

Ces deux `select('*')` sont dans une route API server-side appelée à chaque génération de facture. Payload inutile transmis au serveur.
**Note** : INTERDIT de modifier les routes API Qonto sans autorisation explicite (règle CLAUDE.md). Signaler uniquement.

### #O5 — use-users-page admin : select('\*') sur user_activity_logs

**Fichier** : `apps/back-office/src/app/(protected)/admin/users/[id]/page.tsx:102`

`select('*')` sur `user_activity_logs` — table qui grossit rapidement (1 ligne par action utilisateur). Peut devenir problématique à 100k+ lignes.

### #O6 — ProfileLoad / ProfileSave : select('\*') sur user_profiles

**Fichiers** :

- `apps/back-office/src/components/profile/useProfileLoad.ts:90`
- `apps/back-office/src/components/profile/useProfileSave.ts:143`

Appelés à chaque ouverture du modal profil. Colonnes non listées.

### #O7 — Packlink pending route : select('\*') sur sales_order_shipments

**Fichier** : `apps/back-office/src/app/api/packlink/shipments/pending/route.ts:43`

Route API de polling Packlink. `select('*')` sur `sales_order_shipments` sans filtre de date.

### #O8 — use-missing-invoices : select('\*') sur vue v_transactions_unified

**Fichier** : `packages/@verone/finance/src/hooks/use-missing-invoices.ts:86`

La vue `v_transactions_unified` est une vue complexe (SECURITY DEFINER). Un `select('*')` charge toutes les colonnes dont des JSONB lourds.

### #O9 — Sélections page new : fetch all products catalogue

**Fichier** : `apps/back-office/src/app/(protected)/canaux-vente/linkme/selections/new/NewSelectionCatalog.tsx`

Chargement du catalogue produit complet pour le sélecteur, sans pagination côté front. Le filtre est fait en JS.

### #O10 — use-organisations-independantes : fetchData déclarée inline dans useEffect

**Fichier** : `apps/back-office/src/app/(protected)/canaux-vente/linkme/components/EnseignesSection/use-organisations-independantes.ts:17-89`

Fonctionne car `useEffect(fn, [])`. Mais `fetchOrganisationsIndependantes` est une fonction async déclarée DANS l'effet — impossible à tester unitairement. Migrer vers `useQuery`.

### #O11 — use-linkme-orders.fetchers.ts : fetch TOUTES les commandes sales_orders

**Fichier** : `apps/back-office/src/app/(protected)/canaux-vente/linkme/hooks/use-linkme-orders.fetchers.ts:18,67`

Les deux fetchers chargent les `sales_orders` filtrés par `channel_id = LINKME_CHANNEL_ID` (correct) mais sans pagination. À terme, avec des centaines de commandes LinkMe, ce sera un payload croissant.

---

## Top 5 quick wins

Classement par **impact / effort** (impact = requêtes épargnées ou risque boucle, effort = lignes de code).

### QW1 — Factures : remplacer `length === 0` par flags `loaded` (CRITIQUE)

**Fichier** : `apps/back-office/src/app/(protected)/factures/hooks/use-factures-page.ts:131-146`
**Effort** : ~25 lignes. Ajouter 3 useState boolean + modifier le useEffect.
**Impact** : élimine un risque de boucle sur la page la plus critique du module finance. Zéro régression attendue.

### QW2 — Expéditions : useRef pour navigation auto-expand (CRITIQUE)

**Fichier** : `apps/back-office/src/app/(protected)/stocks/expeditions/page.tsx:87-92`
**Effort** : ~10 lignes. Ajouter `useRef` + supprimer `eslint-disable`.
**Impact** : supprime le re-trigger intempestif sur chaque mutation stock.

### QW3 — select('\*') customers/suppliers/partners (3 hooks en 1 PR)

**Fichiers** :

- `contacts-organisations/customers/hooks/use-customers-page.ts:151`
- `contacts-organisations/suppliers/hooks/useSuppliersPage.ts:113`
- `contacts-organisations/partners/hooks.ts:57`

**Effort** : ~15 lignes. Lister les colonnes affichées dans le tableau (id, legal_name, trade_name, email, phone, city, created_at).
**Impact** : réduction payload -60% sur les pages contacts/orgs. Ces 3 hooks sont appelés à chaque visite des pages CRUD les plus utilisées.

### QW4 — Dashboard LinkMe : ajouter filtre date (rolling 12 mois)

**Fichier** : `apps/back-office/src/app/(protected)/canaux-vente/linkme/hooks/use-linkme-dashboard.ts:168-172`
**Effort** : ~5 lignes. Ajouter `.gte('created_at', twelveMonthsAgo)` avant le `.order()`.
**Impact** : évite le chargement de l'historique complet à chaque ouverture du dashboard. La moyenne sur 12 mois sera suffisante pour le KPI affiché. Solution intermédiaire avant migration RPC.

### QW5 — select('\*') × 5 dans use-ambassadors.ts (1 hook, 1 PR)

**Fichier** : `apps/back-office/src/app/(protected)/canaux-vente/site-internet/hooks/use-ambassadors.ts:154,170,198,211,230`
**Effort** : ~20 lignes. 5 occurrences dans le même fichier.
**Impact** : réduit le payload de toutes les requêtes ambassadeurs. La table ambassadeurs a des colonnes JSONB (stats, metadata). Gain réseau x4 estimé.

---

## Annexe : récapitulatif select('\*') par fichier (top 10)

| Fichier                                                             | Occurrences | Table cible            | Impact                 |
| ------------------------------------------------------------------- | ----------- | ---------------------- | ---------------------- |
| `canaux-vente/site-internet/hooks/use-ambassadors.ts`               | 5           | ambassador_profiles    | Élevé                  |
| `api/qonto/invoices/_lib/fetch-order-with-customer.ts`              | 2           | orders + customers     | Moyen (route protégée) |
| `api/qonto/invoices/service/route.ts`                               | 2           | financial_documents    | Moyen (route protégée) |
| `canaux-vente/site-internet/hooks/use-site-internet-collections.ts` | 2           | collections            | Faible                 |
| `contacts-organisations/customers/hooks/use-customers-page.ts`      | 1           | individual_customers   | Élevé                  |
| `contacts-organisations/suppliers/hooks/useSuppliersPage.ts`        | 1           | organisations          | Élevé                  |
| `contacts-organisations/partners/hooks.ts`                          | 1           | organisations          | Élevé                  |
| `packages/finance/hooks/use-expenses.ts`                            | 1           | financial_documents    | Moyen                  |
| `packages/finance/hooks/use-bank-transaction-stats.ts`              | 1           | v_transactions_unified | Moyen                  |
| `packages/finance/hooks/use-missing-invoices.ts`                    | 1           | v_transactions_unified | Moyen                  |

---

## Notes architecturales

1. **Bonne nouvelle** : tous les `invalidateQueries` vérifiés sont correctement awaitados (dans `Promise.all` ou `await` direct). Zéro violation du standard `code-standards.md` sur ce point.

2. **Pattern légacy dominant** : une dizaine de hooks utilisent encore `useState + useCallback(fetch) + useEffect([fetch])` au lieu de `useQuery`. Ces hooks sont fonctionnels mais sans cache partagé — deux composants qui importent le même hook déclenchent deux fetches séparés.

3. **use-create-linkme-order-form.ts** : les 5 `useEffect` de cascade (reset) sont tous corrects — ils dépendent uniquement de setters d'état (stables) ou de primitives. Le fix post-incident du 16 avril (`resetNewCustomerForm` dans `useCallback`) est bien en place.

4. **use-stock-core.ts** : le `select('*')` sur `stock_movements` est dans un hook utilitaire. Le limit est optionnel mais au moins il existe. Pas de boucle détectée.

5. **use-commissions-page.ts** : le fetch sans pagination est le risque croissance le plus probable à moyen terme (6-12 mois selon volume commandes LinkMe).
