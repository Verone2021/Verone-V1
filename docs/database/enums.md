# <¯ Enums PostgreSQL - Vérone Database

**Source de vérité pour tous les types ENUM** utilisés dans la base de données Vérone.

---

## =Ê STATISTIQUES GLOBALES

- **Total Types Enum** : 34 types
- **Total Valeurs** : 194 valeurs
- **Date Extraction** : 2025-10-17
- **Project** : aorroydfjsrygmosnzrl

---

## =Ú INDEX DES ENUMS PAR MODULE

### Module Produits & Catalogue (9 enums)
1. `availability_status_type` (8 valeurs)
2. `availability_type_enum` (4 valeurs)
3. `image_type_enum` (5 valeurs)
4. `package_type` (4 valeurs)
5. `room_type` (30 valeurs)
6. `sourcing_status_type` (4 valeurs)
7. `sample_status_type` (7 valeurs)
8. `sample_request_status_type` (3 valeurs)
9. `language_type` (3 valeurs)

### Module Commandes & Ventes (3 enums)
1. `sales_order_status` (6 valeurs)
2. `purchase_order_status` (6 valeurs)
3. `purchase_type` (3 valeurs)

### Module Stock & Logistique (4 enums)
1. `movement_type` (4 valeurs)
2. `stock_reason_code` (25 valeurs)
3. `shipment_type` (2 valeurs)
4. `shipping_method` (4 valeurs)

### Module Finance & Comptabilité (5 enums)
1. `document_type` (5 valeurs)
2. `document_status` (8 valeurs)
3. `document_direction` (2 valeurs)
4. `transaction_side` (2 valeurs)
5. `bank_provider` (2 valeurs)

### Module Organisations & Utilisateurs (4 enums)
1. `organisation_type` (4 valeurs)
2. `supplier_segment_type` (5 valeurs)
3. `user_role_type` (5 valeurs)
4. `user_type` (4 valeurs)

### Module Feeds & Exports (3 enums)
1. `feed_platform_type` (3 valeurs)
2. `feed_format_type` (3 valeurs)
3. `feed_export_status_type` (5 valeurs)

### Module Technique & Système (6 enums)
1. `error_severity_enum` (4 valeurs)
2. `error_status_enum` (4 valeurs)
3. `error_type_enum` (7 valeurs)
4. `test_status_enum` (4 valeurs)
5. `matching_status` (5 valeurs)
6. `schedule_frequency_type` (4 valeurs)

---

## = ENUMS DÉTAILLÉS

### 1. AVAILABILITY_STATUS_TYPE (8 valeurs)

**Usage** : Statut de disponibilité des produits (produits sourcing/catalogue)

**Valeurs** :
```sql
CREATE TYPE availability_status_type AS ENUM (
  'in_stock',                    -- 1. En stock disponible
  'out_of_stock',                -- 2. Rupture de stock
  'preorder',                    -- 3. Précommande
  'coming_soon',                 -- 4. Bientôt disponible
  'discontinued',                -- 5. Arrêté/abandonné
  'sourcing',                    -- 6. En cours de sourcing
  'pret_a_commander',            -- 7. Prêt à commander
  'echantillon_a_commander'      -- 8. Échantillon à commander
);
```

**Tables Utilisatrices** : `products`, `product_drafts`

---

### 2. AVAILABILITY_TYPE_ENUM (4 valeurs)

**Usage** : Type de disponibilité simple

**Valeurs** :
```sql
CREATE TYPE availability_type_enum AS ENUM (
  'normal',         -- 1. Disponibilité normale
  'preorder',       -- 2. Précommande
  'coming_soon',    -- 3. Bientôt disponible
  'discontinued'    -- 4. Arrêté
);
```

---

### 3. BANK_PROVIDER (2 valeurs)

**Usage** : Banques supportées pour synchronisation bancaire

**Valeurs** :
```sql
CREATE TYPE bank_provider AS ENUM (
  'qonto',     -- 1. Qonto (banque business)
  'revolut'    -- 2. Revolut Business
);
```

**Tables Utilisatrices** : `bank_accounts`, `bank_transactions`

---

### 4. DOCUMENT_DIRECTION (2 valeurs)

**Usage** : Direction des documents financiers

**Valeurs** :
```sql
CREATE TYPE document_direction AS ENUM (
  'inbound',   -- 1. Entrant (factures fournisseurs, etc.)
  'outbound'   -- 2. Sortant (factures clients, etc.)
);
```

**Tables Utilisatrices** : `financial_documents`

---

### 5. DOCUMENT_STATUS (8 valeurs)

**Usage** : Statut workflow documents financiers

**Valeurs** :
```sql
CREATE TYPE document_status AS ENUM (
  'draft',            -- 1. Brouillon
  'sent',             -- 2. Envoyé
  'received',         -- 3. Reçu
  'paid',             -- 4. Payé
  'partially_paid',   -- 5. Partiellement payé
  'overdue',          -- 6. En retard
  'cancelled',        -- 7. Annulé
  'refunded'          -- 8. Remboursé
);
```

**Tables Utilisatrices** : `financial_documents`, `invoices`

---

### 6. DOCUMENT_TYPE (5 valeurs)

**Usage** : Types de documents financiers

**Valeurs** :
```sql
CREATE TYPE document_type AS ENUM (
  'customer_invoice',       -- 1. Facture client (vente)
  'customer_credit_note',   -- 2. Avoir client
  'supplier_invoice',       -- 3. Facture fournisseur (achat)
  'supplier_credit_note',   -- 4. Avoir fournisseur
  'expense'                 -- 5. Note de frais
);
```

**Tables Utilisatrices** : `financial_documents`

---

### 7. ERROR_SEVERITY_ENUM (4 valeurs)

**Usage** : Niveau de gravité erreurs techniques

**Valeurs** :
```sql
CREATE TYPE error_severity_enum AS ENUM (
  'critical',   -- 1. Critique (bloque l'utilisation)
  'high',       -- 2. Haute (impact majeur)
  'medium',     -- 3. Moyenne (impact modéré)
  'low'         -- 4. Basse (cosmétique)
);
```

**Tables Utilisatrices** : `error_reports_v2`

---

### 8. ERROR_STATUS_ENUM (4 valeurs)

**Usage** : Statut résolution erreurs

**Valeurs** :
```sql
CREATE TYPE error_status_enum AS ENUM (
  'open',         -- 1. Ouvert
  'in_progress',  -- 2. En cours de résolution
  'resolved',     -- 3. Résolu
  'closed'        -- 4. Fermé
);
```

**Tables Utilisatrices** : `error_reports_v2`, `mcp_resolution_queue`

---

### 9. ERROR_TYPE_ENUM (7 valeurs)

**Usage** : Catégorisation erreurs techniques

**Valeurs** :
```sql
CREATE TYPE error_type_enum AS ENUM (
  'javascript_error',    -- 1. Erreur JavaScript
  'network_error',       -- 2. Erreur réseau
  'ui_bug',              -- 3. Bug interface
  'performance_issue',   -- 4. Problème performance
  'console_error',       -- 5. Erreur console
  'data_validation',     -- 6. Validation données
  'functional_bug'       -- 7. Bug fonctionnel
);
```

**Tables Utilisatrices** : `error_reports_v2`

---

### 10. FEED_EXPORT_STATUS_TYPE (5 valeurs)

**Usage** : Statut exports feeds (Google Merchant, Facebook)

**Valeurs** :
```sql
CREATE TYPE feed_export_status_type AS ENUM (
  'pending',      -- 1. En attente
  'processing',   -- 2. En cours de génération
  'completed',    -- 3. Terminé avec succès
  'failed',       -- 4. Échec
  'cancelled'     -- 5. Annulé
);
```

**Tables Utilisatrices** : `feed_exports`

---

### 11. FEED_FORMAT_TYPE (3 valeurs)

**Usage** : Format de sortie feeds

**Valeurs** :
```sql
CREATE TYPE feed_format_type AS ENUM (
  'csv',    -- 1. CSV (Google Merchant)
  'xml',    -- 2. XML (Facebook, Google)
  'json'    -- 3. JSON (API custom)
);
```

**Tables Utilisatrices** : `feed_configs`

---

### 12. FEED_PLATFORM_TYPE (3 valeurs)

**Usage** : Plateformes cibles pour feeds produits

**Valeurs** :
```sql
CREATE TYPE feed_platform_type AS ENUM (
  'google_merchant',  -- 1. Google Merchant Center
  'facebook_meta',    -- 2. Facebook/Meta Catalog
  'custom'            -- 3. Feed personnalisé
);
```

**Tables Utilisatrices** : `feed_configs`

---

### 13. IMAGE_TYPE_ENUM (5 valeurs)

**Usage** : Types d'images produits

**Valeurs** :
```sql
CREATE TYPE image_type_enum AS ENUM (
  'primary',     -- 1. Image principale
  'gallery',     -- 2. Galerie produit
  'technical',   -- 3. Schéma technique
  'lifestyle',   -- 4. Photo lifestyle/ambiance
  'thumbnail'    -- 5. Miniature
);
```

**Tables Utilisatrices** : `product_images`

---

### 14. LANGUAGE_TYPE (3 valeurs)

**Usage** : Langues supportées pour traductions

**Valeurs** :
```sql
CREATE TYPE language_type AS ENUM (
  'fr',  -- 1. Français
  'en',  -- 2. Anglais
  'pt'   -- 3. Portugais
);
```

**Tables Utilisatrices** : `category_translations`, `collection_translations`

---

### 15. MATCHING_STATUS (5 valeurs)

**Usage** : Statut rapprochement bancaire

**Valeurs** :
```sql
CREATE TYPE matching_status AS ENUM (
  'unmatched',       -- 1. Non rapproché
  'auto_matched',    -- 2. Rapproché automatiquement
  'manual_matched',  -- 3. Rapproché manuellement
  'partial_matched', -- 4. Partiellement rapproché
  'ignored'          -- 5. Ignoré
);
```

**Tables Utilisatrices** : `bank_transactions`

---

### 16. MOVEMENT_TYPE (4 valeurs)

**Usage** : Types de mouvements de stock

**Valeurs** :
```sql
CREATE TYPE movement_type AS ENUM (
  'IN',        -- 1. Entrée de stock
  'OUT',       -- 2. Sortie de stock
  'ADJUST',    -- 3. Ajustement/correction
  'TRANSFER'   -- 4. Transfert entre emplacements
);
```

**Tables Utilisatrices** : `stock_movements`

  **CRITIQUE** : Utilisé par trigger `maintain_stock_totals()` pour calculs stock_real/forecasted

---

### 17. ORGANISATION_TYPE (4 valeurs)

**Usage** : Type d'organisation (table polymorphe organisations)

**Valeurs** :
```sql
CREATE TYPE organisation_type AS ENUM (
  'internal',   -- 1. Organisation interne
  'supplier',   -- 2. Fournisseur
  'customer',   -- 3. Client B2B
  'partner'     -- 4. Partenaire commercial
);
```

**Tables Utilisatrices** : `organisations`

  **ANTI-HALLUCINATION** :
- L JAMAIS créer table `suppliers` (utiliser `organisations WHERE type='supplier'`)
- L JAMAIS créer table `customers` (utiliser `organisations WHERE type='customer'` + `individual_customers`)

---

### 18. PACKAGE_TYPE (4 valeurs)

**Usage** : Types de conditionnement produits

**Valeurs** :
```sql
CREATE TYPE package_type AS ENUM (
  'single',  -- 1. Unité simple
  'pack',    -- 2. Pack multi-produits
  'bulk',    -- 3. Vrac/en gros
  'custom'   -- 4. Conditionnement personnalisé
);
```

**Tables Utilisatrices** : `product_packages`

---

### 19. PURCHASE_ORDER_STATUS (6 valeurs)

**Usage** : Workflow commandes fournisseurs

**Valeurs** :
```sql
CREATE TYPE purchase_order_status AS ENUM (
  'draft',               -- 1. Brouillon
  'sent',                -- 2. Envoyé au fournisseur
  'confirmed',           -- 3. Confirmé par fournisseur
  'partially_received',  -- 4. Partiellement reçu
  'received',            -- 5. Complètement reçu
  'cancelled'            -- 6. Annulé
);
```

**Tables Utilisatrices** : `purchase_orders`

---

### 20. PURCHASE_TYPE (3 valeurs)

**Usage** : Mode d'achat produits

**Valeurs** :
```sql
CREATE TYPE purchase_type AS ENUM (
  'dropshipping',  -- 1. Dropshipping direct
  'stock',         -- 2. Achat en stock
  'on_demand'      -- 3. À la demande
);
```

**Tables Utilisatrices** : `purchase_orders`

---

### 21. ROOM_TYPE (30 valeurs)

**Usage** : Types de pièces pour catégorisation mobilier

**Valeurs** :
```sql
CREATE TYPE room_type AS ENUM (
  'salon',             -- 1. Salon
  'salle_a_manger',    -- 2. Salle à manger
  'chambre',           -- 3. Chambre
  'bureau',            -- 4. Bureau
  'bibliotheque',      -- 5. Bibliothèque
  'salon_sejour',      -- 6. Salon-séjour
  'cuisine',           -- 7. Cuisine
  'salle_de_bain',     -- 8. Salle de bain
  'wc',                -- 9. WC
  'toilettes',         -- 10. Toilettes
  'hall_entree',       -- 11. Hall d'entrée
  'couloir',           -- 12. Couloir
  'cellier',           -- 13. Cellier
  'buanderie',         -- 14. Buanderie
  'dressing',          -- 15. Dressing
  'cave',              -- 16. Cave
  'grenier',           -- 17. Grenier
  'garage',            -- 18. Garage
  'terrasse',          -- 19. Terrasse
  'balcon',            -- 20. Balcon
  'jardin',            -- 21. Jardin
  'veranda',           -- 22. Véranda
  'loggia',            -- 23. Loggia
  'cour',              -- 24. Cour
  'patio',             -- 25. Patio
  'salle_de_jeux',     -- 26. Salle de jeux
  'salle_de_sport',    -- 27. Salle de sport
  'atelier',           -- 28. Atelier
  'mezzanine',         -- 29. Mezzanine
  'sous_sol'           -- 30. Sous-sol
);
```

**Tables Utilisatrices** : `products`, `categories`

---

### 22. SALES_ORDER_STATUS (6 valeurs)

**Usage** : Workflow commandes clients

**Valeurs** :
```sql
CREATE TYPE sales_order_status AS ENUM (
  'draft',               -- 1. Brouillon
  'confirmed',           -- 2. Confirmé
  'partially_shipped',   -- 3. Partiellement expédié
  'shipped',             -- 4. Expédié
  'delivered',           -- 5. Livré
  'cancelled'            -- 6. Annulé
);
```

**Tables Utilisatrices** : `sales_orders`

---

### 23. SAMPLE_REQUEST_STATUS_TYPE (3 valeurs)

**Usage** : Workflow validation demandes échantillons

**Valeurs** :
```sql
CREATE TYPE sample_request_status_type AS ENUM (
  'pending_approval',  -- 1. En attente validation
  'approved',          -- 2. Approuvé
  'rejected'           -- 3. Rejeté
);
```

**Tables Utilisatrices** : `sample_requests` (workflow sourcing)

---

### 24. SAMPLE_STATUS_TYPE (7 valeurs)

**Usage** : Statut échantillons produits (workflow sourcing)

**Valeurs** :
```sql
CREATE TYPE sample_status_type AS ENUM (
  'not_required',       -- 1. Échantillon non requis
  'request_pending',    -- 2. Demande en attente
  'request_approved',   -- 3. Demande approuvée
  'ordered',            -- 4. Commandé
  'delivered',          -- 5. Livré
  'approved',           -- 6. Validé (OK pour catalogue)
  'rejected'            -- 7. Rejeté (KO)
);
```

**Tables Utilisatrices** : `products`, `product_drafts`

---

### 25. SCHEDULE_FREQUENCY_TYPE (4 valeurs)

**Usage** : Fréquence exports feeds automatisés

**Valeurs** :
```sql
CREATE TYPE schedule_frequency_type AS ENUM (
  'manual',   -- 1. Manuel uniquement
  'daily',    -- 2. Quotidien
  'weekly',   -- 3. Hebdomadaire
  'monthly'   -- 4. Mensuel
);
```

**Tables Utilisatrices** : `feed_configs`

---

### 26. SHIPMENT_TYPE (2 valeurs)

**Usage** : Type d'expédition

**Valeurs** :
```sql
CREATE TYPE shipment_type AS ENUM (
  'parcel',  -- 1. Colis (standard)
  'pallet'   -- 2. Palette
);
```

**Tables Utilisatrices** : `shipments`

---

### 27. SHIPPING_METHOD (4 valeurs)

**Usage** : Méthodes d'expédition supportées

**Valeurs** :
```sql
CREATE TYPE shipping_method AS ENUM (
  'packlink',       -- 1. Packlink API
  'mondial_relay',  -- 2. Mondial Relay
  'chronotruck',    -- 3. Chronotruck
  'manual'          -- 4. Manuel
);
```

**Tables Utilisatrices** : `shipments`

---

### 28. SOURCING_STATUS_TYPE (4 valeurs)

**Usage** : Workflow sourcing produits

**Valeurs** :
```sql
CREATE TYPE sourcing_status_type AS ENUM (
  'draft',                  -- 1. Brouillon sourcing
  'sourcing_validated',     -- 2. Sourcing validé
  'ready_for_catalog',      -- 3. Prêt pour catalogue
  'archived'                -- 4. Archivé
);
```

**Tables Utilisatrices** : `product_drafts` (workflow sourcing)

---

### 29. STOCK_REASON_CODE (25 valeurs)

**Usage** : Codes motifs mouvements de stock (traçabilité complète)

**Valeurs** :
```sql
CREATE TYPE stock_reason_code AS ENUM (
  -- SORTIES STOCK (OUT)
  'sale',                   -- 1. Vente client
  'transfer_out',           -- 2. Transfert sortant
  'damage_transport',       -- 3. Dommage transport
  'damage_handling',        -- 4. Dommage manutention
  'damage_storage',         -- 5. Dommage stockage
  'theft',                  -- 6. Vol
  'loss_unknown',           -- 7. Perte origine inconnue
  'sample_client',          -- 8. Échantillon client
  'sample_showroom',        -- 9. Échantillon showroom
  'marketing_event',        -- 10. Événement marketing
  'photography',            -- 11. Photographie produit
  'rd_testing',             -- 12. Tests R&D
  'prototype',              -- 13. Prototype
  'quality_control',        -- 14. Contrôle qualité
  'return_supplier',        -- 15. Retour fournisseur
  'return_customer',        -- 16. Retour client
  'warranty_replacement',   -- 17. Remplacement garantie

  -- ENTRÉES STOCK (IN)
  'purchase_reception',     -- 21. Réception achat
  'return_from_client',     -- 22. Retour client
  'found_inventory',        -- 23. Trouvé inventaire

  -- AJUSTEMENTS (ADJUST)
  'inventory_correction',   -- 18. Correction inventaire
  'write_off',              -- 19. Dépréciation
  'obsolete',               -- 20. Obsolète
  'manual_adjustment',      -- 24. Ajustement manuel

  -- ANNULATIONS
  'cancelled'               -- 25. Annulé
);
```

**Tables Utilisatrices** : `stock_movements`

  **CRITIQUE** : Utilisé pour traçabilité complète et analytics stock

---

### 30. SUPPLIER_SEGMENT_TYPE (5 valeurs)

**Usage** : Segmentation fournisseurs (stratégie approvisionnement)

**Valeurs** :
```sql
CREATE TYPE supplier_segment_type AS ENUM (
  'strategic',  -- 1. Stratégique (partenaire clé)
  'preferred',  -- 2. Préféré (bon fournisseur)
  'approved',   -- 3. Approuvé (standard)
  'commodity',  -- 4. Commodité (générique)
  'artisan'     -- 5. Artisan (unique/spécialisé)
);
```

**Tables Utilisatrices** : `organisations WHERE type='supplier'`

---

### 31. TEST_STATUS_ENUM (4 valeurs)

**Usage** : Statut résultats tests manuels

**Valeurs** :
```sql
CREATE TYPE test_status_enum AS ENUM (
  'pending',  -- 1. En attente
  'passed',   -- 2. Réussi
  'failed',   -- 3. Échoué
  'warning'   -- 4. Avertissement
);
```

**Tables Utilisatrices** : `manual_tests_progress`

---

### 32. TRANSACTION_SIDE (2 valeurs)

**Usage** : Sens transaction bancaire

**Valeurs** :
```sql
CREATE TYPE transaction_side AS ENUM (
  'credit',  -- 1. Crédit (entrée d'argent)
  'debit'    -- 2. Débit (sortie d'argent)
);
```

**Tables Utilisatrices** : `bank_transactions`

---

### 33. USER_ROLE_TYPE (5 valeurs)

**Usage** : Rôles utilisateurs système (RLS policies)

**Valeurs** :
```sql
CREATE TYPE user_role_type AS ENUM (
  'owner',             -- 1. Propriétaire (tous droits)
  'admin',             -- 2. Administrateur (quasi tous droits)
  'catalog_manager',   -- 3. Gestionnaire catalogue
  'sales',             -- 4. Commercial
  'partner_manager'    -- 5. Gestionnaire partenaires
);
```

**Tables Utilisatrices** : `user_profiles`

  **CRITIQUE** : Utilisé par fonction `get_user_role()` dans 217 RLS policies

---

### 34. USER_TYPE (4 valeurs)

**Usage** : Type d'utilisateur système

**Valeurs** :
```sql
CREATE TYPE user_type AS ENUM (
  'staff',     -- 1. Employé interne
  'supplier',  -- 2. Fournisseur
  'customer',  -- 3. Client
  'partner'    -- 4. Partenaire
);
```

**Tables Utilisatrices** : `user_profiles`

---

##   RÈGLES MODIFICATION ENUMS

### =« INTERDICTIONS

1. **JAMAIS supprimer valeur enum existante** (breaking change production)
2. **JAMAIS renommer valeur enum** (breaking change application)
3. **JAMAIS modifier ordre sans migration** (peut affecter tri)

###  BONNES PRATIQUES

1. **Ajouter nouvelles valeurs** : Migration + ALTER TYPE ADD VALUE
2. **Déprécier valeur** : Documenter + empêcher nouvelle utilisation
3. **Remplacer enum** : Créer nouveau type + migration progressive

### =Ý TEMPLATE AJOUT VALEUR

```sql
-- Migration: 20251017_001_add_new_status_to_enum.sql

-- Ajouter nouvelle valeur à la fin (sauf si ordre critique)
ALTER TYPE sales_order_status ADD VALUE 'returned';

-- Si ordre important, créer nouveau type + migration
CREATE TYPE sales_order_status_v2 AS ENUM (
  'draft',
  'confirmed',
  'returned',              -- NOUVELLE VALEUR
  'partially_shipped',
  'shipped',
  'delivered',
  'cancelled'
);

-- Migrer données puis swap
ALTER TABLE sales_orders RENAME COLUMN status TO status_old;
ALTER TABLE sales_orders ADD COLUMN status sales_order_status_v2;
UPDATE sales_orders SET status = status_old::text::sales_order_status_v2;
ALTER TABLE sales_orders DROP COLUMN status_old;

-- Supprimer ancien type
DROP TYPE sales_order_status;
ALTER TYPE sales_order_status_v2 RENAME TO sales_order_status;
```

---

## = LIENS CONNEXES

- **Tables** : [SCHEMA-REFERENCE.md](./SCHEMA-REFERENCE.md)
- **Foreign Keys** : [foreign-keys.md](./foreign-keys.md)
- **Triggers** : [triggers.md](./triggers.md)
- **RLS Policies** : [rls-policies.md](./rls-policies.md)
- **Functions** : [functions-rpc.md](./functions-rpc.md)

---

**Documentation générée** : 2025-10-17
**Source** : PostgreSQL Database `aorroydfjsrygmosnzrl`
**Extraction** : MCP Supabase + Bash PostgreSQL
**Vérone Back Office** - Database Documentation v2.0
