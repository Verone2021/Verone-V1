# dev-report — Finition Pattern C (pages detail back-office)

**Date** : 2026-04-19
**Branche** : feat/responsive-finition
**Type-check** : EXIT 0

---

## Pages MODIFIEES (4)

| Page                                                                | Changement                                                                                                                        |
| ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `factures/[id]/edit/page.tsx`                                       | `container max-w-4xl mx-auto py-8 px-4` → `w-full py-8 px-4`                                                                      |
| `prises-contact/[id]/page.tsx`                                      | `style={{ maxWidth: '1200px', margin: '0 auto', padding: spacing[6] }}` → `className="w-full p-6"` + suppression import `spacing` |
| `canaux-vente/linkme/stockage/[id]/produit/[allocationId]/page.tsx` | `p-6 max-w-3xl` → `p-6`                                                                                                           |
| `produits/catalogue/[productId]/page.tsx`                           | `max-w-[1800px] mx-auto px-4` → `w-full px-4`                                                                                     |

---

## Pages SKIP (15) — deja conformes

| Page                                                  | Raison                                                 |
| ----------------------------------------------------- | ------------------------------------------------------ |
| `factures/[id]/page.tsx`                              | Conteneur principal `space-y-6`, pas de max-w bloquant |
| `factures/devis/[id]/page.tsx`                        | Conteneur `space-y-6`, pas de max-w bloquant           |
| `finance/depenses/[id]/page.tsx`                      | `flex flex-col gap-6 p-6`, conforme                    |
| `parametres/emails/[slug]/edit/page.tsx`              | `space-y-6` + grid `lg:grid-cols-3`, conforme          |
| `parametres/emails/[slug]/preview/page.tsx`           | `space-y-6` + grid `lg:grid-cols-4`, conforme          |
| `parametres/webhooks/[id]/edit/page.tsx`              | `space-y-6` + grid `lg:grid-cols-3`, conforme          |
| `admin/users/[id]/page.tsx`                           | `space-y-4`, conforme                                  |
| `canaux-vente/linkme/commandes/[id]/page.tsx`         | `space-y-4 p-4`, conforme                              |
| `canaux-vente/linkme/commandes/[id]/details/page.tsx` | `space-y-4 p-4`, conforme                              |
| `canaux-vente/linkme/enseignes/[id]/page.tsx`         | Redirection simple, conforme                           |
| `canaux-vente/linkme/organisations/[id]/page.tsx`     | Redirection simple, conforme                           |
| `canaux-vente/linkme/utilisateurs/[id]/page.tsx`      | `space-y-6`, conforme                                  |
| `canaux-vente/linkme/stockage/[id]/page.tsx`          | `p-6`, conforme                                        |
| `produits/sourcing/produits/[id]/page.tsx`            | `w-full px-4 py-8 space-y-6`, conforme                 |
| `consultations/[consultationId]/page.tsx`             | `w-full px-4 py-4`, conforme                           |

---

## Resultat type-check

```
pnpm --filter @verone/back-office type-check → EXIT 0 (aucune erreur)
```

---

## Responsive

Modifications purement layout (suppression max-w bloquants sur containers principaux).
Aucun composant visuel modifie.
