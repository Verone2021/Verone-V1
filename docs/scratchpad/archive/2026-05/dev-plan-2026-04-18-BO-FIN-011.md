# Dev Plan — [BO-FIN-011] Badge discordance total DB vs Qonto

**Date** : 2026-04-18
**Branche** : `feat/BO-FIN-011-badge-discordance-total` (depuis staging)
**Priorité** : MOYENNE (~2h, filet de sécurité en attendant BO-FIN-009 Phase 1)
**Source** : `.claude/work/ACTIVE.md` § BO-FIN-011

## Contexte

Avant BO-FIN-009 (alignement arrondi DB vs Qonto), certaines factures
présentent un écart entre le `total_ttc` stocké en DB (`financial_documents`)
et le `total_amount_cents` reçu de Qonto. Afficher une pastille orange sur
les factures concernées comme filet de sécurité / alerte visuelle.

## Etat vérifié (Triple Lecture)

### Données disponibles

- **DB** (`financial_documents`) :
  - `total_ttc: number` (euros, 2 décimales) — ligne 2982 de `supabase.ts`
  - `total_ht: number`, `tva_amount: number`
- **Qonto API** (`/api/qonto/invoices` → `result.client_invoices[]`) :
  - `total_amount_cents: number` (cents entiers)
  - `total_amount.value: string` (euros string)
- **API enrichissement actuel** (`route.ts:107-156`) :
  - Query `financial_documents` sur `qonto_invoice_id in (...)` déjà présente
  - SELECT actuel n'inclut PAS `total_ttc`
- **Type `Invoice`** (`factures/components/types.ts:90-124`) :
  - `total_amount_cents: number` — présent (Qonto)
  - `local_total_ttc` — ABSENT, à ajouter

### Règle de seuil

`|total_ttc_DB - (total_amount_cents / 100)| > 0.01`

Soit : `Math.abs(localTotalTtc - qontoTotalCents / 100) > 0.01`

### Emplacements cibles

1. **InvoicesTable.tsx** — pastille dans la cellule "Montant" (ligne 189-194) — **IN SCOPE**
2. **SalesOrderTableRow.tsx** — **HORS SCOPE** (nécessite enrichir `use-sales-orders` hook : comparaison SO.total_ttc vs invoice.total_ttc est une autre nature de discordance, et l'enrichissement des 1 facture par SO requiert soit N+1 fetches soit un JOIN side effects risk élevé). Documenter et déférer.

## Plan d'action

### 1. Enrichir l'API `/api/qonto/invoices/route.ts`

Ajouter `total_ttc` au SELECT ligne 112 :

```ts
.select(
  'id, qonto_invoice_id, deleted_at, sales_order_id, status, amount_paid, partner_id, total_ttc, sales_orders!financial_documents_sales_order_id_fkey(order_number), organisations!financial_documents_partner_id_fkey(legal_name, trade_name)'
)
```

Ajouter `local_total_ttc` à `ILocalDocData` (ligne 92-103) :

```ts
local_total_ttc: number | null;
```

Ajouter `total_ttc?: number | null` au type `DocWithExtras` (ligne 118-132).

Ajouter mapping dans `localDataMap` reduce (ligne 134-155) :

```ts
local_total_ttc: doc.total_ttc ?? null,
```

Ajouter au `enrichedInvoices.map` (ligne 170-184) :

```ts
local_total_ttc: localData?.local_total_ttc ?? null,
```

### 2. Étendre le type Invoice

Fichier : `apps/back-office/src/app/(protected)/factures/components/types.ts`

Ajouter après `local_amount_paid` (ligne 120) :

```ts
local_total_ttc?: number | null;
```

### 3. Créer `DocumentDiscordanceBadge`

Fichier : `packages/@verone/finance/src/components/DocumentDiscordanceBadge.tsx`

Deux exports :

**Helper pur** (testable) :

```ts
export function hasTotalDiscordance(
  localTotalTtcEuros: number | null | undefined,
  qontoTotalCents: number | null | undefined,
  threshold = 0.01
): boolean {
  if (localTotalTtcEuros == null || qontoTotalCents == null) return false;
  return Math.abs(localTotalTtcEuros - qontoTotalCents / 100) > threshold;
}
```

**Composant** :

```tsx
'use client';

import { Badge, cn } from '@verone/ui';
import { AlertTriangle } from 'lucide-react';

interface DocumentDiscordanceBadgeProps {
  localTotalTtcEuros: number | null | undefined;
  qontoTotalCents: number | null | undefined;
  className?: string;
}

export function DocumentDiscordanceBadge({
  localTotalTtcEuros,
  qontoTotalCents,
  className,
}: DocumentDiscordanceBadgeProps) {
  if (!hasTotalDiscordance(localTotalTtcEuros, qontoTotalCents)) return null;

  const diff = (
    (localTotalTtcEuros ?? 0) -
    (qontoTotalCents ?? 0) / 100
  ).toFixed(2);

  return (
    <Badge
      variant="outline"
      className={cn(
        'bg-orange-50 text-orange-700 border-orange-200 gap-1',
        className
      )}
      title={`Discordance total DB vs Qonto : ${diff}€ (DB ${(localTotalTtcEuros ?? 0).toFixed(2)}€ vs Qonto ${((qontoTotalCents ?? 0) / 100).toFixed(2)}€)`}
    >
      <AlertTriangle className="h-3 w-3" />
      Discordance
    </Badge>
  );
}
```

### 4. Exporter depuis l'index

Fichier : `packages/@verone/finance/src/components/index.ts`

Ajouter à côté de `DocumentSourceBadge` :

```ts
export * from './DocumentDiscordanceBadge';
```

### 5. Intégrer dans InvoicesTable

Fichier : `apps/back-office/src/app/(protected)/factures/components/InvoicesTable.tsx`

Import :

```ts
import { DocumentDiscordanceBadge } from '@verone/finance/components';
```

Dans la cellule "Montant" (ligne 189-194) :

```tsx
<TableCell className="text-right font-medium">
  <div className="flex items-center justify-end gap-2">
    <DocumentDiscordanceBadge
      localTotalTtcEuros={invoice.local_total_ttc}
      qontoTotalCents={invoice.total_amount_cents}
    />
    <span>
      {formatAmount(
        parseFloat(invoice.total_amount.value),
        invoice.total_amount.currency
      )}
    </span>
  </div>
</TableCell>
```

### 6. SalesOrderTableRow — DÉFERÉ

Justification :

- La comparaison "SO.total_ttc vs invoice.total_ttc" est une discordance
  sémantiquement différente (SO ↔ facture) de "DB vs Qonto" (facture DB ↔
  facture Qonto). Les deux méritent des badges distincts.
- L'enrichissement du hook `use-sales-orders` pour inclure les données Qonto
  ou les totals factures induit un risque N+1 (une facture par SO) ou un
  JOIN complexe. Estimation = sprint dédié.
- BO-FIN-009 Phase 1 corrige la cause racine (alignement arrondi). Une
  fois cette phase appliquée, la discordance disparaît en masse et le
  badge peut être retiré.

Décision : couvrir InvoicesTable comme filet de sécurité primaire (>80% des
vues concernées). Documenter dans ACTIVE.md que SalesOrderTableRow est à
faire dans un sprint ultérieur.

## Commits attendus

Un seul commit :

```
[BO-FIN-011] feat: DocumentDiscordanceBadge DB vs Qonto on invoices list
```

## Verification

- `pnpm --filter @verone/finance type-check` → 0 erreur
- `pnpm --filter @verone/back-office type-check` → 0 erreur
- `grep -n "DocumentDiscordanceBadge" packages/@verone/finance/src/components/index.ts` → 1 export
- `grep -n "hasTotalDiscordance" packages/@verone/finance/src/components/DocumentDiscordanceBadge.tsx` → présent
- Screenshot Playwright `/factures` : aucune régression du layout, pastille
  visible uniquement si discordance

## Hors scope (explicite)

- SalesOrderTableRow (voir §6)
- DevisTab / devis Qonto (discordance DB ↔ Qonto sur devis rarement utile,
  et complexité enrichissement identique)
- Aucune modification DB, aucune migration
- Aucune modification du calcul de `total_ttc` côté DB (BO-FIN-009 Phase 1)
- Ne pas refactorer la structure de `ILocalDocData` (ajout atomique du champ)

## Risques

- **R1** : si `financial_documents.total_ttc` est NULL (jamais en pratique
  mais possible en legacy), le badge ne s'affiche pas (early return).
  Acceptable.
- **R2** : le seuil 0.01€ peut masquer des discordances sub-centime.
  Volontaire — correspond à la précision affichée utilisateur.
