---
globs: apps/**/*.tsx, apps/**/*.ts, packages/**/*.tsx, packages/**/*.ts
---

# Data Fetching — Économie de requêtes & robustesse

**Source de vérité** pour toute lecture/écriture de données côté client (React,
Next.js 15). Né de l'incident 2026-04-27 sur `/produits/catalogue/variantes`
(244 requêtes Supabase en 5 secondes par boucle infinie de `useEffect` sur
l'onglet "Archivées" vide).

Lecture obligatoire avant de :

- Écrire un `useEffect` qui fetch
- Construire un hook `use*` qui retourne des données
- Faire un `select` sur Supabase

---

## REGLES IMPERATIVES

- Ne JAMAIS utiliser `select('*')` — lister explicitement les colonnes utiles
- Ne JAMAIS mettre `array.length === N` dans les deps d'un `useEffect` comme
  condition d'amorçage (boucle infinie quand DB renvoie 0 résultats)
- Ne JAMAIS mettre une fonction non-stable (qui change à chaque render) dans
  les deps d'un `useEffect` sans la wrapper avec `useCallback` ou `useRef`
- Ne JAMAIS fetch sans `.limit()` quand la table peut grossir (> 100 lignes
  attendues)
- Ne JAMAIS dupliquer un `useEffect(... fetch ...)` dans un parent et un enfant
  pour la même donnée — cache shared via React Query / Zustand / contexte
- TOUJOURS utiliser un flag boolean `loaded` plutôt que `length === 0` pour
  conditionner un effect "first-load"
- TOUJOURS `await queryClient.invalidateQueries()` dans `onSuccess` d'une
  mutation (déjà dans `code-standards.md`, rappel ici car lié)

---

## LES 5 LEVIERS POUR ÉCONOMISER LES REQUÊTES

### 1. Cache + dédup avec TanStack Query (anciennement React Query)

**Quoi** : remplacer `useState + useEffect + setState` par `useQuery`.

```tsx
// AVANT — 1 fetch par render parent + risque de boucle
const [data, setData] = useState([]);
useEffect(() => {
  void fetchData().then(setData);
}, [filters]);

// APRÈS — 1 fetch unique partagé entre tous les consumers
const { data = [] } = useQuery({
  queryKey: ['variant_groups', filters],
  queryFn: () => fetchVariantGroups(filters),
  staleTime: 30_000, // pas de refetch si la donnée a < 30s
});
```

**Économie typique** : 60–90 % des requêtes en moins quand plusieurs composants
écoutent la même donnée.

**Quand l'utiliser** : par défaut pour toute lecture de liste/détail. Le client
est déjà installé (`@tanstack/react-query` dans `package.json` racine).

**Quand ne PAS l'utiliser** : pour des données purement locales (état UI,
formulaire en cours de saisie).

### 2. `select` ciblé sur Supabase

**Quoi** : ne demander que les colonnes nécessaires à l'écran courant.

```ts
// INTERDIT
.select('*')

// AUTORISÉ — colonnes nécessaires uniquement
.select('id, name, archived_at, total_ttc')
```

**Pourquoi** :

- Payload réseau réduit (moins de bytes transférés)
- Moins de bandwidth Supabase consommée (quota Hobby = 5 GB/mois)
- Rendu React plus rapide (moins de props à propager)

**Cas critique** : les tables avec colonnes lourdes (`description`, `notes`,
`raw_response`, `metadata`, JSONB volumineux) — les exclure si non affichés.

### 3. `useEffect` — règles de stabilité strictes

#### a) Deps acceptables

| Type                                                    | OK ?                                                                                     |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Primitive stable (string, number, boolean)              | ✅                                                                                       |
| `useState` setter                                       | ✅ (garanti stable par React)                                                            |
| `useRef.current`                                        | ✅ (mais ne déclenche jamais le effect)                                                  |
| `useCallback(..., [stable_deps])`                       | ✅                                                                                       |
| Fonction normale (déclarée dans le composant)           | 🔴 **INSTABLE**                                                                          |
| Fonction issue d'un hook tiers (ex: `useQuery.refetch`) | ⚠️ vérifier la doc                                                                       |
| `array.length`                                          | ⚠️ acceptable si la valeur change vraiment, **JAMAIS** comme condition de "premier load" |

#### b) Pattern "first-load" sécurisé

```tsx
// INTERDIT — boucle si fetch retourne []
useEffect(() => {
  if (activeTab === 'archived' && archived.length === 0) {
    void loadArchived();
  }
}, [activeTab, archived.length, loadArchived]);

// AUTORISÉ — flag boolean explicite
const [archivedLoaded, setArchivedLoaded] = useState(false);
useEffect(() => {
  if (activeTab === 'archived' && !archivedLoaded) {
    void loadArchived().finally(() => setArchivedLoaded(true));
  }
}, [activeTab, archivedLoaded, loadArchived]);
```

#### c) Pattern `useRef` quand la fonction vient d'un hook externe

```tsx
// Quand on ne peut pas garantir la stabilité de loadX
const loadXRef = useRef(loadX);
useEffect(() => {
  loadXRef.current = loadX;
});

useEffect(() => {
  if (activeTab === 'archived') {
    void loadXRef.current();
  }
}, [activeTab]); // SEULEMENT activeTab dans les deps
```

C'est le pattern utilisé dans `apps/back-office/src/app/(protected)/produits/catalogue/use-catalogue-page.ts` — référence à imiter.

### 4. Pagination + Infinite scroll

**Quoi** : ne jamais charger plus de 50 lignes d'un coup.

```ts
const PAGE_SIZE = 50;
const { data } = await supabase
  .from('products')
  .select('id, name, sku, archived_at')
  .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
```

**Avec TanStack Query** : utiliser `useInfiniteQuery` qui gère le `getNextPageParam` natif.

**Astuces UX** :

- "Charger plus" explicite (bouton) pour les tableaux back-office
- `IntersectionObserver` pour les listes type carte (catalogue produit, factures)
- Pour les onglets vides confirmés (`Variantes Archivées (0)`), **ne fetch pas
  du tout** : afficher juste "0 résultat" sans appel réseau

### 5. Server Components Next.js 15

**Quoi** : déplacer le fetch côté serveur pour les pages purement listes
(factures, devis, archives, dashboards statiques).

```tsx
// app/(protected)/factures/page.tsx
export default async function FacturesPage() {
  const supabase = createServerClient(...);
  const { data: invoices } = await supabase
    .from('financial_documents')
    .select('id, document_number, total_ttc, status')
    .eq('document_type', 'customer_invoice')
    .order('created_at', { ascending: false })
    .limit(50);

  return <FacturesTable invoices={invoices} />; // ← Client Component
}
```

**Avantages** :

- Plus aucun `useEffect` ni boucle possible
- HTML pré-rendu (SEO, perf, perçue)
- Auth Supabase via cookies (plus sécurisé que client)
- Cache Next.js automatique avec `revalidatePath` après mutation

**Quand pas adapté** : pages très interactives (filtrage live, drag&drop,
édition en place). Garder ces zones en Client Components, mais externaliser
les fetches initiaux côté serveur.

**Migration progressive** : on cible 1 module à la fois (factures, devis,
commandes…). Pas de big bang.

---

## Anti-patterns interdits (avec exemples réels)

### Anti-pattern 1 — Boucle infinie sur onglet vide

**Vu en prod le 2026-04-27** : `apps/back-office/src/app/(protected)/produits/catalogue/variantes/use-variantes-page.ts:152-158`. La condition `archivedVariantGroups.length === 0` reste toujours vraie après un fetch retournant `[]`, donc l'effect re-déclenche en boucle. 244 requêtes / 5 s observées.

**Fix** : voir Levier 3.b ci-dessus.

### Anti-pattern 2 — Fetch dupliqué parent/enfant

**Symptôme** : 2 hooks `useUser()` dans deux composants frères → 2 requêtes au lieu d'1.
**Fix** : centraliser via TanStack Query (Levier 1) ou contexte React.

### Anti-pattern 3 — `select('*')` sur table large

**Symptôme** : `products` a 40+ colonnes mais l'UI n'en affiche que 5. Payload x8.
**Fix** : `select('id, name, sku, cost_price, stock_real')`.

### Anti-pattern 4 — `.invalidateQueries` oublié

**Symptôme** : après une mutation, l'UI affiche encore l'ancienne donnée jusqu'au prochain refetch automatique.
**Fix** : `await queryClient.invalidateQueries({ queryKey: ['x'] })` dans `onSuccess`.

### Anti-pattern 5 — `useEffect` dépendant d'un objet inline

```tsx
// INTERDIT — { search } est un nouvel objet à chaque render
useEffect(() => {
  void fetchData({ search });
}, [{ search }]); // ← deps array contient un objet recréé

// AUTORISÉ — deps primitive uniquement
useEffect(() => {
  void fetchData({ search });
}, [search]);
```

---

## Checklist reviewer-agent (avant tout merge)

À cocher pour chaque PR qui touche à un hook `use*`, un `useEffect`, ou une
query Supabase :

- [ ] Aucun `select('*')` ajouté
- [ ] `useEffect` deps : que des primitives stables, des refs, ou des
      fonctions wrappées en `useCallback` avec deps stables
- [ ] Aucun `array.length === N` comme condition de premier load
- [ ] Si fetch sur table > 100 lignes attendues : `range` ou `limit` présent
- [ ] Si écran consomme une donnée déjà chargée ailleurs : utilisation de
      TanStack Query avec même `queryKey` plutôt que nouveau fetch
- [ ] `invalidateQueries` (avec `await`) dans tous les `onSuccess` de mutation
- [ ] Test runtime avec MCP Playwright + intercepteur fetch sur 5 s pour
      vérifier l'absence de boucle (≤ 5 requêtes/5s sur la page)

---

## Mesure d'une boucle (procédure standard)

Pour vérifier qu'une page n'a pas de boucle de requêtes, après navigation :

```js
// Dans la console DevTools (ou Playwright browser_evaluate)
const fetches = [];
const orig = window.fetch;
window.fetch = async function (...args) {
  fetches.push({ t: Date.now(), url: args[0] });
  return orig.apply(this, args);
};
// ...interagir avec la page (cliquer onglet, etc.)...
// Au bout de 5s :
console.table(fetches);
console.log('count:', fetches.length, 'rate:', fetches.length / 5, 'req/s');
```

**Seuil d'alerte** : > 5 requêtes / 5 secondes sur une page idle (sans
interaction utilisateur) = boucle suspectée.

---

## Référence

Référencé par :

- `CLAUDE.md` racine (section CODE STANDARDS — pointeur)
- `.claude/rules/code-standards.md` (complémentaire sur le `useEffect` deps stability)
- `.claude/rules/database.md` (complémentaire sur les standards Supabase)
- `.claude/DECISIONS.md` (à venir : ADR sur la migration TanStack Query)

Histoire des incidents :

- **2026-04-16** : `useEffect` deps de `resetNewCustomerForm` non-stables → boucle infinie de resets, page LinkMe cassée 48 h
- **2026-04-27** : `useEffect` `length === 0` sur onglet Archives variantes → 48 req/s en boucle silencieuse
