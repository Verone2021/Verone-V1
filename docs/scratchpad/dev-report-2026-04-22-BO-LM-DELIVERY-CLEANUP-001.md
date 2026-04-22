# Dev Report — BO-LM-DELIVERY-CLEANUP-001

**Date** : 2026-04-22
**Branche** : fix/BO-LM-DELIVERY-CLEANUP-001

---

## Objectif

Nettoyage de 3 éléments obsolètes dans la page détail commande LinkMe :

1. Section « Post-approbation » dans `DeliveryCard` (affichage step4)
2. Champ `delivery_terms_accepted` dans `EditDeliveryOptionsDialog`
3. Champs `reception_contact_name/email/phone` dans `EditDeliveryOptionsDialog`
4. Badge « Incomplet/Complet » dans le header Livraison basé sur `isStep4Complete`

---

## Fichiers modifiés

### `components/left-column/DeliveryCard.tsx` (357 → 277 lignes, -80)

- Retiré : prop `isStep4Complete` de l'interface et de la destructuration
- Retiré : `{order.status === 'validated' && renderStepBadge(isStep4Complete)}` dans le CardHeader
- Retiré : bloc JSX entier « Post-approbation » (lignes 282-348 originales)
- Retiré : affichage `delivery_terms_accepted` dans la section Options (span « Modalités »)
- Retiré : imports `Check`, `Clock` (orphelins après suppression)
- Retiré : import `renderStepBadge` de `./helpers`
- Conservé : `Calendar`, `AlertTriangle`, `CheckCircle2`, `ExternalLink`, `MapPin`, `Pencil`, `Truck` (toujours utilisés)

### `components/EditDeliveryOptionsDialog.tsx` (202 → 136 lignes, -66)

- Retiré : bloc `delivery_terms_accepted` (Switch + Label)
- Retiré : bloc conditionnel `order.status === 'validated'` contenant `reception_contact_name`, `reception_contact_email`, `reception_contact_phone`
- Conservé : `confirmed_delivery_date` (déplacé hors condition, toujours utile quand staff reçoit confirmation par téléphone)
- Retiré : prop `order: OrderWithDetails` de l'interface et de la destructuration (plus utilisée)
- Retiré : import `Separator` et `type OrderWithDetails` (orphelins)

### `components/EditDialogs.tsx` (115 → 114 lignes, -1)

- Retiré : `order={order}` dans l'instanciation de `<EditDeliveryOptionsDialog>` (prop supprimée)

### `components/LeftColumn.tsx` (150 → 147 lignes, -3)

- Retiré : `isStep4Complete: boolean` de l'interface `LeftColumnProps`
- Retiré : `isStep4Complete` de la destructuration
- Retiré : `isStep4Complete={isStep4Complete}` dans le passage à `<DeliveryCard>`

### `page.tsx` (396 → 394 lignes, -2)

- Retiré : `isStep4Complete` de la destructuration `useOrderDetailsPage()`
- Retiré : `isStep4Complete={isStep4Complete}` dans `<LeftColumn>`

### `hooks.ts` (520 → 515 lignes, -5)

- Retiré : `isStep4Complete: !!order?.linkmeDetails?.step4_completed_at` du return
- Retiré : `delivery_terms_accepted`, `reception_contact_name`, `reception_contact_email`, `reception_contact_phone` de l'initialisation `editForm` pour le step `delivery_options`

### `components/left-column/helpers.tsx` — SUPPRIMÉ

- `renderStepBadge` n'avait plus aucun consommateur dans `details/`
- Confirmé par grep : zéro référence restante dans `details/`
- Note : une version identique existe dans `[id]/components/DeliverySectionParts.tsx` (non touchée — composant legacy séparé hors scope)

---

## Contraintes respectées

- DB : colonnes `step4_*`, `delivery_terms_accepted`, `reception_contact_*` non touchées (historique conservé)
- Triggers : non touchés
- `apps/linkme/` : non touché
- Routes `/api/emails/*` : non touchées
- Flow step4 côté serveur : intact (webhook, token)
- Zéro `any`, zéro `eslint-disable`

---

## Résultats validation

```
pnpm --filter @verone/back-office type-check → PASS (0 erreur)
pnpm --filter @verone/back-office lint       → PASS (0 warning, après fix ligne vide prettier)
```

Tailles de fichiers :

- `DeliveryCard.tsx` : 277 lignes ✅ (< 400)
- `EditDeliveryOptionsDialog.tsx` : 136 lignes ✅ (< 400)
- `hooks.ts` : 515 lignes ⚠️ (> 400, pré-existant avant cette tâche, hors scope)

---

## Note cascade

L'état pré-existant de `hooks.ts` (520 lignes) dépasse la limite de 400 lignes depuis avant cette tâche. Ce refactoring est hors scope de ce ticket mais devrait être planifié comme tâche séparée.
