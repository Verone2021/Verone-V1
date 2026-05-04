# Dev Plan — [BO-FIN-010] Badges Commande vs Service

**Date** : 2026-04-18
**Branche** : `feat/BO-FIN-010-badges-commande-service` (depuis staging)
**Priorité** : MOYENNE (~1-2h)
**Source** : `.claude/work/ACTIVE.md` § BO-FIN-010

## Contexte

Distinction visuelle au premier coup d'œil entre les devis/factures issus
d'une commande (sales_order_id présent) et ceux créés sans commande (kind='service').
Lecture seule, pas de modification DB.

## Etat vérifié (Triple Lecture)

### Types existants

- **Invoice** (`apps/back-office/.../factures/components/types.ts:118`) : contient déjà `sales_order_id?: string | null`
- **QontoQuote** (même fichier, ligne 67) : ne contient PAS `sales_order_id`, mais a `order_number?: string | null` enrichi côté API (`/api/qonto/quotes/route.ts:90-99` joint `financial_documents.order_number`). `order_number` sert de proxy fidèle : il n'est présent QUE si un `sales_order_id` existe.
- **QontoDocument** (`factures/[id]/types.tsx:47`) : pas de `sales_order_id` direct, mais `QontoApiResponse.localData.sales_order_id?: string | null` (ligne 18) est fourni au parent `DocumentDetailPage`.
- **QontoQuoteDetail** (`factures/devis/[id]/types.ts:12`) : ne contient PAS `sales_order_id`, et l'API `/api/qonto/quotes/[id]/route.ts` ne l'enrichit pas.

### Intégrations

| Emplacement                | Données dispo ?                              | Stratégie                                                                                                                   |
| -------------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `InvoicesTable.tsx`        | oui (`invoice.sales_order_id`)               | branchement direct                                                                                                          |
| `DevisTab.tsx`             | oui (proxy `quote.order_number`)             | branchement direct                                                                                                          |
| `DocumentDetailHeader.tsx` | oui au parent (`localData.sales_order_id`)   | ajout prop `salesOrderId?: string \| null`                                                                                  |
| `DevisContent.tsx`         | **NON** (type non enrichi, API non enrichie) | **DEFERÉ** à un sprint dédié (nécessite enrichissement API ou second fetch — collision potentielle avec BO-FIN-009 Phase 5) |

### Icônes lucide-react disponibles

`ShoppingBag` et `Briefcase` sont exportés par `lucide-react` (déjà largement utilisés dans le repo).

## Plan d'action

### 1. Créer `DocumentSourceBadge`

Fichier : `packages/@verone/finance/src/components/DocumentSourceBadge.tsx`

```tsx
'use client';

import { Badge } from '@verone/ui';
import { ShoppingBag, Briefcase } from 'lucide-react';

interface DocumentSourceBadgeProps {
  /**
   * True si le document est issu d'une commande (sales_order_id présent).
   * False si document standalone (service / kind='service').
   */
  hasOrderLink: boolean;
  className?: string;
}

/**
 * Badge visuel indiquant la source du document financier :
 * - "Commande" (bleu, ShoppingBag) si rattaché à une sales_order
 * - "Service" (ambre, Briefcase) si document standalone
 *
 * @since 2026-04-18 (BO-FIN-010)
 */
export function DocumentSourceBadge({
  hasOrderLink,
  className,
}: DocumentSourceBadgeProps) {
  if (hasOrderLink) {
    return (
      <Badge
        variant="outline"
        className={`bg-blue-50 text-blue-700 border-blue-200 ${className ?? ''}`}
      >
        <ShoppingBag className="h-3 w-3 mr-1" />
        Commande
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className={`bg-amber-50 text-amber-700 border-amber-200 ${className ?? ''}`}
    >
      <Briefcase className="h-3 w-3 mr-1" />
      Service
    </Badge>
  );
}
```

### 2. Exporter depuis l'index finance components

Fichier : `packages/@verone/finance/src/components/index.ts`

Ajouter ligne à côté de `export * from './QuoteStatusBadge';` :

```ts
export * from './DocumentSourceBadge'; // Badge Commande vs Service (BO-FIN-010)
```

### 3. Intégration InvoicesTable

Fichier : `apps/back-office/src/app/(protected)/factures/components/InvoicesTable.tsx`

Import :

```ts
import { DocumentSourceBadge } from '@verone/finance/components';
```

Dans la cellule "N° Facture" (ligne 105-115), ajouter le badge sous le
numéro :

```tsx
<TableCell>
  <div className="font-mono text-xs">{invoice.number}</div>
  <div className="mt-1">
    <DocumentSourceBadge hasOrderLink={!!invoice.sales_order_id} />
  </div>
  {invoice.sales_order_id && invoice.order_number && (
    <button ... />
  )}
</TableCell>
```

### 4. Intégration DevisTab

Fichier : `apps/back-office/src/app/(protected)/factures/components/DevisTab.tsx`

Import `DocumentSourceBadge`.

Dans la cellule "N° Devis" (ligne 110-118), ajouter :

```tsx
<TableCell>
  <div className="font-mono">{quote.quote_number}</div>
  <div className="mt-1">
    <DocumentSourceBadge hasOrderLink={!!quote.order_number} />
  </div>
  {(quote.order_number ?? quote.purchase_order_number) && (
    <div className="text-[11px] text-muted-foreground mt-0.5">
      {quote.order_number ?? quote.purchase_order_number}
    </div>
  )}
</TableCell>
```

### 5. Intégration DocumentDetailHeader

Fichier : `apps/back-office/src/app/(protected)/factures/[id]/DocumentDetailHeader.tsx`

Ajouter prop `salesOrderId?: string | null;` à l'interface (après `isOverdue`).

Import `DocumentSourceBadge`.

Dans l'entête (autour du `StatusPill` lignes 90-100), ajouter après la pill :

```tsx
<DocumentSourceBadge hasOrderLink={!!salesOrderId} />
```

Fichier appelant (à vérifier) : `apps/back-office/src/app/(protected)/factures/[id]/page.tsx` (ou équivalent). Le parent dispose de `localData.sales_order_id`. Ajouter au render du header :

```tsx
<DocumentDetailHeader ... salesOrderId={localData?.sales_order_id ?? null} />
```

Le dev-agent doit identifier précisément le fichier parent via
`grep -rn "DocumentDetailHeader" apps/back-office/src/app/\(protected\)/factures/`
avant d'éditer.

### 6. DevisContent — DÉFERÉ

Justification :

- `QontoQuoteDetail` ne contient pas `sales_order_id`
- `/api/qonto/quotes/[id]/route.ts` ne fait pas l'enrichissement
- Enrichir cet endpoint entre en collision potentielle avec BO-FIN-009 Phase 5 (modifications prévues sur `/api/qonto/quotes`)
- Second fetch côté client = scope creep (+ état loading à gérer)

Décision : ajouter cette intégration dans un sprint ultérieur, après BO-FIN-009
ou dans un sprint dédié d'enrichissement API. Commenté dans le rapport.

## Commits attendus

Un seul commit :

```
[BO-FIN-010] feat: DocumentSourceBadge (Commande vs Service) on 3 locations
```

## Verification

- `pnpm --filter @verone/finance type-check` → 0 erreur
- `pnpm --filter @verone/back-office type-check` → 0 erreur
- `grep -n "DocumentSourceBadge" packages/@verone/finance/src/components/index.ts` → 1 export
- `grep -rn "DocumentSourceBadge" apps/back-office/src/app/\\(protected\\)/factures/` → 3 usages minimum
- Screenshot Playwright :
  - `/factures` (page liste invoices) — badge visible sous N° facture
  - `/factures` onglet Devis — badge visible sous N° devis
  - `/factures/[id]` — badge visible dans le header à côté du StatusPill

## Hors scope (explicite)

- DevisContent (`factures/devis/[id]/DevisContent.tsx`) — déféré (voir §6)
- Aucune modification DB, aucune migration
- Aucune modification API (pas de modif `/api/qonto/*`)
- Ne pas renommer de composants existants
- Ne pas refactorer InvoicesTable ou DevisTab au-delà de l'ajout du badge

## Risques identifiés

- **R1** : `quote.order_number` comme proxy peut rater des cas où `sales_order_id` est présent mais `order_number` null (si backfill incomplet). Risque faible : le code `/api/qonto/quotes/route.ts:99` joint explicitement `financial_documents` qui contient ces deux champs ensemble.
- **R2** : le badge peut cacher ou décaler l'UI existante. Mitigation : tests Playwright screenshots avant/après.
