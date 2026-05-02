# Regles Responsive Verone

**Source de verite pour tous les composants UI du monorepo.**
Toute page, composant, modal doit respecter ces regles sans exception.

---

## Principe fondateur : Mobile-First

On concoit d'abord pour mobile (320-640px), puis on enrichit pour les
ecrans plus grands avec les prefixes Tailwind `sm:`, `md:`, `lg:`, `xl:`,
`2xl:`.

JAMAIS l'inverse. On ne part pas du desktop pour "faire rentrer" sur mobile.

---

## Breakpoints Verone (obligatoires)

| Nom       | Largeur min | Appareils cibles                                       |
| --------- | ----------- | ------------------------------------------------------ |
| (default) | 0-639px     | iPhone SE, iPhone 14, iPhone Pro Max, Galaxy Fold plie |
| `sm:`     | 640px+      | Grand mobile paysage, petites tablettes                |
| `md:`     | 768px+      | Tablette, iPad portrait, Galaxy Fold ouvert            |
| `lg:`     | 1024px+     | Laptop S (MacBook Air 11"), tablette paysage           |
| `xl:`     | 1280px+     | Laptop M (MacBook 13"/14")                             |
| `2xl:`    | 1536px+     | Desktop (MacBook 16", ecran externe 1080p+)            |

Source : `packages/@verone/hooks/src/use-breakpoint.ts` (constantes exportees).

---

## Les 5 techniques obligatoires pour toute UI de donnees

### Technique 1 : Transformation table -> cartes sur mobile

**INTERDIT** : afficher un `<Table>` a une largeur < 768px.
**OBLIGATOIRE** : basculer en liste de cartes empilees.

Utiliser `<ResponsiveDataView>` de `@verone/ui` qui gere automatiquement.

```tsx
import { ResponsiveDataView } from '@verone/ui';

<ResponsiveDataView
  data={invoices}
  loading={loading}
  emptyMessage="Aucune facture"
  renderTable={items => <Table>...</Table>}
  renderCard={invoice => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <span className="font-semibold">{invoice.numero}</span>
          <Badge>{invoice.statut}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm">{invoice.client}</p>
        <p className="text-lg font-bold">{invoice.montant}</p>
        <p className="text-xs text-muted-foreground">{invoice.date}</p>
      </CardContent>
      <CardFooter>
        <ResponsiveActionMenu actions={invoiceActions} />
      </CardFooter>
    </Card>
  )}
/>;
```

### Technique 2 : Colonnes masquables progressivement

Sur tableau >= md, cacher les colonnes secondaires :

```tsx
<TableHead>N°</TableHead>                              {/* toujours */}
<TableHead>Client</TableHead>                          {/* toujours */}
<TableHead className="hidden lg:table-cell">Date</TableHead>
<TableHead className="hidden xl:table-cell">Echeance</TableHead>
<TableHead className="hidden 2xl:table-cell">Paiement</TableHead>
<TableHead>Montant</TableHead>                         {/* toujours */}
<TableHead>Actions</TableHead>                         {/* toujours */}
```

**Colonnes TOUJOURS visibles** : identifiant, libelle principal, montant/total, actions.
**Colonnes masquables** : dates, statuts secondaires, metadata, details.

### Technique 3 : Actions en dropdown progressif

Plus de 2 boutons d'action = obligation d'utiliser `<ResponsiveActionMenu>`.

```tsx
import { ResponsiveActionMenu } from '@verone/ui';
import { Eye, Pencil, Download, Trash2 } from 'lucide-react';

<ResponsiveActionMenu
  actions={[
    { label: 'Voir', icon: Eye, onClick: handleView, alwaysVisible: true },
    { label: 'Modifier', icon: Pencil, onClick: handleEdit },
    { label: 'Telecharger', icon: Download, onClick: handleDownload },
    {
      label: 'Supprimer',
      icon: Trash2,
      onClick: handleDelete,
      variant: 'destructive',
      separatorBefore: true,
    },
  ]}
  breakpoint="lg"
/>;
```

### Technique 4 : Touch targets 44px minimum sur mobile

Norme Apple + Google : bouton cliquable au doigt doit faire 44x44px min.
Sur desktop, 36px acceptable.

```tsx
<Button className="h-11 w-11 md:h-9 md:w-9">
  <Icon className="h-5 w-5 md:h-4 md:w-4" />
</Button>
```

### Technique 5 : Largeurs fluides avec flex-1 + min-w

Colonnes techniques fixes, colonne principale absorbe l'espace :

```tsx
<TableHead className="w-[90px]">N°</TableHead>
<TableHead className="min-w-[160px]">Client</TableHead>
<TableHead className="w-[100px] text-right">Montant</TableHead>
<TableHead className="w-[120px]">Actions</TableHead>
```

Conteneur parent : `<div className="w-full overflow-x-auto">` pour scroll
horizontal si vraiment necessaire.

**INTERDIT** :

- `w-auto` sur table (cause debordement)
- `max-w-*` artificiel qui bloque l'expansion
- Largeurs fixes en px sur la colonne principale

---

## Forms et modals

### Forms

```tsx
{
  /* Mobile : une colonne, desktop : deux colonnes */
}
<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
  <Input className="w-full" />
  <Input className="w-full" />
</div>;
```

### Modals

```tsx
<DialogContent className="h-screen md:h-auto md:max-w-2xl">
  <DialogHeader>...</DialogHeader>

  {/* Scroll interne sur mobile, pas sur desktop */}
  <div className="flex-1 overflow-y-auto md:max-h-[70vh]">{content}</div>

  <DialogFooter className="flex-col gap-2 md:flex-row">
    <Button variant="outline" className="w-full md:w-auto">
      Annuler
    </Button>
    <Button className="w-full md:w-auto">Valider</Button>
  </DialogFooter>
</DialogContent>
```

---

## Navigation

- **Sidebar** : cachee par defaut sur mobile, bouton hamburger visible
- **Header** : actions secondaires en menu "..." sur mobile
- **Breadcrumb** : dernier element uniquement sur mobile (`md:hidden` pour les segments intermediaires)
- **Tabs** : scroll horizontal sur mobile avec `overflow-x-auto`

---

## Toolbar / Header de page

Pattern standardise : `<ResponsiveToolbar>` de `@verone/ui`.

```tsx
<ResponsiveToolbar
  title="Factures"
  subtitle="Gestion des factures, devis et avoirs"
  search={<Input placeholder="Rechercher..." />}
  filters={
    <>
      <Select>...</Select>
      <Select>...</Select>
    </>
  }
  primaryAction={
    <Button>
      <Plus className="mr-2 h-4 w-4" /> Nouvelle facture
    </Button>
  }
  secondaryActions={
    <>
      <Button variant="outline">Sync</Button>
      <Button variant="outline">Exporter</Button>
    </>
  }
/>
```

---

## Tests Playwright obligatoires avant PR UI

Chaque PR modifiant une page doit inclure des screenshots aux 5 tailles :

```bash
# Tailles a tester obligatoirement
375  × 667   # iPhone SE, iPhone 14
768  × 1024  # iPad portrait
1024 × 768   # iPad paysage, laptop S
1440 × 900   # MacBook 13/16"
1920 × 1080  # Desktop externe
```

Screenshots joints en commentaire de PR.

---

## Checklist reviewer-agent (obligatoire avant merge)

Verifier sur chaque PR UI :

- [ ] Aucun `w-auto` sur element conteneur large
- [ ] Aucun `max-w-*` artificiel qui bloque l'expansion
- [ ] Boutons Actions **TOUJOURS** accessibles de 320px a 1920px+
- [ ] Texte tronque uniquement avec `truncate` + `title` tooltip
- [ ] Aucun champ form qui deborde sur mobile (375px)
- [ ] Touch targets >= 44px sur mobile pour tous les boutons
- [ ] Scroll vertical naturel uniquement (pas de scroll horizontal parasite)
- [ ] Tables converties en cartes sur < md via ResponsiveDataView
- [ ] Plus de 2 actions -> ResponsiveActionMenu utilise
- [ ] Screenshots Playwright fournis aux 5 tailles standards
- [ ] Zero regression sur les autres pages (Playwright snapshots)

---

## Composants standards a utiliser

| Besoin                           | Composant                                     |
| -------------------------------- | --------------------------------------------- |
| Afficher donnees tabulaires      | `ResponsiveDataView` (auto table/cards)       |
| Menu actions multiple            | `ResponsiveActionMenu` (auto dropdown mobile) |
| Header de page (titre + filtres) | `ResponsiveToolbar`                           |
| Detecter breakpoint actuel       | `useBreakpoint()` hook                        |
| Test simple mobile/desktop       | `useMobile()` hook                            |

---

## Anti-patterns interdits

**NE JAMAIS FAIRE** :

- Utiliser `<Table>` nu sur page public < md
- `className="w-screen"` (casse avec sidebar)
- `className="w-[1200px]"` (bloque resize)
- 4 boutons icones sur mobile sans dropdown
- Modal fixe sans scroll interne (causes scroll page entiere sur mobile)
- Texte en `text-xs` en dessous de 640px (illisible)

**TOUJOURS FAIRE** :

- Utiliser les 3 composants responsive standards
- Tester a 375px AVANT toute PR
- Tester avec Playwright aux 5 tailles
- Lire `CLAUDE.md` section STANDARDS RESPONSIVE

---

## En cas de doute

Consulter :

1. `CLAUDE.md` section STANDARDS RESPONSIVE
2. Cette regle : `.claude/rules/responsive.md`
3. Code des composants standards : `packages/@verone/ui/src/components/ui/responsive-*.tsx`
4. Hook : `packages/@verone/hooks/src/use-breakpoint.ts`

Les references externes (standard industriel) :

- Stripe Dashboard (references B2B)
- Linear App
- Shopify Admin
- Vercel Dashboard

Tous utilisent ces memes 5 techniques. Nous les appliquons avec discipline.

---

## ⚡ Précision sur les tests Playwright 5 tailles (ajoutée 2026-05-02)

**Tests Playwright 5 tailles obligatoires UNIQUEMENT sur les apps publiques** (site-internet, apps de marques à venir, pages publiques LinkMe `/s/[id]/*` et `/[affiliateSlug]/*`).

**Apps admin (back-office, LinkMe SaaS affiliés)** : desktop-first uniquement. Pas de tests Playwright 375 / 768 / 1024 px obligatoires. Seul desktop 1440 + 1920 obligatoire.

**Exceptions back-office responsive obligatoire** (pages réellement utilisées en mobile par Roméo) :

- `/produits/catalogue` (consultation rapide en magasin/livraison)
- `/produits/catalogue/[productId]` (consultation rapide)
- `/stocks/inventaire` (audit terrain)
- `/commandes` (suivi mobile)
- `/expeditions` (mobile)

Pour CES pages spécifiques back-office : 5 tailles obligatoires comme avant.

**Pour TOUTES les autres pages back-office** (formulaires admin, dashboards complexes, paramètres, finance, etc.) : test desktop suffit. Si la page n'est pas adaptée mobile aujourd'hui, ce n'est pas grave — on l'adaptera plus tard sprint dédié.

### Pourquoi cette règle

Imposer le responsive sur 5 tailles à toutes les pages back-office bloque l'avancement avec des fix cosmétiques mobiles inutiles, alors que Roméo n'utilise PAS le back-office sur petit mobile. Les pages admin sont desktop par nature. Cette règle évite la perte de temps.
