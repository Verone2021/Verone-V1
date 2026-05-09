# dev-report — BO-FIN-023 Sprint 7

**Date** : 2026-04-21
**Tâche** : Parité finalize proforma ↔ accept devis (garde-fous + modal cascade)

---

## Fichiers modifiés

| Fichier                                                                        | Lignes delta | Nature                                                    |
| ------------------------------------------------------------------------------ | ------------ | --------------------------------------------------------- |
| `apps/back-office/src/app/api/qonto/invoices/[id]/finalize/route.ts`           | +57 / -7     | Auth check, guard atomique, validatedOrder                |
| `apps/back-office/src/app/(protected)/factures/[id]/use-document-actions.ts`   | +38 / -10    | handleFinalize sync guard + handleFinalizeConfirmed async |
| `apps/back-office/src/app/(protected)/factures/[id]/use-document-detail.ts`    | +6 / -1      | showFinalizeInvoiceGuard state + câblage                  |
| `apps/back-office/src/app/(protected)/factures/[id]/DocumentDetailDialogs.tsx` | +46 / -3     | FinalizeInvoiceGuardDialog + props type fixes             |
| `apps/back-office/src/app/(protected)/factures/[id]/page.tsx`                  | +3 / -0      | Câblage props nouveaux dialog                             |

---

## Résultats validation

- `pnpm --filter @verone/back-office type-check` : **0 erreur**
- `pnpm --filter @verone/back-office lint` : **0 warning**
- Pre-commit hook : **PASS**

---

## Commit & push

- Hash : `c52c91e93`
- Branche : `feat/BO-FIN-023-cascade-order-docs`
- PR draft #704 — push effectué

---

## Changements détaillés par fichier

### `finalize/route.ts`

1. Import ajouté : `createServerClient` en plus de `createAdminClient`
2. Auth check inséré avant le bloc cascade : `supabaseAuth.auth.getUser()` — si pas d'user, retourne `validatedOrder: null` sans casser la finalisation Qonto
3. UPDATE `sales_orders` : ajout `.eq('status', 'draft')` (guard atomique contre race condition), ajout `confirmed_by: userId`, ajout `.select('id, order_number').maybeSingle()`
4. `validatedOrder` construit depuis `updated` si non-null
5. Réponse finale inclut `validatedOrder`

### `use-document-actions.ts`

- `handleFinalize` devient **synchrone** : si `documentType === 'invoice' && document.status === 'draft' && linkedDraftOrderNumber !== null` → ouvre `FinalizeInvoiceGuard` dialog, sinon appelle `handleFinalizeConfirmed()` directement
- `handleFinalizeConfirmed` : async, ferme le guard, appelle `/finalize`, toast enrichi si `data.validatedOrder` present (`Proforma finalisée. Commande CMD-XXX validée automatiquement.`), sinon toast standard
- `handleFinalizeConfirmed` exporté dans le return (câblable depuis page.tsx)

### `use-document-detail.ts`

- Ajout `showFinalizeInvoiceGuard` / `setShowFinalizeInvoiceGuard` state
- Passé à `useDocumentActions` en param
- Exporté dans le return du hook

### `DocumentDetailDialogs.tsx`

- Props ajoutées : `showFinalizeInvoiceGuard`, `onFinalizeInvoiceGuardChange`, `onFinalizeInvoiceGuardConfirmed`
- Type `handleFinalize` corrigé : `() => void` (n'est plus async)
- `FinalizeInvoiceGuardDialog` inséré entre AcceptQuoteGuard et Decline : titre "Finaliser la proforma", description cascade ordre + prix bloqués, boutons "Retour" / "Finaliser et valider la commande"

### `page.tsx`

- 3 props câblées sur `<DocumentDetailDialogs>` : `showFinalizeInvoiceGuard`, `onFinalizeInvoiceGuardChange={detail.setShowFinalizeInvoiceGuard}`, `onFinalizeInvoiceGuardConfirmed={detail.handleFinalizeConfirmed}`

---

## Flux proforma → finalize en 5 étapes UI

1. **Utilisateur clique "Finaliser"** sur une proforma (invoice draft) → `onShowFinalize()` ouvre le dialog standard "Cette action est irréversible"
2. **Utilisateur confirme** → `handleFinalize()` (sync) est appelé
3. **Détection cascade** : si document = invoice + status = draft + linkedDraftOrderNumber non-null → ferme dialog standard, ouvre `FinalizeInvoiceGuardDialog` : "Finaliser cette proforma validera aussi la commande CMD-XXX automatiquement."
4. **Utilisateur confirme le guard** → `handleFinalizeConfirmed()` appelle `POST /api/qonto/invoices/[id]/finalize` — la route vérifie l'auth, exécute l'UPDATE atomique avec `.eq('status', 'draft')` et retourne `validatedOrder`
5. **Toast enrichi** si `validatedOrder` : "Proforma finalisée. Commande CMD-XXX validée automatiquement." → `window.location.reload()`

---

## Responsive

N/A — modifications purement logiques (route API + hooks + dialog texte). Pas de nouveau composant visuel. Les `AlertDialog` existants sont déjà responsive (pattern sprint 5 identique).
