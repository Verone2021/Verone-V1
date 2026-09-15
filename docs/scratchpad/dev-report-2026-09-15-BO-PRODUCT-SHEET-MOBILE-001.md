# Dev Report — BO-PRODUCT-SHEET-MOBILE-001 — 2026-09-15

## Objectif

Corriger 3 défauts de mise en page sur la fiche produit (`/produits/catalogue/<uuid>`) à 375 px de large :

1. La rangée d'actions du header débordait à x=461.
2. Le tableau "Prix par canal — détail" était un `<table>` nu sous md.
3. Le tableau "Tous les achats fournisseurs" était un `<table>` nu sous md.

---

## Fichiers touchés

| Fichier                                                                                                                      | Action   |
| ---------------------------------------------------------------------------------------------------------------------------- | -------- |
| `apps/back-office/src/app/(protected)/produits/catalogue/detail/[id]/_components/product-detail-header.tsx`                  | Modifié  |
| `apps/back-office/src/app/(protected)/produits/catalogue/detail/[id]/_components/_pricing-blocks/ChannelPricingDetailed.tsx` | Modifié  |
| `apps/back-office/src/app/(protected)/produits/catalogue/detail/[id]/_components/_pricing-blocks/ChannelPricingCard.tsx`     | **Créé** |
| `apps/back-office/src/app/(protected)/produits/catalogue/detail/[id]/_components/_pricing-blocks/PurchaseOrdersTable.tsx`    | Modifié  |

---

## Fix 1 — Header action row overflow (`product-detail-header.tsx`)

### Avant

```
div.flex.items-center.gap-4                       ← parent row, no wrap
  button (thumbnail, flex-shrink-0, 64px)
  div.flex-1.min-w-0 (info section)
  div.flex.items-center.gap-2.flex-wrap.flex-shrink-0  ← actions, no-shrink → overflow
```

Le `flex-shrink-0` empêchait les boutons de réduire, causant un `scrollWidth` de 461 px sur un viewport de 375 px.

### Après

```
div.flex.flex-col.gap-3.md:flex-row.md:items-center.md:gap-4
  div.flex.items-center.gap-3.md:contents       ← thumbnail + info, toujours côte à côte
    button (thumbnail, flex-shrink-0)
    div.flex-1.min-w-0 (info section)
  div.flex.items-center.gap-2.flex-wrap.md:flex-shrink-0  ← actions, 2e ligne sur mobile
```

- Mobile : thumbnail+info sur la ligne 1, boutons sur la ligne 2.
- Desktop (md+) : les 3 éléments en ligne horizontale comme avant (`md:contents` "aplatit" le wrapper thumbnail+info dans le flux flex parent).
- `flex-shrink-0` limité à `md:flex-shrink-0` sur la div actions.
- Touch targets confirmés : `h-11 md:h-9` inchangés sur Dupliquer et Partager.
- Markup desktop **strictement identique visuellement** : même 3-colonnes, même espacements.

---

## Fix 2 — "Prix par canal — détail" (`ChannelPricingDetailed.tsx` + `ChannelPricingCard.tsx`)

### Avant

```tsx
<div className="overflow-x-auto">
  <table className="w-full text-sm">
    ... // visible sur tous les breakpoints
  </table>
</div>
```

### Après

```tsx
<ResponsiveDataView
  data={rows}
  breakpoint="md"
  renderTable={(tableRows) => (
    <div className="overflow-x-auto">
      <table ...>  {/* ← identique à avant, affiché uniquement md+ */}
    </div>
  )}
  renderCard={(row) => (
    <ChannelPricingCard .../>  {/* ← nouveau composant, affiché uniquement <md */}
  )}
/>
```

**`ChannelPricingCard.tsx` (170 lignes)** : reprend les mêmes props que `ChannelPricingTableRow` (sauf `isExpanded`/`canExpand`/`onToggleExpand` non pertinents en card), même handlers, même `useChannelPricingEditor` states passés depuis `ChannelPricingDetailed`. Affiche : nom canal + icône, statut badge, prix HT (avec input edit + bouton min), marges, boutons save/cancel/edit avec touch targets 44px sur mobile.

Logique d'édition, validation et save **inchangée** : les mêmes `startEdit`, `setDraftPrice`, `save`, `fillWithMinimum`, `setEditingId` du hook sont passés directement.

---

## Fix 3 — "Tous les achats fournisseurs" (`PurchaseOrdersTable.tsx`)

### Avant

```tsx
<div className="overflow-x-auto">
  <table className="w-full text-sm">
    ... // visible sur tous les breakpoints
  </table>
</div>
```

### Après

```tsx
<ResponsiveDataView
  data={displayed}
  breakpoint="md"
  renderTable={(rows) => (
    <div className="overflow-x-auto">
      <table ...>  {/* ← identique, affiché uniquement md+ */}
    </div>
  )}
  renderCard={(row) => (
    <div ...>
      {/* Réf PO + date / fournisseur / prix achat + revient + qté */}
    </div>
  )}
/>
```

`displayed` (slice paginé de `purchases`) est passé à `ResponsiveDataView` — la pagination "Voir +N" reste en dehors du composant, comportement inchangé. Export CSV inchangé.

---

## Vérifications

| Check                                          | Résultat                                      |
| ---------------------------------------------- | --------------------------------------------- |
| `pnpm --filter @verone/back-office type-check` | 0 erreurs                                     |
| ESLint `--max-warnings 0` sur les 4 fichiers   | 0 erreurs, 0 warnings                         |
| Prettier sur les 4 fichiers                    | Clean                                         |
| Fichiers > 400 lignes                          | Non — max 250 lignes (ChannelPricingCard.tsx) |
| Nouveau fetch / select('\*') / appel API       | Non                                           |
| Modification trigger stock / route Qonto       | Non                                           |

---

## Desktop inchangé

Le markup desktop est préservé dans les `renderTable` de `ResponsiveDataView`, qui n'est rendu qu'à `md+` (768px+). Côté header, le wrapper `md:contents` applique un layout identique à l'original sur desktop : les 3 éléments (thumbnail, info, actions) restent alignés horizontalement dans le parent flex.
