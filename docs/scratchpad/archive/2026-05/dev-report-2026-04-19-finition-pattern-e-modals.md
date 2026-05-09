# dev-report — Pattern E Modals Responsive

Date : 2026-04-18 15:49
Agent : dev-agent
Branche : feat/responsive-finition

---

## Résumé

Audit et corrections responsive (Pattern E) sur les 11 modals du package `@verone/finance`.
Principe appliqué sur chaque modal modifié :

- `DialogContent` : `h-screen md:h-auto max-w-full md:max-w-Xl md:max-h-[90vh] flex flex-col overflow-hidden`
- Wrapper interne scrollable : `<div className="flex-1 overflow-y-auto">`
- `DialogFooter` : `flex-col gap-2 md:flex-row`
- Boutons footer : `w-full md:w-auto`

---

## Modals MODIFIÉS

### 1. `QuoteCreateFromOrderModal/index.tsx`

- Avant : `max-w-2xl max-h-[90vh] overflow-y-auto` (pas mobile-first, pas flex)
- Après : `h-screen md:h-auto max-w-full md:max-w-2xl md:max-h-[90vh] flex flex-col overflow-hidden`
- Ajout wrapper `flex-1 overflow-y-auto` autour du contenu
- Footer : `flex-col gap-2 md:flex-row` + `w-full md:w-auto` sur les boutons

### 2. `InvoiceCreateFromOrderModal/index.tsx`

- Avant : `max-w-4xl max-h-[90vh] overflow-hidden flex flex-col` (flex déjà OK, mais pas h-screen mobile)
- Après : `h-screen md:h-auto max-w-full md:max-w-4xl md:max-h-[90vh] overflow-hidden flex flex-col`

### 3. `InvoiceCreateFromOrderModal/InvoiceFooter.tsx`

- Avant : `flex justify-end gap-2` sur le div boutons
- Après : `flex flex-col gap-2 md:flex-row md:justify-end` + `w-full md:w-auto` sur boutons

### 4. `QuoteFormModal/index.tsx`

- Avant : `max-w-4xl max-h-[90vh] flex flex-col overflow-hidden` (pas h-screen mobile)
- Après : `h-screen md:h-auto max-w-full md:max-w-4xl md:max-h-[90vh] flex flex-col overflow-hidden`
- Footer : ajout `flex-col gap-2 md:flex-row` + `w-full md:w-auto` sur boutons

### 5. `CreditNoteCreateModal.tsx`

- Avant : `max-w-lg` (aucune structure flex, pas h-screen mobile)
- Après : `h-screen md:h-auto max-w-full md:max-w-lg flex flex-col overflow-hidden`
- Contenu : `flex-1 overflow-y-auto`
- Footer : `flex-col gap-2 md:flex-row` + `w-full md:w-auto`

### 6. `InvoiceDetailModal.tsx`

- Avant : `max-w-4xl max-h-[90vh] overflow-y-auto` (pas flex, pas h-screen mobile)
- Après : `h-screen md:h-auto max-w-full md:max-w-4xl md:max-h-[90vh] flex flex-col overflow-hidden`
- Ajout wrapper `flex-1 overflow-y-auto pr-1` autour du contenu
- Footer : `flex-wrap gap-2 md:flex-row`

### 7. `PaymentRecordModal.tsx`

- Avant : `sm:max-w-[500px]` (pas mobile-first, pas flex)
- Après : `h-screen md:h-auto max-w-full md:max-w-[500px] flex flex-col overflow-hidden`
- Ajout wrapper `flex-1 overflow-y-auto`
- Footer : `flex-col gap-2 md:flex-row` + `w-full md:w-auto`

### 8. `RapprochementFromOrderModal.tsx`

- Avant : `max-w-2xl max-h-[85vh] overflow-hidden flex flex-col` (flex OK, pas h-screen mobile)
- Après : `h-screen md:h-auto max-w-full md:max-w-2xl md:max-h-[85vh] overflow-hidden flex flex-col`
- (Pas de footer propre — délègue à `RapprochementContent`)

### 9. `ReconcileTransactionModal.tsx`

- Avant : `sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col` (flex OK, pas h-screen mobile)
- Après : `h-screen md:h-auto max-w-full md:max-w-[600px] md:max-h-[80vh] overflow-hidden flex flex-col`
- Footer : `flex-col gap-2 md:flex-row` + `w-full md:w-auto`

### 10. `SendDocumentEmailModal.tsx`

- Avant : `sm:max-w-[560px]` (pas flex, pas h-screen mobile)
- Après : `h-screen md:h-auto max-w-full md:max-w-[560px] flex flex-col overflow-hidden`
- Contenu : `flex-1 overflow-y-auto`
- Footer : `flex-col gap-2 md:flex-row` + `w-full md:w-auto`

### 11. `QuickClassificationModal.tsx`

- Avant : `max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0` (flex OK, pas h-screen mobile)
- Après : `h-screen md:h-auto max-w-full md:max-w-4xl md:max-h-[90vh] overflow-hidden flex flex-col p-0`
- Footer custom inline (pas DialogFooter) conservé tel quel — déjà responsive avec structure flex existante

---

## Modals SKIP

- `InvoiceCreateServiceModal.tsx` — header `@protected`, JAMAIS modifier sans approbation Romeo

---

## Résultats type-check

```
pnpm --filter @verone/finance type-check     → EXIT 0
pnpm --filter @verone/back-office type-check → EXIT 0
```

---

## Reste à faire

- Tests Playwright aux 5 tailles (375 / 768 / 1024 / 1440 / 1920px) sur chaque modal
- `InvoiceCreateServiceModal.tsx` : responsive à corriger mais protégé — soumettre à Romeo pour approbation
- Vérifier `QuoteFormContent.tsx` (le gros du contenu du QuoteFormModal) pour grilles `grid-cols-2` fixes éventuelles — hors scope direct mais à noter pour audit complémentaire
