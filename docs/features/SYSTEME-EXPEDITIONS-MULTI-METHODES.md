# 📦 Système d'Expéditions Multi-Méthodes V\u00e9rone

**Date**: 2025-10-10
**Auteur**: Claude Code 2025
**Statut**: ✅ Implémenté (Build réussi)
**Version**: 1.0.0

---

## 🎯 Vue d'ensemble

Système complet de gestion des expéditions supportant 3 méthodes :

1. **Packlink PRO** - Automatisé via API avec génération d'étiquettes
2. **Chrono Track** - Partenaire externe avec saisie formulaire
3. **Manuel** - Autres transporteurs non intégrés

---

## 📋 Fonctionnalités Implémentées

### ✅ 1. Modal Commande Simplifié (`order-detail-modal.tsx`)

- **Layout horizontal** 2 colonnes (Desktop)
- **Images produits systématiques** avec fallback placeholder
- Section client (nom, type, statut)
- Section paiement (avec bouton "Marquer comme payé")
- Section expédition (avec bouton "Gérer l'expédition")
- Actions contextuelles (PDF commande, facture)

**Code clé** : `src/components/business/order-detail-modal.tsx`

### ✅ 2. Gestionnaire d'Expédition (`shipping-manager-modal.tsx`)

- **Sélecteur 3 méthodes** : Packlink | Chrono Track | Manuel
- **Multi-colis** avec add/remove dynamique
- **Dimensions par colis** : poids (kg), L/l/h (cm)
- **Affectation produits** par colis avec images
- **Coûts séparés** : payé réel vs facturé client
- **UI adaptée** par méthode :
  - Packlink : automatique, label auto
  - Chrono Track : numéro tracking obligatoire
  - Manuel : sélection transporteur + tracking optionnel

**Code clé** : `src/components/business/shipping-manager-modal.tsx`

### ✅ 3. Migration Database Complète (`20251010_001_create_shipments_system.sql`)

#### Tables créées :

```sql
-- ENUM
shipping_method: 'packlink' | 'chrono_track' | 'manual'

-- TABLE shipments (principale)
- Tracking, coûts, dates
- Données Packlink (ID, label URL, réponse API)
- Données Chrono Track (référence, formulaire)
- RLS policies pour authenticated users

-- TABLE shipping_parcels (multi-colis)
- Dimensions et poids par colis
- Numéro séquentiel par expédition

-- TABLE parcel_items (contenu colis)
- Affectation produits → colis
- Quantité expédiée par produit
```

#### RPC Function `process_shipment_stock()` :

```sql
-- Automatique au moment de l'expédition :
1. Créer mouvements stock (type 'sale' = sortie)
2. Mettre à jour quantity_shipped dans sales_order_items
3. Calculer statut commande (shipped vs partially_shipped)
4. Mettre à jour sales_orders (status, shipped_at, shipped_by)
5. Mettre à jour shipments.shipped_at
```

**Code clé** : `supabase/migrations/20251010_001_create_shipments_system.sql`

### ✅ 4. Hook React `use-shipments.ts`

**Fonctions exportées** :

```typescript
createPacklinkShipment(request)
  → Appelle API Packlink
  → Crée shipment + parcels + items
  → Process stock automatique
  → Ouvre label dans nouvelle fenêtre

createChronoTrackShipment(request)
  → Crée shipment manuel
  → Enregistre numéro tracking
  → Process stock automatique

createManualShipment(request)
  → Crée shipment manuel
  → Tracking optionnel
  → Process stock automatique

fetchShipmentsForOrder(salesOrderId)
  → Liste expéditions d'une commande
```

**Code clé** : `src/hooks/use-shipments.ts`

### ✅ 5. API Route Packlink (`/api/packlink/create-shipment`)

**Workflow Packlink** :

1. Authentification utilisateur
2. Récupération commande + adresse client
3. Appel API Packlink `POST /v1/shipments`
4. Récupération label `GET /v1/shipments/:id/labels`
5. Retour données structurées

**Environnement** :

- API Key : `03df0c...` (fournie par utilisateur)
- Endpoint : `https://api.packlink.com/v1`

**Code clé** : `src/app/api/packlink/create-shipment/route.ts`

---

## 🔄 Workflow Complet Utilisateur

### Étape 1 : Création Commande

```
Page Commandes → Bouton "Nouvelle commande" → SalesOrderFormModal
→ Sélection client (organisation/particulier)
→ Ajout produits avec images
→ Validation → Commande créée (status: draft)
```

### Étape 2 : Confirmation & Paiement

```
Liste commandes → Clic "Voir détails" → OrderDetailModal
→ Bouton "Confirmer commande" (draft → confirmed)
→ Bouton "Marquer comme payé" (payment_status: paid)
```

### Étape 3 : Expédition

```
OrderDetailModal → Bouton "Gérer l'expédition" → ShippingManagerModal

Option A - Packlink PRO :
→ Sélection "Packlink PRO"
→ Ajout colis (poids, dimensions)
→ Affectation produits (optionnel)
→ Saisie coûts
→ Clic "Créer expédition Packlink"
→ API crée shipment + génère label
→ Label s'ouvre en nouvelle fenêtre
→ Stock déduit automatiquement
→ Commande passe à "shipped"

Option B - Chrono Track :
→ Sélection "Chrono Track"
→ Ajout colis (poids, dimensions)
→ Saisie numéro tracking OBLIGATOIRE
→ Saisie coûts
→ Clic "Enregistrer expédition Chrono Track"
→ Stock déduit automatiquement
→ Commande passe à "shipped"

Option C - Manuel :
→ Sélection "Saisie manuelle"
→ Ajout colis (poids, dimensions)
→ Sélection transporteur (Colissimo, UPS, DHL...)
→ Tracking optionnel
→ Saisie coûts
→ Clic "Enregistrer expédition manuelle"
→ Stock déduit automatiquement
→ Commande passe à "shipped"
```

---

## 🎨 Design System Respect

### Composants shadcn/ui utilisés :

- `Dialog` → Modals plein écran
- `Card` → Sections regroupées
- `Select` → Sélecteurs transporteurs
- `Input` → Champs numériques (dimensions, coûts)
- `Button` → Actions principales
- `Badge` → Statuts visuels

### Couleurs :

- ✅ Noir (#000000) → Textes principaux
- ✅ Blanc (#FFFFFF) → Backgrounds cards
- ✅ Gris (#666666) → Textes secondaires
- ❌ **Aucun jaune/doré** → Respect strict Vérone

### Layout :

- Desktop : 2 colonnes (`grid-cols-1 lg:grid-cols-2`)
- Mobile : 1 colonne stacked
- Images produits : `w-24 h-24` systématiques

---

## 🔐 Sécurité & RLS

### Policies Supabase :

```sql
-- Lecture : Tous les utilisateurs authentifiés
CREATE POLICY "Authenticated users can read shipments"
  ON shipments FOR SELECT TO authenticated USING (true);

-- Création : Tous les utilisateurs authentifiés
CREATE POLICY "Authenticated users can create shipments"
  ON shipments FOR INSERT TO authenticated WITH CHECK (true);

-- Mise à jour : Tous les utilisateurs authentifiés
CREATE POLICY "Authenticated users can update shipments"
  ON shipments FOR UPDATE TO authenticated USING (true);
```

### Audit Trail :

- `created_by` → User ID au moment de la création
- `shipped_by` → User ID qui a validé l'expédition
- `created_at`, `updated_at` → Timestamps automatiques

---

## 📊 Base de Données

### Relations :

```
sales_orders (1)
  └─→ (N) shipments
        └─→ (N) shipping_parcels
              └─→ (N) parcel_items
                    └─→ (1) sales_order_items
                          └─→ (1) products
```

### Contraintes :

- `shipments.sales_order_id` → `sales_orders.id` ON DELETE CASCADE
- `shipping_parcels.shipment_id` → `shipments.id` ON DELETE CASCADE
- `parcel_items.parcel_id` → `shipping_parcels.id` ON DELETE CASCADE
- `UNIQUE (shipment_id, parcel_number)` → Pas de doublons numéro colis

### Indexes :

```sql
idx_shipments_sales_order   -- Recherche par commande
idx_shipments_method        -- Filtrage par méthode
idx_shipments_tracking      -- Recherche tracking
idx_parcels_shipment        -- Colis d'une expédition
idx_parcel_items_parcel     -- Produits d'un colis
idx_parcel_items_order_item -- Suivi expéditions produit
```

---

## 🚀 Déploiement

### Étapes nécessaires :

1. **Exécuter migration** :

```bash
# Sur Supabase Dashboard ou CLI
psql -h <host> -U postgres -d postgres < supabase/migrations/20251010_001_create_shipments_system.sql
```

2. **Régénérer types TypeScript** :

```bash
# Une fois migration exécutée
npx supabase gen types typescript --project-id <project-id> > src/types/supabase.ts
```

3. **Supprimer `as any` temporaires** :

```typescript
// Dans use-shipments.ts et packlink route.ts
// Remplacer .from('shipments' as any) par .from('shipments')
```

4. **Vérifier API Key Packlink** :

```typescript
// src/app/api/packlink/create-shipment/route.ts
const PACKLINK_API_KEY = process.env.PACKLINK_API_KEY || '03df0c0d...';
```

5. **Configurer warehouse address** :

```typescript
// route.ts ligne ~100
from: {
  name: "Vérone Décoration",
  // TODO: Récupérer depuis organisation settings
}
```

---

## 🧪 Tests Requis

### Tests E2E Playwright :

1. **Test création expédition Packlink** :
   - Créer commande confirmée + payée
   - Ouvrir modal expédition
   - Sélectionner Packlink
   - Ajouter 2 colis
   - Valider → Vérifier label généré

2. **Test création expédition Chrono Track** :
   - Créer commande confirmée + payée
   - Ouvrir modal expédition
   - Sélectionner Chrono Track
   - Saisir tracking
   - Valider → Vérifier stock déduit

3. **Test création expédition manuelle** :
   - Créer commande confirmée + payée
   - Ouvrir modal expédition
   - Sélectionner Manuel
   - Choisir Colissimo
   - Valider → Vérifier commande "shipped"

4. **Test multi-parcels** :
   - Créer expédition 3 colis
   - Affecter produits différents par colis
   - Valider → Vérifier parcel_items créés

5. **Test stock deduction** :
   - Produit avec stock_real = 10
   - Créer expédition 3 unités
   - Vérifier stock_real = 7
   - Vérifier stock_movement créé

---

## 📝 TODO Phase 2

### Fonctionnalités futures :

1. **Suivi expéditions** :
   - Page dédiée liste expéditions
   - Filtres (méthode, statut, date)
   - Webhook Packlink pour updates tracking

2. **Multi-expéditions** :
   - Commande partiellement expédiée
   - Plusieurs shipments pour même commande
   - Tracking différent par shipment

3. **Coûts & Marges** :
   - Dashboard rentabilité expéditions
   - Comparaison Packlink vs Chrono Track vs Manuel
   - Alertes coûts anormaux

4. **Automatisations** :
   - Email auto avec tracking au client
   - SMS notification expédition
   - Mise à jour auto statut "delivered" via webhook

5. **Chrono Track API** :
   - Si API disponible, intégrer comme Packlink
   - Génération étiquettes automatique
   - Tracking temps réel

6. **Exports & Rapports** :
   - Export CSV expéditions mois
   - Rapport coûts transport
   - Analyse transporteurs (délais, incidents)

---

## 🔧 Maintenance

### Logs à surveiller :

```typescript
// Console errors shipping-manager-modal
console.error('Error creating shipment:', error);

// API route errors
console.error('Erreur API Packlink route:', error);

// Hook errors
toast({ title: 'Erreur Packlink', variant: 'destructive' });
```

### Sentry tags :

```typescript
// À ajouter pour monitoring
Sentry.setTag('shipment_method', shippingMethod);
Sentry.setTag('sales_order_id', salesOrderId);
```

### Base de données :

```sql
-- Vérifier intégrité régulièrement
SELECT COUNT(*) FROM shipments WHERE shipped_at IS NULL AND created_at < NOW() - INTERVAL '7 days';

-- Expéditions anormales (coût payé > 200€)
SELECT * FROM shipments WHERE cost_paid_eur > 200;

-- Colis sans produits affectés
SELECT sp.* FROM shipping_parcels sp
LEFT JOIN parcel_items pi ON pi.parcel_id = sp.id
WHERE pi.id IS NULL;
```

---

## ✅ Résumé Statut Implémentation

| Composant        | Fichier                                    | Statut     | Build OK      |
| ---------------- | ------------------------------------------ | ---------- | ------------- |
| Modal Commande   | `order-detail-modal.tsx`                   | ✅ Complet | ✅            |
| Modal Expédition | `shipping-manager-modal.tsx`               | ✅ Complet | ✅            |
| Page Commandes   | `commandes/clients/page.tsx`               | ✅ Modifié | ✅            |
| Hook Expéditions | `use-shipments.ts`                         | ✅ Complet | ✅            |
| API Packlink     | `api/packlink/create-shipment/route.ts`    | ✅ Complet | ✅            |
| Migration DB     | `20251010_001_create_shipments_system.sql` | ✅ Créée   | ⏳ À exécuter |
| Types Supabase   | `use-sales-orders.ts`                      | ✅ Modifié | ✅            |

**Prochaine étape** : Console Error Check via MCP Playwright Browser

---

_Vérone Back Office 2025 - Professional Shipping Management System_
