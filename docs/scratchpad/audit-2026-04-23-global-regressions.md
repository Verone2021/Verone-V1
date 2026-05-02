# Audit Global — Régressions identifiées (2026-04-23)

**Contexte** : Romeo signale plusieurs régressions depuis "quelques semaines".  
Audit post-mortem des commits April 2026 pour identifier causes et responsables.

---

## Résumé exécutif

**3 régressions confirmées, 1 fausse piste.**

| #   | Regression                                  | Sévérité     | Commit source                  | Fichier(s)                                               |
| --- | ------------------------------------------- | ------------ | ------------------------------ | -------------------------------------------------------- |
| R1  | URL Packlink `/create/address`              | CRITIQUE     | BO-PACKLINK-RICH-001 (PR #731) | `StepSuccess.tsx:45`, `OrderShipmentHistoryCard.tsx:167` |
| R2  | SIRET/maison mère silencieusement désactivé | HAUT         | BO-PROD-001 + BO-FIN-031-044   | `use-order-select.ts:188`                                |
| R3  | Email/téléphone expéditeur incorrects       | MOYEN        | BO-PACKLINK-RICH-001           | `client.ts:449` (`VERONE_SOURCE_ADDRESS`)                |
| —   | "Webbook" dans page détail commande         | FAUSSE PISTE | Non applicable                 | Voir §4                                                  |

---

## Régression R1 — URL Packlink `/create/address` (CRITIQUE)

### Symptôme

Après création d'une expédition Packlink, le bouton d'ouverture redirige vers `/create/address` — la toute première étape du wizard d'adresses Packlink, pas la page de paiement.

### Fichiers impactés

- `packages/@verone/orders/src/components/forms/ShipmentWizard/StepSuccess.tsx:45`
- `packages/@verone/orders/src/components/modals/order-detail/OrderShipmentHistoryCard.tsx:167`

### Code actuel (erroné)

```javascript
window.open(
  `https://pro.packlink.fr/private/shipments/${shipmentResult?.orderReference}/create/address`,
  '_blank'
);
```

### Commit responsable

`de387cd82` — `[BO-PACKLINK-RICH-001] fix: enrich /v1/shipments payload` (PR #731, 2026-04-22)

### Cause

L'agent a copié une URL de wizard Packlink observable dans le navigateur lors des tests de debug. Cette URL correspond à l'édition d'un shipment existant (étape 1 : adresses), pas à la page de paiement.

### URL correcte

Pour un shipment `READY_TO_PURCHASE`, la seule URL fiable est la liste globale :
`https://pro.packlink.fr/private/shipments` → Romeo retrouve la commande par sa référence dans la colonne "Prêts pour le paiement"

Il n'existe pas d'URL directe `https://pro.packlink.fr/private/shipments/{ref}/checkout` documentée dans l'API publique Packlink.

---

## Régression R2 — SIRET/maison mère silencieusement désactivé (HAUT)

### Symptôme

Quand une organisation cliente n'a pas de SIRET, la création d'un devis devrait automatiquement détecter la maison mère (organisation avec `is_enseigne_parent=true` dans la même enseigne) et basculer dessus. Ce comportement ne fonctionne plus.

### Fichier impacté

`packages/@verone/finance/src/components/order-select/use-order-select.ts:188`

### Cause racine

Le hook `useParentOrgForBilling` reçoit `order?.organisations?.enseigne_id` comme paramètre. Si ce champ est `undefined`, le hook retourne `null` immédiatement (`if (!enseigneId) return null`).

Le problème : **`enseigne_id` n'est PAS dans le SELECT de la requête organisations** :

```typescript
// use-order-select.ts:186-189 — MANQUE enseigne_id
const { data: org } = await supabase.from('organisations').select(
  'legal_name, trade_name, email, address_line1, city, postal_code, country, billing_address_line1, billing_city, billing_postal_code, billing_country, shipping_address_line1, shipping_city, shipping_postal_code, shipping_country, has_different_shipping_address, siret, vat_number'
  // ↑ enseigne_id absent — le champ est dans le type TypeScript mais jamais récupéré en base
);
```

L'interface `IOrderForDocument` déclare bien `organisations.enseigne_id?: string | null` (types.ts:45) mais la query ne le fetch jamais. Résultat : `enseigne_id` est toujours `undefined` au runtime.

### Comment c'est arrivé — 2 commits responsables

**Étape 1 — `7a80d8e45` `[BO-PROD-001]`** (14 avril 2026) :  
Refactoring `OrderSelectModal` 599→169 lignes. La logique a été extraite dans `use-order-select.ts`. La query organisations a été reconstituée à la main — `enseigne_id` a été omis.

**Étape 2 — `8d4de2b06` `[BO-FIN-031-044]`** (19 avril 2026) :  
Ajout de `useParentOrgForBilling` et détection automatique maison mère. La feature a été implémentée dans `QuoteCreateFromOrderModal/index.tsx:108` en appelant `useParentOrgForBilling(order?.organisations?.enseigne_id ?? null, ...)`. Le développeur a correctement ajouté `enseigne_id` dans le type TypeScript (`types.ts:45`) mais n'a pas mis à jour la query dans `use-order-select.ts`.

### Fix (1 ligne)

Dans `use-order-select.ts:188`, ajouter `enseigne_id` à la fin de la chaîne SELECT :

```
'legal_name, trade_name, email, ..., siret, vat_number, enseigne_id'
```

---

## Régression R3 — Coordonnées expéditeur incorrectes (MOYEN)

### Symptôme

L'email expéditeur envoyé à Packlink est `contact@veronecollections.fr` (inexistant/incorrect) et le téléphone est `+33600000000` (placeholder).

### Fichier impacté

`packages/@verone/common/src/lib/packlink/client.ts:449`

### Code actuel (erroné)

```typescript
export const VERONE_SOURCE_ADDRESS: PacklinkAddress = {
  phone: '+33600000000',          // ← PLACEHOLDER
  email: 'contact@veronecollections.fr',  // ← INCORRECT — doit être romeo@veyroncollections.fr
  ...
};
```

### Commit responsable

`de387cd82` — `[BO-PACKLINK-RICH-001]` (PR #731, 2026-04-22)

### Cause

Données expéditeur hardcodées avec des placeholders lors de la première implémentation. Le email correct est `romeo@veyroncollections.fr`. Le vrai numéro d'entrepôt est à confirmer avec Romeo.

---

## Fausse piste — "Webbook" dans page détail commande

### Ce que Romeo décrit

"Dans les commandes brouillon/validées, nous pouvons envoyer des web books pour demander des informations manquantes. Il y a une régression."

### Verdict : PAS de régression

**Il existe deux "demander compléments" différents dans le code :**

1. **Page d'approbation** `/canaux-vente/linkme/commandes/[id]/` → `StatusActionsCard.tsx:66` :  
   Bouton "Demander compléments" visible uniquement pour `status === 'draft'`. Toujours fonctionnel. Appelle `useRequestInfo()` → endpoint API `/api/linkme/request-info` (ou équivalent). **Non régressé.**

2. **Page de détail** `/canaux-vente/linkme/commandes/[id]/details/` → `RequestMissingFieldModal.tsx` :  
   Ajouté dans `BO-LM-CONTACTS-UNIFIED-001` (PR #719, session 2026-04-22). C'est une **NOUVELLE fonctionnalité**, pas une régression d'une ancienne. Elle est déclenchée depuis la section Contacts (`ContactsUnified → onOpenRequestModal`) pour un rôle de contact spécifique.

**Si Romeo ne voit pas le bouton dans la page de détail** : c'est parce que le bouton n'est pas un bouton principal dans la barre d'actions — il est accessible via chaque carte de contact (bouton "Demander" sur chaque rôle manquant dans `ContactsUnified`). C'est un changement de UX intentionnel, pas une régression technique.

**Si Romeo cherche le bouton dans les commandes B2C** (`/commandes/clients/[id]`) : ce bouton n'a jamais existé là. Il est uniquement dans la page d'approbation LinkMe.

---

## Autres commits à risque analysés

### `d1d1aaca6` (session 2026-04-22, 74 fichiers, 5657 insertions)

Merge de 9 PRs en une session. Risque élevé de régressions silencieuses car :

- Bypass CI (`--admin`)
- Modifications profondes de `useShipmentWizard.ts` (259 lignes refactorées)
- `sales-order-fsm.ts` modifié (machine d'état des statuts commande)
- `order-status.ts` modifié (validators)

**Fichiers à surveiller de près :**

- `packages/@verone/orders/src/hooks/utils/sales-order-fsm.ts` — transitions de statut
- `packages/@verone/orders/src/validators/order-status.ts` — validators statut
- `apps/back-office/src/app/(protected)/stocks/expeditions/use-expeditions.ts` — requête expéditions

### `8d4de2b06` (BO-FIN-031-044, 19 avril, 69 fichiers)

Maison mère billing + devis UX. Seule régression identifiée : R2 ci-dessus.

### `5c84c2ae2` (BO-MAXLINES-038, mars 2026)

Split `OrderDetailModal` (1156 lignes → sous-composants). Pas de régressions identifiées dans cet audit — le découpage est structurel, pas fonctionnel.

---

## Régressions non demandées mais découvertes

### Bug B (webhook) — `tracking_code` duck-typé

**Fichier** : `apps/back-office/src/app/api/webhooks/packlink/route.ts:75`

```typescript
if ('tracking_code' in details && details.tracking_code) {
  updateFields.tracking_number = details.tracking_code;
}
```

`tracking_code` n'est pas dans l'interface TypeScript `PacklinkShipmentResult`. Si Packlink renomme le champ, le numéro de suivi n'est jamais stocké en DB — silencieusement. **À surveiller lors des premiers vrais paiements.**

### Bug A (webhook) — Email auto envoyé au mauvais contact

**Fichier** : `apps/back-office/src/app/api/webhooks/packlink/route.ts:94-163`

```typescript
const customerEmail = indiv?.email ?? org?.email;
```

N'utilise ni `delivery_contact` ni `responsable_contact`. Incohérent avec `buildContactList()` du modal d'envoi manuel.

### Bug #3 & #4 (wizard) — Email/téléphone destinataire

**Fichier** : `packages/@verone/orders/src/components/forms/ShipmentWizard/useShipmentWizard.ts:257-258`

```typescript
const email = salesOrder.organisations?.email ?? 'client@verone.fr';
phone: addr?.phone ?? '+33600000000',
```

Priorité incorrecte : `delivery_contact?.email` doit primer sur `organisations.email`.

---

## Plan de correction recommandé

### Sprint 1 — CRITIQUE (avant prochaine expédition)

1. `StepSuccess.tsx:45` + `OrderShipmentHistoryCard.tsx:167` → changer URL vers `https://pro.packlink.fr/private/shipments`
2. `client.ts:449` → `email: 'romeo@veyroncollections.fr'`, `phone`: confirmer avec Romeo

### Sprint 2 — HAUT (avant prochaine création de devis maison mère)

3. `use-order-select.ts:188` → ajouter `enseigne_id` au SELECT organisations (1 ligne)

### Sprint 3 — MOYEN (avant premier paiement Packlink en production)

4. `useShipmentWizard.ts:257-258` → priorité email/téléphone destinataire
5. `route.ts:75` (webhook) → ajouter `tracking_code` au type `PacklinkShipmentResult`
6. `route.ts:94-163` (webhook) → utiliser `delivery_contact?.email` en priorité

### Sprint 4 — UX

7. `StepPayment.tsx:77-97` → afficher email + téléphone dans récapitulatif
8. `expeditions-order-row.tsx` + 2 autres → numéro commande cliquable

---

## Fichiers concernés

```
packages/@verone/orders/src/components/forms/ShipmentWizard/
  StepSuccess.tsx:45                          (R1)
  StepPayment.tsx:77-97                       (UX #5)
  useShipmentWizard.ts:257-258                (#3, #4)
packages/@verone/common/src/lib/packlink/client.ts:449          (R3)
packages/@verone/finance/src/components/order-select/
  use-order-select.ts:188                     (R2 — FIX 1 LIGNE)
packages/@verone/orders/src/components/modals/order-detail/
  OrderShipmentHistoryCard.tsx:167            (R1 bis)
apps/back-office/src/app/api/webhooks/packlink/route.ts:75,94   (Bugs A, B)
apps/back-office/src/app/(protected)/stocks/expeditions/
  expeditions-order-row.tsx                   (#6)
  expeditions-to-ship-mobile-card.tsx         (#6)
  expeditions-packlink-mobile-card.tsx        (#6)
```

**Pas de migration DB. Pas de route API à créer.**
