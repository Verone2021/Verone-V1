# Guide Responsive Verone — Exemple d'implementation

Ce document montre comment utiliser les 3 composants responsive standards
de `@verone/ui` pour une page type "liste CRUD" (Pattern A).

**A copier-coller-adapter pour migrer les pages existantes.**

---

## Imports standards

```tsx
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  ResponsiveActionMenu,
  ResponsiveDataView,
  ResponsiveToolbar,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import { Download, Eye, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
```

---

## Structure complete d'une page Pattern A

```tsx
'use client';

export function InvoicesPage() {
  const { invoices, loading } = useInvoices();

  return (
    <div className="flex flex-col gap-6">
      {/* 1. TOOLBAR : titre + actions + filtres */}
      <ResponsiveToolbar
        title="Factures"
        subtitle="Gestion des factures, devis et avoirs"
        primaryAction={
          <Button className="w-full md:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle facture
          </Button>
        }
        secondaryActions={
          <Button variant="outline" className="w-full md:w-auto">
            <RefreshCw className="mr-2 h-4 w-4" />
            Sync Qonto
          </Button>
        }
      />

      {/* 2. DATA VIEW : table sur desktop, cards sur mobile */}
      <ResponsiveDataView
        data={invoices}
        loading={loading}
        emptyMessage="Aucune facture"
        skeletonCount={5}
        /* Mode TABLE (>= 768px) */
        renderTable={items => (
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                {/* Colonnes TOUJOURS visibles : identifiant, libelle, montant, actions */}
                <TableHead className="w-[100px]">N°</TableHead>
                <TableHead className="min-w-[160px]">Client</TableHead>

                {/* Colonnes masquables progressivement */}
                <TableHead className="hidden lg:table-cell w-[110px]">
                  Date
                </TableHead>
                <TableHead className="hidden xl:table-cell w-[110px]">
                  Echeance
                </TableHead>
                <TableHead className="hidden 2xl:table-cell w-[120px]">
                  Paiement
                </TableHead>

                {/* Colonnes TOUJOURS visibles */}
                <TableHead className="w-[120px] text-right">Montant</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(invoice => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">
                    {invoice.numero}
                  </TableCell>
                  <TableCell className="truncate" title={invoice.client}>
                    {invoice.client}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {invoice.date}
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">
                    {invoice.echeance}
                  </TableCell>
                  <TableCell className="hidden 2xl:table-cell">
                    <Badge>{invoice.paiement}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {invoice.montant}
                  </TableCell>
                  <TableCell>
                    <ResponsiveActionMenu
                      breakpoint="lg"
                      actions={[
                        {
                          label: 'Voir',
                          icon: Eye,
                          onClick: () => onView(invoice.id),
                          alwaysVisible: true,
                        },
                        {
                          label: 'Modifier',
                          icon: Pencil,
                          onClick: () => onEdit(invoice.id),
                        },
                        {
                          label: 'Telecharger',
                          icon: Download,
                          onClick: () => onDownload(invoice.id),
                        },
                        {
                          label: 'Supprimer',
                          icon: Trash2,
                          onClick: () => onDelete(invoice.id),
                          variant: 'destructive',
                          separatorBefore: true,
                        },
                      ]}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        /* Mode CARTES (< 768px) */
        renderCard={invoice => (
          <Card className="w-full">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate">{invoice.numero}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {invoice.client}
                  </p>
                </div>
                <Badge>{invoice.paiement}</Badge>
              </div>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="flex items-baseline justify-between">
                <p className="text-2xl font-bold">{invoice.montant}</p>
                <p className="text-xs text-muted-foreground">{invoice.date}</p>
              </div>
            </CardContent>
            <CardFooter className="pt-0 gap-2">
              <Button
                onClick={() => onView(invoice.id)}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <Eye className="mr-2 h-4 w-4" />
                Voir
              </Button>
              <ResponsiveActionMenu
                breakpoint="xl"
                actions={[
                  {
                    label: 'Modifier',
                    icon: Pencil,
                    onClick: () => onEdit(invoice.id),
                  },
                  {
                    label: 'Telecharger',
                    icon: Download,
                    onClick: () => onDownload(invoice.id),
                  },
                  {
                    label: 'Supprimer',
                    icon: Trash2,
                    onClick: () => onDelete(invoice.id),
                    variant: 'destructive',
                    separatorBefore: true,
                  },
                ]}
              />
            </CardFooter>
          </Card>
        )}
      />
    </div>
  );
}
```

---

## Points cles a retenir

### 1. Colonnes du tableau

- **TOUJOURS visibles** : identifiant (N°), libelle principal (Client), montant, actions
- **Masquables progressivement** (du moins important au plus important) :
  - `hidden lg:table-cell` : info secondaire (date)
  - `hidden xl:table-cell` : detail (echeance)
  - `hidden 2xl:table-cell` : metadata (paiement)

### 2. Largeurs

- Identifiant : `w-[100px]` (fixe)
- Libelle principal : `min-w-[160px]` (absorbe l'espace)
- Montant : `w-[120px] text-right` (fixe, aligne a droite)
- Actions : `w-[120px]` (fixe)

**JAMAIS** `w-auto` sur une table ou `w-[NNNpx]` sur la colonne principale.

### 3. Actions

Toujours utiliser `ResponsiveActionMenu` pour 3+ actions :

- Action critique (Voir) : `alwaysVisible: true` -> bouton separe meme sur mobile
- Actions destructives : `variant: 'destructive'` + `separatorBefore: true`
- Breakpoint : `lg` (par defaut) = dropdown sur < 1024px

### 4. Card mobile

Structure obligatoire :

- **Header** : identifiant + statut (badge)
- **Content** : montant en gros + date petite
- **Footer** : action primaire + ResponsiveActionMenu

### 5. Toolbar

- `title` + `subtitle` = en haut
- `primaryAction` = CTA principal (toujours visible)
- `secondaryActions` = actions secondaires
- `search` + `filters` = ligne 2

---

## Tests Playwright obligatoires

```tsx
import { test } from '@playwright/test';
import {
  testAtAllViewports,
  assertTouchTargetsOnMobile,
  assertFullyVisible,
} from '../fixtures/responsive';

testAtAllViewports(
  '/factures',
  async ({ page, viewport }) => {
    // Bouton primaire toujours visible
    await assertFullyVisible(page, 'button:has-text("Nouvelle facture")');

    // Action critique toujours accessible
    await assertFullyVisible(page, '[aria-label="Voir"]');

    // Touch targets 44px sur mobile
    if (viewport.name === 'mobile') {
      await assertTouchTargetsOnMobile(page, [
        '[aria-label="Voir"]',
        '[aria-label="Menu d\'actions"]',
        'button:has-text("Nouvelle facture")',
      ]);
    }
  },
  { screenshotPrefix: 'factures' }
);
```

---

## Checklist avant PR

- [ ] Toolbar `ResponsiveToolbar` utilisee
- [ ] DataView `ResponsiveDataView` utilisee (table + cards)
- [ ] Actions via `ResponsiveActionMenu`
- [ ] Colonnes masquables avec `hidden lg:/xl:/2xl:table-cell`
- [ ] Largeurs fluides : `min-w-*` + `w-*` fixes
- [ ] Touch targets 44px sur mobile
- [ ] Tests Playwright aux 5 tailles
- [ ] Screenshots joints en PR
