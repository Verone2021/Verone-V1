# Exploration Structure Base Données - Échantillons (Samples)

**Date**: 2025-11-25
**Contexte**: Analyse complète du système d'échantillons pour identifier comment les items sont stockés et les contraintes actuelles

---

## 1. STRUCTURE DE BASE DONNÉES

### 1.1 Table `purchase_order_items` (Ligne d'échantillon)

**Colonne clé: `sample_type`**

- Type: `character varying`
- Valeurs: `NULL` (pas échantillon), `'internal'` (interne), `'customer'` (client)
- Constraint CHECK: `(sample_type IS NULL) OR (sample_type = ANY (ARRAY['internal','customer']))`

**Colonnes de liaison client:**

- `customer_organisation_id` (UUID, FK → organisations.id) - Client B2B
- `customer_individual_id` (UUID, FK → individual_customers.id) - Client B2C

**Contrainte de validation client:**

```
check_customer_sample_has_customer:
  ((sample_type = 'customer' AND (customer_organisation_id IS NOT NULL OR customer_individual_id IS NOT NULL))
   OR (sample_type IS NULL)
   OR (sample_type <> 'customer'))
```

**Colonne d'archivage:**

- `archived_at` (TIMESTAMPTZ, NULL = actif) - Soft delete pour archivage

**Autres colonnes pertinentes:**

- `product_id` (FK → products.id)
- `purchase_order_id` (FK → purchase_orders.id)
- `quantity` (INT > 0)
- `unit_price_ht` (NUMERIC)
- `notes` (TEXT)

### 1.2 Table `sample_orders` (EXISTE mais NON UTILISÉE)

**Structure:**

- `id` (UUID, PK)
- `order_number` (TEXT, UNIQUE) - Auto-généré: 'SAMPLE-{epoch}'
- `supplier_id` (UUID, FK → organisations.id)
- `status` (TEXT) - draft | ordered | received | cancelled
- `total_estimated_cost` (NUMERIC)
- `actual_cost` (NUMERIC, NULL)
- `shipping_cost` (NUMERIC)
- `expected_delivery_date` (DATE)
- `actual_delivery_date` (DATE)
- `supplier_order_reference` (TEXT)
- `tracking_number` (TEXT)
- `internal_notes` (TEXT)
- `supplier_notes` (TEXT)
- `created_by`, `approved_by` (UUID FKs)
- `created_at`, `updated_at` (TIMESTAMPTZ)

**Statut:** TABLE COMPLÈTEMENT ORPHELINE - Non référencée par aucune autre table

### 1.3 Table `sample_order_items` (EXISTE mais NON UTILISÉE)

**Structure:**

- `id` (UUID, PK)
- `sample_order_id` (UUID, FK → sample_orders.id)
- `sample_description` (TEXT, NOT NULL)
- `estimated_cost`, `actual_cost` (NUMERIC)
- `quantity` (INT, default 1)
- `item_status` (TEXT) - pending | delivered | validated | archived
- `delivered_at`, `validated_at` (TIMESTAMPTZ)
- `validation_notes` (TEXT)
- `created_at`, `updated_at` (TIMESTAMPTZ)

**Statut:** TABLE COMPLÈTEMENT ORPHELINE - JAMAIS UTILISÉE

---

## 2. RELATIONS ACTUELLES

### Architecture Actuelle (EN PRODUCTION)

```
purchase_orders
    ↓ (1:N)
purchase_order_items (avec sample_type = 'internal' ou 'customer')
    ├─→ products (product_id)
    ├─→ organisations (customer_organisation_id) [B2B uniquement]
    └─→ individual_customers (customer_individual_id) [B2C uniquement]
```

**Aucune utilisation de:**

- `sample_orders` table
- `sample_order_items` table

---

## 3. CONTRAINTES ACTUELLES QUI EMPÊCHENT LES COMMANDES MULTIPLES

### 3.1 Contrainte Database

**Pas de contrainte UNIQUE bloquant les items dupliqués dans `purchase_order_items`**

Recherche effectuée:

- ✅ Vérification des INDEX UNIQUE: Seulement PK (id) et FKs
- ✅ Vérification des CHECK CONSTRAINTS: Aucun UNIQUE sur (sample_type + product_id + customer_id)
- ✅ Vérification des TRIGGERS: Plusieurs triggers mais AUCUN validant les doublons

**Conclusion:** La contrainte n'existe PAS au niveau database.

### 3.2 Contrainte Application (Frontend)

Exploré dans le code:

**Page: `/app/produits/sourcing/echantillons/page.tsx`**

- Hook: `useCustomerSamples()` (276 lignes)
- Modal de création: Utilise `CustomerSelector` + `UniversalProductSelectorV2`
- Aucune validation pour empêcher les doublons avant INSERT

**Hook: `use-customer-samples.ts` (383 lignes)**

- `handleSubmit()` (L.255-352): Crée simplement une nouvelle PO draft et un nouvel item
- `insertSampleInPO()` (L.234-318): Cherche une PO draft existante pour le MÊME FOURNISSEUR
  - Mais ne cherche PAS un item existant avec le même client + produit
  - Regrouperait les items dans la même PO mais les laisserait dupliqués

**Conclusion:** Le code application n'empêche PAS les doublons (pas de vérification avant INSERT).

---

## 4. LOGIQUE ACTUELLE D'INSERTION

### Flux `handleSubmit()` dans page.tsx (L.255-352)

```typescript
1. Récupère le produit + supplier_id
2. Crée une NOUVELLE purchase_order (PO draft) avec:
   - po_number = `SAMPLE-${Date.now()}`
   - status = 'draft'
   - supplier_id = product.supplier_id
3. Crée un NOUVEAU purchase_order_item avec:
   - purchase_order_id = newPO.id
   - product_id = selectedProductId
   - quantity = user input (1-10)
   - sample_type = 'customer'
   - customer_organisation_id OU customer_individual_id (selon type client)
   - notes = adresse livraison + commentaires
```

**Problème:** Chaque appel crée une NOUVELLE PO draft + un NOUVEL item.

- Si user crée 2 échantillons du même produit pour le même client → 2 items distincts dans 2 POs différentes
- Pas de détection de doublons
- Pas de regroupement intelligente

### Flux `insertSampleInPO()` (L.234-318)

Utilisé uniquement lors de la réinsertion d'un échantillon archivé:

```typescript
1. Récupère infos échantillon (product_id, quantity, supplier_id)
2. Cherche une PO draft existante pour CE FOURNISSEUR
   - Query: .eq('supplier_id', supplierId).eq('status', 'draft')
   - Limite à 1 résultat (most recent)
3. Si trouvée: Réutilise cette PO
4. Si pas trouvée: Crée une NOUVELLE PO
5. Met à jour l'échantillon: purchase_order_id = targetPOId
```

**Logique:** Regroupement par FOURNISSEUR uniquement.

- Pas de vérification si un item identique existe déjà
- Pourrait créer des doublons (même produit + même client dans la même PO)

---

## 5. VUE `customer_samples_view` - STATUS

**Vérification effectuée:**

- ✅ Cherché en database: NON TROUVÉE
- ✅ Référencée dans le code (L.121 dans hook)
- ✅ Utilisée avec `@ts-ignore` (type manquant)

**Statut:** Vue manquante ou non encore créée. Le code essaie de l'utiliser mais elle n'existe pas.

---

## 6. TRIGGERS EXISTANTS

**Triggers liés aux samples/commandes:**

1. `trigger_check_sample_archive` - Gère l'archivage des échantillons
2. `purchase_order_items_updated_at` - Mise à jour timestamp
3. `recalculate_purchase_order_totals_trigger` (3 versions) - Recalcule les totaux PO
4. `trigger_track_product_added_to_draft` - Analytics produits ajoutés
5. `trigger_track_product_quantity_updated_in_draft` - Analytics quantités
6. `trigger_track_product_removed_from_draft` - Analytics suppression
7. `trigger_update_cost_price_from_po` - Mise à jour prix coûtant
8. `trigger_handle_po_item_quantity_change_confirmed` - Gestion stock

**Recherche:** Aucun trigger n'empêche les doublons d'items identiques.

---

## 7. DONNÉES EXISTANTES

**Échantillons actuels:**

- Requête effectuée: `SELECT ... WHERE sample_type IS NOT NULL`
- **Résultat: 0 échantillons** (base de données vide)

**Conclusion:** Aucune donnée pour tester la contrainte actuelle.

---

## 8. SYNTHÈSE DES LIMITATIONS

### Obstacle 1: Pas de contrainte database

- Aucune UNIQUE KEY sur (sample_type, product_id, customer_organisation_id | customer_individual_id)
- Database accepterait les doublons

### Obstacle 2: Pas de validation application

- `handleSubmit()` crée systématiquement une nouvelle PO + item
- Aucune vérification si l'échantillon existe déjà
- Aucune deduplication frontend

### Obstacle 3: Vue orpheline

- `customer_samples_view` n'existe pas
- Le hook `useCustomerSamples()` ne fonctionnera pas tant que la vue n'est pas créée

### Obstacle 4: Tables orphelines

- `sample_orders` et `sample_order_items` existent mais ne sont jamais utilisées
- Créent de la confusion conceptuelle
- Peuvent être ignorées ou supprimées

---

## 9. ARCHITECTURE CIBLE PROPOSÉE

Pour permettre **plusieurs commandes d'échantillons du même produit**:

### Option A: Créer UNIQUE KEY (Strict - 1 commande max par produit+client)

```sql
ALTER TABLE purchase_order_items
ADD CONSTRAINT unique_sample_per_product_customer UNIQUE (
  product_id,
  CASE WHEN sample_type = 'customer' THEN customer_organisation_id ELSE NULL END,
  CASE WHEN sample_type = 'customer' THEN customer_individual_id ELSE NULL END,
  sample_type
)
WHERE sample_type = 'customer' AND archived_at IS NULL;
```

**Impact:** Empêcherait les doublons complètement - INCOMPATIBLE avec besoin "plusieurs commandes"

### Option B: Supprimer la contrainte (Actuel - Permet les doublons)

**Statut:** Déjà le cas actuellement
**Impact:** Application doit gérer la déduplication intelligente

### Option C: Créer une table de "Sample Requests" (Requis pour multi-commandes)

```sql
CREATE TABLE sample_requests (
  id UUID PRIMARY KEY,
  product_id UUID NOT NULL,
  supplier_id UUID NOT NULL,
  customer_type TEXT NOT NULL, -- 'organisation' | 'individual'
  customer_id UUID NOT NULL,
  sample_type VARCHAR NOT NULL, -- 'internal' | 'customer'
  status TEXT DEFAULT 'draft', -- draft | requested | received | closed
  quantity_requested INT,
  quantity_received INT DEFAULT 0,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  notes TEXT
);

-- Link to purchase_order_items (1:N)
ALTER TABLE purchase_order_items
ADD COLUMN sample_request_id UUID REFERENCES sample_requests(id);
```

**Impact:** Permet tracking de plusieurs commandes du même produit-client séquentiellement

---

## 10. FICHIERS CLÉS IMPLIQUÉS

**Frontend:**

- `/apps/back-office/src/app/produits/sourcing/echantillons/page.tsx` (1150 lignes)
  - Page UI principale
  - `handleSubmit()` crée nouvelle PO
  - Modal de création + filtres + stats

**Hooks/Business Logic:**

- `/packages/@verone/customers/src/hooks/use-customer-samples.ts` (383 lignes)
  - `useCustomerSamples()` - Fetch samples
  - `archiveSample()` - Archive (soft delete)
  - `reactivateSample()` - Réactive archived
  - `insertSampleInPO()` - Regroupement intelligent
  - `deleteSample()` - Suppression définitive

**Server Actions:**

- `/apps/back-office/src/app/actions/purchase-orders.ts` (125 lignes)
  - `updatePurchaseOrderStatus()` - Mise à jour statut PO

---

## 11. DÉPENDANCES

**Pas créée:**

- `customer_samples_view` - Vue qui agrège les données du UI

**À créer pour multi-commandes:**

- Table `sample_requests` (optionnel mais recommandé)
- Logique deduplication dans `handleSubmit()`
- Index pour optimiser recherches de doublons

---

## CONCLUSION

**Situation actuelle:**

✅ **Les échantillons PEUVENT déjà être commandés plusieurs fois**

- Aucune contrainte database
- Aucune vérification application
- Chaque appel crée une nouvelle PO draft + item

❌ **Limitation:** Pas de regroupement intelligent dans une même commande fournisseur

- Chaque nouveau sample création → nouvelle PO
- Regroupement SEULEMENT lors réinsertion d'un archivé

**Recommandation:**

1. Créer la vue `customer_samples_view` (obligatoire pour l'UI actuelle)
2. Améliorer `handleSubmit()` pour faire un regroupement comme dans `insertSampleInPO()`
3. Optionnel: Créer table `sample_requests` pour mieux tracker les demandes multiples
