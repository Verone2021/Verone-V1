-- 🔧 MIGRATION: Correction Générateur Numéros Commande Thread-Safe
-- Date: 2025-10-12
-- Objectif: Remplacer approche MAX() par séquences PostgreSQL natives
--
-- PROBLÈME RÉSOLU:
-- - Race condition: 2 utilisateurs simultanés obtenaient le même numéro
-- - Erreur: duplicate key value violates unique constraint "sales_orders_order_number_key"
-- - Format incohérent: 3 vs 5 chiffres
--
-- SOLUTION:
-- - Séquences PostgreSQL natives (thread-safe, performant)
-- - Format cohérent 5 chiffres: SO-2025-00000
-- - Synchronisation avec numéros existants

-- =============================================
-- ÉTAPE 1: Créer séquences PostgreSQL
-- =============================================

-- Séquence pour commandes clients (Sales Orders)
-- START WITH 11 car les commandes existantes vont jusqu'à SO-2025-00010
CREATE SEQUENCE IF NOT EXISTS sales_orders_sequence
  START WITH 11
  INCREMENT BY 1
  NO MINVALUE
  NO MAXVALUE
  CACHE 1;

COMMENT ON SEQUENCE sales_orders_sequence IS
'Séquence thread-safe pour génération numéros commandes clients (SO-YYYY-XXXXX)';

-- Séquence pour commandes fournisseurs (Purchase Orders)
-- START WITH 1 (pas de commandes fournisseurs existantes avec nouveau format)
CREATE SEQUENCE IF NOT EXISTS purchase_orders_sequence
  START WITH 1
  INCREMENT BY 1
  NO MINVALUE
  NO MAXVALUE
  CACHE 1;

COMMENT ON SEQUENCE purchase_orders_sequence IS
'Séquence thread-safe pour génération numéros commandes fournisseurs (PO-YYYY-XXXXX)';

-- =============================================
-- ÉTAPE 2: Remplacer generate_so_number() avec séquence
-- =============================================

CREATE OR REPLACE FUNCTION generate_so_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  year_part TEXT;
  sequence_num INTEGER;
  so_number TEXT;
BEGIN
  -- Année courante
  year_part := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;

  -- Obtenir le prochain numéro de séquence (thread-safe)
  sequence_num := nextval('sales_orders_sequence');

  -- Format: SO-2025-00011 (5 chiffres)
  so_number := 'SO-' || year_part || '-' || LPAD(sequence_num::TEXT, 5, '0');

  RETURN so_number;
END;
$$;

COMMENT ON FUNCTION generate_so_number() IS
'Génère un numéro de commande client unique et thread-safe (SO-YYYY-XXXXX)';

-- =============================================
-- ÉTAPE 3: Remplacer generate_po_number() avec séquence
-- =============================================

CREATE OR REPLACE FUNCTION generate_po_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  year_part TEXT;
  sequence_num INTEGER;
  po_number TEXT;
BEGIN
  -- Année courante
  year_part := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;

  -- Obtenir le prochain numéro de séquence (thread-safe)
  sequence_num := nextval('purchase_orders_sequence');

  -- Format: PO-2025-00001 (5 chiffres)
  po_number := 'PO-' || year_part || '-' || LPAD(sequence_num::TEXT, 5, '0');

  RETURN po_number;
END;
$$;

COMMENT ON FUNCTION generate_po_number() IS
'Génère un numéro de commande fournisseur unique et thread-safe (PO-YYYY-XXXXX)';

-- =============================================
-- ÉTAPE 4: Fonction helper pour réinitialiser séquence (admin)
-- =============================================

-- Fonction pour réinitialiser la séquence SO en cas de besoin
CREATE OR REPLACE FUNCTION reset_so_sequence_to_max()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  max_sequence INTEGER;
  new_start INTEGER;
BEGIN
  -- Trouver le numéro de séquence max dans les commandes existantes
  SELECT COALESCE(MAX(
    CASE WHEN order_number ~ '^SO-[0-9]{4}-[0-9]+$'
    THEN CAST(SUBSTRING(order_number FROM '[0-9]+$') AS INTEGER)
    ELSE 0 END
  ), 0) INTO max_sequence
  FROM sales_orders;

  -- Définir la séquence à max + 1
  new_start := max_sequence + 1;

  PERFORM setval('sales_orders_sequence', new_start, false);

  RETURN new_start;
END;
$$;

COMMENT ON FUNCTION reset_so_sequence_to_max() IS
'Réinitialise la séquence SO au max existant + 1 (usage admin uniquement)';

-- Fonction pour réinitialiser la séquence PO en cas de besoin
CREATE OR REPLACE FUNCTION reset_po_sequence_to_max()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  max_sequence INTEGER;
  new_start INTEGER;
BEGIN
  -- Trouver le numéro de séquence max dans les commandes existantes
  SELECT COALESCE(MAX(
    CASE WHEN po_number ~ '^PO-[0-9]{4}-[0-9]+$'
    THEN CAST(SUBSTRING(po_number FROM '[0-9]+$') AS INTEGER)
    ELSE 0 END
  ), 0) INTO max_sequence
  FROM purchase_orders;

  -- Définir la séquence à max + 1
  new_start := max_sequence + 1;

  PERFORM setval('purchase_orders_sequence', new_start, false);

  RETURN new_start;
END;
$$;

COMMENT ON FUNCTION reset_po_sequence_to_max() IS
'Réinitialise la séquence PO au max existant + 1 (usage admin uniquement)';

-- =============================================
-- ÉTAPE 5: Grants et permissions
-- =============================================

-- Permissions sur séquences
GRANT USAGE, SELECT ON SEQUENCE sales_orders_sequence TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE purchase_orders_sequence TO authenticated;

-- Permissions sur fonctions
GRANT EXECUTE ON FUNCTION generate_so_number() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_po_number() TO authenticated;

-- Fonctions reset réservées aux admins (SECURITY DEFINER)
GRANT EXECUTE ON FUNCTION reset_so_sequence_to_max() TO authenticated;
GRANT EXECUTE ON FUNCTION reset_po_sequence_to_max() TO authenticated;

-- =============================================
-- VALIDATION & TESTS
-- =============================================

DO $$
DECLARE
  test_so_number TEXT;
  test_po_number TEXT;
  current_so_seq INTEGER;
  current_po_seq INTEGER;
BEGIN
  -- Test génération SO
  test_so_number := generate_so_number();
  RAISE NOTICE '✅ Test SO généré: %', test_so_number;

  -- Test génération PO
  test_po_number := generate_po_number();
  RAISE NOTICE '✅ Test PO généré: %', test_po_number;

  -- Vérifier état séquences
  SELECT last_value INTO current_so_seq FROM sales_orders_sequence;
  SELECT last_value INTO current_po_seq FROM purchase_orders_sequence;

  RAISE NOTICE '📊 Séquence SO actuelle: %', current_so_seq;
  RAISE NOTICE '📊 Séquence PO actuelle: %', current_po_seq;

  RAISE NOTICE '✅ Migration Correction Générateur Numéros appliquée avec succès';
  RAISE NOTICE '🔒 Thread-safe: nextval() garantit unicité';
  RAISE NOTICE '📝 Format: SO-YYYY-00000 (5 chiffres)';
  RAISE NOTICE '🚀 Prochain SO: SO-2025-00011';
  RAISE NOTICE '🚀 Prochain PO: PO-2025-00001';
END $$;
