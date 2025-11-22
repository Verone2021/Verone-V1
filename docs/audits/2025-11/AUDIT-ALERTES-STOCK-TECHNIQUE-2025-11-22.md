# SPÉCIFICATION TECHNIQUE COMPLÈTE - SYSTÈME ALERTES STOCK

**Date** : 2025-11-22
**Auditeur** : Claude Code
**Base de données** : Supabase Cloud (aorroydfjsrygmosnzrl, eu-west-3)
**Objectif** : Documentation technique exhaustive pour transmission à assistant IA

---

## 1. LOGIQUE D'AFFICHAGE DES ALERTES (Frontend Actuel)

### A) Types d'Alertes (`alert_type` - TypeScript Interface)

**Fichier** : `packages/@verone/stock/src/components/cards/StockAlertCard.tsx` (ligne 21)

```typescript
alert_type: 'low_stock' | 'out_of_stock' | 'no_stock_but_ordered'
```

**3 Types d'Alertes** :
1. `'low_stock'` - Stock faible (stock < min_stock mais > 0)
2. `'out_of_stock'` - Rupture de stock (stock <= 0)
3. `'no_stock_but_ordered'` - Commandé sans stock (commandes clients en attente sans stock)

### B) Titres Affichés (Fonction `getAlertTypeLabel()` ligne 92-103)

| `alert_type` | Titre Affiché | Code Ligne |
|--------------|---------------|------------|
| `'low_stock'` | **"Stock Faible"** | 95 |
| `'out_of_stock'` | **"Rupture de Stock"** | 97 |
| `'no_stock_but_ordered'` | **"Commandé Sans Stock"** | 99 |
| (default) | **"Alerte"** | 101 |

### C) Texte Dynamique Manque (Lignes 216-227)

**Variable Utilisée** : `alert.shortage_quantity` (number)

**Affichage** :
```tsx
· Manquants: <strong>{alert.shortage_quantity > 0 ? alert.shortage_quantity : '✓'}</strong>
```

**Logique** :
- Si `shortage_quantity > 0` → Affiche le nombre (ex: "5")
- Si `shortage_quantity = 0` → Affiche "✓" (suffisant)

**Classe CSS** :
- `shortage_quantity > 0` → `text-red-600 font-medium` (ROUGE)
- `shortage_quantity = 0` → `text-green-600` (VERT)

### D) Condition Bouton "Commander" (Ligne 151)

**Code Exact** :
```tsx
disabled={alert.is_in_draft}
```

**⚠️ PROBLÈME IDENTIFIÉ** : Ne vérifie PAS `alert.validated`

**Condition Actuelle** :
- Bouton disabled si `is_in_draft = true` (commande brouillon existe)
- Bouton enabled si `is_in_draft = false`

**Condition REQUISE (selon workflow demandé)** :
```tsx
disabled={alert.is_in_draft || alert.validated}
```

**Texte Bouton (Lignes 154-158)** :
- Si `is_in_draft = true` → **"Déjà commandé"**
- Si `alert_type = 'no_stock_but_ordered'` → **"Voir Commandes"**
- Sinon → **"Commander Fournisseur"**

### E) Couleurs Carte (Fonction `getSeverityColor()` ligne 61-90)

**Calcul Stock Prévisionnel** (lignes 64-67) :
```tsx
const stock_previsionnel =
  alert.stock_real +
  (alert.stock_forecasted_in || 0) -
  (alert.stock_forecasted_out || 0);
```

**Workflow Couleurs** :

1. **🟢 VERT** (ligne 72-74) :
   ```tsx
   if (alert.validated && stock_previsionnel >= alert.min_stock) {
     return 'border-green-600 !bg-green-50';
   }
   ```
   - Condition : `validated = true` ET `stock_previsionnel >= min_stock`

2. **🔴 ROUGE** (ligne 77-79) :
   ```tsx
   if (alert.is_in_draft || stock_previsionnel < alert.min_stock) {
     return 'border-red-600 !bg-red-50';
   }
   ```
   - Condition : `is_in_draft = true` OU `stock_previsionnel < min_stock`

3. **Fallback Sévérité** (lignes 82-89) :
   - `critical` → ROUGE
   - `warning` → ORANGE
   - `info` → BLEU

---

## 2. STRUCTURE BASE DE DONNÉES (Noms Exacts Colonnes)

### A) Table `products` (53 colonnes totales)

**Colonnes Stock** :

| Nom Colonne EXACT | Type | Nullable | Default | Description |
|-------------------|------|----------|---------|-------------|
| `stock_quantity` | integer | YES | 0 | ⚠️ LEGACY (ancien nom, probablement inutilisé) |
| **`stock_real`** | integer | YES | 0 | **Stock physique réel** |
| **`stock_forecasted_in`** | integer | YES | 0 | **Prévisionnel entrées (commandes fournisseurs validées)** |
| **`stock_forecasted_out`** | integer | YES | 0 | **Prévisionnel sorties (commandes clients validées)** |
| **`min_stock`** | integer | YES | 0 | **Seuil minimum déclenchement alerte** |
| `reorder_point` | integer | YES | 10 | Point de réapprovisionnement recommandé |

**Colonnes Autres** :
- `id` (uuid, PK)
- `sku` (VARCHAR, unique, NOT NULL)
- `name` (VARCHAR, NOT NULL)
- `supplier_id` (uuid, FK → organisations)
- `cost_price` (numeric, prix coût)
- `product_status` (ENUM: active, draft, archived)

### B) Table `stock_alert_tracking` (19 colonnes totales)

**Colonnes EXACTES** :

| Nom Colonne EXACT | Type | Nullable | Default | Description |
|-------------------|------|----------|---------|-------------|
| `id` | uuid | NO | gen_random_uuid() | PK |
| **`product_id`** | uuid | NO | - | FK → products |
| `supplier_id` | uuid | NO | - | FK → organisations |
| **`alert_type`** | **text** | NO | - | **Type : 'low_stock', 'out_of_stock', 'no_stock_but_ordered'** |
| `alert_priority` | integer | NO | - | Priorité 1-3 (1=critique) |
| **`stock_real`** | integer | NO | 0 | Snapshot stock réel |
| **`stock_forecasted_in`** | integer | NO | 0 | Snapshot prévisionnel entrées |
| **`stock_forecasted_out`** | integer | NO | 0 | Snapshot prévisionnel sorties |
| **`min_stock`** | integer | NO | 0 | Snapshot seuil minimum |
| **`shortage_quantity`** | integer | NO | 0 | **Quantité manquante calculée** |
| `draft_order_id` | uuid | YES | NULL | FK → purchase_orders (commande brouillon liée) |
| `quantity_in_draft` | integer | YES | 0 | Quantité dans commande brouillon |
| `added_to_draft_at` | timestamptz | YES | NULL | Date ajout brouillon |
| **`validated`** | **boolean** | NO | **false** | **TRUE si commande validée** |
| `validated_at` | timestamptz | YES | NULL | Date validation |
| `validated_by` | uuid | YES | NULL | FK → auth.users |
| `created_at` | timestamptz | NO | NOW() | Date création alerte |
| `updated_at` | timestamptz | NO | NOW() | Date dernière MAJ |
| `notes` | text | YES | NULL | Notes libres |

**Contrainte UNIQUE** :
```sql
UNIQUE (product_id, alert_type)
```
→ Un produit peut avoir MAX 2 alertes (1x low_stock + 1x out_of_stock)

### C) Table `purchase_orders` - ENUM `status`

**Valeurs EXACTES (PostgreSQL ENUM `purchase_order_status`)** :

| Valeur ENUM EXACTE | Description | Impact Stock |
|--------------------|-------------|--------------|
| **`draft`** | Brouillon (non confirmée) | ❌ Aucun impact |
| **`validated`** | Validée (confirmée fournisseur) | ✅ `stock_forecasted_in` += quantités |
| **`partially_received`** | Partiellement reçue | ✅ `stock_real` + partiel, `stock_forecasted_in` - partiel |
| **`received`** | Totalement reçue | ✅ `stock_real` += total, `stock_forecasted_in` = 0 |
| **`cancelled`** | Annulée | ✅ Rollback `stock_forecasted_in` |

**Colonnes Clés** :
- `id` (uuid, PK)
- `po_number` (VARCHAR, numéro commande ex: PO-1763741213401)
- **`status`** (ENUM purchase_order_status)
- `supplier_id` (uuid, FK → organisations)
- `expected_delivery_date` (date, livraison prévue)
- `received_at` (timestamptz, date réception complète)

### D) Table `sales_orders` - ENUM `status`

**Valeurs EXACTES (PostgreSQL ENUM `sales_order_status`)** :

| Valeur ENUM EXACTE | Description | Impact Stock |
|--------------------|-------------|--------------|
| **`draft`** | Brouillon (panier) | ❌ Aucun impact |
| **`validated`** | Validée (confirmée client) | ✅ `stock_forecasted_out` += quantités |
| **`partially_shipped`** | Partiellement expédiée | ✅ `stock_real` - partiel, `stock_forecasted_out` - partiel |
| **`shipped`** | Totalement expédiée | ✅ `stock_real` -= total, `stock_forecasted_out` = 0 |
| **`delivered`** | Livrée client | (Pas impact stock, juste statut business) |
| **`cancelled`** | Annulée | ✅ Rollback `stock_forecasted_out` |

**Colonnes Clés** :
- `id` (uuid, PK)
- `order_number` (VARCHAR, numéro commande)
- **`status`** (ENUM sales_order_status)
- `customer_id` (uuid, FK → customers OU organisations)
- `customer_type` (VARCHAR: 'individual' ou 'organisation')
- **`channel_id`** (uuid, FK → sales_channels) ⭐ Canal de vente

---

## 3. LOGIQUE DE DISPARITION (Archivage Alertes)

### État Actuel : ❌ AUCUN TRIGGER D'ARCHIVAGE

**Requête SQL Vérifiée** :
```sql
SELECT proname FROM pg_proc
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
AND (proname LIKE '%alert%' AND (proname LIKE '%archive%' OR proname LIKE '%delete%'));
```

**Résultat** : `0 rows` → **AUCUNE fonction d'archivage n'existe**

### ⚠️ Conséquence

**Problème** : Alertes NE DISPARAISSENT JAMAIS même si :
- Stock réel repasse au-dessus min_stock après réception
- Commande totalement reçue et stock suffisant

**Solution Requise** : Créer trigger qui :
1. Se déclenche AFTER INSERT sur `stock_movements` (réceptions/expéditions)
2. Vérifie si `stock_real >= min_stock` pour produit concerné
3. Si OUI → DELETE FROM `stock_alert_tracking` WHERE `product_id = X` ET `alert_type = 'low_stock'`
4. OU mieux : Soft delete avec colonne `archived_at` + déplacement vers `stock_alerts_history`

---

## 4. TRIGGERS MOUVEMENTS DE STOCK (Existants)

### A) Triggers Validation Commandes

**Purchase Orders** (Commandes Fournisseurs) :
| Trigger | Table | Fonction | Événement | Impact |
|---------|-------|----------|-----------|--------|
| `trigger_po_update_forecasted_in` | purchase_orders | `update_po_forecasted_in()` | UPDATE status (draft→validated) | `stock_forecasted_in` += quantités |
| `trigger_validate_stock_alerts_on_po` | purchase_orders | `validate_stock_alerts_on_po()` | UPDATE status (draft→validated) | `validated = true` dans alerte |
| `trigger_po_cancellation_rollback` | purchase_orders | `rollback_po_forecasted()` | UPDATE status (→cancelled) | Rollback `stock_forecasted_in` |

**Sales Orders** (Commandes Clients) :
| Trigger | Table | Fonction | Événement | Impact |
|---------|-------|----------|-----------|--------|
| `trigger_so_update_forecasted_out` | sales_orders | `update_so_forecasted_out()` | UPDATE status (draft→validated) | `stock_forecasted_out` += quantités |
| `trigger_so_cancellation_rollback` | sales_orders | `rollback_so_forecasted()` | UPDATE status (→cancelled) | Rollback `stock_forecasted_out` |

### B) Triggers Mouvements Physiques

**Réceptions** (Entrées Stock) :
| Trigger | Table | Fonction | Événement | Impact |
|---------|-------|----------|-----------|--------|
| `trigger_reception_update_stock` | purchase_order_receptions | `update_stock_on_reception()` | INSERT | `stock_real` +, `stock_forecasted_in` - |

**Expéditions** (Sorties Stock) :
| Trigger | Table | Fonction | Événement | Impact |
|---------|-------|----------|-----------|--------|
| `trigger_shipment_update_stock` | sales_order_shipments | `update_stock_on_shipment()` | INSERT | `stock_real` -, `stock_forecasted_out` - |

**Recalcul Alertes** :
| Trigger | Table | Fonction | Événement | Impact |
|---------|-------|----------|-----------|--------|
| `trg_update_stock_alert` | stock_movements | `update_stock_alert_on_movement()` | INSERT | Recalcul alertes après mouvement |

---

## 5. WORKFLOW COMPLET ATTENDU (Spécification Métier)

### Cycle de Vie Alerte

```
1. CRÉATION ALERTE (ROUGE)
   ├─ Condition : stock_real < min_stock
   ├─ alert_type : 'low_stock' ou 'out_of_stock'
   ├─ validated : false
   ├─ Couleur : 🔴 ROUGE
   ├─ Titre : "Stock Faible" ou "Rupture de Stock"
   ├─ Bouton : "Commander Fournisseur" (enabled)
   └─ Texte : "Manquants : X unités"

2. COMMANDE BROUILLON CRÉÉE
   ├─ draft_order_id : UUID commande
   ├─ quantity_in_draft : X unités
   ├─ is_in_draft : true
   ├─ Couleur : 🔴 ROUGE (reste)
   ├─ Bouton : "Déjà commandé" (disabled)
   └─ Badge : "⏳ Commande en attente de validation"

3. COMMANDE VALIDÉE (draft → validated)
   ├─ Trigger : update_po_forecasted_in()
   │   └─ products.stock_forecasted_in += X
   ├─ Trigger : validate_stock_alerts_on_po()
   │   └─ stock_alert_tracking.validated = true
   ├─ Condition affichage VERT :
   │   └─ validated = true ET stock_previsionnel >= min_stock
   ├─ Couleur : 🟢 VERT
   ├─ Titre : "Stock Faible" (inchangé)
   ├─ Bouton : "Déjà commandé" (disabled) ⚠️ MANQUE validated check
   └─ Badge : "✅ Validé - Stock prévisionnel suffisant"

4. RÉCEPTION TOTALE (validated → received)
   ├─ INSERT INTO purchase_order_receptions (quantity_received = X)
   ├─ Trigger : update_stock_on_reception()
   │   ├─ products.stock_real += X
   │   └─ products.stock_forecasted_in -= X
   ├─ Condition disparition :
   │   └─ stock_real >= min_stock
   ├─ Action attendue : ❌ PAS DE TRIGGER ARCHIVAGE
   └─ État actuel : Alerte RESTE affichée (BUG)

5. ARCHIVAGE ALERTE (ATTENDU)
   ├─ Trigger manquant : auto_archive_resolved_alerts()
   ├─ Condition : stock_real >= min_stock AFTER movement
   ├─ Action : DELETE ou SOFT DELETE (archived_at = NOW())
   └─ Destination : Table stock_alerts_history (à créer ?)
```

### Cas Réception Partielle

```
Exemple : Commande 10 unités, min_stock = 10, stock_real = 0

1. Validation commande :
   - stock_forecasted_in = 10
   - stock_previsionnel = 0 + 10 - 0 = 10
   - validated = true
   - Couleur : 🟢 VERT (10 >= 10)

2. Réception partielle 5 unités :
   - stock_real = 5
   - stock_forecasted_in = 5 (10 - 5)
   - stock_previsionnel = 5 + 5 - 0 = 10
   - validated = true (reste)
   - Couleur : 🟢 VERT (10 >= 10)

3. Réception finale 5 unités :
   - stock_real = 10
   - stock_forecasted_in = 0
   - stock_previsionnel = 10 + 0 - 0 = 10
   - Condition archivage : stock_real (10) >= min_stock (10)
   - Action attendue : Alerte DISPARAÎT
   - Action réelle : ❌ Reste affichée (trigger manquant)
```

---

## 6. PROBLÈMES IDENTIFIÉS (Bugs Actuels)

### 🔴 P0 - Bloquants

1. **Bouton pas grisé si validated=true**
   - Fichier : `StockAlertCard.tsx` ligne 151
   - Code actuel : `disabled={alert.is_in_draft}`
   - Code requis : `disabled={alert.is_in_draft || alert.validated}`

2. **Alertes ne disparaissent jamais**
   - Trigger archivage manquant
   - Stock peut être suffisant mais alerte reste affichée
   - Solution : Créer trigger `auto_archive_resolved_alerts()` sur `stock_movements`

3. **KPIs Page Previsionnel = 0**
   - Hook `use-stock-dashboard.ts` ne calcule pas `SUM(stock_forecasted_in)`
   - Données correctes en DB mais pas affichées frontend
   - Requête manquante : `SELECT SUM(stock_forecasted_in), SUM(stock_forecasted_out) FROM products`

### ⚠️ P1 - Non Bloquants

4. **Titre ne change pas selon stock négatif vs stock faible**
   - Actuellement : Titre fixe "Stock Faible" ou "Rupture de Stock"
   - Demandé : Titre dynamique selon état (brouillon vs validé)
   - Solution : Modifier `getAlertTypeLabel()` pour vérifier `validated`

5. **Pas d'historique alertes résolues**
   - Table `stock_alerts_history` n'existe pas
   - Pas de page `/stocks/alertes/historique`
   - Solution : Créer table + migration + page historique

---

## 7. CANAUX DE VENTE (Intégration Commandes)

### État Actuel Base de Données

**Table** : `sales_channels` (22 colonnes)

| ID (UUID) | Code | Name | Domain URL | Is Active |
|-----------|------|------|------------|-----------|
| 4173d2e9... | `retail` | Vente Détail | - | ✅ |
| 87aad335... | `wholesale` | Vente en Gros | - | ✅ |
| 4f4f8589... | `b2b` | Plateforme B2B | - | ✅ |
| **0c2639e9...** | **`site_internet`** | **Site Internet Vérone** | https://veronecollections.fr | ✅ |
| d3d2b018... | `google_merchant` | Google Shopping | - | ✅ |

### Canaux Requis

| Canal | Code | Usage | Statut |
|-------|------|-------|--------|
| **Manuel** | `manual` | Ventes manuelles sans canal (téléphone, showroom) | ⚠️ À créer (ou renommer `retail`) |
| **Link.me** | `linkme` | Commissions apporteurs d'affaires | ❌ À créer |
| **Site Internet** | `site_internet` | E-commerce public | ✅ **EXISTE** |

### Intégration Commandes Client

**Table** : `sales_orders`

| Colonne | Type | Description |
|---------|------|-------------|
| `channel_id` | uuid (FK → sales_channels) | ✅ **EXISTE DÉJÀ** |

**Actions Requises** :
1. Créer canal `linkme` :
   ```sql
   INSERT INTO sales_channels (code, name, description, is_active, domain_url, site_name)
   VALUES ('linkme', 'Link.me - Apporteurs d''Affaires', 'Plateforme de gestion des commissions pour apporteurs externes', true, 'https://linkme.veronecollections.fr', 'Link.me by Vérone');
   ```

2. Créer/Renommer canal `manual` :
   ```sql
   -- Option A : Créer nouveau
   INSERT INTO sales_channels (code, name, description, is_active)
   VALUES ('manual', 'Vente Manuelle', 'Ventes directes (téléphone, showroom, sans canal digital)', true);

   -- Option B : Renommer existant
   UPDATE sales_channels
   SET code = 'manual', name = 'Vente Manuelle'
   WHERE code = 'retail';
   ```

---

## 8. DONNÉES RÉELLES PRODUCTION (Snapshots)

### Produits avec Stock Prévisionnel

**Requête SQL** : `SELECT id, sku, name, stock_real, stock_forecasted_in, stock_forecasted_out, min_stock FROM products WHERE stock_forecasted_in > 0 OR stock_forecasted_out > 0 ORDER BY updated_at DESC LIMIT 5;`

| SKU | Name | stock_real | stock_forecasted_in | stock_forecasted_out | min_stock |
|-----|------|------------|---------------------|----------------------|-----------|
| FMIL-VERT-01 | Fauteuil Milo - Vert | 0 | **10** | 0 | 10 |
| FMIL-ORANG-13 | Fauteuil Milo - Orange | 0 | 0 | 0 | 3 |

### Alertes Stock Actives

**Requête SQL** : `SELECT id, product_id, alert_type, validated, stock_real, min_stock, shortage_quantity, draft_order_id, quantity_in_draft FROM stock_alert_tracking ORDER BY updated_at DESC LIMIT 10;`

| Product ID | Alert Type | Validated | stock_real | min_stock | draft_order_id | quantity_in_draft |
|------------|------------|-----------|------------|-----------|----------------|-------------------|
| 3a267383... (FMIL-VERT-01) | low_stock | **TRUE ✅** | 0 | 10 | 9959b404... | 10 |
| 22424f3c... (FMIL-ORANG-13) | low_stock | **FALSE ❌** | 0 | 3 | NULL | 0 |

### Commandes Fournisseurs Validées

**Requête SQL** : `SELECT id, po_number, status, supplier_id FROM purchase_orders WHERE status IN ('draft', 'validated') ORDER BY updated_at DESC LIMIT 5;`

| PO Number | Status | ID |
|-----------|--------|-----|
| PO-1763741213401 | **validated ✅** | 9959b404... |

**🎯 PREUVE SYSTÈME FONCTIONNE** :
1. ✅ Commande PO-1763741213401 validée (draft → validated)
2. ✅ Trigger `trigger_po_update_forecasted_in` s'est déclenché
3. ✅ Fonction `update_po_forecasted_in()` a mis à jour `stock_forecasted_in` = 10
4. ✅ Alerte produit FMIL-VERT-01 passée à `validated = true`
5. ✅ Trigger `trigger_sync_stock_alert_tracking_v2` a synchronisé `stock_forecasted_in` dans l'alerte

**❌ CE QUI NE FONCTIONNE PAS** :
- KPIs page previsionnel affichent 0 au lieu de 10
- Alerte ne passe pas visuellement au vert (frontend)
- Bouton "Commander" pas grisé malgré validated=true

---

## 9. RÉSUMÉ EXÉCUTIF - ACTIONS REQUISES

### Frontend (3 corrections)

1. **StockAlertCard.tsx ligne 151** :
   ```tsx
   // AVANT
   disabled={alert.is_in_draft}

   // APRÈS
   disabled={alert.is_in_draft || alert.validated}
   ```

2. **use-stock-dashboard.ts** :
   - Ajouter requête `SELECT SUM(stock_forecasted_in) AS total_forecasted_in FROM products`
   - Mapper résultat dans `metrics.overview.total_forecasted_in`

3. **getAlertTypeLabel()** (optionnel) :
   - Rendre titre dynamique selon `validated` (ex: "Alerte Stock" si validated=true)

### Backend (2 créations)

1. **Trigger archivage alertes** :
   ```sql
   CREATE OR REPLACE FUNCTION auto_archive_resolved_alerts()
   RETURNS TRIGGER AS $$
   BEGIN
     DELETE FROM stock_alert_tracking
     WHERE product_id = NEW.product_id
       AND alert_type = 'low_stock'
       AND (SELECT stock_real FROM products WHERE id = NEW.product_id) >= (SELECT min_stock FROM products WHERE id = NEW.product_id);
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;

   CREATE TRIGGER trigger_archive_alerts_on_movement
   AFTER INSERT ON stock_movements
   FOR EACH ROW
   EXECUTE FUNCTION auto_archive_resolved_alerts();
   ```

2. **Table historique alertes** (optionnel) :
   ```sql
   CREATE TABLE stock_alerts_history (
     LIKE stock_alert_tracking INCLUDING ALL,
     resolved_at timestamptz DEFAULT NOW(),
     resolution_reason text
   );
   ```

### Canaux de Vente (2 créations SQL)

1. Créer canal `linkme`
2. Créer canal `manual` (ou renommer `retail`)

---

**FIN DE L'AUDIT TECHNIQUE**

**Document préparé pour** : Assistant IA (corrections système alertes stock)
**Prochaines étapes** : Implémenter corrections listées ci-dessus
