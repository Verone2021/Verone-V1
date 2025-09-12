-- Insertion directe des contrats de test
-- Utilise seulement les colonnes de base existantes

-- Propriétés de test
INSERT INTO proprietes (id, organisation_id, nom, type, adresse, code_postal, ville, pays, a_unites, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440001', '49deadc4-2b67-45d0-94ba-3971dbac31c5', 'Villa Les Palmiers Nice', 'maison', '15 Avenue des Palmiers', '06000', 'Nice', 'FR', false, true),
('550e8400-e29b-41d4-a716-446655440002', '49deadc4-2b67-45d0-94ba-3971dbac31c5', 'Studio Trocadéro Paris', 'appartement', '42 Avenue Kléber', '75016', 'Paris', 'FR', false, true)
ON CONFLICT (id) DO NOTHING;

-- Contrats de test - colonnes minimales
INSERT INTO contrats (id, organisation_id, propriete_id, unite_id, type_contrat, date_emission, date_debut, date_fin) VALUES
('550e8400-e29b-41d4-a716-446655440020', '49deadc4-2b67-45d0-94ba-3971dbac31c5', '550e8400-e29b-41d4-a716-446655440001', null, 'fixe', '2025-01-15', '2025-03-01', '2026-02-28'),
('550e8400-e29b-41d4-a716-446655440021', '49deadc4-2b67-45d0-94ba-3971dbac31c5', '550e8400-e29b-41d4-a716-446655440002', null, 'variable', '2025-01-10', '2025-02-01', '2026-01-31')
ON CONFLICT (id) DO NOTHING;