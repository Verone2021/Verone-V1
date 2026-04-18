# Pilote BO-UI-RESP-003 v2 — Template de décomposition /factures

**Date** : 2026-04-19
**Contexte** : le pilote v1 a FAIL (bug React "Rendered more hooks" + 5 CRITICAL). Revert propre sur staging. On redémarre Option A avec scope 1 page + décomposition en 3 fichiers + test runtime obligatoire.

---

## 1. Diagnostic probable du bug "Rendered more hooks than during the previous render"

J'ai relu `ResponsiveDataView` (86 lignes) et `ResponsiveActionMenu` (~180 lignes) de `@verone/ui`. **Les deux sont propres** — aucun hook suspect, CSS responsive pur.

**Le bug vient du code pilote du dev-agent.** Hypothèses par ordre de probabilité :

### Hypothèse 1 — Hook dans le callback `renderCard` ou `renderTable` (très probable)

`ResponsiveDataView` appelle `renderCard(item, idx)` dans une `.map()` et `renderTable(data)` à côté. **Les deux sont rendus en permanence** (basculement CSS, pas JS). Si le dev-agent a écrit :

```tsx
// ❌ CASSE — hook dans un callback passé comme prop
<ResponsiveDataView
  renderCard={(invoice) => {
    const [hovered, setHovered] = useState(false); // HOOK DANS UNE LAMBDA
    const actions = useMemo(() => buildActions(invoice), [invoice]); // IDEM
    return <Card>...</Card>;
  }}
/>
```

React compte les hooks par ordre. Ici `useState` et `useMemo` s'exécutent **une fois par item** dans la map. Dès que `data.length` change (un item ajouté/supprimé), le compteur n'a plus le même nombre → crash.

### Hypothèse 2 — Hook après early return

```tsx
// ❌ CASSE
function InvoicesTable({ invoices }) {
  if (!invoices) return null;
  const [state, setState] = useState(); // apparaît/disparaît selon invoices
}
```

### Hypothèse 3 — Hook dans un if/else

```tsx
// ❌ CASSE
if (isDraft) {
  const handleDelete = useCallback(() => {...}); // conditionnel
}
```

### Fix universel : sortir en vrais composants React

**Règle d'or** : si tu utilises un hook, tu es DANS un composant React (fonction avec majuscule, retournant du JSX). **Jamais** dans une lambda, un callback ou une fonction utilitaire.

```tsx
// ✅ CORRECT
function InvoiceMobileCard({ invoice, onView, onDelete }: Props) {
  const [hovered, setHovered] = useState(false); // hook OK ici
  return <Card>...</Card>;
}

<ResponsiveDataView
  renderCard={(invoice) => <InvoiceMobileCard invoice={invoice} onView={onView} onDelete={onDelete} />}
  // ↑ renderCard ne fait que instancier un composant, pas appeler des hooks
/>
```

---

## 2. Template décomposition /factures en 3 fichiers

Chaque fichier doit rester **< 400 lignes** (règle CLAUDE.md). On vise 3 × 150-250 lignes.

### Fichier 1 — `InvoicesTable.tsx` (orchestrateur, ~250 lignes)

```tsx
// apps/back-office/src/app/(protected)/factures/components/InvoicesTable.tsx
'use client';

import {
  ResponsiveDataView,
  Skeleton,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@verone/ui';
import { FileText } from 'lucide-react';

import type { Invoice } from './types';
import { InvoiceTableRow } from './InvoiceTableRow';
import { InvoiceMobileCard } from './InvoiceMobileCard';

interface InvoicesTableProps {
  invoices: Invoice[];
  loading: boolean;
  isDraft?: boolean;
  isArchived?: boolean;
  onView: (id: string) => void;
  onDownloadPdf: (invoice: Invoice) => void;
  onArchive?: (invoice: Invoice) => Promise<void>;
  onUnarchive?: (invoice: Invoice) => Promise<void>;
  onFinalize?: (invoice: Invoice) => Promise<void>;
  onOpenOrder?: (orderId: string) => void;
  onRapprochement?: (invoice: Invoice) => void;
  onOpenOrg?: (orgId: string) => void;
  onDelete?: (invoice: Invoice) => Promise<void>;
}

// ⚠️ AUCUN hook dans ce composant sauf si strictement nécessaire.
// ⚠️ AUCUN early return AVANT la structure de rendu.
export function InvoicesTable(props: InvoicesTableProps) {
  const { invoices, loading, ...handlers } = props;

  const emptyState = (
    <div className="text-center py-12 text-muted-foreground">
      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
      <p>Aucune facture trouvee</p>
    </div>
  );

  return (
    <ResponsiveDataView<Invoice>
      data={invoices}
      loading={loading}
      emptyMessage={emptyState}
      skeletonCount={3}
      renderTable={(items) => (
        <Table>
          <TableHeader>
            <TableRow>
              {/* Toujours visibles */}
              <TableHead className="w-[140px]">N° Facture</TableHead>
              <TableHead className="min-w-[160px]">Client</TableHead>
              {/* Masquables */}
              <TableHead className="hidden lg:table-cell w-[110px]">Date</TableHead>
              <TableHead className="hidden xl:table-cell w-[110px]">Echeance</TableHead>
              <TableHead className="hidden lg:table-cell w-[120px]">Statut</TableHead>
              <TableHead className="hidden 2xl:table-cell w-[140px]">Paiement</TableHead>
              {/* Toujours visibles */}
              <TableHead className="w-[140px] text-right">Montant</TableHead>
              <TableHead className="w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((invoice) => (
              // ✅ Vrai composant — peut contenir des hooks en toute sécurité
              <InvoiceTableRow
                key={invoice.id}
                invoice={invoice}
                {...handlers}
              />
            ))}
          </TableBody>
        </Table>
      )}
      renderCard={(invoice) => (
        // ✅ Vrai composant — peut contenir des hooks en toute sécurité
        <InvoiceMobileCard
          key={invoice.id}
          invoice={invoice}
          {...handlers}
        />
      )}
    />
  );
}
```

**Points critiques** :
- `renderTable` et `renderCard` **n'instancient QUE des composants**. Aucun `useState`, aucun `useMemo`, aucune logique.
- Les props sont passées telles quelles via `{...handlers}`. Ça reste typé.
- Si besoin de `useCallback` sur les handlers : **ça se fait dans le parent qui appelle `InvoicesTable`**, pas ici.

### Fichier 2 — `InvoiceMobileCard.tsx` (card mobile, ~200 lignes)

```tsx
// apps/back-office/src/app/(protected)/factures/components/InvoiceMobileCard.tsx
'use client';

import Link from 'next/link';
import {
  Badge, Button, Card, CardContent, CardFooter, CardHeader,
  OrganisationNameDisplay,
} from '@verone/ui';
import {
  DocumentDiscordanceBadge, DocumentSourceBadge,
} from '@verone/finance/components';
import { Eye, ExternalLink, ... } from 'lucide-react';

import type { Invoice } from './types';
import { formatAmount, formatDate } from './types';
import { InvoiceStatusBadge } from './StatusBadges';
import { InvoiceActions } from './InvoiceActions';

interface InvoiceMobileCardProps {
  invoice: Invoice;
  isDraft?: boolean;
  isArchived?: boolean;
  onView: (id: string) => void;
  onDownloadPdf: (invoice: Invoice) => void;
  // ... toutes les props handlers (identiques à InvoicesTable)
  onRapprochement?: (invoice: Invoice) => void; // ⚠️ NE PAS OUBLIER — cause du CRITICAL #4 v1
  // etc.
}

export function InvoiceMobileCard(props: InvoiceMobileCardProps) {
  const { invoice, isDraft, isArchived, ...handlers } = props;

  // ✅ Hooks ici = OK (vrai composant React)
  // Si tu veux mémoïser les actions pour ResponsiveActionMenu :
  // const actions = useMemo(() => buildActions(invoice, handlers), [invoice, handlers]);

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-xs text-muted-foreground">
              {invoice.number}
            </p>
            <div className="mt-1 flex items-center gap-1">
              <DocumentSourceBadge hasOrderLink={!!invoice.sales_order_id} />
              <DocumentDiscordanceBadge
                localTotalTtcEuros={invoice.local_total_ttc}
                qontoTotalCents={invoice.total_amount_cents}
              />
            </div>
            {invoice.partner_legal_name && (
              <button onClick={() => handlers.onOpenOrg?.(invoice.partner_id!)}
                className="mt-1 text-left">
                <OrganisationNameDisplay
                  legalName={invoice.partner_legal_name}
                  tradeName={invoice.partner_trade_name}
                  variant="compact"
                />
              </button>
            )}
          </div>
          <InvoiceStatusBadge status={invoice.status} />
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="flex items-baseline justify-between">
          <p className="text-2xl font-bold">
            {formatAmount(
              parseFloat(invoice.total_amount.value),
              invoice.total_amount.currency
            )}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDate(invoice.issue_date)}
          </p>
        </div>
      </CardContent>

      <CardFooter className="pt-0 gap-2">
        <Button
          onClick={() => handlers.onView(invoice.id)}
          variant="outline"
          size="sm"
          className="flex-1 h-11"
        >
          <Eye className="mr-2 h-4 w-4" />
          Voir
        </Button>
        {/* ⚠️ Toutes les autres actions DOIVENT passer par InvoiceActions */}
        <InvoiceActions
          invoice={invoice}
          isDraft={isDraft}
          isArchived={isArchived}
          {...handlers}
        />
      </CardFooter>
    </Card>
  );
}
```

### Fichier 3 — `InvoiceActions.tsx` (actions communes, ~200 lignes)

```tsx
// apps/back-office/src/app/(protected)/factures/components/InvoiceActions.tsx
'use client';

import { ResponsiveActionMenu, type ResponsiveAction } from '@verone/ui';
import {
  Archive, ArchiveRestore, Banknote, CheckCircle2, Download, Eye,
  Pencil, Trash2,
} from 'lucide-react';

import type { Invoice } from './types';

interface InvoiceActionsProps {
  invoice: Invoice;
  isDraft?: boolean;
  isArchived?: boolean;
  onView: (id: string) => void;
  onDownloadPdf: (invoice: Invoice) => void;
  onArchive?: (invoice: Invoice) => Promise<void>;
  onUnarchive?: (invoice: Invoice) => Promise<void>;
  onFinalize?: (invoice: Invoice) => Promise<void>;
  onRapprochement?: (invoice: Invoice) => void; // ⚠️ cause du CRITICAL #4
  onDelete?: (invoice: Invoice) => Promise<void>;
  // Breakpoint de bascule (default 'lg' = dropdown sous 1024px)
  breakpoint?: 'md' | 'lg' | 'xl';
}

export function InvoiceActions({
  invoice, isDraft, isArchived,
  onView, onDownloadPdf, onArchive, onUnarchive, onFinalize,
  onRapprochement, onDelete,
  breakpoint = 'lg',
}: InvoiceActionsProps) {
  // Construction des actions selon état
  // ✅ On peut utiliser useMemo ici si besoin — vrai composant React
  const actions: ResponsiveAction[] = [];

  // Action CRITIQUE toujours visible (pas dans le dropdown)
  actions.push({
    label: 'Voir',
    icon: Eye,
    onClick: () => onView(invoice.id),
    alwaysVisible: true,
  });

  if (isDraft) {
    actions.push({
      label: 'Modifier',
      icon: Pencil,
      onClick: () => {
        window.location.href = `/factures/${invoice.id}/edit?type=invoice`;
      },
    });
    if (onFinalize) {
      actions.push({
        label: 'Finaliser',
        icon: CheckCircle2,
        onClick: () => void onFinalize(invoice),
      });
    }
    if (onDelete) {
      actions.push({
        label: 'Supprimer',
        icon: Trash2,
        onClick: () => void onDelete(invoice),
        variant: 'destructive',
        separatorBefore: true,
      });
    }
  } else {
    // Factures finalisées
    actions.push({
      label: 'Telecharger PDF',
      icon: Download,
      onClick: () => onDownloadPdf(invoice),
    });
    if (onRapprochement && invoice.sales_order_id && invoice.status !== 'paid') {
      actions.push({
        label: 'Rapprocher',
        icon: Banknote,
        onClick: () => onRapprochement(invoice),
      });
    }
    if (!isArchived && onArchive) {
      actions.push({
        label: 'Archiver',
        icon: Archive,
        onClick: () => void onArchive(invoice),
      });
    }
    if (isArchived && onUnarchive) {
      actions.push({
        label: 'Desarchiver',
        icon: ArchiveRestore,
        onClick: () => void onUnarchive(invoice),
      });
    }
  }

  return <ResponsiveActionMenu actions={actions} breakpoint={breakpoint} />;
}
```

---

## 3. Checklist avant commit (OBLIGATOIRE, dans l'ordre)

```bash
# 1. Limite 400 lignes par fichier
wc -l apps/back-office/src/app/\(protected\)/factures/components/InvoicesTable.tsx
wc -l apps/back-office/src/app/\(protected\)/factures/components/InvoiceMobileCard.tsx
wc -l apps/back-office/src/app/\(protected\)/factures/components/InvoiceActions.tsx
# Chaque resultat DOIT etre < 400.

# 2. Zero w-auto
grep -rn "w-auto" apps/back-office/src/app/\(protected\)/factures/components/
# DOIT retourner : rien.

# 3. Type-check
pnpm --filter @verone/back-office type-check
# DOIT passer sans erreur.

# 4. Build
pnpm --filter @verone/back-office build
# DOIT passer sans erreur.

# 5. Playwright runtime (LE TEST QUI A MANQUE V1)
# Demarrer le dev server dans un autre terminal (Romeo le fait, pas l'agent)
# Puis lancer :
```

Dans la session Claude Code, pour le test runtime :

```
Utilise playwright-lane-1 MCP pour :

1. browser_navigate http://localhost:3000/factures
2. Attendre 3 secondes
3. browser_console_messages level=error
   → Doit retourner une liste VIDE. Une seule erreur = FAIL.
4. browser_take_screenshot (desktop 1440px)
5. Redimensionner à 375px via browser_resize ou nouvelle page
6. browser_take_screenshot (mobile 375px)
7. browser_console_messages level=error à nouveau
   → Doit toujours retourner VIDE.

Si TOUT passe :
- 2 screenshots sauvegardés dans .playwright-mcp/screenshots/
- Nom format : factures-migration-[desktop|mobile]-20260419.png
- Commit autorisé.

Si UNE erreur console :
- REVERT immédiat (git reset --hard HEAD)
- Rapport dans dev-report-*.md avec stack trace complet
- STOP. Attendre Romeo.
```

---

## 4. Points de vigilance issus des 5 CRITICAL v1

| CRITICAL v1 | Cause probable | Prévention v2 |
|-------------|----------------|---------------|
| #1 InvoicesTable 491L | Tout en un fichier | Décomposition obligatoire en 3 fichiers |
| #2 InventaireTable 431L | Pas dans /factures mais à noter | Même pattern quand on y arrivera |
| #3 Cast `as PurchaseOrderExtended` | Shortcut non typé | Aucun cast unsafe — utiliser les types de `@verone/orders` directement |
| #4 `onRapprochement` absent de `InvoiceMobileCard` | Oubli de prop | Liste exhaustive des props dans section 2 fichier 2 |
| #5 5 boutons sur mobile sans dropdown | `ResponsiveActionMenu` mal utilisé | `alwaysVisible: true` seulement sur 1 action (Voir). Reste en dropdown. |

---

## 5. Si le test runtime FAIL après décomposition

Signe que le bug n'est **pas** dans les hooks du dev-agent mais dans un composant importé (`DocumentSourceBadge`, `DocumentDiscordanceBadge`, `InvoiceStatusBadge`, `OrganisationNameDisplay`).

Dans ce cas :
1. Commenter les imports un par un dans `InvoiceMobileCard`
2. Retester `browser_console_messages` après chaque suppression
3. Isoler le composant qui déclenche — probable qu'il utilise un hook conditionnel interne

**C'est une stratégie de bisection.** Ne pas y aller à l'aveugle.

---

## 6. Prochaine étape pour Claude Code après ce pilote v2

**Si PASS** :
- 1 page migrée et validée runtime → pattern rodé
- Scaler sur 14 pages suivantes Pattern A critique (commandes/fournisseurs, /stocks/*, /finance/*, etc.) en réutilisant exactement le même pattern 3-fichiers
- Commit séparé par groupe de 3-5 pages (pas 15 d'un coup)
- Playwright runtime OBLIGATOIRE à chaque commit

**Si FAIL à nouveau** :
- Reporter à Romeo avec stack trace complet
- Décision : soit corriger le bug identifié, soit reviser `ResponsiveDataView` lui-même
- NE PAS forcer un 3e essai à l'aveugle

---

**Fin du template.** Ce fichier est à lire par dev-agent + reviewer-agent avant et pendant le pilote v2.
