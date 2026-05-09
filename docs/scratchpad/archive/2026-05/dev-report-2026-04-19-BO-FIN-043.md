# Dev Report — BO-FIN-043

**Date** : 2026-04-19
**Branche** : feat/BO-FIN-031-org-picker-modal
**Statut** : READY_FOR_REVIEW

---

## Mission

Enrichir `QuoteCreateFromOrderModal` et le backend `/api/qonto/quotes` pour exposer 3 fonctionnalités Qonto absentes du formulaire :

1. Date d'émission éditable (`issueDate`)
2. Commentaire par ligne article (`item.description`)
3. Commentaire libre pied de page (`footer`)

---

## Fichiers modifiés

### Backend

**`apps/back-office/src/app/api/qonto/quotes/route.schemas.ts`**

- Ajout de 3 champs dans `PostRequestBodySchema` :
  - `issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()`
  - `footerNote: z.string().max(1000).optional()`
  - `itemComments: z.record(z.string(), z.string().max(500)).optional()`

**`apps/back-office/src/app/api/qonto/quotes/route.helpers.ts`**

- Signature de `buildQuoteItems` enrichie : paramètre `itemComments?: Record<string, string>` ajouté en 5e position
- Logique `description` des items : `itemComments?.[item.id] ?? item.notes ?? undefined`

**`apps/back-office/src/app/api/qonto/quotes/route.post.ts`**

- `computeQuoteDates` conservé, mais `issueDate`/`expiryDate` recalculés si `body.issueDate` fourni (expiryDate décalé de N jours depuis la date custom via `expiryDaysCount * 86400000`)
- Adresse de livraison mappée sur `header` Qonto (champ dédié, lisible en haut du devis) — note : le fichier avait déjà été refactoré sur la branche courante pour séparer `header`/`footer`
- `body.footerNote` mappé sur `footer` (commentaire libre pied de page)
- `buildQuoteItems` appelé avec `body.itemComments` en 5e arg

### Frontend (`packages/@verone/finance`)

**`src/components/QuoteCreateFromOrderModal/QuoteItemsTable.tsx`** (refactored)

- Nouvelles props : `itemComments: Record<string, string>`, `onItemCommentsChange: (c: Record<string, string>) => void`
- State local `expandedItems: Set<string>` pour déplier/replier le champ commentaire par ligne
- Bouton "Ajouter un commentaire" / "Modifier le commentaire" sous chaque ligne
- `<Textarea>` contrôlé par `itemComments[item.id]` avec compteur de caractères (max 500)
- Colonnes Prix HT / TVA masquées sur mobile (`hidden md:table-cell`)

**`src/components/QuoteCreateFromOrderModal/use-quote-create-from-order.ts`**

- `IUseQuoteCreateFromOrderParams` enrichi : `issueDate`, `footerNote`, `itemComments`
- Destructuring dans le hook mis à jour
- `requestBody` (branches `isConsultation` et non) inclut les 3 nouveaux champs
- Deps `useCallback` mis à jour (pas de fonction instable ajoutée — scalaires et Record)

**`src/components/QuoteCreateFromOrderModal/index.tsx`**

- Import `Textarea` depuis `@verone/ui`
- 3 nouveaux states : `issueDate` (initialisé à `new Date().toISOString().slice(0,10)`), `footerNote`, `itemComments`
- `resetFormState` réinitialise les 3 états
- `useQuoteCreateFromOrder` reçoit les 3 nouveaux params
- `QuoteItemsTable` reçoit `itemComments` + `onItemCommentsChange`
- Section UI "Date d'émission" (input `type="date"`, `w-44`) entre totaux et validité
- Section UI "Commentaire pied de page" (Textarea 3 lignes, max 1000, placeholder) avant `QuoteTotalsSection`

---

## Validations

| Check                                          | Résultat         |
| ---------------------------------------------- | ---------------- |
| `pnpm --filter @verone/finance type-check`     | PASS (0 erreur)  |
| `pnpm --filter @verone/back-office type-check` | PASS (0 erreur)  |
| `pnpm --filter @verone/finance lint`           | PASS (0 warning) |
| `pnpm --filter @verone/back-office lint`       | PASS (0 warning) |

---

## Invariants respectés

- Aucun champ Qonto inventé — uniquement `issueDate`, `footer`, `item.description` de `types.ts:678-697`
- Route `/api/qonto/invoices/*` non touchée
- `use-parent-org-for-billing.ts` non touché
- Zero `any` TypeScript
- Fonctions `useCallback` sans fonction instable en deps
- Mobile-first : colonnes secondaires masquées sur `< md`, Textarea responsive

---

## Verdict

**READY_FOR_REVIEW**
