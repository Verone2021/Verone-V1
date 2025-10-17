/**
 * 🗑️ Script de nettoyage complet - Produits et Groupes de Variantes
 *
 * ATTENTION : Ce script supprime TOUTES les données suivantes :
 * - Tous les produits de la table products
 * - Tous les groupes de variantes de la table variant_groups
 * - Toutes les images produits associées
 *
 * Utilisation : Reset complet pour recommencer à zéro
 */

-- 1. Supprimer toutes les images produits
DELETE FROM product_images;

-- 2. Supprimer tous les produits (les triggers vont mettre à jour variant_groups.product_count automatiquement)
DELETE FROM products;

-- 3. Supprimer tous les groupes de variantes
DELETE FROM variant_groups;

-- 4. Réinitialiser les séquences (optionnel, pour repartir des IDs propres)
-- Note: Supabase utilise UUID, donc pas de séquences à réinitialiser

-- 5. Vérification
SELECT
  (SELECT COUNT(*) FROM products) as products_count,
  (SELECT COUNT(*) FROM variant_groups) as variant_groups_count,
  (SELECT COUNT(*) FROM product_images) as product_images_count;

-- Résultat attendu : 0, 0, 0
