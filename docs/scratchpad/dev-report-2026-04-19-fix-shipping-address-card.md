# dev-report — Fix affichage adresse livraison OrganisationCard

**Date** : 2026-04-19
**Branche** : feat/BO-FIN-031-org-picker-modal
**Tâche** : Fix bloc "Livraison" affichant "Même adresse que la facturation" à tort

---

## Fichier fixé

`apps/back-office/src/app/(protected)/canaux-vente/linkme/commandes/[id]/details/components/left-column/OrganisationCard.tsx`

Lignes modifiées : 250-307 (bloc "Adresse de livraison")

---

## Root cause

La condition d'affichage reposait uniquement sur le flag booléen `organisation.has_different_shipping_address`. Ce flag est stocké sur la table `organisations` et doit être mis à jour manuellement. En pratique, des organisations avaient `has_different_shipping_address = false` (ou `null`) alors que leurs champs `shipping_address_line1`, `shipping_postal_code`, `shipping_city` étaient renseignés avec une adresse réellement différente de l'adresse de facturation. Le flag et les données réelles étaient désynchronisés.

---

## Diff avant/après de la comparaison

**Avant** (condition unique sur le flag) :

```tsx
{order.organisation.has_different_shipping_address ? (
  // affiche adresse livraison
) : (
  <span>Livraison : même que facturation</span>  // affiché même si adresses différentes
)}
```

**Après** (logique réelle sur les champs) :

```tsx
{(() => {
  const shippingOrg = order.organisation;
  const norm = (v: string | null | undefined) => (v ?? '').trim().toLowerCase();
  const billingRef = norm(shippingOrg.billing_address_line1 ?? shippingOrg.address_line1);
  const shippingLine1 = norm(shippingOrg.shipping_address_line1);
  // true si flag actif OU si shipping_address_line1 existe et diffère de la référence facturation
  const hasDifferentShipping =
    shippingOrg.has_different_shipping_address === true ||
    (shippingLine1.length > 0 && shippingLine1 !== billingRef);
  return (
    <div ...>
      {hasDifferentShipping ? (
        // affiche adresse livraison
      ) : (
        <span>Livraison : même que facturation</span>
      )}
    </div>
  );
})()}
```

---

## Explication root cause (2 phrases)

Le flag `has_different_shipping_address` sur la table `organisations` peut être désynchronisé des champs `shipping_address_line1/postal_code/city` : un utilisateur peut renseigner une adresse de livraison sans que le flag soit mis à jour. La comparaison textuelle normalisée des champs réels (`shipping_address_line1` vs `billing_address_line1` ou `address_line1`) garantit que les adresses distinctes sont détectées indépendamment de l'état du flag.

---

## Preuves validation

- `pnpm --filter @verone/back-office type-check` : **PASS** (exit code 0, aucune erreur TS)
- `npx eslint [fichier] --max-warnings=0` : **PASS** (exit code 0, aucune erreur ESLint)

---

## Test manuel Playwright

Non effectué : l'application n'est pas démarrée en local (règle JAMAIS `pnpm dev`). Le fix est purement logique et vérifiable par inspection du code — la condition `hasDifferentShipping` couvre les deux cas : flag vrai ET données réelles différentes.

---

## Verdict

**READY_FOR_REVIEW**
