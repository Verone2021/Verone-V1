# Audit Packlink — Problèmes identifiés (2026-04-23)

**Contexte** : Romeo signale que le workflow expédition Packlink est cassé.  
Les changements récents (BO-PACKLINK-RICH-001 → BO-PACKLINK-DRAFT-001 → BO-PACKLINK-FIX-001) ont été faits pour résoudre un problème de `AWAITING_COMPLETION` qui venait en réalité de mauvaises credentials (mauvais compte Packlink), pas du code API.

---

## Résumé en 1 phrase

Le code a été sur-modifié pour résoudre un faux problème (credentials, pas API) et contient maintenant 5 bugs distincts qui rendent le workflow inutilisable.

---

## Bug #1 — URL de redirection Packlink incorrecte (CRITIQUE)

**Fichier** : `packages/@verone/orders/src/components/forms/ShipmentWizard/StepSuccess.tsx:45`

**Code actuel** :

```javascript
window.open(
  `https://pro.packlink.fr/private/shipments/${shipmentResult?.orderReference}/create/address`,
  '_blank'
);
```

**Problème** : L'URL `/create/address` est la **première étape du wizard Packlink** (saisie des adresses). Cela force Romeo à remplir/sauvegarder manuellement les adresses sur Packlink avant d'accéder au paiement — alors que nous avons déjà envoyé toute cette data via l'API.

**URL attendue** : Pour un shipment `READY_TO_PURCHASE`, l'URL correcte est probablement :

- `https://pro.packlink.fr/private/shipments` (liste "Prêts à payer", trouver par référence)
- Ou `https://pro.packlink.fr/private/checkout` si une URL directe paiement existe

**Impact** : Romeo voit un formulaire adresse vide (mal pré-rempli) qui demande de "Save" avant de pouvoir payer.

---

## Bug #2 — Email expéditeur incorrect (CRITIQUE)

**Fichier** : `packages/@verone/common/src/lib/packlink/client.ts:449`

**Code actuel** :

```typescript
export const VERONE_SOURCE_ADDRESS: PacklinkAddress = {
  country: 'FR',
  zip_code: '91300',
  city: 'Massy',
  street1: '4 rue du Perou',
  phone: '+33600000000', // ← PLACEHOLDER — numéro factice
  email: 'contact@veronecollections.fr', // ← FAUX — devrait être romeo@veyroncollections.fr
  name: 'Verone',
  surname: 'Collections',
  company: 'Verone',
};
```

**Problème** :

- `email` → `contact@veronecollections.fr` : email inexistant ou non valide selon Romeo. Doit être `romeo@veyroncollections.fr`.
- `phone` → `+33600000000` : placeholder. Doit être le vrai mobile de l'entrepôt.

**Impact** : Packlink reçoit de mauvaises informations expéditeur → formulaire adresse affiché avec données incorrectes à corriger manuellement.

---

## Bug #3 — Email destinataire pris sur la mauvaise source (MOYEN)

**Fichier** : `packages/@verone/orders/src/components/forms/ShipmentWizard/useShipmentWizard.ts:257`

**Code actuel** :

```typescript
const email = salesOrder.organisations?.email ?? 'client@verone.fr';
```

**Problème** : Utilise l'email générique de l'organisation. La commande a des contacts dédiés :

- `salesOrder.delivery_contact?.email` — contact livraison (priorité 1)
- `salesOrder.responsable_contact?.email` — contact responsable (priorité 2)
- `salesOrder.individual_customers?.email` — si client particulier (priorité 3)
- `salesOrder.organisations?.email` — email organisation (dernier recours)

**Impact** : Packlink reçoit l'email générique de l'organisation au lieu de l'email du contact de livraison.

---

## Bug #4 — Téléphone destinataire manquant (MOYEN)

**Fichier** : `packages/@verone/orders/src/components/forms/ShipmentWizard/useShipmentWizard.ts:258`

**Code actuel** :

```typescript
phone: addr?.phone ?? '+33600000000',
```

**Problème** : `addr` vient de `parseShippingAddress()` qui lit le JSONB `shipping_address`. Si le champ `phone` n'est pas dans le JSONB, on tombe sur le placeholder. La commande a pourtant un `delivery_contact?.phone` ou `responsable_contact?.phone`.

---

## Bug #5 — Wizard n'affiche pas email/téléphone expéditeur et destinataire (UX)

**Fichier** : `packages/@verone/orders/src/components/forms/ShipmentWizard/StepPayment.tsx:77-97`

**Code actuel** : L'étape résumé affiche l'adresse expéditeur et destinataire en dur mais **sans email ni téléphone** — précisément les champs qui posent problème sur Packlink.

**Problème** : Romeo ne peut pas voir ni corriger l'email/téléphone qui sera envoyé à Packlink avant de valider.

**Ce que Romeo veut** : Voir expéditeur + destinataire complets (nom, adresse, email, téléphone) avant de créer l'expédition, avec possibilité de modifier si besoin.

---

## Ce qui FONCTIONNE correctement (à ne pas toucher)

1. **`createShipment()` avec `additional_data`** — le payload enrichi crée bien un shipment `READY_TO_PURCHASE` avec le bon compte. Cette logique est correcte et validée.
2. **Sauvegarde en DB** (`validateShipment`) — fonctionne correctement.
3. **`wantsInsurance` / insurance opt-out** — logique métier correcte, gardée.
4. **Sélection de service, colis, dropoffs** — tout fonctionne.

---

## Fausse piste confirmée

Les changements BO-PACKLINK-RICH-001, BO-PACKLINK-DRAFT-001, BO-PACKLINK-FIX-001 ont tous été déclenchés par un mauvais diagnostic : l'agent pensait que `AWAITING_COMPLETION` était un bug d'API. En réalité, c'était les **mauvaises credentials** (API key d'un autre compte Packlink) qui empêchaient de voir les shipments dans le bon compte PRO.

Avec les bonnes credentials :

- `POST /v1/shipments` avec `additional_data` → `READY_TO_PURCHASE` ✅
- Mais l'URL de redirection reste cassée → Romeo voit `/create/address` ❌

---

## Plan de correction (audit seulement, pas d'implémentation)

| #   | Fichier                        | Action                                                                            | Priorité |
| --- | ------------------------------ | --------------------------------------------------------------------------------- | -------- |
| 1   | `StepSuccess.tsx:45`           | Corriger l'URL Packlink (ne pas ouvrir `/create/address`)                         | CRITIQUE |
| 2   | `client.ts:449`                | Mettre le vrai email (`romeo@veyroncollections.fr`) et le vrai téléphone entrepôt | CRITIQUE |
| 3   | `useShipmentWizard.ts:257-258` | Utiliser `delivery_contact?.email` puis fallbacks                                 | MOYEN    |
| 4   | `useShipmentWizard.ts:258`     | Utiliser `delivery_contact?.phone` puis fallbacks                                 | MOYEN    |
| 5   | `StepPayment.tsx:77-97`        | Afficher email + téléphone dans les blocs expéditeur/destinataire                 | UX       |

**Note sur #1** : Avant de corriger l'URL, il faut confirmer quelle est l'URL correcte pour un shipment READY_TO_PURCHASE sur Packlink PRO. Deux options :

- Option A : `https://pro.packlink.fr/private/shipments` (liste globale, Romeo trouve la référence)
- Option B : Demander à l'API Packlink la vraie URL de paiement via `GET /shipments/{ref}` qui retourne peut-être un champ `payment_url`

---

## Code Review — Tracking & email envoi client (ajout Romeo 2026-04-23)

### Ce qui FONCTIONNE correctement ✅

- **`SendShippingTrackingModal`** est complet et bien câblé :
  - Reçoit `order` de type `SalesOrder` (pas `SalesOrderForShipment`) → a accès à tous les contacts
  - `buildContactList()` dans `shipping-tracking-helpers.ts` exploite dans l'ordre : `delivery_contact` → `responsable_contact` → `billing_contact` → `organisations` → `individual_customers`
  - Déduplication des emails en place
  - Labels de rôle ("Livraison", "Responsable", "Facturation") affichés dans le sélecteur
  - `RecipientSelector` (composant `@verone/finance`) permet de choisir un ou plusieurs destinataires
  - Bouton "Envoyer au client" visible dans `OrderShipmentHistoryCard` uniquement quand `tracking_number` est non-null

- **Webhook `shipment.carrier.success`** :
  - Récupère le shipment Packlink via `client.getShipment(reference)` ✅
  - Stocke `tracking_number` et `tracking_url` en DB ✅
  - Déclenche le trigger `confirm_packlink_shipment_stock` (stock réel décrémenté) ✅

### Points de vigilance ⚠️

**A. `tracking_code` duck-typé dans le webhook** (`webhooks/packlink/route.ts:75`)

```typescript
if ('tracking_code' in details && details.tracking_code) {
  updateFields.tracking_number = details.tracking_code;
}
```

`PacklinkShipmentResult` ne déclare pas `tracking_code` dans son interface TypeScript. Si Packlink renomme le champ (ex: `tracking_number`), ce `'tracking_code' in details` vaut `false` silencieusement → pas de numéro de suivi en DB. À surveiller lors des premiers vrais paiements.

**B. Auto-email webhook (`route.ts:94-163`) utilise la mauvaise source email**
L'email auto-envoyé au paiement (`shipment.carrier.success`) utilise :

```typescript
const customerEmail = indiv?.email ?? org?.email;
```

Il ne consulte ni `delivery_contact`, ni `responsable_contact`. Cohérence à corriger avec le Bug #3.

**C. URL `/create/address` présente aussi dans `OrderShipmentHistoryCard:167`**
Le lien "Finaliser sur Packlink PRO" dans l'historique utilise lui aussi `/create/address` (même bug que `StepSuccess.tsx:45`). Corriger en même temps.

### Verdict global

Le modal d'envoi email tracking est **prêt et correct**. Les contacts de la commande sont bien utilisés. La seule correction nécessaire est d'harmoniser la source email dans le webhook auto (Bug B ci-dessus) avec la logique `buildContactList()` du modal.

---

## Bug #6 — Numéro de commande non cliquable sur la page stock/expéditions (UX)

**Fichier** : `apps/back-office/src/app/(protected)/stocks/expeditions/` (colonnes des tabs)

**Ce que Romeo veut** : sur la page `/stocks/expeditions`, le numéro de commande dans chaque ligne doit être un lien cliquable qui navigue vers la page de détail de la commande, avec retour arrière possible vers la page expéditions.

**Pattern standard** : `<Link href={`/commandes/clients/${order.id}`}>SO-2026-XXXXX</Link>` avec `?from=expeditions` pour le retour, ou simplement utiliser le `router.back()` natif du navigateur.

**Trivial** — concerne les composants :

- `expeditions-order-row.tsx`
- `expeditions-to-ship-mobile-card.tsx`
- `expeditions-packlink-mobile-card.tsx`

---

## Fichiers concernés

```
packages/@verone/common/src/lib/packlink/client.ts               (Bug #2)
packages/@verone/orders/src/components/forms/ShipmentWizard/
  StepSuccess.tsx                                                  (Bug #1)
  StepPayment.tsx                                                  (Bug #5)
  useShipmentWizard.ts                                             (Bug #3, #4)
apps/back-office/src/app/(protected)/stocks/expeditions/
  expeditions-order-row.tsx                                        (Bug #6)
  expeditions-to-ship-mobile-card.tsx                              (Bug #6)
  expeditions-packlink-mobile-card.tsx                             (Bug #6)
```

Pas de migration DB nécessaire. Pas de route API à modifier.
