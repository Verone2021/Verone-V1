---
globs: apps/**/*.tsx, apps/**/*.ts, packages/**/*.tsx, packages/**/*.ts
---

# Data Fetching — Économie de requêtes & robustesse

**Source de vérité unique** pour toute lecture/écriture de données côté client.
Lecture obligatoire avant : écrire un `useEffect` qui fetch, construire un
hook `use*`, faire un `select` Supabase.

> Compactée en `[INFRA-LEAN-002]` — exemples redondants retirés.

Origine : incident 2026-04-27 sur `/produits/catalogue/variantes` (244 requêtes
en 5 s par boucle infinie de `useEffect` sur l'onglet "Archivées" vide).

---

## REGLES IMPERATIVES

- Ne JAMAIS `select('*')` — lister explicitement les colonnes utiles
- Ne JAMAIS `array.length === N` dans les deps d'un `useEffect` comme condition d'amorçage (boucle infinie quand DB renvoie 0 résultats)
- Ne JAMAIS mettre une fonction non-stable dans les deps d'un `useEffect` sans `useCallback` ou `useRef`
- Ne JAMAIS fetch sans `.limit()` quand la table peut grossir (> 100 lignes attendues)
- Ne JAMAIS dupliquer un `useEffect(... fetch ...)` dans un parent et un enfant — cache partagé via TanStack Query
- TOUJOURS utiliser un flag boolean `loaded` plutôt que `length === 0` pour un effect "first-load"
- TOUJOURS `await queryClient.invalidateQueries()` dans `onSuccess` d'une mutation

---

## Les 5 leviers pour économiser les requêtes

### 1. Cache + dédup avec TanStack Query

Remplacer `useState + useEffect + setState` par `useQuery` :

```tsx
const { data = [] } = useQuery({
  queryKey: ['variant_groups', filters],
  queryFn: () => fetchVariantGroups(filters),
  staleTime: 30_000,
});
```

Gain : 60–90 % de requêtes en moins quand plusieurs composants écoutent la même donnée. Client `@tanstack/react-query` déjà installé. Ne PAS utiliser pour état UI purement local ou formulaire en cours de saisie.

### 2. `select` ciblé Supabase

```ts
// INTERDIT
.select('*')
// AUTORISÉ
.select('id, name, archived_at, total_ttc')
```

Payload réduit, bandwidth Supabase préservée (quota 5 GB/mois), rendu React plus rapide. Critique pour tables avec colonnes lourdes (`description`, `notes`, `raw_response`, JSONB volumineux).

### 3. `useEffect` — règles de stabilité strictes

#### Deps acceptables

| Type                                              | OK ?                                                                              |
| ------------------------------------------------- | --------------------------------------------------------------------------------- |
| Primitive stable (string, number, boolean)        | ✅                                                                                |
| `useState` setter                                 | ✅ (garanti stable React)                                                         |
| `useRef.current`                                  | ✅ (mais ne déclenche jamais l'effect)                                            |
| `useCallback(..., [stable_deps])`                 | ✅                                                                                |
| Fonction normale (déclarée dans le composant)     | 🔴 **INSTABLE**                                                                   |
| Fonction d'un hook tiers (ex: `useQuery.refetch`) | ⚠️ vérifier la doc                                                                |
| `array.length`                                    | ⚠️ acceptable si change vraiment, **JAMAIS** comme condition de "premier load\*\* |

#### Pattern "first-load" sécurisé

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

#### Pattern `useRef` pour fonction d'un hook externe

```tsx
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

Référence : `apps/back-office/src/app/(protected)/produits/catalogue/use-catalogue-page.ts`.

### 4. Pagination + Infinite scroll

Ne jamais charger plus de 50 lignes d'un coup :

```ts
const PAGE_SIZE = 50;
const { data } = await supabase
  .from('products')
  .select('id, name, sku, archived_at')
  .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
```

Avec TanStack Query : `useInfiniteQuery` + `getNextPageParam`. Pour onglets vides confirmés (`Variantes Archivées (0)`) : ne fetch PAS du tout, afficher "0 résultat" sans appel réseau.

### 5. Server Components Next.js 15

Pour pages purement listes (factures, devis, archives, dashboards statiques) :

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
  return <FacturesTable invoices={invoices} />;
}
```

Avantages : plus aucun `useEffect` ni boucle possible, HTML pré-rendu, auth Supabase via cookies, cache Next.js avec `revalidatePath` après mutation. Pas adapté pour pages très interactives — garder Client Components mais externaliser fetches initiaux côté serveur. Migration progressive, 1 module à la fois.

---

## Anti-patterns interdits (avec exemples réels)

1. **Boucle infinie sur onglet vide** — vu le 2026-04-27 dans `use-variantes-page.ts:152-158`. Fix : voir Levier 3.b.
2. **Fetch dupliqué parent/enfant** — 2 hooks `useUser()` dans 2 composants frères → 2 requêtes. Fix : centraliser via TanStack Query.
3. **`select('*')` sur table large** — `products` a 40+ colonnes mais l'UI en affiche 5. Payload x8.
4. **`.invalidateQueries` oublié** — UI affiche encore l'ancienne donnée jusqu'au prochain refetch auto. Fix : `await queryClient.invalidateQueries({ queryKey: ['x'] })` dans `onSuccess`.
5. **`useEffect` dépendant d'un objet inline** — `useEffect(..., [{ search }])` recrée l'objet à chaque render. Fix : deps primitives uniquement.

---

## Checklist reviewer (avant merge)

- [ ] Aucun `select('*')` ajouté
- [ ] `useEffect` deps : primitives stables, refs, ou fonctions wrappées en `useCallback`
- [ ] Aucun `array.length === N` comme condition de premier load
- [ ] Si fetch sur table > 100 lignes : `range` ou `limit` présent
- [ ] Si donnée déjà chargée ailleurs : TanStack Query avec même `queryKey`
- [ ] `await invalidateQueries` dans tous les `onSuccess` de mutation
- [ ] Test runtime Playwright : ≤ 5 requêtes/5s sur la page idle

---

## Mesure d'une boucle (procédure standard)

```js
// Console DevTools (ou Playwright browser_evaluate)
const fetches = [];
const orig = window.fetch;
window.fetch = async function (...args) {
  fetches.push({ t: Date.now(), url: args[0] });
  return orig.apply(this, args);
};
// ...interagir avec la page...
// Au bout de 5s :
console.log('count:', fetches.length, 'rate:', fetches.length / 5, 'req/s');
```

**Seuil d'alerte** : > 5 requêtes/5s sur page idle = boucle suspectée.

---

## Historique

- 2026-04-16 : `useEffect` deps non-stables `resetNewCustomerForm` → boucle infinie de resets, page LinkMe cassée 48 h.
- 2026-04-27 : `useEffect` `length === 0` sur onglet Archives variantes → 48 req/s en boucle silencieuse.
