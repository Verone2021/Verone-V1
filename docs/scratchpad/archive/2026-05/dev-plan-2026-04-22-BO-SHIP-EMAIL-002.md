# Dev plan — BO-SHIP-EMAIL-002 : modale email tracking pattern standard Verone

**Date** : 2026-04-22
**Branche** : `fix/BO-SHIP-EMAIL-002-tracking-email-rich`
**Base** : `fix/BO-SHIP-FEAT-001-email-backorder` (PR #717)
**Effort estimé** : ~3h

---

## Contexte

Romeo veut la même expérience que les modales email déjà existantes :

- `SendDocumentEmailModal` (@verone/finance) — devis/factures
- `SendConsultationEmailModal` (@verone/consultations)
- `SendOrderDocumentsModal` (@verone/orders)

Ma `SendShippingTrackingModal` actuelle (créée dans PR #717) est rudimentaire :

- Un simple textbox email
- Pas de sélecteur contacts
- Fetch cross-origin vers site-internet
- Pas de lien tracking personnalisé avec numéro de commande
- Pas de preview

Cette PR la **refait** sur le pattern standard.

---

## Endpoints email disponibles (pattern à suivre)

Tous utilisent Resend + Zod + `_shared/email-template.buildEmailHtml` :

- `apps/back-office/src/app/api/emails/send-consultation/route.ts`
- `apps/back-office/src/app/api/emails/send-order-documents/route.ts`
- `apps/back-office/src/app/api/emails/send-document/route.ts`
- `apps/back-office/src/app/api/emails/send-invoice/route.ts`

Je crée un nouveau endpoint `send-shipping-tracking` aligné sur ce pattern (au lieu de l'appel cross-origin vers site-internet qui existe aussi mais est moins intégré).

---

## Composants réutilisables

- `RecipientSelector` de `@verone/finance/components` (réutilise, ne duplique pas)
- Type `EmailContact = { id, name, email, role }` de `@verone/finance/components/SendDocumentEmailModal`
- `NewContactModal` de `@verone/organisations` (pour bouton "+ Ajouter contact")

---

## Flux utilisateur cible

1. Utilisateur clique « Envoyer au client » dans `OrderShipmentHistoryCard` (bouton existant PR #717)
2. Modale s'ouvre avec :
   - **Section destinataires** : liste des contacts de la commande (responsable_contact, billing_contact, delivery_contact) avec checkbox + bouton « Ajouter un autre email »
   - **Sujet** pré-rempli : `Votre commande {order_number} est en route !`
   - **Message** (Textarea éditable) pré-rempli avec template incluant :
     - Nom client
     - Numéro commande
     - Transporteur + numéro de suivi
     - Date d'expédition
     - **Lien tracking personnalisé** : `https://veronecollections.fr/tracking?order={order_number}&tracking={tracking_number}` (ou URL du transporteur si `tracking_url` présent)
   - **Preview** : bouton qui ouvre dialog avec le HTML rendu (pattern `PdfPreviewDialog` mais pour HTML simple)
   - Boutons : Envoyer / Annuler
3. Click "Envoyer" → POST vers nouveau endpoint `/api/emails/send-shipping-tracking`
4. Toast succès + close modal

---

## Fichiers (6)

### 1. NOUVEAU — `apps/back-office/src/app/api/emails/send-shipping-tracking/route.ts` (~150 L)

Pattern aligné sur `send-order-documents` :

- Auth check `createServerClient + auth.getUser` → 401 si non auth
- Zod schema : `{ salesOrderId, shipmentId, to: string[], subject, message, sentBy? }`
- Fetch order_info : `sales_orders` (order_number, customer name, tracking, carrier)
- `buildEmailHtml` template avec CTA "Suivre ma commande" → URL tracking
- `resend.emails.send({ from, to, subject, html })`
- Log tentative dans `sales_order_activities` (si table existe) — optionnel
- Return `{ success: true, emailId }` ou `{ error }` 500

### 2. NOUVEAU — `apps/back-office/src/app/api/emails/_shared/shipping-tracking-template.ts` (~80 L)

Helper qui construit le HTML email. Réutilise `buildEmailHtml` de `_shared/email-template.ts` avec :

- Header : logo Vérone
- Titre : "Votre commande est en route 🚚"
- Body :
  - Bonjour {name},
  - Votre commande {order_number} a été expédiée le {shipped_at}.
  - Transporteur : {carrier_name}
  - Numéro de suivi : {tracking_number}
  - Bouton CTA : "Suivre ma commande" → `tracking_url` si fourni, sinon lien générique `veronecollections.fr/tracking?order=X&tracking=Y`
- Footer : coordonnées Vérone

### 3. REFONTE — `packages/@verone/orders/src/components/modals/SendShippingTrackingModal.tsx` (~280 L)

Structure :

- `Dialog` + `DialogContent` avec `h-screen md:h-auto md:max-w-2xl`
- Section RecipientSelector (import depuis @verone/finance/components)
  - `contacts: EmailContact[]` construit depuis `order.responsable_contact`, `billing_contact`, `delivery_contact`
- Input Sujet (auto-rempli mais éditable)
- Textarea Message (auto-rempli, 10 rows, Resize vertical, éditable)
- Bouton "Aperçu" ouvre `EmailPreviewDialog` (nouveau composant local)
- Footer : Annuler (outline, `w-full md:w-auto`) + Envoyer (primary, `w-full md:w-auto`, disabled si 0 destinataire)
- State :
  - `recipients: string[]`
  - `subject: string`
  - `message: string`
  - `sending: boolean`
  - `previewHtml: string | null`
- Handler `handleSend` :
  - `fetch('/api/emails/send-shipping-tracking', { method: 'POST', body: JSON.stringify({salesOrderId, shipmentId, to: recipients, subject, message}) })`
  - Gestion erreur + toast succès / fail

### 4. NOUVEAU — `packages/@verone/orders/src/components/modals/ShippingEmailPreviewDialog.tsx` (~60 L)

Dialog simple qui affiche le HTML du mail dans un `<iframe srcDoc={html}>` pour rendu isolé.

### 5. MODIF — `packages/@verone/orders/src/components/modals/OrderDetailModal.tsx`

Passer `order` complet (avec `order_number`, contacts) à la modale (déjà le cas via `order` prop). Vérifier que `organisations.email`, `individual_customers.email`, `responsable_contact.email`, `billing_contact.email`, `delivery_contact.email` sont présents.

### 6. MODIF — `apps/back-office/src/app/(protected)/canaux-vente/linkme/commandes/[id]/details/components/ShipmentCardsSection.tsx`

Idem : passer `order.responsable_contact`, `billing_contact`, `delivery_contact` à la modale refondue.

---

## Construction de la liste de contacts

Dans `SendShippingTrackingModal`, construire `contacts: EmailContact[]` comme suit :

```ts
const contacts: EmailContact[] = [
  order.responsable_contact && order.responsable_contact.email
    ? {
        id: order.responsable_contact.id,
        name: `${order.responsable_contact.first_name} ${order.responsable_contact.last_name}`,
        email: order.responsable_contact.email,
        role: 'Responsable',
      }
    : null,
  order.delivery_contact && order.delivery_contact.email
    ? {
        id: order.delivery_contact.id,
        name: `${order.delivery_contact.first_name} ${order.delivery_contact.last_name}`,
        email: order.delivery_contact.email,
        role: 'Livraison',
      }
    : null,
  order.billing_contact && order.billing_contact.email
    ? {
        id: order.billing_contact.id,
        name: `${order.billing_contact.first_name} ${order.billing_contact.last_name}`,
        email: order.billing_contact.email,
        role: 'Facturation',
      }
    : null,
  // Fallback email organisation/particulier
  order.organisations?.email
    ? {
        id: `org-${order.organisations.id}`,
        name: order.organisations.trade_name ?? 'Organisation',
        email: order.organisations.email,
        role: 'Organisation',
      }
    : null,
  order.individual_customers?.email
    ? {
        id: `ind-${order.individual_customers.id}`,
        name: `${order.individual_customers.first_name} ${order.individual_customers.last_name}`,
        email: order.individual_customers.email,
        role: 'Particulier',
      }
    : null,
].filter((c): c is EmailContact => c !== null);

// Dédupliquer par email
const uniqueContacts = Array.from(
  new Map(contacts.map(c => [c.email, c])).values()
);
```

---

## Checklist règles Verone

- [x] Pattern réutilisé, aucune duplication
- [x] Endpoint back-office protégé auth (401 si non authentifié)
- [x] Zod validation
- [x] Resend utilisé (pattern existant)
- [x] Responsive `h-screen md:h-auto md:max-w-2xl`, footer `flex-col md:flex-row`, touch 44px
- [x] Fichiers < 400 L (SendShippingTrackingModal à surveiller — éventuellement extraire `buildTrackingEmailBody` dans fichier helper)
- [x] Triggers protégés intacts
- [x] Zéro any
- [x] `void fetch(...).catch(err)` sur handlers async

---

## À NE PAS faire

- Ne pas modifier le webhook
- Ne pas modifier l'endpoint existant `/api/emails/shipping-notification` (site-internet, garder pour webhook auto)
- Ne pas créer de migration DB
- Ne pas retoucher F5 basique qui marche (on la remplace par la version riche, même fichier `SendShippingTrackingModal.tsx`)
