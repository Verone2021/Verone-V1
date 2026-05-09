# Dev Report — BO-FIN-023 Sprint 5

**Date** : 2026-04-21
**Task** : Modal de confirmation avant acceptation d'un devis avec commande draft liée

---

## Approche choisie : (a) — client Supabase dans le hook existant

**Justification** : `use-document-detail.ts` charge déjà les données de la commande liée via `createClient()` (Supabase client-side) dans son `useEffect` de résolution organisation. Il suffisait d'étendre ce SELECT pour récupérer aussi `status` de la commande. Cela évite de créer un endpoint API supplémentaire, reste dans le périmètre du hook existant, et n'expose pas le schéma DB au composant page.

L'approche (b) aurait été justifiée si le hook était Server Component ou sans accès Supabase client — ce n'était pas le cas.

---

## Fichiers modifiés

| Fichier                                                                        | Lignes modifiées | Nature                                                                                                                                                                                                           |
| ------------------------------------------------------------------------------ | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/back-office/src/app/(protected)/factures/[id]/types.tsx`                 | +6               | Ajout champs `message` et `validatedOrder` dans `QontoApiResponse`                                                                                                                                               |
| `apps/back-office/src/app/(protected)/factures/[id]/use-document-detail.ts`    | +18              | État `linkedOrderStatus`, état `showAcceptQuoteGuard`, SELECT enrichi, dérivé `linkedDraftOrderNumber`, retour hook étendu                                                                                       |
| `apps/back-office/src/app/(protected)/factures/[id]/use-document-actions.ts`   | +30              | Paramètres `setShowAcceptQuoteGuard` + `linkedDraftOrderNumber`, refactor `handleAcceptQuote` (sync → guard), ajout `handleAcceptQuoteConfirmed` (async → appel API), toast enrichi avec `validatedOrder.number` |
| `apps/back-office/src/app/(protected)/factures/[id]/DocumentDetailDialogs.tsx` | +55              | Nouvelles props interface `AcceptQuoteGuardDialog`, import `ShieldAlert`, dialog guard complet avec description cascade, correction type `handleAcceptQuote: () => void`                                         |
| `apps/back-office/src/app/(protected)/factures/[id]/page.tsx`                  | +5               | Câblage des 4 nouvelles props du guard dans `DocumentDetailDialogs`                                                                                                                                              |

---

## Type-check / Lint

- `pnpm --filter @verone/back-office type-check` : **0 erreur**
- `pnpm --filter @verone/back-office lint` : **0 warning** (correction prettier ligne 63 appliquée)

---

## Commit + Push

- Hash : `0e6d72336`
- Branche : `feat/BO-FIN-023-cascade-order-docs`
- Push : OK

---

## Flux utilisateur en 5 étapes

1. **Utilisateur clique "Marquer accepté"** sur un devis → dialog "Accepter ce devis ?" s'ouvre (comportement inchangé)
2. **Utilisateur clique "Marquer accepté"** dans le dialog → `handleAcceptQuote()` est appelé (maintenant synchrone)
3. **Si `linkedDraftOrderNumber` non null** → le dialog initial se ferme, le dialog guard `AcceptQuoteGuardDialog` s'ouvre avec le message : _"Accepter ce devis validera aussi la commande **CMD-XXX** automatiquement. Les prix seront bloqués et le stock prévisionnel sera mis à jour."_
4. **L'utilisateur choisit** : "Retour" (annule, rien ne se passe) ou "Accepter et valider la commande" → appelle `handleAcceptQuoteConfirmed()` → POST `/api/qonto/quotes/[id]/accept`
5. **Après succès** : si la réponse contient `validatedOrder` → toast `"Devis accepté. Commande CMD-XXX validée automatiquement."` — sinon toast `"Devis accepté"` — puis `window.location.reload()`

**Si aucune commande draft liée** : le flux saute les étapes 3-4 et appelle directement `handleAcceptQuoteConfirmed()` sans interruption UI.
