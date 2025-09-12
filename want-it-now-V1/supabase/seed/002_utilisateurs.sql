-- Seed data for utilisateurs table
-- Description: Sample users with different roles for development and testing

-- Get organisation IDs from previously seeded data
WITH org_ids AS (
  SELECT 
    nom,
    id,
    pays
  FROM organisations
  WHERE pays IN ('FR', 'ES', 'DE', 'IT')
)

-- Insert sample users with specific UUIDs (for testing purposes)
-- Note: In production, these would be created through Supabase Auth
INSERT INTO utilisateurs (id, nom, prenom, email, telephone, role, organisation_id) VALUES

-- Super Administrators (global access)
(
    '00000000-0000-0000-0000-000000000001',
    'Admin',
    'Super',
    'superadmin@wantitnow.com',
    '+33 1 42 00 00 01',
    'super_admin',
    NULL
),
(
    '00000000-0000-0000-0000-000000000002', 
    'Smith',
    'John',
    'john.smith@wantitnow.com',
    '+44 20 7946 0958',
    'super_admin',
    NULL
),

-- Administrators (per organisation)
(
    '00000000-0000-0000-0000-000000000010',
    'Dubois',
    'Marie',
    'marie.dubois@wantitnow.fr',
    '+33 1 42 00 00 10',
    'admin',
    (SELECT id FROM org_ids WHERE pays = 'FR' LIMIT 1)
),
(
    '00000000-0000-0000-0000-000000000011',
    'García',
    'Carlos',
    'carlos.garcia@wantitnow.es',
    '+34 91 000 00 10',
    'admin',
    (SELECT id FROM org_ids WHERE pays = 'ES' LIMIT 1)
),
(
    '00000000-0000-0000-0000-000000000012',
    'Schmidt',
    'Anna',
    'anna.schmidt@wantitnow.de',
    '+49 30 000 000 10',
    'admin',
    (SELECT id FROM org_ids WHERE pays = 'DE' LIMIT 1)
),
(
    '00000000-0000-0000-0000-000000000013',
    'Rossi',
    'Marco',
    'marco.rossi@wantitnow.it',
    '+39 06 000 000 10',
    'admin',
    (SELECT id FROM org_ids WHERE pays = 'IT' LIMIT 1)
),

-- Propriétaires (property owners)
(
    '00000000-0000-0000-0000-000000000020',
    'Martin',
    'Pierre',
    'pierre.martin@example.fr',
    '+33 6 12 34 56 78',
    'proprietaire',
    (SELECT id FROM org_ids WHERE pays = 'FR' LIMIT 1)
),
(
    '00000000-0000-0000-0000-000000000021',
    'López',
    'Isabel',
    'isabel.lopez@example.es',
    '+34 6 12 34 56 78',
    'proprietaire',
    (SELECT id FROM org_ids WHERE pays = 'ES' LIMIT 1)
),
(
    '00000000-0000-0000-0000-000000000022',
    'Müller',
    'Hans',
    'hans.mueller@example.de',
    '+49 176 12345678',
    'proprietaire',
    (SELECT id FROM org_ids WHERE pays = 'DE' LIMIT 1)
),
(
    '00000000-0000-0000-0000-000000000023',
    'Bianchi',
    'Giulia',
    'giulia.bianchi@example.it',
    '+39 320 123 4567',
    'proprietaire',
    (SELECT id FROM org_ids WHERE pays = 'IT' LIMIT 1)
),

-- Locataires (tenants)
(
    '00000000-0000-0000-0000-000000000030',
    'Durand',
    'Sophie',
    'sophie.durand@example.com',
    '+33 6 98 76 54 32',
    'locataire',
    (SELECT id FROM org_ids WHERE pays = 'FR' LIMIT 1)
),
(
    '00000000-0000-0000-0000-000000000031',
    'González',
    'Miguel',
    'miguel.gonzalez@example.com',
    '+34 6 98 76 54 32',
    'locataire',
    (SELECT id FROM org_ids WHERE pays = 'ES' LIMIT 1)
),
(
    '00000000-0000-0000-0000-000000000032',
    'Weber',
    'Lisa',
    'lisa.weber@example.com',
    '+49 176 98765432',
    'locataire',
    (SELECT id FROM org_ids WHERE pays = 'DE' LIMIT 1)
),
(
    '00000000-0000-0000-0000-000000000033',
    'Ferrari',
    'Luca',
    'luca.ferrari@example.com',
    '+39 320 987 6543',
    'locataire',
    (SELECT id FROM org_ids WHERE pays = 'IT' LIMIT 1)
),

-- Prestataires (service providers) - for V2
(
    '00000000-0000-0000-0000-000000000040',
    'Maintenance',
    'Service',
    'maintenance@serviceplus.fr',
    '+33 6 11 22 33 44',
    'prestataire',
    (SELECT id FROM org_ids WHERE pays = 'FR' LIMIT 1)
),
(
    '00000000-0000-0000-0000-000000000041',
    'Limpieza',
    'Express',
    'limpieza@express.es',
    '+34 6 11 22 33 44',
    'prestataire',
    (SELECT id FROM org_ids WHERE pays = 'ES' LIMIT 1)
)

ON CONFLICT (id) DO NOTHING;

-- Insert additional test users for more comprehensive testing
INSERT INTO utilisateurs (id, nom, prenom, email, telephone, role, organisation_id) VALUES

-- Additional admins for testing multi-org scenarios
(
    '00000000-0000-0000-0000-000000000050',
    'Lefebvre',
    'Julien',
    'julien.lefebvre@wantitnow.fr',
    '+33 1 42 00 00 50',
    'admin',
    (SELECT id FROM org_ids WHERE pays = 'FR' LIMIT 1)
),

-- Users without names (testing nullable fields)
(
    '00000000-0000-0000-0000-000000000060',
    NULL,
    NULL,
    'test.user@example.com',
    NULL,
    'locataire',
    (SELECT id FROM org_ids WHERE pays = 'FR' LIMIT 1)
),

-- Users with minimal information
(
    '00000000-0000-0000-0000-000000000061',
    'Test',
    '',
    'minimal@example.com',
    '',
    'proprietaire',
    (SELECT id FROM org_ids WHERE pays = 'DE' LIMIT 1)
)

ON CONFLICT (id) DO NOTHING;

-- Note: In production, these users would be created through:
-- 1. Supabase Auth for authentication
-- 2. Trigger or application code to create corresponding utilisateurs record
-- 3. Proper role assignment based on business logic

-- For development/testing purposes, you may need to also create these users
-- in Supabase Auth with the same UUIDs and email addresses