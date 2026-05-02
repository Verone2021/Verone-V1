# Règles Responsive Verone

**Source de vérité unique** pour tous les composants UI du monorepo.
Toute page, composant, modal doit respecter ces règles sans exception.

> Compactée en `[INFRA-LEAN-002]` — exemples longs retirés, règles intactes.

---

## Principe fondateur : Mobile-First

Concevoir d'abord pour mobile (320-640px), enrichir avec les préfixes
Tailwind `sm:`, `md:`, `lg:`, `xl:`, `2xl:`. JAMAIS l'inverse.

## Breakpoints Verone

| Nom       | Largeur min | Appareils cibles                                       |
| --------- | ----------- | ------------------------------------------------------ |
| (default) | 0-639px     | iPhone SE, iPhone 14, iPhone Pro Max, Galaxy Fold plié |
| `sm:`     | 640px+      | Grand mobile paysage, petites tablettes                |
| `md:`     | 768px+      | Tablette, iPad portrait, Galaxy Fold ouvert            |
| `lg:`     | 1024px+     | Laptop S, tablette paysage                             |
| `xl:`     | 1280px+     | Laptop M (MacBook 13"/14")                             |
| `2xl:`    | 1536px+     | Desktop (MacBook 16", écran externe 1080p+)            |

Source : `packages/@verone/hooks/src/use-breakpoint.ts`.

---

## Les 5 techniques obligatoires

### 1. Transformation table → cartes sur mobile

INTERDIT : `<Table>` à une largeur < 768px. OBLIGATOIRE : `<ResponsiveDataView>` de `@verone/ui` qui gère automatiquement (props `renderTable` + `renderCard`).

### 2. Colonnes masquables progressivement

Sur tableau ≥ md, cacher les colonnes secondaires :

```tsx
<TableHead>N°</TableHead>                              {/* toujours */}
<TableHead>Client</TableHead>                          {/* toujours */}
<TableHead className="hidden lg:table-cell">Date</TableHead>
<TableHead className="hidden xl:table-cell">Échéance</TableHead>
<TableHead className="hidden 2xl:table-cell">Paiement</TableHead>
<TableHead>Montant</TableHead>                         {/* toujours */}
<TableHead>Actions</TableHead>                         {/* toujours */}
```

- **Toujours visibles** : identifiant, libellé principal, montant/total, actions.
- **Masquables** : dates, statuts secondaires, métadonnées, détails.

### 3. Actions en dropdown progressif

Plus de 2 boutons d'action = obligation `<ResponsiveActionMenu>` de `@verone/ui` avec `breakpoint="lg"` par défaut.

```tsx
<ResponsiveActionMenu
  actions={[
    { label: 'Voir', icon: Eye, onClick: handleView, alwaysVisible: true },
    { label: 'Modifier', icon: Pencil, onClick: handleEdit },
    {
      label: 'Supprimer',
      icon: Trash2,
      onClick: handleDelete,
      variant: 'destructive',
      separatorBefore: true,
    },
  ]}
  breakpoint="lg"
/>
```

### 4. Touch targets 44px minimum sur mobile

Norme Apple + Google. 36px acceptable sur desktop.

```tsx
<Button className="h-11 w-11 md:h-9 md:w-9">
  <Icon className="h-5 w-5 md:h-4 md:w-4" />
</Button>
```

### 5. Largeurs fluides

Colonnes techniques fixes, colonne principale absorbe l'espace :

```tsx
<TableHead className="w-[90px]">N°</TableHead>
<TableHead className="min-w-[160px]">Client</TableHead>
<TableHead className="w-[100px] text-right">Montant</TableHead>
<TableHead className="w-[120px]">Actions</TableHead>
```

Conteneur parent : `<div className="w-full overflow-x-auto">` si scroll horizontal nécessaire.

INTERDIT : `w-auto` sur table, `max-w-*` artificiel, largeurs fixes en px sur la colonne principale.

---

## Forms et modals

```tsx
{
  /* Forms — mobile : une colonne, desktop : deux */
}
<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
  <Input className="w-full" />
</div>;

{
  /* Modals — scroll interne mobile, fixe desktop */
}
<DialogContent className="h-screen md:h-auto md:max-w-2xl">
  <div className="flex-1 overflow-y-auto md:max-h-[70vh]">{content}</div>
  <DialogFooter className="flex-col gap-2 md:flex-row">
    <Button variant="outline" className="w-full md:w-auto">
      Annuler
    </Button>
    <Button className="w-full md:w-auto">Valider</Button>
  </DialogFooter>
</DialogContent>;
```

## Navigation

- **Sidebar** cachée par défaut sur mobile, hamburger visible
- **Header** : actions secondaires en menu "..." sur mobile
- **Breadcrumb** : dernier élément uniquement sur mobile (`md:hidden` pour les segments intermédiaires)
- **Tabs** : `overflow-x-auto` sur mobile

## Toolbar / Header de page

`<ResponsiveToolbar>` de `@verone/ui` avec props `title`, `subtitle`, `search`, `filters`, `primaryAction`, `secondaryActions`.

---

## Composants standards

| Besoin                           | Composant                                     |
| -------------------------------- | --------------------------------------------- |
| Données tabulaires               | `ResponsiveDataView` (auto table/cards)       |
| Menu actions multiple            | `ResponsiveActionMenu` (auto dropdown mobile) |
| Header de page (titre + filtres) | `ResponsiveToolbar`                           |
| Détecter breakpoint actuel       | `useBreakpoint()` hook                        |
| Test simple mobile/desktop       | `useMobile()` hook                            |

---

## Tests Playwright avant PR UI

5 tailles obligatoires sur les **apps publiques** (site-internet, marques, pages publiques LinkMe `/s/[id]/*` et `/[affiliateSlug]/*`) :

```
375  × 667   # iPhone SE, iPhone 14
768  × 1024  # iPad portrait
1024 × 768   # iPad paysage, laptop S
1440 × 900   # MacBook 13/16"
1920 × 1080  # Desktop externe
```

**Apps admin (back-office, LinkMe SaaS)** : desktop-first uniquement (1440 + 1920 obligatoires).

**Exceptions back-office responsive obligatoire** (pages utilisées en mobile) :

- `/produits/catalogue` + `[productId]` (consultation magasin/livraison)
- `/stocks/inventaire` (audit terrain)
- `/commandes` (suivi mobile)
- `/expeditions` (mobile)

Pour ces pages : 5 tailles obligatoires. Pour TOUTES les autres pages back-office (formulaires admin, dashboards complexes, paramètres, finance) : test desktop suffit.

---

## Checklist reviewer (avant merge UI)

- [ ] Aucun `w-auto` sur élément conteneur large
- [ ] Aucun `max-w-*` artificiel
- [ ] Boutons Actions accessibles de 320px à 1920px+
- [ ] Texte tronqué uniquement avec `truncate` + `title` tooltip
- [ ] Aucun champ form qui déborde sur mobile (375px)
- [ ] Touch targets ≥ 44px sur mobile
- [ ] Pas de scroll horizontal parasite
- [ ] Tables converties en cartes sur < md via ResponsiveDataView
- [ ] > 2 actions → ResponsiveActionMenu utilisé
- [ ] Screenshots Playwright fournis aux 5 tailles si app publique

---

## Anti-patterns interdits

- `<Table>` nu sur page publique < md
- `className="w-screen"` (casse avec sidebar)
- `className="w-[1200px]"` (bloque resize)
- 4 boutons icônes sur mobile sans dropdown
- Modal fixe sans scroll interne (cause scroll page entière sur mobile)
- Texte `text-xs` en dessous de 640px (illisible)

---

## Références

- Code des composants : `packages/@verone/ui/src/components/ui/responsive-*.tsx`
- Hook : `packages/@verone/hooks/src/use-breakpoint.ts`
- Standards externes appliqués : Stripe Dashboard, Linear, Shopify Admin, Vercel Dashboard.
