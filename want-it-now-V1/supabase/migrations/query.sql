SELECT id, nom, prenom, type, email, is_active FROM proprietaires WHERE nom ILIKE '%Romeo%' OR nom ILIKE '%Jardim%' OR prenom ILIKE '%Romeo%' ORDER BY created_at;
