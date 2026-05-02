# Audit — Flow Packlink, Expédition partielle, Tracking & Email client

**Date** : 2026-04-22
**Contexte** : Packlink tarifie chaque colis individuellement (2 colis identiques coûtent ≠ 2 × 1 colis). Le flow métier Verone doit donc permettre **expéditions partielles successives** (ex. 15 plateaux puis 15 autres) avec récupération tracking et envoi email client entre les deux.

---

## 1. État actuel — ce qui EXISTE déjà

### 1.1 Wizard d'expédition (`ShipmentWizard`)

**6 étapes** : Stock → Mode → Colis → Transport → Relais → Resume.

- **Étape 1 Stock** (`StepStock.tsx`) : l'utilisateur choisit `quantity_to_ship` par item. **L'expédition partielle est déjà supportée** : chaque ligne item a un champ "À expédier" éditable (ex. sur 30 commandés, possible de n'en envoyer que 15).
- **Étape 3 Colis** (`StepPackageInfo.tsx`) : user renseigne dimensions + poids du colis + optionnellement plusieurs colis via "Ajouter un colis". Chaque colis est un item séparé dans le payload Packlink (`packages[]`).
- **Étape 4 Transport** : liste des transporteurs avec prix calculés par Packlink sur les colis déclarés. Affiche prix par service.
- **Étape 6 Résumé / Success** : `StepSuccess.tsx` affiche `trackingNumber`, `labelUrl`, `carrierName`, `orderReference` après création shipment.

**Conclusion** : pour contourner le défaut de tarification Packlink, il suffit d'expédier 15 items dans un 1er shipment avec 1 seul colis, puis de relancer le wizard sur la même SO pour les 15 restants dans un 2e shipment. **Le flow partiel existe techniquement.**

### 1.2 Récupération tracking

- `sales_order_shipments` (DB) a ces colonnes : `tracking_number`, `tracking_url`, `packlink_shipment_id`, `packlink_label_url`, `packlink_status`, `carrier_name`.
- Via **webhook Packlink** (`/api/webhooks/packlink`) : auto-update `tracking_number` + `tracking_url` sur les events `shipment.carrier.success` et `shipment.tracking.update`.
- Webhook vient d'être enregistré côté Packlink ce jour via `POST /v1/shipments/callback` → HTTP 200.
- Via **modal manuel** `EditShipmentModal` : édition inline des champs `carrier_name`, `tracking_number`, `tracking_url`, `shipping_cost`, `notes` sur un shipment existant. Utilisé pour "compléter" si le webhook n'a pas déclenché ou si on a le tracking hors Packlink.

**Conclusion** : la récup tracking est triple-layer (webhook auto + fetch Packlink dans StepSuccess + édition manuelle via modal). Solide.

### 1.3 Envoi email client (existant pour d'autres docs)

Pattern utilisé pour **Devis / Factures / Consultations** :

- Modal avec champs : destinataire email, CC, sujet, message, pièce jointe.
- Sélecteur de contacts de l'organisation.
- Bouton "+ Ajouter contact" ouvrant `NewContactModal` (package `@verone/organisations`).
- Endpoint backend pour effectuer l'envoi.

**Composants partagés réutilisables** :

- `@verone/organisations` : `NewContactModal`, `ContactFormModalWrapper`, `OrganisationContactsManager`, `organisation-contacts-manager.tsx`
- `@verone/customers` : `ContactFormModal`, `OrganisationContactsManager`, `ContactsManagementSection`
- `@verone/utils/validation/api-schemas` : schémas Zod email

### 1.4 Endpoint email tracking (site-internet)

Le webhook Packlink ligne 136 de `/api/webhooks/packlink/route.ts` appelle déjà :

```
POST ${SITE_INTERNET_URL}/api/emails/shipping-notification
body: { email, customerName, orderId, trackingNumber, carrierName }
```

→ **Endpoint d'envoi email tracking existe DÉJÀ** côté site-internet. Auto-appelé par le webhook. Sérialise un template Resend avec numéro de suivi + lien.

### 1.5 Ce qui manque côté UI Back-Office

- **Pas de bouton "Envoyer tracking par email"** visible depuis le détail shipment côté UI back-office.
- **Pas de modal** `SendTrackingEmailModal` qui permette à un admin de déclencher l'email manuellement (utile quand le webhook n'a pas déclenché, quand l'email client dans DB est faux, ou pour ajouter CC comptabilité).
- L'auto-envoi webhook dépend :
  - Que le webhook ait été POST par Packlink (OK maintenant)
  - Que le `sales_orders.customer_id → organisations.email` OU `individual_customer.email` existe en DB
  - Si les 2 sont NULL → aucun email envoyé et aucune UI pour le voir/relancer

---

## 2. DB & contacts organisation

### 2.1 Modèle existant

Tables :

- `organisations` → colonnes `email`, `trade_name`, `legal_name`, etc.
- `organisation_contacts` (probable) → N contacts par orga avec nom + email + rôle
- `sales_orders` → `customer_id` (FK vers organisations OU individual_customer_id)
- `individual_customers` → client B2C avec email direct

### 2.2 Ce qui existe déjà visuellement

Modal d'envoi devis / facture affiche probablement (à confirmer par grep précis) :

- Email par défaut = `organisations.email` ou `individual_customers.email`
- Dropdown "Autres contacts de l'organisation" listant `organisation_contacts[]`
- CTA "+ Ajouter un contact" ouvrant `NewContactModal`
- Champ custom "Autre email" pour override ponctuel

→ **Pattern déjà standardisé** dans le codebase. À répliquer pour le tracking.

---

## 3. Recommandations (priorisées)

### Priorité 1 — Créer `SendTrackingEmailModal` côté back-office

**Nouveau composant** : `packages/@verone/orders/src/components/modals/SendTrackingEmailModal.tsx`

**Props** :

```ts
interface SendTrackingEmailModalProps {
  shipment: {
    id: string;
    tracking_number: string | null;
    tracking_url: string | null;
    carrier_name: string | null;
    sales_order_id: string;
  };
  salesOrder: {
    id: string;
    order_number: string;
    customer_id: string | null;
    individual_customer_id: string | null;
  };
  open: boolean;
  onClose: () => void;
}
```

**Contenu** :

- Pré-remplir email par défaut depuis orga ou individual_customer
- Dropdown contacts organisation (réutiliser `OrganisationContactsManager` ou équivalent)
- Bouton "+ Ajouter contact" → ouvre `NewContactModal` existant
- Champ éditable "Sujet" (pré-rempli : `Votre commande ${order_number} est en cours de livraison`)
- Champ éditable "Message" (pré-rempli avec template similaire aux devis)
- Champs CC / BCC optionnels
- Preview tracking : `carrier_name` + `tracking_number` + lien `tracking_url`
- Bouton "Envoyer email"

**Backend** :

- POST `/api/emails/shipping-notification` existe déjà côté site-internet
- Le back-office peut appeler le même endpoint (ou créer un proxy `/api/emails/shipping-notification` côté back-office qui délègue)

### Priorité 2 — Ajouter bouton "Envoyer tracking" dans le détail shipment

**Emplacement** : dans la section historique shipments de la page commande détail (`OrderShipmentHistoryCard.tsx` ou `ShipmentHistorySection.tsx`).

À chaque ligne shipment avec `tracking_number != null` :

- Bouton outline avec icon Mail "Envoyer tracking" (ou icon Send) qui ouvre `SendTrackingEmailModal`
- À côté des boutons "Voir étiquette PDF" et "Modifier" existants

### Priorité 3 — Bouton "Télécharger étiquette" + "Copier tracking"

Pour faciliter le travail manuel (Romeo qui relance Packlink hors webhook) :

- Bouton "Copier numéro de suivi" → copie `tracking_number` dans presse-papier
- Bouton "Ouvrir page tracking" → ouvre `tracking_url` dans nouvel onglet
- Bouton "Télécharger étiquette PDF" → télécharge `packlink_label_url` ou `label_url`

### Priorité 4 (future) — Log des emails envoyés

- Table `shipment_email_logs` pour tracer qui a reçu quoi et quand
- Utile pour audit et re-envoi facile ("dernier envoi 2 jours, relancer ?")
- **Hors scope immédiat**

---

## 4. Plan d'action proposé

**Phase 1 — Fix immédiat (2-3 h)**

1. Créer `SendTrackingEmailModal` basé sur le pattern devis/facture existant
2. Ajouter bouton "Envoyer tracking" dans `OrderShipmentHistoryCard`
3. Tester avec commande réelle (SO-2026-00158 qui est validée en prod)

**Phase 2 — Polish UX (1 h)** 4. Boutons copier tracking / télécharger label / ouvrir tracking URL 5. Amélioration visuelle du template email

**Phase 3 — Sécurité webhook (optionnel, 30 min)** 6. Ajouter un token dans l'URL callback (`?token=XYZ`) et vérifier côté route 7. Re-enregistrer la callback URL avec le token

---

## 5. Questions ouvertes

1. **Expédition partielle 15/30** : est-ce que tu veux que je teste en prod maintenant sur SO-2026-00158 pour valider le flow (expédier 15, puis relancer pour 15 autres) ? Ou tu le testes toi-même ?

2. **Template email tracking** : veux-tu réutiliser celui du site-internet (`/api/emails/shipping-notification` existant, branding Vérone Collections) ou en créer un custom pour les commandes B2B (Pokawa etc.) ?

3. **Priorités** : commence-t-on par P1 `SendTrackingEmailModal` ou tu veux d'abord un fix UX plus simple (juste les 3 boutons Copier/Ouvrir/Télécharger) ?

4. **Scope MVP** : le modal doit-il gérer **uniquement l'envoi email simple** (destinataire + tracking) ou aussi un **workflow complet** (édition sujet + message + pièces jointes) comme le modal devis ?
