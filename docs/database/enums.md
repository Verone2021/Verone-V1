# <� Enums PostgreSQL - V�rone Database

**Source de v�rit� pour tous les types ENUM** utilis�s dans la base de donn�es V�rone.

---

## 📊 STATISTIQUES GLOBALES

- **Total Types Enum** : 36 types (+2 nouveaux: stock_status_type, product_status_type)
- **Total Valeurs** : 201 valeurs (+7: 3 stock_status + 4 product_status)
- **Dernière Mise à Jour** : 2025-11-04 (Refonte système dual status produits)
- **Date Extraction Initiale** : 2025-10-17
- **Project** : aorroydfjsrygmosnzrl

---

## =� INDEX DES ENUMS PAR MODULE

### Module Produits & Catalogue (11 enums)

1. `availability_status_type` (8 valeurs) ⚠️ DEPRECATED - Remplacé par stock_status_type + product_status_type
2. **`stock_status_type` (3 valeurs) - NOUVEAU 2025-11-04**
3. **`product_status_type` (4 valeurs) - NOUVEAU 2025-11-04**
4. `availability_type_enum` (4 valeurs)
5. `image_type_enum` (5 valeurs)
6. `package_type` (4 valeurs)
7. `room_type` (30 valeurs)
8. `sourcing_status_type` (4 valeurs)
9. `sample_status_type` (7 valeurs)
10. `sample_request_status_type` (3 valeurs)
11. `language_type` (3 valeurs)

### Module Commandes & Ventes (3 enums)

1. `sales_order_status` (6 valeurs)
2. `purchase_order_status` (6 valeurs)
3. `purchase_type` (3 valeurs)

### Module Stock & Logistique (4 enums)

1. `movement_type` (4 valeurs)
2. `stock_reason_code` (25 valeurs)
3. `shipment_type` (2 valeurs)
4. `shipping_method` (4 valeurs)

### Module Finance & Comptabilit� (5 enums)

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

### Module Technique & Syst�me (6 enums)

1. `error_severity_enum` (4 valeurs)
2. `error_status_enum` (4 valeurs)
3. `error_type_enum` (7 valeurs)
4. `test_status_enum` (4 valeurs)
5. `matching_status` (5 valeurs)
6. `schedule_frequency_type` (4 valeurs)

---

## =

ENUMS D�TAILL�S

### 1. AVAILABILITY_STATUS_TYPE (8 valeurs)

**Usage** : Statut de disponibilit� des produits (produits sourcing/catalogue)

**Valeurs** :

```sql
CREATE TYPE availability_status_type AS ENUM (
  'in_stock',                    -- 1. En stock disponible
  'out_of_stock',                -- 2. Rupture de stock
  'preorder',                    -- 3. Pr�commande
  'coming_soon',                 -- 4. Bient�t disponible
  'discontinued',                -- 5. Arr�t�/abandonn�
  'sourcing',                    -- 6. En cours de sourcing
  'pret_a_commander',            -- 7. Pr�t � commander
  'echantillon_a_commander'      -- 8. �chantillon � commander
);
```

**Tables Utilisatrices** : `products` (colonne `status_deprecated`)

**⚠️ DEPRECATED** : Ce type ENUM est obsolète depuis le 2025-11-04. Il a été remplacé par le système dual status :

- `stock_status_type` pour la disponibilité stock (automatique)
- `product_status_type` pour le statut commercial (manuel)

Voir migration `20251104_100_refonte_statuts_produits_stock_commercial.sql` et documentation complète dans [status-dual-system.md](../business-rules/04-produits/catalogue/products/status-dual-system.md)

---

### 2. STOCK_STATUS_TYPE (3 valeurs) 🆕

**Date Création** : 2025-11-04
**Usage** : Statut stock automatique calculé par trigger selon stock réel et prévisionnel
**Modification** : AUTOMATIQUE UNIQUEMENT (trigger `calculate_stock_status_trigger`)

**Valeurs** :

```sql
CREATE TYPE stock_status_type AS ENUM (
  'in_stock',      -- 1. Stock disponible (stock_real > 0)
  'out_of_stock',  -- 2. Aucun stock (stock_real = 0 AND stock_forecasted_in = 0)
  'coming_soon'    -- 3. Commande fournisseur en cours (stock_real = 0 AND stock_forecasted_in > 0)
);
```

**Tables Utilisatrices** : `products` (colonne `stock_status`)

**Business Rules** :

- Calculé automatiquement via trigger `trg_calculate_stock_status`
- Exécuté BEFORE INSERT OR UPDATE OF stock_real, stock_forecasted_in, product_status
- Produits `draft` forcés à `out_of_stock` même si stock physique existe
- Impossible de modifier manuellement (recalcul immédiat par trigger)

**Trigger Logic** :

```sql
IF product_status = 'draft' THEN
    stock_status := 'out_of_stock'
ELSIF stock_real > 0 THEN
    stock_status := 'in_stock'
ELSIF COALESCE(stock_forecasted_in, 0) > 0 THEN
    stock_status := 'coming_soon'
ELSE
    stock_status := 'out_of_stock'
END IF
```

**Affichage UI** :

- `in_stock` → Badge vert "En stock"
- `out_of_stock` → Badge rouge "Rupture"
- `coming_soon` → Badge bleu "Bientôt"

---

### 3. PRODUCT_STATUS_TYPE (4 valeurs) 🆕

**Date Création** : 2025-11-04
**Usage** : Statut commercial manuel indépendant du stock
**Modification** : MANUELLE (modifiable par utilisateurs Owner/Admin)

**Valeurs** :

```sql
CREATE TYPE product_status_type AS ENUM (
  'active',        -- 1. Produit actif normal dans le catalogue
  'preorder',      -- 2. Produit en précommande (disponible sous 2-8 semaines)
  'discontinued',  -- 3. Produit arrêté du catalogue (fin de vie)
  'draft'          -- 4. Produit en cours de sourcing (non publié)
);
```

**Tables Utilisatrices** : `products` (colonne `product_status`)

**Business Rules** :

- INDÉPENDANT du stock_status (peut coexister toute combinaison)
- Produits `draft` forcent stock_status = 'out_of_stock' (via trigger)
- Alertes stock uniquement pour `product_status = 'active'`
- Filtres dashboard excluent `discontinued` et `draft` par défaut

**Exemples Combinaisons** :
| product_status | stock_status | Affichage UI | Cas d'usage |
|----------------|--------------|--------------|-------------|
| active | in_stock | 🟢 En stock | Produit normal disponible |
| active | out_of_stock | 🔴 Rupture | Produit actif mais stock épuisé |
| preorder | coming_soon | 🔵 Bientôt + 🟣 Précommande | Précommande avec commande fournisseur |
| discontinued | in_stock | 🟢 En stock + ⚫ Arrêté | Fin de série, dernières pièces |
| draft | out_of_stock | 🔴 Rupture + 🟠 Brouillon | Produit sourcing (forcé) |

**Affichage UI** :

- Badge affiché UNIQUEMENT si `!= 'active'`
- `preorder` → Badge violet "Précommande"
- `discontinued` → Badge gris "Arrêté"
- `draft` → Badge orange "Brouillon"

---

### 4. AVAILABILITY_TYPE_ENUM (4 valeurs)

**Usage** : Type de disponibilit� simple

**Valeurs** :

```sql
CREATE TYPE availability_type_enum AS ENUM (
  'normal',         -- 1. Disponibilit� normale
  'preorder',       -- 2. Pr�commande
  'coming_soon',    -- 3. Bient�t disponible
  'discontinued'    -- 4. Arr�t�
);
```

---

### 3. BANK_PROVIDER (2 valeurs)

**Usage** : Banques support�es pour synchronisation bancaire

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
  'sent',             -- 2. Envoy�
  'received',         -- 3. Re�u
  'paid',             -- 4. Pay�
  'partially_paid',   -- 5. Partiellement pay�
  'overdue',          -- 6. En retard
  'cancelled',        -- 7. Annul�
  'refunded'          -- 8. Rembours�
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

**Usage** : Niveau de gravit� erreurs techniques

**Valeurs** :

```sql
CREATE TYPE error_severity_enum AS ENUM (
  'critical',   -- 1. Critique (bloque l'utilisation)
  'high',       -- 2. Haute (impact majeur)
  'medium',     -- 3. Moyenne (impact mod�r�)
  'low'         -- 4. Basse (cosm�tique)
);
```

**Tables Utilisatrices** : `error_reports_v2`

---

### 8. ERROR_STATUS_ENUM (4 valeurs)

**Usage** : Statut r�solution erreurs

**Valeurs** :

```sql
CREATE TYPE error_status_enum AS ENUM (
  'open',         -- 1. Ouvert
  'in_progress',  -- 2. En cours de r�solution
  'resolved',     -- 3. R�solu
  'closed'        -- 4. Ferm�
);
```

**Tables Utilisatrices** : `error_reports_v2`, `mcp_resolution_queue`

---

### 9. ERROR_TYPE_ENUM (7 valeurs)

**Usage** : Cat�gorisation erreurs techniques

**Valeurs** :

```sql
CREATE TYPE error_type_enum AS ENUM (
  'javascript_error',    -- 1. Erreur JavaScript
  'network_error',       -- 2. Erreur r�seau
  'ui_bug',              -- 3. Bug interface
  'performance_issue',   -- 4. Probl�me performance
  'console_error',       -- 5. Erreur console
  'data_validation',     -- 6. Validation donn�es
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
  'processing',   -- 2. En cours de g�n�ration
  'completed',    -- 3. Termin� avec succ�s
  'failed',       -- 4. �chec
  'cancelled'     -- 5. Annul�
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
  'custom'            -- 3. Feed personnalis�
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
  'technical',   -- 3. Sch�ma technique
  'lifestyle',   -- 4. Photo lifestyle/ambiance
  'thumbnail'    -- 5. Miniature
);
```

**Tables Utilisatrices** : `product_images`

---

### 14. LANGUAGE_TYPE (3 valeurs)

**Usage** : Langues support�es pour traductions

**Valeurs** :

```sql
CREATE TYPE language_type AS ENUM (
  'fr',  -- 1. Fran�ais
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
  'unmatched',       -- 1. Non rapproch�
  'auto_matched',    -- 2. Rapproch� automatiquement
  'manual_matched',  -- 3. Rapproch� manuellement
  'partial_matched', -- 4. Partiellement rapproch�
  'ignored'          -- 5. Ignor�
);
```

**Tables Utilisatrices** : `bank_transactions`

---

### 16. MOVEMENT_TYPE (4 valeurs)

**Usage** : Types de mouvements de stock

**Valeurs** :

```sql
CREATE TYPE movement_type AS ENUM (
  'IN',        -- 1. Entr�e de stock
  'OUT',       -- 2. Sortie de stock
  'ADJUST',    -- 3. Ajustement/correction
  'TRANSFER'   -- 4. Transfert entre emplacements
);
```

**Tables Utilisatrices** : `stock_movements`

� **CRITIQUE** : Utilis� par trigger `maintain_stock_totals()` pour calculs stock_real/forecasted

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

� **ANTI-HALLUCINATION** :

- L JAMAIS cr�er table `suppliers` (utiliser `organisations WHERE type='supplier'`)
- L JAMAIS cr�er table `customers` (utiliser `organisations WHERE type='customer'` + `individual_customers`)

---

### 18. PACKAGE_TYPE (4 valeurs)

**Usage** : Types de conditionnement produits

**Valeurs** :

```sql
CREATE TYPE package_type AS ENUM (
  'single',  -- 1. Unit� simple
  'pack',    -- 2. Pack multi-produits
  'bulk',    -- 3. Vrac/en gros
  'custom'   -- 4. Conditionnement personnalis�
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
  'sent',                -- 2. Envoy� au fournisseur
  'confirmed',           -- 3. Confirm� par fournisseur
  'partially_received',  -- 4. Partiellement re�u
  'received',            -- 5. Compl�tement re�u
  'cancelled'            -- 6. Annul�
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
  'on_demand'      -- 3. � la demande
);
```

**Tables Utilisatrices** : `purchase_orders`

---

### 21. ROOM_TYPE (30 valeurs)

**Usage** : Types de pi�ces pour cat�gorisation mobilier

**Valeurs** :

```sql
CREATE TYPE room_type AS ENUM (
  'salon',             -- 1. Salon
  'salle_a_manger',    -- 2. Salle � manger
  'chambre',           -- 3. Chambre
  'bureau',            -- 4. Bureau
  'bibliotheque',      -- 5. Biblioth�que
  'salon_sejour',      -- 6. Salon-s�jour
  'cuisine',           -- 7. Cuisine
  'salle_de_bain',     -- 8. Salle de bain
  'wc',                -- 9. WC
  'toilettes',         -- 10. Toilettes
  'hall_entree',       -- 11. Hall d'entr�e
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
  'veranda',           -- 22. V�randa
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
  'confirmed',           -- 2. Confirm�
  'partially_shipped',   -- 3. Partiellement exp�di�
  'shipped',             -- 4. Exp�di�
  'delivered',           -- 5. Livr�
  'cancelled'            -- 6. Annul�
);
```

**Tables Utilisatrices** : `sales_orders`

---

### 23. SAMPLE_REQUEST_STATUS_TYPE (3 valeurs)

**Usage** : Workflow validation demandes �chantillons

**Valeurs** :

```sql
CREATE TYPE sample_request_status_type AS ENUM (
  'pending_approval',  -- 1. En attente validation
  'approved',          -- 2. Approuv�
  'rejected'           -- 3. Rejet�
);
```

**Tables Utilisatrices** : `sample_requests` (workflow sourcing)

---

### 24. SAMPLE_STATUS_TYPE (7 valeurs)

**Usage** : Statut �chantillons produits (workflow sourcing)

**Valeurs** :

```sql
CREATE TYPE sample_status_type AS ENUM (
  'not_required',       -- 1. �chantillon non requis
  'request_pending',    -- 2. Demande en attente
  'request_approved',   -- 3. Demande approuv�e
  'ordered',            -- 4. Command�
  'delivered',          -- 5. Livr�
  'approved',           -- 6. Valid� (OK pour catalogue)
  'rejected'            -- 7. Rejet� (KO)
);
```

**Tables Utilisatrices** : `products`, `product_drafts`

---

### 25. SCHEDULE_FREQUENCY_TYPE (4 valeurs)

**Usage** : Fr�quence exports feeds automatis�s

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

**Usage** : Type d'exp�dition

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

**Usage** : M�thodes d'exp�dition support�es

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
  'sourcing_validated',     -- 2. Sourcing valid�
  'ready_for_catalog',      -- 3. Pr�t pour catalogue
  'archived'                -- 4. Archiv�
);
```

**Tables Utilisatrices** : `product_drafts` (workflow sourcing)

---

### 29. STOCK_REASON_CODE (25 valeurs)

**Usage** : Codes motifs mouvements de stock (tra�abilit� compl�te)

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
  'sample_client',          -- 8. �chantillon client
  'sample_showroom',        -- 9. �chantillon showroom
  'marketing_event',        -- 10. �v�nement marketing
  'photography',            -- 11. Photographie produit
  'rd_testing',             -- 12. Tests R&D
  'prototype',              -- 13. Prototype
  'quality_control',        -- 14. Contr�le qualit�
  'return_supplier',        -- 15. Retour fournisseur
  'return_customer',        -- 16. Retour client
  'warranty_replacement',   -- 17. Remplacement garantie

  -- ENTR�ES STOCK (IN)
  'purchase_reception',     -- 21. R�ception achat
  'return_from_client',     -- 22. Retour client
  'found_inventory',        -- 23. Trouv� inventaire

  -- AJUSTEMENTS (ADJUST)
  'inventory_correction',   -- 18. Correction inventaire
  'write_off',              -- 19. D�pr�ciation
  'obsolete',               -- 20. Obsol�te
  'manual_adjustment',      -- 24. Ajustement manuel

  -- ANNULATIONS
  'cancelled'               -- 25. Annul�
);
```

**Tables Utilisatrices** : `stock_movements`

� **CRITIQUE** : Utilis� pour tra�abilit� compl�te et analytics stock

---

### 30. SUPPLIER_SEGMENT_TYPE (5 valeurs)

**Usage** : Segmentation fournisseurs (strat�gie approvisionnement)

**Valeurs** :

```sql
CREATE TYPE supplier_segment_type AS ENUM (
  'strategic',  -- 1. Strat�gique (partenaire cl�)
  'preferred',  -- 2. Pr�f�r� (bon fournisseur)
  'approved',   -- 3. Approuv� (standard)
  'commodity',  -- 4. Commodit� (g�n�rique)
  'artisan'     -- 5. Artisan (unique/sp�cialis�)
);
```

**Tables Utilisatrices** : `organisations WHERE type='supplier'`

---

### 31. TEST_STATUS_ENUM (4 valeurs)

**Usage** : Statut r�sultats tests manuels

**Valeurs** :

```sql
CREATE TYPE test_status_enum AS ENUM (
  'pending',  -- 1. En attente
  'passed',   -- 2. R�ussi
  'failed',   -- 3. �chou�
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
  'credit',  -- 1. Cr�dit (entr�e d'argent)
  'debit'    -- 2. D�bit (sortie d'argent)
);
```

**Tables Utilisatrices** : `bank_transactions`

---

### 33. USER_ROLE_TYPE (5 valeurs)

**Usage** : R�les utilisateurs syst�me (RLS policies)

**Valeurs** :

```sql
CREATE TYPE user_role_type AS ENUM (
  'owner',             -- 1. Propri�taire (tous droits)
  'admin',             -- 2. Administrateur (quasi tous droits)
  'catalog_manager',   -- 3. Gestionnaire catalogue
  'sales',             -- 4. Commercial
  'partner_manager'    -- 5. Gestionnaire partenaires
);
```

**Tables Utilisatrices** : `user_profiles`

� **CRITIQUE** : Utilis� par fonction `get_user_role()` dans 217 RLS policies

---

### 34. USER_TYPE (4 valeurs)

**Usage** : Type d'utilisateur syst�me

**Valeurs** :

```sql
CREATE TYPE user_type AS ENUM (
  'staff',     -- 1. Employ� interne
  'supplier',  -- 2. Fournisseur
  'customer',  -- 3. Client
  'partner'    -- 4. Partenaire
);
```

**Tables Utilisatrices** : `user_profiles`

---

## � R�GLES MODIFICATION ENUMS

### =� INTERDICTIONS

1. **JAMAIS supprimer valeur enum existante** (breaking change production)
2. **JAMAIS renommer valeur enum** (breaking change application)
3. **JAMAIS modifier ordre sans migration** (peut affecter tri)

###  BONNES PRATIQUES

1. **Ajouter nouvelles valeurs** : Migration + ALTER TYPE ADD VALUE
2. **D�pr�cier valeur** : Documenter + emp�cher nouvelle utilisation
3. **Remplacer enum** : Cr�er nouveau type + migration progressive

### =� TEMPLATE AJOUT VALEUR

```sql
-- Migration: 20251017_001_add_new_status_to_enum.sql

-- Ajouter nouvelle valeur � la fin (sauf si ordre critique)
ALTER TYPE sales_order_status ADD VALUE 'returned';

-- Si ordre important, cr�er nouveau type + migration
CREATE TYPE sales_order_status_v2 AS ENUM (
  'draft',
  'confirmed',
  'returned',              -- NOUVELLE VALEUR
  'partially_shipped',
  'shipped',
  'delivered',
  'cancelled'
);

-- Migrer donn�es puis swap
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

**Documentation g�n�r�e** : 2025-10-17
**Source** : PostgreSQL Database `aorroydfjsrygmosnzrl`
**Extraction** : MCP Supabase + Bash PostgreSQL
**V�rone Back Office** - Database Documentation v2.0
