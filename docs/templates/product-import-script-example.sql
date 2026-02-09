-- =============================================================================
-- TEMPLATE SCRIPT IMPORT PRODUITS
-- =============================================================================
--
-- Instructions :
-- 1. Copier ce template
-- 2. Remplacer les valeurs entre <PLACEHOLDERS>
-- 3. Vérifier les UUIDs (fournisseur, sous-catégorie)
-- 4. Calculer les poids unitaires depuis la facture
-- 5. Définir les pièces adaptées selon le type de produit
-- 6. Exécuter dans une transaction (BEGIN/COMMIT)
--
-- Version : 1.0.0 (2026-02-08)
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- Facture : <NUMERO_FACTURE> (<DATE_FACTURE>)
-- Fournisseur : <NOM_FOURNISSEUR>
-- Nombre de produits : <NOMBRE>
-- -----------------------------------------------------------------------------

-- Produit 1
INSERT INTO products (
  -- OBLIGATOIRES
  sku,
  name,
  stock_status,
  product_status,
  article_type,

  -- CRITIQUES (Recommandés Fortement)
  supplier_id,
  subcategory_id,
  supplier_reference,
  brand,
  weight,
  dimensions,
  variant_attributes,
  cost_price,
  style,
  suitable_rooms,
  stock_real,
  supplier_moq,

  -- OPTIONNELS (Confort)
  gtin,
  condition,
  product_type,
  completion_status
)
VALUES (
  -- OBLIGATOIRES
  '<CAT-NNNN>',                                   -- sku (ex: VAS-0032)
  '<Nom du Produit>',                             -- name
  'out_of_stock',                                  -- stock_status
  'active',                                        -- product_status
  'vente_de_marchandises',                        -- article_type

  -- CRITIQUES
  '<uuid-fournisseur>',                           -- supplier_id
  '<uuid-subcategory>',                           -- subcategory_id
  '<REF-FOURNISSEUR>',                            -- supplier_reference
  '<MARQUE>',                                     -- brand
  <POIDS_KG>,                                     -- weight (calculé: poids_net / quantité)
  '{"width_cm": <L>, "height_cm": <H>, "length_cm": <P>}'::jsonb,  -- dimensions
  '{"color": "<COULEUR>", "material": "<MATIERE>"}'::jsonb,        -- variant_attributes
  <PRIX_ACHAT_HT>,                               -- cost_price
  '<STYLE>',                                     -- style (ex: contemporain)
  ARRAY[<LISTE_PIECES>]::room_type[],           -- suitable_rooms
  <STOCK_INITIAL>,                               -- stock_real (défaut: 0)
  <MOQ>,                                         -- supplier_moq (défaut: 1)

  -- OPTIONNELS
  '<EAN13>',                                     -- gtin (si disponible, sinon NULL)
  'new',                                         -- condition
  'standard',                                    -- product_type
  'draft'                                        -- completion_status
);

-- Produit 2 (répéter le pattern)
-- INSERT INTO products (...) VALUES (...);

-- Produit N
-- INSERT INTO products (...) VALUES (...);

COMMIT;

-- -----------------------------------------------------------------------------
-- VÉRIFICATION POST-IMPORT
-- -----------------------------------------------------------------------------

-- Vérifier que tous les produits ont été insérés correctement
SELECT
  sku,
  name,
  CASE WHEN weight IS NULL THEN '❌ MANQUANT' ELSE '✅ ' || weight || ' kg' END as poids,
  CASE WHEN style IS NULL THEN '❌ MANQUANT' ELSE '✅ ' || style END as style,
  CASE
    WHEN suitable_rooms IS NULL OR array_length(suitable_rooms, 1) IS NULL THEN '❌ VIDE'
    ELSE '✅ ' || array_length(suitable_rooms, 1) || ' pièces'
  END as pieces,
  completion_percentage
FROM products
WHERE sku IN (
  '<CAT-NNNN>',  -- Lister tous les SKUs importés
  '<CAT-NNNN>',
  '<CAT-NNNN>'
)
ORDER BY sku;

-- =============================================================================
-- EXEMPLE COMPLET : Import Facture Opjet 20145539
-- =============================================================================

/*
BEGIN;

-- Facture : 20145539 (29/10/2024)
-- Fournisseur : Opjet
-- Nombre de produits : 17

-- Produit 1 : Bout de canapé Bibi bleu vert doux
INSERT INTO products (
  sku, name, stock_status, product_status, article_type,
  supplier_id, subcategory_id, supplier_reference, brand,
  weight, dimensions, variant_attributes,
  cost_price, style, suitable_rooms, stock_real, supplier_moq,
  gtin, condition, product_type, completion_status
)
VALUES (
  'TAB-0004',
  'Bout de canapé Bibi bleu vert doux',
  'out_of_stock',
  'active',
  'vente_de_marchandises',

  '9078f112-6944-4732-b926-f64dcef66034',  -- Opjet
  'uuid-subcategory-tables',
  '017145',
  'OPJET',
  4.5,  -- Calculé: 4.5kg net / 1 unité
  '{"width_cm": 40, "height_cm": 45, "length_cm": 40}'::jsonb,
  '{"color": "Bleu vert doux", "material": "bois"}'::jsonb,
  89.90,
  'contemporain',
  ARRAY['salon', 'salon_sejour', 'chambre', 'bureau']::room_type[],
  0,
  1,

  '3460000001234',
  'new',
  'standard',
  'draft'
);

-- Produit 2 : Fauteuil Walter blanc pivotant
INSERT INTO products (
  sku, name, stock_status, product_status, article_type,
  supplier_id, subcategory_id, supplier_reference, brand,
  weight, dimensions, variant_attributes,
  cost_price, style, suitable_rooms, stock_real, supplier_moq,
  gtin, condition, product_type, completion_status
)
VALUES (
  'FAU-0001',
  'Fauteuil Walter blanc pivotant',
  'out_of_stock',
  'active',
  'vente_de_marchandises',

  '9078f112-6944-4732-b926-f64dcef66034',  -- Opjet
  'uuid-subcategory-fauteuils',
  '016515',
  'OPJET',
  15.5,  -- Calculé: 31kg net / 2 unités
  '{"width_cm": 65, "height_cm": 85, "length_cm": 70}'::jsonb,
  '{"color": "Blanc", "material": "tissu"}'::jsonb,
  245.00,
  'contemporain',
  ARRAY['salon', 'salon_sejour', 'chambre', 'bureau', 'bibliotheque']::room_type[],
  0,
  2,

  NULL,
  'new',
  'standard',
  'draft'
);

-- ... (autres produits)

COMMIT;

-- Vérification
SELECT
  sku, name,
  CASE WHEN weight IS NULL THEN '❌ MANQUANT' ELSE '✅ ' || weight || ' kg' END as poids,
  CASE WHEN style IS NULL THEN '❌ MANQUANT' ELSE '✅ ' || style END as style,
  completion_percentage
FROM products
WHERE sku IN ('TAB-0004', 'FAU-0001')
ORDER BY sku;
*/

-- =============================================================================
-- AIDE-MÉMOIRE : Calcul Poids Unitaire
-- =============================================================================

/*
Poids unitaire (kg) = Poids net facture / Quantité commandée

Exemples :
- 1 lampe, poids net facture = 1.45 kg  → Poids unitaire = 1.45 kg
- 4 lampes, poids net facture = 5.8 kg → Poids unitaire = 5.8 / 4 = 1.45 kg
- 2 fauteuils, poids net facture = 31 kg → Poids unitaire = 31 / 2 = 15.5 kg
*/

-- =============================================================================
-- AIDE-MÉMOIRE : Pièces Adaptées par Type
-- =============================================================================

/*
Fauteuils / Chaises :
ARRAY['salon', 'salle_a_manger', 'bureau', 'chambre', 'salon_sejour']::room_type[]

Tables / Consoles :
ARRAY['salon', 'salle_a_manger', 'hall_entree', 'couloir', 'bureau']::room_type[]

Lampes :
ARRAY['salon', 'chambre', 'bureau', 'salle_a_manger', 'hall_entree', 'couloir', 'salon_sejour']::room_type[]

Vases / Déco :
ARRAY['salon', 'salle_a_manger', 'chambre', 'cuisine', 'salle_de_bain', 'bureau', 'bibliotheque', 'salon_sejour', 'hall_entree', 'terrasse', 'balcon', 'jardin', 'veranda', 'patio']::room_type[]

Miroirs :
ARRAY['hall_entree', 'salle_de_bain', 'chambre', 'salon', 'couloir', 'dressing']::room_type[]

Bancs :
ARRAY['hall_entree', 'chambre', 'salon', 'salle_a_manger', 'couloir']::room_type[]
*/

-- =============================================================================
-- REQUÊTES UTILES
-- =============================================================================

-- Obtenir UUID d'un fournisseur
-- SELECT id, name FROM suppliers WHERE name ILIKE '%opjet%';

-- Obtenir UUID d'une sous-catégorie
-- SELECT id, name FROM subcategories WHERE name ILIKE '%vases%';

-- Obtenir dernier SKU d'une catégorie
-- SELECT sku FROM products WHERE sku LIKE 'VAS-%' ORDER BY sku DESC LIMIT 1;

-- Vérifier complétude d'un produit
-- SELECT sku, name, completion_percentage FROM products WHERE sku = 'VAS-0032';
