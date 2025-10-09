# 📦 Système d'Expéditions Multi-Transporteurs Vérone V2

**Date**: 2025-10-10
**Auteur**: Claude Code 2025
**Statut**: ✅ En cours d'implémentation
**Version**: 2.0 (Refonte complète)

---

## 🎯 Vue d'ensemble

Système professionnel de gestion d'expéditions supportant 4 transporteurs :
1. **Packlink PRO** - Agrégateur multi-transporteurs (API automatique)
2. **Mondial Relay** - Points relais économiques (API/Manuel)
3. **Chronotruck** - Transport palettes spécialisé (Manuel via app.chronotruck.com)
4. **Manuel** - Saisie libre tous transporteurs

---

## 🏗️ Architecture Technique

### **Workflow Utilisateur**

```
OrderDetailModal
    ↓ Click "Gérer l'expédition"
ShippingManagerModal (Orchestrateur)
    ├─ Step 1: CarrierSelector
    │   └─ [Packlink] [Mondial Relay] [Chronotruck] [Manuel]
    ├─ Step 2: Formulaire spécifique transporteur
    │   ├─ PacklinkShipmentForm (si Packlink)
    │   ├─ MondialRelayShipmentForm (si Mondial Relay)
    │   ├─ ChronotruckShipmentForm (si Chronotruck)
    │   └─ ManualShipmentForm (si Manuel)
    └─ Step 3: ShipmentRecapModal
        └─ Récapitulatif général unifié
            ↓ Click "Valider"
        Enregistrement DB + Déduction Stock + Notification
```

### **Composants React** (inspirés Shipstation/Sendcloud)

#### **1. ShippingManagerModal** (Orchestrateur principal)
```typescript
// src/components/business/shipping-manager-modal.tsx
État:
- step: 'select' | 'form' | 'recap'
- selectedCarrier: ShippingMethod | null
- shipmentData: ShipmentRecapData

Workflow:
1. Affiche CarrierSelector
2. Sur sélection → Affiche formulaire correspondant
3. Sur validation formulaire → Affiche ShipmentRecapModal
4. Sur validation finale → Enregistrement + Fermeture
```

#### **2. CarrierSelector** ✅ CRÉÉ
```typescript
// src/components/business/carrier-selector.tsx
Props: { selected, onSelect, disabled }
Affiche: 4 cards cliquables (Packlink, Mondial Relay, Chronotruck, Manuel)
Badges: Types supportés, API vs Manuel, Recommandé
```

#### **3. ShipmentRecapModal** ✅ CRÉÉ
```typescript
// src/components/business/shipment-recap-modal.tsx
Props: { open, data, onConfirm, onBack, loading }
Affiche:
- Transporteur + Type
- Tracking (si disponible)
- Colis/Palettes avec dimensions
- Coûts (payé/facturé/marge)
- Dates estimées
- Infos spécifiques transporteur
- Notes
Actions: [Retour] [Valider l'expédition]
```

#### **4. PacklinkShipmentForm** (À adapter existant)
```typescript
// Adapter: src/components/business/shipping-manager-modal.tsx (ancien)
Props: { order, onComplete(data) }
Champs:
- Multi-colis (dimensions, poids)
- Coûts (payé/facturé)
- Affectation produits par colis (optionnel)
Submit:
- Appel API Packlink
- Génération étiquette automatique
- onComplete({ tracking, label_url, costs, parcels })
```

#### **5. MondialRelayShipmentForm** (À créer)
```typescript
// src/components/business/mondial-relay-shipment-form.tsx
Props: { order, onComplete(data) }
Champs:
- Sélection point relais (autocomplete ou carte)
- Dimensions colis
- Poids
- Coûts
Submit:
- API Mondial Relay (si disponible)
- ou Saisie manuelle tracking
- onComplete({ relay_point, tracking, costs, parcels })
```

#### **6. ChronotruckShipmentForm** (À créer)
```typescript
// src/components/business/chronotruck-shipment-form.tsx
Props: { order, onComplete(data) }
Champs:
- Nombre de palettes
- Dimensions palettes (pré-rempli 120x80 cm)
- Hauteur totale
- Poids total
- Référence Chronotruck (manuel)
- Lien réservation Chronotruck (optionnel)
- Coûts
Submit:
- onComplete({ chronotruck_ref, palette_count, costs, parcels })
Note: Lien externe vers https://app.chronotruck.com/
```

#### **7. ManualShipmentForm** (À adapter existant)
```typescript
// Adapter: src/components/business/shipping-manager-modal.tsx (ancien)
Props: { order, onComplete(data) }
Champs:
- Type: [Colis] [Palette]
- Transporteur (sélection ou libre)
- Dimensions selon type
- Poids
- Tracking (optionnel)
- Coûts
Submit:
- onComplete({ carrier, tracking, type, costs, parcels })
```

---

## 🗄️ Base de Données

### **Migration** ✅ CRÉÉE

```sql
-- supabase/migrations/20251010_001_create_shipments_system.sql

-- ENUMS
CREATE TYPE shipping_method AS ENUM (
  'packlink', 'mondial_relay', 'chronotruck', 'manual'
);

CREATE TYPE shipment_type AS ENUM ('parcel', 'pallet');

-- TABLE shipments
CREATE TABLE shipments (
  id UUID PRIMARY KEY,
  sales_order_id UUID REFERENCES sales_orders(id),

  -- Méthode et type
  shipping_method shipping_method NOT NULL,
  shipment_type shipment_type NOT NULL DEFAULT 'parcel',
  carrier_name TEXT,
  service_name TEXT,

  -- Tracking
  tracking_number TEXT,
  tracking_url TEXT,

  -- Coûts
  cost_paid_eur DECIMAL(10, 2),
  cost_charged_eur DECIMAL(10, 2),

  -- Dates
  created_at TIMESTAMPTZ DEFAULT NOW(),
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  estimated_delivery_at TIMESTAMPTZ,

  -- Données Packlink
  packlink_shipment_id TEXT,
  packlink_label_url TEXT,
  packlink_service_id INT,
  packlink_response JSONB,

  -- Données Mondial Relay
  mondial_relay_point_id TEXT,
  mondial_relay_point_name TEXT,
  mondial_relay_point_address TEXT,
  mondial_relay_label_url TEXT,
  mondial_relay_response JSONB,

  -- Données Chronotruck
  chronotruck_reference TEXT,
  chronotruck_palette_count INT,
  chronotruck_url TEXT,
  chronotruck_data JSONB,

  -- Métadonnées
  notes TEXT,
  metadata JSONB,
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ
);

-- TABLE shipping_parcels (multi-colis/palettes)
CREATE TABLE shipping_parcels (
  id UUID PRIMARY KEY,
  shipment_id UUID REFERENCES shipments(id),
  parcel_number INT NOT NULL,
  parcel_type shipment_type NOT NULL DEFAULT 'parcel',
  weight_kg DECIMAL(8, 2),
  length_cm INT,
  width_cm INT,
  height_cm INT,
  parcel_tracking_number TEXT,
  created_at TIMESTAMPTZ
);

-- TABLE parcel_items (contenu colis)
CREATE TABLE parcel_items (
  id UUID PRIMARY KEY,
  parcel_id UUID REFERENCES shipping_parcels(id),
  sales_order_item_id UUID REFERENCES sales_order_items(id),
  quantity_shipped INT CHECK (quantity_shipped > 0),
  created_at TIMESTAMPTZ
);

-- RPC Function
CREATE FUNCTION process_shipment_stock(
  p_shipment_id UUID,
  p_sales_order_id UUID
) RETURNS jsonb
-- Déduction stock + Mise à jour statut commande
```

---

## 🔧 Hooks React

### **use-shipments.ts** (À adapter)

```typescript
// src/hooks/use-shipments.ts

export function useShipments() {
  // Existant
  const createPacklinkShipment = async (request) => {
    // 1. Appel API /api/packlink/create-shipment
    // 2. Création shipment dans DB
    // 3. Création parcels
    // 4. Création parcel_items
    // 5. Appel RPC process_shipment_stock
    // 6. Retour { success, shipment, labelUrl }
  }

  // NOUVEAU
  const createMondialRelayShipment = async (request) => {
    // 1. API Mondial Relay (si disponible) ou manuel
    // 2. Création shipment dans DB
    // 3. Création parcels
    // 4. Création parcel_items
    // 5. Appel RPC process_shipment_stock
    // 6. Retour { success, shipment }
  }

  // NOUVEAU
  const createChronotruckShipment = async (request) => {
    // 1. Création shipment dans DB (manuel)
    // 2. Enregistrement référence Chronotruck
    // 3. Création parcels (palettes)
    // 4. Création parcel_items
    // 5. Appel RPC process_shipment_stock
    // 6. Retour { success, shipment }
  }

  // Adapter
  const createManualShipment = async (request) => {
    // 1. Création shipment dans DB
    // 2. Type parcel ou pallet selon choix
    // 3. Création parcels
    // 4. Création parcel_items
    // 5. Appel RPC process_shipment_stock
    // 6. Retour { success, shipment }
  }
}
```

---

## 📊 Règles Métier (Standards Professionnels)

### **1. Transporteurs et Types Supportés**

| Transporteur | Colis | Palettes | Intégration | Poids Max |
|---|---|---|---|---|
| **Packlink** | ✅ | ❌ | API | 30 kg |
| **Mondial Relay** | ✅ | ❌ | API/Manuel | 30 kg |
| **Chronotruck** | ❌ | ✅ | Manuel | 240 kg |
| **Manuel** | ✅ | ✅ | Manuel | Illimité |

### **2. Dimensions Standards**

**Colis** :
- Variables selon transporteur
- Packlink : max 120x80x80 cm
- Mondial Relay : max 150x50x50 cm

**Palettes** :
- Standard européenne : 120 x 80 x 10 cm
- Hauteur max chargée : 180 cm recommandé
- Poids max : 240 kg

### **3. Workflow Validation**

✅ **Avant création expédition** :
- Commande confirmée (status = 'confirmed')
- Paiement validé (payment_status = 'paid')
- Stock suffisant pour tous les produits

✅ **Lors de la création** :
- Sélection transporteur
- Saisie dimensions/poids
- Validation coûts
- Affectation produits (optionnel)

✅ **Récapitulatif** :
- Affichage synthèse complète
- Calcul marge automatique
- Validation utilisateur finale

✅ **Après validation** :
- Création shipment dans DB
- Déduction stock automatique (RPC)
- Mise à jour statut commande
- Notification client (optionnel)

### **4. Statuts Commande**

```
confirmed → partially_shipped → shipped → delivered
```

- **partially_shipped** : Au moins 1 produit expédié, mais pas tous
- **shipped** : Tous les produits expédiés
- **delivered** : Livraison confirmée

### **5. Gestion Multi-Expéditions**

✅ Une commande peut avoir **plusieurs expéditions** :
- Expédition partielle possible
- Tracking différent par expédition
- Coûts cumulés

---

## 🚀 Plan d'Implémentation

### **Phase 1: Base de Données** ✅ TERMINÉ
- [x] Migration créée et corrigée
- [x] ENUMs : shipping_method + shipment_type
- [x] Tables : shipments, shipping_parcels, parcel_items
- [x] RPC process_shipment_stock

### **Phase 2: Composants de Base** ✅ EN COURS
- [x] ShipmentRecapModal (clef de voûte)
- [x] CarrierSelector
- [ ] ChronotruckShipmentForm
- [ ] MondialRelayShipmentForm

### **Phase 3: Refonte ShippingManagerModal** (PRIORITÉ)
- [ ] Orchestrateur multi-étapes
- [ ] Intégration CarrierSelector
- [ ] Affichage conditionnel formulaires
- [ ] Navigation step-by-step
- [ ] Intégration ShipmentRecapModal

### **Phase 4: Hooks et API**
- [ ] Adapter use-shipments.ts
- [ ] Ajouter createMondialRelayShipment
- [ ] Ajouter createChronotruckShipment
- [ ] Adapter createManualShipment
- [ ] API route Mondial Relay (si nécessaire)

### **Phase 5: Tests**
- [ ] Test workflow Packlink
- [ ] Test workflow Mondial Relay
- [ ] Test workflow Chronotruck
- [ ] Test workflow Manuel
- [ ] Test multi-expéditions
- [ ] Console error check

### **Phase 6: Documentation**
- [ ] Guide utilisateur
- [ ] Mise à jour MEMORY-BANK
- [ ] Commentaires code

---

## 🎨 Design System Vérone

### **Couleurs**
- ✅ Noir (#000000) - Textes, bordures, boutons primaires
- ✅ Blanc (#FFFFFF) - Backgrounds
- ✅ Gris (#666666, #999999) - Textes secondaires
- ❌ **AUCUN jaune/doré** (strictement interdit)

### **Composants shadcn/ui**
- Dialog - Modals
- Card - Sections de contenu
- Badge - Statuts, labels
- Button - Actions
- Select - Sélecteurs
- Input - Champs formulaires

### **Layout**
- Desktop : Grid 2 colonnes
- Mobile : Stack vertical
- Images produits : 24x24 px (petites), 96x96 px (grandes)

---

## 📝 Notes Importantes

### **Packlink API**
⚠️ Actuellement en erreur 500 - Contact support nécessaire
- Clé API : `03df0c...` (fournie)
- Erreur : Tous endpoints retournent 500
- Action : Contacter support Packlink PRO

### **Mondial Relay API**
❓ À clarifier avec utilisateur :
- API disponible ?
- Credentials ?
- Workflow : API ou saisie manuelle ?

### **Chronotruck**
✅ Manuel uniquement :
- Interface web : https://app.chronotruck.com/
- Utilisateur crée réservation sur leur site
- Saisie référence dans notre système

---

## ✅ Avantages Architecture V2

### **vs Version 1** (ancienne)
- ❌ V1 : Tout dans un seul modal confus
- ✅ V2 : Architecture modulaire claire

### **Inspiré des meilleurs** (Shipstation/Sendcloud)
- ✅ Sélecteur transporteur visuel (cards)
- ✅ Formulaires spécifiques par transporteur
- ✅ Récapitulatif unifié avant validation
- ✅ Workflow step-by-step

### **Extensible**
- ✅ Facile d'ajouter nouveaux transporteurs
- ✅ Structure uniforme pour tous
- ✅ Métadonnées JSONB pour flexibilité

### **Professionnel**
- ✅ Respecte règles métier standards
- ✅ Multi-expéditions supporté
- ✅ Tracking automatique
- ✅ Gestion stock intégrée

---

*Vérone Back Office 2025 - Professional Multi-Carrier Shipping System*
