-- Script de validation des fonctions RPC appliquées
-- Exécuter dans Supabase SQL Editor après application du create-rpc-functions-direct.sql

-- Test 1: Vérifier que les fonctions existent
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
    'can_delete_proprietaire',
    'get_proprietaire_deletion_impact', 
    'delete_proprietaire_with_validation'
)
ORDER BY routine_name;

-- Test 2: Lister tous les propriétaires pour obtenir un ID test
SELECT 
    id,
    CASE 
        WHEN type = 'physique' THEN CONCAT(prenom, ' ', nom)
        ELSE nom
    END as nom_complet,
    type,
    is_active
FROM proprietaires 
WHERE is_active = true
LIMIT 5;

-- Test 3: Analyser l'impact de suppression d'un propriétaire (remplacer l'ID)
-- SELECT get_proprietaire_deletion_impact('REMPLACER-PAR-UN-ID-REEL');

-- Test 4: Tester validation de suppression (remplacer l'ID)
-- SELECT can_delete_proprietaire('REMPLACER-PAR-UN-ID-REEL');