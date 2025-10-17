-- Script pour ajouter des données de test
-- Exécuter après les migrations pour tester les fonctionnalités

-- Insérer des organisations de test (fournisseurs et clients)
INSERT INTO organisations (name, type, email, phone, address_line1, city, postal_code, country, is_active) VALUES
-- Fournisseurs
('Mobilier Premium SARL', 'supplier', 'contact@mobilier-premium.fr', '01.42.36.85.21', '45 Rue de la Paix', 'Paris', '75001', 'FR', true),
('Design Factory', 'supplier', 'orders@design-factory.com', '04.78.45.12.33', '12 Avenue des Arts', 'Lyon', '69002', 'FR', true),
('Artisan du Bois', 'supplier', 'info@artisan-bois.fr', '05.56.78.90.12', '8 Rue des Ébénistes', 'Bordeaux', '33000', 'FR', true),

-- Clients
('Hotel Le Luxe', 'customer', 'achats@hotel-luxe.fr', '01.55.44.33.22', '25 Place Vendôme', 'Paris', '75001', 'FR', true),
('Restaurant Gastronomique', 'customer', 'direction@restaurant-gastro.fr', '04.91.23.45.67', '15 Cours Julien', 'Marseille', '13006', 'FR', true),
('Boutique Design Studio', 'customer', 'contact@boutique-design.com', '02.40.55.66.77', '7 Rue Crébillon', 'Nantes', '44000', 'FR', true)
ON CONFLICT (name) DO NOTHING;

-- Récupérer les IDs des organisations créées
WITH supplier_ids AS (
  SELECT id, name FROM organisations WHERE type = 'supplier'
),
customer_ids AS (
  SELECT id, name FROM organisations WHERE type = 'customer'
)

-- Insérer des produits de test
INSERT INTO products (
  sku, name, slug, price_ht, cost_price, tax_rate, status, condition,
  variant_attributes, dimensions, weight, primary_image_url,
  stock_quantity, min_stock_level, supplier_id, margin_percentage
) VALUES

-- Produits du fournisseur Mobilier Premium
(
  'VER-MOB-CAN-001',
  'Canapé 3 places Oslo Gris',
  'canape-3-places-oslo-gris',
  1299.00, 899.00, 0.20, 'in_stock', 'new',
  '{"couleur": "Gris anthracite", "matiere": "Tissu premium", "style": "Scandinave"}',
  '{"length": 220, "width": 90, "height": 85, "unit": "cm"}',
  45.5,
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop',
  15, 3,
  (SELECT id FROM supplier_ids WHERE name = 'Mobilier Premium SARL'),
  30.5
),

(
  'VER-MOB-TAB-002',
  'Table à manger rectangulaire chêne',
  'table-manger-rectangulaire-chene',
  899.00, 620.00, 0.20, 'in_stock', 'new',
  '{"couleur": "Chêne naturel", "matiere": "Bois massif", "style": "Moderne"}',
  '{"length": 180, "width": 90, "height": 75, "unit": "cm"}',
  35.0,
  'https://images.unsplash.com/photo-1549497538-303791108f95?w=800&h=600&fit=crop',
  8, 2,
  (SELECT id FROM supplier_ids WHERE name = 'Mobilier Premium SARL'),
  31.0
),

-- Produits du fournisseur Design Factory
(
  'VER-DES-CHA-003',
  'Chaise design métal et cuir noir',
  'chaise-design-metal-cuir-noir',
  199.00, 125.00, 0.20, 'in_stock', 'new',
  '{"couleur": "Noir", "matiere": "Cuir véritable et métal", "style": "Industriel"}',
  '{"length": 45, "width": 52, "height": 82, "unit": "cm"}',
  6.5,
  'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800&h=600&fit=crop',
  25, 5,
  (SELECT id FROM supplier_ids WHERE name = 'Design Factory'),
  37.2
),

(
  'VER-DES-LAM-004',
  'Lampadaire Arc moderne doré',
  'lampadaire-arc-moderne-dore',
  349.00, 220.00, 0.20, 'in_stock', 'new',
  '{"couleur": "Doré brossé", "matiere": "Métal et marbre", "style": "Contemporain"}',
  '{"length": 40, "width": 30, "height": 180, "unit": "cm"}',
  12.0,
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop',
  12, 3,
  (SELECT id FROM supplier_ids WHERE name = 'Design Factory'),
  36.8
),

-- Produits de l'Artisan du Bois
(
  'VER-ART-COM-005',
  'Commode 3 tiroirs style vintage',
  'commode-3-tiroirs-style-vintage',
  649.00, 425.00, 0.20, 'in_stock', 'new',
  '{"couleur": "Bois vieilli", "matiere": "Pin massif", "style": "Vintage"}',
  '{"length": 120, "width": 45, "height": 80, "unit": "cm"}',
  28.0,
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop',
  6, 2,
  (SELECT id FROM supplier_ids WHERE name = 'Artisan du Bois'),
  34.5
),

(
  'VER-ART-ETG-006',
  'Étagère murale chêne massif',
  'etagere-murale-chene-massif',
  189.00, 115.00, 0.20, 'in_stock', 'new',
  '{"couleur": "Chêne clair", "matiere": "Chêne massif", "style": "Minimaliste"}',
  '{"length": 80, "width": 25, "height": 15, "unit": "cm"}',
  4.5,
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop',
  20, 4,
  (SELECT id FROM supplier_ids WHERE name = 'Artisan du Bois'),
  39.3
),

-- Produits avec stock faible pour tester les alertes
(
  'VER-MOB-TAB-007',
  'Table basse ronde marbre blanc',
  'table-basse-ronde-marbre-blanc',
  599.00, 390.00, 0.20, 'in_stock', 'new',
  '{"couleur": "Blanc Carrare", "matiere": "Marbre et acier", "style": "Moderne"}',
  '{"length": 80, "width": 80, "height": 42, "unit": "cm"}',
  25.0,
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop',
  2, 5, -- Stock faible : 2 unités seulement
  (SELECT id FROM supplier_ids WHERE name = 'Mobilier Premium SARL'),
  34.8
),

(
  'VER-DES-MIR-008',
  'Miroir rond métal doré 60cm',
  'miroir-rond-metal-dore-60cm',
  159.00, 95.00, 0.20, 'in_stock', 'new',
  '{"couleur": "Doré", "matiere": "Métal et verre", "style": "Contemporain"}',
  '{"length": 60, "width": 5, "height": 60, "unit": "cm"}',
  3.2,
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop',
  1, 3, -- Stock très faible : 1 unité seulement
  (SELECT id FROM supplier_ids WHERE name = 'Design Factory'),
  40.3
);

-- Message de confirmation
SELECT 'Données de test insérées avec succès!' as message;
SELECT
  COUNT(*) FILTER (WHERE type = 'supplier') as fournisseurs_crees,
  COUNT(*) FILTER (WHERE type = 'customer') as clients_crees
FROM organisations
WHERE type IN ('supplier', 'customer');

SELECT COUNT(*) as produits_crees FROM products;