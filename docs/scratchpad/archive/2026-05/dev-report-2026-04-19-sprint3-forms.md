# Dev Report — Sprint 3 Forms Responsive Migration

Date : 2026-04-19
Branche : feat/responsive-forms

---

## Pages MODIFIEES

| Fichier                                                                           | Corrections appliquées                                                                                        |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `apps/back-office/src/app/(protected)/produits/catalogue/nouveau/page.tsx`        | 2 occurrences — `max-w-6xl` supprimé sur conteneur principal (l.82) + wizard inner wrapper (l.191) → `w-full` |
| `apps/back-office/src/app/(protected)/produits/sourcing/produits/create/page.tsx` | 1 occurrence — `max-w-6xl` supprimé sur conteneur principal (l.77) → `w-full`                                 |
| `apps/back-office/src/app/(protected)/parametres/page.tsx`                        | 1 occurrence — `max-w-7xl mx-auto` → `w-full`                                                                 |
| `apps/back-office/src/app/(protected)/factures/[id]/edit/page.tsx`                | 2 occurrences — `container max-w-4xl mx-auto` → `w-full` (states loading/error + main render)                 |

Total : 4 pages modifiées, 6 remplacements.

## Fichier CREE (déblocage type-check)

- `apps/back-office/src/app/(protected)/stocks/expeditions/expeditions-packlink-mobile-card.tsx`

Ce fichier était importé par `expeditions-tab-packlink.tsx` (déjà modifié sur la branche par un sprint précédent) mais n'existait pas — causant une erreur TS2307. Composant créé : `PacklinkMobileCard` (carte mobile pour les expéditions Packlink, technique 1 responsive).

## Pages SKIP

| Fichier                                                   | Raison                                                                                            |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `devis/nouveau/page.tsx`                                  | `max-w-3xl mx-auto` — intentionnel lisibilité, dans la liste des exclusions (`max-w-md/sm/prose`) |
| `factures/nouvelle/page.tsx`                              | `max-w-3xl mx-auto` — idem                                                                        |
| `parametres/emails/[slug]/edit/page.tsx`                  | Pas de `max-w-7xl/6xl/5xl` bloquant — layout en `grid grid-cols-1 lg:grid-cols-3` déjà responsive |
| `parametres/webhooks/[id]/edit/page.tsx`                  | Idem — layout déjà en `grid grid-cols-1 lg:grid-cols-3`                                           |
| `parametres/emails/page.tsx`                              | Pas de max-w bloquant — layout `space-y-6` fluide                                                 |
| `parametres/webhooks/page.tsx`                            | Pas de max-w bloquant — layout `space-y-6` fluide                                                 |
| `canaux-vente/linkme/configuration/page.tsx`              | Pas de max-w bloquant — layout tabs fluide                                                        |
| `canaux-vente/linkme/configuration/integrations/page.tsx` | Pas de max-w bloquant — layout `space-y-6` fluide                                                 |
| `canaux-vente/linkme/configuration/commissions/page.tsx`  | Pas de max-w bloquant — layout `space-y-6` fluide                                                 |
| `factures/devis/[id]/edit/page.tsx`                       | N'EXISTE PAS                                                                                      |
| `canaux-vente/linkme/utilisateurs/nouveau/page.tsx`       | N'EXISTE PAS                                                                                      |

## Résultat type-check

```
pnpm --filter @verone/back-office type-check
→ exit 0 (aucune erreur)
```

## Estimation reste à faire

Les éléments hors scope de ce sprint mais à traiter :

1. **Modals `@verone/finance`** (interdits dans ce sprint) :
   - `QuoteCreateFromOrderModal`, `InvoiceCreateFromOrderModal`, `InvoiceCreateServiceModal`, `QuoteFormModal`, `OrderSelectModal`
   - Responsive interne à vérifier (scroll mobile, DialogContent, footer buttons)

2. **Composants `_components/` des pages de création** :
   - `AddressSection` et `ItemsSection` dans `factures/[id]/edit/` — forms internes à évaluer
   - Composants `ConfigurationSection`, `GlobeItemsSection`, `PagesConfigurationSection` dans linkme/configuration

3. **`max-w-2xl mx-auto`** dans `produits/catalogue/nouveau/page.tsx` (l.96) et `produits/sourcing/produits/create/page.tsx` (l.92) — wrappent les cartes de présentation. Probablement intentionnel (lisibilité), à confirmer.

4. **Pattern `flex gap-X` → `flex flex-col lg:flex-row`** : aucun cas évident trouvé dans les pages de ce sprint (les layouts 2 colonnes utilisent déjà `grid` avec breakpoints).
