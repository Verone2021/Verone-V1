# Plan — Rapprochement paiement partiel depuis détail commande

**Date** : 2026-04-21
**Task ID proposé** : `BO-FIN-RAPPROCHEMENT-003`
**Auteur** : Romeo (demande) / agent (plan)
**Branche cible** : `feat/BO-FIN-RAPPROCHEMENT-003-partial-payment-modal` (non créée — à lancer après feu vert)

---

## Contexte métier

Commande `SO-2026-00124` (UUID `b4e87439-df2b-43c2-9b5a-eadd93a87839`) :

- Client : Pokawa Limoges
- Total TTC : **3 639,40 €**
- Déjà rapproché : **3 531,48 €** (1 transaction Qonto « SAS POKE LIMOGES » du 13/03/2026)
- Reste à rapprocher : **107,92 €**
- Statut paiement : `partially_paid`

Romeo veut, depuis la page détail de la commande, pouvoir :

1. **Voir** le montant manquant (107,92 €) dans le bloc Paiement
2. **Cliquer** sur « Associer paiement » (ou un libellé explicite « Rapprocher le reste »)
3. **Ouvrir un modal** qui :
   - Affiche total / déjà payé / reste à rapprocher
   - Liste les transactions liées déjà existantes
   - Propose des suggestions de transactions matchant **le reste** (pas le total)
   - Permet un paiement manuel (espèces, chèque, virement hors Qonto, compensation)

---

## Bugs constatés (diagnostic complet)

### Bug #1 — CRITIQUE : bouton « Associer paiement » redirige vers page morte

**Fichier** : `apps/back-office/src/components/orders/PaymentSection.tsx:446-460`

```tsx
<Link href={`/finance/rapprochement?orderId=${orderId}&amount=${totalTtc}`}>
  <Button>Associer paiement</Button>
</Link>
```

**Cause** : la page cible `/finance/rapprochement/page.tsx:10-16` est obsolète :

```tsx
useEffect(() => {
  router.replace('/finance/transactions');
}, [router]);
```

Elle **jette** `orderId` et `amount` et redirige vers la liste des transactions sans filtre ni modal.

**Preuve visuelle** : `.playwright-mcp/screenshots/20260421/so124-apres-click-associer-paiement.png` → URL finale `/finance/transactions?orderId=...&amount=3639.4`, aucun modal, liste brute de 61 transactions.

### Bug #2 — Aucune notion de « reste à rapprocher » dans l'UI

**Fichier** : `apps/back-office/src/components/orders/PaymentSection.tsx:38-74` (props)

Le composant ne reçoit **jamais** `paid_amount`. Il a seulement `paymentStatus` qui distingue `paid` / `partial` / `partially_paid` / autre, mais ne peut pas afficher la valeur du reste.

Côté appelant (`RightColumn.tsx:415-450`) : `order.paid_amount` existe mais n'est pas passé en prop.

**Preuve visuelle** : `.playwright-mcp/screenshots/20260421/so124-avant-fix-paiement.png` → le bloc affiche uniquement `3531,48 €` pour la transaction liée, aucune mention des 107,92 €.

### Bug #3 — Montant envoyé = total TTC au lieu du reste

`amount=${totalTtc}` envoie `3639.4` au lieu de `107.92`. Même si le modal existait, il chercherait des transactions du plein montant.

### Bug #4 — Une seule transaction liée visible (même si N-N en DB)

**Fichier 1** : `apps/back-office/src/components/orders/PaymentSection.tsx:157-182` — auto-fetch :

```tsx
const { data: links } = await supabase
  .from('transaction_document_links')
  .select('id, allocated_amount, transaction_id')
  .eq('sales_order_id', orderId)
  .limit(1); // ← bloque à 1
```

**Fichier 2** : `packages/@verone/orders/src/hooks/use-sales-orders-fetch.ts:167-174` — enrichissement fetchOrderById :

```tsx
const { data: linkData } = await supabase
  .from('transaction_document_links')
  .select(
    'transaction_id, bank_transactions!inner (id, label, amount, emitted_at, attachment_ids)'
  )
  .eq('sales_order_id', orderId)
  .limit(1) // ← bloque à 1
  .maybeSingle();
```

La table `transaction_document_links` supporte déjà le N-N (table pivot avec `allocated_amount`), le modal `RapprochementFromOrderModal` gère déjà l'affichage de N liens existants (`RapprochementExistingLinks.tsx` avec bouton unlink par ligne). **Seule la page détail commande est plafonnée** par ces deux `.limit(1)`.

### Bug #5 — Scoring compare au total, pas au reste

**Fichier** : `packages/@verone/finance/src/components/RapprochementContent/scoring.ts:31`

```tsx
const orderAmount = Math.abs(order.total_ttc);
```

Pour une commande partiellement payée, les meilleures suggestions devraient matcher `total_ttc - paid_amount` = 107,92 €, pas 3 639,40 €. Sinon on propose des transactions du plein montant (irréalistes).

---

## Corrections proposées

### C1 — Remplacer `<Link>` par un bouton ouvrant `RapprochementFromOrderModal`

**Fichier** : `apps/back-office/src/components/orders/PaymentSection.tsx`

- Ajouter state `showRapprochementModal`
- Remplacer le `<Link href="/finance/rapprochement...">` par `<Button onClick={() => setShowRapprochementModal(true)}>`
- Monter `<RapprochementFromOrderModal order={...} open={...} onOpenChange={...} onSuccess={...} />`
- Label dynamique : si `paidAmount === 0` → « Associer paiement » ; sinon → `Rapprocher le reste (${remainingFormatted})`
- `onSuccess` : `router.refresh()` + refetch `fetchLinkedInvoices()` + refetch auto-match
- **Ne pas supprimer** la route `/finance/rapprochement/page.tsx` (garder la redirection pour anciens bookmarks — out of scope)

### C2 — Ajouter prop `paidAmount` + affichage du reste

**Fichier 1** : `apps/back-office/src/components/orders/PaymentSection.tsx`

- Ajouter `paidAmount: number` (default `0`) à `PaymentSectionProps`
- Calculer `const remainingAmount = Math.max(0, totalTtc - paidAmount)`
- Afficher dans le bandeau rapprochement (après les transactions liées) :

  ```
  Total : 3 639,40 €  •  Payé : 3 531,48 €  •  Reste : 107,92 €
  ```

- Masquer la ligne « Reste » si `paidAmount === 0` ou `remainingAmount === 0`

**Fichier 2** : `apps/back-office/src/app/(protected)/canaux-vente/linkme/commandes/[id]/details/components/RightColumn.tsx:415-450`

- Ajouter `paidAmount={order.paid_amount ?? 0}` aux props du `<PaymentSection>`

### C3 — Lister TOUTES les transactions liées (retirer les .limit(1))

**Fichier 1** : `apps/back-office/src/components/orders/PaymentSection.tsx:157-182`

- Retirer `.limit(1)` → récupérer toutes les lignes
- Remplacer les 4 states singleton (`autoMatched`, `autoMatchLabel`, `autoMatchAmount`, `autoMatchDate`) par un `autoMatches: Array<{ id, label, amount, emitted_at, transaction_id }>`
- Boucler dans le JSX pour afficher **chaque** transaction liée (même pattern que `RapprochementExistingLinks.tsx`)

**Fichier 2** : `packages/@verone/orders/src/hooks/use-sales-orders-fetch.ts:167-204`

- Retirer `.limit(1).maybeSingle()` → `.order('created_at', { ascending: true })`
- Transformer `matchInfo` en `matchInfos: Array<...>`
- Étendre les champs enrichis : `is_matched` reste `boolean` (true si >= 1), mais ajouter `matched_transactions: Array<{...}>` pour l'UI
- **Garder** les champs singleton (`matched_transaction_id`, `matched_transaction_label`, etc.) pour compatibilité descendante (valeurs = première transaction) — évite une cascade de refactors ailleurs
- Impact à vérifier : `SalesOrdersTable`, `OrderReconciliationCard` (ne doivent pas casser)

### C4 — Scoring basé sur le reste à rapprocher

**Fichier 1** : `packages/@verone/finance/src/components/RapprochementContent/types.ts:5-16`

- Pas de changement (la prop `paid_amount` existe déjà)

**Fichier 2** : `packages/@verone/finance/src/components/RapprochementContent/scoring.ts:31-34`

```tsx
// Avant
const orderAmount = Math.abs(order.total_ttc);

// Après
const paidAmount = order.paid_amount ?? 0;
const remainingAmount = Math.abs(order.total_ttc) - paidAmount;
const orderAmount =
  remainingAmount > 0.01 ? remainingAmount : Math.abs(order.total_ttc);
```

**Fichier 3** : `packages/@verone/finance/src/components/RapprochementContent/RapprochementOrderInfo.tsx`

- Ajouter bloc conditionnel si `paid_amount > 0` :
  - « Total : X € »
  - « Déjà rapproché : Y € »
  - « Reste à rapprocher : Z € » (en gras)

### C5 (optionnel — à confirmer) — Onglet « Paiement manuel »

Si l'utilisateur veut enregistrer espèces/chèque/compensation sans passer par Qonto, on peut remonter le `OrderPaymentDialog` de `@verone/orders` qui a déjà les 2 onglets (Rapprochement + Paiement manuel). Mais ça implique de basculer `PaymentSection` d'un `RapprochementFromOrderModal` (1 onglet) vers `OrderPaymentDialog` (2 onglets) — refactor plus large.

**Recommandation** : reporter C5 à un sprint ultérieur. Les 4 premières corrections couvrent déjà le cas principal.

---

## Vérifications effectuées (checklist pré-code)

- [x] Schéma DB : `sales_orders.paid_amount` existe (numeric)
- [x] Schéma DB : `transaction_document_links` supporte N-N (`allocated_amount`, `link_type`, `notes`)
- [x] Composant existant `RapprochementFromOrderModal` utilisable tel quel (déjà utilisé par `SalesOrdersTable`)
- [x] Composant existant `RapprochementContent` déjà headless (réutilisable)
- [x] Type `OrderForLink` contient déjà `paid_amount?: number`
- [x] Flux utilisateur reproduit via Playwright (screenshots avant/après clic)
- [x] Bug #1 confirmé : URL finale `/finance/transactions` sans modal
- [x] Bug #4 confirmé : `.limit(1)` à 2 endroits

---

## Fichiers modifiés (prévision)

| Fichier                                                                                                      | Lignes     | Type  |
| ------------------------------------------------------------------------------------------------------------ | ---------- | ----- |
| `apps/back-office/src/components/orders/PaymentSection.tsx`                                                  | ~+60 / -15 | modif |
| `apps/back-office/src/app/(protected)/canaux-vente/linkme/commandes/[id]/details/components/RightColumn.tsx` | +1         | modif |
| `packages/@verone/orders/src/hooks/use-sales-orders-fetch.ts`                                                | ~+15 / -5  | modif |
| `packages/@verone/finance/src/components/RapprochementContent/scoring.ts`                                    | ~+3 / -1   | modif |
| `packages/@verone/finance/src/components/RapprochementContent/RapprochementOrderInfo.tsx`                    | ~+20       | modif |

**Total estimé** : ~100 lignes modifiées, 5 fichiers. Scope contenu.

---

## Tests à effectuer (post-code)

1. **Type-check** : `pnpm --filter @verone/back-office type-check`
2. **Build** : `pnpm --filter @verone/back-office build`
3. **Lint** : `pnpm --filter @verone/back-office lint`
4. **Non-régression RapprochementContent** : vérifier sur `/factures` que le rapprochement d'une facture fonctionne encore (ne casse pas le cas `paid_amount === undefined`)
5. **Playwright** : sur commande 124 :
   - Bouton affiche « Rapprocher le reste (107,92 €) »
   - Clic → modal s'ouvre (plus de redirection)
   - Modal affiche Total / Payé / Reste
   - Suggestions triées par match sur 107,92 €
   - Screenshot après fix → `.playwright-mcp/screenshots/20260421/so124-apres-fix-paiement.png`
6. **Playwright** : sur une commande NON partielle (non payée) : le flux original doit rester identique

---

## Risques identifiés

1. **Cascade sur `use-sales-orders-fetch.ts`** : ce hook alimente `SalesOrdersTable`, `OrderDetailModal`, potentiellement LinkMe. Garder les champs singleton en plus des nouveaux tableaux pour éviter la casse.
2. **Scoring** : si `paid_amount` est proche du total (ex: reste = 0.01 €), on risque de ne matcher aucune transaction. Garder le fallback vers `total_ttc` si `remainingAmount < 0.01`.
3. **Hooks React** : attention au pattern `useEffect` + `fetch` dans `PaymentSection` — suivre la règle `useCallback` avant d'ajouter aux deps (cf. `.claude/rules/code-standards.md` — incident 16 avril).

---

## Workflow proposé

1. Romeo donne le feu vert
2. Créer branche `feat/BO-FIN-RAPPROCHEMENT-003-partial-payment-modal` depuis `staging`
3. Commits granulaires par correction :
   - `[BO-FIN-RAPPROCHEMENT-003] fix: replace dead link with RapprochementFromOrderModal (C1)`
   - `[BO-FIN-RAPPROCHEMENT-003] feat: display remaining amount in payment block (C2)`
   - `[BO-FIN-RAPPROCHEMENT-003] fix: remove limit(1) on transaction_document_links (C3)`
   - `[BO-FIN-RAPPROCHEMENT-003] feat: score suggestions against remaining amount (C4)`
4. Push après chaque commit (sauvegarde)
5. Tests + screenshots Playwright
6. `reviewer-agent` → audit impartial
7. Si PASS → PR draft → Romeo valide → merge squash vers `staging`

---

## Lien avec audit existant

Cf. `docs/scratchpad/audit-rapprochement-reverse-ux-2026-04-20.md` qui avait proposé un `DocumentReverseRapprochementModal` séparé (~500 lignes, 3-4h). Le présent plan réutilise `RapprochementFromOrderModal` existant (~100 lignes, ~1-2h). Plus pragmatique.
