-- Supprimer l'ancienne table linkme_contact_requests
-- Remplacée par l'architecture extensible form_submissions
-- Note: Très peu de données, pas besoin de migration des données existantes

DROP TABLE IF EXISTS linkme_contact_requests CASCADE;

-- Note: Si des données devaient être préservées, utiliser cette requête avant le DROP:
-- INSERT INTO form_submissions (form_type, source, source_reference_id, source_reference_name, first_name, last_name, email, phone, company, role, message, primary_category, priority, status, created_at)
-- SELECT
--   'selection_inquiry',
--   'linkme',
--   selection_id,
--   NULL, -- source_reference_name sera NULL pour anciennes données
--   first_name,
--   last_name,
--   email,
--   phone,
--   company,
--   role,
--   message,
--   'order', -- default category
--   'medium', -- default priority
--   COALESCE(status, 'new'),
--   created_at
-- FROM linkme_contact_requests;
