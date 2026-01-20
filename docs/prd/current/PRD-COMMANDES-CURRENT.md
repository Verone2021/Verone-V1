# PRD Commandes Clients Current — État Actuel Implémenté

> **Version**: Production 2025-10-10
> **Statut**: ✅ OPÉRATIONNEL - EN PRODUCTION
> **Fichier Source**: `src/app/commandes/clients/page.tsx`
> **SLO Performance**: <3s chargement

---

## 🎯 Vue d'Ensemble

### Description Actuelle

Système complet de gestion des commandes clients avec workflow validé (draft → confirmed → shipped → delivered), gestion multi-produits, calcul automatique totaux, intégration expéditions Packlink, et polymorphisme clients (organisations B2B + particuliers B2C).

### Scope Implémenté

- ✅ CRUD commandes clients complètes
- ✅ Workflow statuts : draft, confirmed, partially_shipped, shipped, delivered, cancelled
- ✅ Gestion paiement : pending, partial, paid, refunded, overdue
- ✅ Clients polymorphiques (organisations + particuliers)
- ✅ Items multi-produits avec remises
- ✅ Calcul automatique HT/TVA/TTC
- ✅ Intégration Packlink expéditions
- ✅ Filtres avancés (client, statut, workflow, recherche)
- ✅ Modal détails commande
- ✅ Stats temps réel (CA, commandes confirmées, expédiées, livrées)

---

## 📊 Features Implémentées

### 1. Workflow Commandes (Lifecycle)

```typescript
type SalesOrderStatus =
  | 'draft' // Brouillon (éditable)
  | 'confirmed' // Validée (stock réservé)
  | 'partially_shipped' // Partiellement expédiée
  | 'shipped' // Expédiée complète
  | 'delivered' // Livrée
  | 'cancelled'; // Annulée

type PaymentStatus =
  | 'pending' // En attente paiement
  | 'partial' // Acompte versé
  | 'paid' // Payé intégral
  | 'refunded' // Remboursé
  | 'overdue'; // Retard paiement
```

**Transitions validées** :

- `draft` → `confirmed` (validation + réservation stock)
- `confirmed` → `partially_shipped` → `shipped` (expéditions)
- `shipped` → `delivered` (confirmation livraison)
- Toute étape → `cancelled` (annulation avec libération stock)

### 2. Clients Polymorphiques

- ✅ **Organisations B2B** (`customer_type: 'organization'`)
  - Join `organisations` (entreprises, fournisseurs)
  - Tarifs B2B spécifiques
  - Paiement différé (30/60/90 jours)
- ✅ **Particuliers B2C** (`customer_type: 'individual'`)
  - Join `individual_customers` (clients particuliers)
  - Tarifs B2C publics
  - Paiement immédiat

### 3. Items Commande Multi-Produits

```typescript
interface SalesOrderItem {
  product_id: string;
  quantity: number;
  unit_price_ht: number;
  discount_percentage: number;
  total_ht: number;
  quantity_shipped: number; // Suivi expéditions partielles
  expected_delivery_date?: string;
}
```

**Calcul Automatique** :

```typescript
item_total_ht = unit_price_ht * quantity * (1 - discount_percentage / 100);
order_total_ht = sum(items.total_ht);
order_total_ttc = total_ht * (1 + tax_rate / 100);
```

### 4. Expéditions Packlink

- ✅ Modal expéditions (`ShippingManagerModal`)
- ✅ Création étiquettes transporteurs
- ✅ Suivi tracking
- ✅ Multi-transporteurs (Colissimo, Chronopost, UPS, DPD)
- ✅ Calcul tarifs automatique
- **Table**: `shipments`, `shipment_tracking`

### 5. Filtres Avancés

- ✅ Filtre client (organisations + particuliers)
- ✅ Filtre statut (draft, confirmed, shipped, etc.)
- ✅ Filtre workflow (commandes en cours, expédiées, livrées)
- ✅ Recherche texte (numéro commande, nom client)
- ✅ Reset filtres rapide

### 6. Statistiques Temps Réel

```typescript
stats = {
  total_revenue: number, // CA total période
  confirmed_orders: number, // Commandes validées
  shipped_orders: number, // Expédiées
  delivered_orders: number, // Livrées
  pending_payment: number, // Montant à encaisser
};
```

### 7. Modal Détails Commande

- ✅ Affichage complet commande
- ✅ Liste items avec images produits
- ✅ Informations client (adresses facturation/livraison)
- ✅ Historique statuts (timeline)
- ✅ Actions rapides (confirmer, expédier, annuler)
- ✅ Notes et commentaires

---

## 🎨 Design System Appliqué

### Composants UI

- **Table**: Dense (py-2.5) pour densité CRM
- **Badges Statuts**: Couleurs conditionnelles par statut
- **Modal**: Détails commande responsive
- **Stats Cards**: 5 KPIs commandes

### Icons Lucide

- `ShoppingCart` - Commandes
- `TrendingUp` - CA
- `Package` - Expédiées
- `CheckCircle` - Livrées
- `Clock` - En attente
- `XCircle` - Annulées

### Couleurs Statuts

```typescript
statusColors = {
  draft: 'gray',
  confirmed: 'blue',
  partially_shipped: 'yellow',
  shipped: 'purple',
  delivered: 'green',
  cancelled: 'red',
};

paymentStatusColors = {
  pending: 'yellow',
  partial: 'orange',
  paid: 'green',
  refunded: 'purple',
  overdue: 'red',
};
```

---

## 🔧 Implémentation Technique

### Hook Principal

```typescript
const {
  orders, // SalesOrder[] filtrées
  loading, // boolean
  error, // Error | null
  stats, // Stats temps réel
  customers, // Liste clients (orgs + individuals)
  setFilters, // (filters) => void
  refreshOrders, // () => void
  updateOrderStatus, // (id, status) => Promise
  createShipment, // (orderId, data) => Promise
} = useSalesOrders();
```

### Interface SalesOrder

```typescript
interface SalesOrder {
  id: string;
  order_number: string; // Auto-générée CMD-2025-001
  customer_id: string;
  customer_type: 'organization' | 'individual';
  status: SalesOrderStatus;
  payment_status: PaymentStatus;
  currency: 'EUR';
  tax_rate: number; // 20% default
  total_ht: number;
  total_ttc: number;
  paid_amount: number;

  // Workflow tracking
  created_by: string;
  confirmed_by?: string;
  confirmed_at?: string;
  shipped_by?: string;
  shipped_at?: string;
  delivered_by?: string;
  delivered_at?: string;

  // Relations
  organisations?: Organisation;
  individual_customers?: IndividualCustomer;
  sales_order_items: SalesOrderItem[];
  shipments?: Shipment[];
}
```

### Tables BDD

**Table Principale** : `sales_orders`

```sql
Colonnes clés:
- order_number (unique, auto-incrémenté)
- customer_id (FK polymorphique)
- customer_type (organization | individual)
- status (enum SalesOrderStatus)
- payment_status (enum PaymentStatus)
- total_ht, total_ttc, paid_amount
- shipping_address (jsonb)
- billing_address (jsonb)
- confirmed_at, shipped_at, delivered_at
- created_by, confirmed_by (FK user_profiles)
```

**Table Items** : `sales_order_items`

```sql
Colonnes:
- sales_order_id (FK sales_orders)
- product_id (FK products)
- quantity, quantity_shipped
- unit_price_ht, discount_percentage, total_ht
- expected_delivery_date
```

**Tables Expéditions** :

- `shipments` (tracking expéditions Packlink)
- `shipment_tracking` (événements tracking)

---

## 📋 Business Rules Appliquées

### Validation Création Commande

1. **Client** : Obligatoire (organisation OU particulier)
2. **Items** : Au moins 1 produit, quantité > 0
3. **Prix** : unit_price_ht > 0
4. **Stock** : Vérification disponibilité avant confirmation
5. **Adresses** : Facturation + livraison obligatoires

### Workflow Confirmation

```typescript
// Transition draft → confirmed
1. Valider stock disponible pour tous items
2. Créer mouvements stock (réservation)
3. Mettre à jour confirmed_at, confirmed_by
4. Notification client (email future)
5. Log audit trail
```

### Workflow Expédition

```typescript
// Transition confirmed → shipped
1. Créer shipment Packlink
2. Générer étiquette transporteur
3. Créer mouvements stock (sortie physique)
4. Mettre à jour shipped_at, shipped_by
5. Email client avec tracking
```

### Calcul Totaux

```typescript
// Formules validées
item_total_ht = unit_price_ht * quantity * (1 - discount / 100);
order_total_ht = sum(items.total_ht);
order_total_ttc = total_ht * (1 + tax_rate / 100);
amount_due = total_ttc - paid_amount;
```

**Business Rules File** : `docs/engineering/business-rules/orders-lifecycle-management.md`

---

## 🚧 Limitations Connues & Roadmap

### Limitations Actuelles

- ❌ Pas d'édition commande après confirmation (workflow strict)
- ❌ Pas de gestion acomptes multiples
- ❌ Pas d'export PDF bon de livraison
- ❌ Pas de signature électronique livraison

### Roadmap 2025-Q4

**Priorité 1** (2 semaines) :

- [ ] Export PDF bon de livraison
- [ ] Gestion acomptes multiples
- [ ] Email automatique client (confirmation, expédition)

**Priorité 2** (1 mois) :

- [ ] Signature électronique livraison (tablette)
- [ ] Retours clients (RMA)
- [ ] Factures proforma automatiques

**Priorité 3** (3 mois) :

- [ ] Prévisions livraison ML
- [ ] Optimisation routes transporteurs
- [ ] Analytics commandes avancées

---

## 🔗 Dépendances & Relations

### Modules Liés

- **Catalogue** (`/catalogue`) - Sélection produits
- **Stocks** (`/stocks/mouvements`) - Réservation + sorties stock
- **Finance** (`/finance/rapprochement`) - Paiements + factures
- **Organisations** (`/contacts-organisations`) - Clients B2B
- **Expéditions** (Packlink) - Création étiquettes

### Intégrations Externes

- **Packlink API** : Création expéditions, tarifs, tracking
- **Email** (future) : Notifications clients automatiques
- **SMS** (future) : Alertes livraison

---

## 🧪 Tests & Validation

### Tests Actuels

- ✅ MCP Browser: 0 erreur console ✅
- ✅ Workflow création commande
- ✅ Polymorphisme clients (orgs + individuals)
- ✅ Calcul totaux validé

### Tests Manquants

- ⏳ Tests E2E workflow complet (draft → delivered)
- ⏳ Tests expéditions Packlink
- ⏳ Tests performance (1000+ commandes)

---

## 📚 Documentation Associée

### Fichiers Clés

- **Page** : `src/app/commandes/clients/page.tsx`
- **Hook** : `src/hooks/use-sales-orders.ts`
- **Composants** : `src/components/business/shipping-manager-modal.tsx`
- **Business Rules** : `docs/engineering/business-rules/orders-lifecycle-management.md`

### Sessions

- `2025-10-10-SESSION-ROLLBACK-HOTFIX-COMPLETE.md` - Corrections post-rollback
- `2025-09-20-integration-packlink-v2-complete.md` - Expéditions Packlink

---

**Dernière Mise à Jour** : 2025-10-10
**Maintenu Par** : Équipe Vérone
**Next Review** : 2025-10-24 (export PDF bon de livraison)
