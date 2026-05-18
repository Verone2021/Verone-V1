# Dev Plan — BO-CATALOG-VIEWS-001 Vues sauvegardées + bulk actions

**Date** : 2026-04-30
**Statut** : **Phase 1 livrée** (5 vues système). Phases 2-3 reportées en PRs séparées.

---

## Phase 1 — LIVRÉE dans cette PR (#852)

### 5 vues système prédéfinies

| Vue                   | Onglet     | Filtres pré-appliqués                        |
| --------------------- | ---------- | -------------------------------------------- |
| 🌐 À publier en ligne | active     | statuses=active, completionLevels=high       |
| ⚖️ Sans poids         | incomplete | missingFields=weight                         |
| 📷 Sans photo         | incomplete | missingFields=photo                          |
| 📉 Marge faible       | active     | statuses=active, completionLevels=low+medium |
| 🚨 Stock épuisé       | active     | statuses=active, stockLevels=out_of_stock    |

### Composants livrés

- `apps/back-office/src/app/(protected)/produits/catalogue/use-saved-views.ts` — hook `useSavedViews()` qui retourne la liste des vues + helper `viewToFilters(view)`.
- `apps/back-office/src/app/(protected)/produits/catalogue/CatalogueSavedViews.tsx` — bandeau de chips au-dessus du toolbar avec scroll horizontal mobile.
- `page.tsx` : intégration du composant + handler qui change l'onglet cible avant d'appliquer les filtres.

---

## Phase 2 — Reportée : Vues personnelles localStorage (~1 jour)

### Storage key

```
verone:catalogue:saved-views:{user_id}
```

### Ajout d'une vue personnelle

UI : bouton "+" en fin de ligne du bandeau qui ouvre un prompt :

- nom de la vue (input texte)
- onglet cible (select)
- emoji (optionnel — picker simple)
- filtres = filtres courants (capturés au moment de la sauvegarde)

### Helper localStorage

```typescript
const STORAGE_KEY = `verone:catalogue:saved-views:${userId}`;
function readPersonalViews(): SavedView[] { ... }
function savePersonalView(view: Omit<SavedView, 'id' | 'system'>): void { ... }
function deletePersonalView(id: string): void { ... }
```

### Modif `useSavedViews`

```typescript
export function useSavedViews(): SavedView[] {
  const personal = readPersonalViews();
  return [...SYSTEM_VIEWS, ...personal];
}
```

### Suppression / édition

Bouton "×" sur les vues personnelles (les vues système ont `system: true` qui désactive le bouton).

---

## Phase 3 — Reportée : Bulk actions (~1 jour)

Cases à cocher pour sélection multiple + barre flottante d'actions.

### UI

- Checkbox sur chaque ligne (table) / carte (mobile)
- Checkbox "tout sélectionner" dans le header tableau
- Barre flottante en bas de la viewport quand `selectedIds.size > 0` :
  ```
  [3 produits sélectionnés] [Désélectionner] | [Archiver] [Changer statut] [Exporter] [Supprimer]
  ```

### State

```typescript
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
```

À ajouter dans `useCataloguePage`. Le state se reset au changement de filtres/page.

### Actions disponibles

- **Archiver / Désarchiver** : boucle sur `archiveProduct` / `unarchiveProduct` puis `await queryClient.invalidateQueries`.
- **Changer statut** : modal avec select status (active / discontinued / preorder) + apply à tous.
- **Exporter sélection** : extrapolation de l'API `/api/exports/products` qui acceptera un param `?ids=uuid1,uuid2,...`.
- **Supprimer définitivement** : confirm modal + `deleteProduct` boucle. Visible uniquement si onglet `archived`.

### Composants à créer

- `CatalogueBulkActionsBar.tsx` — barre flottante
- `CatalogueBulkStatusModal.tsx` — modal choix status

### Tests

- Sélection : 1 checkbox → 1 ID dans Set
- Désélectionner : retire du Set
- Tout sélectionner : tous les products de la page
- Action bulk : appel N×fonction + invalidate cache
- Reset selection après bulk + après page change

---

## Hors scope définitif (pas dans ce sprint)

- Vues partagées en équipe via table DB `catalogue_saved_views` (utile à 5+ utilisateurs back-office, pas à 1-2)
- Tri custom par vue (ex: "Stock épuisé" trié par dernier vente)
- Compteur "N produits dans cette vue" calculé en temps réel
