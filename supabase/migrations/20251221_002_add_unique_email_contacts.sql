-- ============================================
-- FIX: Add UNIQUE constraint on contacts.email
-- ============================================
-- Problème: Le trigger handle_linkme_user_contact_sync() utilise
-- ON CONFLICT (email) mais il n'y a pas de contrainte UNIQUE sur email.
-- Solution: Ajouter la contrainte UNIQUE.
--
-- Date: 2025-12-21
-- Erreur corrigée: "there is no unique or exclusion constraint matching the ON CONFLICT specification"

-- Supprimer l'index simple s'il existe (on va le remplacer par une contrainte UNIQUE)
DROP INDEX IF EXISTS idx_contacts_email;

-- Ajouter la contrainte UNIQUE sur email
-- Note: Cela créera automatiquement un index unique
ALTER TABLE public.contacts
ADD CONSTRAINT contacts_email_unique UNIQUE (email);

-- Vérification
DO $$
DECLARE
  v_constraint_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.contacts'::regclass
    AND conname = 'contacts_email_unique'
  ) INTO v_constraint_exists;

  IF NOT v_constraint_exists THEN
    RAISE EXCEPTION 'Contrainte contacts_email_unique non créée';
  END IF;

  RAISE NOTICE '✅ Contrainte UNIQUE contacts_email_unique créée avec succès';
END $$;
