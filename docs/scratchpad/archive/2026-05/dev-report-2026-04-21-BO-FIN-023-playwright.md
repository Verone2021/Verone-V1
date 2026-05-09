# Dev Report — BO-FIN-023 Validation Playwright + CI Fix

**Date** : 2026-04-21
**Branche** : `feat/BO-FIN-023-cascade-order-docs`
**PR** : #704 DRAFT

---

## Statut global : FAIL CI → FIX APPLIQUÉ → PASS statique

---

## 1. Problème CI détecté (CRITIQUE)

Avant tout test live, la CI était en FAILURE sur "ESLint + Type-Check + Build".

**Erreur** :

```
Type error: Route "src/app/api/sales-orders/[id]/cancel/route.ts" does not match the required types of a Next.js Route.
```

**Cause** : `export class RaceConditionError` dans `route.ts` — Next.js rejette tout export nommé non-HTTP dans un `route.ts`.

**Fix appliqué** :

- `RaceConditionError` déplacée dans `apps/back-office/src/lib/orders/cascade-cancel-linked-docs.ts`
- Import ajouté dans `route.ts`
- `route.ts` ne contient plus que `export async function POST`
- `type-check` local : **0 erreur**
- Commit `46a534e1a` poussé sur la branche

---

## 2. Tests Playwright live

**Serveur** : `https://verone-backoffice.vercel.app` répond HTTP 200.
**Preview branche** : non testable live (CI était rouge au moment du check, déploiement Vercel bloqué sur la preview branche ; staging tourne sur `staging` pas sur la feature branch).

**Décision** : fallback validation statique (conforme au brief).

**Screenshots capturés** : 0 (serveur staging tourne sur `staging`, pas sur la feature branch — les modals nouveaux ne sont pas encore déployés sur le main staging).

---

## 3. Validation statique des 2 modals critiques

### SalesOrderConfirmDialogs.tsx

- Fichier : `packages/@verone/orders/src/components/sales-orders-table/SalesOrderConfirmDialogs.tsx`
- 242 lignes — dans les limites (< 400)
- Pattern `AlertDialog` shadcn pur — 5 dialogs (validate, devalidate, delete, cancel, cancel-guard)
- **Modal garde-fou (sprint 3)** : lignes 195-238. `AlertDialogDescription asChild` + `<div>` + `<ul>` dynamique des docs bloquants. Titre `text-red-600`, bouton CTA `bg-red-600`. Aucune classe de largeur bloquante. `void` + `.catch()` non nécessaire ici (onClick synchrone qui appelle `onCancelGuardConfirmed()`).
- Responsive : PASS — shadcn `AlertDialogContent` gère nativement mobile/desktop. `AlertDialogFooter` flex-col sur mobile, flex-row sur desktop.

| Critère                                    | Résultat                                 |
| ------------------------------------------ | ---------------------------------------- |
| Pas de `w-auto` / `w-screen` / `w-[NNNpx]` | PASS                                     |
| Pas de `max-w-*` artificiel bloquant       | PASS                                     |
| Touch targets (shadcn h-10 + padding)      | PASS                                     |
| Scroll interne modal                       | N/A (dialogs courts, < 300px de contenu) |
| Promesses flottantes                       | PASS (handlers synchrones)               |
| Zod / validation input                     | N/A (pas d'input)                        |

### DocumentDetailDialogs.tsx

- Fichier : `apps/back-office/src/app/(protected)/factures/[id]/DocumentDetailDialogs.tsx`
- 448 lignes — limite dépassée (> 400). À surveiller mais pas bloquant pour cette PR (fichier existant avant sprint).
- **Modal accept quote guard (sprint 5)** : lignes 259-301. Titre `text-blue-600` + `ShieldAlert` icône. Description en 2 paragraphes avec `<strong>` pour le numéro de commande. CTA `bg-blue-600`. `void onAcceptQuoteGuardConfirmed().catch(...)` — correct.
- **Modal finalize invoice guard (sprint 7)** : lignes 303-346. Même pattern. `void onFinalizeInvoiceGuardConfirmed().catch(...)` — correct.
- Responsive : PASS — même pattern shadcn pur.

| Critère                                    | Résultat                                          |
| ------------------------------------------ | ------------------------------------------------- |
| Pas de `w-auto` / `w-screen` / `w-[NNNpx]` | PASS                                              |
| Pas de `max-w-*` artificiel bloquant       | PASS                                              |
| Touch targets                              | PASS                                              |
| Scroll interne modal                       | N/A                                               |
| `void + .catch()` sur promesses async      | PASS (lignes 289-293, 338-342)                    |
| `useCallback` sur handlers passés en prop  | À vérifier côté consommateur (hors scope fichier) |

---

## 4. Erreurs console

Non testables live (pas de déploiement preview actif). 0 erreur visible statiquement.

---

## 5. Tailles responsive testées

Playwright live : **0 screenshot** (fallback statique — serveur preview non disponible).
Validation statique aux 3 tailles critiques : **PASS** (shadcn AlertDialog est responsive par conception).

---

## 6. Actions restantes avant merge

- [ ] Attendre CI verte sur le nouveau commit `46a534e1a`
- [ ] Vérifier que `DocumentDetailDialogs.tsx` (448 lignes) est signalé au reviewer comme dette technique (refactoring hors scope PR courante)
- [ ] Si CI verte → promouvoir PR #704 draft → ready (FEU ORANGE, attendre confirmation Romeo)
